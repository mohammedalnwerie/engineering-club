import { dataService, DEFAULT_MESSAGE_TEMPLATES } from './dataService';
import { getSupabase } from './supabaseClient';
import { effectiveCommittee, findCommittee, isExecutivePosition } from '../data/committees';
import { isExecutiveLeader } from '../utils/memberCard';
import type { StoredApplication } from '../types';

export function getAcceptanceType(app: StoredApplication): 'leadership' | 'transferred' | 'regular' {
  if (isExecutivePosition(app) || isExecutiveLeader(app) || app.membershipType === 'executive') {
    return 'leadership';
  }
  const isCommitteeApplicant = Boolean(app.targetCommittee) && !app.targetCommittee.includes('عامة');
  const isAssignedGeneral = !app.assignedCommittee || app.assignedCommittee.includes('عامة');
  if ((app as { isTransferredToGeneral?: boolean }).isTransferredToGeneral || (isCommitteeApplicant && isAssignedGeneral)) {
    return 'transferred';
  }
  return 'regular';
}

function replacePlaceholders(template: string, vars: Record<string, string>): string {
  let res = template;
  for (const [key, val] of Object.entries(vars)) {
    res = res.replace(new RegExp(`\\{${key}\\}`, 'g'), val ?? '');
  }
  return res;
}

