import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, ShieldCheck, MessageSquare, FileText } from 'lucide-react';
import { ClubLogo } from './ClubLogo';
import { dataService } from '../services/dataService';

interface NavbarProps {
  onOpenJoinModal?: () => void;
  onOpenVerify?: () => void;
  onOpenComplaints?: () => void;
  onOpenAbout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenJoinModal, onOpenVerify, onOpenComplaints, onOpenAbout }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showEvents, setShowEvents] = useState<boolean>(() => dataService.getSettings().showEventsSection !== false);
  const [showProjects, setShowProjects] = useState<boolean>(() => dataService.getSettings().showProjectsSection !== false);

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setShowEvents(dataService.getSettings().showEventsSection !== false);
      setShowProjects(dataService.getSettings().showProjectsSection !== false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'من نحن', href: '#brand-identity' },
    { label: 'الكليات', href: '#colleges' },
    { label: 'التخصصات', href: '#majors' },
    ...(showEvents ? [{ label: 'الفعاليات', href: '#events' }] : []),
    ...(showProjects ? [{ label: 'المشاريع', href: '#projects' }] : []),
    { label: 'القيادة', href: '#leadership' },
    { label: 'الأسئلة الشائعة', href: '#faq' },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    if (window.location.hash.startsWith('#/')) {
      window.location.hash = '';
    }
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleJoin = () => {
    setMobileMenuOpen(false);
    if (onOpenJoinModal) onOpenJoinModal();
    else handleNavClick('#join');
  };

  return (
    <header className="fixed top-0 inset-x-0 z-40 px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 transition-all duration-300">
      <div
        className={`max-w-7xl mx-auto rounded-2xl transition-all duration-300 px-3 sm:px-5 py-2 flex items-center justify-between gap-3 ${
          isScrolled
            ? 'glass-panel shadow-[0_10px_35px_-10px_rgba(0,0,0,0.8)] border border-[#7F1AB2]/30'
            : 'bg-[#08041D]/80 backdrop-blur-md border border-white/5'
        }`}
      >
        {/* Official Brand Logo */}
        <a
          href="#"
          aria-label="النادي الهندسي — الصفحة الرئيسية"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center group cursor-pointer shrink-0"
        >
          <ClubLogo variant="horizontal" size="lg" />
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-0.5 p-1 bg-white/[0.03] border border-white/[0.06] rounded-xl">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="px-3 py-2 text-sm font-medium text-gray-300 hover:text-[#3FE7E3] hover:bg-white/[0.05] rounded-lg transition-all cursor-pointer whitespace-nowrap"
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {/* Student services */}
          <div className="hidden md:flex items-center p-1 bg-white/[0.03] border border-white/10 rounded-xl gap-0.5">
            <button
              onClick={() => onOpenVerify?.()}
              title="التحقق من بطاقة العضوية"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-emerald-500/10 text-sm text-gray-300 hover:text-emerald-300 transition-all cursor-pointer whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>التحقق</span>
            </button>
            <button
              onClick={() => onOpenComplaints?.()}
              title="صندوق الشكاوى والمقترحات"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-amber-500/10 text-sm text-gray-300 hover:text-amber-300 transition-all cursor-pointer whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
              <span>الشكاوى</span>
            </button>
          </div>

          {/* CTA: Join Club */}
          <button
            onClick={handleJoin}
            className="group px-4 lg:px-5 py-2.5 rounded-xl text-sm text-white font-bold bg-gradient-to-r from-[#7F1AB2] to-[#6F3993] hover:from-[#A26CC6] hover:to-[#7F1AB2] shadow-[0_8px_24px_rgba(127,26,178,0.35)] transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>انضم للنادي</span>
            <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 shrink-0" />
          </button>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
            aria-expanded={mobileMenuOpen}
            className="xl:hidden p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-gray-300 hover:text-white cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden max-w-7xl mx-auto mt-2 p-3 rounded-2xl glass-panel border border-white/10 shadow-2xl flex flex-col gap-1 animate-in fade-in slide-in-from-top-4 duration-200 max-h-[calc(100vh-6rem)] overflow-y-auto">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => handleNavClick(link.href)}
              className="text-right px-4 py-3 rounded-xl text-base text-gray-200 hover:bg-white/5 hover:text-[#3FE7E3] transition-colors cursor-pointer"
            >
              {link.label}
            </button>
          ))}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 mt-2 border-t border-white/10">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenAbout) onOpenAbout();
                else window.location.hash = '#/about';
              }}
              className="py-3 rounded-xl text-sm text-gray-200 bg-white/5 border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-[#3FE7E3]" />
              <span>ميثاق النادي</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenVerify?.();
              }}
              className="py-3 rounded-xl text-sm text-gray-200 bg-white/5 border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>التحقق من العضوية</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenComplaints?.();
              }}
              className="py-3 rounded-xl text-sm text-gray-200 bg-white/5 border border-white/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>الشكاوى والمقترحات</span>
            </button>
          </div>

          <button
            onClick={handleJoin}
            className="mt-2 w-full py-3 rounded-xl font-bold text-center text-base text-white bg-gradient-to-r from-[#7F1AB2] to-[#6F3993] cursor-pointer"
          >
            قدّم طلب الانضمام
          </button>
        </div>
      )}
    </header>
  );
};
