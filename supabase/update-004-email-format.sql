-- =====================================================================
-- تحديث 004: فحص أدق لصيغة البريد الإلكتروني (يرفض مثل gmail..com)
-- التشغيل: Supabase → SQL Editor → الصق الملف كاملاً → Run  (آمن لإعادة التشغيل)
-- =====================================================================

-- صيغة بريد إلكتروني صحيحة (بدون نقطتين متتاليتين أو نطاق ناقص)
create or replace function public.club_valid_email(value text)
returns boolean
language sql
immutable
as $$
  select coalesce(value, '') ~ '^[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$'
     and coalesce(value, '') !~ '\.\.'
     and coalesce(value, '') !~ '^\.|\.@|@\.'
     and length(coalesce(value, '')) <= 160;
$$;

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
    raise exception 'البريد الإلكتروني غير صالح';
  end if;
  if length(regexp_replace(v_phone, '\D', '', 'g')) not between 9 and 15 then
    raise exception 'رقم الجوال غير صالح';
  end if;
  if octet_length(payload::text) > 20000 then
    raise exception 'حجم الطلب كبير جداً';
  end if;

  v_committee_id := case v_committee
    when 'عضوية عامة (عضو بالنادي)' then 'general'
    when 'لجنة الفعاليات والأنشطة'  then 'events'
    when 'لجنة العلاقات والتدريب'   then 'training'
    when 'اللجنة الإعلامية'          then 'media'
  end;
  if v_committee_id is null then
    raise exception 'يرجى اختيار نوع العضوية أو اللجنة';
  end if;

  -- إغلاق الاستقطاب من لوحة الإدارة يُطبَّق هنا أيضاً (لا يمكن تجاوزه من المتصفح)
  select value into v_recruitment from public.club_content where key = 'recruitment';
  if v_recruitment is not null then
    if (v_recruitment->>'isGlobalRecruitmentOpen') = 'false' then
      raise exception '%', coalesce(nullif(v_recruitment->>'globalClosedMessage', ''), 'باب الانضمام مغلق مؤقتاً');
    end if;
    if (v_recruitment->'committees'->v_committee_id->>'isOpen') = 'false' then
      raise exception '%', coalesce(nullif(v_recruitment->'committees'->v_committee_id->>'closedNotice', ''), 'التقديم لهذه اللجنة مغلق حالياً');
    end if;
  end if;

  -- الطالب لا يستطيع تعيين لجنته أو مسماه بنفسه
  v_data := (payload - 'id' - 'status' - 'submittedAt' - 'assignedCommittee' - 'organizationalRole')
            || jsonb_build_object('studentId', v_student_id, 'fullName', v_full_name, 'email', v_email, 'phone', v_phone);

  select * into v_existing
  from public.club_applications
  where lower(student_id) = lower(v_student_id)
  for update;

  if found then
    -- حماية العضو المقبول: لا يمكن لأحد تغيير بياناته من الاستمارة
    if v_existing.status = 'تم القبول' then
      raise exception 'هذا الرقم الجامعي مسجل كعضو مقبول في النادي. لتعديل بياناتك تواصل مع إدارة النادي.';
    end if;
    -- تحديث طلب سابق مسموح لصاحبه فقط (نفس البريد أو نفس الجوال)
    if lower(coalesce(v_existing.email, '')) <> v_email
       and public.club_phone_key(v_existing.phone) <> public.club_phone_key(v_phone) then
      raise exception 'يوجد طلب سابق بهذا الرقم الجامعي. لتحديثه استخدم نفس البريد الإلكتروني أو رقم الجوال الذي سجلت به، أو تواصل مع إدارة النادي.';
    end if;

    update public.club_applications
    set full_name    = v_full_name,
        email        = v_email,
        phone        = v_phone,
        data         = v_data || jsonb_strip_nulls(jsonb_build_object(
                         'assignedCommittee', v_existing.data->'assignedCommittee',
                         'organizationalRole', v_existing.data->'organizationalRole')),
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

create or replace function public.subscribe_newsletter(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(btrim(public.club_latin_digits(p_email)));
begin
  if not public.club_valid_email(v_email) then
    raise exception 'البريد الإلكتروني غير صالح';
  end if;
  insert into public.club_subscribers (email) values (v_email)
  on conflict (email) do nothing;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.submit_application(jsonb)  to anon, authenticated;
grant execute on function public.subscribe_newsletter(text) to anon, authenticated;
