-- =====================================================================
-- تحديث 010 — موعد المقابلة يظهر للطالب
--
-- الطالب اللي حالته «مقابلة مجدولة» صار لما يفحص طلبه من صفحة التحقق
-- يشوف يوم المقابلة (والساعة إن تحددت) بدل كلمة «مقابلة مجدولة» لحالها.
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

notify pgrst, 'reload schema';
