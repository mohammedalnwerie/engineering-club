-- =====================================================================
-- تحديث 011 — صورة العضو على البطاقة (اختيارية)
--
-- العضو يقدر يرفع صورته من صفحة «حسابي»، وتظهر على بطاقته بدل الحروف.
-- الصورة تُضغط في المتصفح قبل الرفع، وهنا نرفض أي صورة أكبر من ~300KB
-- أو ليست صورة فعلاً. صفحة التحقق العامة لا تعرض الصورة.
--
-- شغّل هذا الملف كاملاً في SQL Editor.
-- =====================================================================

create or replace function public.member_set_photo(p_student_id text, p_secret text, p_photo text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_member public.club_applications := public.club_member_by_credentials(p_student_id, p_secret);
  v_photo  text := nullif(btrim(coalesce(p_photo, '')), '');
begin
  if v_member.id is null then
    return jsonb_build_object('error', 'الرقم الجامعي أو كلمة المرور غير صحيح');
  end if;

  if v_photo is not null then
    if v_photo !~ '^data:image/(png|jpe?g|webp);base64,' then
      return jsonb_build_object('error', 'الملف ليس صورة صالحة');
    end if;
    if length(v_photo) > 420000 then
      return jsonb_build_object('error', 'حجم الصورة كبير. اختر صورة أصغر.');
    end if;
  end if;

  update public.club_applications
  set data = case
               when v_photo is null then data - 'photoUrl'
               else data || jsonb_build_object('photoUrl', v_photo)
             end
  where id = v_member.id;

  return jsonb_build_object('ok', true, 'hasPhoto', v_photo is not null);
end;
$$;

revoke all on function public.member_set_photo(text, text, text) from public;
grant execute on function public.member_set_photo(text, text, text) to anon, authenticated;


-- الدخول يرجّع الصورة حتى تظهر على البطاقة في «حسابي»
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

-- حارس عام: أي صورة تُكتب على الطلب (من الاستمارة أو من «حسابي») لازم تكون
-- صورة فعلية وبحجم معقول — يحمي قاعدة البيانات من أي مسار
create or replace function public.club_guard_photo()
returns trigger
language plpgsql
as $$
declare
  v_photo text := new.data->>'photoUrl';
begin
  if v_photo is not null then
    if v_photo !~ '^data:image/(png|jpe?g|webp);base64,' then
      raise exception 'الصورة المرفقة غير صالحة';
    end if;
    if length(v_photo) > 420000 then
      raise exception 'حجم الصورة كبير جداً';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists club_applications_photo_guard on public.club_applications;
create trigger club_applications_photo_guard
  before insert or update on public.club_applications
  for each row execute function public.club_guard_photo();

notify pgrst, 'reload schema';
