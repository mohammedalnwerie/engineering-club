import { CARD_ACCENTS, cardNameFontSize, cardQrDataUrl, currentAcademicYear, type CardData } from './memberCard';

/*
 * Draws the club ID card directly on a canvas with the Unified Blueprint Identity (2026-2027).
 * Strictly mirrors components/MemberCard.tsx.
 */

const W = 360;
const P = 20;
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

/** Draws the technical blueprint vector background (gears, building facade, grid). */
function drawBlueprintBackground(ctx: CanvasRenderingContext2D, height: number) {
  ctx.save();

  // 1. Subtle Isometric / Technical Grid
  ctx.strokeStyle = 'rgba(63, 231, 227, 0.035)';
  ctx.lineWidth = 0.75;
  for (let x = 0; x <= W; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 24) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // 2. Top-Left Cyber Neon Diagonal Ribbon
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(44, 0);
  ctx.lineTo(0, 44);
  ctx.closePath();
  const cornerGrad = ctx.createLinearGradient(0, 0, 44, 44);
  cornerGrad.addColorStop(0, '#35BC2B');
  cornerGrad.addColorStop(0.5, '#3FE7E3');
  cornerGrad.addColorStop(1, '#7F1AB2');
  ctx.fillStyle = cornerGrad;
  ctx.fill();

  // 3. Mechanical Blueprint Gear (Middle Left)
  const gx = 10;
  const gy = 200;
  ctx.strokeStyle = 'rgba(63, 231, 227, 0.12)';
  ctx.fillStyle = 'rgba(63, 231, 227, 0.12)';

  // Pitch Circle (Dashed)
  ctx.beginPath();
  ctx.arc(gx, gy, 70, 0, Math.PI * 2);
  ctx.setLineDash([4, 3]);
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.setLineDash([]);

  // Root Circle
  ctx.beginPath();
  ctx.arc(gx, gy, 50, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Hub Circle
  ctx.beginPath();
  ctx.arc(gx, gy, 20, 0, Math.PI * 2);
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Inner Hub Dot
  ctx.beginPath();
  ctx.arc(gx, gy, 7, 0, Math.PI * 2);
  ctx.fill();

  // Spokes
  for (let i = 0; i < 6; i++) {
    const rad = (i * 60 * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(gx + Math.cos(rad) * 20, gy + Math.sin(rad) * 20);
    ctx.lineTo(gx + Math.cos(rad) * 50, gy + Math.sin(rad) * 50);
    ctx.stroke();
  }

  // Gear Teeth
  for (let i = 0; i < 12; i++) {
    const rad = (i * 30 * Math.PI) / 180;
    ctx.save();
    ctx.translate(gx, gy);
    ctx.rotate(rad);
    ctx.strokeRect(-5, -78, 10, 12);
    ctx.restore();
  }

  // 4. Architectural Building Facade (Bottom Right)
  const bx = 280;
  const by = height - 120;
  ctx.strokeStyle = 'rgba(63, 231, 227, 0.11)';
  ctx.lineWidth = 0.8;

  // Ground lines
  ctx.beginPath();
  ctx.moveTo(bx - 140, by + 80);
  ctx.lineTo(bx + 70, by + 80);
  ctx.stroke();

  // Building wireframe block
  ctx.beginPath();
  ctx.moveTo(bx - 120, by + 80);
  ctx.lineTo(bx - 120, by + 20);
  ctx.lineTo(bx - 40, by - 15);
  ctx.lineTo(bx + 40, by + 20);
  ctx.lineTo(bx + 40, by + 80);
  ctx.stroke();

  // Slabs
  ctx.beginPath();
  ctx.moveTo(bx - 120, by + 60);
  ctx.lineTo(bx + 40, by + 60);
  ctx.moveTo(bx - 120, by + 40);
  ctx.lineTo(bx + 40, by + 40);
  ctx.stroke();

  // Pillars
  ctx.beginPath();
  ctx.moveTo(bx - 80, by + 80);
  ctx.lineTo(bx - 80, by + 30);
  ctx.moveTo(bx, by + 80);
  ctx.lineTo(bx, by + 30);
  ctx.stroke();

  ctx.restore();
}

/** Draws the 4 HUD corner brackets around a box. */
function drawHudCorners(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, size = 8) {
  ctx.save();
  ctx.strokeStyle = '#3FE7E3';
  ctx.lineWidth = 2;

  // Top-Left
  ctx.beginPath();
  ctx.moveTo(x, y + size);
  ctx.lineTo(x, y);
  ctx.lineTo(x + size, y);
  ctx.stroke();

  // Top-Right
  ctx.beginPath();
  ctx.moveTo(x + w - size, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + size);
  ctx.stroke();

  // Bottom-Left
  ctx.beginPath();
  ctx.moveTo(x, y + h - size);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + size, y + h);
  ctx.stroke();

  // Bottom-Right
  ctx.beginPath();
  ctx.moveTo(x + w - size, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - size);
  ctx.stroke();

  ctx.restore();
}

/** Lays out the card; draws only when `draw` is true. Returns the total height. */
function layout(ctx: CanvasRenderingContext2D, card: CardData, assets: Assets, draw: boolean): number {
  const colors = CARD_ACCENTS[card.accent || 'purple'];
  const right = W - P;
  const isGeneral = card.layoutVariant === 'general';

  const text = (
    value: string,
    x: number,
    y: number,
    font: string,
    color: string,
    dir: CanvasDirection = 'rtl',
    align: CanvasTextAlign = 'right'
  ) => {
    if (!draw) return;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.direction = dir;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillText(value, x, y);
  };

  let y = 6; // Below the brand gradient strip

  // =========================================================================
  // 1. Header: Emblem (Right), Club Name (Middle), Academic Year Pill (Left)
  // =========================================================================
  const headerTop = y + 14;
  const EMBLEM_SIZE = 40;

  if (draw && assets.emblem) {
    ctx.drawImage(assets.emblem, right - EMBLEM_SIZE, headerTop, EMBLEM_SIZE, EMBLEM_SIZE);
  }

  // Club & University Branding (to the left of emblem in RTL)
  const brandX = right - EMBLEM_SIZE - 10;
  text('النادي الهندسي', brandX, headerTop - 2, `900 17px ${SANS}`, '#FFFFFF', 'rtl', 'right');
  text('جامعة فلسطين', brandX, headerTop + 18, `600 11px ${SANS}`, '#98F7F1', 'rtl', 'right');
  text('— ENGINEERING CLUB —', brandX, headerTop + 33, `600 7.5px ${MONO}`, 'rgba(63, 231, 227, 0.7)', 'ltr', 'right');
  text('University of Palestine', brandX, headerTop + 43, `500 7px ${SANS}`, '#9CA3AF', 'ltr', 'right');

  // Academic Year Pill (Left)
  const badgeText = card.badge || currentAcademicYear();
  const pillW = 84;
  const pillH = 22;
  const pillX = P;
  const pillY = headerTop + 10;
  if (draw) {
    roundRect(ctx, pillX, pillY, pillW, pillH, 11);
    ctx.fillStyle = 'rgba(8, 4, 29, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(63, 231, 227, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  text(badgeText, pillX + pillW / 2, pillY + 4, `700 11px ${SANS}`, '#FFFFFF', 'ltr', 'center');

  // Header Divider
  y = headerTop + EMBLEM_SIZE + 16;
  if (draw) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.fillRect(0, y, W, 1);
  }
  y += 1;

  // =========================================================================
  // 2. Identity Section (Diverges by Variant)
  // =========================================================================
  if (isGeneral) {
    // -----------------------------------------------------------------------
    // Variant 1: General Member (Centered Layout)
    // -----------------------------------------------------------------------
    const PHOTO = 104;
    const photoX = (W - PHOTO) / 2;
    const photoY = y + 16;

    if (draw) {
      // Glowing Border Frame
      ctx.save();
      roundRect(ctx, photoX - 2, photoY - 2, PHOTO + 4, PHOTO + 4, 24);
      ctx.strokeStyle = 'rgba(63, 231, 227, 0.65)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Photo clipping
      roundRect(ctx, photoX, photoY, PHOTO, PHOTO, 22);
      ctx.clip();
      if (assets.photo) {
        const img = assets.photo;
        const s = Math.max(PHOTO / img.width, PHOTO / img.height);
        ctx.drawImage(
          img,
          photoX + (PHOTO - img.width * s) / 2,
          photoY + (PHOTO - img.height * s) / 2,
          img.width * s,
          img.height * s
        );
      } else {
        // Blueprint Placeholder matching media_1789735381242.png
        ctx.fillStyle = '#090526';
        ctx.fillRect(photoX, photoY, PHOTO, PHOTO);

        // Blueprint Crosshairs
        ctx.strokeStyle = 'rgba(63, 231, 227, 0.25)';
        ctx.lineWidth = 0.75;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(photoX, photoY + PHOTO / 2);
        ctx.lineTo(photoX + PHOTO, photoY + PHOTO / 2);
        ctx.moveTo(photoX + PHOTO / 2, photoY);
        ctx.lineTo(photoX + PHOTO / 2, photoY + PHOTO);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(photoX + PHOTO / 2, photoY + 40, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Hexagon Emblem
        if (assets.emblem) {
          ctx.drawImage(assets.emblem, photoX + (PHOTO - 44) / 2, photoY + 12, 44, 44);
        }

        // Emblem Subtext
        text('عضو النادي الهندسي', photoX + PHOTO / 2, photoY + 68, `700 10px ${SANS}`, '#98F7F1', 'rtl', 'center');
      }
      ctx.restore();
    }

    // Centered Name
    const nameY = photoY + PHOTO + 14;
    const nameSize = cardNameFontSize(card.name, true) + 2;
    text(card.name, W / 2, nameY, `900 ${nameSize}px ${SANS}`, '#FFFFFF', 'rtl', 'center');

    // Centered Role
    const roleY = nameY + nameSize + 6;
    text(card.role || 'عضو في النادي الهندسي', W / 2, roleY, `700 13px ${SANS}`, '#3FE7E3', 'rtl', 'center');

    // Centered Gradient Accent Line
    if (draw) {
      const lineW = 96;
      const lineX = (W - lineW) / 2;
      const lineY = roleY + 22;
      const grad = ctx.createLinearGradient(lineX, 0, lineX + lineW, 0);
      grad.addColorStop(0, 'rgba(63, 231, 227, 0)');
      grad.addColorStop(0.5, 'rgba(63, 231, 227, 0.9)');
      grad.addColorStop(1, 'rgba(63, 231, 227, 0)');
      ctx.fillStyle = grad;
      roundRect(ctx, lineX, lineY, lineW, 2, 1);
      ctx.fill();
    }

    y = roleY + 34;
  } else {
    // -----------------------------------------------------------------------
    // Variant 2: Executive / Committee Member (Side-by-Side Layout)
    // -----------------------------------------------------------------------
    const PHOTO = 92;
    const photoX = right - PHOTO;
    const photoY = y + 16;

    if (draw) {
      // Glowing Border Frame
      ctx.save();
      roundRect(ctx, photoX - 2, photoY - 2, PHOTO + 4, PHOTO + 4, 18);
      ctx.strokeStyle = colors.bar || '#3FE7E3';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Photo clipping
      roundRect(ctx, photoX, photoY, PHOTO, PHOTO, 16);
      ctx.clip();
      if (assets.photo) {
        const img = assets.photo;
        const s = Math.max(PHOTO / img.width, PHOTO / img.height);
        ctx.drawImage(
          img,
          photoX + (PHOTO - img.width * s) / 2,
          photoY + (PHOTO - img.height * s) / 2,
          img.width * s,
          img.height * s
        );
      } else {
        // Blueprint Placeholder for Executive
        ctx.fillStyle = '#090526';
        ctx.fillRect(photoX, photoY, PHOTO, PHOTO);

        // Blueprint Crosshairs
        ctx.strokeStyle = 'rgba(63, 231, 227, 0.25)';
        ctx.lineWidth = 0.75;
        ctx.setLineDash([3, 2]);
        ctx.beginPath();
        ctx.moveTo(photoX, photoY + PHOTO / 2);
        ctx.lineTo(photoX + PHOTO, photoY + PHOTO / 2);
        ctx.moveTo(photoX + PHOTO / 2, photoY);
        ctx.lineTo(photoX + PHOTO / 2, photoY + PHOTO);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(photoX + PHOTO / 2, photoY + 36, 22, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        if (assets.emblem) {
          ctx.drawImage(assets.emblem, photoX + (PHOTO - 38) / 2, photoY + 10, 38, 38);
        }

        text(card.role || 'كادر قيادي', photoX + PHOTO / 2, photoY + 58, `700 9px ${SANS}`, '#98F7F1', 'rtl', 'center');
      }
      ctx.restore();
    }

    // Text on the left (Right-aligned in RTL)
    const textX = photoX - 14;
    const nameSize = cardNameFontSize(card.name, true);
    ctx.font = `900 ${nameSize}px ${SANS}`;
    const nameLines = wrapLines(ctx, card.name, textX - P);
    nameLines.forEach((l, i) => text(l, textX, photoY + 6 + i * (nameSize + 6), `900 ${nameSize}px ${SANS}`, '#FFFFFF', 'rtl', 'right'));

    const roleY = photoY + 6 + nameLines.length * (nameSize + 6) + 2;
    text(card.role || 'كادر تنظيمي قيادي', textX, roleY, `800 14px ${SANS}`, colors.role, 'rtl', 'right');

    // Glowing Underline Bar
    if (draw) {
      const barW = 88;
      const barY = roleY + 22;
      roundRect(ctx, textX - barW, barY, barW, 3, 1.5);
      ctx.fillStyle = colors.bar;
      ctx.fill();
    }

    y = Math.max(photoY + PHOTO + 16, roleY + 36);
  }

  // =========================================================================
  // 3. Middle Cardlet (Highlighted Box with Diagonal Cyber Corner)
  // =========================================================================
  if (card.highlight?.value) {
    const cardletH = 62;
    const cardletY = y + 8;
    const cardletW = W - 2 * P;

    if (draw) {
      // Frosted Glass Panel
      roundRect(ctx, P, cardletY, cardletW, cardletH, 16);
      ctx.fillStyle = 'rgba(13, 8, 46, 0.85)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Corner Diagonal Cyber Neon Slash (Bottom-Left)
      ctx.save();
      roundRect(ctx, P, cardletY, cardletW, cardletH, 16);
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(P, cardletY + cardletH - 24);
      ctx.lineTo(P + 24, cardletY + cardletH);
      ctx.lineTo(P, cardletY + cardletH);
      ctx.closePath();
      const slashGrad = ctx.createLinearGradient(P, cardletY + cardletH, P + 24, cardletY + cardletH - 24);
      slashGrad.addColorStop(0, '#35BC2B');
      slashGrad.addColorStop(1, '#3FE7E3');
      ctx.fillStyle = slashGrad;
      ctx.fill();
      ctx.restore();

      // Vertical Divider between Icon area and Text area
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(P + 52, cardletY + 12, 1, cardletH - 24);

      // Icon Representation Badge (Left side)
      roundRect(ctx, P + 14, cardletY + 14, 34, 34, 10);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
      ctx.stroke();

      // Simple technical emblem inside icon box
      ctx.fillStyle = colors.role || '#3FE7E3';
      ctx.beginPath();
      ctx.arc(P + 31, cardletY + 31, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Right Side: Label and Value
    const contentX = right - 14;
    text(card.highlight.label, contentX, cardletY + 13, `500 11px ${SANS}`, '#9CA3AF', 'rtl', 'right');
    text(card.highlight.value, contentX, cardletY + 30, `800 15px ${SANS}`, '#FFFFFF', 'rtl', 'right');

    y = cardletY + cardletH + 8;
  }

  // =========================================================================
  // 4. Technical Tagline
  // =========================================================================
  const taglineY = y + 8;
  if (isGeneral) {
    if (draw) {
      // Horizontal Rules
      ctx.strokeStyle = 'rgba(63, 231, 227, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(P + 10, taglineY + 4);
      ctx.lineTo(P + 38, taglineY + 4);
      ctx.moveTo(W - P - 38, taglineY + 4);
      ctx.lineTo(W - P - 10, taglineY + 4);
      ctx.stroke();
    }
    text(
      'ENGINEERING BUILDS A BETTER TOMORROW',
      W / 2,
      taglineY,
      `700 8px ${MONO}`,
      'rgba(63, 231, 227, 0.65)',
      'ltr',
      'center'
    );
    y = taglineY + 18;
  } else {
    if (draw) {
      ctx.strokeStyle = 'rgba(63, 231, 227, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(P + 40, taglineY + 4);
      ctx.lineTo(P + 70, taglineY + 4);
      ctx.moveTo(W - P - 70, taglineY + 4);
      ctx.lineTo(W - P - 40, taglineY + 4);
      ctx.stroke();
    }
    text('ENGINEERING TODAY', W / 2, taglineY, `700 8px ${MONO}`, 'rgba(63, 231, 227, 0.65)', 'ltr', 'center');
    text('FOR A BETTER TOMORROW', W / 2, taglineY + 11, `600 7px ${MONO}`, 'rgba(63, 231, 227, 0.50)', 'ltr', 'center');
    y = taglineY + 28;
  }

  // =========================================================================
  // 5. Verification Footer (ZERO EMAIL, HUD QR, Shield & Official Signature)
  // =========================================================================
  const footerTop = y + 8;
  const footerH = 106;

  if (draw) {
    // Footer Background & Top Divider
    ctx.fillStyle = 'rgba(5, 2, 20, 0.92)';
    ctx.fillRect(0, footerTop, W, footerH);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.fillRect(0, footerTop, W, 1);

    // QR Code Frame (Left)
    const QR_BOX = 62;
    const qrX = P + 4;
    const qrY = footerTop + 12;

    roundRect(ctx, qrX, qrY, QR_BOX, QR_BOX, 8);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    if (assets.qr) {
      ctx.drawImage(assets.qr, qrX + 3, qrY + 3, QR_BOX - 6, QR_BOX - 6);
    }

    // 4 Cyber HUD Corner Brackets around QR
    drawHudCorners(ctx, qrX - 3, qrY - 3, QR_BOX + 6, QR_BOX + 6, 8);

    // Code Pill (Center)
    const pillBoxW = 126;
    const pillBoxH = 22;
    const pillBoxX = W / 2 - pillBoxW / 2 + 10;
    const pillBoxY = footerTop + 34;

    roundRect(ctx, pillBoxX, pillBoxY, pillBoxW, pillBoxH, 11);
    ctx.fillStyle = '#0A0524';
    ctx.fill();
    ctx.strokeStyle = 'rgba(63, 231, 227, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Bottom Subtext Bar
    ctx.strokeStyle = 'rgba(63, 231, 227, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(P + 20, footerTop + 88);
    ctx.lineTo(W / 2 - 60, footerTop + 88);
    ctx.moveTo(W / 2 + 60, footerTop + 88);
    ctx.lineTo(W - P - 20, footerTop + 88);
    ctx.stroke();
  }

  // Verification Code Texts (Center)
  text('كود التحقق', W / 2 + 10, footerTop + 16, `600 11px ${SANS}`, '#D1D5DB', 'rtl', 'center');
  text(card.code, W / 2 + 10, footerTop + 39, `700 12px ${MONO}`, '#3FE7E3', 'ltr', 'center');

  // Official Signature (Right)
  text('النادي الهندسي', right, footerTop + 22, `800 12px ${SANS}`, '#E5E7EB', 'rtl', 'right');
  text('جامعة فلسطين', right, footerTop + 38, `600 11px ${SANS}`, '#98F7F1', 'rtl', 'right');

  // Palestine University Bottom Subtext
  text('PALESTINE UNIVERSITY', W / 2, footerTop + 84, `700 8px ${MONO}`, 'rgba(63, 231, 227, 0.60)', 'ltr', 'center');

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

  // Card body clipped to rounded corners
  roundRect(ctx, 0.5, 0.5, W - 1, height - 1, 28);
  ctx.save();
  ctx.clip();

  // 1. Deep Space Tech Background
  ctx.fillStyle = '#090521';
  ctx.fillRect(0, 0, W, height);

  // 2. Blueprint Background (Grid, Gear, Facade)
  drawBlueprintBackground(ctx, height);

  // 3. Top Triple-Color Brand Strip
  const strip = ctx.createLinearGradient(0, 0, W, 0);
  strip.addColorStop(0, '#35BC2B');
  strip.addColorStop(0.5, '#3FE7E3');
  strip.addColorStop(1, '#7F1AB2');
  ctx.fillStyle = strip;
  ctx.fillRect(0, 0, W, 6);

  // 4. Draw Card Content
  layout(ctx, card, assets, true);
  ctx.restore();

  // Subtle Border Stroke
  roundRect(ctx, 0.5, 0.5, W - 1, height - 1, 28);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
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
