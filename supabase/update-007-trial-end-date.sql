-- =====================================================================
-- تحديث 007 — تحديد نهاية البطاقة الأولى بتاريخ ثابت
--
-- صار بإمكان الإدارة أن تختار من صفحة «العضويات والمدفوعات» إمّا:
--   • عدد أيام (مثل 14 يوماً من تاريخ القبول)، أو
--   • تاريخ ثابت لكل الأعضاء (مثل 8 أكتوبر) عبر المفتاح trialEndsAt
-- إن كان التاريخ الثابت موجوداً ولم يمضِ بعد، تُصدر البطاقات صالحة حتى
-- نهاية ذلك اليوم. وإلا يُستخدم عدد الأيام كالسابق.
--
-- شغّل هذا الملف كاملاً في SQL Editor.
-- =====================================================================

create or replace function public.club_trial_valid_until()
returns timestamptz
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_settings jsonb := public.club_membership_settings();
  v_fixed    text  := nullif(trim(coalesce(v_settings->>'trialEndsAt', '')), '');
  v_days     int   := coalesce((v_settings->>'trialDays')::int, 14);
  v_date     date;
begin
  if v_fixed is not null then
    begin
      v_date := v_fixed::date;
    exception when others then
      v_date := null;
    end;
    -- التاريخ الثابت يُستخدم ما دام لم يمضِ
    if v_date is not null and (v_date + interval '1 day') > now() then
      return v_date + interval '1 day' - interval '1 second';
    end if;
  end if;
  return now() + make_interval(days => greatest(v_days, 1));
end;
$$;

grant execute on function public.club_trial_valid_until() to authenticated;

create or replace function public.club_on_application_accept()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'تم القبول' and (tg_op = 'INSERT' or old.status is distinct from 'تم القبول') then
    new.accepted_at := coalesce(new.accepted_at, now());
    new.member_code := coalesce(new.member_code, public.club_generate_member_code());
    if new.membership_type is null then
      new.membership_type := 'temporary';
      new.valid_until := public.club_trial_valid_until();
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists club_applications_accept on public.club_applications;
create trigger club_applications_accept
  before insert or update of status on public.club_applications
  for each row execute function public.club_on_application_accept();

-- تطبيق التاريخ الجديد على البطاقات الأولى الصادرة (للإدارة فقط)
create or replace function public.apply_trial_end_to_members()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_until timestamptz := public.club_trial_valid_until();
  v_count integer;
begin
  if not public.club_has_full_access() then
    raise exception 'ليس لديك صلاحية تعديل العضويات';
  end if;
  update public.club_applications
  set valid_until = v_until
  where status = 'تم القبول' and coalesce(membership_type, 'temporary') = 'temporary';
  get diagnostics v_count = row_count;
  perform public.club_log('update', 'membership', null,
    'تحديث صلاحية البطاقات الأولى حتى ' || to_char(v_until, 'YYYY-MM-DD') || ' (' || v_count || ' عضو)');
  return v_count;
end;
$$;

grant execute on function public.apply_trial_end_to_members() to authenticated;

notify pgrst, 'reload schema';
