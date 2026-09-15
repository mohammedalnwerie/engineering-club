import React, { useState } from 'react';
import { ArrowUp, MapPin, Check, Sparkles } from 'lucide-react';
import { sound } from '../utils/soundEngine';
import { ClubLogo } from './ClubLogo';
import { dataService } from '../services/dataService';


export const Footer: React.FC = () => {
  const [subscribed, setSubscribed] = useState(false);
  const [email, setEmail] = useState('');
  const settings = dataService.getSettings();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    sound.playSuccess();
    setSubscribed(true);
  };

  const scrollToTop = () => {
    sound.playClick();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#05070a] pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Blueprint Grid background in footer */}
      <div className="absolute inset-0 bg-blueprint-subgrid opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top telemetry banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between pb-10 border-b border-white/10 mb-12 gap-4">
          <div className="flex items-center gap-3">
            <ClubLogo variant="horizontal" size="md" />
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono text-xs text-gray-400">
            <div className="px-3 py-1 rounded-full bg-[#0B2D5B]/60 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
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

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="text-xs font-mono text-cyan-400">اشترك في النشرة الفنية للمشاريع (Eng-Brief):</div>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="name@student.edu.sa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white focus:border-cyan-400 focus:outline-none flex-1 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-bold font-mono transition-colors cursor-pointer shrink-0"
                >
                  {subscribed ? <Check className="w-4 h-4" /> : 'اشتراك'}
                </button>
              </div>
            </form>
          </div>

          {/* Col 3: Colleges */}
          <div>
            <h4 className="text-xs font-mono uppercase text-gray-300 mb-4 tracking-wider">// الكليات الهندسية</h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li>
                <a href="#colleges" className="hover:text-cyan-400 transition-colors">
                  الهندسة الصناعية والبرمجيات
                </a>
              </li>
              <li>
                <a href="#colleges" className="hover:text-cyan-400 transition-colors">
                  كلية تكنولوجيا المعلومات
                </a>
              </li>
              <li>
                <a href="#colleges" className="hover:text-cyan-400 transition-colors">
                  الهندسة المعمارية والمدنية
                </a>
              </li>
              <li>
                <a href="#colleges" className="hover:text-cyan-400 transition-colors">
                  المعامل والمختبرات البحثية
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
                <a href="#training" className="hover:text-cyan-400 transition-colors">
                  أكاديمية المعسكرات التدريبية
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
                <span className="text-gray-500 font-mono">contact@engclub.edu</span>
              </li>
            </ul>

            <div className="flex items-center gap-2.5">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-cyan-400 hover:text-black text-gray-400 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn"
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-cyan-400 hover:text-black text-gray-400 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X (Twitter)"
                className="p-2 rounded-lg bg-white/[0.04] hover:bg-cyan-400 hover:text-black text-gray-400 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>

          </div>
        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 font-mono gap-4">
          <div>
            © 2026 النادي الهندسي — جامعة فلسطين (غزة). جميع الحقوق محفوظة.
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
