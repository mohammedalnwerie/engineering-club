import QRCode from 'qrcode';
import { SOCIAL_META } from '../data/socials';

export interface LanyardBadgeData {
  name: string;
  nameEn?: string;
  role: string;
  roleEn?: string;
  code: string;
  academicYear?: string;
  university?: string;
  photoUrl?: string | null;
  verifyUrl: string;
}

const W = 600;
const H = 950;
const SANS = "'Alexandria', 'IBM Plex Sans Arabic', system-ui, sans-serif";
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

/** Draws a crisp vector user silhouette icon on canvas without emojis. */
function drawUserIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  // Head
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.22, size * 0.22, 0, Math.PI * 2);
  ctx.fill();
  // Shoulders
  ctx.beginPath();
  ctx.arc(cx, cy + size * 0.45, size * 0.42, Math.PI * 1.15, Math.PI * 1.85);
  ctx.lineTo(cx + size * 0.38, cy + size * 0.42);
  ctx.lineTo(cx - size * 0.38, cy + size * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Draws a crisp vector calendar icon on canvas without emojis. */
function drawCalendarIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  const w = size * 0.85;
  const h = size * 0.85;
  const x = cx - w / 2;
  const y = cy - h / 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  roundRect(ctx, x, y, w, h, 3);
  ctx.stroke();
  // Header divider
  ctx.beginPath();
  ctx.moveTo(x, y + h * 0.32);
  ctx.lineTo(x + w, y + h * 0.32);
  ctx.stroke();
  // Two binder rings
  ctx.beginPath();
  ctx.moveTo(x + w * 0.28, y - 2.5);
  ctx.lineTo(x + w * 0.28, y + 2.5);
  ctx.moveTo(x + w * 0.72, y - 2.5);
  ctx.lineTo(x + w * 0.72, y + 2.5);
  ctx.stroke();
  // Small dot inside calendar
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy + h * 0.16, 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draws a crisp vector university/institution icon on canvas without emojis. */
function drawBuildingIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  const w = size * 0.9;
  const h = size * 0.85;
  const x = cx - w / 2;
  const y = cy - h / 2;
  ctx.fillStyle = color;
  // Roof / pediment triangle
  ctx.beginPath();
  ctx.moveTo(cx, y);
  ctx.lineTo(x + w, y + h * 0.32);
  ctx.lineTo(x, y + h * 0.32);
  ctx.closePath();
  ctx.fill();
  // Base
  ctx.fillRect(x, y + h - 2.5, w, 2.5);
  // Three Columns
  const colW = 2;
  const colTop = y + h * 0.36;
  const colH = h * 0.44;
  ctx.fillRect(x + w * 0.18 - colW / 2, colTop, colW, colH);
  ctx.fillRect(cx - colW / 2, colTop, colW, colH);
  ctx.fillRect(x + w * 0.82 - colW / 2, colTop, colW, colH);
  ctx.restore();
}

/** Draws an SVG path with exact scale and color on canvas. */
function drawSvgIcon(ctx: CanvasRenderingContext2D, pathData: string, x: number, y: number, size: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  const scale = size / 24;
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(pathData));
  ctx.restore();
}

/** Translates common club roles to official English titles. */
export function toEnglishRole(role: string): string {
  const r = (role || '').trim();
  if (r.includes('رئيس النادي') && !r.includes('نائب')) return 'Club President';
  if (r.includes('نائب رئيس النادي')) return 'Vice President';
  if (r.includes('الإعلام') || r.includes('الاتصال')) return 'Head of Media & Communication';
  if (r.includes('الأنشطة') || r.includes('البرامج')) return 'Head of Activities & Programs';
  if (r.includes('العلاقات') || r.includes('الشراكات')) return 'Head of Relations & Partnerships';
  if (r.includes('برمجيات') || r.includes('ذكاء اصطناعي')) return 'Faculty Rep. - Software & AI';
  if (r.includes('تكنولوجيا المعلومات')) return 'Faculty Rep. - IT';
  if (r.includes('تطبيقية') || r.includes('تخطيط')) return 'Faculty Rep. - Applied Engineering';
  if (r.includes('ممثل') || r.includes('منسق')) return 'Faculty Representative';
  if (r.includes('أمين الصندوق')) return 'Treasurer';
  if (r.includes('أمين السر')) return 'Secretary';
  if (r.includes('مسؤول') || r.includes('رئيس')) return 'Committee Head';
  if (r.includes('عضو')) return 'Executive Board Member';
  return 'Leadership Member';
}

