-- =====================================================================
-- تحديث 006 — تصليح سلة المحذوفات
--
-- المشكلة: دالة السلة كانت تقرأ أعمدة الجداول مباشرة (old.full_name و
-- old.ticket_number) داخل تعبير واحد. PostgreSQL يتحقق من كل الأعمدة
-- المذكورة حتى لو كان الجدول لا يملكها، فيفشل الحذف برسالة:
--   record "old" has no field "ticket_number"
-- الحل: قراءة القيم من نسخة JSON من السجل، فتعمل مع كل الجداول.
--
-- شغّل هذا الملف كاملاً في SQL Editor.
-- =====================================================================

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

  v_title := case tg_table_name
    when 'club_applications' then 'طلب: '   || coalesce(v_row->>'full_name', '')
    when 'club_complaints'   then 'شكوى: '  || coalesce(v_row->>'ticket_number', '')
    else                          'فعالية: ' || coalesce(v_row->>'title', '') end;

  insert into public.club_trash (entity_type, entity_id, title, payload, deleted_by, deleted_by_email)
  values (v_type, v_row->>'id', v_title, v_row, auth.uid(), auth.jwt()->>'email');

  return old;
end;
$$;

-- إعادة ربط المُشغِّلات للاطمئنان أنها كلها على النسخة الجديدة
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

notify pgrst, 'reload schema';
