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

const formatCustomBodyHtml = (rawBody: string) => {
  const paragraphs = rawBody.split(/\n\s*\n/);
  return paragraphs
    .map((p) => {
      const lines = p.split('\n');
      const formattedLines = lines.map((l) => {
        let escaped = escapeHtml(l.trim());
        // Auto link URLs safely
        escaped = escaped.replace(
          /(https?:\/\/[^\s<]+)/g,
          '<a href="$1" target="_blank" rel="noopener noreferrer" style="color:#3FE7E3;word-break:break-all;text-decoration:underline;">$1</a>'
        );
        return escaped;
      });
      return `<p style="margin:0 0 14px 0;line-height:1.9;color:#E5E7EB;font-size:14px;">${formattedLines.join('<br>')}</p>`;
    })
    .join('');
};

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

  const reqPayload = await req.json().catch(() => ({}));
  const applicationId = reqPayload.applicationId;
  const customBody = typeof reqPayload.customBody === 'string' ? reqPayload.customBody.trim() : '';
  const customSubject = typeof reqPayload.customSubject === 'string' ? reqPayload.customSubject.trim() : '';

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
  const targetCommittee = String(data.targetCommittee || '');
  const assignedCommittee = String(data.assignedCommittee || '');
  const role = String(data.organizationalRole || '');
  const verifyUrl = `${siteUrl}/?verify=${encodeURIComponent(app.student_id)}`;
  // Private member code (update-005). Older databases fall back to the legacy public code.
  const memberCode = String(app.member_code || `UP-ENG-${String(app.id).slice(-8).toUpperCase()}`);
  const accountUrl = `${siteUrl}/?member=1`;
  const validUntil = app.valid_until
    ? new Date(app.valid_until).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const isGeneral = !committee || committee.includes('عامة');
  const isTransferred = Boolean(
    targetCommittee &&
      !targetCommittee.includes('عامة') &&
      (!assignedCommittee || assignedCommittee.includes('عامة'))
  );
  const isExecutive =
    role.includes('رئيس') ||
    role.includes('مسؤول') ||
    role.includes('ممثل') ||
    role.includes('نائب') ||
    app.membership_type === 'executive';

  // Determine Subject
  let subject = customSubject;
  if (!subject) {
    if (isExecutive) {
      subject = `اعتماد التكليف القيادي للمهندس/ـة ${app.full_name} — النادي الهندسي بجامعة فلسطين 🏛️`;
    } else if (isTransferred) {
      subject = `اعتماد انضمامك إلى النادي الهندسي — جامعة فلسطين 🎓`;
    } else {
      subject = `تهانينا يا م. ${app.full_name}! تم قبول عضويتك في النادي الهندسي — جامعة فلسطين 🎓`;
    }
  }

  // Row helper for cardlet table
  const row = (label: string, value: string) =>
    value
      ? `<tr><td style="padding:7px 0;color:#9CA3AF;font-size:13px;width:35%;">${label}</td><td style="padding:7px 0;color:#FFFFFF;font-size:14px;font-weight:700;text-align:left;direction:ltr;">${escapeHtml(value)}</td></tr>`
      : '';

  const cardletTable = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.1);border-bottom:1px solid rgba(255,255,255,0.1);margin-top:16px;">
      ${row('الاسم', app.full_name)}
      ${row('الرقم الجامعي', app.student_id)}
      ${row('رمز الدخول الأول', memberCode)}
      ${row(isGeneral ? 'نوع العضوية' : 'اللجنة', isGeneral ? 'عضوية عامة (عضو بالنادي)' : committee)}
      ${role ? row('المسمى', role) : ''}
      ${validUntil ? row('صلاحية البطاقة', `صالحة حتى ${validUntil}`) : ''}
    </table>
  `;

  let text = '';
  let mainHtmlContent = '';

  if (customBody) {
    text = customBody;
    mainHtmlContent = `
      <div style="text-align:right;">
        ${formatCustomBodyHtml(customBody)}
      </div>
    `;
  } else {
    // Default / Fallback text and html
    if (isTransferred) {
      text = [
        `السلام عليكم ورحمة الله وبركاته،`,
        '',
        `الزميل المهندس / الزميلة المهندسة: ${app.full_name} المحترمـ/ـة`,
        'تحية طيبة وبعد،،',
        '',
        `نظراً للإقبال الكبير ومحدودية المقاعد التنظيمية المتاحة في (${targetCommittee}) واشتداد التنافس، يسر إدارة النادي الهندسي في جامعة فلسطين إعلامك باعتماد قبول عضويتك كـ "عضو في النادي الهندسي — عضوية عامة" للعام الجامعي 2026/2027.`,
        '',
        'يسعدنا ويشرفنا انضمامك إلينا للمشاركة في كافة الفعاليات وورش العمل والبرامج الهندسية المتخصصة، واكتساب الخبرات الميدانية لتكون في طليعة المرشحين للجان التنفيذية في الفترات القادمة.',
        '',
        '🪪 بيانات بطاقتك وعضويتك:',
        `• رمز العضو / كود الدخول الأول: ${memberCode}`,
        `• الرقم الجامعي: ${app.student_id}`,
        '• نوع العضوية: عضوية عامة (عضو بالنادي)',
        validUntil ? `• صلاحية البطاقة: حتى ${validUntil}` : '',
        '',
        '🔐 خطوتك الأولى — تفعيل حسابك:',
        `ادخل إلى صفحة «حسابي» برقمك الجامعي والرمز أعلاه لتعيين كلمة مرور خاصة بك:`,
        accountUrl,
        '',
        '📇 رابط استعراض وحفظ بطاقتك الرقمية الرسمية:',
        verifyUrl,
        '',
        'مع خالص التحيات والتقدير،',
        'مجلس إدارة النادي الهندسي — جامعة فلسطين',
      ]
        .filter((l, i, all) => l !== '' || all[i - 1] !== '')
        .join('\n');

      mainHtmlContent = `
        <h1 style="margin:0;color:#FFFFFF;font-size:22px;text-align:right;">اعتماد العضوية في النادي الهندسي 🎓</h1>
        <p style="margin:14px 0 0;color:#D1D5DB;font-size:15px;line-height:1.9;text-align:right;">
          مرحباً بالزميل المهندس / الزميلة المهندسة: <strong style="color:#FFFFFF;">${escapeHtml(app.full_name)}</strong>،<br>
          نظراً للإقبال الكبير ومحدودية المقاعد التنظيمية المتاحة في (<strong style="color:#3FE7E3;">${escapeHtml(targetCommittee)}</strong>) واشتداد التنافس، يسر إدارة النادي الهندسي في جامعة فلسطين إعلامك باعتماد قبول عضويتك كـ <strong style="color:#FFFFFF;">"عضو في النادي الهندسي — عضوية عامة"</strong> للعام الجامعي 2026/2027.
        </p>
        <p style="margin:12px 0 0;color:#D1D5DB;font-size:14px;line-height:1.9;text-align:right;">
          يسعدنا ويشرفنا انضمامك إلينا للمشاركة في كافة الفعاليات وورش العمل والمسابقات الهندسية، واكتساب الخبرات الميدانية لتكون في طليعة المرشحين للجان التنفيذية في الفترات القادمة.
        </p>
      `;
    } else if (isExecutive) {
      text = [
        `السلام عليكم ورحمة الله وبركاته،`,
        '',
        `حضرة الزميل القائد / الزميلة القائدة: ${app.full_name} المحترمـ/ـة`,
        'تحية طيبة وبعد،،',
        '',
        `بقرار من مجلس إدارة النادي الهندسي في جامعة فلسطين، يسرنا إبلاغك باعتماد تكليفك الرسمي عضواً في الكادر القيادي للنادي ضمن "${committee}"${role ? ` بمسمى (${role})` : ''} للدورة النقابية والأكاديمية 2026/2027.`,
        '',
        '🪪 بيانات التكليف والاعتماد القيادي:',
        `• رمز الاعتماد / كود الدخول الأول: ${memberCode}`,
        `• الرقم الجامعي: ${app.student_id}`,
        `• المنصب والتكليف: ${role || 'قيادي باللجنة'}`,
        `• اللجنة: ${committee}`,
        validUntil ? `• صلاحية البطاقة: حتى ${validUntil}` : '',
        '',
        '🔐 تفعيل الحساب القيادي:',
        `سجّل الدخول إلى بوابة «حسابي» بالرقم الجامعي والرمز لتفعيل الحساب ومتابعة المهام:`,
        accountUrl,
        '',
        '📇 بطاقة التكليف والاعتماد القيادي الرقمية:',
        verifyUrl,
        '',
        'مجلس إدارة النادي الهندسي — جامعة فلسطين',
      ]
        .filter((l, i, all) => l !== '' || all[i - 1] !== '')
        .join('\n');

      mainHtmlContent = `
        <h1 style="margin:0;color:#FFFFFF;font-size:22px;text-align:right;">اعتماد التكليف القيادي 🏛️</h1>
        <p style="margin:14px 0 0;color:#D1D5DB;font-size:15px;line-height:1.9;text-align:right;">
          حضرة الزميل القائد / الزميلة القائدة: <strong style="color:#FFFFFF;">${escapeHtml(app.full_name)}</strong>،<br>
          بقرار من مجلس إدارة النادي الهندسي في جامعة فلسطين، يسرنا إبلاغك باعتماد تكليفك الرسمي عضواً في الكادر القيادي للنادي ضمن <strong style="color:#3FE7E3;">"${escapeHtml(committee)}"${role ? ` بمسمى (${escapeHtml(role)})` : ''}</strong> للدورة 2026/2027.
        </p>
      `;
    } else {
      text = [
        `مرحباً ${app.full_name}،`,
        '',
        'يسر إدارة النادي الهندسي في جامعة فلسطين إبلاغك بقبول طلب انضمامك رسمياً لعضوية النادي للعام الجامعي 2026/2027.',
        isGeneral ? 'نوع العضوية: عضوية عامة' : `اللجنة: ${committee}`,
        role ? `المسمى: ${role}` : '',
        `رمز الدخول الأول: ${memberCode}`,
        validUntil ? `صلاحية البطاقة: صالحة حتى ${validUntil}` : '',
        '',
        `رابط بطاقة عضويتك الرقمية: ${verifyUrl}`,
        `بوابة حسابي لتفعيل الحساب وتعيين كلمة المرور: ${accountUrl}`,
        '',
        'أهلاً بك معنا،',
        'مجلس إدارة النادي الهندسي — جامعة فلسطين',
      ]
        .filter((l, i, all) => l !== '' || all[i - 1] !== '')
        .join('\n');

      mainHtmlContent = `
        <h1 style="margin:0;color:#FFFFFF;font-size:22px;text-align:right;">تم قبول عضويتك 🎉</h1>
        <p style="margin:14px 0 0;color:#D1D5DB;font-size:15px;line-height:1.9;text-align:right;">
          مرحباً <strong style="color:#FFFFFF;">${escapeHtml(app.full_name)}</strong>،<br>
          يسر إدارة النادي الهندسي في جامعة فلسطين إبلاغك بقبول طلب انضمامك رسمياً لعضوية النادي للعام الجامعي 2026/2027. نرحب بك عضواً فاعلاً في مجتمع مهندسي الغد!
        </p>
      `;
    }
  }

  const html = `<!doctype html>
