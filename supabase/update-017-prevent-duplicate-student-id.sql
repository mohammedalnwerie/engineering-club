-- update-017-prevent-duplicate-student-id.sql
-- منع تكرار تقديم الرقم الجامعي نهائياً في النظام وقاعدة البيانات
-- Run by the database owner in the Supabase SQL Editor

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
    raise exception 'الرقم الجامعي يجب أن يتكون من أرقام فقط (من 5 إلى 12 خانة)';
  end if;
  if length(v_full_name) < 6 or length(v_full_name) > 120 or v_full_name !~ '\S+\s+\S+' then
    raise exception 'يرجى كتابة الاسم كاملاً (الاسم واسم العائلة على الأقل)';
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
      raise exception 'هذا الرقم الجامعي مسجل كعضو معتمد بالفعل في النادي الهندسي. يمكنك الدخول لحسابك عبر صفحة «حسابي».';
    end if;
    raise exception 'عذراً، هذا الرقم الجامعي مسجل مسبقاً في سجلات النظام وطلبك قيد المراجعة والتقييم حالياً. لا يُسمح بتقديم أكثر من طلب لضمان العدالة وتكافؤ الفرص.';
  end if;

  insert into public.club_applications (student_id, full_name, email, phone, data)
  values (v_student_id, v_full_name, v_email, v_phone, v_data)
  returning * into v_row;

  return jsonb_build_object('id', v_row.id, 'status', v_row.status, 'submittedAt', v_row.submitted_at);
end;
$$;
