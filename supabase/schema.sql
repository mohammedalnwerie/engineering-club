-- =====================================================================
-- النادي الهندسي — جامعة فلسطين
-- مخطط قاعدة البيانات + سياسات الحماية (RLS)
--
-- التشغيل: Supabase Dashboard → SQL Editor → الصق الملف كاملاً → Run
-- الملف آمن لإعادة التشغيل (idempotent) ولا يلمس جداول applications / events القديمة.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) المشرفون
-- ---------------------------------------------------------------------
create table if not exists public.club_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.club_admins enable row level security;

create or replace function public.is_club_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.club_admins where user_id = auth.uid());
$$;

drop policy if exists "admins read self" on public.club_admins;
create policy "admins read self" on public.club_admins
  for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------
-- 2) محتوى الموقع (الإعدادات، المشاريع، الفعاليات، القيادة، ...)
--    كل مفتاح يخزن JSON كامل. العام يقرأ المحتوى العام فقط، والمشرف يكتب.
-- ---------------------------------------------------------------------
create table if not exists public.club_content (
  key        text primary key,
  value      jsonb not null,
  is_public  boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.club_content enable row level security;

drop policy if exists "content public read" on public.club_content;
create policy "content public read" on public.club_content
  for select to anon, authenticated
  using (is_public or public.is_club_admin());

drop policy if exists "content admin write" on public.club_content;
create policy "content admin write" on public.club_content
  for all to authenticated
  using (public.is_club_admin())
  with check (public.is_club_admin());

-- ---------------------------------------------------------------------
-- 3) طلبات الانضمام — لا يقرأها إلا المشرف
-- ---------------------------------------------------------------------
create table if not exists public.club_applications (
  id           text primary key default ('app-' || replace(gen_random_uuid()::text, '-', '')),
  student_id   text not null,
  full_name    text not null,
  email        text,
  phone        text,
  status       text not null default 'قيد المراجعة',
  data         jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

create unique index if not exists club_applications_student_id_key
  on public.club_applications (lower(student_id));

alter table public.club_applications enable row level security;

drop policy if exists "applications admin all" on public.club_applications;
create policy "applications admin all" on public.club_applications
  for all to authenticated
  using (public.is_club_admin())
  with check (public.is_club_admin());

-- ---------------------------------------------------------------------
-- 4) الشكاوى والمقترحات — لا يقرأها إلا المشرف
-- ---------------------------------------------------------------------
create table if not exists public.club_complaints (
  id            text primary key default ('cmp-' || replace(gen_random_uuid()::text, '-', '')),
  ticket_number text not null unique,
  status        text not null default 'pending',
  admin_notes   text,
  data          jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);

alter table public.club_complaints enable row level security;

drop policy if exists "complaints admin all" on public.club_complaints;
create policy "complaints admin all" on public.club_complaints
  for all to authenticated
  using (public.is_club_admin())
  with check (public.is_club_admin());

-- =====================================================================
-- دوال عامة محدودة (الزوار لا يلمسون الجداول مباشرة)
-- =====================================================================

-- أدوات مساعدة
-- يحوّل الأرقام العربية (٠١٢…) والفارسية (۰۱۲…) إلى 012…
create or replace function public.club_latin_digits(value text)
returns text
language sql
immutable
as $$
  select translate(coalesce(value, ''), '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789');
$$;

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

-- آخر 9 أرقام من الجوال، لمقارنة 0599… مع 970599…
create or replace function public.club_phone_key(value text)
returns text
language sql
immutable
as $$
  select right(regexp_replace(public.club_latin_digits(value), '\D', '', 'g'), 9);
$$;

-- تقديم / تحديث طلب انضمام
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

-- التحقق من العضوية بالرقم الجامعي أو كود التوثيق (تطابق تام فقط، بدون إيميل/هاتف)
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

