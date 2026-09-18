import { CARD_ACCENTS, cardNameFontSize, cardQrDataUrl, currentAcademicYear, type CardData } from './memberCard';

/*
 * Draws the club ID card directly on a canvas with the Unified Blueprint Identity (2026-2027).
 * Strictly mirrors components/MemberCard.tsx with zero coordinate collision.
 */

const W = 360;
const P = 20;
const SANS = "'Alexandria', 'IBM Plex Sans Arabic', sans-serif";
const MONO = "'JetBrains Mono', monospace";

/** Any Arabic letter — decides a string's base direction on the canvas. */
const ARABIC = /[؀-ۿ]/;

/** Every card in the family prints at the same height. */
const MIN_HEIGHT = 500;

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

/** Draws real, sharp vector icons for the middle cardlet. */
function drawCardletIcon(ctx: CanvasRenderingContext2D, iconType: string, cx: number, cy: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (iconType === 'graduation') {
    // Mortarboard diamond
    ctx.beginPath();
    ctx.moveTo(cx, cy - 7);
    ctx.lineTo(cx + 12, cy - 2);
    ctx.lineTo(cx, cy + 3);
    ctx.lineTo(cx - 12, cy - 2);
    ctx.closePath();
    ctx.stroke();

    // Cap lower band
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy + 1);
    ctx.lineTo(cx - 7, cy + 5);
    ctx.bezierCurveTo(cx - 7, cy + 9, cx + 7, cy + 9, cx + 7, cy + 5);
    ctx.lineTo(cx + 7, cy + 1);
    ctx.stroke();

    // Tassel
    ctx.beginPath();
    ctx.moveTo(cx + 12, cy - 2);
    ctx.lineTo(cx + 12, cy + 7);
    ctx.stroke();
  } else if (iconType === 'megaphone') {
    // Horn cone
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 3);
    ctx.lineTo(cx + 6, cy - 8);
    ctx.lineTo(cx + 6, cy + 8);
    ctx.lineTo(cx - 7, cy + 3);
    ctx.closePath();
    ctx.stroke();

    // Handle
    ctx.beginPath();
    ctx.moveTo(cx - 3, cy + 4);
    ctx.lineTo(cx - 5, cy + 10);
    ctx.stroke();

    // Sound wave arc
    ctx.beginPath();
    ctx.arc(cx - 8, cy, 4, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
  } else if (iconType === 'crown') {
    // 3-point Crown
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy + 6);
    ctx.lineTo(cx - 10, cy - 3);
    ctx.lineTo(cx - 5, cy + 1);
    ctx.lineTo(cx, cy - 6);
    ctx.lineTo(cx + 5, cy + 1);
    ctx.lineTo(cx + 10, cy - 3);
    ctx.lineTo(cx + 10, cy + 6);
    ctx.closePath();
    ctx.stroke();

    // Jewels
    ctx.beginPath();
    ctx.arc(cx - 10, cy - 4, 1.2, 0, Math.PI * 2);
    ctx.arc(cx, cy - 7, 1.2, 0, Math.PI * 2);
    ctx.arc(cx + 10, cy - 4, 1.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (iconType === 'zap') {
    // Lightning Bolt
    ctx.beginPath();
    ctx.moveTo(cx + 2, cy - 9);
    ctx.lineTo(cx - 5, cy - 1);
    ctx.lineTo(cx, cy - 1);
    ctx.lineTo(cx - 2, cy + 9);
    ctx.lineTo(cx + 5, cy + 1);
    ctx.lineTo(cx, cy + 1);
    ctx.closePath();
    ctx.stroke();
  } else {
    // Users (Default)
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 4, 3.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx - 4, cy + 8, 7, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx + 5, cy - 2, 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 5, cy + 9, 6, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();
  }

  ctx.restore();
}

/** Draws small green shield checkmark in footer. */
function drawShieldCheck(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.strokeStyle = '#35BC2B';
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(cx, cy - 6);
  ctx.lineTo(cx + 6, cy - 3);
  ctx.lineTo(cx + 6, cy + 1);
  ctx.bezierCurveTo(cx + 6, cy + 6, cx, cy + 8, cx, cy + 8);
  ctx.bezierCurveTo(cx, cy + 8, cx - 6, cy + 6, cx - 6, cy + 1);
  ctx.lineTo(cx - 6, cy - 3);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 2.5, cy + 0.5);
  ctx.lineTo(cx - 0.5, cy + 2.5);
  ctx.lineTo(cx + 3, cy - 1.5);
  ctx.stroke();

  ctx.restore();
}

