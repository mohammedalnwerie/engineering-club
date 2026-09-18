import { dataService } from './dataService';
import { getSupabase } from './supabaseClient';
import { effectiveCommittee } from '../data/committees';
import type { StoredApplication } from '../types';

export const emailService = {
  formatAcceptanceEmail(app: StoredApplication) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://engineering-club-phi.vercel.app';
    const verifyUrl = `${origin}/?verify=${encodeURIComponent(app.studentId || app.id)}`;
    const accountUrl = `${origin}/?member=1`;
    const memberCode = app.memberCode || `UP-MEM-${(app.studentId || app.id || '00123').slice(-5)}`;
    const committee = effectiveCommittee(app);
    const validUntilStr = app.validUntil
      ? new Date(app.validUntil).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';

    const subject = `تهانينا يا م. ${app.fullName}! تم قبول عضويتك في النادي الهندسي — جامعة فلسطين 🎓`;
    const body = `السلام عليكم ورحمة الله وبركاته،

الزميل المهندس / الزميلة المهندسة: ${app.fullName} المحترمـ/ـة
تحية طيبة وبعد،،

يسر مجلس إدارة النادي الهندسي في جامعة فلسطين أن يهنئك بقبول طلب انضمامك رسمياً لعضوية النادي ضمن "${committee}"${app.organizationalRole ? ` بمسمى (${app.organizationalRole})` : ''} للعام الجامعي 2026/2027.

🪪 بيانات عضويتك واعتمادك الرسمي:
• رمز العضو / كود الدخول الأول: ${memberCode}
• الرقم الجامعي: ${app.studentId}
• الكلية: ${app.college}
• التخصص: ${app.major}
${validUntilStr ? `• صلاحية البطاقة الأولى: حتى ${validUntilStr} (يمكنك تجديدها لاحقاً إلى عضوية فصلية من حسابك)\n` : ''}
🔐 خطوتك الأولى — تفعيل حسابك وتعيين كلمة المرور:
ادخل إلى صفحة «حسابي» برقمك الجامعي ورمز العضو أعلاه، لتعيين كلمة مرور خاصة بك، والتسجيل في الورش والفعاليات ومتابعة عضويتك:
🔗 ${accountUrl}

📇 رابط استعراض وحفظ بطاقتك الرقمية الرسمية:
🔗 ${verifyUrl}

نرحب بك عضواً فاعلاً في مجتمع مهندسي الغد، ونتطلع لمشاركتك وإبداعاتك معنا في الأنشطة القادمة.

مع خالص التحيات والتقدير،
الهيئة الإدارية — النادي الهندسي
جامعة فلسطين
${origin}
`;

    return { subject, body, verifyUrl, authCode: memberCode, accountUrl };
  },

  formatWhatsAppMessage(app: StoredApplication) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://engineering-club-phi.vercel.app';
    const verifyUrl = `${origin}/?verify=${encodeURIComponent(app.studentId || app.id)}`;
    const accountUrl = `${origin}/?member=1`;
    const memberCode = app.memberCode || `UP-MEM-${(app.studentId || app.id || '00123').slice(-5)}`;
    const committee = effectiveCommittee(app);
    const validUntilStr = app.validUntil
      ? new Date(app.validUntil).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';

    const message = `🎉 *تهانينا يا م. ${app.fullName}!*
يسر إدارة *النادي الهندسي بجامعة فلسطين* إعلامك بقبول عضويتك رسمياً ضمن *${committee}*${app.organizationalRole ? ` بمسمى (${app.organizationalRole})` : ''}.

🪪 *بيانات عضويتك المعتمدة:*
• رمز العضو / كود الدخول الأول: *${memberCode}*
• الرقم الجامعي: ${app.studentId}
• الكلية: ${app.college}
• التخصص: ${app.major}
${validUntilStr ? `• صلاحية البطاقة الأولى: حتى ${validUntilStr}\n` : ''}
🔐 *خطوتك الأولى — تفعيل حسابك:*
ادخل إلى صفحة «حسابي» برقمك الجامعي ورمز العضو أعلاه لتعيين كلمة مرورك الخاصة والتسجيل في ورش وفعاليات النادي:
${accountUrl}

🔗 *رابط استعراض وتحميل بطاقتك الرقمية الرسمية:*
${verifyUrl}

أهلاً بك معنا في صُنع أثر الغد! 🚀
*الهيئة الإدارية — النادي الهندسي*
*جامعة فلسطين*`;

    return { message, verifyUrl, authCode: memberCode, accountUrl };
  },

  openGmailWebmail(app: StoredApplication) {
    const { subject, body } = this.formatAcceptanceEmail(app);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(app.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  },

  openDefaultMailClient(app: StoredApplication) {
    const { subject, body } = this.formatAcceptanceEmail(app);
    const mailtoUrl = `mailto:${encodeURIComponent(app.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  },

  openWhatsAppChat(app: StoredApplication) {
    const { message } = this.formatWhatsAppMessage(app);
    let rawPhone = (app.phone || '').replace(/\D/g, '');
    
    // Auto format Palestinian mobile numbers (059, 056) to international format
    if (rawPhone.startsWith('059') || rawPhone.startsWith('056')) {
      rawPhone = '970' + rawPhone.substring(1);
    } else if (rawPhone.startsWith('59') || rawPhone.startsWith('56')) {
      rawPhone = '970' + rawPhone;
    }

    const waUrl = `https://api.whatsapp.com/send?phone=${rawPhone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  },

  /** The interview invitation the admin sends by WhatsApp or Gmail after scheduling. */
  formatInterviewMessage(app: StoredApplication) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://engineering-club-phi.vercel.app';
    const when = app.interviewAt
      ? new Date(app.interviewAt).toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' })
      : '';
    const hour =
      app.interviewAt && !app.interviewTimeTbd
        ? new Date(app.interviewAt).toLocaleTimeString('ar', { hour: 'numeric', minute: '2-digit' })
        : '';

    const line = !when
      ? 'رح نتواصل معك قريباً لتحديد موعد المقابلة.'
      : hour
        ? `موعد مقابلتك: ${when} الساعة ${hour}.`
        : `موعد مقابلتك: ${when}. الساعة رح نتفق عليها بالتواصل معك.`;

    const subject = `موعد مقابلة الانضمام — النادي الهندسي، جامعة فلسطين`;
    const body = `مرحباً ${app.fullName},

وصلنا طلب انضمامك إلى ${effectiveCommittee(app)}، وحابين نتعرف عليك بمقابلة قصيرة.

${line}

تقدر تتابع حالة طلبك في أي وقت من صفحة «التحقق من العضوية»:
${origin}/?verify=${encodeURIComponent(app.studentId || app.id)}

إذا الموعد ما بناسبك، ردّ على هذه الرسالة ونرتب غيره.

إدارة النادي الهندسي — جامعة فلسطين`;

    return { subject, body, line };
  },

  openInterviewWhatsApp(app: StoredApplication) {
    const { line } = this.formatInterviewMessage(app);
    let rawPhone = (app.phone || '').replace(/\D/g, '');
    if (rawPhone.startsWith('059') || rawPhone.startsWith('056')) rawPhone = '970' + rawPhone.substring(1);
    else if (rawPhone.startsWith('59') || rawPhone.startsWith('56')) rawPhone = '970' + rawPhone;

    const message = `مرحباً ${app.fullName} 👋
من *النادي الهندسي — جامعة فلسطين*.
${line}
إذا الموعد ما بناسبك ردّ علينا ونرتب غيره.`;
    window.open(`https://api.whatsapp.com/send?phone=${rawPhone}&text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  },

  openInterviewGmail(app: StoredApplication) {
    const { subject, body } = this.formatInterviewMessage(app);
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(app.email)}&su=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  /** Sends the acceptance email from the club's Gmail via the send-acceptance-email Edge Function. */
  async sendAcceptanceEmail(app: StoredApplication): Promise<{ success: boolean; message: string; sentAt?: string }> {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.functions.invoke('send-acceptance-email', {
        body: { applicationId: app.id },
      });
      if (error) {
        let message = error.message;
        const response = (error as { context?: Response }).context;
        if (response && typeof response.json === 'function') {
          const body = await response.json().catch(() => null);
          if (body?.error) message = body.error;
        }
        if (/Failed to send a request|Function not found|404/i.test(message)) {
          message = 'خدمة إرسال الإيميل غير مفعّلة بعد في Supabase (send-acceptance-email).';
        }
        return { success: false, message };
      }
      dataService.markAcceptanceEmailSent(app.id, data.sentAt);
      return { success: true, message: `تم إرسال إيميل القبول إلى ${data.to}`, sentAt: data.sentAt };
    } catch (err) {
      return { success: false, message: `تعذر الإرسال: ${err instanceof Error ? err.message : 'خطأ غير معروف'}` };
    }
  },
};
