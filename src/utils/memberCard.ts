import QRCode from 'qrcode';
import { effectiveCommittee, findCommittee } from '../data/committees';
import type { StoredApplication } from '../types';

export interface CardField {
  label: string;
  value: string;
}

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
