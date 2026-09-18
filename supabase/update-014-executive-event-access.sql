-- =====================================================================
-- تحديث 014: إتاحة تسجيل أعضاء الهيئة الإدارية والرئاسة في الفعاليات
-- السبب: في الفعاليات المخصصة لأعضاء لجنة معينة (committee_only)،
-- يجب ألا يتم حظر رئيس النادي ونوابه وأعضاء الهيئة الإدارية من الحضور
-- والتسجيل لأنهم يشرفون تنظيمياً على كافة اللجان والفعاليات.
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

  -- بدون تاريخ = التسجيل مفتوح لحين تحديد الموعد
  v_deadline := coalesce(v_event.registration_deadline, v_event.starts_at);
  if v_deadline is not null and v_deadline < now() then
    raise exception 'انتهى موعد التسجيل';
  end if;

  -- استثناء: القيادات والهيئة الإدارية لا يُحظرون من حضور فعاليات اللجان
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
