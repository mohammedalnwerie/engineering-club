import React, { useState } from 'react';
import { ArrowUp, MapPin, Check, Sparkles } from 'lucide-react';
import { ClubLogo } from './ClubLogo';
import { dataService } from '../services/dataService';
import { validateEmail } from '../utils/validation';
import { SocialLinks } from './SocialLinks';


interface FooterProps {
  onOpenVerify?: () => void;
  onOpenComplaints?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenVerify, onOpenComplaints }) => {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');
  const settings = dataService.getSettings();
  const contact = dataService.getContactSettings();

  const [subscribeState, setSubscribeState] = useState<'idle' | 'sending' | 'error'>('idle');
  const [subscribeError, setSubscribeError] = useState('');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateEmail(email);
    if (problem) {
      setSubscribeState('error');
      setSubscribeError(problem);
      return;
    }
    setSubscribeState('sending');
    try {
      await dataService.subscribeNewsletter(email);
      setSubscribed(true);
      setSubscribeState('idle');
    } catch (err) {
      setSubscribeState('error');
      setSubscribeError(err instanceof Error && !err.message.includes('Failed to fetch') ? err.message : 'تعذر الاشتراك حالياً، حاول لاحقاً.');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#08041D] pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Blueprint Grid background in footer */}
      <div className="absolute inset-0 bg-blueprint-subgrid opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top telemetry banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-10 border-b border-white/10 mb-12 gap-4">
          <div className="flex items-center gap-3">
            <ClubLogo variant="horizontal" size="md" />
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-xs text-gray-400">
            <div className="px-3 py-1 rounded-full bg-[#381C4A]/60 border border-[#3FE7E3]/30 text-[#3FE7E3] text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(63,231,227,0.12)]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{settings.sloganAr || 'هندسة اليوم .. تصنع أثر الغد'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{settings.universityNameAr || 'جامعة فلسطين'}</span>
            </div>
            <span className="text-white/20 hidden sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>فلسطين — غزة</span>
            </div>
          </div>
        </div>

        {/* 4 Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-16">
          {/* Col 1 & 2: Manifesto & Newsletter */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-bold text-white mb-3">رسالة النادي الرسمية</h4>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-light mb-6 text-balance">
              {settings.mission}
            </p>

            {subscribed ? (
              <div role="status" className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-sm flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>تم اشتراكك. ستصلك أخبار الفعاليات والورش على بريدك.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} noValidate className="space-y-2">
                <label htmlFor="newsletter-email" className="block text-sm text-gray-300">
                  اشترك ليصلك جديد الفعاليات والورش
                </label>
                <div className="flex gap-2">
                  <input
                    id="newsletter-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="name@std.up.edu.ps"
                    value={email}
                    aria-invalid={subscribeState === 'error'}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (subscribeState === 'error') setSubscribeState('idle');
                    }}
                    className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white focus:border-cyan-400 focus:outline-none flex-1 min-w-0 text-left"
                    dir="ltr"
                  />
                  <button
                    type="submit"
                    disabled={subscribeState === 'sending'}
                    className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 text-black text-sm font-bold transition-colors cursor-pointer shrink-0"
                  >
                    {subscribeState === 'sending' ? 'جاري…' : 'اشتراك'}
                  </button>
                </div>
                {subscribeState === 'error' && (
                  <p role="alert" className="text-sm text-red-300">{subscribeError}</p>
                )}
              </form>
            )}
          </div>

          {/* Col 3: Colleges */}
          <div>
            <h4 className="text-xs font-mono uppercase text-gray-300 mb-4 tracking-wider">// الكليات الشريكة</h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li>
                <a href="#colleges" className="hover:text-cyan-400 transition-colors">
                  كلية هندسة البرمجيات والذكاء الاصطناعي
                </a>
              </li>
              <li>
                <a href="#colleges" className="hover:text-cyan-400 transition-colors">
                  كلية الهندسة التطبيقية والتخطيط العمراني
                </a>
              </li>
              <li>
                <a href="#colleges" className="hover:text-cyan-400 transition-colors">
                  كلية تكنولوجيا المعلومات
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Majors & Platforms */}
          <div>
            <h4 className="text-xs font-mono uppercase text-gray-300 mb-4 tracking-wider">// المسارات والمنصات</h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li>
                <a href="#majors" className="hover:text-cyan-400 transition-colors">
                  هندسة البرمجيات والنظم
                </a>
              </li>
              <li>
                <a href="#majors" className="hover:text-cyan-400 transition-colors">
                  الذكاء الاصطناعي والبيانات
                </a>
              </li>
              <li>
                <a href="#majors" className="hover:text-cyan-400 transition-colors">
                  الأمن السيبراني والدفاع
                </a>
              </li>
              <li>
                <a href="#majors" className="hover:text-cyan-400 transition-colors">
                  العمارة والنمذجة BIM
                </a>
              </li>
              <li>
                 <a href="#join" className="hover:text-cyan-400 transition-colors">
                   طلب الانضمام والعضوية
                 </a>
               </li>
            </ul>
          </div>

          {/* Col 5: Governance & Quick Jump */}
          <div>
            <h4 className="text-xs font-mono uppercase text-gray-300 mb-4 tracking-wider">// التواصل والروابط</h4>
            <ul className="space-y-2.5 text-xs text-gray-400 mb-6">
              <li>
                <a href="#leadership" className="hover:text-cyan-400 transition-colors">
                  مجلس الإدارة واللجان
                </a>
              </li>
              <li>
                <a href="#events" className="hover:text-cyan-400 transition-colors">
                  جدول الهاكاثونات القادمة
                </a>
              </li>
              <li>
                <a href="#join" className="hover:text-cyan-400 transition-colors">
                  بوابة تقديم العضوية
                </a>
              </li>
                            <li>
                <button
                  type="button"
                  onClick={onOpenComplaints}
                  className="hover:text-amber-400 text-amber-400/90 font-medium transition-colors flex items-center gap-1 cursor-pointer text-xs"
                >
                  <span>صندوق الشكاوى والمقترحات 📨</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenVerify}
                  className="hover:text-emerald-400 text-emerald-400/90 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>التحقق من بطاقة العضوية 🪪</span>
                </button>
              </li>
              <li>
                <a
                  href="#/about"
                  className="hover:text-emerald-400 text-emerald-400/90 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>الميثاق التأسيسي والهوية 📄</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-gray-400 hover:text-cyan-300 font-mono transition-colors"
                  dir="ltr"
                >
                  {contact.email}
                </a>
              </li>
            </ul>

            <SocialLinks links={contact.links} />

          </div>
        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 font-mono gap-4">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center sm:text-right">
            <span>© 2026 النادي الهندسي — جامعة فلسطين (غزة). جميع الحقوق محفوظة.</span>
            {/* Discreet entrance for the team; the dashboard itself still asks for a login. */}
            <a href="#/admin" className="text-gray-600 hover:text-cyan-400 transition-colors">
              دخول الإدارة
            </a>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-2 hover:text-cyan-400 transition-colors cursor-pointer"
          >
            <span>العودة للأعلى [TOP]</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
