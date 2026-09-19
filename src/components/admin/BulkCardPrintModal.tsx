import React, { useState, useEffect, useMemo } from 'react';
import { Printer, X, CheckSquare, Square, RefreshCw, Layers, AlertCircle } from 'lucide-react';
import { memberCardFor, type CardData } from '../../utils/memberCard';
import { renderCardPng } from '../../utils/cardRenderer';
import type { MemberRow } from './adminApi';
import { Button } from './ui';

export interface BulkCardPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberRow[];
}

export const BulkCardPrintModal: React.FC<BulkCardPrintModalProps> = ({
  isOpen,
  onClose,
  members,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() => members.map((m) => m.id));
  const [renderedCards, setRenderedCards] = useState<Record<string, string>>({});
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [layoutMode, setLayoutMode] = useState<'9-per-page' | '8-per-page'>('9-per-page');

  const cardsPerPage = layoutMode === '9-per-page' ? 9 : 8;

  // Sync selected IDs when members prop changes
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(members.map((m) => m.id));
    }
  }, [isOpen, members]);

  // Filter selected member objects
  const selectedMembers = useMemo(() => {
    const set = new Set(selectedIds);
    return members.filter((m) => set.has(m.id));
  }, [members, selectedIds]);

  // Split selected members into pages
  const pages = useMemo(() => {
    const res: MemberRow[][] = [];
    for (let i = 0; i < selectedMembers.length; i += cardsPerPage) {
      res.push(selectedMembers.slice(i, i + cardsPerPage));
    }
    return res;
  }, [selectedMembers, cardsPerPage]);

  // Render cards to high-res PNG data URLs
  useEffect(() => {
    if (!isOpen || selectedMembers.length === 0) return;

    let isMounted = true;
    const renderNeeded = async () => {
      setIsRendering(true);
      setRenderProgress(0);

      const needed = selectedMembers.filter((m) => !renderedCards[m.id]);
      let done = 0;

      for (const m of needed) {
        if (!isMounted) break;
        try {
          const cardData: CardData = memberCardFor(
            {
              id: m.id,
              fullName: m.full_name,
              studentId: m.student_id,
              major: m.data?.major || '',
              targetCommittee: m.data?.targetCommittee || '',
              assignedCommittee: m.data?.assignedCommittee,
              organizationalRole: m.data?.organizationalRole,
              memberCode: m.member_code || undefined,
              validUntil: m.valid_until || undefined,
              membershipType: m.membership_type || undefined,
              suspendedAt: m.suspended_at || undefined,
              suspendReason: m.suspend_reason || undefined,
            },
            { revealCode: true }
          );

          const url = await renderCardPng(cardData, 2);
          if (isMounted) {
            setRenderedCards((prev) => ({ ...prev, [m.id]: url }));
          }
        } catch (err) {
          console.error(`Failed to render card for ${m.full_name}:`, err);
        }
        done++;
        if (isMounted) {
          setRenderProgress(Math.round((done / needed.length) * 100));
        }
      }

      if (isMounted) {
        setIsRendering(false);
      }
    };

    void renderNeeded();

    return () => {
      isMounted = false;
    };
  }, [isOpen, selectedMembers, renderedCards]);

  const toggleSelectAll = () => {
    if (selectedIds.length === members.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(members.map((m) => m.id));
    }
  };

  const toggleSelectMember = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Launch browser printing through clean, styled iframe with crop marks
  const handlePrint = () => {
    if (selectedMembers.length === 0) return;

    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(frame);

    const doc = frame.contentDocument!;
    doc.open();

    const is9 = layoutMode === '9-per-page';
    const gridCols = is9 ? '3' : '2';
    const cardWidthMm = is9 ? '58mm' : '72mm';
    const cardHeightMm = is9 ? '75.4mm' : '93.6mm';

    let pagesHtml = '';

    pages.forEach((pageMembers, pageIdx) => {
      let cardsHtml = '';
      pageMembers.forEach((m) => {
        const imgUrl = renderedCards[m.id] || '';
        cardsHtml += `
          <div class="card-cell">
            <div class="crop-mark crop-tl"></div>
            <div class="crop-mark crop-tr"></div>
            <div class="crop-mark crop-bl"></div>
            <div class="crop-mark crop-br"></div>
            <div class="card-inner">
              ${imgUrl ? `<img src="${imgUrl}" alt="${m.full_name}" />` : `<div class="placeholder">${m.full_name}</div>`}
            </div>
            <div class="card-cut-line"></div>
          </div>
        `;
      });

      pagesHtml += `
        <div class="a4-sheet">
          <div class="sheet-header">
            <span>جامعة فلسطين — النادي الهندسي (Engineering Club) | ورقة طباعة بطاقات الأعضاء المعتمدة</span>
            <span class="sheet-page-num">صفحة ${pageIdx + 1} من ${pages.length}</span>
          </div>
          <div class="sheet-grid cols-${gridCols}">
            ${cardsHtml}
          </div>
          <div class="sheet-footer">
            <span>تنبيه للمطبعة: يُرجى القص على علامات الزوايا (Crop Marks). مقاس البطاقة المعياري جاهز للتغليف الحراري والتسليم.</span>
            <span>طُبعت بتاريخ: ${new Date().toLocaleDateString('ar')}</span>
          </div>
        </div>
      `;
    });

    doc.write(`
      <!doctype html>
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>طباعة بطاقات الأعضاء A4 - النادي الهندسي</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            html, body {
              background: #ffffff;
              color: #111827;
              font-family: 'Alexandria', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .a4-sheet {
              width: 194mm;
              min-height: 275mm;
              height: 275mm;
              page-break-after: always;
              break-after: page;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              padding: 2mm 0;
              position: relative;
            }
            .a4-sheet:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            .sheet-header, .sheet-footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 8pt;
              color: #6b7280;
              border-bottom: 0.5pt solid #e5e7eb;
              padding-bottom: 1.5mm;
              margin-bottom: 2mm;
            }
            .sheet-footer {
              border-bottom: none;
              border-top: 0.5pt solid #e5e7eb;
              padding-top: 1.5mm;
              margin-top: 2mm;
              margin-bottom: 0;
            }
            .sheet-page-num {
              font-weight: bold;
              color: #374151;
            }
            .sheet-grid {
              display: grid;
              gap: 3.5mm;
              justify-content: center;
              align-content: center;
              flex: 1;
            }
            .cols-3 {
              grid-template-columns: repeat(3, ${cardWidthMm});
              grid-template-rows: repeat(3, ${cardHeightMm});
            }
            .cols-2 {
              grid-template-columns: repeat(2, ${cardWidthMm});
              grid-template-rows: repeat(4, ${cardHeightMm});
            }
            .card-cell {
              position: relative;
              width: ${cardWidthMm};
              height: ${cardHeightMm};
              display: flex;
              align-items: center;
              justify-content: center;
              background: transparent;
            }
            .card-inner {
              width: 100%;
              height: 100%;
              border-radius: 4.5mm;
              overflow: hidden;
              box-shadow: 0 0 0 0.4pt #9ca3af;
            }
            .card-inner img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
            }
            .placeholder {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 9pt;
              color: #6b7280;
              background: #f3f4f6;
            }
            /* Corner Crop marks for print trimming */
            .crop-mark {
              position: absolute;
              width: 3.5mm;
              height: 3.5mm;
              pointer-events: none;
            }
            .crop-tl {
              top: -1.5mm;
              right: -1.5mm;
              border-top: 0.75pt solid #000;
              border-right: 0.75pt solid #000;
            }
            .crop-tr {
              top: -1.5mm;
              left: -1.5mm;
              border-top: 0.75pt solid #000;
              border-left: 0.75pt solid #000;
            }
            .crop-bl {
              bottom: -1.5mm;
              right: -1.5mm;
              border-bottom: 0.75pt solid #000;
              border-right: 0.75pt solid #000;
            }
            .crop-br {
              bottom: -1.5mm;
              left: -1.5mm;
              border-bottom: 0.75pt solid #000;
              border-left: 0.75pt solid #000;
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
        </body>
      </html>
    `);

    doc.close();

    // Give browser time to load inline images then trigger print dialog
    setTimeout(() => {
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
      } catch (err) {
        console.error('Print trigger error:', err);
      } finally {
        setTimeout(() => frame.remove(), 2000);
      }
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0d0728] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                تصدير ورقة طباعة البطاقات (A4 Sheet)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/30 font-mono">
                  {selectedMembers.length} بطاقة
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                تجهيز ورقة A4 جاهزة للتسليم للمطبعة مع علامات قص (Crop marks) دقيقة وترتيب معياري للبطاقات
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="p-4 border-b border-white/10 bg-black/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 flex items-center gap-1.5 cursor-pointer font-medium transition-colors"
            >
              {selectedIds.length === members.length ? (
                <>
                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                  <span>إلغاء تحديد الكل</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-gray-400" />
                  <span>تحديد كافة الأعضاء ({members.length})</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
              <span className="text-gray-400 px-2">النمط:</span>
              <button
                type="button"
                onClick={() => setLayoutMode('9-per-page')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  layoutMode === '9-per-page'
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                9 بطاقات (3 × 3)
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('8-per-page')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  layoutMode === '8-per-page'
                    ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                8 بطاقات (2 × 4)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-300 font-medium">
              إجمالي الصفحات: <strong className="text-cyan-300 font-mono">{pages.length}</strong> صفحة A4
            </span>
            <Button
              variant="primary"
              icon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
              disabled={selectedMembers.length === 0 || isRendering}
            >
              {isRendering ? `جاري التجهيز (${renderProgress}%)` : 'طباعة ورقة A4 الآن'}
            </Button>
          </div>
        </div>

        {/* Rendering Progress Bar if active */}
        {isRendering && (
          <div className="px-4 py-2 bg-cyan-950/40 border-b border-cyan-500/20 flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between text-[11px] text-cyan-300 mb-1">
                <span>جاري معالجة ورسم بطاقات الأعضاء بدقة فائقة...</span>
                <span>{renderProgress}%</span>
              </div>
              <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Content Body: Member selection checklist + A4 Page preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Member Selection List (Left Column) */}
          <div className="lg:col-span-4 bg-black/30 border border-white/10 rounded-2xl p-3 flex flex-col max-h-[58vh]">
            <div className="pb-2 mb-2 border-b border-white/10 flex items-center justify-between text-xs font-bold text-gray-300">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                قائمة الأعضاء ({selectedMembers.length})
              </span>
              <span className="text-[11px] text-gray-400">انقر للتبديل</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {members.map((m) => {
                const isSelected = selectedIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleSelectMember(m.id)}
                    className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/30 border-cyan-500/40 text-white'
                        : 'bg-black/20 border-white/5 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs truncate">{m.full_name}</div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex gap-2">
                        <span>{m.student_id}</span>
                        {m.member_code && <span className="text-cyan-300">{m.member_code}</span>}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <Square className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual A4 Sheet Preview (Right Column) */}
          <div className="lg:col-span-8 bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-3 text-xs text-gray-400 pb-2 border-b border-white/10">
              <span>معاينة ورقة A4 الأولى للمطبعة (تحتوي على علامات القص)</span>
              <span className="text-cyan-300 font-mono">
                {pages[0]?.length || 0} من {cardsPerPage} بطاقات في الصفحة الأولى
              </span>
            </div>

            {selectedMembers.length === 0 ? (
              <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center text-gray-400 text-xs">
                <AlertCircle className="w-8 h-8 text-amber-400 mb-2 opacity-80" />
                <p>يرجى تحديد عضو واحد على الأقل للمعاينة والطباعة.</p>
              </div>
            ) : (
              <div className="w-full flex justify-center overflow-x-auto py-2">
                {/* Scaled-down visual sheet preview */}
                <div className="bg-white text-black p-3 sm:p-4 rounded-lg shadow-xl max-w-[420px] w-full border border-gray-300 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-[9px] text-gray-500 border-b border-gray-200 pb-1">
                    <span>جامعة فلسطين — النادي الهندسي (ورقة A4)</span>
                    <span className="font-bold text-gray-700">الصفحة 1</span>
                  </div>

                  <div
                    className={`grid gap-2 ${
                      layoutMode === '9-per-page'
                        ? 'grid-cols-3'
                        : 'grid-cols-2'
                    }`}
                  >
                    {(pages[0] || []).map((m) => {
                      const imgUrl = renderedCards[m.id];
                      return (
                        <div
                          key={m.id}
                          className="relative aspect-[360/468] rounded-md overflow-hidden bg-gray-900 border border-gray-400/80 shadow-sm flex items-center justify-center"
                        >
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={m.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="p-1 text-center text-[8px] text-white">
                              {m.full_name}
                            </div>
                          )}
                          {/* Visual crop lines on preview */}
                          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400" />
                          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400" />
                          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400" />
                          <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400" />
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center text-[8px] text-gray-400 border-t border-gray-200 pt-1">
                    <span>قص على علامات الزوايا (Crop Marks)</span>
                    <span>النادي الهندسي</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onClose}>
            إغلاق
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              icon={<Printer className="w-4 h-4" />}
              onClick={handlePrint}
              disabled={selectedMembers.length === 0 || isRendering}
            >
              {isRendering ? 'جاري المعالجة...' : `طباعة ${selectedMembers.length} بطاقة (A4)`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
