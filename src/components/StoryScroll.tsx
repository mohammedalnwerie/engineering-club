import React, { useState } from 'react';
import { Layers, GitFork, Users2, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { sound } from '../utils/soundEngine';

export const StoryScroll: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: '01',
      title: '3 كليات متخصصة',
      subtitle: 'ركائز المنظومة الهندسية',
      description: 'كلية هندسة برمجيات وذكاء اصطناعي، كلية تكنولوجيا المعلومات IT، وكلية الهندسة التطبيقية و التخطيط العمراني. تكامل ثلاثي يجمع الذكاء، البرمجيات، والبيئة العمرانية.',
      icon: Layers,
      accent: 'text-cyan-400',
      badge: 'THREE PILLARS',
      bgGlow: 'rgba(0, 240, 255, 0.1)',
      stats: '3 كليات — 21 مختبراً بحثياً'
    },
    {
      id: '02',
      title: '6 تخصصات رائدة',
      subtitle: 'مسارات دقيقة تصنع الكفاءة',
      description: 'هندسة برمجيات، هندسة ذكاء اصطناعي، تخصص نظم المعلومات، تخصص الوسائط المتعددة، تخصص هندسة معمارية، وتخصص هندسة مدنية. مسارات متقاطعة تفتح آفاق الابتكار المتعدد.',
      icon: GitFork,
      accent: 'text-blue-400',
      badge: 'SIX SPECIALIZATIONS',
      bgGlow: 'rgba(56, 119, 255, 0.1)',
      stats: '6 مسارات دقيقة معتمدة'
    },
    {
      id: '03',
      title: 'مجتمع هندسي واحد',
      subtitle: 'قوة العقول المتكاملة',
      description: 'أكثر من 1,200 طالب وطالبة ومطور وباحث يلتقون في بيئة واحدة، يتبادلون الخبرات ويدعمون بعضهم في حل المشكلات التقنية الصعبة وصناعة النماذج الأولية.',
      icon: Users2,
      accent: 'text-emerald-400',
      badge: 'ONE UNIFIED COMMUNITY',
      bgGlow: 'rgba(16, 185, 129, 0.1)',
      stats: '1,200+ عضو فاعل'
    },
    {
      id: '04',
      title: 'نصنع الفرص معًا',
      subtitle: 'من مقاعد الدراسة إلى قمة الصناعة',
      description: 'نحوّل المشاريع الأكاديمية إلى شركات ناشئة وبراءات اختراع، ونربط الطلاب بأضخم الشركات الهندسية والتقنية لتوفير فرص التدريب والتوظيف الحقيقية.',
      icon: Sparkles,
      accent: 'text-amber-400',
      badge: 'FUTURE IMPACT',
      bgGlow: 'rgba(245, 158, 11, 0.1)',
      stats: '45+ مشروع حي لسوق العمل'
    }
  ];

  const active = steps[currentStep];
  const IconComponent = active.icon;

  const handleStepSelect = (idx: number) => {
    sound.playClick();
    setCurrentStep(idx);
  };

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 border-y border-white/5 bg-[#0a0d14]/70 backdrop-blur-md">
      <div className="max-w-6xl mx-auto">
        {/* Narrative Flow Indicator */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-gray-300 text-xs font-mono mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>القصة الهندسية // THE ENGINEERING NARRATIVE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            معادلة التأثير: كيف نصنع الفارق؟
          </h2>
        </div>

        {/* Interactive Progress Tabs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {steps.map((step, idx) => {
            const isSelected = currentStep === idx;
            return (
              <button
                key={step.id}
                onClick={() => handleStepSelect(idx)}
                onMouseEnter={() => sound.playHover()}
                className={`text-right p-4 rounded-xl border transition-all duration-300 relative overflow-hidden cursor-pointer ${
                  isSelected
                    ? 'glass-panel border-cyan-500/50 shadow-[0_0_20px_rgba(0,240,255,0.15)] bg-cyan-950/20'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/20 text-gray-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-mono text-xs font-bold ${isSelected ? 'text-cyan-400' : 'text-gray-500'}`}>
                    STEP {step.id}
                  </span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />}
                </div>
                <div className={`font-bold text-sm sm:text-base ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                  {step.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Narrative Display Stage */}
        <div
          className="relative rounded-3xl glass-panel p-6 sm:p-10 lg:p-12 border border-cyan-500/20 shadow-2xl transition-all duration-500 overflow-hidden"
          style={{ boxShadow: `0 20px 50px -15px ${active.bgGlow}` }}
        >
          {/* Subtle Blueprint Grid inside Card */}
          <div className="absolute inset-0 bg-blueprint-subgrid opacity-40 pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Dynamic Iconography & Visual Emblem */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-8 rounded-2xl bg-black/30 border border-white/10 relative">
              <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/20 flex items-center justify-center shadow-inner">
                <IconComponent className={`w-14 h-14 ${active.accent} transition-transform duration-500 hover:scale-110`} />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full" />
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-cyan-400 rounded-full" />
              </div>

              <span className="font-mono text-xs text-gray-400 mt-6 tracking-widest uppercase">
                [{active.badge}]
              </span>
              <span className="font-mono text-xs font-semibold text-cyan-400 mt-1">
                {active.stats}
              </span>
            </div>

            {/* Right: Narrative Content */}
            <div className="lg:col-span-8 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-3">
                <span className="font-mono text-sm font-extrabold text-cyan-400 px-2.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                  {active.id}
                </span>
                <span className="text-gray-400 font-mono text-xs uppercase tracking-wider">
                  {active.subtitle}
                </span>
              </div>

              <h3 className="text-2xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
                {active.title}
              </h3>

              <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-8">
                {active.description}
              </p>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div className="flex items-center gap-2">
                  {steps.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handleStepSelect(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        currentStep === i ? 'w-8 bg-cyan-400' : 'w-2 bg-white/20 hover:bg-white/40'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStepSelect(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 disabled:opacity-30 disabled:cursor-not-allowed text-gray-200 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleStepSelect(Math.min(steps.length - 1, currentStep + 1))}
                    disabled={currentStep === steps.length - 1}
                    className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-cyan-500/40 disabled:opacity-30 disabled:cursor-not-allowed text-gray-200 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
