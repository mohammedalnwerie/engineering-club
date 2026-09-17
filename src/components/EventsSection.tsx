import React, { useState, useEffect } from 'react';
import { Sparkles, Lightbulb, Send, Check, X, Laptop, BookOpen, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { dataService } from '../services/dataService';

export const EventsSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    return dataService.getSettings().showEventsSection !== false;
  });

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setIsVisible(dataService.getSettings().showEventsSection !== false);
    });
    return unsub;
  }, []);

  // Suggest Event Modal
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestName, setSuggestName] = useState('');
  const [suggestMajor, setSuggestMajor] = useState('');
  const [suggestTopic, setSuggestTopic] = useState('');
  const [suggestDetails, setSuggestDetails] = useState('');
  const [suggestContact, setSuggestContact] = useState('');
  const [suggestSubmitted, setSuggestSubmitted] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  const handleSuggestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuggestError(null);
    if (!suggestTopic.trim()) return;

    try {
      await dataService.submitComplaint({
        studentName: suggestName.trim() || 'طالب مقترح',
        studentId: 'EVENT_PROPOSAL',
        email: suggestContact.trim() || 'proposal@engclub.up',
        phone: suggestContact.trim() || undefined,
        college: suggestMajor || 'كلية الهندسة وتكنولوجيا المعلومات',
        category: 'suggestion',
        subject: '[اقتراح ورشة / فعالية] ' + suggestTopic.trim(),
        message: 'التخصص: ' + suggestMajor + ' | تفاصيل المقترح: ' + suggestDetails.trim(),
        isAnonymous: false,
      });
    } catch (err) {
      setSuggestError(`تعذر إرسال المقترح: ${err instanceof Error ? (err.message.includes('Failed to fetch') ? 'تعذر الاتصال. تأكد من الإنترنت وحاول مرة أخرى.' : err.message) : 'خطأ غير معروف'}`);
      return;
    }

    setSuggestSubmitted(true);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#10B981', '#06B6D4', '#F59E0B'],
    });

    setTimeout(() => {
      setShowSuggestModal(false);
      setSuggestSubmitted(false);
      setSuggestName('');
      setSuggestMajor('');
      setSuggestTopic('');
      setSuggestDetails('');
      setSuggestContact('');
    }, 2800);
  };

  const upcomingTracks = [
    {
      title: 'مسار الورش والمهارات الهندسية التطبيقية',
      icon: Laptop,
      desc: 'دورات وورش مكثفة في نمذجة المباني (BIM / Revit)، وهندسة البرمجيات والذكاء الاصطناعي، والأمن الرقمي، وإدارة المشاريع.',
      badge: 'قيد التنسيق',
      color: 'from-emerald-500/10 to-teal-500/5',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'مسار اللقاءات الحوارية والربط بسوق العمل',
      icon: BookOpen,
      desc: 'جلسات إرشاد مهني واستشارات تفاعلية مع نخبة من المهندسين الخبراء والخريجين للتعرف على متطلبات وفرص العمل الحقيقية.',
      badge: 'قيد التحضير',
      color: 'from-blue-500/10 to-indigo-500/5',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'مسار الهاكاثونات وحلول الإعمار والتطوير',
      icon: Trophy,
      desc: 'تحديات ومسابقات فرق عمل متكاملة تجمع مهندسي العمارة والمدني والبرمجيات لابتكار حلول عملية تدعم مجتمعنا في فلسطين.',
      badge: 'قيد الإعداد',
      color: 'from-amber-500/10 to-orange-500/5',
      borderColor: 'border-amber-500/20'
    }
  ];

  // If hidden via Admin Dashboard settings, do not render on public site
  if (!isVisible) {
    return null;
  }

  return (
    <section id="events" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#08041D]/80 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#381C4A]/60 border border-[#3FE7E3]/30 text-[#3FE7E3] text-xs font-mono mb-3 shadow-[0_0_20px_rgba(63,231,227,0.12)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>البرامج والأنشطة القادمة</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              أجندة الفعاليات والورش الهندسية
            </h2>
          </div>

          {/* Action: Suggest workshop button only */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowSuggestModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              <span>اقترح ورشة عمل</span>
            </button>
          </div>
        </div>

        {/* Informative Preparation Card */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-emerald-500/20 mb-10 text-right">
          <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light">
            تعمل لجان النادي الهندسي حالياً على إعداد وتنسيق حزمة نوعية من الورش التدريبية التخصصية، والمحاضرات الهندسية، والهاكاثونات بالشراكة مع الكليات الهندسية ونخبة من الخبراء والمؤسسات الشريكة. نرحب بمقترحاتكم لتضمينها في الخطة الأولى.
          </p>
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upcomingTracks.map((track, idx) => {
            const Icon = track.icon;
            return (
              <div
                key={idx}
                className={`rounded-3xl p-6 sm:p-8 bg-gradient-to-b ${track.color} border ${track.borderColor} flex flex-col justify-between text-right relative overflow-hidden transition-all duration-300 hover:translate-y-[-2px]`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono px-3 py-1 rounded-full bg-black/40 text-gray-300 border border-white/10">
                      {track.badge}
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">
                    {track.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-gray-400 font-light leading-relaxed">
                    {track.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-gray-400 text-xs font-mono">
                  <span>المسار {idx + 1}</span>
                  <span className="text-emerald-400">قريباً</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Suggest Event Modal */}
      {showSuggestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0B1B33] border border-emerald-500/40 p-6 sm:p-8 shadow-2xl text-right">
            
            <button
              onClick={() => setShowSuggestModal(false)}
              className="absolute top-5 left-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!suggestSubmitted ? (
              <form onSubmit={handleSuggestSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                  <Lightbulb className="w-6 h-6" />
                  <h3 className="text-xl font-bold text-white">اقترح ورشة عمل أو فعالية</h3>
                </div>
                <p className="text-xs text-gray-300 font-light mb-4">
                  شاركنا موضوع الورشة أو الفعالية التي ترغب بتنظيمها، وسيعمل فريق النادي على دراسة وتنسيق المقترح بأقرب وقت.
                </p>

                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1">موضوع الورشة أو الفعالية:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ورشة نمذجة معمارية BIM، أو أمن تطبيقات الويب..."
                    value={suggestTopic}
                    onChange={(e) => setSuggestTopic(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-200 mb-1">اسمك (اختياري):</label>
                    <input
                      type="text"
                      placeholder="اسم الطالب"
                      value={suggestName}
                      onChange={(e) => setSuggestName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-200 mb-1">التخصص أو الكلية:</label>
                    <input
                      type="text"
                      placeholder="مثال: هندسة مدنية / برمجيات"
                      value={suggestMajor}
                      onChange={(e) => setSuggestMajor(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1">تفاصيل أو أفكار إضافية:</label>
                  <textarea
                    rows={3}
                    placeholder="اكتب نبذة عن المحاور المقترحة أو المهارات التي ترغب باكتسابها..."
                    value={suggestDetails}
                    onChange={(e) => setSuggestDetails(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1">وسيلة للتواصل (واتساب أو إيميل - اختياري):</label>
                  <input
                    type="text"
                    placeholder="059XXXXXXX أو إيميل"
                    value={suggestContact}
                    onChange={(e) => setSuggestContact(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none"
                  />
                </div>

                {suggestError && (
                  <div role="alert" className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm leading-relaxed">
                    {suggestError}
                  </div>
                )}
                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowSuggestModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs sm:text-sm font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال المقترح</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">تم استلام مقترحك بنجاح!</h4>
                <p className="text-xs sm:text-sm text-gray-300 font-light">
                  شكراً لمشاركتك الفاعلة. سيتم مراجعة فكرة الفعالية من قِبل لجان النادي لتضمينها في الخطط القادمة.
                </p>
              </div>
            )}

          </div>
        </div>
      )}

    </section>
  );
};
