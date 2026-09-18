import QRCode from 'qrcode';
import { effectiveCommittee, findCommittee } from '../data/committees';
import type { LeaderMember, StoredApplication } from '../types';

export interface CardField {
  label: string;
  value: string;
  /** Sub-line under value, e.g. "صالحة حتى 2 أكتوبر 2026" */
  subvalue?: string;
  /** Long, low-priority values (an email) render smaller and full width. */
  small?: boolean;
}

/** Long names drop a size instead of wrapping; a photo leaves less room for them. */
export const cardNameFontSize = (name: string, hasPhoto = false) => {
  const length = name.trim().length;
  if (hasPhoto) return length > 24 ? 14 : length > 18 ? 16 : length > 12 ? 18 : 20;
  return length > 26 ? 16 : length > 20 ? 18 : 22;
};

/** Everything a club ID card shows. Rendered on screen by <MemberCard> and to PNG by renderCardPng(). */
export interface CardData {
  name: string;
  /** Title under the name, e.g. "مصمم جرافيك" */
  role?: string;
  /** Colored band / middle cardlet, e.g. the committee or membership type */
  highlight?: CardField;
  /** Extra detail fields if applicable */
  fields?: CardField[];
  photoUrl?: string;
  qrValue: string;
  code: string;
  accent?: CardAccent;
  /** Header pill; e.g. "2026 / 2027" or "فصلية حتى 15/02" or "مؤقتة حتى 02/10" */
  badge?: string;
  /** Layout style: 'general' (centered photo for general members) or 'executive' (side-by-side for committees/leadership) */
  layoutVariant?: 'general' | 'executive';
  /** Icon for the middle cardlet */
  cardletIcon?: 'users' | 'megaphone' | 'zap' | 'graduation' | 'crown';
  /** Membership validity state */
  validityStatus?: 'active' | 'temporary' | 'expired' | 'suspended' | 'accredited';
  /** Descriptive validity subtext, e.g. "صالحة حتى 2 أكتوبر 2026" */
  validitySubtext?: string;
}

export type CardAccent = 'purple' | 'cyan' | 'green' | 'gold' | 'red';

export const CARD_ACCENTS: Record<
  CardAccent,
  { pillBg: string; pillBorder: string; pillText: string; role: string; bar: string; bandBg: string; bandBorder: string }
> = {
  purple: {
    pillBg: 'rgba(127,26,178,0.25)',
    pillBorder: 'rgba(162,108,198,0.6)',
    pillText: '#D1B5E3',
    role: '#D1B5E3',
    bar: '#A26CC6',
    bandBg: 'rgba(127,26,178,0.20)',
    bandBorder: 'rgba(162,108,198,0.45)',
  },
  cyan: {
    pillBg: 'rgba(63,231,227,0.14)',
    pillBorder: 'rgba(63,231,227,0.45)',
    pillText: '#98F7F1',
    role: '#3FE7E3',
    bar: '#3FE7E3',
    bandBg: 'rgba(63,231,227,0.10)',
    bandBorder: 'rgba(63,231,227,0.35)',
  },
  green: {
    pillBg: 'rgba(53,188,43,0.15)',
    pillBorder: 'rgba(92,214,83,0.45)',
    pillText: '#92E98C',
    role: '#35BC2B',
    bar: '#35BC2B',
    bandBg: 'rgba(53,188,43,0.12)',
    bandBorder: 'rgba(92,214,83,0.35)',
  },
  red: {
    pillBg: 'rgba(239,68,68,0.18)',
    pillBorder: 'rgba(239,68,68,0.55)',
    pillText: '#FCA5A5',
    role: '#FCA5A5',
    bar: '#EF4444',
    bandBg: 'rgba(239,68,68,0.12)',
    bandBorder: 'rgba(239,68,68,0.40)',
  },
  gold: {
    pillBg: 'rgba(245,158,11,0.20)',
    pillBorder: 'rgba(251,191,36,0.5)',
    pillText: '#FDE68A',
    role: '#FBBF24',
    bar: '#F59E0B',
    bandBg: 'rgba(245,158,11,0.14)',
    bandBorder: 'rgba(245,158,11,0.40)',
  },
};

export const CARD_COLORS = {
  background: '#0D0729',
  border: 'rgba(255,255,255,0.10)',
  divider: 'rgba(255,255,255,0.10)',
  footerBg: 'rgba(0,0,0,0.35)',
  text: '#FFFFFF',
  muted: '#9CA3AF',
  code: '#3FE7E3',
  strip: ['#35BC2B', '#3FE7E3', '#7F1AB2'],
};

/** Academic year label, e.g. "2026 / 2027" (the year starts in September). */
export function currentAcademicYear(date = new Date()): string {
  const y = date.getFullYear();
  const start = date.getMonth() >= 8 ? y : y - 1;
  return `${start} / ${start + 1}`;
}