-- تقديم شكوى / مقترح — رقم التذكرة يُولّد في السيرفر وغير قابل للتخمين
create or replace function public.submit_complaint(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket text;
  v_data   jsonb := payload - 'id' - 'ticketNumber' - 'status' - 'adminNotes' - 'createdAt' - 'updatedAt';
  v_row    public.club_complaints;
begin
  if btrim(coalesce(payload->>'subject', '')) = '' and btrim(coalesce(payload->>'message', '')) = '' then
    raise exception 'يرجى كتابة موضوع أو تفاصيل';
  end if;
  -- يسمح بصورة مرفقة صغيرة (Base64) بحد أقصى ~3MB
  if octet_length(payload::text) > 3000000 then
    raise exception 'حجم المرفق كبير جداً';
  end if;

  v_ticket := 'UP-CMP-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  insert into public.club_complaints (ticket_number, data)
  values (v_ticket, v_data)
  returning * into v_row;

  return v_data || jsonb_build_object(
    'id', v_row.id,
    'ticketNumber', v_row.ticket_number,
    'status', v_row.status,
    'createdAt', v_row.created_at
  );
end;
$$;

-- متابعة شكوى برقم التذكرة فقط (بدون بيانات التواصل أو المرفق)
create or replace function public.track_complaint(ticket text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select (c.data - 'email' - 'phone' - 'attachmentImage' - 'studentId') || jsonb_build_object(
    'id', c.id,
    'ticketNumber', c.ticket_number,
    'status', c.status,
    'adminNotes', c.admin_notes,
    'createdAt', c.created_at,
    'updatedAt', c.updated_at
  )
  from public.club_complaints c
  where upper(c.ticket_number) = upper(regexp_replace(public.club_latin_digits(ticket), '\s', '', 'g'))
  limit 1;
$$;

-- النشرة البريدية
-- ---------------------------------------------------------------------
create table if not exists public.club_subscribers (
  email      text primary key,
  created_at timestamptz not null default now()
);

alter table public.club_subscribers enable row level security;

drop policy if exists "subscribers admin read" on public.club_subscribers;
create policy "subscribers admin read" on public.club_subscribers
  for select to authenticated
  using (public.is_club_admin());

drop policy if exists "subscribers admin delete" on public.club_subscribers;
create policy "subscribers admin delete" on public.club_subscribers
  for delete to authenticated
  using (public.is_club_admin());

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


revoke all on function public.submit_application(jsonb) from public;
revoke all on function public.verify_member(text)       from public;
revoke all on function public.submit_complaint(jsonb)   from public;
revoke all on function public.track_complaint(text)     from public;
grant execute on function public.submit_application(jsonb) to anon, authenticated;
grant execute on function public.verify_member(text)       to anon, authenticated;
grant execute on function public.submit_complaint(jsonb)   to anon, authenticated;
grant execute on function public.track_complaint(text)     to anon, authenticated;
grant execute on function public.is_club_admin()           to anon, authenticated;
revoke all on function public.subscribe_newsletter(text) from public;
grant execute on function public.subscribe_newsletter(text) to anon, authenticated;

-- =====================================================================
-- إضافة مشرف (شغّلها بعد إنشاء المستخدم من Authentication → Users)
-- استبدل الإيميل بإيميل المشرف:
--
--   insert into public.club_admins (user_id)
--   select id from auth.users where email = 'admin@example.com'
--   on conflict do nothing;
-- =====================================================================

-- ===== تحديث 005 =====
-- =====================================================================
-- تحديث 005: أدوار المشرفين + رمز العضو + العضوية المؤقتة والفصلية
--            + الفعاليات والتسجيل للأعضاء + سجل النشاط + سلة المحذوفات
-- التشغيل: Supabase → SQL Editor → الصق الملف كاملاً → Run  (آمن لإعادة التشغيل)
-- =====================================================================


-- =====================================================================
-- 1) أدوار المشرفين
--    owner        : المالك — كل شيء
--    vp_admin     : نائب الشؤون الإدارية — كل شيء
--    tech_support : لجنة الدعم الفني — كل شيء
--    media        : اللجنة الإعلامية — طلبات وفعاليات اللجنة الإعلامية فقط
-- =====================================================================
alter table public.club_admins add column if not exists role text not null default 'owner';
alter table public.club_admins add column if not exists email text;
alter table public.club_admins add column if not exists display_name text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'club_admins_role_check') then
    alter table public.club_admins
      add constraint club_admins_role_check check (role in ('owner', 'vp_admin', 'tech_support', 'media'));
  end if;
end $$;

update public.club_admins a
set email = u.email
from auth.users u
where u.id = a.user_id and a.email is null;

create or replace function public.club_admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.club_admins where user_id = auth.uid();
$$;

create or replace function public.club_has_full_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.club_admin_role() in ('owner', 'vp_admin', 'tech_support'), false);
$$;

-- هل يستطيع المشرف الحالي إدارة شيء يخص هذه اللجنة؟
create or replace function public.club_can_manage_committee(committee text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.club_has_full_access()
      or (public.club_admin_role() = 'media' and coalesce(committee, '') = 'اللجنة الإعلامية');
$$;

drop policy if exists "admins read self" on public.club_admins;
drop policy if exists "admins read" on public.club_admins;
create policy "admins read" on public.club_admins
  for select to authenticated
  using (user_id = auth.uid() or public.club_has_full_access());

grant execute on function public.club_admin_role()                to authenticated;
grant execute on function public.club_has_full_access()           to authenticated;
grant execute on function public.club_can_manage_committee(text)  to authenticated;


-- =====================================================================
-- 2) صلاحيات الجداول الحالية حسب الدور
-- =====================================================================

-- طلبات الانضمام: الكل للصلاحية الكاملة، والإعلامية لطلبات لجنتها فقط
drop policy if exists "applications admin all" on public.club_applications;
drop policy if exists "applications admin read" on public.club_applications;
drop policy if exists "applications admin update" on public.club_applications;
drop policy if exists "applications admin insert" on public.club_applications;
drop policy if exists "applications admin delete" on public.club_applications;

create policy "applications admin read" on public.club_applications
  for select to authenticated
  using (public.club_can_manage_committee(coalesce(data->>'assignedCommittee', data->>'targetCommittee')));

create policy "applications admin update" on public.club_applications
  for update to authenticated
  using (public.club_can_manage_committee(coalesce(data->>'assignedCommittee', data->>'targetCommittee')))
  with check (public.club_can_manage_committee(coalesce(data->>'assignedCommittee', data->>'targetCommittee')));

create policy "applications admin insert" on public.club_applications
  for insert to authenticated
  with check (public.club_has_full_access());

create policy "applications admin delete" on public.club_applications
  for delete to authenticated
  using (public.club_has_full_access());

-- الشكاوى والمحتوى والمشتركون: صلاحية كاملة فقط
drop policy if exists "complaints admin all" on public.club_complaints;
create policy "complaints admin all" on public.club_complaints
  for all to authenticated
  using (public.club_has_full_access())
  with check (public.club_has_full_access());

drop policy if exists "content public read" on public.club_content;
create policy "content public read" on public.club_content
  for select to anon, authenticated
  using (is_public or public.club_has_full_access());

drop policy if exists "content admin write" on public.club_content;
create policy "content admin write" on public.club_content
  for all to authenticated
  using (public.club_has_full_access())
  with check (public.club_has_full_access());

drop policy if exists "subscribers admin read" on public.club_subscribers;
create policy "subscribers admin read" on public.club_subscribers
  for select to authenticated
  using (public.club_has_full_access());

