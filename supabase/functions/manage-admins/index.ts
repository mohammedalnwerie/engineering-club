// Supabase Edge Function: manages dashboard accounts (invite, change role, remove, password reset).
//
// Deploy: Supabase Dashboard → Edge Functions → Deploy a new function → Via editor
//         name: manage-admins → paste this file → Deploy
// Uses the same secrets as send-acceptance-email (GMAIL_USER, GMAIL_APP_PASSWORD, SITE_URL).
// SUPABASE_URL and the service role key are provided by Supabase automatically.
//
// Roles: owner | vp_admin | tech_support (full access) · media (media committee only)

import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.16';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ROLES = ['owner', 'vp_admin', 'tech_support', 'media'] as const;
type Role = (typeof ROLES)[number];
const FULL_ACCESS: Role[] = ['owner', 'vp_admin', 'tech_support'];

const ROLE_LABELS: Record<Role, string> = {
  owner: 'المالك',
  vp_admin: 'نائب الشؤون الإدارية',
  tech_support: 'لجنة الدعم الفني',
  media: 'اللجنة الإعلامية',
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/;

async function sendMail(to: string, subject: string, heading: string, bodyHtml: string, buttonLabel: string, link: string) {
  const user = Deno.env.get('GMAIL_USER');
  const pass = Deno.env.get('GMAIL_APP_PASSWORD')?.replace(/\s+/g, '');
  if (!user || !pass) throw new Error('لم يتم إعداد إيميل النادي (GMAIL_USER و GMAIL_APP_PASSWORD)');

  const html = `<!doctype html><html dir="rtl" lang="ar"><body style="margin:0;padding:24px;background:#08041D;font-family:Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#120A36;border:1px solid rgba(255,255,255,0.1);border-radius:20px;overflow:hidden;">
    <tr><td style="height:6px;background:linear-gradient(to left,#7F1AB2,#3FE7E3,#35BC2B);"></td></tr>
    <tr><td style="padding:28px;text-align:right;">
      <div style="color:#9CA3AF;font-size:13px;">النادي الهندسي — جامعة فلسطين</div>
      <h1 style="margin:10px 0 0;color:#FFFFFF;font-size:21px;">${escapeHtml(heading)}</h1>
      <div style="margin-top:12px;color:#D1D5DB;font-size:15px;line-height:1.9;">${bodyHtml}</div>
      <div style="margin-top:24px;text-align:center;">
        <a href="${escapeHtml(link)}" style="display:inline-block;background:#7F1AB2;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;">${escapeHtml(buttonLabel)}</a>
      </div>
      <p style="margin:18px 0 0;color:#9CA3AF;font-size:12px;">الرابط صالح لمدة محدودة ولاستخدام مرة واحدة. إذا لم تطلب ذلك تجاهل هذه الرسالة.</p>
    </td></tr>
  </table></body></html>`;

  const transporter = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
  await transporter.sendMail({ from: `"النادي الهندسي — جامعة فلسطين" <${user}>`, to, subject, html, text: `${heading}\n\n${link}` });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_SECRET_KEY') || '';
  if (!serviceKey) return json({ error: 'مفتاح الخدمة غير متاح في Supabase' }, 500);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  const siteUrl = (Deno.env.get('SITE_URL') || 'https://engineering-club-phi.vercel.app').replace(/\/$/, '');
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || '');

  // ---- Password reset is the only action available without signing in.
  if (action === 'reset_password') {
    const email = String(body.email || '').trim().toLowerCase();
    // Always answer the same way so nobody can probe which emails are admins.
    const done = json({ ok: true, message: 'إذا كان الإيميل مسجلاً كمشرف ستصله رسالة لإعادة تعيين كلمة المرور.' });
    if (!EMAIL_PATTERN.test(email)) return done;
    const { data: row } = await admin.from('club_admins').select('user_id').eq('email', email).maybeSingle();
    if (!row) return done;
    const { data: link, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${siteUrl}/?admin=1&setup=password` },
    });
    if (!error && link?.properties?.action_link) {
      await sendMail(email, 'إعادة تعيين كلمة مرور لوحة التحكم', 'إعادة تعيين كلمة المرور',
        'طلبت إعادة تعيين كلمة مرور حسابك في لوحة تحكم النادي الهندسي.', 'تعيين كلمة مرور جديدة', link.properties.action_link)
        .catch(() => undefined);
    }
    return done;
  }

  // ---- Everything else needs a signed-in admin with full access.
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: caller } = await admin.auth.getUser(token);
  if (!caller?.user) return json({ error: 'يجب تسجيل الدخول' }, 401);

  // Look the caller up by id, then by email (older rows may predate the email column).
  let { data: callerRow, error: callerError } = await admin
    .from('club_admins').select('role, email').eq('user_id', caller.user.id).maybeSingle();
  if (!callerRow && caller.user.email) {
    const byEmail = await admin.from('club_admins').select('role, email').ilike('email', caller.user.email).maybeSingle();
    if (byEmail.data) callerRow = byEmail.data;
    callerError = callerError || byEmail.error;
  }
  const callerRole = callerRow?.role as Role | undefined;
  if (!callerRole || !FULL_ACCESS.includes(callerRole)) {
    return json({
      error: 'إدارة الحسابات متاحة للمالك ونائب الشؤون الإدارية ولجنة الدعم الفني فقط',
      // Diagnostics so a blocked owner can see why (no secrets here).
      detail: callerError?.message || (callerRow ? `الصلاحية المسجلة: ${callerRole}` : 'لا يوجد سجل لهذا الحساب في جدول المشرفين'),
      email: caller.user.email || null,
    }, 403);
  }
  const callerEmail = callerRow?.email || caller.user.email || '';

  const log = (entityId: string, summary: string, act = 'update') =>
    admin.from('club_activity_log').insert({
      actor_id: caller.user.id, actor_email: callerEmail, action: act, entity_type: 'admin', entity_id: entityId, summary,
    });

  const ownerCount = async () => {
    const { count } = await admin.from('club_admins').select('user_id', { count: 'exact', head: true }).eq('role', 'owner');
    return count || 0;
  };

  if (action === 'list') {
    const { data: rows, error } = await admin.from('club_admins').select('user_id, role, email, display_name, created_at').order('created_at');
    if (error) return json({ error: error.message }, 500);
    const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const byId = new Map((users?.users || []).map((u) => [u.id, u]));
    return json({
      admins: (rows || []).map((r) => ({
        userId: r.user_id,
        role: r.role,
        email: r.email || byId.get(r.user_id)?.email,
        displayName: r.display_name,
        createdAt: r.created_at,
        lastSignInAt: byId.get(r.user_id)?.last_sign_in_at || null,
        pending: !byId.get(r.user_id)?.last_sign_in_at,
      })),
    });
  }

  if (action === 'invite') {
    const email = String(body.email || '').trim().toLowerCase();
    const role = String(body.role || '') as Role;
    const displayName = String(body.displayName || '').trim().slice(0, 80);
    if (!EMAIL_PATTERN.test(email)) return json({ error: 'البريد الإلكتروني غير صحيح' }, 400);
    if (!ROLES.includes(role)) return json({ error: 'الدور غير صحيح' }, 400);
    if (role === 'owner' && callerRole !== 'owner') return json({ error: 'فقط المالك يستطيع إضافة مالك آخر' }, 403);

    // Existing user → magic link; new user → invite link. Both let them set a password.
    let link = await admin.auth.admin.generateLink({ type: 'invite', email, options: { redirectTo: `${siteUrl}/?admin=1&setup=password` } });
    if (link.error && /already|registered|exists/i.test(link.error.message)) {
      link = await admin.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo: `${siteUrl}/?admin=1&setup=password` } });
    }
    if (link.error || !link.data?.user) return json({ error: `تعذر إنشاء الحساب: ${link.error?.message || ''}` }, 500);

    const userId = link.data.user.id;

    // Inviting somebody who is already on the team must never change their role —
    // that once demoted the owner who invited their own address.
    const { data: existing } = await admin.from('club_admins').select('role').eq('user_id', userId).maybeSingle();
    if (existing) {
      const existingRole = existing.role as Role;
      const { error: touchError } = await admin
        .from('club_admins')
        .update({ email, display_name: displayName || null })
        .eq('user_id', userId);
      if (touchError) return json({ error: touchError.message }, 500);
      const label = ROLE_LABELS[existingRole] || existingRole;
      const note = userId === caller.user.id
        ? `هذا حسابك أنت، صلاحيته ${label} ولم تتغير.`
        : `${email} موجود في الفريق بصلاحية ${label}. غيّر صلاحيته من القائمة بجانب اسمه.`;
      return json({ ok: true, warning: note });
    }

    const { error: upsertError } = await admin
      .from('club_admins')
      .upsert({ user_id: userId, role, email, display_name: displayName || null }, { onConflict: 'user_id' });
    if (upsertError) return json({ error: upsertError.message }, 500);

    try {
      await sendMail(
        email,
        'دعوة للانضمام إلى لوحة تحكم النادي الهندسي',
        'تمت دعوتك إلى لوحة التحكم',
        `${displayName ? `مرحباً ${escapeHtml(displayName)}،<br>` : ''}تمت إضافتك إلى فريق إدارة موقع النادي الهندسي بصلاحية <strong style="color:#FFFFFF;">${ROLE_LABELS[role]}</strong>.<br>اضغط الزر لتعيين كلمة المرور والدخول.`,
        'تعيين كلمة المرور والدخول',
        link.data.properties.action_link,
      );
    } catch (err) {
      await log(userId, `إضافة المشرف ${email} (${ROLE_LABELS[role]}) — تعذر إرسال الدعوة`, 'create');
      return json({ ok: true, warning: `أُضيف الحساب لكن تعذر إرسال الإيميل: ${err instanceof Error ? err.message : ''}` });
    }
    await log(userId, `دعوة ${email} بصلاحية ${ROLE_LABELS[role]}`, 'create');
    return json({ ok: true });
  }

  if (action === 'update_role' || action === 'remove') {
    const userId = String(body.userId || '');
    const { data: target } = await admin.from('club_admins').select('role, email').eq('user_id', userId).maybeSingle();
    if (!target) return json({ error: 'الحساب غير موجود' }, 404);
    if (target.role === 'owner' && callerRole !== 'owner') return json({ error: 'فقط المالك يستطيع تعديل حساب مالك' }, 403);

    if (action === 'update_role') {
      const role = String(body.role || '') as Role;
      if (!ROLES.includes(role)) return json({ error: 'الدور غير صحيح' }, 400);
      if (role === 'owner' && callerRole !== 'owner') return json({ error: 'فقط المالك يستطيع منح صلاحية المالك' }, 403);
      if (target.role === 'owner' && role !== 'owner' && (await ownerCount()) <= 1) {
        return json({ error: 'لا يمكن إزالة آخر مالك' }, 400);
      }
      const { error } = await admin.from('club_admins').update({ role }).eq('user_id', userId);
      if (error) return json({ error: error.message }, 500);
      await log(userId, `تغيير صلاحية ${target.email} إلى ${ROLE_LABELS[role]}`);
      return json({ ok: true });
    }

    if (userId === caller.user.id) return json({ error: 'لا يمكنك حذف حسابك بنفسك' }, 400);
    if (target.role === 'owner' && (await ownerCount()) <= 1) return json({ error: 'لا يمكن حذف آخر مالك' }, 400);
    const { error } = await admin.from('club_admins').delete().eq('user_id', userId);
    if (error) return json({ error: error.message }, 500);
    await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    await log(userId, `إزالة المشرف ${target.email}`, 'delete');
    return json({ ok: true });
  }

  return json({ error: 'إجراء غير معروف' }, 400);
});
