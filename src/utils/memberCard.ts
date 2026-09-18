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

export type CardAccent = 'purple' | 'cyan' | 'green' | 'gold';

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
  Partial<Pick<StoredApplication, 'assignedCommittee' | 'organizationalRole' | 'memberCode' | 'validUntil' | 'membershipType'>> & {
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
  const isExpired = Boolean(app.validUntil && new Date(app.validUntil).getTime() < Date.now());

  if (isExpired && app.validUntil) {
    const d = new Date(app.validUntil);
    const dateFormatted = d.toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' });
    return {
      status: 'expired',
      badgeText: 'عضوية منتهية',
      cardletTitle: 'عضوية غير سارية',
      validitySubtext: `انتهت الصلاحية بتاريخ ${dateFormatted}`,
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
        cardletTitle: 'عضوية فصلية معتمدة',
        validitySubtext: `صالحة حتى ${dateFormatted}`,
      };
    }
    return {
      status: 'active',
      badgeText: `فصلية ${currentAcademicYear()}`,
      cardletTitle: 'عضوية فصلية معتمدة',
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
      cardletTitle: 'عضوية مؤقتة (14 يوماً)',
      validitySubtext: `صالحة حتى ${dateFormatted} • لحين التثبيت`,
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

/** General club membership card (centered portrait layout as per brief). */
export function memberCardFor(app: CardApplication, options: CardOptions = {}): CardData {
  const committeeName = effectiveCommittee(app);
  const committee = findCommittee(committeeName);
  const isGeneral = !committee || committee.id === 'general';

  if (!isGeneral) {
    return committeeCardFor(app, options);
  }

  const validity = computeCardValidity(app);

  return {
    name: app.fullName,
    role: app.organizationalRole || 'عضو في النادي الهندسي',
    highlight: {
      label: 'نوع العضوية والاعتماد',
      value: validity.cardletTitle,
      subvalue: validity.validitySubtext,
    },
    qrValue: memberVerifyUrl(app),
    code: memberCodeFor(app, options.revealCode),
    badge: validity.badgeText,
    accent: validity.status === 'expired' ? 'gold' : 'purple',
    layoutVariant: 'general',
    cardletIcon: 'users',
    validityStatus: validity.status,
    validitySubtext: validity.validitySubtext,
  };
}

/** Committee member card (side-by-side executive layout as per brief). */
export function committeeCardFor(app: CardApplication, options: CardOptions = {}): CardData {
  const committeeName = effectiveCommittee(app);
  const isMedia = committeeName.includes('إعلام') || committeeName.includes('media');
  const isEvents = committeeName.includes('فعاليات') || committeeName.includes('events');

  const cleanId = (app.studentId || app.id || '001').replace(/[^0-9]/g, '');
  const suffix = isMedia ? 'MEDIA' : isEvents ? 'EVENTS' : 'COMM';
  const defaultCode = `UP-EC-${suffix}-${cleanId.slice(-4).padStart(3, '0')}`;
  const code = app.memberCode && options.revealCode ? app.memberCode : defaultCode;

  const validity = computeCardValidity(app);
  const cleanValiditySubtext = validity.validitySubtext.replace(' • لحين التثبيت', '');

  return {
    name: app.fullName,
    role: app.organizationalRole || `عضو ${committeeName}`,
    highlight: {
      label: 'الجهة واللجنة',
      value: committeeName,
      subvalue: `${validity.cardletTitle} • ${cleanValiditySubtext}`,
    },
    qrValue: memberVerifyUrl(app),
    code,
    badge: validity.badgeText,
    accent: validity.status === 'expired' ? 'gold' : isMedia ? 'green' : isEvents ? 'cyan' : 'purple',
    layoutVariant: 'executive',
    cardletIcon: isMedia ? 'megaphone' : 'zap',
    validityStatus: validity.status,
    validitySubtext: validity.validitySubtext,
  };
}

/** Executive & Representative Commission Badge (side-by-side executive layout as per brief). */
export function executiveCardFor(
  leader: LeaderMember,
  _studentApp?: { studentId?: string; major?: string }
): CardData {
  const isPresident = leader.id === 'pres-1' || (leader.role.includes('رئيس النادي') && !leader.role.includes('نائب'));
  const isCollegeLead = leader.tier === 'college-lead';
  const isExecutive = leader.tier === 'executive';

  // Format short, clean serial matching brief: UP-EXEC-2026-MEDIA / UP-COL-2026-AI / UP-EXEC-2026-PRES
  let serialSuffix = '001';
  const dep = (leader.department || '').toLowerCase();
  const role = (leader.role || '').toLowerCase();

  if (isPresident) {
    serialSuffix = 'PRES';
  } else if (isCollegeLead) {
    if (dep.includes('برمج') || dep.includes('ذكاء') || role.includes('برمج')) serialSuffix = 'AI';
    else if (dep.includes('it') || dep.includes('تكنولوجيا') || role.includes('it')) serialSuffix = 'IT';
    else if (dep.includes('عمارة') || dep.includes('تطبيق') || dep.includes('مدني')) serialSuffix = 'ENG';
    else serialSuffix = 'COL';
  } else {
    if (dep.includes('إعلام') || role.includes('إعلام')) serialSuffix = 'MEDIA';
    else if (dep.includes('فعاليات') || role.includes('فعاليات')) serialSuffix = 'EVENTS';
    else if (dep.includes('علاقات') || role.includes('تدريب')) serialSuffix = 'REL';
    else serialSuffix = 'EXEC';
  }

  const prefix = isCollegeLead ? 'UP-COL-2026' : 'UP-EXEC-2026';
  const code = `${prefix}-${serialSuffix}`;

  // Cardlet highlight info:
  let highlightLabel = 'الجهة';
  let highlightValue = (leader.department || '').trim();
  let cardletIcon: 'users' | 'megaphone' | 'zap' | 'graduation' | 'crown' = 'zap';
  let accent: CardAccent = 'green';

  if (isPresident) {
    highlightLabel = 'الهيئة التنظيمية';
    highlightValue = 'مجلس إدارة النادي الهندسي';
    cardletIcon = 'crown';
    accent = 'gold';
  } else if (isCollegeLead) {
    highlightLabel = 'التمثيل الأكاديمي';
    highlightValue = leader.department || 'الكليات الهندسية';
    cardletIcon = 'graduation';
    accent = 'cyan';
  } else if (isExecutive) {
    highlightLabel = 'الهيئة التنظيمية';
    highlightValue = leader.department || 'الهيئة الإدارية العليا';
    cardletIcon = 'crown';
    accent = 'gold';
  } else {
    // Committee lead
    const isMedia = leader.role.includes('إعلام') || leader.department.includes('إعلام');
    if (isMedia) {
      cardletIcon = 'megaphone';
      accent = 'green';
    } else {
      cardletIcon = 'zap';
      accent = 'cyan';
    }
    highlightLabel = 'الجهة';
    highlightValue = leader.department || leader.role;
  }

  const validitySubtext = 'تكليف رسمي معتمد • العام الأكاديمي 2026 / 2027';

  return {
    name: leader.name || leader.role,
    role: leader.name ? leader.role : undefined,
    photoUrl: leader.avatar || undefined,
    highlight: {
      label: highlightLabel,
      value: highlightValue,
      subvalue: validitySubtext,
    },
    badge: 'اعتماد 2026 / 2027',
    qrValue: `${window.location.origin}/#leadership`,
    code,
    accent,
    layoutVariant: 'executive',
    cardletIcon,
    validityStatus: 'accredited',
    validitySubtext,
  };
}

