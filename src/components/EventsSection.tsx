import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { EventItem, EventTicket } from '../types';
import { sound } from '../utils/soundEngine';
import { Calendar, Clock, MapPin, Users, Ticket, CheckCircle, X, QrCode, Sparkles, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

export const EventsSection: React.FC = () => {
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [attendeeName, setAttendeeName] = useState('');
  const [issuedTicket, setIssuedTicket] = useState<EventTicket | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  // Membership validation state
  const [membershipStatus, setMembershipStatus] = useState<{
    status: 'idle' | 'approved' | 'pending' | 'rejected' | 'not_found';
    name?: string;
    major?: string;
  }>({ status: 'idle' });

  useEffect(() => {
    setEventsList(dataService.getEvents());
    const unsub = dataService.subscribe(() => {
      setEventsList(dataService.getEvents());
    });
    return () => unsub();
  }, []);

  const handleRegisterClick = (event: EventItem) => {
    sound.playModalOpen();
    setSelectedEvent(event);
    setRegisteredSuccess(false);
    setAttendeeName('');
    setStudentIdInput('');
    setIssuedTicket(null);
    setMembershipStatus({ status: 'idle' });
  };

  const handleStudentIdChange = (val: string) => {
    setStudentIdInput(val);
    const clean = val.trim();
    if (clean.length >= 3) {
      const check = dataService.isStudentMember(clean);
      if (check.isMember && check.app) {
        setMembershipStatus({
          status: 'approved',
          name: check.app.fullName,
          major: check.app.major,
        });
        setAttendeeName(check.app.fullName);
      } else if (check.status === 'pending') {
        setMembershipStatus({ status: 'pending' });
      } else {
        setMembershipStatus({ status: 'not_found' });
      }
    } else {
      setMembershipStatus({ status: 'idle' });
    }
  };

  const handleConfirmRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    // Strict validation: Must have an approved membership
    const check = dataService.isStudentMember(studentIdInput.trim());
    if (!check.isMember) {
      sound.playError();
      return;
    }

    sound.playSuccess();
    const finalName = attendeeName.trim() || check.app?.fullName || 'عضو النادي الهندسي';
    const ticket = dataService.bookTicket(selectedEvent.id, finalName, studentIdInput.trim());
    setIssuedTicket(ticket);
    setRegisteredSuccess(true);

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#00F0FF', '#3877FF', '#10B981'],
    });
  };

  const closeModal = () => {
    sound.playClick();
    setSelectedEvent(null);
  };

  const handleGoToJoin = () => {
    closeModal();
    const target = document.querySelector('#join');
    target?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="events" className="py-28 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#07090e]/70">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-400 text-xs font-mono mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>UPCOMING SCHEDULE // HACKATHONS & FORUMS</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              الفعاليات والهاكاثونات القادمة
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base text-gray-400 font-light">
            محطات عملية وتجمعات هندسية مكثفة تبني شبكة علاقاتك وتضع مهاراتك تحت اختبار التحدي الحقيقي.
          </p>
        </div>

        {/* Events Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {eventsList.map((event: EventItem) => {
            const seatsRemaining = event.capacity - event.registeredCount;
            const progressPercent = Math.round((event.registeredCount / event.capacity) * 100);

            return (
              <div
                key={event.id}
                className="rounded-3xl glass-panel border border-white/10 hover:border-cyan-400/50 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden"
              >
                {/* Visual Ambient line */}
                <div
                  className="absolute top-0 inset-x-0 h-1 transition-all duration-500"
                  style={{ backgroundColor: event.badgeColor }}
                />

                <div>
                  {/* Category & Capacity badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="font-mono text-xs px-2.5 py-1 rounded border font-semibold"
                      style={{
                        borderColor: `${event.badgeColor}40`,
                        color: event.badgeColor,
                        backgroundColor: `${event.badgeColor}10`,
                      }}
                    >
                      {event.category}
                    </span>

                    <span className="font-mono text-xs text-gray-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>
                        المتبقي: {seatsRemaining > 0 ? seatsRemaining : 'مكتمل'} مقعد
                      </span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors leading-snug">
                    {event.title}
                  </h3>

                  {/* Schedule Details */}
                  <div className="space-y-2 mb-6 text-xs text-gray-300 font-mono">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-400 leading-relaxed mb-6 line-clamp-3">
                    {event.description}
                  </p>

                  {/* Capacity Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-[11px] font-mono text-gray-400 mb-1.5">
                      <span>نسبة الحجز:</span>
                      <span className="text-white font-bold">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(progressPercent, 100)}%`,
                          backgroundColor: event.badgeColor,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Registration Action */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    {event.speakers?.[0]?.name || 'الهيئة الإدارية'}
                  </div>

                  <button
                    onClick={() => handleRegisterClick(event)}
                    onMouseEnter={() => sound.playHover()}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs text-[#07090e] bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.25)] flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>حجز مقعد (أعضاء النادي)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Event Registration & Digital Pass Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/80 backdrop-blur-xl">
            <div
              className="relative w-full max-w-lg rounded-3xl glass-panel border border-cyan-500/30 p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 text-right"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={closeModal}
                className="absolute top-5 left-5 p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {!registeredSuccess ? (
                <div>
                  <div className="flex items-center gap-2 font-mono text-xs text-cyan-400 mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>بوابة حجز مقاعد الفعاليات // MEMBERS ONLY</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                    {selectedEvent.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 mb-6">
                    {selectedEvent.date} — {selectedEvent.location}
                  </p>

                  <form onSubmit={handleConfirmRegistration} className="space-y-4">
                    {/* Student ID / Member Verification */}
                    <div>
                      <label className="block text-xs font-mono uppercase text-gray-300 mb-1.5">
                        الرقم الجامعي / رقم العضوية المعتمد:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="أدخل رقمك الجامعي (مثال: 120230XXX)..."
                        value={studentIdInput}
                        onChange={(e) => handleStudentIdChange(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm font-mono"
                      />
                    </div>

                    {/* Live Membership Verification Alert Box */}
                    {membershipStatus.status === 'approved' && (
                      <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-start gap-2.5 animate-in fade-in">
                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-white">عضو معتمد بالنادي: {membershipStatus.name}</div>
                          <div className="text-[11px] text-emerald-300/90 mt-0.5">التخصص: {membershipStatus.major} — العضوية سارية ومعتمدة</div>
                        </div>
                      </div>
                    )}

                    {membershipStatus.status === 'pending' && (
                      <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-300 flex items-start gap-2.5 animate-in fade-in">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-white">طلب العضوية قيد المراجعة</div>
                          <div className="text-[11px] text-amber-300/90 mt-0.5">
                            طلب عضويتك مسجل ولكن ما زال قيد الاعتماد من إدارة النادي. ستتمكن من حجز المقاعد فور الموافقة عليه.
                          </div>
                        </div>
                      </div>
                    )}

                    {membershipStatus.status === 'not_found' && (
                      <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-gray-300 space-y-2 animate-in fade-in">
                        <div className="flex items-center gap-2 font-bold text-red-300">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <span>حجز المقاعد مخصص فقط للأعضاء المسجلين في النادي</span>
                        </div>
                        <p className="text-[11px] text-gray-300 leading-relaxed">
                          لم نعثر على عضوية معتمدة مسجلة بهذا الرقم الجامعي. يرجى تقديم طلب عضوية مجاني أولاً للانضمام وحضور فعاليات النادي.
                        </p>
                        <button
                          type="button"
                          onClick={handleGoToJoin}
                          className="w-full py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <span>قدّم طلب انضمام للنادي الآن</span>
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Member Full Name */}
                    <div>
                      <label className="block text-xs font-mono uppercase text-gray-300 mb-1.5">
                        اسم المهندس/ـة:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="اسمك الكامل المسجل في النادي"
                        value={attendeeName}
                        onChange={(e) => setAttendeeName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm"
                      />
                    </div>

                    {/* Prerequisites */}
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-gray-400 space-y-1">
                      <div className="font-semibold text-gray-300 mb-1">متطلبات الحضور:</div>
                      {selectedEvent.prerequisites.map((req, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action Button */}
                    <button
                      type="submit"
                      disabled={membershipStatus.status !== 'approved'}
                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        membershipStatus.status === 'approved'
                          ? 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_20px_rgba(0,240,255,0.3)]'
                          : 'bg-white/10 text-gray-500 cursor-not-allowed border border-white/5'
                      }`}
                    >
                      <Ticket className="w-4 h-4" />
                      <span>
                        {membershipStatus.status === 'approved'
                          ? 'تأكيد حجز المقعد وإصدار التذكرة'
                          : 'مطلوب إدخال رقم عضوية معتمد للحجز'}
                      </span>
                    </button>
                  </form>
                </div>
              ) : (
                /* Holographic Digital Pass Ticket */
                <div className="text-center py-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1">
                    تم تأكيد مقعدك بنجاح!
                  </h3>
                  <p className="text-xs text-gray-400 mb-5">
                    تم إصدار التذكرة الرسمية لحضور الفعالية وتوثيقها باسمك ورقم عضويتك
                  </p>

                  {/* Digital Boarding Pass */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-black/60 border border-emerald-500/40 text-right font-mono relative overflow-hidden shadow-inner">
                    <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-4 text-xs text-cyan-400">
                      <span>ENG-PASS // NO. {issuedTicket?.ticketNumber || 'TKT-2026-REG'}</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>عضو معتمد</span>
                      </span>
                    </div>

                    <div className="text-base font-bold text-white mb-1">{attendeeName}</div>
                    <div className="text-xs text-cyan-300 mb-1">الرقم الجامعي: {studentIdInput}</div>
                    <div className="text-xs text-gray-400 mb-4">{selectedEvent.title}</div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300 mb-4 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 font-sans">
                      <div>الموعد: {selectedEvent.date}</div>
                      <div>المكان: {selectedEvent.location}</div>
                    </div>

                    <div className="pt-3 border-t border-dashed border-white/20 flex items-center justify-between">
                      <div className="text-left text-[9px] text-gray-500">
                        UNIVERSITY OF PALESTINE
                        <br />
                        SCAN AT ENTRANCE GATE
                      </div>
                      <QrCode className="w-10 h-10 text-emerald-400" />
                    </div>
                  </div>

                  <button
                    onClick={closeModal}
                    className="mt-6 px-6 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    إغلاق التذكرة
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