/** Lays out the card; draws only when `draw` is true. Returns the total height. */
function layout(
  ctx: CanvasRenderingContext2D,
  card: CardData,
  assets: Assets,
  draw: boolean,
  /** Final height when drawing, so every card in the family prints the same size. */
  fixedHeight?: number
): number {
  const colors = CARD_ACCENTS[card.accent || 'purple'];
  const right = W - P;
  const isGeneral = card.layoutVariant === 'general';

  // Strict LTR canvas direction ensures math coordinates NEVER flip unexpectedly
  ctx.direction = 'ltr';

  const text = (
    value: string,
    x: number,
    y: number,
    font: string,
    color: string,
    align: CanvasTextAlign = 'right'
  ) => {
    if (!draw) return;
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    // Each string gets its own base direction: an Arabic sentence containing
    // digits, brackets or bullets reorders wrongly under a global LTR base.
    ctx.direction = ARABIC.test(value) ? 'rtl' : 'ltr';
    ctx.fillText(value, x, y);
  };

  /** Shrinks, then truncates, so a long title never spills out of its box. */
  const fit = (value: string, maxWidth: number, weight: number, size: number, family = SANS, minSize = 9) => {
    let current = size;
    ctx.font = `${weight} ${current}px ${family}`;
    while (ctx.measureText(value).width > maxWidth && current > minSize) {
      current -= 0.5;
      ctx.font = `${weight} ${current}px ${family}`;
    }
    let out = value;
    if (ctx.measureText(out).width > maxWidth) {
      while (out.length > 4 && ctx.measureText(`${out}…`).width > maxWidth) out = out.slice(0, -1);
      out = `${out}…`;
    }
    return { text: out, font: `${weight} ${current}px ${family}` };
  };

  let y = 6; // Below the brand gradient strip

  // =========================================================================
  // 1. Header: Emblem & Branding on RIGHT, Academic Year Pill on LEFT
  // =========================================================================
  const headerTop = y + 14;
  const EMBLEM_SIZE = 40;

  if (draw && assets.emblem) {
    ctx.drawImage(assets.emblem, right - EMBLEM_SIZE, headerTop, EMBLEM_SIZE, EMBLEM_SIZE);
  }

  // Right Side: Club & University Branding
  const brandX = right - EMBLEM_SIZE - 10;
  text('النادي الهندسي', brandX, headerTop - 2, `900 17px ${SANS}`, '#FFFFFF', 'right');
  text('جامعة فلسطين', brandX, headerTop + 18, `600 11px ${SANS}`, '#98F7F1', 'right');
  text('— ENGINEERING CLUB —', brandX, headerTop + 33, `600 7.5px ${MONO}`, 'rgba(63, 231, 227, 0.7)', 'right');
  text('University of Palestine', brandX, headerTop + 43, `500 7px ${SANS}`, '#9CA3AF', 'right');

  // Left Side: Academic Year / Validity Pill
  const badgeText = card.badge || currentAcademicYear();
  ctx.font = `700 10.5px ${SANS}`;
  const badgeW = ctx.measureText(badgeText).width;
  const pillW = Math.max(84, Math.min(136, Math.round(badgeW + 24)));
  const pillH = 22;
  const pillX = P;
  const pillY = headerTop + 10;
  if (draw) {
    roundRect(ctx, pillX, pillY, pillW, pillH, 11);
    ctx.fillStyle =
      card.validityStatus === 'suspended'
        ? 'rgba(69, 26, 3, 0.95)'
        : card.validityStatus === 'expired'
          ? 'rgba(69, 10, 10, 0.9)'
          : 'rgba(8, 4, 29, 0.9)';
    ctx.fill();
    ctx.strokeStyle =
      card.validityStatus === 'suspended'
        ? 'rgba(245, 158, 11, 0.8)'
        : card.validityStatus === 'expired'
          ? 'rgba(239, 68, 68, 0.6)'
          : card.validityStatus === 'temporary'
            ? 'rgba(245, 158, 11, 0.5)'
            : card.validityStatus === 'accredited'
              ? 'rgba(251, 191, 36, 0.5)'
              : 'rgba(63, 231, 227, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  const pillTextColor =
    card.validityStatus === 'suspended'
      ? '#FDE68A'
      : card.validityStatus === 'expired'
        ? '#FCA5A5'
        : card.validityStatus === 'temporary'
          ? '#FDE68A'
          : card.validityStatus === 'accredited'
            ? '#FDE68A'
            : '#FFFFFF';
  text(badgeText, pillX + pillW / 2, pillY + 4, `700 10.5px ${SANS}`, pillTextColor, 'center');

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
        const caption = fit('عضو النادي الهندسي', PHOTO - 12, 700, 10, SANS, 7);
        text(caption.text, photoX + PHOTO / 2, photoY + 68, caption.font, '#98F7F1', 'center');
      }
      ctx.restore();
    }

    // Centered Name
    const nameY = photoY + PHOTO + 14;
    const nameSize = cardNameFontSize(card.name, true) + 2;
    text(card.name, W / 2, nameY, `900 ${nameSize}px ${SANS}`, '#FFFFFF', 'center');

    // Centered Role
    const roleY = nameY + nameSize + 6;
    const generalRole = fit(card.role || 'عضو في النادي الهندسي', W - 2 * P - 20, 700, 13);
    text(generalRole.text, W / 2, roleY, generalRole.font, '#3FE7E3', 'center');

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

        const execCaption = fit(card.role || 'كادر قيادي', PHOTO - 10, 700, 9, SANS, 7);
        text(execCaption.text, photoX + PHOTO / 2, photoY + 58, execCaption.font, '#98F7F1', 'center');
      }
      ctx.restore();
    }

    // Text on the left (Right-aligned in RTL layout)
    const textX = photoX - 14;
    const nameSize = cardNameFontSize(card.name, true);
    ctx.font = `900 ${nameSize}px ${SANS}`;
    const nameLines = wrapLines(ctx, card.name, textX - P);
    nameLines.forEach((l, i) => text(l, textX, photoY + 6 + i * (nameSize + 6), `900 ${nameSize}px ${SANS}`, '#FFFFFF', 'right'));

    const roleY = photoY + 6 + nameLines.length * (nameSize + 6) + 2;
    const execRole = fit(card.role || 'كادر تنظيمي قيادي', textX - P, 800, 13.5);
    text(execRole.text, textX, roleY, execRole.font, colors.role, 'right');

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
    const hasSubvalue = Boolean(card.highlight.subvalue);
    const cardletH = hasSubvalue ? 70 : 62;
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
      const iconBoxY = cardletY + Math.round((cardletH - 40) / 2);
      roundRect(ctx, P + 10, iconBoxY, 40, 40, 12);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
      ctx.stroke();

      // Draw real vector icon inside icon box
      const iconType =
        card.cardletIcon ||
        (isGeneral
          ? 'users'
          : card.accent === 'green'
            ? 'megaphone'
            : card.accent === 'gold'
              ? 'crown'
              : 'zap');
      drawCardletIcon(ctx, iconType, P + 30, cardletY + Math.round(cardletH / 2), colors.role || '#3FE7E3');
    }

    // Right Side: Label, Value, and Validity Subvalue
    const contentX = right - 14;
    const cardletTextW = cardletW - 80;
    if (hasSubvalue) {
      const lbl = fit(card.highlight.label, cardletTextW, 500, 10);
      const val = fit(card.highlight.value, cardletTextW, 800, 14);
      text(lbl.text, contentX, cardletY + 11, lbl.font, '#9CA3AF', 'right');
      text(val.text, contentX, cardletY + 28, val.font, '#FFFFFF', 'right');
      const subtextColor =
        card.validityStatus === 'suspended'
          ? '#FDE68A'
          : card.validityStatus === 'expired'
            ? '#FCA5A5'
            : card.validityStatus === 'temporary'
              ? '#FDE68A'
              : card.validityStatus === 'accredited'
                ? '#FDE68A'
                : '#98F7F1';
      const sub = fit(`● ${card.highlight.subvalue}`, cardletTextW, 600, 10);
      text(sub.text, contentX, cardletY + 47, sub.font, subtextColor, 'right');
    } else {
      const lbl = fit(card.highlight.label, cardletTextW, 500, 11);
      const val = fit(card.highlight.value, cardletTextW, 800, 15);
      text(lbl.text, contentX, cardletY + 13, lbl.font, '#9CA3AF', 'right');
      text(val.text, contentX, cardletY + 30, val.font, '#FFFFFF', 'right');
    }

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
    text('ENGINEERING TODAY', W / 2, taglineY, `700 8px ${MONO}`, 'rgba(63, 231, 227, 0.65)', 'center');
    text('FOR A BETTER TOMORROW', W / 2, taglineY + 11, `600 7px ${MONO}`, 'rgba(63, 231, 227, 0.50)', 'center');
    y = taglineY + 28;
  }

  // =========================================================================
  // 5. Verification Footer (Zero Overlap, Guaranteed Separation)
  // =========================================================================
  const footerH = 100;
  // Pin the footer to the bottom of the fixed height; short cards gain air above it.
  const footerTop = fixedHeight ? Math.max(y + 8, fixedHeight - footerH) : y + 8;

  if (draw) {
    // Footer Background & Top Divider
    ctx.fillStyle = 'rgba(5, 2, 20, 0.92)';
    ctx.fillRect(0, footerTop, W, footerH);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.fillRect(0, footerTop, W, 1);

    // Left: QR Code Frame (from x=24 to x=82)
    const QR_BOX = 58;
    const qrX = P + 4;
    const qrY = footerTop + 14;

    roundRect(ctx, qrX, qrY, QR_BOX, QR_BOX, 8);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    if (assets.qr) {
      ctx.drawImage(assets.qr, qrX + 3, qrY + 3, QR_BOX - 6, QR_BOX - 6);
    }

    // 4 Cyber HUD Corner Brackets around QR
    drawHudCorners(ctx, qrX - 3, qrY - 3, QR_BOX + 6, QR_BOX + 6, 7);

    // Center: Verification Area (centerX = 180, pill from 110 to 250)
    const centerX = 180;
    const pillBoxW = 140;
    const pillBoxH = 22;
    const pillBoxX = centerX - pillBoxW / 2;
    const pillBoxY = footerTop + 34;

    // Small Shield Check
    drawShieldCheck(ctx, centerX - 38, footerTop + 18);

    // "كود التحقق"
    text('كود التحقق', centerX + 4, footerTop + 14, `600 11px ${SANS}`, '#D1D5DB', 'center');

    // Code Pill
    roundRect(ctx, pillBoxX, pillBoxY, pillBoxW, pillBoxH, 11);
    ctx.fillStyle = '#0A0524';
    ctx.fill();
    ctx.strokeStyle = 'rgba(63, 231, 227, 0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Code Text
    text(card.code, centerX, pillBoxY + 4, `700 10.5px ${MONO}`, '#3FE7E3', 'center');

    // Right: Palestine University & Club Signature (from x=270 to x=340)
    text('النادي الهندسي', right, footerTop + 20, `800 12px ${SANS}`, '#E5E7EB', 'right');
    text('جامعة فلسطين', right, footerTop + 36, `600 11px ${SANS}`, '#98F7F1', 'right');

    // Bottom Subtext Bar: Palestine University
    ctx.strokeStyle = 'rgba(63, 231, 227, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(P + 20, footerTop + 84);
    ctx.lineTo(W / 2 - 60, footerTop + 84);
    ctx.moveTo(W / 2 + 60, footerTop + 84);
    ctx.lineTo(W - P - 20, footerTop + 84);
    ctx.stroke();

    text('PALESTINE UNIVERSITY', W / 2, footerTop + 80, `700 8px ${MONO}`, 'rgba(63, 231, 227, 0.60)', 'center');
  }

  return footerTop + footerH;
}

function drawStatusStamp(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  label: string,
  border: string,
  textColor: string
) {
  ctx.save();
  ctx.translate(width / 2, height * 0.44);
  ctx.rotate((-16 * Math.PI) / 180);

  const stampW = 280;
  const stampH = 34;

  // Frosted dark box
  roundRect(ctx, -stampW / 2, -stampH / 2, stampW, stampH, 12);
  ctx.fillStyle = 'rgba(9, 5, 33, 0.92)';
  ctx.fill();

  // Dashed border in the status colour
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = border;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);

  // Bold text
  ctx.font = `900 13px ${SANS}`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = 'rtl';
  ctx.fillText(label, 0, 0);

  ctx.restore();
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
  const height = Math.max(MIN_HEIGHT, layout(measureCtx, card, assets, false));

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
  layout(ctx, card, assets, true, height);

  // 5. A card that cannot be used says so across its face
  if (card.validityStatus === 'suspended') {
    drawStatusStamp(ctx, W, height, 'عضوية معلّقة — SUSPENDED', '#F59E0B', '#FDE68A');
  } else if (card.validityStatus === 'expired') {
    drawStatusStamp(ctx, W, height, 'عضوية منتهية — EXPIRED', '#EF4444', '#FCA5A5');
  }

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
