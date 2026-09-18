-- =====================================================================
-- تحديث 013: إصلاح دالة تسجيل الفعاليات
-- السبب: كان متغير FOUND في PL/pgSQL يُعاد ضبطه إلى true دائماً بواسطة
-- استعلام (SELECT count(*) INTO v_count)، مما كان يجعل الكود يحاول
-- عمل UPDATE لسجل غير موجود (id = null) بدلاً من عمل INSERT، فترجع
-- الدالة status = null ويظهر للمستخدم بشكل خاطئ أن المقاعد اكتملت.
-- =====================================================================

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
  v_has_prev  boolean := false;
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
    raise exception 'عضويتك منتهية. جدّد العضوية لتتمكن من التسجيل.';
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
  v_has_prev := found;

  if v_has_prev and v_existing.status <> 'cancelled' then
    return jsonb_build_object('status', v_existing.status, 'id', v_existing.id, 'alreadyRegistered', true);
  end if;

  select count(*) into v_count from public.club_event_registrations
  where event_id = p_event_id and status = 'registered';
  v_status := case when v_event.capacity is null or v_count < v_event.capacity then 'registered' else 'waitlisted' end;

  if v_has_prev then
    update public.club_event_registrations
    set status = v_status, updated_at = now(), checked_in_at = null
    where id = v_existing.id
    returning * into v_existing;
  else
    insert into public.club_event_registrations (event_id, application_id, status)
    values (p_event_id, v_member.id, v_status)
    returning * into v_existing;
  end if;

  return jsonb_build_object('status', v_existing.status, 'id', v_existing.id, 'alreadyRegistered', false);
end;
$$;

revoke all on function public.register_for_event(text, text, uuid) from public;
grant execute on function public.register_for_event(text, text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
