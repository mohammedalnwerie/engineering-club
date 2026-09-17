import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export interface MemberCardField {
  label: string;
  value: string;
}

interface MemberCardProps {
  /** DOM id used by the PNG exporter */
  id: string;
  /** Card type shown in the header pill, e.g. "عضو لجنة" */
  badge: string;
  name: string;
  /** Title printed right under the name (e.g. "مصمم جرافيك") */
  role?: string;
  /** Main detail, shown first across the full width (e.g. the committee) */
  highlight?: MemberCardField;
  /** Secondary details, laid out in two columns */
  fields?: MemberCardField[];
  photoUrl?: string;
  qrValue: string;
  code: string;
  accent?: 'purple' | 'cyan' | 'green';
}

const ACCENTS = {
  purple: { pill: 'bg-[#7F1AB2]/25 text-[#D1B5E3] border-[#7F1AB2]/60', role: 'text-[#D1B5E3]', bar: 'bg-[#A26CC6]' },
  cyan: { pill: 'bg-[#3FE7E3]/15 text-[#98F7F1] border-[#3FE7E3]/45', role: 'text-[#98F7F1]', bar: 'bg-[#3FE7E3]' },
  green: { pill: 'bg-[#35BC2B]/15 text-[#92E98C] border-[#35BC2B]/45', role: 'text-[#92E98C]', bar: 'bg-[#5CD653]' },
};

const Detail: React.FC<{ field: MemberCardField; wide?: boolean }> = ({ field, wide }) => (
  <div className={wide ? 'col-span-2' : ''}>
    <div className="text-xs text-gray-400">{field.label}</div>
    <div className="text-sm font-bold text-white leading-snug mt-1 break-words">{field.value}</div>
  </div>
);

/** Printable club ID card shared by member, committee and leadership passes. */
export const MemberCard: React.FC<MemberCardProps> = ({
  id,
  badge,
  name,
  role,
  highlight,
  fields = [],
  photoUrl,
  qrValue,
  code,
  accent = 'purple',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const colors = ACCENTS[accent];
  const details = [...(highlight?.value ? [highlight] : []), ...fields.filter((f) => f.value)];
  // Highlight takes a full row; an odd last item also stretches so the grid never looks ragged.
  const isWide = (index: number) =>
    (index === 0 && Boolean(highlight?.value)) ||
    (index === details.length - 1 && (details.length - (highlight?.value ? 1 : 0)) % 2 === 1);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(qrValue, { margin: 0, width: 240, color: { dark: '#08041D', light: '#FFFFFF' } })
      .then((url) => !cancelled && setQrDataUrl(url))
      .catch(() => !cancelled && setQrDataUrl(''));
    return () => {
      cancelled = true;
    };
  }, [qrValue]);

  return (
    <div
      id={id}
      dir="rtl"
      className="w-full max-w-[360px] mx-auto rounded-3xl overflow-hidden text-right bg-[#120A36] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
    >
      <div className="h-1.5 bg-gradient-to-l from-[#7F1AB2] via-[#3FE7E3] to-[#35BC2B]" />

      {/* Header */}
      <div className="px-6 pt-5 pb-4 flex items-center justify-between gap-3 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/brand/emblem-on-dark.png" alt="" className="w-11 h-11 object-contain shrink-0" />
          <div className="min-w-0">
            <div className="text-base font-black text-white leading-tight">النادي الهندسي</div>
            <div className="text-xs text-gray-400 leading-tight mt-1">جامعة فلسطين</div>
          </div>
        </div>
        <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full border ${colors.pill}`}>{badge}</span>
      </div>

      {/* Identity + details share one right edge */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-4">
          {photoUrl && (
            <img
              src={photoUrl}
              alt={name}
              crossOrigin="anonymous"
              className="w-16 h-16 rounded-2xl object-cover border border-white/15 shrink-0"
            />
          )}
          <div className="min-w-0 flex-1 flex gap-3">
            <span className={`w-1 rounded-full shrink-0 ${colors.bar}`} />
            <div className="min-w-0 flex-1">
              <div className="text-[22px] font-black text-white leading-tight text-balance">{name}</div>
              {role && <div className={`text-sm font-bold mt-1.5 ${colors.role}`}>{role}</div>}
            </div>
          </div>
        </div>

        {details.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
            {details.map((f, i) => (
              <Detail key={f.label} field={f} wide={isWide(i)} />
            ))}
          </div>
        )}
      </div>

      {/* Verification strip */}
      <div className="px-6 py-4 bg-black/25 border-t border-white/10 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs text-gray-400">كود التحقق</div>
          <div className="text-sm font-bold text-[#3FE7E3] font-mono mt-1 whitespace-nowrap" dir="ltr">
            {code}
          </div>
          <div className="text-xs text-gray-400 mt-1">امسح الرمز للتحقق من البطاقة</div>
        </div>
        <div className="w-[72px] h-[72px] rounded-xl bg-white p-1.5 shrink-0">
          {qrDataUrl && <img src={qrDataUrl} alt="رمز التحقق" className="w-full h-full" />}
        </div>
      </div>
    </div>
  );
};