export function cardQrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, { margin: 0, width: 360, color: { dark: '#08041D', light: '#FFFFFF' } });
}

// ---------------------------------------------------------------------------
// Card data builders — one place decides what each card shows.
// ---------------------------------------------------------------------------

type CardApplication = Pick<StoredApplication, 'id' | 'fullName' | 'studentId' | 'major' | 'targetCommittee'> &
  Partial<Pick<StoredApplication, 'assignedCommittee' | 'organizationalRole' | 'memberCode' | 'validUntil' | 'membershipType' | 'suspendedAt' | 'suspendReason' | 'membershipState'>> & {
    /** Last 4 characters of the member code, when the full code must stay private (public verify page) */
    codeHint?: string;
  };

interface CardOptions {
  /** Show the full private member code (member's own account / admins). Otherwise it is masked. */
  revealCode?: boolean;
}

export const memberVerifyUrl = (app: Pick<StoredApplication, 'id' | 'studentId'>) =>
  `${window.location.origin}/?verify=${encodeURIComponent(app.studentId || app.id)}`;

/** The printed code: full for the member, masked (UP-••••-C21D) everywhere public. */
export function memberCodeFor(app: CardApplication, reveal = false): string {
  if (app.memberCode) return reveal ? app.memberCode : `UP-MEM-2026-${app.memberCode.slice(-5)}`;
  const cleanId = (app.studentId || app.id || '00123').replace(/[^0-9]/g, '');
  return `UP-MEM-2026-${cleanId.length >= 5 ? cleanId.slice(-5) : cleanId.padStart(5, '0')}`;
}

/** Computes accurate validity status, pill text, and subline for member cards. */
export function computeCardValidity(app: CardApplication): {
  status: 'active' | 'temporary' | 'expired' | 'suspended' | 'accredited';
  badgeText: string;
  cardletTitle: string;
  validitySubtext: string;
} {
  const isSuspended = Boolean(app.suspendedAt || app.membershipState === 'suspended');

  if (isSuspended) {
    const reasonText = app.suspendReason?.trim();
    return {
      status: 'suspended',
      badgeText: 'عضوية معلّقة',
      cardletTitle: 'العضوية معلّقة',
      validitySubtext: reasonText ? `السبب: ${reasonText}` : 'راجع إدارة النادي لإعادة التفعيل',
    };
  }

  const isExpired = Boolean(app.validUntil && new Date(app.validUntil).getTime() < Date.now());

  if (isExpired && app.validUntil) {
    const d = new Date(app.validUntil);
    const dateFormatted = d.toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' });
    return {
      status: 'expired',
      badgeText: 'عضوية منتهية',
      cardletTitle: 'العضوية غير سارية',
      validitySubtext: `انتهت بتاريخ ${dateFormatted} — جدّدها من صفحة حسابي`,
    };
  }

  // Semester Membership
  if (app.membershipType === 'semester') {
    if (app.validUntil) {
      const d = new Date(app.validUntil);
      const dateFormatted = d.toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' });
      const shortDate = `${d.getDate()}/${d.getMonth() + 1}`;
      return {
        status: 'active',
        badgeText: `فصلية حتى ${shortDate}`,
        cardletTitle: 'عضوية فصلية',
        validitySubtext: `صالحة حتى ${dateFormatted}`,
      };
    }
    return {
      status: 'active',
      badgeText: `فصلية ${currentAcademicYear()}`,
      cardletTitle: 'عضوية فصلية',
      validitySubtext: `صالحة للعام الأكاديمي ${currentAcademicYear()}`,
    };
  }

  // Temporary Membership (فور قبول الطلب: 14 يوماً مؤقتة لحين التثبيت)
  if (app.validUntil) {
    const d = new Date(app.validUntil);
    const dateFormatted = d.toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' });
    const shortDate = `${d.getDate()}/${d.getMonth() + 1}`;
    return {
      status: 'temporary',
      badgeText: `مؤقتة حتى ${shortDate}`,
      cardletTitle: 'بطاقة العضوية الأولى',
      validitySubtext: `صالحة حتى ${dateFormatted}`,
    };
  }

  // Default / Prospective
  return {
    status: 'active',
    badgeText: currentAcademicYear(),
    cardletTitle: 'عضوية عامة',
    validitySubtext: `العام الأكاديمي ${currentAcademicYear()}`,
  };
}

/** Strips the "كلية"/"تخصص" prefix so the field reads as a subject, not a sentence. */
const cleanMajor = (major?: string) => (major || '').replace(/^(تخصص\s+|كلية\s+)/, '').trim();

/** Red when the card cannot be used; otherwise the role's own colour. */
const statusAccent = (status: string, fallback: CardAccent): CardAccent =>
  status === 'expired' || status === 'suspended' ? 'red' : fallback;

/** Colour per committee, so a card is recognisable across a room. */
function committeeAccent(committeeName: string): CardAccent {
  if (committeeName.includes('إعلام')) return 'green';
  if (committeeName.includes('فعاليات')) return 'purple';
  if (committeeName.includes('علاقات') || committeeName.includes('تدريب')) return 'cyan';
  return 'cyan';
}

