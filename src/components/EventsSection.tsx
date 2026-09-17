import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lightbulb,
  Send,
  Check,
  X,
  Laptop,
  BookOpen,
  Trophy,
  Calendar,
  Clock,
  MapPin,
  Users,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Copy,
  CheckCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { dataService } from '../services/dataService';
import type { EventItem, EventTicket } from '../types';
import { ClubLogo } from './ClubLogo';

export const EventsSection: React.FC = () => {
  const [events, setEvents] = useState<EventItem[]>(() => dataService.getEvents());
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    return dataService.getSettings().showEventsSection !== false;
  });

  useEffect(() => {
    setEvents(dataService.getEvents());
    setIsVisible(dataService.getSettings().showEventsSection !== false);
    const unsub = dataService.subscribe(() => {
      setEvents(dataService.getEvents());
      setIsVisible(dataService.getSettings().showEventsSection !== false);
    });
    return () => unsub();
  }, []);

  // Event Ticket Registration Modal State
  const [registeringEvent, setRegisteringEvent] = useState<EventItem | null>(null);
  const [regFullName, setRegFullName] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regContact, setRegContact] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [confirmedTicket, setConfirmedTicket] = useState<EventTicket | null>(null);
  const [copiedTicketId, setCopiedTicketId] = useState(false);

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringEvent) return;
    setRegError(null);

    if (!regFullName.trim()) {
      setRegError('يرجى إدخال اسمك الكامل.');
      return;
    }
    if (!regStudentId.trim()) {
      setRegError('يرجى إدخال رقمك الجامعي.');
      return;
    }
    if (!regContact.trim()) {
      setRegError('يرجى إدخال البريد الإلكتروني أو رقم الواتساب للتواصل.');
      return;
    }

    setIsSubmittingReg(true);
    try {
      const res = dataService.registerEventTicket({
        eventId: registeringEvent.id,
        attendeeName: regFullName.trim(),
        studentId: regStudentId.trim(),
        email: regContact.trim(),
      });

      if (!res.success || !res.ticket) {
        setRegError(res.error || 'تعذر تسجيل المقعد، يرجى المحاولة لاحقاً.');
        setIsSubmittingReg(false);
        return;
      }

      setConfirmedTicket(res.ticket);
      setEvents(dataService.getEvents());

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3FE7E3', '#10B981', '#7F1AB2'],
      });
    } catch (err) {
      setRegError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء التسجيل.');
    } finally {
      setIsSubmittingReg(false);
    }
  };

  const handleCloseRegModal = () => {
    setRegisteringEvent(null);
    setConfirmedTicket(null);
    setRegFullName('');
    setRegStudentId('');
    setRegContact('');
    setRegError(null);
    setCopiedTicketId(false);
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'Workshop':
        return {
          label: 'ورشة عمل تطبيقية',
          bg: 'bg-emerald-950/70',
          text: 'text-emerald-300',
          border: 'border-emerald-500/40',
        };
      case 'Hackathon':
        return {
          label: 'هاكاثون وتحدي هندسي',
          bg: 'bg-amber-950/70',
          text: 'text-amber-300',
          border: 'border-amber-500/40',
        };
      case 'Site Visit':
        return {
          label: 'زيارة ميدانية',
          bg: 'bg-cyan-950/70',
          text: 'text-cyan-300',
          border: 'border-cyan-500/40',
        };
      case 'Conference':
        return {
          label: 'مؤتمر وملتقى هندسي',
          bg: 'bg-purple-950/70',
          text: 'text-purple-300',
          border: 'border-purple-500/40',
        };
      default:
        return {
          label: category || 'فعالية هندسية',
          bg: 'bg-cyan-950/70',
          text: 'text-cyan-300',
          border: 'border-cyan-500/40',
        };
    }
  };

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
    <section id="events" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#08041D]/90 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#381C4A]/60 border border-[#3FE7E3]/30 text-[#3FE7E3] text-xs font-mono mb-3 shadow-[0_0_20px_rgba(63,231,227,0.12)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>البرامج والأنشطة والورش</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              أجندة الفعاليات والورش الهندسية
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl font-light leading-relaxed">
              ملتقيات تطبيقية، ورش مهارية، وهاكاثونات متخصصة لصقل مهارات طلبة الهندسة وتكنولوجيا المعلومات.
            </p>
          </div>

          {/* Action: Suggest workshop button */}
          <div className="flex items-center gap-2.5 shrink-0">
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

        {/* 1. Dynamic Events Grid (Rendered if events exist) */}
        {events.length > 0 ? (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3FE7E3] animate-pulse" />
                <h3 className="text-base sm:text-lg font-bold text-white">الفعاليات والورش المتاحة للتسجيل والحضور</h3>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-500/30">
                {events.length} فعالية معلنة
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((ev) => {
                const badge = getCategoryBadge(ev.category);
                const regCount = ev.registeredCount || 0;
                const capacity = ev.capacity || 40;
                const isFull = capacity > 0 && regCount >= capacity;
                const pct = capacity > 0 ? Math.min(100, Math.round((regCount / capacity) * 100)) : 0;

                return (
                  <div
                    key={ev.id}
                    className="p-6 rounded-3xl bg-gradient-to-b from-[#120A30] via-[#0A0524] to-[#08041D] border border-cyan-500/20 hover:border-cyan-400/50 shadow-xl hover:shadow-[0_10px_35px_rgba(63,231,227,0.15)] transition-all duration-300 flex flex-col justify-between group relative text-right"
                  >
                    <div>
                      {/* Badge and Status Pill */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className={`text-[11px] font-mono px-3 py-1 rounded-full border font-bold ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>

                        <span
                          className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                            isFull
                              ? 'bg-red-950/60 text-red-300 border-red-500/30'
                              : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isFull ? 'bg-red-400' : 'bg-emerald-400 animate-pulse'}`} />
                          <span>{isFull ? 'اكتملت المقاعد' : 'متاح للتسجيل'}</span>
                        </span>
                      </div>

                      {/* Event Title */}
                      <h4 className="text-lg sm:text-xl font-black text-white group-hover:text-cyan-300 transition-colors mb-3 leading-snug">
                        {ev.title}
                      </h4>

                      {/* Description */}
                      {ev.description && (
                        <p className="text-xs sm:text-sm text-gray-300 font-light leading-relaxed mb-4 line-clamp-3">
                          {ev.description}
                        </p>
                      )}

                      {/* Metadata Grid */}
                      <div className="space-y-2 bg-black/40 p-3.5 rounded-2xl border border-white/5 mb-4 text-xs">
                        {ev.date && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="font-mono text-[11px]">{ev.date}</span>
                          </div>
                        )}

                        {ev.time && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="font-mono text-[11px]">{ev.time}</span>
                          </div>
                        )}

                        {ev.location && (
                          <div className="flex items-center gap-2 text-gray-300">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-medium truncate">{ev.location}</span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-white/5">
                          <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1 font-mono">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-cyan-400" />
                              <span>حالة الحجز:</span>
                            </span>
                            <span className="text-white font-bold">
                              {regCount} / {capacity} مقعد
                            </span>
                          </div>
                          {/* Mini Progress Bar */}
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isFull ? 'bg-red-500' : pct > 75 ? 'bg-amber-400' : 'bg-cyan-400'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Speakers (if any) */}
                      {ev.speakers && ev.speakers.length > 0 && (
                        <div className="mb-4 pt-2 border-t border-white/5">
                          <div className="text-[11px] text-gray-400 mb-2 font-mono">المحاضر / مقدم الفعالية:</div>
                          <div className="space-y-1.5">
                            {ev.speakers.map((sp, sIdx) => (
                              <div key={sIdx} className="text-xs text-gray-200 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                <span className="font-bold text-white">{sp.name}</span>
                                <span className="text-gray-400 font-light">— {sp.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="mt-4 pt-3 border-t border-white/5">
                      <button
                        type="button"
                        disabled={isFull}
                        onClick={() => {
                          setRegisteringEvent(ev);
                          setConfirmedTicket(null);
                          setRegError(null);
                        }}
                        className={`w-full py-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                          isFull
                            ? 'bg-white/5 text-gray-400 border border-white/10 cursor-not-allowed'
                            : 'bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black shadow-[0_0_20px_rgba(63,231,227,0.3)]'
                        }`}
                      >
                        <Ticket className="w-4 h-4" />
                        <span>{isFull ? 'نعتذر، اكتمل عدد المقاعد' : 'حجز مقعد / تسجيل حضور'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* 2. Strategic Tracks Header & Preparation Notice */}
        <div className="pt-4">
          {events.length === 0 ? (
            <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-emerald-500/20 mb-10 text-right">
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light">
                تعمل لجان النادي الهندسي حالياً على إعداد وتنسيق حزمة نوعية من الورش التدريبية التخصصية، والمحاضرات الهندسية، والهاكاثونات بالشراكة مع الكليات الهندسية ونخبة من الخبراء والمؤسسات الشريكة. نرحب بمقترحاتكم لتضمينها في الخطة الأولى.
              </p>
            </div>
          ) : (
            <div className="mb-8 text-right">
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>مسارات البرامج والورش الاستراتيجية قيد الإعداد</span>
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-0.5 font-light">
                محاور العمل المستمرة التي تنظم من خلالها لجان النادي فعالياتها الفصلية.
              </p>
            </div>
          )}

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
      </div>

      {/* Modal 1: Event Ticket Registration Modal */}
      {registeringEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0B0826] border border-cyan-500/40 p-6 sm:p-8 shadow-[0_10px_50px_rgba(63,231,227,0.2)] text-right">
            <button
              onClick={handleCloseRegModal}
              className="absolute top-5 left-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {!confirmedTicket ? (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="flex items-center gap-2 mb-2 text-cyan-400">
                  <Ticket className="w-6 h-6" />
                  <h3 className="text-xl font-bold text-white">تسجيل حضور / حجز مقعد</h3>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 text-xs space-y-1">
                  <div className="font-extrabold text-white text-sm">{registeringEvent.title}</div>
                  <div className="text-gray-400 flex flex-wrap items-center gap-3 pt-1">
                    {registeringEvent.date && <span>📅 {registeringEvent.date}</span>}
                    {registeringEvent.time && <span>⏰ {registeringEvent.time}</span>}
                    {registeringEvent.location && <span>📍 {registeringEvent.location}</span>}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1">الاسم الكامل (ثلاثي أو رباعي):</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد محمد النويري"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-cyan-400 text-white text-xs sm:text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1">الرقم الجامعي:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 12020XXXX"
                    value={regStudentId}
                    onChange={(e) => setRegStudentId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-cyan-400 text-white text-xs sm:text-sm outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-200 mb-1">البريد الإلكتروني أو رقم الواتساب للتأكيد:</label>
                  <input
                    type="text"
                    required
                    placeholder="059XXXXXXX أو student@gmail.com"
                    value={regContact}
                    onChange={(e) => setRegContact(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 focus:border-cyan-400 text-white text-xs sm:text-sm outline-none"
                  />
                </div>

                {regError && (
                  <div role="alert" className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{regError}</span>
                  </div>
                )}

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseRegModal}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReg}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-black text-xs sm:text-sm font-bold shadow-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSubmittingReg ? 'جاري التأكيد...' : 'تأكيد الحجز وإصدار التذكرة'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Digital Admission Ticket View */
              <div className="space-y-4">
                <div className="text-center pb-3 border-b border-white/10">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                    <Check className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-black text-white">تم تأكيد حجز مقعدك بنجاح!</h4>
                  <p className="text-xs text-gray-300 font-light">
                    ننتظر حضورك المميز. يرجى الاحتفاظ برقم التذكرة أو أخذ لقطة شاشة.
                  </p>
                </div>

                {/* Digital Ticket Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#180D3D] via-[#10082E] to-[#08041D] border-2 border-cyan-400/40 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <ClubLogo variant="emblem" size="sm" />
                      <div>
                        <div className="text-xs font-black text-white">النادي الهندسي — UP</div>
                        <div className="text-[10px] font-mono text-cyan-400">OFFICIAL ADMISSION TICKET</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-bold">
                      حجز مؤكد ✓
                    </span>
                  </div>

                  <div className="py-4 space-y-3">
                    <div>
                      <div className="text-[10px] font-mono text-gray-400">الفعالية:</div>
                      <div className="text-sm font-bold text-white mt-0.5">{registeringEvent.title}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-[10px] font-mono text-gray-400">اسم الحاضر:</div>
                        <div className="font-bold text-white truncate">{confirmedTicket.attendeeName}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-gray-400">الرقم الجامعي:</div>
                        <div className="font-mono text-cyan-300">{confirmedTicket.studentId || '—'}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-[10px] font-mono text-gray-400">الموعد:</div>
                        <div className="text-gray-200">{registeringEvent.date || '—'} {registeringEvent.time ? `(${registeringEvent.time})` : ''}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-gray-400">المكان:</div>
                        <div className="text-gray-200 truncate">{registeringEvent.location || 'مقر الجامعة'}</div>
                      </div>
                    </div>

                    {/* Ticket Code Box */}
                    <div className="p-3 rounded-xl bg-black/60 border border-cyan-500/30 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-mono text-gray-400">رقم التذكرة (TICKET ID):</div>
                        <div className="font-mono text-base font-black text-[#3FE7E3] tracking-wider">
                          {confirmedTicket.ticketNumber}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(confirmedTicket.ticketNumber);
                          setCopiedTicketId(true);
                          setTimeout(() => setCopiedTicketId(false), 2000);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {copiedTicketId ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedTicketId ? 'تم النسخ' : 'نسخ الرقم'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCloseRegModal}
                    className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors cursor-pointer"
                  >
                    تم الحفظ وإغلاق النافذة
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
