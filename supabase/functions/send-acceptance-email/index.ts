// Supabase Edge Function: sends the membership acceptance email from the club's Gmail account.
//
// Deploy: Supabase Dashboard → Edge Functions → Deploy a new function → Via editor
//         name: send-acceptance-email → paste this file → Deploy
// Secrets (Edge Functions → Secrets):
//   GMAIL_USER          the club Gmail address, e.g. upengclub@gmail.com
//   GMAIL_APP_PASSWORD  16-character Google App Password (not the normal password)
//   SITE_URL            optional, defaults to https://engineering-club-phi.vercel.app
//
// Only signed-in club admins can call it; the application must already be accepted.

import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6.9.16';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'يجب تسجيل الدخول كمشرف' }, 401);

  // Projects on the new API-key system may expose the publishable key instead of the legacy anon key.
  const publicKey =
    Deno.env.get('SUPABASE_ANON_KEY') ||
    Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ||
    req.headers.get('apikey') ||
    '';

  // Acts as the calling admin, so row-level security still applies.
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, publicKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: isAdmin } = await supabase.rpc('is_club_admin');
  if (isAdmin !== true) return json({ error: 'هذا الحساب لا يملك صلاحية الإدارة' }, 403);

  const { applicationId } = await req.json().catch(() => ({ applicationId: null }));
  if (!applicationId) return json({ error: 'رقم الطلب مفقود' }, 400);

  const { data: app, error } = await supabase.from('club_applications').select('*').eq('id', applicationId).maybeSingle();
  if (error || !app) return json({ error: 'لم يتم العثور على الطلب' }, 404);
  if (app.status !== 'تم القبول') return json({ error: 'لا يمكن إرسال إيميل القبول قبل قبول الطالب' }, 400);
  if (!app.email) return json({ error: 'لا يوجد بريد إلكتروني مسجل لهذا الطالب' }, 400);
  if (!/^[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/.test(app.email) || /\.\./.test(app.email)) {
    return json({ error: `عنوان البريد (${app.email}) غير صحيح. صحّحه من زر "تعديل الإيميل" ثم أعد الإرسال.` }, 400);
  }

  const gmailUser = Deno.env.get('GMAIL_USER');
  const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD')?.replace(/\s+/g, '');
  if (!gmailUser || !gmailPassword) {
    return json({ error: 'لم يتم إعداد إيميل النادي بعد (GMAIL_USER و GMAIL_APP_PASSWORD في Supabase)' }, 500);
  }

  const siteUrl = (Deno.env.get('SITE_URL') || 'https://engineering-club-phi.vercel.app').replace(/\/$/, '');
  const data = (app.data || {}) as Record<string, unknown>;
  const committee = String(data.assignedCommittee || data.targetCommittee || '');
  const role = String(data.organizationalRole || '');
  const verifyUrl = `${siteUrl}/?verify=${encodeURIComponent(app.student_id)}`;
  // Private member code (update-005). Older databases fall back to the legacy public code.
  const memberCode = String(app.member_code || `UP-ENG-${String(app.id).slice(-8).toUpperCase()}`);
  const accountUrl = `${siteUrl}/?member=1`;
  const { data: membershipRow } = await supabase.from('club_content').select('value').eq('key', 'membership').maybeSingle();
  const membership = (membershipRow?.value || {}) as Record<string, unknown>;
  const fee = membership.semesterFee ?? 20;
  const currency = String(membership.currency || '₪');
  const validUntil = app.valid_until
    ? new Date(app.valid_until).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const isGeneral = !committee || committee.includes('عامة');

  const subject = `تم قبول عضويتك في النادي الهندسي — جامعة فلسطين`;

  const text = [
    `مرحباً ${app.full_name}،`,
    '',
    'يسعدنا إبلاغك بقبول طلب انضمامك إلى النادي الهندسي في جامعة فلسطين.',
    isGeneral ? 'نوع العضوية: عضوية عامة' : `اللجنة: ${committee}`,
    role ? `المسمى: ${role}` : '',
    `رمز العضو (سري): ${memberCode}`,
    validUntil ? `بطاقتك مؤقتة وصالحة حتى ${validUntil}. بعدها اطلب العضوية الفصلية (${fee} ${currency}) من صفحة حسابي: ${accountUrl}` : '',
    '',
    `بطاقة عضويتك الرقمية: ${verifyUrl}`,
    '',
    'أهلاً بك معنا،',
    'إدارة النادي الهندسي — جامعة فلسطين',
  ]
    .filter((line, i, all) => line !== '' || all[i - 1] !== '')
    .join('\n');

  const row = (label: string, value: string) =>
    value
      ? `<tr><td style="padding:6px 0;color:#9CA3AF;font-size:14px;">${label}</td><td style="padding:6px 0;color:#FFFFFF;font-size:14px;font-weight:700;text-align:left;">${escapeHtml(value)}</td></tr>`
      : '';

  const html = `<!doctype html>
<html dir="rtl" lang="ar">
<body style="margin:0;padding:24px;background:#08041D;font-family:Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#120A36;border:1px solid rgba(255,255,255,0.1);border-radius:20px;overflow:hidden;">
    <tr><td style="height:6px;background:linear-gradient(to left,#7F1AB2,#3FE7E3,#35BC2B);"></td></tr>
    <tr><td style="padding:28px 28px 8px;text-align:right;">
      <div style="color:#FFFFFF;font-size:18px;font-weight:800;">النادي الهندسي</div>
      <div style="color:#9CA3AF;font-size:13px;margin-top:2px;">جامعة فلسطين</div>
    </td></tr>
    <tr><td style="padding:16px 28px 0;text-align:right;">
      <h1 style="margin:0;color:#FFFFFF;font-size:22px;">تم قبول عضويتك 🎉</h1>
      <p style="margin:12px 0 0;color:#D1D5DB;font-size:15px;line-height:1.8;">
        مرحباً <strong style="color:#FFFFFF;">${escapeHtml(app.full_name)}</strong>،<br>
        يسعدنا إبلاغك بقبول طلب انضمامك إلى النادي الهندسي في جامعة فلسطين.
      </p>
    </td></tr>
    <tr><td style="padding:20px 28px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.1);border-bottom:1px solid rgba(255,255,255,0.1);">
        ${row(isGeneral ? 'نوع العضوية' : 'اللجنة', isGeneral ? 'عضوية عامة' : committee)}
        ${row('المسمى', role)}
        ${row('الرقم الجامعي', app.student_id)}
        ${row('رمز العضو', memberCode)}
        ${row('صلاحية البطاقة', validUntil ? `مؤقتة حتى ${validUntil}` : '')}
      </table>
    </td></tr>
    <tr><td style="padding:24px 28px;text-align:center;">
      <a href="${escapeHtml(verifyUrl)}" style="display:inline-block;background:#7F1AB2;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:12px;">عرض بطاقة العضوية</a>
      <p style="margin:14px 0 0;color:#9CA3AF;font-size:12px;">يمكنك حفظ البطاقة كصورة أو طباعتها من نفس الصفحة.</p>
    </td></tr>
    <tr><td style="padding:0 28px 24px;text-align:right;">
      <div style="padding:16px;border-radius:14px;background:rgba(127,26,178,0.15);border:1px solid rgba(162,108,198,0.4);color:#E5E7EB;font-size:14px;line-height:1.9;">
        <strong style="color:#FFFFFF;">رمز العضو سري — لا تشاركه مع أحد.</strong><br>
        تستخدمه مع رقمك الجامعي لدخول <strong style="color:#FFFFFF;">حسابي</strong> والتسجيل في الورش والدورات والهاكاثونات.
        ${validUntil ? `<br>بطاقتك الحالية <strong style="color:#FFFFFF;">مؤقتة حتى ${escapeHtml(validUntil)}</strong>، وبعدها يمكنك طلب <strong style="color:#FFFFFF;">العضوية الفصلية (${escapeHtml(fee)} ${escapeHtml(currency)})</strong> من صفحة حسابي.` : ''}
        <div style="margin-top:12px;"><a href="${escapeHtml(accountUrl)}" style="color:#98F7F1;">الدخول إلى حسابي</a></div>
      </div>
    </td></tr>
    <tr><td style="padding:16px 28px 24px;border-top:1px solid rgba(255,255,255,0.1);color:#9CA3AF;font-size:12px;text-align:right;">
      إدارة النادي الهندسي — جامعة فلسطين
    </td></tr>
  </table>
</body>
</html>`;

  // Supabase blocks outbound port 587, so use Gmail's SSL port 465.
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: gmailPassword },
  });

  try {
    await transporter.sendMail({
      from: `"النادي الهندسي — جامعة فلسطين" <${gmailUser}>`,
      to: app.email,
      subject,
      text,
      html,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const hint = /Invalid login|Username and Password not accepted|535/i.test(message)
      ? 'Gmail رفض تسجيل الدخول. تأكد من GMAIL_USER ومن كلمة مرور التطبيق.'
      : /5\.1\.[0-9]|recipient|not a valid|does not exist|user unknown/i.test(message)
        ? `عنوان البريد (${app.email}) غير صحيح أو غير موجود. صحّحه من زر "تعديل الإيميل" ثم أعد الإرسال.`
        : /quota|limit|4\.7\.0|5\.4\.5/i.test(message)
          ? 'تجاوز إيميل النادي حد الإرسال اليومي في Gmail. حاول بعد ساعات.'
          : `فشل الإرسال: ${message}`;
    return json({ error: hint }, 502);
  }

  const sentAt = new Date().toISOString();
  await supabase
    .from('club_applications')
    .update({ data: { ...data, acceptanceEmailSentAt: sentAt } })
    .eq('id', app.id);

  return json({ ok: true, sentAt, to: app.email });
});
