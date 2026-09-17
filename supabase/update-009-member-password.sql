-- =====================================================================
-- تحديث 009 — كلمة مرور لحساب العضو
--
-- رمز العضو مطبوع على البطاقة، فأي حد يشوف البطاقة يقدر يدخل بالحساب.
-- الحل: العضو يدخل أول مرة برمز البطاقة، ثم يعيّن كلمة مرور خاصة فيه.
-- بعد تعيينها يتوقف الرمز عن العمل للدخول، وتبقى البطاقة للتحقق فقط.
--
-- شغّل هذا الملف كاملاً في SQL Editor.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

alter table public.club_applications add column if not exists password_hash   text;
alter table public.club_applications add column if not exists password_set_at timestamptz;

-- المفتاح المشترك لكل دوال الأعضاء: كلمة المرور إن وُجدت، وإلا رمز البطاقة
create or replace function public.club_member_by_credentials(p_student_id text, p_secret text)
returns public.club_applications
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_sid    text := regexp_replace(public.club_latin_digits(p_student_id), '\s', '', 'g');
  v_secret text := btrim(coalesce(p_secret, ''));
  v_code   text := upper(regexp_replace(public.club_latin_digits(v_secret), '\s', '', 'g'));
  v_row    public.club_applications;
begin
  if (select count(*) from public.club_login_attempts
      where student_id = v_sid and attempted_at > now() - interval '15 minutes') >= 8 then
    raise exception 'محاولات كثيرة خاطئة. حاول مرة أخرى بعد 15 دقيقة.';
  end if;

  select * into v_row
  from public.club_applications
  where lower(student_id) = lower(v_sid)
    and status = 'تم القبول'
  limit 1;

  if not found then
    insert into public.club_login_attempts (student_id) values (v_sid);
    return null;
  end if;

  if v_row.password_hash is not null then
    -- بعد تعيين كلمة المرور، رمز البطاقة لا يصلح للدخول
    if v_row.password_hash <> crypt(v_secret, v_row.password_hash) then
      insert into public.club_login_attempts (student_id) values (v_sid);
      return null;
    end if;
  elsif replace(coalesce(v_row.member_code, ''), '-', '') <> replace(v_code, '-', '') then
    insert into public.club_login_attempts (student_id) values (v_sid);
    return null;
  end if;

  delete from public.club_login_attempts where student_id = v_sid;
  return v_row;
end;
$$;

revoke all on function public.club_member_by_credentials(text, text) from public, anon, authenticated;

-- تعيين كلمة المرور أو تغييرها (بالمفتاح الحالي: الرمز أول مرة، ثم كلمة المرور)
create or replace function public.member_set_password(p_student_id text, p_secret text, p_new_password text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_member public.club_applications := public.club_member_by_credentials(p_student_id, p_secret);
begin
  if v_member.id is null then
    return jsonb_build_object('error', 'الرقم الجامعي أو الرمز/كلمة المرور غير صحيح');
  end if;
  if length(coalesce(p_new_password, '')) < 8 then
    return jsonb_build_object('error', 'كلمة المرور 8 خانات على الأقل');
  end if;
  if p_new_password = v_member.member_code then
    return jsonb_build_object('error', 'لا تستخدم رمز البطاقة ككلمة مرور');
  end if;

  update public.club_applications
  set password_hash = crypt(p_new_password, gen_salt('bf')),
      password_set_at = now()
  where id = v_member.id;

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.member_set_password(text, text, text) from public;
grant execute on function public.member_set_password(text, text, text) to anon, authenticated;

-- الدخول يخبر الواجهة إن كانت كلمة المرور معيّنة أم لا
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
    'memberCode', v_member.member_code,
    'acceptedAt', v_member.accepted_at,
    'membershipType', v_member.membership_type,
    'validUntil', v_member.valid_until,
    'membershipState', public.club_membership_state(v_member),
    'passwordSet', v_member.password_hash is not null,
    'registrations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'eventId', r.event_id, 'status', r.status, 'checkedInAt', r.checked_in_at,
        'title', e.title, 'eventType', e.event_type, 'startsAt', e.starts_at, 'timeTbd', e.time_tbd,
        'location', e.location
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
