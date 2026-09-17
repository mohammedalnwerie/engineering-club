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
