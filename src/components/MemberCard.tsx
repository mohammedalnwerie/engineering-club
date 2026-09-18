import React, { useEffect, useState } from 'react';
import { CARD_ACCENTS, CARD_COLORS, cardNameFontSize, cardQrDataUrl, currentAcademicYear, type CardData } from '../utils/memberCard';

export type { CardData, CardField } from '../utils/memberCard';

/**
 * On-screen club ID card. The PNG/print version is drawn by utils/cardRenderer.ts
 * with the same measurements (360px wide, 24px padding), so keep both in sync.
 */
export const MemberCard: React.FC<CardData & { className?: string }> = ({
  name,
  role,
  highlight,
  fields = [],
  photoUrl,
  qrValue,
  code,
  accent = 'purple',
  badge,
  className = '',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const colors = CARD_ACCENTS[accent];
  const details = fields.filter((f) => f.value);

  useEffect(() => {
    let cancelled = false;
    cardQrDataUrl(qrValue)
      .then((url) => !cancelled && setQrDataUrl(url))
      .catch(() => !cancelled && setQrDataUrl(''));
    return () => {
      cancelled = true;
    };
  }, [qrValue]);

  return (
    <div
      dir="rtl"
      className={`w-[360px] max-w-full mx-auto rounded-3xl overflow-hidden text-right shadow-[0_20px_50px_rgba(0,0,0,0.55)] ${className}`}
      style={{ background: CARD_COLORS.background, border: `1px solid ${CARD_COLORS.border}` }}
    >
      <div
        className="h-1.5"
        style={{ background: `linear-gradient(to left, ${CARD_COLORS.strip[2]}, ${CARD_COLORS.strip[1]}, ${CARD_COLORS.strip[0]})` }}
      />

      {/* Header — the club's own logo, nothing competing with it */}
      <div
        className="px-6 pt-5 pb-4 flex items-end justify-between gap-3"
        style={{ borderBottom: `1px solid ${CARD_COLORS.divider}` }}
      >
        <img
          src="/brand/logo-horizontal-on-dark.png"
          alt="النادي الهندسي — Engineering Club"
          className="h-10 w-auto object-contain shrink-0"
        />
        <span className="text-xs leading-4 pb-0.5 shrink-0" style={{ color: CARD_COLORS.muted }}>
          جامعة فلسطين
        </span>
      </div>

      <div className="px-6 py-6">
        {/* Identity */}
        <div className="flex items-stretch gap-4">
          {photoUrl && (
            <img src={photoUrl} alt={name} className="w-[88px] h-[88px] rounded-2xl object-cover shrink-0 border border-white/15" />
          )}
          <div className="flex gap-3 min-w-0 flex-1">
            <span className="w-1 rounded-full shrink-0" style={{ background: colors.bar }} />
            <div className="min-w-0 flex-1">
              <div
                className="font-black text-white break-words"
                style={{
                  fontSize: cardNameFontSize(name, Boolean(photoUrl)),
                  lineHeight: `${cardNameFontSize(name, Boolean(photoUrl)) + 6}px`,
                }}
              >
                {name}
              </div>
              {role && (
                <div className="text-sm leading-5 font-bold mt-1.5" style={{ color: colors.role }}>
                  {role}
                </div>
              )}
              {/* Validity sits with the identity now; in the header it collided with the logo */}
              <span
                dir="auto"
                className="mt-2 text-xs font-bold h-[24px] px-2.5 inline-flex items-center rounded-full"
                style={{ background: colors.pillBg, border: `1px solid ${colors.pillBorder}`, color: colors.pillText }}
              >
                {badge || currentAcademicYear()}
              </span>
            </div>
          </div>
        </div>

        {/* Committee band */}
        {highlight?.value && (
          <div
            className="mt-5 rounded-2xl px-4 py-3.5"
            style={{ background: colors.bandBg, border: `1px solid ${colors.bandBorder}` }}
          >
            <div className="text-xs leading-4 text-gray-300">{highlight.label}</div>
            <div className="text-base leading-[22px] font-bold text-white mt-1">{highlight.value}</div>
          </div>
        )}

        {/* Details */}
        {details.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
            {details.map((f, i) => (
              <div
                key={f.label}
                className={f.small || (details.length % 2 === 1 && i === details.length - 1) ? 'col-span-2' : ''}
              >
                <div className="text-xs leading-4" style={{ color: CARD_COLORS.muted }}>
                  {f.label}
                </div>
                <div
                  className={`font-bold text-white mt-1 break-words ${f.small ? 'text-xs leading-4' : 'text-sm leading-5'}`}
                  dir={f.small ? 'ltr' : undefined}
                >
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification strip */}
      <div
        className="px-6 py-4 flex items-center justify-between gap-4"
        style={{ background: CARD_COLORS.footerBg, borderTop: `1px solid ${CARD_COLORS.divider}` }}
      >
        <div className="min-w-0">
          <div className="text-xs leading-4" style={{ color: CARD_COLORS.muted }}>
            كود التحقق
          </div>
          <div className="text-sm leading-5 font-bold font-mono mt-1 whitespace-nowrap" dir="ltr" style={{ color: CARD_COLORS.code }}>
            {code}
          </div>
          <div className="text-xs leading-4 mt-1" style={{ color: CARD_COLORS.muted }}>
            امسح الرمز للتحقق من البطاقة
          </div>
        </div>
        <div className="w-[72px] h-[72px] rounded-xl bg-white p-1.5 shrink-0">
          {qrDataUrl && <img src={qrDataUrl} alt="رمز التحقق" className="w-full h-full" />}
        </div>
      </div>
    </div>
  );
};