export const emailService = {
  formatAcceptanceEmail(app: StoredApplication, customBody?: string, customSubject?: string) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://engineering-club-phi.vercel.app';
    const verifyUrl = `${origin}/?verify=${encodeURIComponent(app.studentId || app.id)}`;
    const accountUrl = `${origin}/?member=1`;
    const memberCode = app.memberCode || `UP-MEM-${(app.studentId || app.id || '00123').slice(-5)}`;
    const committee = effectiveCommittee(app);
    const isExec = isExecutiveLeader(app) || isExecutivePosition(app);
    const validUntilStr = app.validUntil
      ? new Date(app.validUntil).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    const validityLine = isExec
      ? '• صفة الاعتماد: تكليف قيادي وعضوية معتمدة للعام الأكاديمي 2026/2027\n'
      : validUntilStr
        ? `• صلاحية البطاقة: حتى ${validUntilStr} (مع إمكانية التجديد عبر صفحة حسابي)\n`
        : '';

    const templates = dataService.getMessageTemplates();
    const type = getAcceptanceType(app);

    let baseTemplate = templates.regularAcceptance || DEFAULT_MESSAGE_TEMPLATES.regularAcceptance;
    if (type === 'leadership') {
      baseTemplate = templates.leadershipAcceptance || DEFAULT_MESSAGE_TEMPLATES.leadershipAcceptance;
    } else if (type === 'transferred') {
      baseTemplate = templates.transferredAcceptance || DEFAULT_MESSAGE_TEMPLATES.transferredAcceptance;
    }

    const requestedComm = findCommittee(app.targetCommittee)?.name || app.targetCommittee || 'اللجنة المطلوبة';

    const replacements: Record<string, string> = {
      الاسم: app.fullName || '',
      الرقم_الجامعي: app.studentId || '',
      اللجنة: committee,
      المسمى: app.organizationalRole ? ` بمسمى (${app.organizationalRole})` : '',
      رمز_العضو: memberCode,
      الكلية: app.college || 'الهندسة وتكنولوجيا المعلومات',
      التخصص: app.major || '',
      الصلاحية: validityLine,
      رابط_البطاقة: verifyUrl,
      رابط_حسابي: accountUrl,
      اللجنة_المطلوبة: requestedComm,
    };

    const subject =
      customSubject ||
      (type === 'leadership'
        ? `اعتماد التكليف القيادي للمهندس/ـة ${app.fullName} — النادي الهندسي بجامعة فلسطين 🏛️`
        : type === 'transferred'
          ? `اعتماد انضمامك إلى النادي الهندسي — جامعة فلسطين 🎓`
          : `تهانينا يا م. ${app.fullName}! تم قبول عضويتك في النادي الهندسي — جامعة فلسطين 🎓`);

    const body = customBody || replacePlaceholders(baseTemplate || '', replacements);

    return { subject, body, verifyUrl, authCode: memberCode, accountUrl, type };
  },

  formatWhatsAppMessage(app: StoredApplication, customMessage?: string) {
    if (customMessage) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://engineering-club-phi.vercel.app';
      const verifyUrl = `${origin}/?verify=${encodeURIComponent(app.studentId || app.id)}`;
      const accountUrl = `${origin}/?member=1`;
      const memberCode = app.memberCode || `UP-MEM-${(app.studentId || app.id || '00123').slice(-5)}`;
      return { message: customMessage, verifyUrl, authCode: memberCode, accountUrl };
    }

    const { body, verifyUrl, authCode, accountUrl } = this.formatAcceptanceEmail(app);
    return { message: body, verifyUrl, authCode, accountUrl };
  },

  openGmailWebmail(app: StoredApplication, customSubject?: string, customBody?: string) {
    const formatted = this.formatAcceptanceEmail(app, customBody, customSubject);
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(app.email || '')}&su=${encodeURIComponent(
      formatted.subject
    )}&body=${encodeURIComponent(formatted.body)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  },

  openDefaultMailClient(app: StoredApplication, customSubject?: string, customBody?: string) {
    const formatted = this.formatAcceptanceEmail(app, customBody, customSubject);
    const mailtoUrl = `mailto:${encodeURIComponent(app.email || '')}?subject=${encodeURIComponent(
      formatted.subject
    )}&body=${encodeURIComponent(formatted.body)}`;
    window.location.href = mailtoUrl;
  },

  openWhatsAppChat(app: StoredApplication, customMessage?: string) {
    const { message } = this.formatWhatsAppMessage(app, customMessage);
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
  formatInterviewMessage(app: StoredApplication, customTemplate?: string) {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://engineering-club-phi.vercel.app';
    const when = app.interviewAt
      ? new Date(app.interviewAt).toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' })
      : '';
    const hour =
      app.interviewAt && !app.interviewTimeTbd
        ? new Date(app.interviewAt).toLocaleTimeString('ar', { hour: 'numeric', minute: '2-digit' })
        : '';

    const line = !when
      ? 'سيتم التواصل معك قريباً للتنسيق حول موعد المقابلة.'
      : hour
        ? `موعد مقابلتك: ${when} الساعة ${hour}.`
        : `موعد مقابلتك: ${when}. سيتم تأكيد الساعة بالتنسيق المباشر معك.`;

    const templates = dataService.getMessageTemplates();
    const template =
      customTemplate || templates.interviewInvitation || DEFAULT_MESSAGE_TEMPLATES.interviewInvitation;

    const replacements: Record<string, string> = {
      الاسم: app.fullName || '',
      الرقم_الجامعي: app.studentId || '',
      اللجنة: effectiveCommittee(app),
      موعد_المقابلة: line,
      رابط_البطاقة: `${origin}/?verify=${encodeURIComponent(app.studentId || app.id)}`,
    };

    const subject = `دعوة لمقابلة الانضمام — النادي الهندسي، جامعة فلسطين`;
    const body = replacePlaceholders(template || '', replacements);

    return { subject, body, line };
  },

  openInterviewWhatsApp(app: StoredApplication, customMessage?: string) {
    let message = customMessage;
    if (!message) {
      const { line } = this.formatInterviewMessage(app);
      message = `السلام عليكم ورحمة الله وبركاته،\nالزميل المهندس / الزميلة المهندسة: ${app.fullName} المحترمـ/ـة\nتحية طيبة من النادي الهندسي — جامعة فلسطين 🏛️\n${line}\nفي حال وجود أي استفسار أو رغبة بتعديل الموعد يرجى الرد على هذه الرسالة.`;
    }

    let rawPhone = (app.phone || '').replace(/\D/g, '');
    if (rawPhone.startsWith('059') || rawPhone.startsWith('056')) rawPhone = '970' + rawPhone.substring(1);
    else if (rawPhone.startsWith('59') || rawPhone.startsWith('56')) rawPhone = '970' + rawPhone;

    window.open(
      `https://api.whatsapp.com/send?phone=${rawPhone}&text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer'
    );
  },

  openInterviewGmail(app: StoredApplication, customSubject?: string, customBody?: string) {
    const { subject, body } = this.formatInterviewMessage(app);
    const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(app.email || '')}&su=${encodeURIComponent(
      customSubject || subject
    )}&body=${encodeURIComponent(customBody || body)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  /** Sends the acceptance email from the club's Gmail via the send-acceptance-email Edge Function. */
  async sendAcceptanceEmail(
    app: StoredApplication,
    customBody?: string,
    customSubject?: string
  ): Promise<{ success: boolean; message: string; sentAt?: string }> {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.functions.invoke('send-acceptance-email', {
        body: { applicationId: app.id, customBody, customSubject },
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
