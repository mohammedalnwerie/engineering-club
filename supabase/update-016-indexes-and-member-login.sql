-- =====================================================================
-- تحديث 016: تسريع استعلامات قاعدة البيانات وربط بيانات الفرق بحساب العضو
-- 1. إضافة فهارس (Indexes) على الجداول الحيوية لتسريع البحث والأداء
-- 2. تحديث دالة member_login لإرجاع بيانات الفريق teamData للتسجيلات
-- =====================================================================

-- 1) فهارس الأداء السحابي
create index if not exists idx_club_events_starts_at on public.club_events (starts_at);
create index if not exists idx_club_event_registrations_app_id on public.club_event_registrations (application_id);
create index if not exists idx_club_event_registrations_event_id on public.club_event_registrations (event_id);
create index if not exists idx_club_applications_student_id on public.club_applications (student_id);
create index if not exists idx_club_applications_status on public.club_applications (status);
create index if not exists idx_club_applications_valid_until on public.club_applications (valid_until);

-- 2) تحديث دالة دخول العضو لإرجاع teamData
create or replace function public.member_login(p_student_id text, p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.club_applications := public.club_member_by_credentials(p_student_id, p_code);
begin
  if v_member.id is null then
    return jsonb_build_object('error', 'الرقم الجامعي أو الرمز/كلمة المرور غير صحيح');
  end if;
  return jsonb_build_object(
    'id', v_member.id,
    'fullName', v_member.full_name,
    'studentId', v_member.student_id,
    'email', v_member.email,
    'major', v_member.data->>'major',
    'college', v_member.data->>'college',
    'academicYear', v_member.data->>'academicYear',
    'targetCommittee', v_member.data->>'targetCommittee',
    'assignedCommittee', v_member.data->>'assignedCommittee',
    'organizationalRole', v_member.data->>'organizationalRole',
    'photoUrl', v_member.data->>'photoUrl',
    'memberCode', v_member.member_code,
    'acceptedAt', v_member.accepted_at,
    'membershipType', v_member.membership_type,
    'validUntil', v_member.valid_until,
    'suspendedAt', v_member.suspended_at,
    'suspendReason', v_member.suspend_reason,
    'membershipState', public.club_membership_state(v_member),
    'passwordSet', v_member.password_hash is not null,
    'registrations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'eventId', r.event_id, 'status', r.status, 'checkedInAt', r.checked_in_at,
        'title', e.title, 'eventType', e.event_type, 'startsAt', e.starts_at, 'timeTbd', e.time_tbd,
        'location', e.location,
        'teamData', r.team_data
      ) order by e.starts_at nulls last)
      from public.club_event_registrations r
      join public.club_events e on e.id = r.event_id
      where r.application_id = v_member.id and r.status <> 'cancelled'
    ), '[]'::jsonb),
    'paymentRequest', (
      select jsonb_build_object('id', p.id, 'status', p.status, 'amount', p.amount, 'createdAt', p.created_at,
                                'adminNote', p.admin_note, 'semesterLabel', p.semester_label)
      from public.club_payment_requests p
      where p.application_id = v_member.id
      order by p.created_at desc
      limit 1
    )
  );
end;
$$;

revoke all on function public.member_login(text, text) from public;
grant execute on function public.member_login(text, text) to anon, authenticated;