drop policy if exists "subscribers admin delete" on public.club_subscribers;
create policy "subscribers admin delete" on public.club_subscribers
  for delete to authenticated
  using (public.club_has_full_access());


-- =====================================================================
-- 3) إعدادات العضوية (قابلة للتعديل من لوحة التحكم)
-- =====================================================================
insert into public.club_content (key, value, is_public)
values (
  'membership',
  jsonb_build_object(
    'trialDays', 14,
    'semesterFee', 20,
    'currency', '₪',
    'semesterLabel', 'الفصل الأول 2026/2027',
    'semesterEndsAt', '2027-02-01',
    'paymentMethods', jsonb_build_array('نقداً لأمين الصندوق', 'تحويل بنكي', 'جوال باي / بال باي'),
    'paymentInstructions', 'ادفع رسوم العضوية الفصلية بإحدى الطرق المتاحة، ثم اكتب رقم الحوالة أو اسم المستلم في الطلب.'
  ),
  true
)
on conflict (key) do nothing;

create or replace function public.club_membership_settings()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select value from public.club_content where key = 'membership'),
    jsonb_build_object('trialDays', 14, 'semesterFee', 20, 'currency', '₪', 'semesterLabel', '', 'semesterEndsAt', null)
  );
$$;


-- =====================================================================
-- 4) رمز العضو السري + صلاحية العضوية
-- =====================================================================
alter table public.club_applications add column if not exists member_code text;
alter table public.club_applications add column if not exists accepted_at timestamptz;
alter table public.club_applications add column if not exists membership_type text;   -- temporary | semester
alter table public.club_applications add column if not exists valid_until timestamptz;

create unique index if not exists club_applications_member_code_key
  on public.club_applications (member_code) where member_code is not null;

-- رمز مثل UP-3F9A-C21D (أحرف وأرقام لا تتشابه)
create or replace function public.club_generate_member_code()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  raw  text;
  code text;
begin
  loop
    raw := md5(gen_random_uuid()::text || clock_timestamp()::text);
    code := '';
    for i in 1..8 loop
      code := code || substr(alphabet, (('x' || substr(raw, i * 2 - 1, 2))::bit(8)::int % 32) + 1, 1);
    end loop;
    code := 'UP-' || substr(code, 1, 4) || '-' || substr(code, 5, 4);
    exit when not exists (select 1 from public.club_applications where member_code = code);
  end loop;
  return code;
end;
$$;

-- عند القبول: إصدار الرمز وبدء العضوية المؤقتة تلقائياً
create or replace function public.club_on_application_accept()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trial_days int := coalesce((public.club_membership_settings()->>'trialDays')::int, 14);
begin
  if new.status = 'تم القبول' and (tg_op = 'INSERT' or old.status is distinct from 'تم القبول') then
    new.accepted_at := coalesce(new.accepted_at, now());
    new.member_code := coalesce(new.member_code, public.club_generate_member_code());
    if new.membership_type is null then
      new.membership_type := 'temporary';
      new.valid_until := now() + make_interval(days => v_trial_days);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists club_applications_accept on public.club_applications;
create trigger club_applications_accept
  before insert or update of status on public.club_applications
  for each row execute function public.club_on_application_accept();

-- الأعضاء المقبولون حالياً: رمز + عضوية مؤقتة تبدأ من اليوم
update public.club_applications
set member_code     = coalesce(member_code, public.club_generate_member_code()),
    accepted_at     = coalesce(accepted_at, submitted_at),
    membership_type = coalesce(membership_type, 'temporary'),
    valid_until     = coalesce(valid_until, now() + make_interval(days => coalesce((public.club_membership_settings()->>'trialDays')::int, 14)))
where status = 'تم القبول';

create or replace function public.club_membership_state(p_app public.club_applications)
returns text
language sql
stable
as $$
  select case
    when p_app.status <> 'تم القبول' then 'not_member'
    when p_app.valid_until is null or p_app.valid_until < now() then 'expired'
    else coalesce(p_app.membership_type, 'temporary')
  end;
$$;


-- =====================================================================
-- 5) دخول العضو بالرقم الجامعي + الرمز السري (مع حماية من التخمين)
-- =====================================================================
create table if not exists public.club_login_attempts (
  id           bigserial primary key,
  student_id   text not null,
  attempted_at timestamptz not null default now()
);
create index if not exists club_login_attempts_idx on public.club_login_attempts (student_id, attempted_at);
alter table public.club_login_attempts enable row level security;

create or replace function public.club_member_by_credentials(p_student_id text, p_code text)
returns public.club_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sid  text := regexp_replace(public.club_latin_digits(p_student_id), '\s', '', 'g');
  v_code text := upper(regexp_replace(public.club_latin_digits(p_code), '\s', '', 'g'));
  v_row  public.club_applications;
begin
  if (select count(*) from public.club_login_attempts
      where student_id = v_sid and attempted_at > now() - interval '15 minutes') >= 8 then
    raise exception 'محاولات كثيرة خاطئة. حاول مرة أخرى بعد 15 دقيقة.';
  end if;

  -- يقبل الرمز مع أو بدون شرطات
  select * into v_row
  from public.club_applications
  where lower(student_id) = lower(v_sid)
    and replace(member_code, '-', '') = replace(v_code, '-', '')
    and status = 'تم القبول';

  if not found then
    -- لا نرفع خطأ هنا حتى تُحفظ المحاولة الفاشلة (الخطأ يلغي كل ما كُتب)
    insert into public.club_login_attempts (student_id) values (v_sid);
    return null;
  end if;

  delete from public.club_login_attempts where student_id = v_sid;
  return v_row;