<html dir="rtl" lang="ar">
<body style="margin:0;padding:24px;background:#08041D;font-family:Tahoma,Arial,sans-serif;direction:rtl;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;margin:0 auto;background:#120A36;border:1px solid rgba(255,255,255,0.1);border-radius:20px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.5);">
    <tr><td style="height:6px;background:linear-gradient(to left,#7F1AB2,#3FE7E3,#35BC2B);"></td></tr>
    <tr><td style="padding:26px 28px 12px;text-align:right;">
      <div style="color:#FFFFFF;font-size:19px;font-weight:800;letter-spacing:0.5px;">النادي الهندسي</div>
      <div style="color:#9CA3AF;font-size:13px;margin-top:2px;">جامعة فلسطين — Faculty of Engineering & IT</div>
    </td></tr>

    <tr><td style="padding:16px 28px 0;text-align:right;">
      ${mainHtmlContent}
    </td></tr>

    <tr><td style="padding:16px 28px 0;">
      ${cardletTable}
    </td></tr>

    <tr><td style="padding:24px 28px 16px;text-align:center;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding-bottom:10px;">
            <a href="${escapeHtml(verifyUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:linear-gradient(135deg,#7F1AB2,#5B1082);color:#FFFFFF;text-decoration:none;font-weight:700;font-size:15px;padding:13px 28px;border-radius:12px;border:1px solid rgba(255,255,255,0.2);box-shadow:0 4px 15px rgba(127,26,178,0.4);">
              🪪 استعراض بطاقة العضوية الرقمية
            </a>
          </td>
        </tr>
      </table>
      <p style="margin:8px 0 0;color:#9CA3AF;font-size:12px;">يمكنك حفظ البطاقة كصورة عالية الدقة أو طباعتها من نفس الرابط.</p>
    </td></tr>

    <tr><td style="padding:0 28px 24px;text-align:right;">
      <div style="padding:16px;border-radius:14px;background:rgba(127,26,178,0.15);border:1px solid rgba(162,108,198,0.35);color:#E5E7EB;font-size:13px;line-height:1.9;">
        <strong style="color:#FFFFFF;font-size:14px;">🔐 تفعيل الحساب وبوابة «حسابي»:</strong><br>
        استخدم <strong style="color:#3FE7E3;">رقمك الجامعي</strong> و<strong style="color:#3FE7E3;">رمز الدخول الأول</strong> أعلاه لتسجيل الدخول إلى بوابة «حسابي»، وتعيين كلمة مرور خاصة بك، ومتابعة ورش العمل والفعاليات القادمة.
        <div style="margin-top:10px;">
          <a href="${escapeHtml(accountUrl)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;color:#3FE7E3;font-weight:700;text-decoration:underline;">
            الدخول إلى بوابة حسابي ←
          </a>
        </div>
      </div>
    </td></tr>

    <tr><td style="padding:16px 28px 24px;border-top:1px solid rgba(255,255,255,0.08);color:#9CA3AF;font-size:12px;text-align:right;line-height:1.6;">
      مجلس إدارة النادي الهندسي — جامعة فلسطين<br>
      <span style="font-size:11px;color:#6B7280;">هذا بريد إلكتروني رسمي وموثق صادر عن منصة النادي الهندسي في جامعة فلسطين.</span>
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