/** Card for a member of the club at large. */
export function memberCardFor(app: CardApplication, options: CardOptions = {}): CardData {
  const committeeName = effectiveCommittee(app);
  const committee = findCommittee(committeeName);
  if (committee && committee.id !== 'general') return committeeCardFor(app, options);

  const validity = computeCardValidity(app);
  return {
    name: app.fullName,
    role: app.organizationalRole || 'عضو في النادي الهندسي',
    fields: [
      { label: 'الرقم الجامعي', value: app.studentId || '—' },
      { label: 'التخصص', value: cleanMajor(app.major) || '—' },
    ],
    highlight: { label: 'العضوية', value: validity.cardletTitle, subvalue: validity.validitySubtext },
    qrValue: memberVerifyUrl(app),
    code: memberCodeFor(app, options.revealCode),
    badge: validity.badgeText,
    accent: statusAccent(validity.status, 'cyan'),
    validityStatus: validity.status,
    validitySubtext: validity.validitySubtext,
  };
}

/** Card for a member serving on one of the committees. */
export function committeeCardFor(app: CardApplication, options: CardOptions = {}): CardData {
  const committeeName = effectiveCommittee(app);
  const validity = computeCardValidity(app);

  return {
    name: app.fullName,
    role: app.organizationalRole || 'عضو باللجنة',
    fields: [
      { label: 'اللجنة', value: committeeName },
      { label: 'الرقم الجامعي', value: app.studentId || '—' },
    ],
    highlight: { label: 'العضوية', value: validity.cardletTitle, subvalue: validity.validitySubtext },
    qrValue: memberVerifyUrl(app),
    code: memberCodeFor(app, options.revealCode),
    badge: validity.badgeText,
    accent: statusAccent(validity.status, committeeAccent(committeeName)),
    validityStatus: validity.status,
    validitySubtext: validity.validitySubtext,
  };
}

/** A readable serial: UP-EXEC-2026-VP-ADM, UP-COL-2026-AI, UP-COMM-2026-MEDIA. */
function leaderSerial(leader: LeaderMember): string {
  const role = leader.role || '';
  const dep = `${leader.department || ''} ${role}`;
  const year = new Date().getFullYear();

  if (leader.tier === 'college-lead') {
    const key = dep.includes('برمج') || dep.includes('ذكاء') ? 'AI' : dep.includes('تكنولوجيا') || dep.includes('IT') ? 'IT' : 'ENG';
    return `UP-COL-${year}-${key}`;
  }

  if (leader.tier === 'executive') {
    const key = role.includes('رئيس') && !role.includes('نائب')
      ? 'PRES'
      : role.includes('إدار')
        ? 'VP-ADM'
        : role.includes('تنفيذ')
          ? 'VP-OPS'
          : role.includes('صندوق') || role.includes('مالي')
            ? 'FIN'
            : role.includes('سر')
              ? 'SEC'
              : 'BOARD';
    return `UP-EXEC-${year}-${key}`;
  }

  const key = dep.includes('إعلام') ? 'MEDIA' : dep.includes('فعاليات') ? 'EVENTS' : dep.includes('علاقات') || dep.includes('تدريب') ? 'REL' : 'COMM';
  return `UP-COMM-${year}-${key}`;
}

/** Card for the board, committee heads and college representatives. */
export function executiveCardFor(
  leader: LeaderMember,
  studentApp?: { studentId?: string; major?: string }
): CardData {
  const isCollegeLead = leader.tier === 'college-lead';
  const isExecutive = leader.tier === 'executive';
  const department = (leader.department || '').trim();

  const body = isCollegeLead
    ? department || 'الكليات الهندسية'
    : isExecutive
      ? department || 'مجلس إدارة النادي'
      : department || 'لجان النادي';

  const accent: CardAccent = isExecutive ? 'gold' : isCollegeLead ? 'purple' : committeeAccent(`${department} ${leader.role}`);

  return {
    name: leader.name || leader.role,
    role: leader.name ? leader.role : undefined,
    photoUrl: leader.avatar || undefined,
    // The chip already carries the year; a second copy would be noise.
    fields: [
      { label: isCollegeLead ? 'الكلية' : 'الجهة', value: body },
      ...(studentApp?.studentId ? [{ label: 'الرقم الجامعي', value: studentApp.studentId }] : []),
    ],
    highlight: {
      label: 'الصفة',
      value: isCollegeLead ? 'تمثيل رسمي للكلية' : 'تكليف رسمي معتمد',
      subvalue: 'صادر عن مجلس إدارة النادي الهندسي',
    },
    qrValue: `${window.location.origin}/#leadership`,
    code: leaderSerial(leader),
    badge: currentAcademicYear(),
    accent,
    validityStatus: 'accredited',
  };
}
