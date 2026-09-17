import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

export interface MemberCardField {
  label: string;
  value: string;
}

interface MemberCardProps {
  /** DOM id used by the PNG exporter */
  id: string;
  /** Short card type shown in the header pill, e.g. "عضو لجنة" */
  badge: string;
  name: string;
  /** Line under the name, e.g. student ID or position */
  subtitle?: string;
  photoUrl?: string;
  fields: MemberCardField[];
  qrValue: string;
  code: string;
  accent?: 'purple' | 'cyan' | 'green';
}

const ACCENTS = {
  purple: { pill: 'bg-[#7F1AB2]/25 text-[#D1B5E3] border-[#7F1AB2]/50', text: 'text-[#D1B5E3]' },
  cyan: { pill: 'bg-[#3FE7E3]/15 text-[#98F7F1] border-[#3FE7E3]/40', text: 'text-[#98F7F1]' },
  green: { pill: 'bg-[#35BC2B]/15 text-[#92E98C] border-[#35BC2B]/40', text: 'text-[#92E98C]' },
};

/** Printable club ID card shared by member, committee and leadership passes. */
export const MemberCard: React.FC<MemberCardProps> = ({
  id,
  badge,
  name,
  subtitle,
  photoUrl,
  fields,
  qrValue,
  code,
  accent = 'purple',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const colors = ACCENTS[accent];

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
      className="relative w-full max-w-[350px] mx-auto rounded-[28px] overflow-hidden text-right bg-gradient-to-b from-[#1A0F45] via-[#0F0830] to-[#08041D] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.55)]"
    >
      {/* Brand color strip */}
      <div className="h-1.5 bg-gradient-to-l from-[#7F1AB2] via-[#3FE7E3] to-[#35BC2B]" />

      <div className="p-6">
        {/* Header */}
        <div className="text-center">
          <img src="/brand/logo-horizontal-on-dark.png" alt="النادي الهندسي" className="h-16 w-auto mx-auto object-contain" />
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-sm text-gray-300">جامعة فلسطين</span>
            <span className="text-white/20">•</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${colors.pill}`}>{badge}</span>
          </div>
        </div>

        <div className="my-5 h-px bg-white/10" />

        {/* Identity */}
        <div className="flex items-center gap-4">
          {photoUrl && (
            <img
              src={photoUrl}
              alt={name}
              crossOrigin="anonymous"
              className="w-16 h-16 rounded-2xl object-cover border border-white/15 shrink-0"
            />
          )}
          <div className="min-w-0">
            <div className="text-2xl font-black text-white leading-snug break-words">{name}</div>
            {subtitle && <div className={`text-sm font-bold mt-1 ${colors.text}`}>{subtitle}</div>}
          </div>
        </div>

        {/* Details */}
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
          {fields
            .filter((f) => f.value)
            .map((f, i, list) => (
              <div key={f.label} className={list.length % 2 === 1 && i === list.length - 1 ? 'col-span-2' : ''}>
                <div className="text-xs text-gray-400">{f.label}</div>
                <div className="text-sm font-bold text-gray-100 leading-snug mt-0.5">{f.value}</div>
              </div>
            ))}
        </div>

        {/* Verification */}
        <div className="mt-6 flex items-center gap-4 p-3 rounded-2xl bg-white/[0.04] border border-white/10">
          <div className="w-20 h-20 rounded-xl bg-white p-1 shrink-0">
            {qrDataUrl && <img src={qrDataUrl} alt="رمز التحقق" className="w-full h-full" />}
          </div>
          <div className="min-w-0 text-right">
            <div className="text-sm font-bold text-white">امسح الرمز للتحقق</div>
            <div className="text-xs text-gray-400 mt-0.5">أو ادخل الكود في صفحة التحقق</div>
            <div className="text-xs font-bold text-[#3FE7E3] mt-1.5 font-mono whitespace-nowrap" dir="ltr">
              {code}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
