import React, { useState } from 'react';
import { LIVE_ACTIVITY_STREAM } from '../data/clubData';
import { dataService } from '../services/dataService';
import { Award, Sparkles, Send, Check, X, Lightbulb, Users, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

export const LiveFeedSection: React.FC = () => {
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeMajor, setNomineeMajor] = useState('هندسة برمجيات');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDetails, setProjectDetails] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleNominateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomineeName.trim() || !projectTitle.trim()) return;

    // Save as a complaint/suggestion item of type proposal
    try {
      dataService.submitComplaint({
        studentName: nomineeName.trim(),
        studentId: 'NOMINATION',
        email: contactInfo.trim() || 'nomination@engclub.up',
        phone: contactInfo.trim() || undefined,
        college: nomineeMajor || 'كلية الهندسة وتكنولوجيا المعلومات',
        category: 'suggestion',
        subject: '[ترشيح لمهندس الشهر] ' + projectTitle.trim(),
        message: 'التخصص: ' + nomineeMajor + ' | تفاصيل الإنجاز: ' + projectDetails.trim(),
        isAnonymous: false,
      });
    } catch {
      // fallback safe
    }

    setSubmitted(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10B981', '#06B6D4', '#F59E0B'],
    });

    setTimeout(() => {
      setShowNominateModal(false);
      setSubmitted(false);
      setNomineeName('');
      setProjectTitle('');
      setProjectDetails('');
      setContactInfo('');
    }, 2800);
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-white/5 bg-[#090d16]/80">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left: Inspiring Student Spotlight & Call to Nomination */}
          <div className="lg:col-span-7 rounded-3xl glass-panel p-6 sm:p-10 border border-emerald-500/20 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>مساحة التميز والإبداع الطلابي</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">جامعة فلسطين</span>
              </div>

              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
                كُن أنت مهندس الشهر القادم!
              </h3>

              <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light mb-8 text-balance">
                يفتح النادي الهندسي أبوابه للاحتفاء بنماذج الطلبة المتميزة وأفكارهم ومشاريعهم النوعية في كليات هندسة البرمجيات والذكاء الاصطناعي، والهندسة التطبيقية، وتكنولوجيا المعلومات. إذا أنجزت مشروعاً مبتكراً أو حصدت جائزة أو بنيت حلاً هندسياً يخدم مجتمعك، فهذه مساحتك لتتألق.
              </p>

              {/* 3 Pillars of Recognition */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2.5">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">الابتكار التطبيقي</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-light">
                    مشاريع تخرج أو نماذج برمجية ومعمارية وإنشائية قابلة للتطبيق.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">الأثر والمشاركة</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-light">
                    نقل المعرفة، مساعدة الزملاء، والمساهمة الفاعلة في الحياة الجامعية.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2.5">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">المسابقات والجوائز</h4>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-light">
                    المشاركة في الهاكاثونات والمسابقات المحلية والدولية.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setShowNominateModal(true)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(22,163,74,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>رشّح نفسك أو زميلاً للمهندس المتميز</span>
              </button>

              <span className="text-[11px] text-gray-400 font-mono text-center sm:text-right">
                يتم الإعلان وتكريم مهندس الشهر دورياً
              </span>
            </div>
          </div>

          {/* Right: Real-time Live Activity Feed */}
          <div className="lg:col-span-5 rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-bold text-white">نبض وتحديثات النادي</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                  تحديثات حية
                </span>
              </div>

              {/* Feed Stream */}
              <div className="space-y-4">
                {LIVE_ACTIVITY_STREAM.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-black/30 border border-white/5 hover:border-emerald-500/30 transition-all flex items-start gap-3"
                  >
                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 shrink-0 mt-0.5">
                      {item.tag}
                    </span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-gray-200 mb-0.5 leading-snug">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <span className="text-[11px] text-gray-400 font-light">
                تابع منصات النادي للحصول على آخر التنبيهات والفرص الهندسية أولاً بأول.
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Nomination Modal */}
      {showNominateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0B1B33] border border-emerald-500/40 p-6 sm:p-8 shadow-2xl text-right">
            
            <button
              onClick={() => setShowNominateModal(false)}
              className="absolute top-5 left-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!submitted ? (
              <form onSubmit={handleNominateSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                  <Award className="w-6 h-6" />
                  <h3 className="text-xl font-bold text-white">ترشيح للمهندس المتميز</h3>
                </div>
                <p className="text-xs text-gray-300 font-light mb-4">
                  أدخل بياناتك أو بيانات زميلك مع نبذة عن المشروع أو الإنجاز لمراجعته من قِبل إدارة النادي.
                </p>

                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1">اسم الطالب المُرشّح:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمد النجار"
                    value={nomineeName}
                    onChange={(e) => setNomineeName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-200 mb-1">الكلية / التخصص:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: هندسة البرمجيات"
                      value={nomineeMajor}
                      onChange={(e) => setNomineeMajor(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-200 mb-1">وسيلة التواصل (واتساب أو إيميل):</label>
                    <input
                      type="text"
                      required
                      placeholder="059XXXXXXX أو إيميل"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1">عنوان الإنجاز أو المشروع:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تطبيق ذكاء اصطناعي للرعاية الصحية أو مشروع تخرج معماري"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1">نبذة عن المشروع أو رابط العمل (GitHub / Drive / Portfolio):</label>
                  <textarea
                    rows={3}
                    placeholder="اكتب نبذة مختصرة عن أهمية وفكرة المشروع، أو ضع رابطاً للمعاينة..."
                    value={projectDetails}
                    onChange={(e) => setProjectDetails(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none resize-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNominateModal(false)}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs sm:text-sm font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال الترشيح</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">تم استلام الترشيح بنجاح!</h4>
                <p className="text-xs sm:text-sm text-gray-300 font-light">
                  شكراً لمشاركتك. سيقوم فريق النادي الهندسي بمراجعة الإنجاز والتواصل معك تمهيداً للإضاءة والتكريم.
                </p>
              </div>
            )}

          </div>
        </div>
      )}

    </section>
  );
};
