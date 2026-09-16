import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { 
  X, 
  Sparkles, 
  EyeOff, 
  Eye, 
  Lightbulb, 
  Send, 
  Check, 
  BookOpen, 
  Laptop, 
  Trophy 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const EventsSection: React.FC = () => {
  // Hide/Show Section Toggle
  const [isHidden, setIsHidden] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('eng_club_hide_events') === 'true';
    }
    return false;
  });

  // Suggest Event Modal
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestName, setSuggestName] = useState('');
  const [suggestMajor, setSuggestMajor] = useState('');
  const [suggestTopic, setSuggestTopic] = useState('');
  const [suggestDetails, setSuggestDetails] = useState('');
  const [suggestContact, setSuggestContact] = useState('');
  const [suggestSubmitted, setSuggestSubmitted] = useState(false);

  const handleToggleHide = () => {
    const next = !isHidden;
    setIsHidden(next);
    localStorage.setItem('eng_club_hide_events', String(next));
  };

  const handleSuggestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestTopic.trim()) return;

    try {
      dataService.submitComplaint({
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
    } catch {
      // safe fallback
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

  const renderSuggestModal = () => {
    if (!showSuggestModal) return null;
    return (
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
                ما هي المهارة أو الدورة التي ترغب بأن ينظمها النادي الهندسي؟ أخبرنا لنضعها ضمن أولويات خطتنا القادمة.
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-200 mb-1">عنوان أو موضوع الورشة المقترحة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ورشة نمذجة معمارية BIM، أو دورة تعلم Flutter، أو إدارة المشاريع"
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
                    placeholder="مثال: م. أحمد"
                    value={suggestName}
                    onChange={(e) => setSuggestName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1">تخصصك / كليتك:</label>
                  <input
                    type="text"
                    placeholder="مثال: عمارة / برمجيات"
                    value={suggestMajor}
                    onChange={(e) => setSuggestMajor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-200 mb-1">رقم الهاتف / الواتساب للتواصل (اختياري):</label>
                <input
                  type="text"
                  placeholder="059XXXXXXX أو إيميلك"
                  value={suggestContact}
                  onChange={(e) => setSuggestContact(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-200 mb-1">تفاصيل إضافية أو مدرب مقترح (اختياري):</label>
                <textarea
                  rows={3}
                  placeholder="هل تقترح مدرباً معيناً، أو نقاطاً محددة ترغب بتغطيتها في الورشة؟"
                  value={suggestDetails}
                  onChange={(e) => setSuggestDetails(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none resize-none"
                />
              </div>

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
                  <span>إرسال الاقتراح</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">شكراً لاقتراحك القيّم!</h4>
              <p className="text-xs sm:text-sm text-gray-300 font-light">
                تم استلام مقترحك وستقوم لجان الأنشطة والتدريب بدراسته وإدراجه ضمن خطة الورش القادمة.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // If section is toggled hidden: render a compact, clean banner
  if (isHidden) {
    return (
      <section id="events" className="py-6 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-5xl mx-auto p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>قسم الفعاليات والورش مخفي مؤقتاً (قيد تجهيز وتنسيق الأجندة الأولى)</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowSuggestModal(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>اقترح فعالية تهمك</span>
            </button>

            <button
              type="button"
              onClick={handleToggleHide}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-gray-400" />
              <span>إظهار القسم</span>
            </button>
          </div>
        </div>

        {renderSuggestModal()}
      </section>
    );
  }

  return (
    <section id="events" className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#07090e]/80 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        
        {/* Section Header with Hide button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0B2D5B]/60 border border-emerald-500/30 text-emerald-400 text-xs font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>البرامج والأنشطة القادمة // قيد التنسيق والتحضير</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              أجندة الفعاليات والورش الهندسية
            </h2>
          </div>

          {/* Controls: Suggest button + Hide toggle */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowSuggestModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Lightbulb className="w-4 h-4" />
              <span>اقترح ورشة عمل</span>
            </button>

            <button
              type="button"
              onClick={handleToggleHide}
              title="إخفاء قسم الفعاليات مؤقتاً"
              className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-gray-400 hover:text-white text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إخفاء مؤقت</span>
            </button>
          </div>
        </div>

        {/* Informative Preparation Card */}
        <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-emerald-500/20 mb-10 text-right">
          <p className="text-sm sm:text-base text-gray-200 font-light leading-relaxed mb-6">
            تعمل لجان النادي الهندسي حالياً على إعداد وتنسيق حزمة نوعية من الورش التدريبية التخصصية، والمحاضرات الهندسية، والهاكاثونات بالشراكة مع الكليات الهندسية ونخبة من الخبراء والمؤسسات الشريكة. نرحب بمقترحاتكم لتضمينها في الخطة الأولى.
          </p>

          {/* 3 Strategic Upcoming Tracks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {upcomingTracks.map((track, idx) => {
              const Icon = track.icon;
              return (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl bg-gradient-to-b ${track.color} border ${track.borderColor} flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-emerald-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-emerald-300">
                        {track.badge}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-2">{track.title}</h4>
                    <p className="text-xs text-gray-300 font-light leading-relaxed">
                      {track.desc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400 font-mono">
                    <span>TRACK 0{idx + 1}</span>
                    <span className="text-emerald-400">قريباً</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {renderSuggestModal()}

      </div>
    </section>
  );
};
