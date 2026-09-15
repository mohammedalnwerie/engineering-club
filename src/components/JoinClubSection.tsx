import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import type { ClubApplication } from '../types';
import { sound } from '../utils/soundEngine';
import { checkRateLimit } from '../utils/security';

import { Sparkles, ArrowLeft, ArrowRight, Check, QrCode, Cpu, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';


export const JoinClubSection: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState<ClubApplication>({
    fullName: '',
    studentId: '',
    email: '',
    phone: '',
    academicYear: 'السنة الثالثة',
    college: 'كلية هندسة برمجيات وذكاء اصطناعي',
    major: 'هندسة برمجيات',
    skills: [],
    personalStatement: '',
    targetCommittee: 'عضوية عامة (عضو بالنادي)',
    weeklyCommitmentHours: 4,
  });

  const availableSkills = [
    'Python / AI',
    'C++ / Embedded',
    'Fullstack Web (React / Node)',
    'Mobile Apps (Flutter / React Native)',
    'Cybersecurity & Network Defense',
    'CAD & SolidWorks',
    'Revit BIM & Grasshopper',
    'Robotics & ROS2',
    'Project Management (Agile / PMP)',
    'UI/UX & Graphic Design',
    'Content Writing & Media',
    'IoT & Hardware Soldering',
  ];

  const committees = [
    {
      id: 'general',
      name: 'عضوية عامة (عضو بالنادي)',
      desc: 'حضور ورش العمل والفعاليات والمسابقات والاستفادة من أنشطة وبرامج النادي (دون أي التزام إداري أو تنظيمي في اللجان).',
      badge: 'متاح للجميع',
      badgeColor: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/30'
    },
    {
      id: 'events',
      name: 'لجنة الفعاليات والأنشطة',
      desc: 'فريق تخطيط وتنظيم الفعاليات، المسابقات، ورش العمل، والهاكاثونات الميدانية.',
      badge: 'فريق تنظيمي (مقاعد محددة)',
      badgeColor: 'text-cyan-400 bg-cyan-950/70 border-cyan-500/30'
    },
    {
      id: 'training',
      name: 'لجنة العلاقات والتدريب',
      desc: 'فريق بناء الشراكات، التنسيق مع المؤسسات والمدربين، وتطوير الدورات التدريبية.',
      badge: 'فريق تنظيمي (مقاعد محددة)',
      badgeColor: 'text-blue-400 bg-blue-950/70 border-blue-500/30'
    },
    {
      id: 'media',
      name: 'اللجنة الإعلامية',
      desc: 'فريق صناعة المحتوى الرقمي، التغطيات الحية، التصميم والمونتاج، وإدارة السوشيال ميديا.',
      badge: 'فريق تنظيمي (مقاعد محددة)',
      badgeColor: 'text-purple-400 bg-purple-950/70 border-purple-500/30'
    },
  ];

  const handleNext = () => {
    sound.playClick();
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    sound.playClick();
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleSkill = (skill: string) => {
    sound.playHover();
    let updated = formData.skills.filter((s) => s !== 'طالب جديد — شغوف بالتعلم من الصفر');
    if (updated.includes(skill)) {
      updated = updated.filter((s) => s !== skill);
    } else {
      updated.push(skill);
    }
    setFormData({ ...formData, skills: updated });
  };

  const handleSubmit = () => {
    const rateCheck = checkRateLimit('join_submission', 4000);
    if (!rateCheck.allowed) {
      sound.playError();
      alert(`يرجى الانتظار ${rateCheck.waitSeconds} ثوانٍ قبل إعادة الإرسال لحماية الخادم.`);
      return;
    }

    sound.playSuccess();
    // Persist real application to database/storage
    dataService.submitApplication(formData);
    setIsSubmitted(true);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#00F0FF', '#3877FF', '#10B981', '#F59E0B'],
    });
  };


  return (
    <section id="join" className="py-28 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#07090e]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-4">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>مكانك معنا // BECOME A MEMBER</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight mb-4">
            ما الذي تريد أن تبنيه؟
          </h2>

          <p className="text-base sm:text-lg text-gray-300 font-light">
            الانضمام للنادي الهندسي ليس مجرد تسجيل استمارة، بل بداية بناء هويتك المهنية الحقيقية مع نخبة العقول الهندسية.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Wizard Form Card */}
          <div className="lg:col-span-7 rounded-3xl glass-panel p-6 sm:p-10 border border-white/10 relative overflow-hidden">
            {!isSubmitted ? (
              <div>
                {/* Wizard Steps Tracker Header */}
                <div className="flex items-center justify-between pb-6 mb-8 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-extrabold text-cyan-400 px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-500/30">
                      STEP 0{currentStep} / 05
                    </span>
                    <span className="text-sm font-bold text-white">
                      {currentStep === 1 && 'من أنت؟'}
                      {currentStep === 2 && 'ماذا تدرس؟'}
                      {currentStep === 3 && 'ما مهاراتك؟'}
                      {currentStep === 4 && 'ما الذي تريد أن تقدمه؟'}
                      {currentStep === 5 && 'ما اللجنة التي تهمك؟'}
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div
                        key={s}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          s === currentStep
                            ? 'w-6 bg-cyan-400'
                            : s < currentStep
                            ? 'w-3 bg-cyan-500/50'
                            : 'w-2 bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Step 1: Personal & Academic Identity */}
                {currentStep === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1.5">الاسم الرباعي الكامل:</label>
                      <input
                        type="text"
                        placeholder="مثال: خالد بن سلطان المطيري"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-gray-300 mb-1.5">الرقم الجامعي (Student ID):</label>
                        <input
                          type="text"
                          placeholder="441029381"
                          value={formData.studentId}
                          onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-gray-300 mb-1.5">السنة الدراسية:</label>
                        <select
                          value={formData.academicYear}
                          onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm"
                        >
                          <option value="السنة الأولى">السنة الأولى (الإعدادي العام)</option>
                          <option value="السنة الثانية">السنة الثانية</option>
                          <option value="السنة الثالثة">السنة الثالثة</option>
                          <option value="السنة الرابعة">السنة الرابعة</option>
                          <option value="سنة التخرج">سنة التخرج (مشاريع التخرج)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono text-gray-300 mb-1.5">البريد الإلكتروني الجامعي:</label>
                        <input
                          type="email"
                          placeholder="khalid@student.edu.sa"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-mono text-gray-300 mb-1.5">رقم الهاتف الجوال:</label>
                        <input
                          type="tel"
                          placeholder="05XXXXXXXX"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: College & Major */}
                {currentStep === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-2">اختر كليتك الأكاديمية:</label>
                      <div className="space-y-2">
                        {[
                          'كلية هندسة برمجيات وذكاء اصطناعي',
                          'كلية تكنولوجيا المعلومات IT',
                          'كلية الهندسة التطبيقية و التخطيط العمراني',
                        ].map((c) => (
                          <div
                            key={c}
                            onClick={() => {
                              sound.playHover();
                              setFormData({ ...formData, college: c });
                            }}
                            className={`p-3.5 rounded-xl border text-sm cursor-pointer transition-all ${
                              formData.college === c
                                ? 'bg-cyan-950/40 border-cyan-400 text-white font-bold'
                                : 'bg-black/30 border-white/5 text-gray-300 hover:border-white/20'
                            }`}
                          >
                            {c}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-2">اختر تخصصك الهندسي الدقيق:</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          'هندسة برمجيات',
                          'هندسة ذكاء اصطناعي',
                          'تخصص نظم المعلومات',
                          'تخصص الوسائط المتعددة',
                          'تخصص هندسة معمارية',
                          'تخصص هندسة مدنية',
                        ].map((m) => (
                          <div
                            key={m}
                            onClick={() => {
                              sound.playHover();
                              setFormData({ ...formData, major: m });
                            }}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                              formData.major === m
                                ? 'bg-cyan-950/40 border-cyan-400 text-white font-bold'
                                : 'bg-black/30 border-white/5 text-gray-300 hover:border-white/20'
                            }`}
                          >
                            {m}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Skills */}
                {currentStep === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2.5">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold text-white block mb-0.5">المهارات والاهتمامات (اختيارية تماماً):</span>
                        لا يشترط وجود أي مهارات أو خبرة برمجية مسبقة! إذا كنت طالباً مستجداً أو ترغب في التعلم من الصفر، فالنادي تأسس خصيصاً لمساندتك وتطويرك خطوة بخطوة.
                      </div>
                    </div>

                    {/* Dedicated Beginner / Eager to learn toggle */}
                    <button
                      type="button"
                      onClick={() => {
                        sound.playHover();
                        const beginnerSkill = 'طالب جديد — شغوف بالتعلم من الصفر';
                        if (formData.skills.includes(beginnerSkill)) {
                          setFormData({ ...formData, skills: formData.skills.filter((s) => s !== beginnerSkill) });
                        } else {
                          setFormData({ ...formData, skills: [beginnerSkill] });
                        }
                      }}
                      className={`w-full p-3.5 rounded-xl border text-xs font-bold transition-all text-right flex items-center justify-between cursor-pointer ${
                        formData.skills.includes('طالب جديد — شغوف بالتعلم من الصفر')
                          ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                          : 'bg-black/40 border-white/10 text-gray-300 hover:border-emerald-500/40'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">🌱</span>
                        <span>أنا طالب مستجد / شغوف بالتعلم وتطوير مهاراتي من الصفر (لا أمتلك خبرة مسبقة)</span>
                      </span>
                      {formData.skills.includes('طالب جديد — شغوف بالتعلم من الصفر') && (
                        <Check className="w-4 h-4 text-emerald-400" />
                      )}
                    </button>

                    <div className="pt-2">
                      <p className="text-xs text-gray-400 mb-2">
                        أو حدد ما تتقنه أو تهتم به من المجالات التالية (إن وجد):
                      </p>
                      <div className="flex flex-wrap gap-2.5">
                        {availableSkills.map((skill) => {
                          const isSelected = formData.skills.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => toggleSkill(skill)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-cyan-400 text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                                  : 'bg-black/40 text-gray-300 border border-white/10 hover:border-white/30'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                              <span>{skill}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Passion & Vision */}
                {currentStep === 4 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1.5">
                        ما الذي تريد أن تبنيه وتطوره في النادي الهندسي؟
                      </label>
                      <textarea
                        rows={4}
                        placeholder="صف لنا شغفك، فكرة مشروع تود العمل عليها، أو الأثر الذي ترغب في تحقيقه..."
                        value={formData.personalStatement}
                        onChange={(e) => setFormData({ ...formData, personalStatement: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1.5">
                        رابط معرض أعمالك، GitHub، أو لينكدإن (اختياري):
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/your-username"
                        value={formData.portfolioUrl || ''}
                        onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Step 5: Target Committee & Commitment */}
                {currentStep === 5 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-2">
                        اختر نوع الانضمام / اللجنة التي تناسبك:
                      </label>
                      <div className="space-y-2.5">
                        {committees.map((comm) => {
                          const isSelected = formData.targetCommittee === comm.name;
                          return (
                            <div
                              key={comm.id}
                              onClick={() => {
                                sound.playHover();
                                setFormData({ ...formData, targetCommittee: comm.name });
                              }}
                              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                                  : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/20'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-bold text-white">{comm.name}</span>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border ${comm.badgeColor}`}>
                                  {comm.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 leading-relaxed">{comm.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1">
                        {formData.targetCommittee.includes('عضوية عامة')
                          ? `ساعات الحضور المقترحة أسبوعياً (${formData.weeklyCommitmentHours} ساعات - مرنة حسب رغبتك ومواعيد الفعاليات):`
                          : `الساعات المتاحة للمشاركة والعمل مع اللجنة أسبوعياً (${formData.weeklyCommitmentHours} ساعات):`}
                      </label>
                      <input
                        type="range"
                        min={2}
                        max={15}
                        value={formData.weeklyCommitmentHours}
                        onChange={(e) => setFormData({ ...formData, weeklyCommitmentHours: Number(e.target.value) })}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1">
                        <span>2 ساعات (مشاركة خفيفة)</span>
                        <span>8 ساعات (متوسط)</span>
                        <span>15 ساعة (قيادي/نشط)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Action Buttons */}
                <div className="flex items-center justify-between pt-6 mt-8 border-t border-white/10">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-bold text-gray-300 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>السابق</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-3 rounded-xl font-bold text-xs text-black bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.3)] flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <span>{currentStep === 5 ? 'إرسال طلب الانضمام' : 'التالي'}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Success Stage */
              <div className="text-center py-10">
                <div className="w-16 h-16 rounded-full bg-cyan-400/20 border border-cyan-400 text-cyan-400 flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-8 h-8" />
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
                  مرحبًا بك في النادي الهندسي!
                </h3>
                <p className="text-sm text-gray-300 max-w-md mx-auto mb-8 leading-relaxed">
                  تم استلام طلب انضمامك بنجاح. سيتم مراجعة الطلب من قِبل إدارة النادي واعتماد بطاقة عضويتك الإلكترونية فور القبول.
                </p>

                <button
                  onClick={() => {
                    sound.playClick();
                    setIsSubmitted(false);
                    setCurrentStep(1);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-mono text-gray-300 transition-colors"
                >
                  تقديم طلب جديد أو تعديل البيانات
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Live Holographic Engineering ID Card Generator */}
          <div className="lg:col-span-5 flex flex-col items-center">
            <div className="w-full text-center font-mono text-xs text-cyan-400 mb-3 tracking-wider">
              // LIVE DIGITAL ENG-BADGE PREVIEW
            </div>

            {/* Holographic ID Badge */}
            <div id="live-club-badge-preview" className="w-full max-w-sm rounded-3xl p-6 bg-gradient-to-b from-[#0f172a] to-[#07090e] border border-cyan-400/40 shadow-[0_0_35px_rgba(0,240,255,0.2)] relative overflow-hidden text-right font-mono">
              {/* Lanyard Clip Simulation Hole */}
              <div className="w-12 h-2.5 bg-black/80 rounded-full mx-auto mb-4 border border-white/20" />

              {/* Card Header */}
              <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-4 text-[11px]">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Cpu className="w-4 h-4" />
                  <span>UP ENGINEERING CLUB</span>
                </div>
                <span className="text-amber-400 text-[10px] bg-amber-950/70 px-2 py-0.5 rounded border border-amber-500/40">
                  قيد المراجعة // PENDING
                </span>
              </div>

              {/* Student Identity */}
              <div className="mb-4">
                <div className="text-[10px] text-gray-500 uppercase">اسم المهندس/ـة:</div>
                <div className="text-base font-extrabold text-white truncate">
                  {formData.fullName || 'المهندس الجديد'}
                </div>
                <div className="text-[11px] text-cyan-300 mt-0.5">
                  ID: {formData.studentId || '2026-ENG-XXXX'}
                </div>
              </div>

              {/* Academic Details */}
              <div className="grid grid-cols-2 gap-2 text-[10px] p-3 rounded-xl bg-black/40 border border-white/5 mb-4">
                <div>
                  <div className="text-gray-500">التخصص:</div>
                  <div className="font-bold text-gray-200 truncate">{formData.major}</div>
                </div>
                <div>
                  <div className="text-gray-500">السنة:</div>
                  <div className="font-bold text-gray-200">{formData.academicYear}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-gray-500">نوع العضوية / اللجنة:</div>
                  <div className="font-bold text-cyan-300 truncate">{formData.targetCommittee}</div>
                </div>
              </div>

              {/* Skills preview on badge */}
              <div className="mb-4">
                <div className="text-[10px] text-gray-500 mb-1">المهارات والاهتمامات:</div>
                <div className="flex flex-wrap gap-1">
                  {formData.skills.length === 0 ? (
                    <span className="text-[10px] text-gray-400 italic">شغف بالتعلم من الصفر</span>
                  ) : (
                    formData.skills.slice(0, 3).map((s, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-[9px] text-cyan-300 border border-cyan-500/30">
                        {s.split(' ')[0]}
                      </span>
                    ))
                  )}
                  {formData.skills.length > 3 && (
                    <span className="text-[9px] text-gray-500">+{formData.skills.length - 3}</span>
                  )}
                </div>
              </div>

              {/* Barcode & Security Chip */}
              <div className="pt-3 border-t border-dashed border-white/10 flex items-center justify-between">
                <div className="text-[9px] text-gray-500 text-left">
                  UNIVERSITY OF PALESTINE
                  <br />
                  DIGITAL PASS // 2026-2027
                </div>
                <QrCode className="w-10 h-10 text-cyan-400" />
              </div>
            </div>



            <p className="text-xs text-gray-400 mt-3 text-center max-w-xs leading-relaxed">
              معاينة فورية للبطاقة — يتم اعتماد وتوليد بطاقة العضوية الإلكترونية الرسمية بمجرد موافقة إدارة النادي على الطلب.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
