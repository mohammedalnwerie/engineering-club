import { CARD_ACCENTS, cardQrDataUrl, type CardData } from './memberCard';

/*
 * The club's ID cards are drawn here, on a canvas, and this drawing is what the
 * site shows, downloads and prints — there is no second version in CSS.
 *
 * The card is a credential, not a poster: the person is the loudest thing on it,
 * every line says one thing once, and the only colour that carries meaning is
 * the accent of their role (or red when the card is not valid).
 *
 * 360 × 468 at 1×, exported at 3×, printed 90mm wide.
 */

const W = 360;
const H = 468;
const P = 22;

const SANS = "'Alexandria', 'IBM Plex Sans Arabic', sans-serif";
const MONO = "'JetBrains Mono', monospace";
const ARABIC = /[؀-ۿ]/;

const INK = '#080418';
const PANEL = 'rgba(255, 255, 255, 0.035)';
const HAIRLINE = 'rgba(255, 255, 255, 0.10)';
const MUTED = '#9AA3B2';
const TEXT = '#FFFFFF';

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

interface Assets {
  logo: HTMLImageElement | null;
  qr: HTMLImageElement | null;
  photo: HTMLImageElement | null;
}

/** First letters of the first two words — stands in for a missing photo. */
function monogram(name?: string) {
  const words = (name || '').replace(/^م\.?\s*/, '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'UP';
  // First name + family name, the way initials are read on a badge.
  const letters = words.length > 1 ? [words[0][0], words[words.length - 1][0]] : [words[0][0]];
  return letters.join(' ');
}

function draw(ctx: CanvasRenderingContext2D, card: CardData, assets: Assets) {
  const accent = CARD_ACCENTS[card.accent || 'cyan'];
  const right = W - P;

  /** Writes one line; each string keeps its own direction so digits never jump. */
  const text = (
    value: string,
    x: number,
    y: number,
    font: string,
    color: string,
    align: CanvasTextAlign = 'right'
  ) => {
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.direction = ARABIC.test(value) ? 'rtl' : 'ltr';
    ctx.fillText(value, x, y);
  };

  /** Shrinks to fit, then truncates, so nothing ever spills out of its box. */
  const fit = (value: string, maxWidth: number, weight: number, size: number, family = SANS, min = 9) => {
    let s = size;
    ctx.font = `${weight} ${s}px ${family}`;
    while (ctx.measureText(value).width > maxWidth && s > min) {
      s -= 0.5;
      ctx.font = `${weight} ${s}px ${family}`;
    }
    let out = value;
    if (ctx.measureText(out).width > maxWidth) {
      while (out.length > 4 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1);
      out = `${out}…`;
    }
    return { text: out, font: `${weight} ${s}px ${family}`, size: s };
  };

  /** Wraps within maxWidth at a size that keeps it to `maxLines`. */
  const wrapFit = (value: string, maxWidth: number, weight: number, size: number, maxLines: number, min = 14) => {
    let s = size;
    for (;;) {
      ctx.font = `${weight} ${s}px ${SANS}`;
      const words = value.split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let line = '';
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (ctx.measureText(candidate).width <= maxWidth || !line) line = candidate;
        else {
          lines.push(line);
          line = word;
        }
      }
      if (line) lines.push(line);
      if (lines.length <= maxLines || s <= min) {
        return { lines: lines.slice(0, maxLines), font: `${weight} ${s}px ${SANS}`, size: s };
      }
      s -= 1;
    }
  };

  // ── Body ────────────────────────────────────────────────────────────────
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  // Blueprint grid, barely there: it says "engineering" without shouting.
  ctx.strokeStyle = 'rgba(63, 231, 227, 0.028)';
  ctx.lineWidth = 0.75;
  for (let x = 0; x <= W; x += 26) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let gy = 0; gy <= H; gy += 26) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(W, gy);
    ctx.stroke();
  }

  // The club's three colours as a hairline across the top.
  const strip = ctx.createLinearGradient(0, 0, W, 0);
  strip.addColorStop(0, '#35BC2B');
  strip.addColorStop(0.5, '#3FE7E3');
  strip.addColorStop(1, '#7F1AB2');
  ctx.fillStyle = strip;
  ctx.fillRect(0, 0, W, 4);

  // ── Header: the club's own logo, and one status chip ────────────────────
  const headerTop = 22;
  const LOGO_H = 38;
  if (assets.logo) {
    const ratio = assets.logo.width / assets.logo.height;
    ctx.drawImage(assets.logo, right - LOGO_H * ratio, headerTop, LOGO_H * ratio, LOGO_H);
  }

  const chip = card.badge?.trim();
  if (chip) {
    const chipFit = fit(chip, 124, 700, 10.5);
    ctx.font = chipFit.font;
    const chipW = Math.min(140, ctx.measureText(chipFit.text).width + 22);
    const chipY = headerTop + 9;
    roundRect(ctx, P, chipY, chipW, 22, 11);
    ctx.fillStyle = accent.pillBg;
    ctx.fill();
    ctx.strokeStyle = accent.pillBorder;
    ctx.lineWidth = 1;
    ctx.stroke();
    text(chipFit.text, P + chipW / 2, chipY + 5, chipFit.font, accent.pillText, 'center');
  }

  let y = headerTop + LOGO_H + 18;
  ctx.fillStyle = HAIRLINE;
  ctx.fillRect(P, y, W - 2 * P, 1);
  y += 26;

  // ── Identity: photo (or monogram), name, role ───────────────────────────
  const PHOTO = 96;
  const photoX = right - PHOTO;
  const photoY = y;

  ctx.save();
  roundRect(ctx, photoX, photoY, PHOTO, PHOTO, 20);
  ctx.clip();
  if (assets.photo) {
    const img = assets.photo;
    const s = Math.max(PHOTO / img.width, PHOTO / img.height);
    ctx.drawImage(img, photoX + (PHOTO - img.width * s) / 2, photoY + (PHOTO - img.height * s) / 2, img.width * s, img.height * s);
  } else {
    // A monogram reads as a person; a second club logo would not.
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(photoX, photoY, PHOTO, PHOTO);
    ctx.font = `900 40px ${SANS}`;
    ctx.fillStyle = accent.role;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    ctx.fillText(monogram(card.name), photoX + PHOTO / 2, photoY + PHOTO / 2 + 2);
  }
  ctx.restore();
  roundRect(ctx, photoX + 0.5, photoY + 0.5, PHOTO - 1, PHOTO - 1, 20);
  ctx.strokeStyle = accent.pillBorder;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // The accent spine: the one bold move on the card.
  const spineX = photoX - 16;
  const spineGrad = ctx.createLinearGradient(0, photoY, 0, photoY + PHOTO);
  spineGrad.addColorStop(0, accent.bar);
  spineGrad.addColorStop(1, 'rgba(255,255,255,0.06)');
  ctx.fillStyle = spineGrad;
  roundRect(ctx, spineX, photoY + 2, 4, PHOTO - 4, 2);
  ctx.fill();

  const textRight = spineX - 14;
  const textW = textRight - P;
  const name = wrapFit(card.name || 'قريباً يُعلن', textW, 900, 22, 2);
  name.lines.forEach((line, i) => text(line, textRight, photoY + 2 + i * (name.size + 7), name.font, TEXT));

  const roleTop = photoY + 2 + name.lines.length * (name.size + 7) + 6;
  if (card.role) {
    const role = fit(card.role, textW, 700, 14, SANS, 10);
    text(role.text, textRight, roleTop, role.font, accent.role);
  }

  y = photoY + PHOTO + 26;

  // ── Data strip: two facts, labelled, nothing decorative ─────────────────
  const facts = (card.fields || []).filter((f) => f.value).slice(0, 2);
  if (facts.length) {
    const colW = (W - 2 * P - 20) / 2;
    facts.forEach((f, i) => {
      const cellRight = i === 0 ? right : right - colW - 20;
      const label = fit(f.label, colW, 500, 10.5, SANS, 8);
      const value = fit(f.value, colW, 700, 13.5, SANS, 10);
      text(label.text, cellRight, y, label.font, MUTED);
      text(value.text, cellRight, y + 15, value.font, TEXT);
    });
    y += 42;
  }

  // ── Status: one sentence, one dot, said once ────────────────────────────
  if (card.highlight?.value) {
    const boxH = card.highlight.subvalue ? 60 : 46;
    roundRect(ctx, P, y, W - 2 * P, boxH, 14);
    ctx.fillStyle = PANEL;
    ctx.fill();
    ctx.strokeStyle = HAIRLINE;
    ctx.lineWidth = 1;
    ctx.stroke();

    const innerRight = right - 14;
    const innerW = W - 2 * P - 44;

    ctx.beginPath();
    ctx.arc(innerRight - 4, y + 20, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = accent.bar;
    ctx.fill();

    const title = fit(card.highlight.value, innerW, 800, 14, SANS, 10);
    text(title.text, innerRight - 14, y + 13, title.font, TEXT);
    if (card.highlight.subvalue) {
      const sub = fit(card.highlight.subvalue, innerW + 14, 500, 11, SANS, 9);
      text(sub.text, innerRight, y + 35, sub.font, MUTED);
    }
  }

  // ── Footer: how anyone checks this card is real ─────────────────────────
  const footerTop = H - 104;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.fillRect(0, footerTop, W, H - footerTop);
  ctx.fillStyle = HAIRLINE;
  ctx.fillRect(0, footerTop, W, 1);

  const QR = 62;
  const qrX = P;
  const qrY = footerTop + 21;
  roundRect(ctx, qrX, qrY, QR, QR, 8);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  if (assets.qr) ctx.drawImage(assets.qr, qrX + 4, qrY + 4, QR - 8, QR - 8);

  text('كود التحقق', right, footerTop + 22, `500 10.5px ${SANS}`, MUTED);
  const code = fit(card.code, W - 2 * P - QR - 20, 700, 12, MONO, 8);
  text(code.text, right, footerTop + 37, code.font, accent.role);
  text('امسح الرمز للتحقق من البطاقة', right, footerTop + 57, `500 10px ${SANS}`, MUTED);
  text('النادي الهندسي · جامعة فلسطين', right, footerTop + 75, `700 10px ${SANS}`, 'rgba(255,255,255,0.45)');

  // ── A card that cannot be used says so across its face ──────────────────
  const stamp = card.validityStatus === 'expired' ? 'منتهية' : card.validityStatus === 'suspended' ? 'معلّقة' : '';
  if (stamp) {
    ctx.save();
    ctx.translate(W / 2, H * 0.70);
    ctx.rotate((-14 * Math.PI) / 180);
    const stampW = 236;
    const stampH = 44;
    roundRect(ctx, -stampW / 2, -stampH / 2, stampW, stampH, 10);
    ctx.fillStyle = 'rgba(8, 4, 24, 0.88)';
    ctx.fill();
    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = card.validityStatus === 'expired' ? '#EF4444' : '#F59E0B';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = `900 19px ${SANS}`;
    ctx.fillStyle = card.validityStatus === 'expired' ? '#FCA5A5' : '#FDE68A';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    ctx.fillText(`عضوية ${stamp}`, 0, 0);
    ctx.restore();
  }
}

/** Renders the card to a PNG data URL at `scale`× resolution. */
export async function renderCardPng(card: CardData, scale = 3): Promise<string> {
  await Promise.all([
    document.fonts.load(`900 22px Alexandria`),
    document.fonts.load(`700 14px Alexandria`),
    document.fonts.load(`500 11px Alexandria`),
    document.fonts.load(`700 12px 'JetBrains Mono'`),
  ]).catch(() => undefined);

  const [logo, qr, photo] = await Promise.all([
    loadImage('/brand/logo-horizontal-on-dark.png'),
    cardQrDataUrl(card.qrValue).then(loadImage).catch(() => null),
    card.photoUrl ? loadImage(card.photoUrl) : Promise.resolve(null),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  roundRect(ctx, 0.5, 0.5, W - 1, H - 1, 26);
  ctx.save();
  ctx.clip();
  draw(ctx, card, { logo, qr, photo });
  ctx.restore();

  roundRect(ctx, 0.5, 0.5, W - 1, H - 1, 26);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
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