end;
$$;

revoke all on function public.club_member_by_credentials(text, text) from public, anon, authenticated;


-- =====================================================================
-- 6) طلبات العضوية الفصلية (الدفع)
-- =====================================================================
create table if not exists public.club_payment_requests (
  id             uuid primary key default gen_random_uuid(),
  application_id text not null references public.club_applications(id) on delete cascade,
  amount         numeric not null,
  method         text not null,
  reference      text,
  receipt_image  text,
  note           text,
  semester_label text,
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note     text,
  reviewed_by    uuid,
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);
alter table public.club_payment_requests enable row level security;

drop policy if exists "payments admin all" on public.club_payment_requests;
create policy "payments admin all" on public.club_payment_requests
  for all to authenticated
  using (public.club_has_full_access())
  with check (public.club_has_full_access());

create or replace function public.request_semester_membership(
  p_student_id text, p_code text, p_method text, p_reference text, p_receipt text, p_note text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member   public.club_applications := public.club_member_by_credentials(p_student_id, p_code);
  v_settings jsonb := public.club_membership_settings();
  v_row      public.club_payment_requests;
begin
  if v_member.id is null then
    return jsonb_build_object('error', 'الرقم الجامعي أو رمز العضو غير صحيح');
  end if;
  if btrim(coalesce(p_method, '')) = '' then
    raise exception 'اختر طريقة الدفع';
  end if;
  if length(coalesce(p_reference, '')) > 120 or length(coalesce(p_note, '')) > 500 then
    raise exception 'بعض الحقول أطول من المسموح';
  end if;
  if octet_length(coalesce(p_receipt, '')) > 2000000 then
    raise exception 'صورة الإيصال كبيرة جداً';
  end if;
  if exists (select 1 from public.club_payment_requests where application_id = v_member.id and status = 'pending') then
    raise exception 'لديك طلب قيد المراجعة بالفعل';
  end if;

  insert into public.club_payment_requests (application_id, amount, method, reference, receipt_image, note, semester_label)
  values (v_member.id, coalesce((v_settings->>'semesterFee')::numeric, 20), btrim(p_method),
          nullif(btrim(p_reference), ''), nullif(p_receipt, ''), nullif(btrim(p_note), ''), v_settings->>'semesterLabel')
  returning * into v_row;

  return jsonb_build_object('id', v_row.id, 'status', v_row.status, 'amount', v_row.amount, 'createdAt', v_row.created_at);
end;
$$;

-- اعتماد الدفع: تتحول العضوية إلى فصلية حتى نهاية الفصل
create or replace function public.review_payment_request(p_request_id uuid, p_approve boolean, p_admin_note text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req      public.club_payment_requests;
  v_settings jsonb := public.club_membership_settings();
  v_until    timestamptz;
begin
  if not public.club_has_full_access() then
    raise exception 'ليس لديك صلاحية مراجعة المدفوعات';
  end if;

  select * into v_req from public.club_payment_requests where id = p_request_id for update;
  if not found then raise exception 'الطلب غير موجود'; end if;
  if v_req.status <> 'pending' then raise exception 'تمت مراجعة هذا الطلب مسبقاً'; end if;

  update public.club_payment_requests
  set status = case when p_approve then 'approved' else 'rejected' end,
      admin_note = nullif(btrim(coalesce(p_admin_note, '')), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = p_request_id;

  if p_approve then
    v_until := coalesce((v_settings->>'semesterEndsAt')::date::timestamptz + interval '1 day' - interval '1 second',
                        now() + interval '4 months');
    update public.club_applications
    set membership_type = 'semester',
        valid_until = greatest(v_until, coalesce(valid_until, now()))
    where id = v_req.application_id;
  end if;

  return jsonb_build_object('ok', true, 'validUntil', v_until);
end;
$$;


-- =====================================================================
-- 7) الفعاليات والتسجيل للأعضاء
-- =====================================================================
create table if not exists public.club_events (
  id                    uuid primary key default gen_random_uuid(),
  title                 text not null,
  event_type            text not null default 'workshop'
                          check (event_type in ('workshop', 'course', 'hackathon', 'lecture', 'visit', 'other')),
  description           text,
  location              text,
  starts_at             timestamptz not null,
  ends_at               timestamptz,
  registration_deadline timestamptz,
  capacity              int check (capacity is null or capacity > 0),
  committee             text,                       -- اللجنة المنظمة
  committee_only        boolean not null default false,
  status                text not null default 'draft'
                          check (status in ('draft', 'published', 'cancelled', 'completed')),
  created_by            uuid default auth.uid(),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
alter table public.club_events enable row level security;

drop policy if exists "events public read" on public.club_events;
create policy "events public read" on public.club_events
  for select to anon, authenticated
  using (status <> 'draft' or public.club_can_manage_committee(committee));

drop policy if exists "events admin write" on public.club_events;
create policy "events admin write" on public.club_events
  for all to authenticated
  using (public.club_can_manage_committee(committee))
  with check (public.club_can_manage_committee(committee));

create table if not exists public.club_event_registrations (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.club_events(id) on delete cascade,
  application_id text not null references public.club_applications(id) on delete cascade,
  status         text not null default 'registered' check (status in ('registered', 'waitlisted', 'cancelled')),
  checked_in_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (event_id, application_id)
);
alter table public.club_event_registrations enable row level security;

drop policy if exists "registrations admin all" on public.club_event_registrations;
create policy "registrations admin all" on public.club_event_registrations
  for all to authenticated
  using (exists (select 1 from public.club_events e where e.id = event_id and public.club_can_manage_committee(e.committee)))
  with check (exists (select 1 from public.club_events e where e.id = event_id and public.club_can_manage_committee(e.committee)));

-- قائمة الفعاليات المنشورة مع عدد المسجلين (للزوار)
create or replace function public.list_public_events()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x."startsAt"), '[]'::jsonb)
  from (
    select e.id, e.title, e.event_type as "eventType", e.description, e.location,
           e.starts_at as "startsAt", e.ends_at as "endsAt", e.registration_deadline as "registrationDeadline",
           e.capacity, e.committee, e.committee_only as "committeeOnly", e.status,
           (select count(*) from public.club_event_registrations r where r.event_id = e.id and r.status = 'registered') as "registeredCount",
           (select count(*) from public.club_event_registrations r where r.event_id = e.id and r.status = 'waitlisted') as "waitlistCount"
    from public.club_events e
    where e.status <> 'draft'
      and coalesce(e.ends_at, e.starts_at) > now() - interval '60 days'
  ) x;
$$;

create or replace function public.register_for_event(p_student_id text, p_code text, p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member    public.club_applications := public.club_member_by_credentials(p_student_id, p_code);
  v_event     public.club_events;
  v_existing  public.club_event_registrations;
  v_count     int;
  v_status    text;
  v_committee text := coalesce(v_member.data->>'assignedCommittee', v_member.data->>'targetCommittee');
begin
  if v_member.id is null then
    return jsonb_build_object('error', 'الرقم الجامعي أو رمز العضو غير صحيح');
  end if;
  if v_member.valid_until is null or v_member.valid_until < now() then
    raise exception 'عضويتك منتهية. جدّد العضوية الفصلية لتتمكن من التسجيل.';
  end if;

  select * into v_event from public.club_events where id = p_event_id for update;
  if not found or v_event.status = 'draft' then raise exception 'الفعالية غير موجودة'; end if;
  if v_event.status <> 'published' then raise exception 'التسجيل مغلق لهذه الفعالية'; end if;
  if coalesce(v_event.registration_deadline, v_event.starts_at) < now() then
    raise exception 'انتهى موعد التسجيل';
  end if;
  if v_event.committee_only and coalesce(v_committee, '') <> coalesce(v_event.committee, '') then
    raise exception 'هذه الفعالية مخصصة لأعضاء %', v_event.committee;
  end if;

  select * into v_existing from public.club_event_registrations
  where event_id = p_event_id and application_id = v_member.id;
  if found and v_existing.status <> 'cancelled' then
    return jsonb_build_object('status', v_existing.status, 'id', v_existing.id, 'alreadyRegistered', true);
  end if;

  select count(*) into v_count from public.club_event_registrations
  where event_id = p_event_id and status = 'registered';
  v_status := case when v_event.capacity is null or v_count < v_event.capacity then 'registered' else 'waitlisted' end;

  insert into public.club_event_registrations (event_id, application_id, status)
  values (p_event_id, v_member.id, v_status)
  on conflict (event_id, application_id) do update
    set status = excluded.status, created_at = now(), updated_at = now(), checked_in_at = null
  returning * into v_existing;

  return jsonb_build_object('status', v_existing.status, 'id', v_existing.id, 'alreadyRegistered', false);
end;
$$;

create or replace function public.cancel_event_registration(p_student_id text, p_code text, p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member public.club_applications := public.club_member_by_credentials(p_student_id, p_code);
  v_reg    public.club_event_registrations;
  v_next   uuid;
begin
  if v_member.id is null then
    return jsonb_build_object('error', 'الرقم الجامعي أو رمز العضو غير صحيح');
  end if;
  update public.club_event_registrations
  set status = 'cancelled', updated_at = now()
  where event_id = p_event_id and application_id = v_member.id and status <> 'cancelled'
  returning * into v_reg;

  if not found then raise exception 'لا يوجد تسجيل لإلغائه'; end if;

  -- أول شخص في قائمة الانتظار يأخذ المقعد
  if v_reg.checked_in_at is null then
    select id into v_next from public.club_event_registrations
    where event_id = p_event_id and status = 'waitlisted'
    order by created_at limit 1 for update;
    if v_next is not null then
      update public.club_event_registrations set status = 'registered', updated_at = now() where id = v_next;
    end if;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- ملف العضو: بطاقته + عضويته + تسجيلاته + آخر طلب دفع
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
    return jsonb_build_object('error', 'الرقم الجامعي أو رمز العضو غير صحيح');
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
    'registrations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'eventId', r.event_id, 'status', r.status, 'checkedInAt', r.checked_in_at,
        'title', e.title, 'startsAt', e.starts_at, 'location', e.location, 'eventType', e.event_type
      ) order by e.starts_at desc)
      from public.club_event_registrations r
      join public.club_events e on e.id = r.event_id
      where r.application_id = v_member.id and r.status <> 'cancelled'
    ), '[]'::jsonb),
    'paymentRequest', (
      select jsonb_build_object('id', p.id, 'status', p.status, 'amount', p.amount, 'createdAt', p.created_at,
                                'adminNote', p.admin_note, 'semesterLabel', p.semester_label)
      from public.club_payment_requests p
      where p.application_id = v_member.id
      order by p.created_at desc limit 1
    )
  );
