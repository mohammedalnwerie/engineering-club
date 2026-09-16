import { safeStorage } from './safeStorage';
import type { StoredApplication } from '../types';

export interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
  senderEmail: string;
  customMessageTemplate?: string;
}

const EMAIL_CONFIG_KEY = 'eng_club_email_config_v1';

export const emailService = {
  getConfig(): EmailConfig {
    return safeStorage.get<EmailConfig>(EMAIL_CONFIG_KEY, {
      serviceId: '',
      templateId: '',
      publicKey: '',
      senderEmail: 'eng.club@up.edu.ps',
      customMessageTemplate: '',
    });
  },

  saveConfig(config: EmailConfig) {
    safeStorage.set(EMAIL_CONFIG_KEY, config);
  },

  formatAcceptanceEmail(app: StoredApplication) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://engineering-club-phi.vercel.app';
    const verifyUrl = `${origin}/?verify=${encodeURIComponent(app.studentId || app.id)}`;
    const authCode = `UP-ENG-${(app.id || 'VALID').slice(-8).toUpperCase()}`;

    const subject = `تهانينا يا م. ${app.fullName}! تم قبول عضويتك في النادي الهندسي — جامعة فلسطين 🎓`;
    const body = `السلام عليكم ورحمة الله وبركاته،

الزميل المهندس / الزميلة المهندسة: ${app.fullName} المحترمـ/ـة
تحية طيبة وبعد،،

يسر مجلس إدارة النادي الهندسي في جامعة فلسطين أن يهنئك بقبول طلب انضمامك رسمياً لعضوية النادي ضمن "${app.targetCommittee}" للعام الجامعي 2026.

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
يسر إدارة *النادي الهندسي بجامعة فلسطين* إعلامك بقبول عضويتك رسمياً ضمن *${app.targetCommittee}*.

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

  async sendAutomatedEmail(app: StoredApplication): Promise<{ success: boolean; message: string }> {
    const config = this.getConfig();
    if (!config.serviceId || !config.templateId || !config.publicKey) {
      return {
        success: false,
        message: 'إعدادات الإرسال التلقائي عبر EmailJS غير مكتملة بعد. يرجى إدخال (Service ID, Template ID, Public Key) في تبويب الإعدادات أو استخدام خيار "إرسال عبر Gmail" الفوري.'
      };
    }

    const { verifyUrl, authCode, subject } = this.formatAcceptanceEmail(app);

    try {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: config.serviceId,
          template_id: config.templateId,
          user_id: config.publicKey,
          template_params: {
            to_name: app.fullName,
            to_email: app.email,
            student_id: app.studentId,
            college: app.college,
            major: app.major,
            committee: app.targetCommittee,
            auth_code: authCode,
            verify_url: verifyUrl,
            subject: subject,
            club_email: config.senderEmail || 'eng.club@up.edu.ps',
          }
        })
      });

      if (res.ok) {
        return { success: true, message: `تم إرسال إيميل القبول والبطاقة بنجاح إلى (${app.email})!` };
      } else {
        const errText = await res.text();
        return { success: false, message: `فشل الإرسال التلقائي: ${errText}` };
      }
    } catch (err: unknown) {
      return { success: false, message: `تعذر الاتصال بخدمة الإيميل: ${err instanceof Error ? err.message : 'خطأ غير معروف'}` };
    }
  }
};
