-- =====================================================================
-- تحديث 012 — تصفير كلمة مرور العضو ذاتياً عبر التحقق
--
-- يسمح للعضو المقبول بتصفير كلمة مروره بنفسه عند نسيانها،
-- بشرط مطابقة رقمه الجامعي مع رقم جواله أو بريده الإلكتروني المسجل في طلبه.
-- بعد التصفير، يعود النظام لقبول رمز البطاقة ليدخل به ويعيّن كلمة مرور جديدة.
--
-- شغّل هذا الملف كاملاً في SQL Editor.
-- =====================================================================

create or replace function public.member_self_reset_password(
  p_student_id text,
  p_verification text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_sid          text := lower(regexp_replace(public.club_latin_digits(p_student_id), '\s', '', 'g'));
  v_verif        text := btrim(coalesce(p_verification, ''));
  v_verif_digits text := regexp_replace(public.club_latin_digits(v_verif), '\D', '', 'g');
  v_row          public.club_applications;
  v_phone_digits text;
  v_email        text;
begin
  if length(v_sid) < 6 or v_verif = '' then
    return jsonb_build_object('error', 'يرجى إدخال الرقم الجامعي ورقم الجوال أو البريد الإلكتروني المسجل');
  end if;

  -- حماية من محاولات التخمين المتكررة (5 محاولات خلال 15 دقيقة)
  if (select count(*) from public.club_login_attempts
      where student_id = v_sid and attempted_at > now() - interval '15 minutes') >= 5 then
    return jsonb_build_object('error', 'محاولات كثيرة خاطئة. يرجى الانتظار 15 دقيقة أو تقديم طلب للدعم الفني.');
  end if;

  select * into v_row
  from public.club_applications
  where lower(student_id) = v_sid
    and status = 'تم القبول'
  limit 1;

  if not found then
    insert into public.club_login_attempts (student_id) values (v_sid);
    return jsonb_build_object('error', 'لم يتم العثور على عضو فعّال بهذا الرقم الجامعي');
  end if;

  v_email := lower(btrim(coalesce(v_row.email, '')));
  v_phone_digits := regexp_replace(public.club_latin_digits(coalesce(v_row.phone, v_row.data->>'phone', '')), '\D', '', 'g');

  -- التحقق من مطابقة البريد الإلكتروني أو رقم الجوال
  if (v_email <> '' and v_email = lower(v_verif))
     or (length(v_verif_digits) >= 7 and (
          (length(v_phone_digits) >= 7 and right(v_phone_digits, 7) = right(v_verif_digits, 7))
          or v_phone_digits = v_verif_digits
        )) then
    -- تطابق صحيح: تصفير كلمة المرور ليعود رمز البطاقة للدخول
    update public.club_applications
    set password_hash = null,
        password_set_at = null
    where id = v_row.id;

    delete from public.club_login_attempts where student_id = v_sid;

    return jsonb_build_object(
      'ok', true,
      'fullName', v_row.full_name,
      'message', 'تم تصفير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول مباشرة باستخدام رمز بطاقتك.'
    );
  else
    insert into public.club_login_attempts (student_id) values (v_sid);
    return jsonb_build_object('error', 'البيانات المدخلة لا تتطابق مع رقم الجوال أو الإيميل المسجل في حسابك');
  end if;
end;
$$;

revoke all on function public.member_self_reset_password(text, text) from public;
grant execute on function public.member_self_reset_password(text, text) to anon, authenticated;

notify pgrst, 'reload schema';