end;
$$;


-- =====================================================================
-- 8) التحقق العام: حالة العضوية + آخر 4 أحرف من الرمز فقط
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
  where (lower(a.student_id) = q
         or lower(replace(a.member_code, '-', '')) = replace(q, '-', '')
         or lower(a.id) = q)
  limit 1;

  if not found then
    return null;
  end if;

  if v_row.status <> 'تم القبول' then
    return jsonb_build_object('id', v_row.id, 'fullName', v_row.full_name, 'studentId', v_row.student_id, 'status', v_row.status);
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
    'codeHint', right(v_row.member_code, 4),
    'membershipType', v_row.membership_type,
    'validUntil', v_row.valid_until,
    'membershipState', public.club_membership_state(v_row)
  );
end;
$$;


-- =====================================================================
-- 9) سجل النشاط (يُكتب تلقائياً لكل عملية يقوم بها مشرف)
-- =====================================================================
create table if not exists public.club_activity_log (
  id           bigserial primary key,
  actor_id     uuid,
  actor_email  text,
  action       text not null,        -- create | update | delete | restore
  entity_type  text not null,
  entity_id    text,
  summary      text not null,
  created_at   timestamptz not null default now()
);
create index if not exists club_activity_log_created_idx on public.club_activity_log (created_at desc);
alter table public.club_activity_log enable row level security;

