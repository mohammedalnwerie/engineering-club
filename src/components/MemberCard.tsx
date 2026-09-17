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
  /** Full-width colored band, used for the committee */
  highlight?: MemberCardField;
  /** Secondary details as label/value rows */
  fields?: MemberCardField[];
  photoUrl?: string;
  qrValue: string;
  code: string;
  accent?: 'purple' | 'cyan' | 'green';
}

const ACCENTS = {
  purple: {
    pill: 'bg-[#7F1AB2]/25 text-[#D1B5E3] border-[#7F1AB2]/60',
    role: 'text-[#D1B5E3]',
    band: 'bg-[#7F1AB2]/15 border-[#7F1AB2]/45',
  },
  cyan: {
    pill: 'bg-[#3FE7E3]/15 text-[#98F7F1] border-[#3FE7E3]/45',
    role: 'text-[#98F7F1]',
    band: 'bg-[#3FE7E3]/10 border-[#3FE7E3]/35',
  },
  green: {
    pill: 'bg-[#35BC2B]/15 text-[#92E98C] border-[#35BC2B]/45',
    role: 'text-[#92E98C]',
    band: 'bg-[#35BC2B]/10 border-[#35BC2B]/35',
  },
};

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
  const rows = fields.filter((f) => f.value);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(qrValue, { margin: 1, width: 240, color: { dark: '#08041D', light: '#FFFFFF' } })
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
      className="relative w-full max-w-[360px] mx-auto rounded-[28px] overflow-hidden text-right bg-gradient-to-b from-[#1A0F45] via-[#100833] to-[#08041D] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
    >
      <div className="h-1.5 bg-gradient-to-l from-[#7F1AB2] via-[#3FE7E3] to-[#35BC2B]" />

      <div className="p-6">
        {/* Header: emblem + club name as real text, card type on the other side */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/brand/emblem-on-dark.png" alt="" className="w-12 h-12 object-contain shrink-0" />
            <div className="min-w-0">
              <div className="text-lg font-black text-white leading-tight">النادي الهندسي</div>
              <div className="text-xs text-gray-400 mt-0.5">جامعة فلسطين</div>
            </div>
          </div>
          <span className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border ${colors.pill}`}>{badge}</span>
        </div>

        <div className="my-5 h-px bg-white/10" />

        {/* Identity */}
        <div className="flex items-center gap-4">
          {photoUrl && (
            <img
              src={photoUrl}
              alt={name}
              crossOrigin="anonymous"
              className="w-[72px] h-[72px] rounded-2xl object-cover border border-white/15 shrink-0"
            />
          )}
          <div className="min-w-0">
            <div className="text-[26px] font-black text-white leading-tight break-words">{name}</div>
            {role && <div className={`text-base font-bold mt-1.5 ${colors.role}`}>{role}</div>}
          </div>
        </div>

        {/* Committee band */}
        {highlight?.value && (
          <div className={`mt-5 rounded-2xl border px-4 py-3 ${colors.band}`}>
            <div className="text-xs text-gray-300">{highlight.label}</div>
            <div className="text-base font-bold text-white leading-snug mt-0.5">{highlight.value}</div>
          </div>
        )}

        {/* Details */}
        {rows.length > 0 && (
          <div className="mt-4 divide-y divide-white/[0.07]">
            {rows.map((f) => (
              <div key={f.label} className="flex items-baseline justify-between gap-4 py-2.5">
                <span className="text-sm text-gray-400 shrink-0">{f.label}</span>
                <span className="text-sm font-bold text-white text-left leading-snug break-words">{f.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Verification */}
        <div className="mt-5 flex items-center gap-4 p-3 rounded-2xl bg-white/[0.04] border border-white/10">
          <div className="w-20 h-20 rounded-xl bg-white p-1 shrink-0">
            {qrDataUrl && <img src={qrDataUrl} alt="رمز التحقق" className="w-full h-full" />}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white">امسح الرمز للتحقق</div>
            <div className="text-xs text-gray-400 mt-0.5">أو أدخل الكود في صفحة التحقق</div>
            <div className="text-xs font-bold text-[#3FE7E3] mt-1.5 font-mono whitespace-nowrap text-right" dir="ltr">
              {code}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
