import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Menu, X, Terminal, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { sound } from '../utils/soundEngine';
import { ClubLogo } from './ClubLogo';


interface NavbarProps {
  onOpenJoinModal?: () => void;
  onOpenAdmin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenJoinModal, onOpenAdmin }) => {

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSound = () => {
    const nextState = sound.toggleMute();
    setIsMuted(nextState);
  };

  const navLinks = [
    { label: 'الكليات', href: '#colleges' },
    { label: 'التخصصات', href: '#majors' },
    { label: 'المشاريع', href: '#projects' },
    { label: 'الفعاليات', href: '#events' },
    { label: 'القيادة', href: '#leadership' },
    { label: 'انضم إلينا', href: '#join' },
  ];

  const handleNavClick = (href: string) => {
    sound.playClick();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 px-4 sm:px-6 lg:px-8 pt-4 transition-all duration-300">
      <div
        className={`max-w-7xl mx-auto rounded-2xl transition-all duration-300 px-4 sm:px-6 py-2.5 flex items-center justify-between ${
          isScrolled
            ? 'glass-panel shadow-[0_10px_35px_-10px_rgba(0,0,0,0.8)] border border-emerald-500/20 py-2'
            : 'bg-[#07090e]/70 backdrop-blur-md border border-white/5'
        }`}
      >
        {/* Official Brand Logo */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            sound.playClick();
          }}
          className="flex items-center gap-3.5 group cursor-pointer"
        >
          <ClubLogo variant="horizontal" size="md" />
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-2">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              onMouseEnter={() => sound.playHover()}
              className="px-3.5 py-1.5 text-sm font-medium text-gray-300 hover:text-cyan-400 hover:bg-white/[0.05] rounded-lg transition-all cursor-pointer"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Action Controls: Admin + Sound Toggle + Join Button */}
        <div className="flex items-center gap-2.5">
          {/* Admin Control Center HUD trigger */}
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenAdmin) onOpenAdmin();
            }}
            title="لوحة الإدارة الهندسية والتحكم في البيانات"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-400 text-xs font-mono text-cyan-300 hover:text-white transition-all cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
            <span>لوحة الإدارة</span>
          </button>

          {/* Sound FX Synthesizer Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'تفعيل المؤثرات الصوتية التقنية' : 'كتم المؤثرات الصوتية'}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 text-gray-400 hover:text-cyan-400 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* CTA: Join Club */}
          <button
            onClick={() => {
              sound.playClick();
              if (onOpenJoinModal) {
                onOpenJoinModal();
              } else {
                handleNavClick('#join');
              }
            }}
            onMouseEnter={() => sound.playHover()}
            className="relative group overflow-hidden px-4 sm:px-5 py-2 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 transition-all shadow-[0_0_20px_rgba(22,163,74,0.35)] hover:shadow-[0_0_30px_rgba(22,163,74,0.55)] cursor-pointer flex items-center gap-2 font-bold"
          >
            <span>انضم للنادي</span>
            <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => {
              sound.playClick();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="lg:hidden p-2 rounded-xl bg-white/[0.04] border border-white/10 text-gray-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 p-4 rounded-2xl glass-panel border border-cyan-500/20 shadow-2xl flex flex-col gap-2 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 px-2 text-xs font-mono text-cyan-400">
            <span>[قائمة الملاحة السريعة]</span>
            <span className="flex items-center gap-1">
              <Terminal className="w-3 h-3" /> ONLINE
            </span>
          </div>
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="text-right px-4 py-2.5 rounded-lg text-sm text-gray-200 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors flex items-center justify-between"
            >
              <span>{link.label}</span>
              <span className="font-mono text-xs text-gray-500">↗</span>
            </button>
          ))}
          <button
            onClick={() => {
              sound.playClick();
              setMobileMenuOpen(false);
              if (onOpenAdmin) onOpenAdmin();
            }}
            className="w-full py-2.5 rounded-xl font-mono text-xs text-cyan-300 bg-white/5 border border-cyan-500/30 flex items-center justify-center gap-2"
          >
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            <span>دخول لوحة الإدارة (Admin)</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setMobileMenuOpen(false);
              handleNavClick('#join');
            }}
            className="mt-1 w-full py-2.5 rounded-xl font-bold text-center text-sm text-[#07090e] bg-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)]"
          >
            تقديم طلب الانضمام الآن
          </button>
        </div>
      )}
    </header>
  );
};

