import { CARD_ACCENTS, CARD_COLORS, cardNameFontSize, cardQrDataUrl, currentAcademicYear, type CardData } from './memberCard';

/*
 * Draws the club ID card directly on a canvas. This replaces DOM screenshots
 * (html-to-image), which cropped RTL layouts, dropped web fonts and could hang.
 * Measurements mirror components/MemberCard.tsx.
 */

const W = 360;
const P = 24;
const SANS = "'Alexandria', 'IBM Plex Sans Arabic', sans-serif";
const MONO = "'JetBrains Mono', monospace";

const loadImage = (src: string) =>
  new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

interface Assets {
  emblem: HTMLImageElement | null;
  qr: HTMLImageElement | null;
  photo: HTMLImageElement | null;
}

/** Lays out the card; draws only when `draw` is true. Returns the total height. */
function layout(ctx: CanvasRenderingContext2D, card: CardData, assets: Assets, draw: boolean): number {
  const colors = CARD_ACCENTS[card.accent || 'purple'];
  const right = W - P;
  const text = (value: string, x: number, y: number, font: string, color: string, dir: CanvasDirection = 'rtl') => {
    if (!draw) return;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.direction = dir;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(value, x, y);
  };

  let y = 6; // brand strip

  // Header (emblem 44 + 20 top + 16 bottom)
  const headerTop = y + 20;
  if (draw && assets.emblem) ctx.drawImage(assets.emblem, right - 44, headerTop, 44, 44);
  text('النادي الهندسي', right - 44 - 12, headerTop + 2, `900 16px ${SANS}`, CARD_COLORS.text);
  text('جامعة فلسطين', right - 44 - 12, headerTop + 26, `400 12px ${SANS}`, CARD_COLORS.muted);

  const badge = card.badge || currentAcademicYear();
  ctx.font = `700 12px ${SANS}`;
  const pillW = ctx.measureText(badge).width + 24;
  const pillY = headerTop + 22 - 13;
  if (draw) {
    roundRect(ctx, P, pillY, pillW, 26, 13);
    ctx.fillStyle = colors.pillBg;
    ctx.fill();
    ctx.strokeStyle = colors.pillBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  const badgeDir: CanvasDirection = /[؀-ۿ]/.test(badge) ? 'rtl' : 'ltr';
  text(badge, P + pillW - 12, pillY + 6, `700 12px ${SANS}`, colors.pillText, badgeDir);

  y = headerTop + 44 + 16;
  if (draw) {
    ctx.fillStyle = CARD_COLORS.divider;
    ctx.fillRect(0, y, W, 1);
  }
  y += 1 + 24;

  // Identity
  const identityTop = y;
  let textRight = right;
  const PHOTO = 88;
  if (card.photoUrl && assets.photo) {
    if (draw) {
      ctx.save();
      roundRect(ctx, right - PHOTO, identityTop, PHOTO, PHOTO, 16);
      ctx.clip();
      const img = assets.photo;
      const s = Math.max(PHOTO / img.width, PHOTO / img.height);
      ctx.drawImage(
        img,
        right - PHOTO + (PHOTO - img.width * s) / 2,
        identityTop + (PHOTO - img.height * s) / 2,
        img.width * s,
        img.height * s
      );
      ctx.restore();
    }
    textRight = right - PHOTO - 16;
  }
  const nameRight = textRight - 4 - 12;
  const nameSize = cardNameFontSize(card.name);
  const nameFont = `900 ${nameSize}px ${SANS}`;
  const nameLine = nameSize + 6;
  ctx.font = nameFont;
  const nameLines = wrapLines(ctx, card.name, nameRight - P);
  nameLines.forEach((line, i) => text(line, nameRight, identityTop + i * nameLine + 2, nameFont, CARD_COLORS.text));
  let blockBottom = identityTop + nameLines.length * nameLine;
  if (card.role) {
    text(card.role, nameRight, blockBottom + 6 + 2, `700 14px ${SANS}`, colors.role);
    blockBottom += 6 + 20;
  }
  if (draw) {
    roundRect(ctx, textRight - 4, identityTop, 4, blockBottom - identityTop, 2);
    ctx.fillStyle = colors.bar;
    ctx.fill();
  }
  y = Math.max(blockBottom, card.photoUrl && assets.photo ? identityTop + PHOTO : 0);

  // Committee band
  if (card.highlight?.value) {
    y += 20;
    ctx.font = `700 16px ${SANS}`;
    const valueLines = wrapLines(ctx, card.highlight.value, W - 2 * P - 32);
    const bandH = 14 + 16 + 4 + valueLines.length * 22 + 14;
    if (draw) {
      roundRect(ctx, P, y, W - 2 * P, bandH, 16);
      ctx.fillStyle = colors.bandBg;
      ctx.fill();
      ctx.strokeStyle = colors.bandBorder;
      ctx.stroke();
    }
    text(card.highlight.label, right - 16, y + 14 + 1, `400 12px ${SANS}`, '#D1D5DB');
    valueLines.forEach((line, i) => text(line, right - 16, y + 14 + 20 + i * 22 + 2, `700 16px ${SANS}`, CARD_COLORS.text));
    y += bandH;
  }

  // Details grid
  const details = (card.fields || []).filter((f) => f.value);
  if (details.length) {
    y += 16;
    const colW = (W - 2 * P - 24) / 2;
    let rowTop = y;
    let rowHeight = 0;
    details.forEach((f, i) => {
      const wide = f.small || (details.length % 2 === 1 && i === details.length - 1);
      const col = wide ? 0 : i % 2;
      if (col === 0 && i > 0) {
        rowTop += rowHeight + 16;
        rowHeight = 0;
      }
      const cellRight = col === 0 ? right : right - colW - 24;
      const cellWidth = wide ? W - 2 * P : colW;
      const valueFont = f.small ? `700 12px ${SANS}` : `700 14px ${SANS}`;
      const valueLine = f.small ? 16 : 20;
      ctx.font = valueFont;
      const lines = wrapLines(ctx, f.value, cellWidth);
      text(f.label, cellRight, rowTop + 1, `400 12px ${SANS}`, CARD_COLORS.muted);
      lines.forEach((line, li) =>
        text(line, cellRight, rowTop + 20 + li * valueLine + 2, valueFont, CARD_COLORS.text, f.small ? 'ltr' : 'rtl')
      );
      rowHeight = Math.max(rowHeight, 20 + lines.length * valueLine);
    });
    y = rowTop + rowHeight;
  }
  y += 24;

  // Verification strip
  const footerTop = y;
  const footerH = 16 + 72 + 16;
  if (draw) {
    ctx.fillStyle = CARD_COLORS.footerBg;
    ctx.fillRect(0, footerTop, W, footerH);
    ctx.fillStyle = CARD_COLORS.divider;
    ctx.fillRect(0, footerTop, W, 1);
    roundRect(ctx, P, footerTop + 16, 72, 72, 12);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    if (assets.qr) ctx.drawImage(assets.qr, P + 6, footerTop + 22, 60, 60);
  }
  const textTop = footerTop + 16 + (72 - 64) / 2;
  text('كود التحقق', right, textTop + 1, `400 12px ${SANS}`, CARD_COLORS.muted);
  text(card.code, right, textTop + 20 + 2, `700 14px ${MONO}`, CARD_COLORS.code, 'ltr');
  text('امسح الرمز للتحقق من البطاقة', right, textTop + 48 + 1, `400 12px ${SANS}`, CARD_COLORS.muted);

  return footerTop + footerH;
}

/** Renders the card to a PNG data URL at `scale`× resolution. */
export async function renderCardPng(card: CardData, scale = 3): Promise<string> {
  await Promise.all([
    document.fonts.load(`900 22px Alexandria`),
    document.fonts.load(`700 14px Alexandria`),
    document.fonts.load(`400 12px Alexandria`),
    document.fonts.load(`700 14px 'JetBrains Mono'`),
  ]).catch(() => undefined);

  const [emblem, qr, photo] = await Promise.all([
    loadImage('/brand/emblem-on-dark.png'),
    cardQrDataUrl(card.qrValue).then(loadImage).catch(() => null),
    card.photoUrl ? loadImage(card.photoUrl) : Promise.resolve(null),
  ]);
  const assets = { emblem, qr, photo };

  const measureCtx = document.createElement('canvas').getContext('2d')!;
  const height = layout(measureCtx, card, assets, false);

  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Card body clipped to rounded corners (transparent outside)
  roundRect(ctx, 0.5, 0.5, W - 1, height - 1, 24);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = CARD_COLORS.background;
  ctx.fillRect(0, 0, W, height);
  const strip = ctx.createLinearGradient(0, 0, W, 0);
  strip.addColorStop(0, CARD_COLORS.strip[0]);
  strip.addColorStop(0.5, CARD_COLORS.strip[1]);
  strip.addColorStop(1, CARD_COLORS.strip[2]);
  ctx.fillStyle = strip;
  ctx.fillRect(0, 0, W, 6);
  layout(ctx, card, assets, true);
  ctx.restore();

  roundRect(ctx, 0.5, 0.5, W - 1, height - 1, 24);
  ctx.strokeStyle = CARD_COLORS.border;
  ctx.lineWidth = 1;
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

export async function downloadCardPng(card: CardData, filename: string): Promise<void> {
  const dataUrl = await renderCardPng(card);
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Prints only the card (as the rendered image), centered on the page. */
export async function printCard(card: CardData): Promise<void> {
  const dataUrl = await renderCardPng(card);
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(`<!doctype html><html dir="rtl"><head><title>بطاقة النادي الهندسي</title>
    <style>
      @page { margin: 12mm; }
      html, body { margin: 0; height: 100%; }
      body { display: flex; align-items: flex-start; justify-content: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      img { width: 90mm; height: auto; }
    </style></head><body><img src="${dataUrl}" alt=""></body></html>`);
  doc.close();
  const img = doc.querySelector('img')!;
  if (!img.complete) await new Promise((r) => (img.onload = r));
  frame.contentWindow!.focus();
  frame.contentWindow!.print();
  setTimeout(() => frame.remove(), 1000);
}
