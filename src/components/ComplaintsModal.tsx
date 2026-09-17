import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import type { ComplaintItem } from '../types';
import { X, MessageSquare, Send, Search, CheckCircle2, AlertCircle, Clock, ShieldCheck, Sparkles, Copy, Check, Camera, Upload, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { normalizeCode } from '../utils/validation';
import { checkRateLimit } from '../utils/security';

interface ComplaintsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComplaintsModal: React.FC<ComplaintsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit');

  // Submit Form State
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [college, setCollege] = useState('كلية هندسة برمجيات وذكاء اصطناعي');
  const [category, setCategory] = useState<ComplaintItem['category']>('suggestion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [attachmentImage, setAttachmentImage] = useState<string | null>(null);

  // Submission result state
  const [submittedTicket, setSubmittedTicket] = useState<ComplaintItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Track Ticket State
  const [trackQuery, setTrackQuery] = useState('');
  const [foundTicket, setFoundTicket] = useState<ComplaintItem | null>(null);
  const [trackSearched, setTrackSearched] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setSubmitError('الرجاء اختيار ملف صورة (JPG أو PNG أو WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const raw = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_DIM = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round(height * (MAX_DIM / width));
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round(width * (MAX_DIM / height));
              height = MAX_DIM;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            setAttachmentImage(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            setAttachmentImage(raw);
          }
        } catch {
          setAttachmentImage(raw);
        }
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!subject.trim()) {
      setSubmitError('اكتب عنوان الشكوى أو المقترح.');
      return;
    }
    if (!message.trim()) {
      setSubmitError('اكتب تفاصيل الشكوى أو المقترح.');
      return;
    }

    const rateCheck = checkRateLimit('complaint_submission', 4000);
    if (!rateCheck.allowed) {
      setSubmitError(`انتظر ${rateCheck.waitSeconds} ثوانٍ ثم حاول مرة أخرى.`);
      return;
    }

    if (isSending) return;
    setIsSending(true);
    let newComplaint: ComplaintItem;
    try {
      newComplaint = await dataService.submitComplaint({
      studentName: isAnonymous ? 'طالب مجهول (سري)' : (studentName.trim() || 'طالب من جامعة فلسطين'),
      studentId: studentId.trim() || 'N/A',
      email: email.trim() || 'N/A',
      phone: phone.trim() || undefined,
      college,
      category,
      subject: subject.trim(),
      message: message.trim(),
      isAnonymous,
      attachmentImage: attachmentImage || undefined,
      });
    } catch (err) {
      setSubmitError(`تعذر إرسال الشكوى: ${err instanceof Error ? (err.message.includes('Failed to fetch') ? 'تعذر الاتصال. تأكد من الإنترنت وحاول مرة أخرى.' : err.message) : 'خطأ غير معروف'}`);
      return;
    } finally {
      setIsSending(false);
    }

    setSubmittedTicket(newComplaint);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#00F0FF', '#10B981', '#3877FF'],
    });
  };

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = normalizeCode(trackQuery);
    setTrackError(null);
    if (!cleanQuery) return;

    // Strict Privacy: If student enters numeric student ID (any digits), guide them to use ticket number
    if (!cleanQuery.toUpperCase().includes('UP-CMP') && /^\d+$/.test(cleanQuery)) {
      setTrackError('للحفاظ على خصوصية الشكاوى، المتابعة تتم برقم التذكرة فقط (مثال: UP-CMP-2026-A1B2C3D4E5)، وليس بالرقم الجامعي.');
      return;
    }

    setIsTracking(true);
    try {
      setFoundTicket(await dataService.trackComplaint(cleanQuery));
      setTrackSearched(true);
    } catch (err) {
      setTrackError(`تعذر الاستعلام: ${err instanceof Error ? (err.message.includes('Failed to fetch') ? 'تعذر الاتصال. تأكد من الإنترنت وحاول مرة أخرى.' : err.message) : 'خطأ غير معروف'}`);
    } finally {
      setIsTracking(false);
    }
  };

  const copyTicketNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const resetForm = () => {
    setSubmittedTicket(null);
    setStudentName('');
    setStudentId('');
    setEmail('');
    setPhone('');
    setSubject('');
    setMessage('');
    setIsAnonymous(false);
    setAttachmentImage(null);
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg overflow-y-auto">
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl glass-panel border border-cyan-500/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(0,240,255,0.25)] relative text-right animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            onClose();
          }}
          className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs mb-2.5">
            <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span>STUDENT VOICE & FEEDBACK // صوت الطلبة ومقترحاتهم</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-white">صندوق الشكاوى والمقترحات والعرائض</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto leading-relaxed">
            صوتك واحتياجاتك محط اهتمام إدارة النادي وعمادة الكلية — نتعامل مع كافة الملاحظات بأمانة وسرية تامة.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-black/40 p-1.5 border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('submit');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'submit'
                ? 'bg-cyan-400 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>تقديم شكوى أو مقترح جديد</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('track');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'track'
                ? 'bg-cyan-400 text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>متابعة حالة شكوى سابقة</span>
          </button>
        </div>

        {/* TAB 1: SUBMIT NEW */}
        {activeTab === 'submit' && (
          <div>
            {submittedTicket ? (
              <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-4 animate-in fade-in">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mx-auto text-emerald-400">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div>
                  <h4 className="text-lg font-bold text-white">تم استلام طلبك بنجاح!</h4>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                    تم توثيق الشكوى/المقترح وإحالته إلى الهيئة الإدارية لمراجعته والعمل على معالجته فوراً.
                  </p>
                </div>

                {/* Ticket Number Display */}
                <div className="p-4 rounded-xl bg-black/60 border border-emerald-500/30 flex items-center justify-between font-mono">
                  <div className="text-right">
                    <div className="text-xs text-gray-400 font-sans">كود التتبع الخاص بالشكوى:</div>
                    <div className="text-base sm:text-lg font-extrabold text-cyan-400">{submittedTicket.ticketNumber}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyTicketNumber(submittedTicket.ticketNumber)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-sans text-gray-200 flex items-center gap-1 cursor-pointer transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'تم النسخ' : 'نسخ الكود'}</span>
                  </button>
                </div>

                <p className="text-xs text-gray-400 leading-relaxed">
                  احفظ هذا الرمز للاستعلام عن نتيجة المتابعة ورد الإدارة من خلال تبويب "متابعة حالة شكوى سابقة".
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all cursor-pointer"
                  >
                    تقديم طلب أو مقترح آخر
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Identity Toggle: Anonymous Option */}
                <div className="p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="font-bold text-white">التقديم بهوية سرية (Anonymous)</div>
                      <div className="text-xs text-gray-400">إخفاء اسمك وبياناتك الشخصية عن فريق المتابعة واللجان</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                  />
                </div>

                {/* Personal Information (only if not anonymous) */}
                {!isAnonymous && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 mb-1 font-mono">الاسم الكامل:</label>
                      <input
                        type="text"
                        placeholder="مثال: أحمد محمد"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-1 font-mono">الرقم الجامعي:</label>
                      <input
                        type="text"
                        placeholder="مثال: 120230XXX"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-1 font-mono">البريد الإلكتروني / الجامعي:</label>
                      <input
                        type="email"
                        placeholder="student@up.edu.ps"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-1 font-mono">رقم التواصل / واتساب (اختياري):</label>
                      <input
                        type="tel"
                        placeholder="059XXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white font-mono focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                )}

                {/* College & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">الكلية المعنية:</label>
                    <select
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="كلية هندسة برمجيات وذكاء اصطناعي">كلية هندسة برمجيات وذكاء اصطناعي</option>
                      <option value="كلية تكنولوجيا المعلومات IT">كلية تكنولوجيا المعلومات IT</option>
                      <option value="كلية الهندسة التطبيقية و التخطيط العمراني">كلية الهندسة التطبيقية والتخطيط العمراني</option>
                      <option value="عموم كليات الهندسة">عموم الكليات الهندسية / إدارة النادي العامة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-mono">تصنيف الطلب:</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="suggestion">💡 مقترح أو فكرة مبادرة جديدة</option>
                      <option value="club_activities">🎯 أنشطة وفعاليات وورش النادي</option>
                      <option value="academic">📚 معوقات أكاديمية أو دراسية</option>
                      <option value="facilities">🏢 مرافق، قاعات، أو معامل الكلية</option>
                      <option value="other">📝 شكوى أو ملاحظة عامة أخرى</option>
                    </select>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-gray-300 mb-1 font-mono">عنوان الشكوى أو المقترح:</label>
                  <input
                    type="text"
                    required
                    placeholder="اكتب عنواناً مختصراً وواضحاً..."
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-gray-300 mb-1 font-mono">تفاصيل الشكوى أو المقترح والحلول المقترحة:</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="اشرح المشكلة أو المقترح بالتفصيل موضحاً أي معوقات وأفكارك لتحسينها..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-cyan-400 leading-relaxed"
                  />
                </div>

                {/* Attachment Image Dropzone */}
                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-gray-300 font-mono text-xs flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-cyan-400" />
                      <span>إرفاق صورة أو لقطة شاشة تدعم الطلب (اختياري 📸):</span>
                    </label>
                    {attachmentImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setAttachmentImage(null);
                        }}
                        className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer font-sans"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>حذف الصورة</span>
                      </button>
                    )}
                  </div>

                  {attachmentImage ? (
                    <div className="relative rounded-xl overflow-hidden border border-cyan-500/40 bg-black/60 p-2.5 flex items-center gap-3.5">
                      <img
                        src={attachmentImage}
                        alt="Attached preview"
                        className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => window.open(attachmentImage, '_blank')}
                        title="انقر لمعاينة الصورة بالحجم الكامل"
                      />
                      <div className="flex-1 min-w-0 text-xs text-gray-300 font-sans">
                        <div className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>تم إرفاق الصورة وضغطها بنجاح</span>
                        </div>
                        <div className="text-gray-400 text-xs mt-0.5">ستُرسل كدليل مرفق مع التذكرة لمساعدة فريق المتابعة</div>
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all bg-white/[0.01] hover:bg-white/[0.03] group">
                      <Upload className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 mb-1.5 transition-colors" />
                      <span className="text-xs text-gray-300 font-sans font-medium">
                        اضغط لرفع لقطة شاشة أو صورة من جهازك
                      </span>
                      <span className="text-xs text-gray-500 font-mono mt-0.5">
                        PNG, JPG, WebP — يتم تحسين الحجم تلقائياً
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onClick={(e) => {
                          (e.target as HTMLInputElement).value = '';
                        }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageUpload(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-2 space-y-3">
                  {submitError && (
                    <div role="alert" className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm leading-relaxed">
                      {submitError}
                    </div>
                  )}
                  
                  <button
                    type="submit"
                    disabled={isSending}
                    className="disabled:opacity-60 disabled:cursor-wait w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-extrabold text-xs cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center justify-center gap-2 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSending ? 'جاري الإرسال...' : 'إرسال الشكوى / المقترح رسمياً'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 2: TRACK TICKET */}
        {activeTab === 'track' && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
                <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>الاستعلام برقم التذكرة فقط</span>
                </span>
                <span className="text-xs text-gray-500">🔒 خصوصية وسرية مطلقة</span>
              </div>
              <form onSubmit={handleTrack} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="أدخل الرمز السري الفريد للشكوى (مثال: UP-CMP-2026-A1B2C3D4E5)..."
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400 text-center tracking-wider"
                />
                <button
                  type="submit"
                  disabled={isTracking}
                  className="disabled:opacity-60 px-5 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-md"
                >
                  <Search className="w-4 h-4" />
                  <span>استعلام سري</span>
                </button>
              </form>
              {trackError && (
                <div role="alert" className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm leading-relaxed">
                  {trackError}
                </div>
              )}
            </div>

            {trackSearched && (
              <div>
                {foundTicket ? (
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-cyan-500/30 space-y-4">
                    {/* Status Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div>
                        <span className="text-xs font-mono text-gray-400">رقم الشكوى:</span>
                        <div className="font-mono text-sm font-bold text-cyan-400">{foundTicket.ticketNumber}</div>
                      </div>

                      <div>
                        {foundTicket.status === 'resolved' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>تم الحل والرد</span>
                          </span>
                        ) : foundTicket.status === 'in_progress' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-500/40 text-blue-300 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                            <span>قيد المعالجة والمتابعة</span>
                          </span>
                        ) : foundTicket.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-bold">
                            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                            <span>مرفوضة / مكررة</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>جديدة // قيد المراجعة</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ticket Content */}
                    <div>
                      <div className="text-xs font-bold text-white mb-1">{foundTicket.subject}</div>
                      <p className="text-xs text-gray-300 leading-relaxed bg-black/30 p-3 rounded-xl border border-white/5">
                        {foundTicket.message}
                      </p>
                    </div>

                    {/* Attached Image Display */}
                    {foundTicket.attachmentImage && (
                      <div className="p-3 rounded-xl bg-black/40 border border-white/10">
                        <div className="text-xs font-mono text-gray-400 mb-2 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-cyan-400" />
                          <span>الصورة المرفقة مع البلاغ:</span>
                        </div>
                        <img
                          src={foundTicket.attachmentImage}
                          alt="Attached evidence"
                          className="max-h-48 max-w-full rounded-lg object-contain border border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(foundTicket.attachmentImage, '_blank')}
                          title="انقر لفتح الصورة بالحجم الكامل"
                        />
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-gray-400 pt-1">
                      <span>الكلية: {foundTicket.college}</span>
                      <span>تاريخ التقديم: {new Date(foundTicket.createdAt).toLocaleDateString('ar-EG')}</span>
                    </div>

                    {/* Official Response Box */}
                    {foundTicket.adminNotes ? (
                      <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-right">
                        <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 mb-1.5">
                          <Sparkles className="w-4 h-4 text-cyan-400" />
                          <span>رد إدارة النادي / لجنة المتابعة:</span>
                        </div>
                        <p className="text-xs text-gray-200 leading-relaxed font-sans">
                          {foundTicket.adminNotes}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-gray-400">
                        الطلب قيد الدراسة من قبل ممثلي الكلية وإدارة النادي، وسيتم تحديث الرد هنا فور الانتهاء.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 text-center text-gray-400 text-xs space-y-2">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2 opacity-75" />
                    <div className="text-white font-bold">لم يتم العثور على أي شكوى مسجلة بهذا الرمز الفريد.</div>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">
                      تنبيه أمني: الاستعلام متاح حصرياً بواسطة <span className="text-cyan-300 font-mono font-bold">الرمز الفريد للتذكرة</span> الصادر عند التقديم لضمان أقصى درجات الخصوصية وحجب الشكاوى عن أي استعلام خارجي بالرقم الجامعي.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
