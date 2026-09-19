import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  HelpCircle,
  Eye,
  EyeOff,
  Edit3,
  Trash2,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Power,
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import { FAQ_CATEGORIES } from '../../data/faqData';
import type { FaqItem, SiteSettings } from '../../types';
import { trashContentItem } from './adminApi';
import { Badge, Button, EmptyState, ErrorNote, Field, PageHeader, Panel, inputClass } from './ui';
import { useConfirm } from './controls';

interface FaqPanelProps {
  showToast: (message: string) => void;
}

export const FaqPanel: React.FC<FaqPanelProps> = ({ showToast }) => {
  const { confirm, confirmDialog } = useConfirm();

  const [faqs, setFaqs] = useState<FaqItem[]>(() => dataService.getFaqs());
  const [settings, setSettings] = useState<SiteSettings>(() => dataService.getSettings());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FaqItem | null>(null);
  const [formQuestion, setFormQuestion] = useState('');
  const [formAnswer, setFormAnswer] = useState('');
  const [formCategory, setFormCategory] = useState(FAQ_CATEGORIES[0] || 'عام');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [formHidden, setFormHidden] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Refresh helper
  const reloadFaqs = () => {
    setFaqs(dataService.getFaqs());
    setSettings(dataService.getSettings());
  };

  // Distinct categories available in current items + presets
  const availableCategories = useMemo(() => {
    const set = new Set<string>(FAQ_CATEGORIES);
    for (const f of faqs) {
      if (f.category?.trim()) set.add(f.category.trim());
    }
    return Array.from(set);
  }, [faqs]);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return faqs.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;
      return (
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [faqs, searchQuery, selectedCategory]);

  const visibleCount = faqs.filter((f) => !f.hidden).length;
  const hiddenCount = faqs.filter((f) => f.hidden).length;

  // Toggle Global FAQ Section Visibility
  const toggleSectionVisibility = () => {
    const current = settings.showFaqSection !== false;
    const next = !current;
    const updated: SiteSettings = { ...settings, showFaqSection: next };
    setSettings(updated);
    dataService.saveSettings(updated);
    showToast(next ? 'تم تفعيل ظهور قسم الأسئلة الشائعة في الموقع' : 'تم إخفاء قسم الأسئلة الشائعة عن الموقع العام');
  };

  // Open Modal for Create
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormQuestion('');
    setFormAnswer('');
    setFormCategory(FAQ_CATEGORIES[0] || 'عام');
    setIsCustomCategory(false);
    setCustomCategory('');
    setFormHidden(false);
    setFormError(null);
    setModalOpen(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (item: FaqItem) => {
    setEditingItem(item);
    setFormQuestion(item.question);
    setFormAnswer(item.answer);
    if (availableCategories.includes(item.category)) {
      setFormCategory(item.category);
      setIsCustomCategory(false);
      setCustomCategory('');
    } else {
      setIsCustomCategory(true);
      setCustomCategory(item.category);
    }
    setFormHidden(Boolean(item.hidden));
    setFormError(null);
    setModalOpen(true);
  };

  // Save Modal Form
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const q = formQuestion.trim();
    const a = formAnswer.trim();
    const cat = (isCustomCategory ? customCategory.trim() : formCategory).trim();

    if (!q) {
      setFormError('الرجاء كتابة نص السؤال');
      return;
    }
    if (!a) {
      setFormError('الرجاء كتابة نص الإجابة');
      return;
    }
    if (!cat) {
      setFormError('الرجاء اختيار أو كتابة تصنيف السؤال');
      return;
    }

    if (editingItem) {
      const updated: FaqItem = {
        ...editingItem,
        question: q,
        answer: a,
        category: cat,
        hidden: formHidden,
      };
      dataService.saveFaq(updated);
      showToast('تم تحديث السؤال بنجاح');
    } else {
      const newItem: FaqItem = {
        id: `faq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        question: q,
        answer: a,
        category: cat,
        order: faqs.length + 1,
        hidden: formHidden,
      };
      dataService.saveFaq(newItem);
      showToast('تمت إضافة السؤال الجديد');
    }

    setModalOpen(false);
    reloadFaqs();
  };

  // Quick Toggle Item Visibility
  const handleToggleItemVisibility = (item: FaqItem) => {
    const updated: FaqItem = { ...item, hidden: !item.hidden };
    dataService.saveFaq(updated);
    reloadFaqs();
    showToast(updated.hidden ? 'تم إخفاء السؤال عن الموقع (مسودة)' : 'السؤال ظاهر الآن في الموقع للطلبة');
  };

  // Reorder Item: Move Up or Down
  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const nextList = [...faqs];
    const temp = nextList[index];
    nextList[index] = nextList[targetIndex];
    nextList[targetIndex] = temp;

    // Re-assign normalized orders
    const normalized = nextList.map((item, idx) => ({ ...item, order: idx + 1 }));
    dataService.saveFaqs(normalized);
    setFaqs(normalized);
    showToast('تم تحديث ترتيب الأسئلة');
  };

  // Delete Item with confirmation & Trash archive
  const handleDeleteItem = async (item: FaqItem) => {
    const ok = await confirm({
      title: 'حذف السؤال من القائمة؟',
      message: `هل أنت متأكد من حذف «${item.question}»؟ سيتم نقله إلى سلة المحذوفات لمدة 30 يوماً ويمكنك استعادته منها في أي وقت.`,
      confirmLabel: 'نعم، احذف',
      cancelLabel: 'تراجع',
      danger: true,
    });
    if (!ok) return;

    // Trash safety net
    await trashContentItem('faq', item.id, item.question, item);
    dataService.deleteFaq(item.id);
    reloadFaqs();
    showToast('تم نقل السؤال إلى سلة المحذوفات');
  };

  // Reset to Defaults
  const handleResetDefaults = async () => {
    const ok = await confirm({
      title: 'استعادة الأسئلة الافتراضية؟',
      message:
        'سيتم استرجاع حزمة الأسئلة الأساسية الستة المعتمدة للنادي وإعادة ترتيبها تلقائياً. هل تود المتابعة؟',
      confirmLabel: 'استعادة الافتراضي',
      cancelLabel: 'إلغاء',
      danger: false,
    });
    if (!ok) return;

    const { DEFAULT_FAQS } = await import('../../data/faqData');
    dataService.saveFaqs(DEFAULT_FAQS);
    reloadFaqs();
    showToast('تمت استعادة الأسئلة الافتراضية بنجاح');
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-6xl mx-auto">
      {confirmDialog}

      {/* Page Header */}
      <PageHeader
        title="الأسئلة الشائعة والإرشاد الطلابي"
        description="إدارة الأسئلة والإجابات المعتمدة في الموقع العام، ترتيبها، وتصنيفها للإجابة على استفسارات الطلبة والمنتسبين."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={() => void handleResetDefaults()}
            >
              استعادة الافتراضي
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenCreate}
            >
              إضافة سؤال جديد
            </Button>
          </div>
        }
      />

      {/* Top Banner: Global Section Visibility Control */}
      <Panel className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-950/20 via-black/40 to-black/40 border-purple-500/20">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>ظهور قسم الأسئلة في الصفحة الرئيسية</span>
              {settings.showFaqSection !== false ? (
                <Badge tone="green">مُفعّل وظاهر</Badge>
              ) : (
                <Badge tone="red">مُعطّل ومخفي</Badge>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              {settings.showFaqSection !== false
                ? 'يظهر القسم حالياً في الموقع الرئيسي ورابطه متاح في القائمة العلوية.'
                : 'القسم مخفي تماماً عن الزوار والطلبة في الموقع العام والشريط العلوي.'}
            </p>
          </div>
        </div>

        <Button
          variant={settings.showFaqSection !== false ? 'danger' : 'success'}
          size="sm"
          icon={<Power className="w-3.5 h-3.5" />}
          onClick={toggleSectionVisibility}
        >
          {settings.showFaqSection !== false ? 'إخفاء القسم من الموقع' : 'تفعيل ظهور القسم'}
        </Button>
      </Panel>

      {/* Quick Stats & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Panel className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400">إجمالي الأسئلة</span>
            <div className="text-2xl font-black text-white mt-1">{faqs.length}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            <HelpCircle className="w-5 h-5" />
          </div>
        </Panel>

        <Panel className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400">ظاهرة للطلبة بالموقع</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{visibleCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            <Eye className="w-5 h-5" />
          </div>
        </Panel>

        <Panel className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400">مخفية (مسودات)</span>
            <div className="text-2xl font-black text-amber-400 mt-1">{hiddenCount}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <EyeOff className="w-5 h-5" />
          </div>
        </Panel>
      </div>

      {/* Search & Category Filter */}
      <Panel className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في نص السؤال، الإجابة، أو التصنيف..."
              className={`${inputClass} pr-10`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white cursor-pointer px-1 py-0.5 rounded bg-white/5"
              >
                مسح
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              الكل ({faqs.length})
            </button>
            {availableCategories.map((cat) => {
              const count = faqs.filter((f) => f.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/5'
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </Panel>

      {/* FAQ Items List */}
      {filteredFaqs.length === 0 ? (
        <Panel className="p-8 text-center">
          <EmptyState
            title={searchQuery || selectedCategory !== 'all' ? 'لا توجد نتائج مطابقة لبحثك' : 'لا توجد أسئلة مضافة حتى الآن'}
            description="يمكنك إضافة سؤال جديد أو تعديل معايير البحث والفلترة أعلاه."
          />
          <div className="mt-4 flex justify-center">
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenCreate}>
              إضافة أول سؤال
            </Button>
          </div>
        </Panel>
      ) : (
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            const fullIndex = faqs.findIndex((f) => f.id === faq.id);
            const canMoveUp = fullIndex > 0;
            const canMoveDown = fullIndex < faqs.length - 1;

            return (
              <Panel
                key={faq.id}
                className={`transition-all duration-200 overflow-hidden ${
                  faq.hidden
                    ? 'opacity-70 bg-black/30 border-dashed border-white/10'
                    : 'hover:border-white/20'
                }`}
              >
                {/* Header Row */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left (RTL Start): Order controls + Badges + Question */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Reorder Buttons (Visible when viewing all categories) */}
                    {selectedCategory === 'all' && !searchQuery && (
                      <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                        <button
                          type="button"
                          disabled={!canMoveUp}
                          onClick={() => handleMoveItem(fullIndex, 'up')}
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-white/5 text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
                          title="تحريك لأعلى"
                          aria-label="تحريك لأعلى"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={!canMoveDown}
                          onClick={() => handleMoveItem(fullIndex, 'down')}
                          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-25 disabled:hover:bg-white/5 text-gray-300 flex items-center justify-center transition-colors cursor-pointer"
                          title="تحريك لأسفل"
                          aria-label="تحريك لأسفل"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      {/* Meta Tags */}
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 text-gray-400 font-mono text-[11px]">
                          #{fullIndex + 1}
                        </span>
                        <Badge tone="purple">{faq.category}</Badge>
                        {faq.hidden ? (
                          <Badge tone="amber">مخفي (مسودة)</Badge>
                        ) : (
                          <Badge tone="green">ظاهر بالموقع</Badge>
                        )}
                      </div>

                      {/* Question Text Clickable to toggle preview */}
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : faq.id)}
                        className="text-right font-bold text-white text-base hover:text-cyan-300 transition-colors flex items-center gap-2 cursor-pointer w-full"
                      >
                        <span className="flex-1 text-right">{faq.question}</span>
                        <span className="text-xs font-mono text-gray-500 shrink-0">
                          {isExpanded ? 'إخفاء الإجابة' : 'عرض الإجابة'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-1.5 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/5 w-full md:w-auto justify-end">
                    {/* Toggle Visibility Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleItemVisibility(faq)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px] ${
                        faq.hidden
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                      }`}
                      title={faq.hidden ? 'إظهار السؤال بالموقع' : 'إخفاء السؤال مؤقتاً'}
                    >
                      {faq.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{faq.hidden ? 'إظهار' : 'إخفاء'}</span>
                    </button>

                    {/* Edit Button */}
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<Edit3 className="w-3.5 h-3.5" />}
                      onClick={() => handleOpenEdit(faq)}
                    >
                      تعديل
                    </Button>

                    {/* Delete Button */}
                    <Button
                      size="sm"
                      variant="danger"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => void handleDeleteItem(faq)}
                    >
                      حذف
                    </Button>
                  </div>
                </div>

                {/* Expanded Answer Preview */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-white/5 bg-black/20 animate-in fade-in duration-150">
                    <div className="text-xs font-mono text-gray-400 mb-1.5">نص الإجابة المعتمد:</div>
                    <p className="text-sm text-gray-300 leading-relaxed font-light whitespace-pre-line bg-white/[0.02] p-4 rounded-xl border border-white/5">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[75] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl bg-[#0D0727] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-right relative my-8"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingItem ? 'تعديل السؤال الشائع' : 'إضافة سؤال شائع جديد'}
                  </h3>
                  <p className="text-xs text-gray-400">
                    اكتب صياغة دقيقة ومفيدة للطلبة تظهر ضمن قسم الأسئلة الشائعة.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="إغلاق"
              >
                ✕
              </button>
            </div>

            <ErrorNote message={formError} />

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="space-y-4">
              {/* Question Text */}
              <Field label="نص السؤال" hint="مثال: كيف تتم العضوية وتفعيلها في النادي؟">
                <input
                  type="text"
                  value={formQuestion}
                  onChange={(e) => setFormQuestion(e.target.value)}
                  placeholder="اكتب السؤال باللغة العربية..."
                  className={inputClass}
                  required
                />
              </Field>

              {/* Category */}
              <div className="space-y-2">
                <Field label="تصنيف السؤال" hint="يساعد الطلبة على تصنيف وفلترة الأسئلة بحسب اهتمامهم">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={isCustomCategory ? '__custom__' : formCategory}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomCategory(true);
                        } else {
                          setIsCustomCategory(false);
                          setFormCategory(e.target.value);
                        }
                      }}
                      className={inputClass}
                    >
                      {availableCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__custom__">+ كتابة تصنيف جديد...</option>
                    </select>

                    {isCustomCategory && (
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="اكتب اسم التصنيف الجديد..."
                        className={inputClass}
                        required
                        autoFocus
                      />
                    )}
                  </div>
                </Field>
              </div>

              {/* Answer Text */}
              <Field
                label="نص الإجابة والتوضيح"
                hint="اكتب الإجابة بأسلوب واضح وداعم للطلبة بدون اختصارات مبهمة"
              >
                <textarea
                  rows={6}
                  value={formAnswer}
                  onChange={(e) => setFormAnswer(e.target.value)}
                  placeholder="اكتب الإجابة المفصلة هنا..."
                  className={`${inputClass} resize-y leading-relaxed font-light`}
                  required
                />
              </Field>

              {/* Visibility Status */}
              <div className="p-4 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-bold text-white">حالة النشر</div>
                  <div className="text-xs text-gray-400">
                    {formHidden ? 'السؤال سيكون مسودة مخفية عن الموقع العام' : 'السؤال سيظهر فوراً للطلبة والزوار'}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!formHidden}
                    onChange={(e) => setFormHidden(!e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-black/40 border-white/20"
                  />
                  <span className="text-xs font-bold text-gray-200">ظاهر بالموقع</span>
                </label>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <Button variant="secondary" onClick={() => setModalOpen(false)}>
                  إلغاء
                </Button>
                <Button variant="primary" type="submit">
                  {editingItem ? 'حفظ التعديلات' : 'إضافة السؤال الآن'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
