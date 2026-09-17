-- =====================================================================
-- تحديث 008 — تعليق العضوية + مواعيد فعاليات مرنة
--
-- 1) تعليق العضوية: الإدارة تقدر توقف عضوية عضو مؤقتاً بدون حذفه،
--    فما يقدر يسجّل في الفعاليات، وتظهر حالته «معلّقة» في صفحة حسابي.
-- 2) الفعاليات: صار الموعد اختيارياً (فعالية بدون تاريخ = «يُعلن لاحقاً»)،
--    ومع خيار «اليوم فقط بدون ساعة» للفعاليات اللي ساعتها لسه ما تحددت.
--
-- شغّل هذا الملف كاملاً في SQL Editor.
-- =====================================================================

-- 1) تعليق العضوية
alter table public.club_applications add column if not exists suspended_at    timestamptz;
alter table public.club_applications add column if not exists suspend_reason  text;

create or replace function public.club_membership_state(p_app public.club_applications)
returns text
language sql
stable
as $$
  select case
    when p_app.status <> 'تم القبول' then 'not_member'
    when p_app.suspended_at is not null then 'suspended'
    when p_app.valid_until is null or p_app.valid_until < now() then 'expired'
    else coalesce(p_app.membership_type, 'temporary')
  end;
$$;


-- 2) مواعيد الفعاليات: التاريخ اختياري + خيار «بدون ساعة»
alter table public.club_events alter column starts_at drop not null;
alter table public.club_events add column if not exists time_tbd boolean not null default false;

create or replace function public.list_public_events()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x."startsAt" nulls last), '[]'::jsonb)
  from (
    select e.id, e.title, e.event_type as "eventType", e.description, e.location,
           e.starts_at as "startsAt", e.ends_at as "endsAt", e.registration_deadline as "registrationDeadline",
           e.time_tbd as "timeTbd",
           e.capacity, e.committee, e.committee_only as "committeeOnly", e.status,
           (select count(*) from public.club_event_registrations r where r.event_id = e.id and r.status = 'registered') as "registeredCount",
           (select count(*) from public.club_event_registrations r where r.event_id = e.id and r.status = 'waitlisted') as "waitlistCount"
    from public.club_events e
    where e.status <> 'draft'
      -- الفعالية بلا تاريخ تبقى ظاهرة حتى تتحدد أو تُلغى
      and coalesce(e.ends_at, e.starts_at, now()) > now() - interval '60 days'
  ) x;
$$;

create or replace function public.register_for_event(p_student_id text, p_code text, p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member    public.club_applications := public.club_member_by_credentials(p_student_id, p_code);
  v_event     public.club_events;
  v_existing  public.club_event_registrations;
  v_count     int;
  v_status    text;
  v_deadline  timestamptz;
  v_committee text := coalesce(v_member.data->>'assignedCommittee', v_member.data->>'targetCommittee');
begin
  if v_member.id is null then
    return jsonb_build_object('error', 'الرقم الجامعي أو رمز العضو غير صحيح');
  end if;
  if v_member.suspended_at is not null then
    raise exception 'عضويتك معلّقة حالياً. راجع إدارة النادي.';
  end if;
  if v_member.valid_until is null or v_member.valid_until < now() then
    raise exception 'عضويتك منتهية. جدّد العضوية الفصلية لتتمكن من التسجيل.';
  end if;

  select * into v_event from public.club_events where id = p_event_id for update;
  if not found or v_event.status = 'draft' then raise exception 'الفعالية غير موجودة'; end if;
  if v_event.status <> 'published' then raise exception 'التسجيل مغلق لهذه الفعالية'; end if;

  -- بدون تاريخ = التسجيل مفتوح لحين تحديد الموعد
  v_deadline := coalesce(v_event.registration_deadline, v_event.starts_at);
  if v_deadline is not null and v_deadline < now() then
    raise exception 'انتهى موعد التسجيل';
  end if;

  if v_event.committee_only and coalesce(v_committee, '') <> coalesce(v_event.committee, '') then
    raise exception 'هذه الفعالية مخصصة لأعضاء %', v_event.committee;
  end if;

  select * into v_existing from public.club_event_registrations
  where event_id = p_event_id and application_id = v_member.id;
  if found and v_existing.status <> 'cancelled' then
    return jsonb_build_object('status', v_existing.status, 'id', v_existing.id, 'alreadyRegistered', true);
  end if;

  select count(*) into v_count from public.club_event_registrations
  where event_id = p_event_id and status = 'registered';
  v_status := case when v_event.capacity is null or v_count < v_event.capacity then 'registered' else 'waitlisted' end;

  if found then
    update public.club_event_registrations
    set status = v_status, created_at = now()
    where id = v_existing.id
    returning * into v_existing;
  else
    insert into public.club_event_registrations (event_id, application_id, status)
    values (p_event_id, v_member.id, v_status)
    returning * into v_existing;
  end if;

  return jsonb_build_object('status', v_existing.status, 'id', v_existing.id);
end;
$$;

grant execute on function public.list_public_events()                     to anon, authenticated;
grant execute on function public.register_for_event(text, text, uuid)     to anon, authenticated;

notify pgrst, 'reload schema';
