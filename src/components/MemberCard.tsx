import React, { useEffect, useState } from 'react';
import {
  CARD_ACCENTS,
  cardNameFontSize,
  cardQrDataUrl,
  currentAcademicYear,
  type CardData,
} from '../utils/memberCard';
import {
  Calendar,
  Users,
  Megaphone,
  Zap,
  GraduationCap,
  Crown,
  ShieldCheck,
} from 'lucide-react';

export type { CardData, CardField } from '../utils/memberCard';

/**
 * Blueprint vector background: Isometric grid, gear blueprint, and university facade.
 */
const BlueprintBackground: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
    {/* Technical Isometric Grid */}
    <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="card-blueprint-grid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#3FE7E3" strokeWidth="0.75" />
          <circle cx="24" cy="24" r="0.75" fill="#3FE7E3" />
          <circle cx="0" cy="0" r="0.75" fill="#3FE7E3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#card-blueprint-grid)" />
    </svg>

    {/* Top-Left Cyber Neon Corner Slash */}
    <div className="absolute top-0 left-0 w-24 h-24 overflow-hidden">
      <div className="absolute -top-12 -left-12 w-24 h-24 rotate-45 bg-gradient-to-r from-[#35BC2B] via-[#3FE7E3] to-[#7F1AB2] opacity-80 shadow-[0_0_15px_rgba(63,231,227,0.5)]" />
    </div>

    {/* Mechanical Blueprint Gear (Middle Left) */}
    <svg
      className="absolute -left-10 top-32 w-44 h-44 text-[#3FE7E3] opacity-[0.14]"
      viewBox="0 0 200 200"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer Pitch Circle */}
      <circle cx="100" cy="100" r="75" strokeWidth="1.5" strokeDasharray="4 3" />
      {/* Root Circle */}
      <circle cx="100" cy="100" r="55" strokeWidth="1" />
      {/* Center Hub */}
      <circle cx="100" cy="100" r="22" strokeWidth="2" />
      <circle cx="100" cy="100" r="8" fill="currentColor" fillOpacity="0.4" />
      {/* Crosshairs */}
      <line x1="10" y1="100" x2="190" y2="100" strokeWidth="0.75" strokeDasharray="3 3" />
      <line x1="100" y1="10" x2="100" y2="190" strokeWidth="0.75" strokeDasharray="3 3" />
      {/* Gear Teeth */}
      {Array.from({ length: 12 }).map((_, i) => (
        <rect
          key={i}
          x="94"
          y="15"
          width="12"
          height="16"
          rx="2"
          strokeWidth="1.2"
          transform={`rotate(${i * 30} 100 100)`}
        />
      ))}
      {/* Spoke Rays */}
      {Array.from({ length: 6 }).map((_, i) => (
        <line
          key={`spoke-${i}`}
          x1="100"
          y1="100"
          x2="100"
          y2="45"
          strokeWidth="1"
          transform={`rotate(${i * 60} 100 100)`}
        />
      ))}
    </svg>

    {/* Architectural University Campus Blueprint (Bottom Right) */}
    <svg
      className="absolute -right-8 bottom-12 w-52 h-44 text-[#3FE7E3] opacity-[0.13]"
      viewBox="0 0 240 180"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Perspective Ground Grid */}
      <line x1="10" y1="160" x2="230" y2="160" strokeWidth="1" />
      <line x1="30" y1="170" x2="210" y2="170" strokeWidth="0.5" strokeDasharray="4 2" />
      <line x1="40" y1="160" x2="120" y2="60" strokeWidth="0.75" strokeDasharray="3 3" />
      <line x1="200" y1="160" x2="120" y2="60" strokeWidth="0.75" strokeDasharray="3 3" />
      {/* Main Building Block */}
      <polygon points="40,160 40,90 120,50 200,90 200,160" strokeWidth="1.2" />
      {/* Slabs & Floors */}
      <line x1="40" y1="135" x2="200" y2="135" strokeWidth="0.75" />
      <line x1="40" y1="112" x2="200" y2="112" strokeWidth="0.75" />
      {/* Central Atrium / Dome */}
      <polygon points="100,50 120,30 140,50" strokeWidth="1" />
      {/* Structural Pillars */}
      <line x1="70" y1="160" x2="70" y2="105" strokeWidth="0.75" />
      <line x1="100" y1="160" x2="100" y2="60" strokeWidth="0.75" />
      <line x1="140" y1="160" x2="140" y2="60" strokeWidth="0.75" />
      <line x1="170" y1="160" x2="170" y2="105" strokeWidth="0.75" />
      {/* Dimension Lines */}
      <line x1="215" y1="90" x2="215" y2="160" strokeWidth="0.5" strokeDasharray="2 2" />
      <circle cx="215" cy="90" r="1.5" fill="currentColor" />
      <circle cx="215" cy="160" r="1.5" fill="currentColor" />
    </svg>
  </div>
);