drop policy if exists "activity admin read" on public.club_activity_log;
create policy "activity admin read" on public.club_activity_log
  for select to authenticated
  using (public.club_has_full_access());

create or replace function public.club_log(p_action text, p_entity_type text, p_entity_id text, p_summary text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.club_activity_log (actor_id, actor_email, action, entity_type, entity_id, summary)
  select auth.uid(), coalesce(auth.jwt()->>'email', (select email from public.club_admins where user_id = auth.uid())),
         p_action, p_entity_type, p_entity_id, p_summary
  where auth.uid() is not null;
$$;

create or replace function public.club_log_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_summary text;
  v_id      text;
  v_action  text := lower(tg_op);
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;

  if tg_table_name = 'club_applications' then
    v_id := coalesce(new.id, old.id);
    if tg_op = 'DELETE' then
      v_summary := 'حذف طلب ' || old.full_name;
    elsif tg_op = 'INSERT' then
      v_summary := 'إضافة طلب ' || new.full_name;
    elsif new.status is distinct from old.status then
      v_summary := 'تغيير حالة ' || new.full_name || ' إلى «' || new.status || '»';
    elsif new.valid_until is distinct from old.valid_until then
      v_summary := 'تحديث عضوية ' || new.full_name || ' (' || coalesce(new.membership_type, '') || ')';
    elsif (new.data->>'assignedCommittee') is distinct from (old.data->>'assignedCommittee')
       or (new.data->>'organizationalRole') is distinct from (old.data->>'organizationalRole') then
      v_summary := 'تعيين ' || new.full_name || ': ' || coalesce(new.data->>'assignedCommittee', '') ||
                   coalesce(' — ' || nullif(new.data->>'organizationalRole', ''), '');
    elsif new.email is distinct from old.email or new.phone is distinct from old.phone then
      v_summary := 'تعديل بيانات تواصل ' || new.full_name;
    elsif (new.data->>'acceptanceEmailSentAt') is distinct from (old.data->>'acceptanceEmailSentAt') then
      v_summary := 'إرسال إيميل القبول إلى ' || new.full_name;
    else
      v_summary := 'تعديل طلب ' || new.full_name;
    end if;
    perform public.club_log(v_action, 'application', v_id, v_summary);

  elsif tg_table_name = 'club_complaints' then
    v_id := coalesce(new.id, old.id);
    v_summary := case tg_op
      when 'DELETE' then 'حذف الشكوى ' || old.ticket_number
      when 'INSERT' then 'إضافة شكوى ' || new.ticket_number
      else 'تحديث الشكوى ' || new.ticket_number || ' (' || new.status || ')' end;
    perform public.club_log(v_action, 'complaint', v_id, v_summary);

  elsif tg_table_name = 'club_content' then
    v_id := coalesce(new.key, old.key);
    v_summary := case tg_op when 'DELETE' then 'استعادة المحتوى الافتراضي: ' else 'تعديل محتوى الموقع: ' end ||
      case v_id
        when 'settings' then 'الهوية والنصوص'
        when 'projects' then 'المشاريع'
        when 'leadership' then 'القيادة'
        when 'colleges' then 'الكليات'
        when 'majors' then 'التخصصات'
        when 'spotlight' then 'نجم الشهر'
        when 'recruitment' then 'الاستقطاب'
        when 'membership' then 'إعدادات العضوية'
        else v_id end;
    perform public.club_log(v_action, 'content', v_id, v_summary);

  elsif tg_table_name = 'club_events' then
    v_id := coalesce(new.id, old.id)::text;
    v_summary := case
      when tg_op = 'DELETE' then 'حذف الفعالية ' || old.title
      when tg_op = 'INSERT' then 'إنشاء الفعالية ' || new.title
      when new.status is distinct from old.status then 'الفعالية ' || new.title || ': ' || new.status
      else 'تعديل الفعالية ' || new.title end;
    perform public.club_log(v_action, 'event', v_id, v_summary);

  elsif tg_table_name = 'club_event_registrations' then
    if tg_op = 'UPDATE' and new.checked_in_at is distinct from old.checked_in_at then
      perform public.club_log('update', 'registration', new.id::text,
        (case when new.checked_in_at is null then 'إلغاء حضور ' else 'تسجيل حضور ' end) ||
        (select full_name from public.club_applications where id = new.application_id) || ' — ' ||
        (select title from public.club_events where id = new.event_id));
    end if;

  elsif tg_table_name = 'club_payment_requests' then
    if tg_op = 'UPDATE' and new.status is distinct from old.status then
      perform public.club_log('update', 'payment', new.id::text,
        (case new.status when 'approved' then 'اعتماد دفع ' else 'رفض دفع ' end) ||
        (select full_name from public.club_applications where id = new.application_id) || ' (' || new.amount || ' ₪)');
    end if;

  elsif tg_table_name = 'club_admins' then
    v_id := coalesce(new.user_id, old.user_id)::text;
    v_summary := case tg_op
      when 'DELETE' then 'إزالة المشرف ' || coalesce(old.email, '')
      when 'INSERT' then 'إضافة المشرف ' || coalesce(new.email, '') || ' (' || new.role || ')'
      else 'تغيير دور ' || coalesce(new.email, '') || ' إلى ' || new.role end;
    perform public.club_log(v_action, 'admin', v_id, v_summary);
  end if;

  return coalesce(new, old);
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['club_applications', 'club_complaints', 'club_content', 'club_events',
                           'club_event_registrations', 'club_payment_requests', 'club_admins']
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_activity', t);
    execute format('create trigger %I after insert or update or delete on public.%I
                    for each row execute function public.club_log_trigger()', t || '_activity', t);
  end loop;
end $$;


-- =====================================================================
-- 10) سلة المحذوفات (30 يوماً قبل الحذف النهائي)
-- =====================================================================
create table if not exists public.club_trash (
  id               uuid primary key default gen_random_uuid(),
  entity_type      text not null,     -- application | complaint | event | project | leader | ...
  entity_id        text,
  title            text not null,
  payload          jsonb not null,
  deleted_by       uuid default auth.uid(),
  deleted_by_email text default (auth.jwt()->>'email'),
  deleted_at       timestamptz not null default now()
);
create index if not exists club_trash_deleted_idx on public.club_trash (deleted_at desc);
alter table public.club_trash enable row level security;

drop policy if exists "trash admin all" on public.club_trash;
create policy "trash admin all" on public.club_trash
  for all to authenticated
  using (public.club_has_full_access())
  with check (public.club_has_full_access());

-- أي حذف لطلب أو شكوى أو فعالية يُنسخ للسلة أولاً
create or replace function public.club_trash_on_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row   jsonb := to_jsonb(old);
  v_type  text;
  v_title text;
begin
  if auth.uid() is null then
    return old;
  end if;

  v_type := case tg_table_name
    when 'club_applications' then 'application'
    when 'club_complaints'   then 'complaint'
    else 'event' end;

  -- القراءة من نسخة JSON: التعبير الواحد لا يستطيع ذكر أعمدة غير موجودة في الجدول
  v_title := case tg_table_name
    when 'club_applications' then 'طلب: '   || coalesce(v_row->>'full_name', '')
    when 'club_complaints'   then 'شكوى: '  || coalesce(v_row->>'ticket_number', '')
    else                          'فعالية: ' || coalesce(v_row->>'title', '') end;

  insert into public.club_trash (entity_type, entity_id, title, payload, deleted_by, deleted_by_email)
  values (v_type, v_row->>'id', v_title, v_row, auth.uid(), auth.jwt()->>'email');

  return old;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['club_applications', 'club_complaints', 'club_events']
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_trash', t);
    execute format('create trigger %I before delete on public.%I
                    for each row execute function public.club_trash_on_delete()', t || '_trash', t);
  end loop;
end $$;

create or replace function public.restore_from_trash(p_trash_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.club_trash;
begin
  if not public.club_has_full_access() then
    raise exception 'ليس لديك صلاحية الاستعادة';
  end if;
  select * into v_item from public.club_trash where id = p_trash_id;
  if not found then raise exception 'العنصر غير موجود في السلة'; end if;

  if v_item.entity_type = 'application' then
    insert into public.club_applications select * from jsonb_populate_record(null::public.club_applications, v_item.payload);
  elsif v_item.entity_type = 'complaint' then
    insert into public.club_complaints select * from jsonb_populate_record(null::public.club_complaints, v_item.payload);
  elsif v_item.entity_type = 'event' then
    insert into public.club_events select * from jsonb_populate_record(null::public.club_events, v_item.payload);
  else
    -- عناصر المحتوى (مشاريع، قيادة...) يعيدها الموقع نفسه إلى مكانها
    delete from public.club_trash where id = p_trash_id;
    perform public.club_log('restore', v_item.entity_type, v_item.entity_id, 'استعادة ' || v_item.title);
    return jsonb_build_object('entityType', v_item.entity_type, 'payload', v_item.payload);
  end if;

  delete from public.club_trash where id = p_trash_id;
  perform public.club_log('restore', v_item.entity_type, v_item.entity_id, 'استعادة ' || v_item.title);
  return jsonb_build_object('entityType', v_item.entity_type, 'restored', true);
end;
$$;

-- تنظيف تلقائي: يحذف نهائياً ما مضى عليه أكثر من 30 يوماً
create or replace function public.purge_old_trash()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare v_count int;
begin
  if not public.club_has_full_access() then return 0; end if;
  delete from public.club_trash where deleted_at < now() - interval '30 days';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;


-- =====================================================================
-- الصلاحيات على الدوال
-- =====================================================================
revoke all on function public.request_semester_membership(text, text, text, text, text, text) from public;
revoke all on function public.review_payment_request(uuid, boolean, text) from public;
revoke all on function public.list_public_events() from public;
revoke all on function public.register_for_event(text, text, uuid) from public;
revoke all on function public.cancel_event_registration(text, text, uuid) from public;
revoke all on function public.member_login(text, text) from public;
revoke all on function public.restore_from_trash(uuid) from public;
revoke all on function public.purge_old_trash() from public;

grant execute on function public.request_semester_membership(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.list_public_events()                     to anon, authenticated;
grant execute on function public.register_for_event(text, text, uuid)      to anon, authenticated;
grant execute on function public.cancel_event_registration(text, text, uuid) to anon, authenticated;
grant execute on function public.member_login(text, text)                  to anon, authenticated;
grant execute on function public.verify_member(text)                       to anon, authenticated;
grant execute on function public.review_payment_request(uuid, boolean, text) to authenticated;
grant execute on function public.restore_from_trash(uuid)                  to authenticated;
grant execute on function public.purge_old_trash()                         to authenticated;


-- =====================================================================
-- 11) إزالة وصف «غير ربحي» من نص «من نحن» المحفوظ
-- =====================================================================
update public.club_content
set value = jsonb_set(value, '{aboutUs}', to_jsonb(replace(value->>'aboutUs', 'إطار طلابي تطوعي، غير ربحي، وغير مسيّس، لا يتبع لأي جهة حزبية أو سياسية، ولا يهدف إلى تحقيق أي مكاسب مادية.', 'إطار طلابي تطوعي وغير مسيّس، لا يتبع لأي جهة حزبية أو سياسية.')))
where key = 'settings' and value->>'aboutUs' like '%غير ربحي%';


-- ===== تحديث 007: تاريخ ثابت لنهاية البطاقة الأولى =====

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


-- ===== تحديث 008: تعليق العضوية ومواعيد الفعاليات المرنة =====

-- 1) تعليق العضوية
alter table public.club_applications add column if not exists suspended_at    timestamptz;
alter table public.club_applications add column if not exists suspend_reason  text;

create or replace function public.club_membership_state(p_app public.club_applications)
returns text
language sql
stable
as $$
  select case
    when p_app.status <> 'تم القبول' then 'not_member'
    when p_app.suspended_at is not null then 'suspended'
    when p_app.valid_until is null or p_app.valid_until < now() then 'expired'
    else coalesce(p_app.membership_type, 'temporary')
  end;
$$;


-- 2) مواعيد الفعاليات: التاريخ اختياري + خيار «بدون ساعة»
alter table public.club_events alter column starts_at drop not null;
alter table public.club_events add column if not exists time_tbd boolean not null default false;

create or replace function public.list_public_events()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(to_jsonb(x) order by x."startsAt" nulls last), '[]'::jsonb)
  from (
    select e.id, e.title, e.event_type as "eventType", e.description, e.location,
           e.starts_at as "startsAt", e.ends_at as "endsAt", e.registration_deadline as "registrationDeadline",
           e.time_tbd as "timeTbd",
           e.capacity, e.committee, e.committee_only as "committeeOnly", e.status,
           (select count(*) from public.club_event_registrations r where r.event_id = e.id and r.status = 'registered') as "registeredCount",
           (select count(*) from public.club_event_registrations r where r.event_id = e.id and r.status = 'waitlisted') as "waitlistCount"
    from public.club_events e
    where e.status <> 'draft'
      -- الفعالية بلا تاريخ تبقى ظاهرة حتى تتحدد أو تُلغى
      and coalesce(e.ends_at, e.starts_at, now()) > now() - interval '60 days'
  ) x;