/** Smart phonetical transliteration of Arabic names into clean English Latin letters. */
export function arabicToEnglishName(name: string): string {
  const clean = name.trim().replace(/^م\.\s*/, '');
  const dictionary: Record<string, string> = {
    'سامر قنوع': 'SAMER QUNOO',
    'محمد النويري': 'MOHAMMED AL NWIERE',
    'محمد ناصر النويري': 'MOHAMMED AL NWIERE',
    'محمد ناصر جميل النويري': 'MOHAMMED AL NWIERE',
    'حمزة عبد الله خضر': 'HAMZA KHADER',
    'أحمد مصطفى شراب': 'AHMAD SHORRAB',
    'أحمد شراب': 'AHMAD SHORRAB',
    'براء السلوت': 'BARAA AL SALOUT',
    'هندسة': 'ENGINEERING',
  };
  if (dictionary[clean]) return dictionary[clean];

  const map: Record<string, string> = {
    'أ': 'A', 'إ': 'E', 'آ': 'AA', 'ا': 'A', 'ب': 'B', 'ت': 'T', 'ث': 'TH',
    'ج': 'J', 'ح': 'H', 'خ': 'KH', 'د': 'D', 'ذ': 'TH', 'ر': 'R', 'ز': 'Z',
    'س': 'S', 'ش': 'SH', 'ص': 'S', 'ض': 'D', 'ط': 'T', 'ظ': 'Z', 'ع': 'A',
    'غ': 'GH', 'ف': 'F', 'ق': 'Q', 'ك': 'K', 'ل': 'L', 'م': 'M', 'ن': 'N',
    'ه': 'H', 'و': 'OU', 'ي': 'I', 'ى': 'A', 'ة': 'A', 'ئ': 'E', 'ء': '',
  };

  const words = clean.split(/\s+/).filter(Boolean);
  const latinWords = words.map((w) => {
    let out = '';
    for (const char of w) {
      out += map[char] || char;
    }
    return out.toUpperCase();
  });
  return latinWords.slice(0, 3).join(' ');
}

/**
 * Draws the Front Face of the Vertical Lanyard Badge.
 */
