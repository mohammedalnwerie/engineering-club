import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { LIVE_ACTIVITY_STREAM } from '../data/clubData';
import { dataService } from '../services/dataService';
import { normalizeCode } from '../utils/validation';
import { Award, Send, Check, X, Lightbulb, Users, Trophy, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LiveFeedSectionProps {
  onOpenJoin?: () => void;
}

export const LiveFeedSection: React.FC<LiveFeedSectionProps> = ({ onOpenJoin }) => {
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    return dataService.getSettings().showLiveFeedSection !== false;
  });

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setIsVisible(dataService.getSettings().showLiveFeedSection !== false);
    });
    return unsub;
  }, []);
  const [showNominateModal, setShowNominateModal] = useState(false);
  const [nomineeStudentId, setNomineeStudentId] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeMajor, setNomineeMajor] = useState('هندسة برمجيات');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDetails, setProjectDetails] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [membershipStatus, setMembershipStatus] = useState<'idle' | 'verified' | 'pending' | 'manual' | 'rejected'>('idle');
  const [isMemberConfirmed, setIsMemberConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [nominateError, setNominateError] = useState<string | null>(null);

  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lookupSeq = useRef(0);

  const handleStudentIdChange = (idVal: string) => {
    idVal = normalizeCode(idVal);
    setNomineeStudentId(idVal);
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    const q = idVal.trim();
    const seq = ++lookupSeq.current;
    if (!q || q.length < 4) {
      setMembershipStatus('idle');
      setIsMemberConfirmed(false);
      return;
    }

    lookupTimer.current = setTimeout(async () => {
      let found = null;
      try {
        found = await dataService.verifyMember(q);
      } catch {
        found = null;
      }
      if (seq !== lookupSeq.current) return;

      if (!found) {
        setMembershipStatus('manual');
        setIsMemberConfirmed(false);
        return;
      }
      if (found.status === 'مرفوض') {
        setMembershipStatus('rejected');
        setIsMemberConfirmed(false);
        return;
      }
      setMembershipStatus(found.status === 'تم القبول' ? 'verified' : 'pending');
      setNomineeName((prev) => prev || found.fullName);
      if (found.major) setNomineeMajor(found.major);
      setIsMemberConfirmed(true);
    }, 450);
  };

  const handleNominateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNominateError(null);
    if (!nomineeName.trim() || !projectTitle.trim() || !nomineeStudentId.trim()) return;
    if (membershipStatus === 'rejected') return;
    if (!isMemberConfirmed && membershipStatus !== 'verified') return;

    try {
      await dataService.submitComplaint({
        studentName: nomineeName.trim(),
        studentId: nomineeStudentId.trim(),
        email: contactInfo.trim() || 'nomination@engclub.up',
        phone: contactInfo.trim() || undefined,
        college: nomineeMajor || 'كلية الهندسة وتكنولوجيا المعلومات',
        category: 'suggestion',
        subject: '[ترشيح عضو لمهندس الشهر] ' + projectTitle.trim(),
        message: 'الرقم الجامعي: ' + nomineeStudentId.trim() + ' | التخصص: ' + nomineeMajor + ' | حالة العضوية: ' + membershipStatus + ' | تفاصيل الإنجاز: ' + projectDetails.trim(),
        isAnonymous: false,
      });
    } catch (err) {
      setNominateError(`تعذر إرسال الترشيح: ${err instanceof Error ? (err.message.includes('Failed to fetch') ? 'تعذر الاتصال. تأكد من الإنترنت وحاول مرة أخرى.' : err.message) : 'خطأ غير معروف'}`);
      return;
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
      setNomineeStudentId('');
      setNomineeName('');
      setProjectTitle('');
      setProjectDetails('');
      setContactInfo('');
      setMembershipStatus('idle');
      setIsMemberConfirmed(false);
    }, 2800);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <section className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 relative z-10 border-t border-white/5 bg-[#08041D]/80">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left: Inspiring Student Spotlight & Call to Nomination (Members Only) */}
          <div className="lg:col-span-7 rounded-3xl glass-panel p-6 sm:p-10 border border-emerald-500/20 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>خاص وحصري بأعضاء النادي الهندسي</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">جامعة فلسطين</span>
              </div>

              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-4">
                كُن أنت مهندس الشهر القادم!
              </h3>

              <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light mb-8 text-balance">
                يفتح النادي الهندسي باب التكريم والمنافسة <strong className="text-emerald-400 font-semibold">حصرياً لأعضائه المنتسبين المعتمدين</strong> للاحتفاء بنماذج التميز والمشاريع النوعية في كليات هندسة البرمجيات والذكاء الاصطناعي، والهندسة التطبيقية والتخطيط العمراني، وتكنولوجيا المعلومات. إذا كنت عضواً في النادي وقدمت إنجازاً أو مشروعاً مميزاً، بادر بترشيح نفسك أو ترشيح زميلك العضو لتسليط الضوء على إبداعه وتكريمه رسمياً.
              </p>

              {/* 3 Pillars of Recognition */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2.5">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">الابتكار التطبيقي</h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-light">
                    مشاريع تخرج أو نماذج برمجية ومعمارية وإنشائية قابلة للتطبيق.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-2.5">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">الأثر والمشاركة</h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-light">
                    نقل المعرفة، مساعدة الزملاء، والمساهمة الفاعلة في الحياة الجامعية.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2.5">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">المسابقات والجوائز</h4>
                  <p className="text-xs text-gray-400 leading-relaxed font-light">
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
                <span>رشّح عضواً / رشّح نفسك (خاص بأعضاء النادي)</span>
              </button>

              {onOpenJoin ? (
                <button
                  type="button"
                  onClick={onOpenJoin}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer underline underline-offset-4 transition-colors"
                >
                  <span>لست عضواً بعد؟ قدّم طلب انتساب للنادي</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="text-xs text-gray-400 font-mono text-center sm:text-right">
                  الترشيح متاح لأعضاء النادي المسجلين فقط
                </span>
              )}
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
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
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
                    <span className="text-xs font-mono px-2 py-1 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/20 shrink-0 mt-0.5">
                      {item.tag}
                    </span>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-gray-200 mb-0.5 leading-snug">
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <span className="text-xs text-gray-400 font-light">
                تابع منصات النادي للحصول على آخر التنبيهات والفرص الهندسية أولاً بأول.
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Member-Exclusive Nomination Modal */}
      {showNominateModal &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 sm:p-4 pt-20 sm:pt-24 pb-8 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
            <div className="relative w-full max-w-lg rounded-3xl bg-[#0B1B33] border border-emerald-500/40 p-6 sm:p-8 shadow-2xl text-right my-auto">
            
            <button
              onClick={() => setShowNominateModal(false)}
              className="absolute top-5 left-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!submitted ? (
              <form onSubmit={handleNominateSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-1 text-emerald-400">
                  <Award className="w-6 h-6" />
                  <h3 className="text-xl font-bold text-white">ترشيح مهندس الشهر (خاص بالأعضاء)</h3>
                </div>
                
                {/* Exclusive Member Banner */}
                <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>الترشيح مخصص حصرياً لأعضاء النادي الهندسي المعتمدين بجامعة فلسطين.</span>
                </div>

                {/* 1. Student ID & Verification */}
                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1">
                    الرقم الجامعي للمرشّح (أو كود العضوية UP-ENG-XXXX):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="أدخل الرقم الجامعي للتحقق من العضوية..."
                    value={nomineeStudentId}
                    onChange={(e) => handleStudentIdChange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none font-mono"
                    dir="ltr"
                  />

                  {/* Verification Status Card */}
                  {membershipStatus === 'verified' && (
                    <div className="mt-2 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">عضو معتمد رسمياً:</span> تم التحقق بنجاح من بيانات العضوية في النادي الهندسي.
                      </div>
                    </div>
                  )}

                  {membershipStatus === 'pending' && (
                    <div className="mt-2 p-3 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">طلب العضوية قيد المراجعة:</span> سيتم توثيق الترشيح واعتماده تزامناً مع تفعيل العضوية من الإدارة.
                      </div>
                    </div>
                  )}

                  {membershipStatus === 'rejected' && (
                    <div className="mt-2 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs flex items-start gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <span>عذراً، طلب العضوية غير مفعل حالياً. الترشيح مقتصر على أعضاء النادي.</span>
                    </div>
                  )}

                  {membershipStatus === 'manual' && nomineeStudentId.length >= 4 && (
                    <div className="mt-2 p-3 rounded-xl bg-blue-950/60 border border-blue-500/30 text-blue-200 text-xs space-y-2 animate-in fade-in">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <span>لم يُعثر على بطاقة إلكترونية مسجلة بهذا الرقم في المتصفح الحالي. إذا كان عضواً مسجلاً رسمياً بالجامعة، يرجى ملء البيانات وإقرار العضوية أدناه.</span>
                      </div>
                      {onOpenJoin && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowNominateModal(false);
                            onOpenJoin();
                          }}
                          className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                        >
                          لست عضواً بعد؟ انقر هنا للانتساب إلى النادي الآن
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. Nominee Name & Major */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-200 mb-1">اسم العضو المُرشّح:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: أحمد محمد النجار"
                      value={nomineeName}
                      onChange={(e) => setNomineeName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none"
                    />
                  </div>

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
                </div>

                {/* 3. Contact Info */}
                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1">وسيلة التواصل مع العضو (واتساب أو إيميل):</label>
                  <input
                    type="text"
                    required
                    placeholder="059XXXXXXX أو إيميل جامعي"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none"
                  />
                </div>

                {/* 4. Achievement / Project */}
                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1">عنوان الإنجاز أو المشروع المبتكر:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: منصة إدارة عيادات بالذكاء الاصطناعي / مشروع تخرج معماري"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none"
                  />
                </div>

                {/* 5. Details */}
                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1">نبذة عن المشروع أو رابط العمل (GitHub / Drive / Portfolio):</label>
                  <textarea
                    rows={3}
                    placeholder="اكتب نبذة مختصرة عن فكرة المشروع، أو ضع رابطاً للمعاينة..."
                    value={projectDetails}
                    onChange={(e) => setProjectDetails(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-emerald-400 text-white text-xs sm:text-sm outline-none resize-none"
                  />
                </div>

                {/* 6. Membership Pledge (Mandatory for non-auto-verified) */}
                {membershipStatus !== 'verified' && (
                  <label className="flex items-start gap-2.5 text-xs text-gray-300 cursor-pointer pt-1 bg-black/20 p-2.5 rounded-xl border border-white/5">
                    <input
                      type="checkbox"
                      required
                      checked={isMemberConfirmed}
                      onChange={(e) => setIsMemberConfirmed(e.target.checked)}
                      className="mt-0.5 rounded border-white/20 bg-black/40 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                    />
                    <span className="leading-snug">
                      أقر وأتعهد بأن المرشّح هو <strong className="text-emerald-400">عضو منتسب للنادي الهندسي</strong> بجامعة فلسطين وأتحمل مسؤولية صحة البيانات.
                    </span>
                  </label>
                )}

                {nominateError && (
                  <div role="alert" className="p-3 rounded-xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm leading-relaxed">
                    {nominateError}
                  </div>
                )}
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
                    disabled={membershipStatus === 'rejected' || (!isMemberConfirmed && membershipStatus !== 'verified')}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال ترشيح العضو</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">تم استلام ترشيح العضو بنجاح!</h4>
                <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed">
                  شكراً لحرصك. سيقوم فريق إدارة النادي الهندسي بمراجعة عضوية وإنجاز الزميل والتواصل معه تمهيداً للإضاءة والتكريم كمهندس الشهر.
                </p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

    </section>
  );
};
