-- =====================================================================
-- تحديث 019 — تعديل بيانات التواصل للعضو ذاتياً (البريد ورقم الجوال)
--
-- يسمح للعضو المقبول بتحديث بريده الإلكتروني ورقم جواله بنفسه من بوابة «حسابي»،
-- بشرط التحقق من جلسة العضو وكلمة مروره الحالية لحماية الحساب.
--
-- شغّل هذا الملف كاملاً في SQL Editor.
-- =====================================================================

create or replace function public.member_update_contact(
  p_student_id text,
  p_secret text,
  p_new_email text,
  p_new_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_member public.club_applications := public.club_member_by_credentials(p_student_id, p_secret);
  v_email  text := lower(btrim(coalesce(p_new_email, '')));
  v_phone  text := btrim(coalesce(p_new_phone, ''));
  v_data   jsonb;
begin
  if v_member is null then
    return jsonb_build_object('error', 'بيانات الدخول أو كلمة المرور الحالية غير صحيحة');
  end if;

  if v_email = '' or v_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    return jsonb_build_object('error', 'يرجى إدخال بريد إلكتروني صحيح');
  end if;

  if length(v_phone) < 7 or length(v_phone) > 20 then
    return jsonb_build_object('error', 'يرجى إدخال رقم هاتف صحيح');
  end if;

  v_data := coalesce(v_member.data, '{}'::jsonb);
  v_data := jsonb_set(v_data, '{email}', to_jsonb(v_email));
  v_data := jsonb_set(v_data, '{phone}', to_jsonb(v_phone));

  update public.club_applications
  set email = v_email,
      phone = v_phone,
      data  = v_data,
      updated_at = now()
  where id = v_member.id;

  return jsonb_build_object('ok', true, 'email', v_email, 'phone', v_phone);
end;
$$;

revoke all on function public.member_update_contact(text, text, text, text) from public;
grant execute on function public.member_update_contact(text, text, text, text) to anon, authenticated;

-- تحديث دالة تسجيل الدخول لإرجاع رقم الجوال في ملف العضو
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
    'phone', coalesce(v_member.phone, v_member.data->>'phone'),
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

notify pgrst, 'reload schema';