/**
 * On-screen club ID card with Unified Blueprint Identity (2026-2027).
 * Strictly mirrors utils/cardRenderer.ts for pixel-perfect PNG downloads and print.
 */
export const MemberCard: React.FC<CardData & { className?: string }> = ({
  name,
  role,
  highlight,
  photoUrl,
  qrValue,
  code,
  accent = 'purple',
  badge,
  layoutVariant = 'general',
  cardletIcon,
  className = '',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const colors = CARD_ACCENTS[accent];

  useEffect(() => {
    let cancelled = false;
    cardQrDataUrl(qrValue)
      .then((url) => !cancelled && setQrDataUrl(url))
      .catch(() => !cancelled && setQrDataUrl(''));
    return () => {
      cancelled = true;
    };
  }, [qrValue]);

  // Determine icon for the middle cardlet
  const renderCardletIcon = () => {
    const iconType =
      cardletIcon ||
      (layoutVariant === 'general'
        ? 'users'
        : accent === 'green'
          ? 'megaphone'
          : accent === 'gold'
            ? 'crown'
            : 'zap');

    switch (iconType) {
      case 'users':
        return <Users className="w-6 h-6 text-[#98F7F1]" />;
      case 'megaphone':
        return <Megaphone className="w-6 h-6 text-[#35BC2B]" />;
      case 'crown':
        return <Crown className="w-6 h-6 text-[#FBBF24]" />;
      case 'graduation':
        return <GraduationCap className="w-6 h-6 text-[#3FE7E3]" />;
      case 'zap':
      default:
        return <Zap className="w-6 h-6 text-[#3FE7E3]" />;
    }
  };

  return (
    <div
      dir="rtl"
      className={`w-[360px] max-w-full mx-auto rounded-[28px] overflow-hidden text-right shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(63,231,227,0.12)] relative border border-white/10 ${className}`}
      style={{ background: '#090521' }}
    >
      {/* Top Triple-Color Brand Strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#35BC2B] via-[#3FE7E3] to-[#7F1AB2]" />

      {/* Blueprint Vector Graphics Overlay */}
      <BlueprintBackground />

      {/* Card Content (Elevated above background) */}
      <div className="relative z-10">
        {/* Header: Academic Year Pill + Club & University Names + Hexagon Emblem */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-2 border-b border-white/10">
          {/* Academic Year Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#08041D]/90 border border-[#3FE7E3]/40 shadow-[0_0_10px_rgba(63,231,227,0.15)] text-white text-[11px] font-bold shrink-0">
            <Calendar className="w-3 h-3 text-[#3FE7E3]" />
            <span dir="ltr">{badge || currentAcademicYear()}</span>
          </div>

          {/* Club & University Branding */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="text-right">
              <div className="text-base sm:text-lg font-black text-white leading-tight">
                النادي الهندسي
              </div>
              <div className="text-xs font-semibold text-[#98F7F1]/80 leading-none mt-1">
                جامعة فلسطين
              </div>
              <div className="text-[8px] font-mono tracking-widest text-[#3FE7E3]/60 uppercase mt-0.5" dir="ltr">
                — UP ENGINEERING CLUB —
              </div>
            </div>

            {/* Official Isometric Hexagon Emblem */}
            <img
              src="/brand/emblem-on-dark.png"
              alt="النادي الهندسي"
              className="w-10 h-10 object-contain shrink-0 drop-shadow-[0_0_12px_rgba(63,231,227,0.35)]"
            />
          </div>
        </div>

        {/* Identity Section — Diverges based on layoutVariant */}
        {layoutVariant === 'general' ? (
          /* ==================================================================== */
          /* Variant 1: General Member (Centered Layout)                          */
          /* ==================================================================== */
          <div className="px-5 pt-5 pb-3 flex flex-col items-center text-center">
            {/* Centered Portrait Photo with Glowing Gradient Frame */}
            {photoUrl ? (
              <div className="relative">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#7F1AB2] via-[#3FE7E3] to-[#35BC2B] opacity-70 blur-[3px]" />
                <img
                  src={photoUrl}
                  alt={name}
                  className="relative w-24 h-24 rounded-2xl object-cover border-2 border-[#3FE7E3]/60 shadow-xl"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-[#140B3B] border-2 border-[#3FE7E3]/40 flex items-center justify-center text-2xl font-black text-[#98F7F1] shadow-xl">
                {name.trim().slice(0, 2)}
              </div>
            )}

            {/* Centered Name */}
            <h2
              className="font-black text-white mt-3.5 tracking-tight break-words max-w-full"
              style={{
                fontSize: cardNameFontSize(name, true) + 2,
                lineHeight: `${cardNameFontSize(name, true) + 8}px`,
              }}
            >
              {name}
            </h2>

            {/* Centered Role */}
            <p className="text-sm font-bold text-[#3FE7E3] mt-1">
              {role || 'عضو في النادي الهندسي'}
            </p>

            {/* Centered Gradient Accent Line */}
            <div className="h-0.5 w-24 mx-auto mt-2 rounded-full bg-gradient-to-r from-transparent via-[#3FE7E3] to-transparent shadow-[0_0_8px_rgba(63,231,227,0.4)]" />
          </div>
        ) : (
          /* ==================================================================== */
          /* Variant 2: Executive / Committee Member (Side-by-Side Layout)        */
          /* ==================================================================== */
          <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-4">
            {/* Right Side: Photo with Glowing Frame */}
            {photoUrl ? (
              <div className="relative shrink-0">
                <div
                  className="absolute -inset-1 rounded-2xl opacity-75 blur-[3px]"
                  style={{
                    background: `linear-gradient(135deg, ${colors.bar}, #3FE7E3, #35BC2B)`,
                  }}
                />
                <img
                  src={photoUrl}
                  alt={name}
                  className="relative w-24 h-24 rounded-2xl object-cover border-2 border-white/25 shadow-xl"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-[#140B3B] border-2 border-white/20 flex items-center justify-center text-2xl font-black text-white shrink-0 shadow-xl">
                {name.trim().slice(0, 2)}
              </div>
            )}

            {/* Left Side: Name, Vibrant Role, and Glowing Accent Line */}
            <div className="min-w-0 flex-1 text-right">
              <h2
                className="font-black text-white break-words"
                style={{
                  fontSize: cardNameFontSize(name, true),
                  lineHeight: `${cardNameFontSize(name, true) + 6}px`,
                }}
              >
                {name}
              </h2>

              <div
                className="font-black text-sm sm:text-base mt-1.5 break-words"
                style={{ color: colors.role }}
              >
                {role || 'كادر تنظيمي قيادي'}
              </div>

              {/* Glowing Underline */}
              <div
                className="h-1 w-24 mt-2.5 rounded-full"
                style={{
                  background: colors.bar,
                  boxShadow: `0 0 10px ${colors.bar}`,
                }}
              />
            </div>
          </div>
        )}

        {/* Middle Cardlet (Highlighted Box) with Diagonal Cyber Accent */}
        {highlight?.value && (
          <div className="mx-5 my-2.5">
            <div className="relative rounded-2xl bg-[#0D082E]/80 border border-white/10 p-3.5 backdrop-blur-md overflow-hidden flex items-center justify-between gap-3 shadow-inner">
              {/* Corner Cyber Neon Accent Ribbon */}
              <div className="absolute bottom-0 left-0 w-8 h-8 pointer-events-none overflow-hidden">
                <div className="absolute -bottom-4 -left-4 w-8 h-8 rotate-45 bg-gradient-to-r from-[#35BC2B] to-[#3FE7E3] opacity-80" />
              </div>

              {/* Right Side: Label and Value */}
              <div className="text-right min-w-0 flex-1">
                <div className="text-xs text-gray-400 font-medium">
                  {highlight.label}
                </div>
                <div className="text-base font-black text-white mt-0.5 break-words">
                  {highlight.value}
                </div>
              </div>

              {/* Center Divider & Left Side: Icon */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="h-8 w-px bg-white/10" />
                <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                  {renderCardletIcon()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Technical Tagline */}
        <div className="px-5 py-2 text-center">
          {layoutVariant === 'general' ? (
            <div
              className="text-[9px] font-mono tracking-widest text-[#3FE7E3]/65 uppercase flex items-center justify-center gap-2"
              dir="ltr"
            >
              <span className="w-6 h-px bg-[#3FE7E3]/30" />
              <span>ENGINEERING BUILDS A BETTER TOMORROW</span>
              <span className="w-6 h-px bg-[#3FE7E3]/30" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-0.5" dir="ltr">
              <div className="text-[9px] font-mono tracking-widest text-[#3FE7E3]/65 uppercase flex items-center justify-center gap-2">
                <span className="w-6 h-px bg-[#3FE7E3]/30" />
                <span>ENGINEERING TODAY</span>
                <span className="w-6 h-px bg-[#3FE7E3]/30" />
              </div>
              <div className="text-[8px] font-mono tracking-widest text-[#3FE7E3]/50 uppercase">
                FOR A BETTER TOMORROW
              </div>
            </div>
          )}
        </div>

        {/* Verification Strip (Footer) — ZERO EMAIL, HUD QR, Shield & Official Signature */}
        <div className="px-5 pt-3.5 pb-4 bg-[#050214]/90 border-t border-white/10 relative backdrop-blur-md">
          <div className="flex items-center justify-between gap-3">
            {/* Left: QR Code with 4 Cyber HUD Corner Brackets */}
            <div className="relative p-1 shrink-0">
              {/* HUD Brackets */}
              <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-[#3FE7E3]" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-[#3FE7E3]" />
              <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-[#3FE7E3]" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-[#3FE7E3]" />

              <div className="w-[62px] h-[62px] rounded-lg bg-white p-1 flex items-center justify-center shadow-md">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-gray-200 animate-pulse rounded" />
                )}
              </div>
            </div>

            {/* Center: Shield Verification Badge & Code Pill */}
            <div className="flex flex-col items-center justify-center text-center min-w-0 flex-1">
              <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-300">
                <ShieldCheck className="w-3.5 h-3.5 text-[#35BC2B]" />
                <span>كود التحقق</span>
              </div>
              <div
                className="mt-1 px-3 py-0.5 rounded-full bg-[#0A0524] border border-[#3FE7E3]/45 text-[#3FE7E3] font-mono text-xs font-bold tracking-wider whitespace-nowrap shadow-[0_0_10px_rgba(63,231,227,0.18)]"
                dir="ltr"
              >
                {code}
              </div>
            </div>

            {/* Right: Palestine University & Club Signature */}
            <div className="text-right shrink-0">
              <div className="text-xs font-bold text-gray-200 leading-tight">
                النادي الهندسي
              </div>
              <div className="text-[11px] text-[#98F7F1]/75 leading-tight mt-0.5">
                جامعة فلسطين
              </div>
            </div>
          </div>

          {/* Bottom Subtext Bar */}
          <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-center gap-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[#3FE7E3]/30" />
            <span className="text-[8px] font-mono tracking-widest text-[#3FE7E3]/60 uppercase" dir="ltr">
              PALESTINE UNIVERSITY
            </span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[#3FE7E3]/30" />
          </div>
        </div>
      </div>
    </div>
  );
};
