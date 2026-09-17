-- =====================================================================
-- تحديث 002: تعيين اللجنة والمسمى من لوحة الإدارة
-- التشغيل: Supabase → SQL Editor → الصق الملف → Run  (آمن لإعادة التشغيل)
-- =====================================================================

-- تقديم / تحديث طلب انضمام
create or replace function public.submit_application(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id text := btrim(coalesce(payload->>'studentId', ''));
  v_full_name  text := btrim(coalesce(payload->>'fullName', ''));
  v_email      text := btrim(coalesce(payload->>'email', ''));
  v_phone      text := btrim(coalesce(payload->>'phone', ''));
  -- الطالب لا يستطيع تعيين لجنته أو مسماه بنفسه
  v_data       jsonb := payload - 'id' - 'status' - 'submittedAt' - 'assignedCommittee' - 'organizationalRole';
  v_row        public.club_applications;
begin
  if v_student_id = '' or v_full_name = '' then
    raise exception 'الاسم والرقم الجامعي مطلوبان';
  end if;
  if length(v_student_id) > 20 or v_student_id !~ '^[0-9A-Za-z-]+$' then
    raise exception 'الرقم الجامعي غير صالح';
  end if;
  if length(v_full_name) > 120 or length(v_email) > 160 or length(v_phone) > 30 then
    raise exception 'بعض الحقول أطول من المسموح';
  end if;
  if octet_length(payload::text) > 20000 then
    raise exception 'حجم الطلب كبير جداً';
  end if;

  insert into public.club_applications (student_id, full_name, email, phone, data)
  values (v_student_id, v_full_name, v_email, v_phone, v_data)
  on conflict ((lower(student_id))) do update
    set full_name    = excluded.full_name,
        email        = excluded.email,
        phone        = excluded.phone,
        -- الحفاظ على تعيين الإدارة (اللجنة والمسمى) عند إعادة التقديم
        data         = excluded.data || jsonb_strip_nulls(jsonb_build_object(
                         'assignedCommittee', public.club_applications.data->'assignedCommittee',
                         'organizationalRole', public.club_applications.data->'organizationalRole')),
        submitted_at = now(),
        -- العضو المقبول يبقى مقبولاً، غير ذلك يرجع للمراجعة
        status = case when public.club_applications.status = 'تم القبول'
                      then public.club_applications.status
                      else 'قيد المراجعة' end
  returning * into v_row;

  return jsonb_build_object('id', v_row.id, 'status', v_row.status, 'submittedAt', v_row.submitted_at);
end;
$$;

-- التحقق من العضوية بالرقم الجامعي أو كود التوثيق (تطابق تام فقط، بدون إيميل/هاتف)
create or replace function public.verify_member(code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q     text := lower(btrim(coalesce(code, '')));
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

  if v_row.status <> 'تم القبول' then
    return jsonb_build_object(
      'id', v_row.id,
      'fullName', v_row.full_name,
      'studentId', v_row.student_id,
      'status', v_row.status
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
    'skills', coalesce(v_row.data->'skills', '[]'::jsonb)
  );
end;
$$;

grant execute on function public.submit_application(jsonb) to anon, authenticated;
grant execute on function public.verify_member(text)       to anon, authenticated;
