import React, { useEffect, useRef, useState } from 'react';
import { renderCardPng } from '../utils/cardRenderer';
import type { CardData } from '../utils/memberCard';

export type { CardData, CardField } from '../utils/memberCard';

/**
 * The club ID card. What you see here is the exact image that gets downloaded
 * and printed: the card used to be drawn twice — once in CSS and once on a
 * canvas — and the two drifted apart, so the screen now shows the canvas.
 */
export const MemberCard: React.FC<CardData & { className?: string }> = ({ className = '', ...card }) => {
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);
  // Redraw only when something printed on the card actually changes.
  const signature = JSON.stringify(card);
  const cardRef = useRef(card);
  cardRef.current = card;

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    renderCardPng(cardRef.current)
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [signature]);

  const label = [card.name, card.role].filter(Boolean).join(' — ');

  if (failed) {
    return (
      <div
        dir="rtl"
        className={`w-[360px] max-w-full mx-auto rounded-3xl border border-white/10 bg-[#090521] p-6 text-right ${className}`}
      >
        <div className="text-base font-black text-white">{card.name}</div>
        {card.role && <div className="text-sm text-gray-300 mt-1">{card.role}</div>}
        <div className="text-sm text-gray-500 mt-3">تعذر رسم البطاقة. حدّث الصفحة وحاول مرة أخرى.</div>
      </div>
    );
  }

  return (
    <div dir="rtl" className={`w-[360px] max-w-full mx-auto ${className}`}>
      {src ? (
        <img src={src} alt={`بطاقة ${label}`} className="w-full h-auto rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.55)]" />
      ) : (
        <div
          className="w-full rounded-3xl bg-[#090521] border border-white/10 animate-pulse"
          style={{ aspectRatio: '360 / 500' }}
          aria-hidden="true"
        />
      )}

      {/* The image carries the design; this keeps the details readable by screen readers. */}
      <div className="sr-only">
        {label}
        {card.highlight?.value ? ` — ${card.highlight.label}: ${card.highlight.value}` : ''}
        {card.validitySubtext ? ` — ${card.validitySubtext}` : ''}
        {` — كود التحقق: ${card.code}`}
      </div>
    </div>
  );
};
