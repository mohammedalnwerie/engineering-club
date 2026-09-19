-- =====================================================================
-- تحديث 015: تطوير نظام الفعاليات والهاكاثونات المتقدم
-- 1. إضافة صورة الغلاف ونطاق الفعالية والجوائز ومحددات الهاكاثون إلى club_events
-- 2. إضافة بيانات الفريق والمشروع team_data إلى club_event_registrations
-- 3. تحديث دالة list_public_events لإرجاع الخصائص الجديدة
-- 4. تحديث دالة register_for_event لدعم تخزين بيانات الفرق والمشاريع
-- =====================================================================

-- 1) حقول الفعاليات والهاكاثونات الإضافية
alter table public.club_events add column if not exists cover_image text;
alter table public.club_events add column if not exists scope text default 'club';
alter table public.club_events add column if not exists prizes text;
alter table public.club_events add column if not exists min_team_size int default 2;
alter table public.club_events add column if not exists max_team_size int default 5;
alter table public.club_events add column if not exists tracks jsonb default '[]'::jsonb;
alter table public.club_events add column if not exists allow_solo boolean default true;

-- 2) حقل بيانات الفريق في التسجيل
alter table public.club_event_registrations add column if not exists team_data jsonb;

-- 3) تحديث دالة استعراض الفعاليات العامة
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
           e.cover_image as "coverImage",
           coalesce(e.scope, 'club') as "scope",
           e.prizes,
           coalesce(e.min_team_size, 2) as "minTeamSize",
           coalesce(e.max_team_size, 5) as "maxTeamSize",
           coalesce(e.tracks, '[]'::jsonb) as "tracks",
           coalesce(e.allow_solo, true) as "allowSolo",
           (select count(*) from public.club_event_registrations r where r.event_id = e.id and r.status = 'registered') as "registeredCount",
           (select count(*) from public.club_event_registrations r where r.event_id = e.id and r.status = 'waitlisted') as "waitlistCount"
    from public.club_events e
    where e.status <> 'draft'
      and coalesce(e.ends_at, e.starts_at, now()) > now() - interval '60 days'
  ) x;
$$;

-- 4) تحديث دالة التسجيل لدعم بيانات الفرق
create or replace function public.register_for_event(
  p_student_id text,
  p_code text,
  p_event_id uuid,
  p_team_data jsonb default null
)
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
  v_role      text := coalesce(v_member.data->>'organizationalRole', '');
  v_is_exec   boolean := (v_role ilike '%رئيس%' or v_role ilike '%نائب%' or v_role ilike '%أمين صندوق%' or v_role ilike '%إدارية%');
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

  v_deadline := coalesce(v_event.registration_deadline, v_event.starts_at);
  if v_deadline is not null and v_deadline < now() then
    raise exception 'انتهى موعد التسجيل';
  end if;

  if v_event.committee_only and not v_is_exec and coalesce(v_committee, '') <> coalesce(v_event.committee, '') then
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
    set status = v_status, updated_at = now(), checked_in_at = null, team_data = p_team_data
    where id = v_existing.id
    returning * into v_existing;
  else
    insert into public.club_event_registrations (event_id, application_id, status, team_data)
    values (p_event_id, v_member.id, v_status, p_team_data)
    returning * into v_existing;
  end if;

  return jsonb_build_object('status', v_existing.status, 'id', v_existing.id, 'alreadyRegistered', false);
end;
$$;

-- Overload for backwards compatibility (3 args)
create or replace function public.register_for_event(
  p_student_id text,
  p_code text,
  p_event_id uuid
)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select public.register_for_event(p_student_id, p_code, p_event_id, null::jsonb);
$$;

revoke all on function public.list_public_events() from public;
revoke all on function public.register_for_event(text, text, uuid, jsonb) from public;
revoke all on function public.register_for_event(text, text, uuid) from public;

grant execute on function public.list_public_events() to anon, authenticated;
grant execute on function public.register_for_event(text, text, uuid, jsonb) to anon, authenticated;
grant execute on function public.register_for_event(text, text, uuid) to anon, authenticated;

notify pgrst, 'reload schema';
