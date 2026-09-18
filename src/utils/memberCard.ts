import QRCode from 'qrcode';
import { effectiveCommittee, findCommittee } from '../data/committees';
import type { LeaderMember, StoredApplication } from '../types';

export interface CardField {
  label: string;
  value: string;
  /** Long, low-priority values (an email) render smaller and full width. */
  small?: boolean;
}

/** Long names drop a size instead of wrapping; a photo leaves less room for them. */
export const cardNameFontSize = (name: string, hasPhoto = false) => {
  const length = name.trim().length;
  if (hasPhoto) return length > 20 ? 15 : length > 16 ? 17 : length > 12 ? 19 : 21;
  return length > 26 ? 17 : length > 20 ? 19 : 22;
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
  /** Header pill; defaults to the current academic year */
  badge?: string;
  /** Layout style: 'general' (centered photo for general members) or 'executive' (side-by-side for committees/leadership) */
  layoutVariant?: 'general' | 'executive';
  /** Icon for the middle cardlet */
  cardletIcon?: 'users' | 'megaphone' | 'zap' | 'graduation' | 'crown';
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

/** General club membership card (centered portrait layout as per brief). */
export function memberCardFor(app: CardApplication, options: CardOptions = {}): CardData {
  const committeeName = effectiveCommittee(app);
  const committee = findCommittee(committeeName);
  const isGeneral = !committee || committee.id === 'general';

  if (!isGeneral) {
    return committeeCardFor(app, options);
  }

  const membershipVal = app.membershipType === 'semester' ? 'عضوية فصلية' : 'عضو عادي';

  return {
    name: app.fullName,
    role: app.organizationalRole || 'عضو في النادي الهندسي',
    highlight: { label: 'نوع العضوية', value: membershipVal },
    qrValue: memberVerifyUrl(app),
    code: memberCodeFor(app, options.revealCode),
    badge: currentAcademicYear(),
    accent: 'purple',
    layoutVariant: 'general',
    cardletIcon: 'users',
  };
}

/** Committee member card (side-by-side executive layout as per brief). */
export function committeeCardFor(app: CardApplication, _options: CardOptions = {}): CardData {
  const committeeName = effectiveCommittee(app);
  const isMedia = committeeName.includes('إعلام') || committeeName.includes('media');
  const isEvents = committeeName.includes('فعاليات') || committeeName.includes('events');

  const cleanId = (app.studentId || app.id || '001').replace(/[^0-9]/g, '');
  const suffix = isMedia ? 'MEDIA' : isEvents ? 'EVENTS' : 'COMM';
  const code = `UP-EC-${suffix}-${cleanId.slice(-4).padStart(3, '0')}`;

  return {
    name: app.fullName,
    role: app.organizationalRole || `عضو ${committeeName}`,
    highlight: { label: 'الجهة', value: committeeName },
    qrValue: memberVerifyUrl(app),
    code,
    badge: currentAcademicYear(),
    accent: isMedia ? 'green' : isEvents ? 'cyan' : 'purple',
    layoutVariant: 'executive',
    cardletIcon: isMedia ? 'megaphone' : 'zap',
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

  // Format short serial matching brief: UP-EXEC-2026-COMMEDIA / UP-COL-2026-IT / UP-EXEC-2026-PRES
  let serialSuffix = (leader.id || '').replace(/^lead-col-/, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (leader.id === 'pres-1') serialSuffix = 'PRES';
  else if (leader.id === 'comm-media') serialSuffix = 'COMMEDIA';
  else if (leader.id === 'comm-events') serialSuffix = 'EVENTS';
  else if (leader.id === 'comm-relations') serialSuffix = 'RELATIONS';
  else if (serialSuffix.length > 8) serialSuffix = serialSuffix.slice(0, 8);

  const prefix = isCollegeLead ? 'UP-COL-2026' : 'UP-EXEC-2026';
  const code = `${prefix}-${serialSuffix || '001'}`;

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

  return {
    name: leader.name || leader.role,
    role: leader.name ? leader.role : undefined,
    photoUrl: leader.avatar || undefined,
    highlight: {
      label: highlightLabel,
      value: highlightValue,
    },
    badge: currentAcademicYear(),
    qrValue: `${window.location.origin}/#leadership`,
    code,
    accent,
    layoutVariant: 'executive',
    cardletIcon,
  };
}

