import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import type { EventItem, EventTicket } from '../types';
import { sound } from '../utils/soundEngine';
import { Calendar, Clock, MapPin, Users, Ticket, CheckCircle, X, QrCode, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const EventsSection: React.FC = () => {
  const [eventsList, setEventsList] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [attendeeName, setAttendeeName] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [issuedTicket, setIssuedTicket] = useState<EventTicket | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

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
  };

  const handleConfirmRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendeeName.trim() || !selectedEvent) return;
    sound.playSuccess();

    // Store in dataService
    const ticket = dataService.bookTicket(selectedEvent.id, attendeeName.trim(), studentIdInput.trim());
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
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
                        backgroundColor: `${event.badgeColor}15`,
                      }}
                    >
                      {event.category}
                    </span>

                    <span className="font-mono text-xs text-gray-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{seatsRemaining} مقعد متبقٍ</span>
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                    {event.title}
                  </h3>

                  <p className="text-sm text-gray-300 mb-6 font-light leading-relaxed">
                    {event.description}
                  </p>

                  {/* Metadata: Date, Time, Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-4 rounded-2xl bg-black/30 border border-white/5 text-xs text-gray-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-[11px] font-mono text-gray-400 mb-1.5">
                      <span>نسبة امتلاء المقاعد</span>
                      <span>{progressPercent}% ({event.registeredCount}/{event.capacity})</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor: event.badgeColor,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Registration Action */}
                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    المتحدثون: {event.speakers?.map((s: { name: string }) => s.name).join('، ') || 'نخبة المدربين'}
                  </div>


                  <button
                    onClick={() => handleRegisterClick(event)}
                    onMouseEnter={() => sound.playHover()}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs text-[#07090e] bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.25)] flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>حجز مقعد / Register</span>
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
              className="relative w-full max-w-xl rounded-3xl glass-panel border border-cyan-500/30 p-6 sm:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
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
                    <span>بوابة إصدار بطاقة الحضور الرسمية</span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    {selectedEvent.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-300 mb-6">
                    {selectedEvent.date} — {selectedEvent.location}
                  </p>

                  <form onSubmit={handleConfirmRegistration} className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono uppercase text-gray-300 mb-1.5">
                        الاسم الرباعي الكامل للمهندس/ـة:
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: تركي بن فهد الراجحي"
                        value={attendeeName}
                        onChange={(e) => setAttendeeName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm"
                      />
                    </div>

                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-gray-400 space-y-1">
                      <div className="font-semibold text-gray-300 mb-1">شروط ومتطلبات الحضور:</div>
                      {selectedEvent.prerequisites.map((req, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{req}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl font-bold text-sm text-black bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all cursor-pointer"
                    >
                      تأكيد التسجيل وإصدار الباركود الرقمي
                    </button>
                  </form>
                </div>
              ) : (
                /* Holographic Digital Pass Ticket */
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-6 h-6" />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-1">
                    تم تأكيد مقعدك بنجاح!
                  </h3>
                  <p className="text-xs text-gray-400 mb-6">
                    تم حجز التذكرة وحفظها في منظومة النادي الهندسي
                  </p>

                  {/* Digital Boarding Pass */}
                  <div className="p-6 rounded-2xl bg-black/60 border border-cyan-500/40 text-right font-mono relative overflow-hidden shadow-inner">
                    <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-4 text-xs text-cyan-400">
                      <span>ENG-PASS // NO. {issuedTicket?.ticketNumber || 'TKT-2026-REG'}</span>
                      <span className="text-emerald-400 font-bold">CONFIRMED</span>
                    </div>

                    <div className="text-sm font-bold text-white mb-1">{attendeeName}</div>
                    <div className="text-xs text-gray-400 mb-4">{selectedEvent.title}</div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-300 mb-4">
                      <div>الموعد: {selectedEvent.date}</div>
                      <div>المكان: {selectedEvent.location.split('—')[0]}</div>
                    </div>

                    <div className="pt-4 border-t border-dashed border-white/20 flex items-center justify-between">
                      <div className="text-left text-[10px] text-gray-500">
                        SCAN AT ENTRANCE GATE
                        <br />
                        PORTAL ID: 2026-REG
                      </div>
                      <QrCode className="w-12 h-12 text-cyan-400" />
                    </div>
                  </div>


                  <button
                    onClick={closeModal}
                    className="mt-6 px-6 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    إغلاق البطاقة
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
