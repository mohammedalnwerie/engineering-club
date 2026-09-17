import { dataService } from './dataService';
import { getSupabase } from './supabaseClient';
import { effectiveCommittee } from '../data/committees';
import type { StoredApplication } from '../types';

export const emailService = {
  formatAcceptanceEmail(app: StoredApplication) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://engineering-club-phi.vercel.app';
    const verifyUrl = `${origin}/?verify=${encodeURIComponent(app.studentId || app.id)}`;
    const authCode = `UP-ENG-${(app.id || 'VALID').slice(-8).toUpperCase()}`;

    const subject = `تهانينا يا م. ${app.fullName}! تم قبول عضويتك في النادي الهندسي — جامعة فلسطين 🎓`;
    const body = `السلام عليكم ورحمة الله وبركاته،

الزميل المهندس / الزميلة المهندسة: ${app.fullName} المحترمـ/ـة
تحية طيبة وبعد،،

يسر مجلس إدارة النادي الهندسي في جامعة فلسطين أن يهنئك بقبول طلب انضمامك رسمياً لعضوية النادي ضمن "${effectiveCommittee(app)}" للعام الجامعي 2026.

لقد تم اعتماد وإصدار بطاقة عضويتك الرقمية الرسمية وتوثيقها في سجلات النادي بكود توثيق فريد:
• كود الاعتماد الرسمي: ${authCode}
• الكلية: ${app.college}
• التخصص: ${app.major}
• الرقم الجامعي: ${app.studentId}

🔗 يمكنك استعراض وتحميل بطاقة عضويتك الرقمية الرسمية (PNG/PDF) فوراً عبر الرابط التالي:
${verifyUrl}

نرحب بك عضواً فاعلاً في مجتمع مهندسي الغد، ونتطلع لمشاركتك وإبداعاتك معنا في الأنشطة القادمة.

مع خالص التحيات والتقدير،
الهيئة الإدارية — النادي الهندسي
جامعة فلسطين
${origin}
`;

    return { subject, body, verifyUrl, authCode };
  },

  formatWhatsAppMessage(app: StoredApplication) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://engineering-club-phi.vercel.app';
    const verifyUrl = `${origin}/?verify=${encodeURIComponent(app.studentId || app.id)}`;
    const authCode = `UP-ENG-${(app.id || 'VALID').slice(-8).toUpperCase()}`;

    const message = `🎉 *تهانينا يا م. ${app.fullName}!*
يسر إدارة *النادي الهندسي بجامعة فلسطين* إعلامك بقبول عضويتك رسمياً ضمن *${effectiveCommittee(app)}*.

🪪 *تم إصدار بطاقة عضويتك الرقمية المعتمدة رسمياً:*
• كود التوثيق: ${authCode}
• الكلية: ${app.college}
• التخصص: ${app.major}

🔗 *رابط استعراض وتحميل البطاقة الرسمية:*
${verifyUrl}

أهلاً بك معنا في صُنع أثر الغد! 🚀
*الهيئة الإدارية — النادي الهندسي*
*جامعة فلسطين*`;

    return { message, verifyUrl, authCode };
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
