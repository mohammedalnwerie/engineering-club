-- =====================================================================
-- تحديث 010 — موعد المقابلة يظهر للطالب + حماية بيانات الإدارة عند تعديل الطلب
--
-- 1) الطالب اللي حالته «مقابلة مجدولة» صار لما يفحص طلبه من صفحة التحقق
--    يشوف يوم المقابلة (والساعة إن تحددت) بدل كلمة «مقابلة مجدولة» لحالها.
-- 2) لو الطالب رجع عدّل طلبه، ما عادت تُمسح البيانات اللي كتبتها الإدارة
--    (موعد المقابلة، وتوقيت إرسال إيميل القبول).
--
-- شغّل هذا الملف كاملاً في SQL Editor.
-- =====================================================================

create or replace function public.verify_member(code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q     text := lower(regexp_replace(public.club_latin_digits(code), '\s', '', 'g'));
  v_row public.club_applications;
begin
  if q = '' then
    return null;
  end if;

  select * into v_row
  from public.club_applications a
  where lower(a.student_id) = q
     or lower(a.id) = q
     or 'up-eng-' || lower(right(a.id, 8)) = q
  limit 1;

  if not found then
    return null;
  end if;

  -- طلب لم يُقبل بعد: نعطيه حالته وموعد مقابلته فقط
  if v_row.status <> 'تم القبول' then
    return jsonb_build_object(
      'id', v_row.id,
      'fullName', v_row.full_name,
      'studentId', v_row.student_id,
      'status', v_row.status,
      'submittedAt', v_row.submitted_at,
      'targetCommittee', v_row.data->>'targetCommittee',
      'interviewAt', v_row.data->>'interviewAt',
      'interviewTimeTbd', coalesce((v_row.data->>'interviewTimeTbd')::boolean, false)
    );
  end if;

  return jsonb_build_object(
    'id', v_row.id,
    'fullName', v_row.full_name,
    'studentId', v_row.student_id,
    'status', v_row.status,
    'submittedAt', v_row.submitted_at,
    'college', v_row.data->>'college',
    'major', v_row.data->>'major',
    'academicYear', v_row.data->>'academicYear',
    'targetCommittee', v_row.data->>'targetCommittee',
    'assignedCommittee', v_row.data->>'assignedCommittee',
    'organizationalRole', v_row.data->>'organizationalRole',
    'skills', coalesce(v_row.data->'skills', '[]'::jsonb),
    -- الرمز الكامل لا يخرج هنا أبداً؛ آخر 4 خانات فقط للتحقق البصري
    'codeHint', right(v_row.member_code, 4),
    'membershipType', v_row.membership_type,
    'validUntil', v_row.valid_until,
    'membershipState', public.club_membership_state(v_row)
  );
end;
$$;

revoke all on function public.verify_member(text) from public;
grant execute on function public.verify_member(text) to anon, authenticated;

-- 2) تعديل الطالب لطلبه لا يمسح ما سجّلته الإدارة عليه
create or replace function public.submit_application(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id   text := regexp_replace(public.club_latin_digits(payload->>'studentId'), '\s', '', 'g');
  v_full_name    text := btrim(regexp_replace(coalesce(payload->>'fullName', ''), '\s+', ' ', 'g'));
  v_email        text := lower(btrim(public.club_latin_digits(payload->>'email')));
  v_phone        text := regexp_replace(public.club_latin_digits(payload->>'phone'), '[^0-9+]', '', 'g');
  v_committee    text := btrim(coalesce(payload->>'targetCommittee', ''));
  v_committee_id text;
  v_recruitment  jsonb;
  v_data         jsonb;
  v_existing     public.club_applications;
  v_row          public.club_applications;
begin
  if v_full_name = '' or v_student_id = '' then
    raise exception 'الاسم والرقم الجامعي مطلوبان';
  end if;
  if v_student_id !~ '^[0-9]{5,12}$' then
    raise exception 'الرقم الجامعي يجب أن يتكون من أرقام فقط (من 5 إلى 12 رقماً)';
  end if;
  if length(v_full_name) < 6 or length(v_full_name) > 120 or v_full_name !~ '\S+\s+\S+' then
    raise exception 'يرجى كتابة الاسم الكامل (اسمان على الأقل)';
  end if;
  if not public.club_valid_email(v_email) then
    raise exception 'البريد الإلكتروني غير صحيح';
  end if;

  v_committee_id := case
    when v_committee ilike '%فعاليات%' then 'events'
    when v_committee ilike '%علاقات%' or v_committee ilike '%تدريب%' then 'training'
    when v_committee ilike '%إعلام%' or v_committee ilike '%اعلام%' then 'media'
    when v_committee ilike '%عامة%' then 'general'
    else null end;

  select value into v_recruitment from public.club_content where key = 'recruitment';
  if v_recruitment is not null and v_committee_id is not null then
    if (v_recruitment->>'isGlobalRecruitmentOpen') = 'false' then
      raise exception '%', coalesce(nullif(v_recruitment->>'globalClosedMessage', ''), 'باب الانضمام مغلق مؤقتاً');
    end if;
    if (v_recruitment->'committees'->v_committee_id->>'isOpen') = 'false' then
      raise exception '%', coalesce(nullif(v_recruitment->'committees'->v_committee_id->>'closedNotice', ''), 'التقديم لهذه اللجنة مغلق حالياً');
    end if;
  end if;

  v_data := (payload - 'id' - 'status' - 'submittedAt' - 'assignedCommittee' - 'organizationalRole'
                     - 'interviewAt' - 'interviewTimeTbd' - 'acceptanceEmailSentAt')
            || jsonb_build_object('studentId', v_student_id, 'fullName', v_full_name, 'email', v_email, 'phone', v_phone);

  select * into v_existing
  from public.club_applications
  where lower(student_id) = lower(v_student_id)
  for update;

  if found then
    if v_existing.status = 'تم القبول' then
      raise exception 'هذا الرقم الجامعي مسجل كعضو مقبول في النادي. لتعديل بياناتك تواصل مع إدارة النادي.';
    end if;
    if lower(coalesce(v_existing.email, '')) <> v_email
       and public.club_phone_key(v_existing.phone) <> public.club_phone_key(v_phone) then
      raise exception 'يوجد طلب سابق بهذا الرقم الجامعي. لتحديثه استخدم نفس البريد الإلكتروني أو رقم الجوال الذي سجلت به، أو تواصل مع إدارة النادي.';
    end if;

    update public.club_applications
    set full_name    = v_full_name,
        email        = v_email,
        phone        = v_phone,
        -- ما تكتبه الإدارة يبقى كما هو
        data         = v_data || jsonb_strip_nulls(jsonb_build_object(
                         'assignedCommittee', v_existing.data->'assignedCommittee',
                         'organizationalRole', v_existing.data->'organizationalRole',
                         'interviewAt', v_existing.data->'interviewAt',
                         'interviewTimeTbd', v_existing.data->'interviewTimeTbd',
                         'acceptanceEmailSentAt', v_existing.data->'acceptanceEmailSentAt')),
        submitted_at = now(),
        status       = case when v_existing.status = 'مرفوض' then 'قيد المراجعة' else v_existing.status end
    where id = v_existing.id
    returning * into v_row;
  else
    insert into public.club_applications (student_id, full_name, email, phone, data)
    values (v_student_id, v_full_name, v_email, v_phone, v_data)
    returning * into v_row;
  end if;

  return jsonb_build_object('id', v_row.id, 'status', v_row.status, 'submittedAt', v_row.submitted_at);
end;
$$;

revoke all on function public.submit_application(jsonb) from public;
grant execute on function public.submit_application(jsonb) to anon, authenticated;

notify pgrst, 'reload schema';
