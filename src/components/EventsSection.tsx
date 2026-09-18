import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Lightbulb,
  Send,
  Check,
  X,
  Laptop,
  BookOpen,
  Trophy,
  CalendarDays,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  Lock,
  UserRound,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { dataService } from '../services/dataService';
import {
  memberService,
  formatArabicDate,
  eventWhenLabel,
  EVENT_TYPE_LABELS,
  type MemberProfile,
  type PublicEvent,
} from '../services/memberService';
import { MemberLoginForm } from './member/MemberLoginForm';

interface EventsSectionProps {
  onOpenMemberPortal?: () => void;
  onOpenJoinModal?: () => void;
}

type Feedback = { eventId: string; tone: 'success' | 'warning' | 'error'; message: string };

export const EventsSection: React.FC<EventsSectionProps> = ({ onOpenMemberPortal, onOpenJoinModal }) => {
  const [isVisible, setIsVisible] = useState<boolean>(() => dataService.getSettings().showEventsSection !== false);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [eventsState, setEventsState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [profile, setProfile] = useState<MemberProfile | null>(memberService.currentProfile);
  const [loginForEvent, setLoginForEvent] = useState<PublicEvent | null>(null);
  const [busyEventId, setBusyEventId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      setEvents(await memberService.listEvents());
      setEventsState('ready');
    } catch {
      setEventsState('error');
    }
  }, []);

  useEffect(() => {
    void loadEvents();
    if (memberService.isLoggedIn && !memberService.currentProfile) void memberService.refresh().catch(() => undefined);
    const unsubData = dataService.subscribe(() => setIsVisible(dataService.getSettings().showEventsSection !== false));
    const unsubMember = memberService.subscribe(() => setProfile(memberService.currentProfile));
    return () => {
      unsubData();
      unsubMember();
    };
  }, [loadEvents]);

  const registrationFor = (eventId: string) => profile?.registrations.find((r) => r.eventId === eventId);

  const register = async (event: PublicEvent) => {
    setBusyEventId(event.id);
    setFeedback(null);
    try {
      const result = await memberService.registerForEvent(event.id);
      if (!result || !result.status) {
        throw new Error('تعذر التحقق من حالة التسجيل من الخادم.');
      }
      setFeedback({
        eventId: event.id,
        tone: result.status === 'registered' ? 'success' : 'warning',
        message:
          result.status === 'registered'
            ? result.alreadyRegistered
              ? 'أنت مسجّل في هذه الفعالية مسبقاً.'
              : 'تم تسجيلك بنجاح. تجد تسجيلاتك في «حسابي».'
            : result.alreadyRegistered
              ? 'أنت مدرج في قائمة الانتظار لهذه الفعالية مسبقاً.'
              : 'المقاعد اكتملت، أُضفت إلى قائمة الانتظار وسيُثبت مقعدك تلقائياً إذا انسحب أحد.',
      });
      if (result.status === 'registered' && !result.alreadyRegistered) {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 }, colors: ['#3FE7E3', '#7F1AB2', '#35BC2B'] });
      }
      void loadEvents();
    } catch (err) {
      setFeedback({
        eventId: event.id,
        tone: 'error',
        message: err instanceof Error ? err.message : 'تعذر التسجيل في الفعالية',
      });
    } finally {
      setBusyEventId(null);
    }
  };

  const handleRegisterClick = (event: PublicEvent) => {
    if (!memberService.isLoggedIn) {
      setLoginForEvent(event);
      return;
    }
    void register(event);
  };

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

    const studentName = profile?.fullName || suggestName.trim() || 'طالب مقترح';
    const studentId = profile?.studentId || 'EVENT_PROPOSAL';
    const email = profile?.email || suggestContact.trim() || 'proposal@engclub.up';
    const college = profile?.college || profile?.major || suggestMajor.trim() || 'كلية الهندسة وتكنولوجيا المعلومات';

    try {
      await dataService.submitComplaint({
        studentName,
        studentId,
        email,
        phone: suggestContact.trim() || undefined,
        college,
        category: 'suggestion',
        subject: '[اقتراح ورشة / فعالية] ' + suggestTopic.trim(),
        message: `مقدم المقترح: ${studentName} (${profile ? 'عضو معتمد بالنادي' : 'طالب'}) | الرقم الجامعي: ${studentId} | الكلية/التخصص: ${college} | تفاصيل المقترح: ${suggestDetails.trim()}`,
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
      color: 'from-emerald-500/10 to-teal-500/5',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'مسار اللقاءات الحوارية والربط بسوق العمل',
      icon: BookOpen,
      desc: 'جلسات إرشاد مهني واستشارات تفاعلية مع نخبة من المهندسين الخبراء والخريجين للتعرف على متطلبات وفرص العمل الحقيقية.',
      color: 'from-blue-500/10 to-indigo-500/5',
      borderColor: 'border-blue-500/20'
    },
    {
      title: 'مسار الهاكاثونات وحلول الإعمار والتطوير',
      icon: Trophy,
      desc: 'تحديات ومسابقات فرق عمل متكاملة تجمع مهندسي العمارة والمدني والبرمجيات لابتكار حلول عملية تدعم مجتمعنا في فلسطين.',
      color: 'from-amber-500/10 to-orange-500/5',
      borderColor: 'border-amber-500/20'
    }
  ];


  if (!isVisible) {
    return null;
  }

  const upcoming = events.filter((e) => e.status !== 'completed');

  return (
    <section id="events" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#08041D]/90 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#381C4A]/60 border border-[#3FE7E3]/30 text-[#3FE7E3] text-xs mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>الورش والدورات والهاكاثونات</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">فعاليات النادي</h2>
            <p className="text-sm text-gray-400 mt-2 max-w-2xl leading-relaxed">
              التسجيل متاح لأعضاء النادي فقط. ادخل برقمك الجامعي ورمز العضو الذي وصلك في إيميل القبول.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {profile ? (
              <button
                type="button"
                onClick={onOpenMemberPortal}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white flex items-center gap-2 cursor-pointer"
              >
                <UserRound className="w-4 h-4 text-cyan-300" />
                <span>{profile.fullName.split(' ')[0]} — حسابي</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenMemberPortal}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white flex items-center gap-2 cursor-pointer"
              >
                <UserRound className="w-4 h-4 text-cyan-300" />
                <span>دخول الأعضاء</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSuggestModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              <span>اقترح ورشة</span>
            </button>
          </div>
        </div>

        {eventsState === 'loading' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 rounded-3xl bg-white/[0.03] border border-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {eventsState === 'ready' && upcoming.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
            {upcoming.map((event) => {
              const reg = registrationFor(event.id);
              const full = event.capacity !== null && event.registeredCount >= event.capacity;
              const seatsLeft = event.capacity !== null ? Math.max(0, event.capacity - event.registeredCount) : null;
              // No date yet means registration stays open until one is announced.
              const deadline = event.registrationDeadline || event.startsAt;
              const closed =
                event.status !== 'published' || (Boolean(deadline) && new Date(deadline as string).getTime() < Date.now());
              const fb = feedback?.eventId === event.id ? feedback : null;

              return (
                <article
                  key={event.id}
                  className="rounded-3xl p-6 bg-white/[0.03] border border-white/10 hover:border-[#3FE7E3]/30 transition-colors flex flex-col text-right"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#7F1AB2]/25 text-[#D1B5E3] border border-[#7F1AB2]/50">
                      {EVENT_TYPE_LABELS[event.eventType] || 'فعالية'}
                    </span>
                    {event.committeeOnly && event.committee && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-200 border border-cyan-500/30 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {event.committee}
                      </span>
                    )}
                    {event.status === 'cancelled' && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-500/15 text-red-300">ملغاة</span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white leading-snug">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-gray-400 mt-2 leading-relaxed line-clamp-3">{event.description}</p>
                  )}

                  <ul className="mt-4 space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                      <CalendarDays className="w-4 h-4 shrink-0 mt-0.5 text-[#3FE7E3]" />
                      <span>{eventWhenLabel(event)}</span>
                    </li>
                    {event.location && (
                      <li className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[#3FE7E3]" />
                        <span>{event.location}</span>
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <Users className="w-4 h-4 shrink-0 mt-0.5 text-[#3FE7E3]" />
                      <span>
                        {seatsLeft === null
                          ? `${event.registeredCount} مسجّل`
                          : full
                            ? `اكتملت المقاعد${event.waitlistCount ? ` — ${event.waitlistCount} في الانتظار` : ''}`
                            : `${seatsLeft} مقعد متبقٍ من ${event.capacity}`}
                      </span>
                    </li>
                    {!closed && event.registrationDeadline && (
                      <li className="flex items-start gap-2 text-gray-400">
                        <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>آخر موعد للتسجيل: {formatArabicDate(event.registrationDeadline, true)}</span>
                      </li>
                    )}
                  </ul>

                  <div className="mt-auto pt-5 space-y-2">
                    {fb && (
                      <p
                        role={fb.tone === 'error' ? 'alert' : 'status'}
                        className={`text-sm p-3 rounded-xl ${
                          fb.tone === 'success'
                            ? 'bg-emerald-950/50 text-emerald-200'
                            : fb.tone === 'warning'
                              ? 'bg-amber-950/50 text-amber-200'
                              : 'bg-red-950/50 text-red-200'
                        }`}
                      >
                        {fb.message}
                      </p>
                    )}

                    {reg ? (
                      <div
                        className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${
                          reg.status === 'waitlisted' ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{reg.status === 'waitlisted' ? 'أنت في قائمة الانتظار' : 'أنت مسجّل'}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={closed || busyEventId === event.id}
                        onClick={() => handleRegisterClick(event)}
                        className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#7F1AB2] to-[#6F3993] hover:from-[#A26CC6] hover:to-[#7F1AB2] disabled:from-white/10 disabled:to-white/10 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer transition-all"
                      >
                        {busyEventId === event.id
                          ? 'جاري التسجيل…'
                          : event.status === 'cancelled'
                            ? 'ألغيت الفعالية'
                            : closed
                              ? 'التسجيل مغلق'
                              : full
                                ? 'انضم لقائمة الانتظار'
                                : 'سجّل الآن'}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {(eventsState === 'error' || (eventsState === 'ready' && upcoming.length === 0)) && (
          <>
            <div className="p-6 sm:p-8 rounded-3xl bg-white/[0.03] border border-white/10 mb-8 text-right">
              <p className="text-base text-gray-300 leading-relaxed">
                لا توجد فعاليات مفتوحة للتسجيل حالياً. تعمل لجان النادي على إعداد الورش والدورات والهاكاثونات القادمة، ونرحب
                بمقترحاتكم.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {upcomingTracks.map((track) => {
                const Icon = track.icon;
                return (
                  <div key={track.title} className={`rounded-3xl p-6 bg-gradient-to-b ${track.color} border ${track.borderColor} text-right`}>
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 mb-4">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{track.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{track.desc}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Member login when registering */}
      {loginForEvent &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 sm:p-4 pt-20 sm:pt-24 pb-8 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-md my-auto max-h-[92vh] overflow-y-auto overscroll-contain rounded-3xl glass-panel border border-white/10 p-6 sm:p-8 text-right">
              <button
                onClick={() => setLoginForEvent(null)}
                aria-label="إغلاق"
                className="absolute top-4 left-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-xl font-black text-white">دخول الأعضاء</h3>
              <p className="text-sm text-gray-400 mt-1 mb-5">
                للتسجيل في «{loginForEvent.title}».
              </p>
              <MemberLoginForm
                submitLabel="دخول وتسجيل"
                onSuccess={() => {
                  const event = loginForEvent;
                  setLoginForEvent(null);
                  void register(event);
                }}
              />
            </div>
          </div>,
          document.body
        )}

      {/* Suggest Event Modal */}
      {showSuggestModal &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-start justify-center p-3 sm:p-4 pt-20 sm:pt-24 pb-8 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl bg-[#0B1B33] border border-emerald-500/40 p-6 sm:p-8 shadow-2xl text-right my-auto">
              <button
                onClick={() => setShowSuggestModal(false)}
                className="absolute top-5 left-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {!profile ? (
                /* Non-member exclusive prompt */
                <div className="text-center py-3 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                    <Lightbulb className="w-8 h-8" />
                  </div>

                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>خاص وحصري بأعضاء النادي الهندسي</span>
                  </div>

                  <h3 className="text-xl font-bold text-white">اقترح ورشة عمل أو فعالية</h3>

                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-md mx-auto">
                    نظراً لأن جدول الفعاليات والورش يتم تصميمه وتنسيقه بناءً على تطلعات واحتياجات مهندسينا، فإن تقديم مقترحات الورش والدورات متاح لمنتسبي النادي الهندسي المسجلين.
                  </p>

                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSuggestModal(false);
                        if (onOpenMemberPortal) onOpenMemberPortal();
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.2)]"
                    >
                      <UserRound className="w-4 h-4" />
                      <span>تسجيل دخول الأعضاء لتقديم مقترح</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowSuggestModal(false);
                        if (onOpenJoinModal) onOpenJoinModal();
                        else document.querySelector('#join')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>قدّم طلب انضمام للنادي</span>
                      <ArrowLeft className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ) : !suggestSubmitted ? (
                /* Authenticated member proposal form */
                <form onSubmit={handleSuggestSubmit} className="space-y-4">
                  <div className="flex items-center gap-2 mb-2 text-emerald-400">
                    <Lightbulb className="w-6 h-6" />
                    <h3 className="text-xl font-bold text-white">اقترح ورشة عمل أو فعالية</h3>
                  </div>
                  
                  {/* Verified Member Banner */}
                  <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>عضو معتمد: <strong>{profile.fullName}</strong> ({profile.major || profile.college || 'كلية الهندسة'})</span>
                    </div>
                    <span className="font-mono text-[11px] bg-emerald-900/60 px-2 py-0.5 rounded text-emerald-200">{profile.studentId}</span>
                  </div>

                  <p className="text-xs text-gray-300 font-light">
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
                    <label className="block text-xs font-medium text-gray-200 mb-1">وسيلة للتواصل والمتابعة (واتساب أو إيميل - اختياري):</label>
                    <input
                      type="text"
                      placeholder="059XXXXXXX أو إيميل للتنسيق المباشر"
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
                    شكراً لمشاركتك الفاعلة يا بشمهندس {profile.fullName.split(' ')[0]}. سيتم مراجعة فكرة الفعالية من قِبل لجان النادي لتضمينها في الخطط القادمة.
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
