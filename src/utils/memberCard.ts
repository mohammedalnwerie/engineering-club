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
  /** Colored band, e.g. the committee */
  highlight?: CardField;
  /** Two-column details */
  fields?: CardField[];
  photoUrl?: string;
  qrValue: string;
  code: string;
  accent?: CardAccent;
  /** Header pill; defaults to the current academic year */
  badge?: string;
}

export type CardAccent = 'purple' | 'cyan' | 'green';

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
    role: '#98F7F1',
    bar: '#3FE7E3',
    bandBg: 'rgba(63,231,227,0.10)',
    bandBorder: 'rgba(63,231,227,0.35)',
  },
  green: {
    pillBg: 'rgba(53,188,43,0.15)',
    pillBorder: 'rgba(92,214,83,0.45)',
    pillText: '#92E98C',
    role: '#92E98C',
    bar: '#5CD653',
    bandBg: 'rgba(53,188,43,0.12)',
    bandBorder: 'rgba(92,214,83,0.35)',
  },
};

export const CARD_COLORS = {
  background: '#120A36',
  border: 'rgba(255,255,255,0.10)',
  divider: 'rgba(255,255,255,0.10)',
  footerBg: 'rgba(0,0,0,0.25)',
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

const cleanMajor = (major?: string) => (major || '').replace(/^(تخصص\s+|كلية\s+)/, '').trim();

export const memberVerifyUrl = (app: Pick<StoredApplication, 'id' | 'studentId'>) =>
  `${window.location.origin}/?verify=${encodeURIComponent(app.studentId || app.id)}`;

/** The printed code: full for the member, masked (UP-••••-C21D) everywhere public. */
export function memberCodeFor(app: CardApplication, reveal = false): string {
  if (app.memberCode) return reveal ? app.memberCode : `UP-••••-${app.memberCode.slice(-4)}`;
  if (app.codeHint) return `UP-••••-${app.codeHint}`;
  return `UP-ENG-${(app.id || '').slice(-8).toUpperCase()}`;
}

/** Pill text: membership validity when known, otherwise the academic year. */
export function validityBadge(app: CardApplication): string | undefined {
  if (!app.validUntil) return undefined;
  const expired = new Date(app.validUntil).getTime() < Date.now();
  if (expired) return 'عضوية منتهية';
  const date = new Date(app.validUntil).toLocaleDateString('ar', { day: 'numeric', month: 'long' });
  return app.membershipType === 'semester' ? `فصلية حتى ${date}` : `صالحة حتى ${date}`;
}

/** General club membership card. */
export function memberCardFor(app: CardApplication, options: CardOptions = {}): CardData {
  const committeeName = effectiveCommittee(app);
  const committee = findCommittee(committeeName);
  const isGeneral = !committee || committee.id === 'general';
  return {
    name: app.fullName,
    role: app.organizationalRole || (isGeneral ? 'عضو في النادي' : 'عضو في اللجنة'),
    highlight: isGeneral
      ? { label: 'نوع العضوية', value: 'عضوية عامة' }
      : { label: 'اللجنة', value: committeeName },
    fields: [
      { label: 'الرقم الجامعي', value: app.studentId },
      { label: 'التخصص', value: cleanMajor(app.major) },
    ],
    qrValue: memberVerifyUrl(app),
    code: memberCodeFor(app, options.revealCode),
    badge: validityBadge(app),
    accent: 'purple',
  };
}

/** Committee member card (uses the admin's committee/title assignment). */
export function committeeCardFor(app: CardApplication, options: CardOptions = {}): CardData {
  const committeeName = effectiveCommittee(app);
  return {
    name: app.fullName,
    role: app.organizationalRole || 'عضو في اللجنة',
    highlight: { label: 'اللجنة', value: committeeName },
    fields: [
      { label: 'الرقم الجامعي', value: app.studentId },
      { label: 'التخصص', value: cleanMajor(app.major) },
    ],
    qrValue: memberVerifyUrl(app),
    code: memberCodeFor(app, options.revealCode),
    badge: validityBadge(app),
    accent: 'cyan',
  };
}

/** Executive & Representative Commission Badge */
export function executiveCardFor(leader: LeaderMember): CardData {
  const isPresident = leader.id === 'pres-1' || (leader.role.includes('رئيس النادي') && !leader.role.includes('نائب'));
  const isCollegeLead = leader.tier === 'college-lead';
  const isExecutive = leader.tier === 'executive';

  // Format short serial: UP-EXEC-XXXX or UP-COL-XXXX
  const prefix = isCollegeLead ? 'UP-COL' : 'UP-EXEC';
  const rawId = (leader.id || '').replace(/[^a-zA-Z0-9]/g, '');
  const shortId = rawId.length > 6 ? rawId.slice(-6).toUpperCase() : (rawId || '0001').toUpperCase();
  const code = `${prefix}-${shortId}`;

  // Official badge (clean Arabic commission without date clutter):
  const badge = isPresident
    ? 'رئاسة النادي المعتمدة'
    : isCollegeLead
    ? 'اعتماد تمثيل الكلية'
    : isExecutive
    ? 'اعتماد الهيئة الإدارية'
    : 'اعتماد رئاسة اللجنة';

  // Highlight band (entity name):
  let highlightValue = (leader.department || '').trim();
  if (!highlightValue || highlightValue === 'ممثلين الكليات' || highlightValue === 'ممثلو الكليات') {
    if (isCollegeLead) {
      highlightValue = (leader.role || '').replace(/^(منسق\s+وممثل|منسق|ممثل)\s+/, '').trim() || 'الكليات الهندسية';
    } else if (isPresident) {
      highlightValue = 'مجلس إدارة النادي الهندسي';
    } else if (isExecutive) {
      highlightValue = 'الهيئة الإدارية العليا';
    } else {
      highlightValue = leader.role;
    }
  }

  const highlightLabel = isCollegeLead
    ? 'التمثيل الأكاديمي'
    : isPresident || isExecutive
    ? 'الهيئة التنظيمية'
    : 'اللجنة التنفيذية';

  // Rich official fields (informative & balanced layout):
  const fields: CardField[] = [
    {
      label: 'التكليف التنظيمي',
      value: isPresident
        ? 'رئيس مجلس الإدارة'
        : isExecutive
        ? 'عضو الهيئة الإدارية'
        : isCollegeLead
        ? 'ممثل الكلية في النادي'
        : 'رئيس لجنة تنفيذية',
    },
    {
      label: 'الجهة التابعة',
      value: highlightValue,
    },
    {
      label: 'الصفة الرسمية',
      value: leader.role,
    },
    {
      label: 'حالة الاعتماد',
      value: 'معتمد رسمياً ✓',
    },
  ];

  if (leader.email && leader.email.trim()) {
    fields.push({
      label: 'البريد الرسمي',
      value: leader.email.trim(),
      small: true,
    });
  }

  return {
    name: leader.name || leader.role,
    role: leader.name ? leader.role : undefined,
    photoUrl: leader.avatar || undefined,
    highlight: {
      label: highlightLabel,
      value: highlightValue,
    },
    fields,
    badge,
    qrValue: `${window.location.origin}/#leadership`,
    code,
    accent: isCollegeLead ? 'cyan' : isPresident ? 'purple' : 'green',
  };
}