export async function renderLanyardFront(data: LanyardBadgeData, scale = 2): Promise<string> {
  await Promise.all([
    document.fonts.load(`900 32px Alexandria`),
    document.fonts.load(`700 24px Alexandria`),
    document.fonts.load(`600 16px Alexandria`),
    document.fonts.load(`700 18px 'JetBrains Mono'`),
  ]).catch(() => undefined);

  const qrDataUrl = await QRCode.toDataURL(data.verifyUrl || 'https://engineering-club-phi.vercel.app', {
    margin: 1,
    width: 200,
    color: { dark: '#0A1128', light: '#FFFFFF' },
  }).catch(() => '');

  const [emblem, photo, qr] = await Promise.all([
    loadImage('/brand/emblem.png'),
    data.photoUrl ? loadImage(data.photoUrl) : Promise.resolve(null),
    qrDataUrl ? loadImage(qrDataUrl) : Promise.resolve(null),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Outer border & card background clipping
  roundRect(ctx, 0, 0, W, H, 32);
  ctx.save();
  ctx.clip();

  // 1. Pure white background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // 2. Subtle geometric line pattern in background
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }

  // 3. Right & Top-Right Geometric Tri-color Shapes
  // Purple top wedge
  ctx.fillStyle = '#7F1AB2';
  ctx.beginPath();
  ctx.moveTo(W - 140, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, 110);
  ctx.lineTo(W - 80, 160);
  ctx.closePath();
  ctx.fill();

  // Cyan accent wedge
  ctx.fillStyle = '#00E5FF';
  ctx.beginPath();
  ctx.moveTo(W - 60, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, 140);
  ctx.closePath();
  ctx.fill();

  // Green lower-right wedge
  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.moveTo(W, 160);
  ctx.lineTo(W, 230);
  ctx.lineTo(W - 75, 205);
  ctx.closePath();
  ctx.fill();

  // 4. Lanyard Hole Punch Slot Indicator
  ctx.fillStyle = '#E2E8F0';
  roundRect(ctx, W / 2 - 32, 28, 64, 16, 8);
  ctx.fill();
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 5. Header: Emblem & Text
  if (emblem) {
    ctx.drawImage(emblem, 42, 58, 62, 62);
  }
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';

  // "النادي الهندسي"
  ctx.font = `900 23px ${SANS}`;
  ctx.fillStyle = '#10B981';
  ctx.fillText('النادي الهندسي', W - 165, 62);

  // "ENGINEERING CLUB"
  ctx.font = `800 15px ${SANS}`;
  ctx.fillStyle = '#7F1AB2';
  ctx.fillText('ENGINEERING CLUB', W - 165, 90);

  // "جامعة فلسطين — UNIVERSITY OF PALESTINE"
  ctx.font = `600 11px ${SANS}`;
  ctx.fillStyle = '#64748B';
  ctx.fillText('جامعة فلسطين | UNIVERSITY OF PALESTINE', W - 165, 112);

  // 6. Photo Box
  const photoW = 320;
  const photoH = 370;
  const photoX = (W - photoW) / 2;
  const photoY = 160;

  // Photo outer shadow & frame
  ctx.save();
  roundRect(ctx, photoX, photoY, photoW, photoH, 24);
  ctx.shadowColor = 'rgba(15, 23, 42, 0.14)';
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#0F172A';
  ctx.fill();
  ctx.restore();

  // Draw Photo
  ctx.save();
  roundRect(ctx, photoX, photoY, photoW, photoH, 24);
  ctx.clip();
  if (photo) {
    // Aspect-ratio cover
    const scaleFactor = Math.max(photoW / photo.width, photoH / photo.height);
    const sw = photo.width * scaleFactor;
    const sh = photo.height * scaleFactor;
    const sx = photoX + (photoW - sw) / 2;
    const sy = photoY + (photoH - sh) / 2;
    ctx.drawImage(photo, sx, sy, sw, sh);
  } else {
    // Fallback: Gradient with monogram initials
    const grad = ctx.createLinearGradient(photoX, photoY, photoX + photoW, photoY + photoH);
    grad.addColorStop(0, '#0F172A');
    grad.addColorStop(0.5, '#1E293B');
    grad.addColorStop(1, '#0A1128');
    ctx.fillStyle = grad;
    ctx.fillRect(photoX, photoY, photoW, photoH);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 64px ${SANS}`;
    ctx.fillStyle = '#3FE7E3';
    ctx.fillText(data.name.slice(0, 1) || 'UP', photoX + photoW / 2, photoY + photoH / 2);
  }
  ctx.restore();

  // Photo border
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 4;
  roundRect(ctx, photoX, photoY, photoW, photoH, 24);
  ctx.stroke();

  // 7. Name Section
  const nameY = 560;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // Arabic Name
  ctx.font = `900 32px ${SANS}`;
  ctx.fillStyle = '#0F172A';
  ctx.fillText(data.name, W / 2, nameY);

  // English Name
  const nameEn = data.nameEn || arabicToEnglishName(data.name);
  ctx.font = `800 17px ${SANS}`;
  ctx.fillStyle = '#475569';
  ctx.fillText(nameEn, W / 2, nameY + 28);

  // Tri-color horizontal divider
  const barW = 180;
  const barX = (W - barW) / 2;
  const barY = nameY + 42;
  const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  grad.addColorStop(0, '#10B981');
  grad.addColorStop(0.5, '#7F1AB2');
  grad.addColorStop(1, '#00E5FF');
  ctx.fillStyle = grad;
  roundRect(ctx, barX, barY, barW, 4, 2);
  ctx.fill();

  // 8. Role Section
  const roleY = barY + 36;
  ctx.font = `900 24px ${SANS}`;
  ctx.fillStyle = '#0A1128';
  ctx.fillText(data.role, W / 2, roleY);

  const roleEn = data.roleEn || toEnglishRole(data.role);
  ctx.font = `700 15px ${SANS}`;
  ctx.fillStyle = '#64748B';
  ctx.fillText(roleEn, W / 2, roleY + 24);

  // 9. Details & Verification Box
  const boxX = 48;
  const boxY = roleY + 44;
  const boxW = W - boxX * 2;
  const boxH = 120;

  ctx.fillStyle = '#F8FAFC';
  roundRect(ctx, boxX, boxY, boxW, boxH, 20);
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // QR Code on the Left
  if (qr) {
    ctx.drawImage(qr, boxX + 20, boxY + 12, 78, 78);
  }
  ctx.textAlign = 'center';
  ctx.font = `700 9px ${SANS}`;
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('Scan for more', boxX + 59, boxY + 104);

  // Divider inside box
  ctx.beginPath();
  ctx.moveTo(boxX + 118, boxY + 16);
  ctx.lineTo(boxX + 118, boxY + boxH - 16);
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Right-hand side details (Arabic RTL)
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  const iconX = boxX + boxW - 24;

  // Code
  ctx.font = `800 15px ${MONO}`;
  ctx.fillStyle = '#0F172A';
  ctx.fillText(data.code, boxX + boxW - 55, boxY + 30);
  ctx.fillStyle = '#F1F5F9';
  ctx.beginPath();
  ctx.arc(iconX, boxY + 30, 13, 0, Math.PI * 2);
  ctx.fill();
  drawUserIcon(ctx, iconX, boxY + 30, 15, '#475569');

  // Year
  ctx.font = `700 14px ${SANS}`;
  ctx.fillStyle = '#334155';
  ctx.fillText(data.academicYear || '2026 - 2027', boxX + boxW - 55, boxY + 60);
  ctx.fillStyle = '#F1F5F9';
  ctx.beginPath();
  ctx.arc(iconX, boxY + 60, 13, 0, Math.PI * 2);
  ctx.fill();
  drawCalendarIcon(ctx, iconX, boxY + 60, 15, '#475569');

  // University
  ctx.font = `700 13px ${SANS}`;
  ctx.fillStyle = '#334155';
  ctx.fillText(data.university || 'University of Palestine', boxX + boxW - 55, boxY + 90);
  ctx.fillStyle = '#F1F5F9';
  ctx.beginPath();
  ctx.arc(iconX, boxY + 90, 13, 0, Math.PI * 2);
  ctx.fill();
  drawBuildingIcon(ctx, iconX, boxY + 90, 15, '#475569');

  // 10. Bottom Navy Bar with Motto
  const barHeight = 68;
  ctx.fillStyle = '#0A1128';
  ctx.fillRect(0, H - barHeight, W, barHeight);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 15px ${SANS}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('—  معاً نبني مستقبلاً هندسياً أفضل  —', W / 2, H - barHeight / 2);

  ctx.restore();

  // Outer border
  roundRect(ctx, 0.5, 0.5, W - 1, H - 1, 32);
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

/**
 * Draws the Back Face of the Vertical Lanyard Badge.
 */
export async function renderLanyardBack(scale = 2): Promise<string> {
  await Promise.all([
    document.fonts.load(`900 28px Alexandria`),
    document.fonts.load(`800 22px Alexandria`),
    document.fonts.load(`700 16px Alexandria`),
    document.fonts.load(`600 13px Alexandria`),
  ]).catch(() => undefined);

  const emblem = await loadImage('/brand/emblem.png');

  const canvas = document.createElement('canvas');
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Outer border & card background clipping
  roundRect(ctx, 0, 0, W, H, 32);
  ctx.save();
  ctx.clip();

  // 1. Deep Navy Background
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#0B132B');
  bgGrad.addColorStop(0.5, '#070C1E');
  bgGrad.addColorStop(1, '#050814');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. Faint Architectural Silhouette / Watermark of UP Gate
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 2;
  // Arch outline
  ctx.beginPath();
  ctx.arc(W / 2, 490, 180, Math.PI, 0);
  ctx.lineTo(W / 2 + 180, 720);
  ctx.lineTo(W / 2 - 180, 720);
  ctx.closePath();
  ctx.stroke();
  // Columns
  for (let i = -140; i <= 140; i += 70) {
    ctx.beginPath();
    ctx.moveTo(W / 2 + i, 490);
    ctx.lineTo(W / 2 + i, 720);
    ctx.stroke();
  }
  ctx.restore();

  // 3. Right & Bottom-Right Geometric Tri-color Shapes (Back Echo)
  ctx.fillStyle = '#7F1AB2';
  ctx.beginPath();
  ctx.moveTo(W, 460);
  ctx.lineTo(W, 580);
  ctx.lineTo(W - 90, 520);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#00E5FF';
  ctx.beginPath();
  ctx.moveTo(W, 570);
  ctx.lineTo(W, 670);
  ctx.lineTo(W - 70, 620);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#10B981';
  ctx.beginPath();
  ctx.moveTo(W, 660);
  ctx.lineTo(W, 760);
  ctx.lineTo(W - 85, 710);
  ctx.closePath();
  ctx.fill();

  // 4. Lanyard Hole Punch Slot Indicator
  ctx.fillStyle = '#1E293B';
  roundRect(ctx, W / 2 - 32, 28, 64, 16, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 5. Header: Large 3D Emblem & Official Branding
  if (emblem) {
    ctx.drawImage(emblem, (W - 130) / 2, 75, 130, 130);
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  // "النادي الهندسي"
  ctx.font = `900 28px ${SANS}`;
  ctx.fillStyle = '#10B981';
  ctx.fillText('النادي الهندسي', W / 2, 255);

  // "ENGINEERING CLUB"
  ctx.font = `800 18px ${SANS}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('ENGINEERING CLUB', W / 2, 285);

  // Values: "إبداع . مبادرة . مجتمع"
  ctx.font = `700 16px ${SANS}`;
  ctx.fillStyle = '#3FE7E3';
  ctx.fillText('إبداع   .   مبادرة   .   مجتمع', W / 2, 325);

  // Values EN: "Innovation . Initiative . Community"
  ctx.font = `600 12px ${SANS}`;
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('Innovation  .  Initiative  .  Community', W / 2, 348);

  // 6. Central Inspirational Quote Box
  const quoteBoxY = 430;
  ctx.textAlign = 'center';

  // Top Quote Mark
  ctx.font = `900 48px ${SANS}`;
  ctx.fillStyle = '#3FE7E3';
  ctx.fillText('“', W / 2 - 140, quoteBoxY);

  // Quote Arabic
  ctx.font = `900 25px ${SANS}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('طلاب اليوم', W / 2, quoteBoxY + 15);
  ctx.fillText('يصنعون حلول الغد', W / 2, quoteBoxY + 52);

  // Bottom Quote Mark
  ctx.fillText('”', W / 2 + 140, quoteBoxY + 68);

  // Quote English
  ctx.font = `italic 600 15px ${SANS}`;
  ctx.fillStyle = '#94A3B8';
  ctx.fillText('Students Today', W / 2, quoteBoxY + 105);
  ctx.fillText("Build Tomorrow's Solutions", W / 2, quoteBoxY + 128);

  // 7. Bottom Social & Official Presence Bar
  const bottomY = 875;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, bottomY - 30);
  ctx.lineTo(W - 60, bottomY - 30);
  ctx.stroke();

  // Social Brand Marks (Instagram, LinkedIn, Telegram) - Crisp Vector SVGs
  const iconY = bottomY - 14;
  drawSvgIcon(ctx, SOCIAL_META.instagram.path, 60, iconY, 18, '#3FE7E3');
  drawSvgIcon(ctx, SOCIAL_META.linkedin.path, 92, iconY, 18, '#3FE7E3');
  drawSvgIcon(ctx, SOCIAL_META.telegram.path, 124, iconY, 18, '#3FE7E3');

  // Official Handle
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = `800 15px ${SANS}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Engineering Club - UP', W - 60, bottomY - 5);

  ctx.restore();

  // Outer border
  roundRect(ctx, 0.5, 0.5, W - 1, H - 1, 32);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

/** Prepares a ready-to-print double-sided PDF layout and triggers the print dialog. */
export async function printDoubleSidedLanyard(data: LanyardBadgeData): Promise<void> {
  const [frontUrl, backUrl] = await Promise.all([
    renderLanyardFront(data, 3),
    renderLanyardBack(3),
  ]);

  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(`<!doctype html>
<html dir="rtl">
<head>
  <meta charset="utf-8">
  <title>باج التعليق الرسمي — ${data.name}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm;
    }
    html, body {
      margin: 0;
      padding: 0;
      font-family: sans-serif;
      background: #FFFFFF;
      color: #0F172A;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .print-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 20mm;
      padding: 5mm;
    }
    .cards-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12mm;
    }
    .card-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3mm;
    }
    .badge-card {
      width: 54mm;
      height: 86mm;
      object-fit: contain;
      border: 1px dashed #CBD5E1;
      border-radius: 4mm;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    }
    .card-label {
      font-size: 10px;
      font-weight: bold;
      color: #64748B;
    }
    .print-instructions {
      text-align: center;
      font-size: 11px;
      color: #64748B;
      border-top: 1px solid #E2E8F0;
      padding-top: 5mm;
      max-width: 140mm;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="print-container">
    <div style="text-align: center;">
      <h2 style="margin: 0 0 2mm 0; font-size: 16px;">النادي الهندسي — جامعة فلسطين</h2>
      <p style="margin: 0; font-size: 12px; color: #64748B;">باج الهوية القيادي للتعليق (Double-Sided Lanyard Badge CR80)</p>
    </div>

    <div class="cards-row">
      <div class="card-wrapper">
        <span class="card-label">الوجه الأمامي (Front)</span>
        <img src="${frontUrl}" class="badge-card" alt="الوجه الأمامي">
      </div>
      <div class="card-wrapper">
        <span class="card-label">الوجه الخلفي (Back)</span>
        <img src="${backUrl}" class="badge-card" alt="الوجه الخلفي">
      </div>
    </div>

    <div class="print-instructions">
      <strong>تعليمات الطباعة للمطبعة:</strong><br>
      مقاس البطاقة الفعلي هو مقاس بطاقة الهوية القياسية <strong>(54mm × 86mm)</strong> بدقة 300 DPI.<br>
      يُفضل الطباعة على كرت بلاستيك PVC أو ورق 350 جم مغلّف سيلوفان حراري مات، مع فتحة تعليق مستطيلة بالوسط.
    </div>
  </div>
</body>
</html>`);
  doc.close();

  const imgs = doc.querySelectorAll('img');
  await Promise.all(
    Array.from(imgs).map((img) => (img.complete ? Promise.resolve() : new Promise((r) => (img.onload = r))))
  );

  frame.contentWindow!.focus();
  frame.contentWindow!.print();
  setTimeout(() => frame.remove(), 2000);
}

/** Downloads Front face PNG image. */
export async function downloadLanyardFront(data: LanyardBadgeData, filename: string): Promise<void> {
  const dataUrl = await renderLanyardFront(data, 3);
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/** Downloads Back face PNG image. */
export async function downloadLanyardBack(filename: string): Promise<void> {
  const dataUrl = await renderLanyardBack(3);
  const link = document.createElement('a');
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