$$;

create or replace function public.register_for_event(p_student_id text, p_code text, p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member    public.club_applications := public.club_member_by_credentials(p_student_id, p_code);
  v_event     public.club_events;
  v_existing  public.club_event_registrations;
  v_count     int;
  v_status    text;
  v_deadline  timestamptz;
  v_committee text := coalesce(v_member.data->>'assignedCommittee', v_member.data->>'targetCommittee');
begin
  if v_member.id is null then
    return jsonb_build_object('error', 'الرقم الجامعي أو رمز العضو غير صحيح');
  end if;
  if v_member.suspended_at is not null then
    raise exception 'عضويتك معلّقة حالياً. راجع إدارة النادي.';
  end if;
  if v_member.valid_until is null or v_member.valid_until < now() then
    raise exception 'عضويتك منتهية. جدّد العضوية الفصلية لتتمكن من التسجيل.';
  end if;

  select * into v_event from public.club_events where id = p_event_id for update;
  if not found or v_event.status = 'draft' then raise exception 'الفعالية غير موجودة'; end if;
  if v_event.status <> 'published' then raise exception 'التسجيل مغلق لهذه الفعالية'; end if;

  -- بدون تاريخ = التسجيل مفتوح لحين تحديد الموعد
  v_deadline := coalesce(v_event.registration_deadline, v_event.starts_at);
  if v_deadline is not null and v_deadline < now() then
    raise exception 'انتهى موعد التسجيل';
  end if;

  if v_event.committee_only and coalesce(v_committee, '') <> coalesce(v_event.committee, '') then
    raise exception 'هذه الفعالية مخصصة لأعضاء %', v_event.committee;
  end if;

  select * into v_existing from public.club_event_registrations
  where event_id = p_event_id and application_id = v_member.id;
  if found and v_existing.status <> 'cancelled' then
    return jsonb_build_object('status', v_existing.status, 'id', v_existing.id, 'alreadyRegistered', true);
  end if;

  select count(*) into v_count from public.club_event_registrations
  where event_id = p_event_id and status = 'registered';
  v_status := case when v_event.capacity is null or v_count < v_event.capacity then 'registered' else 'waitlisted' end;

  if found then
    update public.club_event_registrations
    set status = v_status, created_at = now()
    where id = v_existing.id
    returning * into v_existing;
  else
    insert into public.club_event_registrations (event_id, application_id, status)
    values (p_event_id, v_member.id, v_status)
    returning * into v_existing;
  end if;

  return jsonb_build_object('status', v_existing.status, 'id', v_existing.id);
end;
$$;

grant execute on function public.list_public_events()                     to anon, authenticated;
grant execute on function public.register_for_event(text, text, uuid)     to anon, authenticated;

notify pgrst, 'reload schema';


-- ===== تحديث 009: كلمة مرور لحساب العضو =====

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


-- ===== تحديث 010: موعد المقابلة يظهر للطالب =====

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
