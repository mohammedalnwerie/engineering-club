import React, { useState } from 'react';
import { 
  ArrowRight, 
  Printer, 
  Share2, 
  Check, 
  Sparkles, 
  Target, 
  Compass, 
  Building2, 
  ShieldCheck, 
  Award, 
  FileText, 
  GraduationCap, 
  Cpu, 
  ChevronLeft,
  Users,
  Scale,
  Handshake,
  Code2
} from 'lucide-react';
import { ClubLogo } from './ClubLogo';

interface AboutPageProps {
  onClose: () => void;
  onOpenJoin?: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onClose, onOpenJoin }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = window.location.origin + window.location.pathname + '#/about';
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const partnerColleges = [
    {
      name: 'كلية هندسة البرمجيات والذكاء الاصطناعي',
      nameEn: 'Faculty of Software Engineering & AI',
      role: 'الكلية المبادرة والمؤسسة للنادي',
      desc: 'حاضنة التكنولوجيا البرمجية، وهندسة النظم الذكية، وعلوم البيانات والخوارزميات المتقدمة.',
      icon: Cpu,
      color: 'from-emerald-500/20 to-teal-500/10',
      border: 'border-emerald-500/30',
      badge: 'الكلية المبادرة'
    },
    {
      name: 'كلية الهندسة التطبيقية والتخطيط العمراني',
      nameEn: 'Faculty of Applied Engineering & Urban Planning',
      role: 'شريك استراتيجي تأسيسي',
      desc: 'صرح الهندسة المعمارية والمدنية والميكانيكية والتخطيط الحضري والبنية التحتية المستدامة.',
      icon: Building2,
      color: 'from-blue-500/20 to-indigo-500/10',
      border: 'border-blue-500/30',
      badge: 'شريك تأسيسي'
    },
    {
      name: 'كلية تكنولوجيا المعلومات',
      nameEn: 'Faculty of Information Technology',
      role: 'شريك استراتيجي تأسيسي',
      desc: 'مركز التميز في الحوسبة السحابية، والشبكات، والأمن السيبراني وتطوير التطبيقات والحلول الرقمية.',
      icon: GraduationCap,
      color: 'from-cyan-500/20 to-sky-500/10',
      border: 'border-cyan-500/30',
      badge: 'شريك تأسيسي'
    }
  ];

  const coreValues = [
    {
      title: 'الابتكار',
      titleEn: 'Innovation',
      desc: 'تحفيز الأفكار الريادية والحلول الهندسية والتقنية غير التقليدية التي تصنع فارقاً حقيقياً في الواقع الفلسطيني والمحلي.',
      num: '01'
    },
    {
      title: 'التعاون',
      titleEn: 'Collaboration',
      desc: 'العمل الجماعي التكاملي العابر للكليات والتخصصات، وتوحيد جهود الطلبة في فرق عمل متناسقة ومؤثرة.',
      num: '02'
    },
    {
      title: 'التطوير',
      titleEn: 'Continuous Growth',
      desc: 'مواكبة التسارع التقني العالمي وصقل المهارات الأكاديمية والعملية والتطبيقية باستمرار.',
      num: '03'
    },
    {
      title: 'التمكين',
      titleEn: 'Empowerment',
      desc: 'تزويد الطالب بالأدوات القيادية والمهنية، وبناء ثقته بذاته ليكون قادراً على المنافسة وصناعة الفرص.',
      num: '04'
    },
    {
      title: 'الأثر',
      titleEn: 'Sustainable Impact',
      desc: 'توجيه المعرفة الهندسية نحو مشاريع ومبادرات ملموسة تخدم المجتمع وتترك بصمة ريادية راسخة.',
      num: '05'
    }
  ];

  const charterPrinciples = [
    'النادي كيان طلابي موحّد يمثل جميع الكليات والتخصصات التابعة له بالتساوي والعدالة.',
    'القيادة تقوم على العمل الجماعي والتشاور المستمر وتحمّل المسؤولية المشتركة.',
    'المناصب داخل النادي تكليف ومسؤولية لخدمة الطلبة، وليست امتيازاً أو حصانة.',
    'تُبنى المسؤوليات والتكليفات على الكفاءة والالتزام والقدرة على الإنجاز والإبداع.',
    'تُطبّق معايير المساءلة والنزاهة والشفافية على جميع الأعضاء والقيادة دون استثناء.',
    'يُحترم حق كل كلية وتخصص في التمثيل والمشاركة الفاعلة وإيصال صوته واحتياجاته.',
    'تُقدّم مصلحة النادي وطلبة جامعة فلسطين دوماً على أي مصالح شخصية أو فئوية.'
  ];

  return (
    <div className="min-h-screen bg-[#08041D] text-[#F3F4F6] relative z-50 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Print-specific style helper */}
      <style>{`
        @media print {
          body { background: #ffffff !important; color: #000000 !important; }
          .no-print { display: none !important; }
          .print-clean { border: 1px solid #ddd !important; background: transparent !important; color: #000 !important; box-shadow: none !important; }
          .print-text { color: #000 !important; }
        }
      `}</style>

      {/* Top Floating Action Bar (Sticky Header) */}
      <header className="sticky top-0 inset-x-0 z-50 bg-[#08041D]/90 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3.5 no-print">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Back Button */}
          <button
            onClick={() => {
              onClose();
            }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-emerald-400/50 hover:bg-emerald-500/10 text-gray-200 hover:text-emerald-400 text-xs sm:text-sm font-medium transition-all cursor-pointer group"
          >
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-emerald-400" />
            <span>العودة للرئيسية</span>
          </button>

          {/* Center Brand Identity */}
          <div className="hidden md:flex items-center gap-3">
            <ClubLogo variant="horizontal" size="sm" />
            <span className="text-xs font-mono text-emerald-400/80 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              الوثيقة والميثاق الرسمي
            </span>
          </div>

          {/* Action Tools */}
          <div className="flex items-center gap-2">
            {/* Share link */}
            <button
              onClick={handleShare}
              title="نسخ رابط صفحة الميثاق"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-400/50 text-xs font-mono text-gray-300 hover:text-cyan-300 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">تم النسخ!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">مشاركة</span>
                </>
              )}
            </button>

            {/* Print document */}
            <button
              onClick={handlePrint}
              title="طباعة أو تصدير الميثاق كـ PDF"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 hover:border-emerald-400/50 text-xs font-mono text-gray-300 hover:text-emerald-300 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">طباعة / PDF</span>
            </button>

            {/* Join CTA */}
            <button
              onClick={() => {
                if (onOpenJoin) {
                  onOpenJoin();
                } else {
                  onClose();
                  setTimeout(() => {
                    const target = document.querySelector('#join');
                    target?.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }
              }}
              className="px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(22,163,74,0.3)] transition-all cursor-pointer"
            >
              انضم للنادي
            </button>
          </div>
        </div>
      </header>

      {/* Background Decorative Ambient Lights */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-[#7F1AB2]/15 rounded-full blur-3xl pointer-events-none no-print" />
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-[#381C4A]/40 rounded-full blur-3xl pointer-events-none no-print" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#3FE7E3]/10 rounded-full blur-3xl pointer-events-none no-print" />

      {/* Main Charter Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 relative z-10">
        
        {/* Document Header & Seal */}
        <section className="text-center mb-16 pb-12 border-b border-white/10 relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#381C4A]/60 border border-[#3FE7E3]/30 text-[#3FE7E3] text-xs font-mono mb-6 shadow-[0_0_20px_rgba(63,231,227,0.12)]">
            <span className="w-2 h-2 rounded-full bg-[#3FE7E3] animate-pulse" />
            <span>ميثاق النادي الهندسي</span>
          </div>

          <div className="my-6">
            <ClubLogo variant="full" theme="dark" size="xl" className="mx-auto drop-shadow-[0_15px_35px_rgba(0,0,0,0.7)]" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            الميثاق التأسيسي والهوية الرسمية
          </h1>
          <p className="text-base sm:text-lg text-white font-bold mb-2">
            النادي الهندسي — جامعة فلسطين
          </p>
          <p className="text-xs sm:text-sm text-gray-400 max-w-2xl mx-auto font-mono">
            تحت مظلة جامعة فلسطين • بالتعاون المشترك بين كليات الهندسة وتكنولوجيا المعلومات
          </p>

          {/* Official Core Badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-medium">
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>إطار طلابي تطوعي</span>
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center gap-2">
              <Scale className="w-3.5 h-3.5 text-purple-400" />
              <span>مستقل وغير مسيّس</span>
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>تحت إشراف عمادة شؤون الطلبة</span>
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 flex items-center gap-2">
              <Handshake className="w-3.5 h-3.5 text-purple-400" />
              <span>تمثيل موحد لجميع التخصصات</span>
            </span>
          </div>

          {/* Slogan Pill */}
          <div className="mt-8 inline-flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-[#381C4A]/70 via-[#7F1AB2]/20 to-[#381C4A]/70 border border-[#7F1AB2]/40 shadow-[0_0_25px_rgba(127,26,178,0.2)]">
            <Sparkles className="w-4 h-4 text-[#3FE7E3]" />
            <span className="text-base sm:text-lg font-black text-white">هندسة اليوم .. تصنع أثر الغد</span>
            <span className="text-gray-500">|</span>
            <span className="font-mono text-xs font-semibold text-[#3FE7E3] uppercase">ENGINEERING TODAY .. IMPACT TOMORROW</span>
          </div>
        </section>

        {/* SECTION 01: من نحن (Full Official Text) */}
        <section className="mb-20 scroll-mt-24" id="about-us">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(22,163,74,0.2)]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="font-mono text-xs text-emerald-400 uppercase tracking-widest">ABOUT THE CLUB</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">من نحن</h2>
            </div>
          </div>

          <div className="p-6 sm:p-10 rounded-3xl glass-panel border border-white/10 relative overflow-hidden space-y-6 text-gray-200 text-base sm:text-lg leading-relaxed font-light">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            <p className="border-r-4 border-emerald-400 pr-4 font-normal text-white">
              <strong className="text-emerald-400 font-bold">النادي الهندسي</strong> هو إطار طلابي تطوعي وغير مسيّس، لا يتبع لأي جهة حزبية أو سياسية. تأسس النادي بمبادرة من طلبة كلية هندسة البرمجيات والذكاء الاصطناعي في جامعة فلسطين، ليكون منصة طلابية جامعة تجمع طلبة التخصصات الهندسية والتقنية في الجامعة تحت مظلة واحدة، بهدف تنمية مهاراتهم الأكاديمية والعملية والتقنية، وتعزيز روح التعاون والإبداع بينهم.
            </p>

            <p>
              يعمل النادي تحت إشراف <span className="text-emerald-300 font-semibold">عمادة شؤون الطلبة</span>، وبالتعاون مع <span className="text-white font-medium">كلية هندسة البرمجيات والذكاء الاصطناعي</span>، و<span className="text-white font-medium">كلية الهندسة التطبيقية والتخطيط العمراني</span>، و<span className="text-white font-medium">كلية تكنولوجيا المعلومات</span>، ويلتزم بكافة أنظمة ولوائح الجامعة المعمول بها.
            </p>

            <p>
              ويسخّر النادي كافة جهوده وطاقاته لخدمة الطلبة والمجتمع الأكاديمي من خلال المبادرات والأنشطة والبرامج النوعية التي تستجيب لاحتياجات الطلبة وتطلعاتهم، وتسهم في تطوير قدراتهم وصقل مهاراتهم وخبراتهم، وتعزيز مشاركتهم الفاعلة في الحياة الجامعية والمهنية والمجتمعية.
            </p>

            {/* Visual Highlight Quote */}
            <div className="mt-8 p-4 sm:p-6 rounded-2xl bg-[#381C4A]/40 border border-[#7F1AB2]/30 flex items-start gap-4">
              <Sparkles className="w-5 h-5 text-[#3FE7E3] shrink-0 mt-1" />
              <div className="text-sm sm:text-base text-gray-300">
                <span className="text-white font-bold block mb-1">رسالة الانتماء والمسؤولية:</span>
                نؤمن بأن الطالب الجامعي ليس متلقياً للعلم فحسب، بل هو شريك فاعل في البناء وصناعة الفرص وإعمار الوطن بعقله ومهاراته الهندسية.
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 02: رؤية النادي (Full Official Vision - 4 Pillars) */}
        <section className="mb-20 scroll-mt-24" id="vision">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(22,163,74,0.2)]">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <span className="font-mono text-xs text-emerald-400 uppercase tracking-widest">STRATEGIC VISION</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">رؤية النادي</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vision Pillar 1 */}
            <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-emerald-500/30 relative overflow-hidden flex flex-col justify-between hover:border-emerald-400/60 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-emerald-400 font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    ركيزة 01 // الريادة والتمكين
                  </span>
                  <span className="font-mono text-xs text-gray-500">PILLAR 1</span>
                </div>
                <h3 className="text-xl font-bold text-white">كيان طلابي رائد لتمكين الطالب الفلسطيني</h3>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light">
                  أن يكون النادي الهندسي في جامعة فلسطين كيانًا طلابيًا رائدًا وفاعلًا في بناء وتمكين الطالب الفلسطيني، من خلال توفير بيئة جامعية تجمع بين المعرفة الأكاديمية، والتطوير المهني، والابتكار، والعمل الجماعي، والمشاركة المجتمعية.
                </p>
              </div>
            </div>

            {/* Vision Pillar 2 */}
            <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-blue-500/30 relative overflow-hidden flex flex-col justify-between hover:border-blue-400/60 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-blue-400 font-bold px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    ركيزة 02 // صناعة الفرص
                  </span>
                  <span className="font-mono text-xs text-gray-500">PILLAR 2</span>
                </div>
                <h3 className="text-xl font-bold text-white">صناعة الفرص والتأهيل لسوق العمل</h3>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light">
                  يسعى النادي إلى أن يكون مساحة حقيقية يكتشف فيها الطالب قدراته ويطوّر مهاراته، ويحوّل ما يتعلمه داخل الجامعة إلى معرفة وتجارب ومشاريع عملية، ويصبح أكثر استعدادًا لمتطلبات سوق العمل وقادرًا على المنافسة وصناعة الفرص بدلًا من انتظارها.
                </p>
              </div>
            </div>

            {/* Vision Pillar 3 */}
            <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-cyan-500/30 relative overflow-hidden flex flex-col justify-between hover:border-cyan-400/60 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-cyan-400 font-bold px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    ركيزة 03 // التكامل الأكاديمي
                  </span>
                  <span className="font-mono text-xs text-gray-500">PILLAR 3</span>
                </div>
                <h3 className="text-xl font-bold text-white">مجتمع طلابي جامع وضمان التمثيل العادل</h3>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light">
                  يطمح النادي إلى بناء مجتمع طلابي متكامل يجمع مختلف الكليات والتخصصات، ويعزز التعاون وتبادل المعرفة والخبرات بينها، مع الحفاظ على هوية كل كلية وتخصص وضمان تمثيل طلبتها وإيصال صوتهم واحتياجاتهم.
                </p>
              </div>
            </div>

            {/* Vision Pillar 4 */}
            <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-amber-500/30 relative overflow-hidden flex flex-col justify-between hover:border-amber-400/60 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-amber-400 font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    ركيزة 04 // جوهر الرؤية
                  </span>
                  <span className="font-mono text-xs text-gray-500">PILLAR 4</span>
                </div>
                <h3 className="text-xl font-bold text-white">صناعة الإنسان والمهندس والقائد</h3>
                <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-light">
                  وفي جوهر رؤيتنا، نؤمن بأن الجامعة ليست فقط مكانًا للحصول على المعرفة والشهادة، بل بيئة لصناعة الإنسان والمهندس والقائد القادر على خدمة مجتمعه والمساهمة في بناء مستقبل أفضل لفلسطين.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 03: رسالة النادي (Full Official Mission - 5 Action Paths) */}
        <section className="mb-20 scroll-mt-24" id="mission">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#381C4A]/80 border border-[#7F1AB2]/40 flex items-center justify-center text-[#B991D4] shadow-[0_0_15px_rgba(127,26,178,0.3)]">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <span className="font-mono text-xs text-[#B991D4] uppercase tracking-widest">MISSION STATEMENT</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">رسالة النادي</h2>
            </div>
          </div>

          <div className="p-6 sm:p-10 rounded-3xl glass-panel border border-[#7F1AB2]/30 relative overflow-hidden space-y-8">
            <div className="border-r-4 border-[#7F1AB2] pr-4">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">الغايات الكبرى للرسالة:</h3>
              <p className="text-base sm:text-lg text-gray-200 leading-relaxed font-light">
                تتمثل رسالة النادي الهندسي في تمكين طالب جامعة فلسطين والطالب الفلسطيني من تطوير قدراته العلمية والعملية والشخصية، وتهيئته للانتقال من البيئة الجامعية إلى الحياة المهنية والمجتمعية بثقة وكفاءة.
              </p>
            </div>

            {/* 5 Strategic Execution Paths */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h4 className="text-xs font-mono uppercase tracking-wider text-blue-400">
                مسارات تحقيق الرسالة
              </h4>

              {/* Path 1 */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-blue-500/30 transition-all flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                  01
                </div>
                <div>
                  <h5 className="text-base font-bold text-white mb-1">البرامج التدريبية والهاكاثونات والتطبيق العملي</h5>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    يعمل النادي على تحقيق ذلك من خلال تنظيم وتطوير الدورات والورش التدريبية والمحاضرات والفعاليات، ودعم المشاريع والمسابقات والهاكاثونات والمبادرات الطلابية، وتوفير مساحات للتجربة والتطبيق والعمل الجماعي وتبادل الخبرات بين الطلبة.
                  </p>
                </div>
              </div>

              {/* Path 2 */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-emerald-500/30 transition-all flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                  02
                </div>
                <div>
                  <h5 className="text-base font-bold text-white mb-1">الربط المهني والتشبيك مع الخبراء وسوق العمل</h5>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    ربط الطلبة بخريجي الجامعة والمتخصصين والخبراء في مختلف المجالات الهندسية والتقنية، بالإضافة إلى التعاون مع الشركات والمؤسسات المحلية والدولية، وفتح مسارات وفرص تساعد الطلبة على اكتساب الخبرة العملية، وبناء علاقاتهم المهنية، والتعرف على احتياجات سوق العمل، وتحويل أفكارهم ومهاراتهم إلى مشاريع ومبادرات ذات قيمة.
                  </p>
                </div>
              </div>

              {/* Path 3 */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-cyan-500/30 transition-all flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                  03
                </div>
                <div>
                  <h5 className="text-base font-bold text-white mb-1">تمثيل الطلبة وإيصال الصوت وحل التحديات</h5>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    تمثيل الطلبة وإيصال صوتهم واحتياجاتهم ومقترحاتهم، وتعزيز التواصل بينهم وبين الجامعة، والمساهمة في إيجاد حلول للتحديات التي تواجههم، بما يحقق بيئة جامعية أكثر فاعلية وتعاونًا.
                  </p>
                </div>
              </div>

              {/* Path 4 */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-purple-500/30 transition-all flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                  04
                </div>
                <div>
                  <h5 className="text-base font-bold text-white mb-1">توحيد جهود الكليات الهندسية والتمثيل العادل</h5>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    توحيد جهود مختلف الكليات والتخصصات التقنية والهندسية ضمن كيان طلابي واحد، يقوم على التعاون والتمثيل العادل والكفاءة، ويمنح كل طالب فرصة للمشاركة والتطور والمساهمة.
                  </p>
                </div>
              </div>

              {/* Path 5 */}
              <div className="p-5 rounded-2xl bg-black/40 border border-white/5 hover:border-amber-500/30 transition-all flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                  05
                </div>
                <div>
                  <h5 className="text-base font-bold text-white mb-1">بناء جيل قيادي يصنع الأثر الوطني</h5>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    الوصول إلى بناء جيل من الطلبة الفلسطينيين القادرين على التعلم، والابتكار، والعمل، والقيادة، وصناعة الأثر في مجتمعهم ووطنهم.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 04: الكليات التأسيسية الشريكة */}
        <section className="mb-20 scroll-mt-24" id="partner-colleges">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-emerald-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="font-mono text-xs text-emerald-400 uppercase tracking-widest">PARTICIPATING FACULTIES</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">الكليات المنضوية تحت مظلة النادي</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {partnerColleges.map((college, idx) => {
              const IconComp = college.icon;
              return (
                <div
                  key={idx}
                  className={`p-6 rounded-3xl bg-gradient-to-b ${college.color} border ${college.border} flex flex-col justify-between transition-all hover:scale-[1.02] duration-300`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center text-white">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-white/10 text-white font-medium">
                        {college.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">{college.name}</h3>
                    <div className="font-mono text-xs text-gray-400 mb-3">{college.nameEn}</div>
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-light">
                      {college.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-gray-400">
                    <span>{college.role}</span>
                    <span className="text-emerald-400">● نشط</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 05: القيم الجوهرية الخمس */}
        <section className="mb-20 scroll-mt-24" id="values">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="font-mono text-xs text-emerald-400 uppercase tracking-widest">ORGANIZATIONAL VALUES</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">القيم الجوهرية الخمس</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {coreValues.map((val, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-black/40 border border-white/10 hover:border-[#7F1AB2]/40 hover:bg-[#381C4A]/30 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="font-mono text-xs text-emerald-400 font-bold mb-2">VALUE {val.num}</div>
                  <h3 className="text-lg font-bold text-white mb-1">{val.title}</h3>
                  <div className="font-mono text-xs text-gray-400 uppercase tracking-wider mb-2">{val.titleEn}</div>
                  <p className="text-xs text-gray-300 leading-relaxed font-light">
                    {val.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex justify-end">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 06: مبادئ الحوكمة والعمل الداخلي (من النظام الداخلي) */}
        <section className="mb-20 scroll-mt-24" id="governance">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest">GOVERNANCE & BYLAWS</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">مبادئ العمل والحوكمة الطلابية</h2>
            </div>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-cyan-500/30 space-y-4">
            <p className="text-sm sm:text-base text-gray-300 mb-4">
              تستند إدارة النادي إلى وثيقة الهيكل الإداري والصلاحيات والمسؤوليات الداخلية، القائمة على المبادئ الراسخة التالية:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {charterPrinciples.map((principle, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-black/40 border border-white/5">
                  <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                    {principle}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 08: المنصة الرقمية والتطوير الهندسي */}
        <section className="mb-20 scroll-mt-24" id="platform-engineering">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-cyan-400 font-bold tracking-wider">INFRASTRUCTURE & ARCHITECTURE</span>
              <h2 className="text-xl sm:text-2xl font-black text-white">المنصة الرقمية والبنية التحتية البرمجية</h2>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 relative overflow-hidden">
            <div className="space-y-4 text-sm sm:text-base text-gray-300 leading-relaxed">
              <p>
                تم تخطيط، وهندسة، وتطوير المنصة الرقمية الرسمية للنادي الهندسي بجامعة فلسطين وأنظمتها المتكاملة (بما تشمله من منظومة الهوية والبطاقات الرقمية المعتمدة، وبوابة الأعضاء، وقواعد البيانات السحابية، ولوحة إدارة النادي، ونظام إدارة الأنشطة والشكاوى) بجهد وبرمجة وإشراف:
              </p>
              <div className="p-4 rounded-2xl bg-white/[0.04] border border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-black text-sm">
                    MN
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">م. محمد النويري</h3>
                    <p className="text-xs text-gray-400 font-mono">Lead Software Engineer & Platform Architect</p>
                  </div>
                </div>
                <a
                  href="https://github.com/mohammedalnwerie"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 text-xs font-bold transition-colors inline-flex items-center gap-1.5 self-start sm:self-center"
                >
                  <span>الملف الهندسي على GitHub</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">
                كافة حقوق التصميم البرمجي والمعماري للمنصة مسجلة وموثقة هندسياً ضمن الملكية الفكرية لمطور النظام، وتخضع لسياسات وتراخيص التطوير البرمجي المعتمدة.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Official Seal & Verification Footer */}
        <section className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-[#381C4A]/70 via-[#7F1AB2]/20 to-[#381C4A]/70 border border-[#7F1AB2]/40 text-center relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <ClubLogo variant="horizontal" size="md" className="mx-auto mb-4" />
            <h3 className="text-2xl font-black text-white">معاً نصنع المستقبل الهندسي لفلسطين</h3>
            <p className="text-sm text-gray-300 leading-relaxed font-light">
              النادي الهندسي في جامعة فلسطين مفتوح لكافة الطلبة من مختلف الكليات والتخصصات الهندسية والتقنية للمساهمة والتطوير والإبداع.
            </p>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-4 no-print">
              <button
                onClick={() => {
                  if (onOpenJoin) {
                    onOpenJoin();
                  } else {
                    onClose();
                    setTimeout(() => {
                      const target = document.querySelector('#join');
                      target?.scrollIntoView({ behavior: 'smooth' });
                    }, 150);
                  }
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm shadow-[0_0_25px_rgba(22,163,74,0.4)] transition-all cursor-pointer flex items-center gap-2"
              >
                <span>الانضمام إلى النادي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  onClose();
                }}
                className="px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-gray-200 text-sm font-medium transition-all cursor-pointer"
              >
                العودة للصفحة الرئيسية
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 text-xs text-gray-400">
              ميثاق النادي الهندسي — جامعة فلسطين — وثيقة عامة
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};
