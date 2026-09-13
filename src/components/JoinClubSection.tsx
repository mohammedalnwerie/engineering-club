import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import type { ClubApplication } from '../types';
import { sound } from '../utils/soundEngine';

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
    college: 'كلية الهندسة والتكنولوجيا الصناعية والبرمجيات',
    major: 'هندسة البرمجيات',
    skills: ['Python', 'CAD / 3D Modeling'],
    personalStatement: '',
    targetCommittee: 'لجنة التطوير البرمجي والمشاريع',
    weeklyCommitmentHours: 6,
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
    { id: 'dev', name: 'لجنة التطوير البرمجي والمشاريع', desc: 'بناء البرمجيات والأنظمة والمنصات التقنية للنادي والجامعة.' },
    { id: 'academic', name: 'لجنة الشؤون الأكاديمية والتدريب', desc: 'تنظيم الورش والمعسكرات واستقطاب المدربين والخبراء.' },
    { id: 'media', name: 'لجنة الهوية والإعلام الرقمي', desc: 'صناعة المحتوى، التصميم، التغطيات، وتوثيق الفعاليات.' },
    { id: 'logistics', name: 'لجنة المعامل والدعم اللوجستي', desc: 'إدارة المعامل ومعدات الطباعة ثلاثية الأبعاد والتنظيم الميداني.' },
    { id: 'pr', name: 'لجنة العلاقات العامة والشراكات الصناعية', desc: 'بناء الشراكات مع الشركات ورعاية الهاكاثونات والزيارات.' },
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
    if (formData.skills.includes(skill)) {
      setFormData({ ...formData, skills: formData.skills.filter((s) => s !== skill) });
    } else {
      setFormData({ ...formData, skills: [...formData.skills, skill] });
    }
  };

  const handleSubmit = () => {
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
                          'كلية الهندسة والتكنولوجيا الصناعية والبرمجيات',
                          'كلية تكنولوجيا المعلومات',
                          'كلية الهندسة المعمارية والمدنية',
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
                          'هندسة البرمجيات',
                          'الهندسة الصناعية والأنظمة الذكية',
                          'علوم الحاسب والذكاء الاصطناعي',
                          'الأمن السيبراني والشبكات المتقدمة',
                          'الهندسة المعمارية والتصميم المستدام',
                          'الهندسة المدنية والإنشاءات الذكية',
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
                    <p className="text-xs text-gray-400">
                      حدد المهارات والتقنيات التي تمتلك خبرة سابقة أو شغفاً بتعلمها وتطبيقها:
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
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-2">اختر اللجنة التي ترغب في الانضمام لها:</label>
                      <div className="space-y-2.5">
                        {committees.map((comm) => (
                          <div
                            key={comm.id}
                            onClick={() => {
                              sound.playHover();
                              setFormData({ ...formData, targetCommittee: comm.name });
                            }}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                              formData.targetCommittee === comm.name
                                ? 'bg-cyan-950/40 border-cyan-400 text-white'
                                : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/20'
                            }`}
                          >
                            <div className="text-xs font-bold text-white mb-0.5">{comm.name}</div>
                            <div className="text-[11px] text-gray-400">{comm.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-gray-300 mb-1">
                        الساعات المتاحة للمشاركة أسبوعياً ({formData.weeklyCommitmentHours} ساعات):
                      </label>
                      <input
                        type="range"
                        min={3}
                        max={15}
                        value={formData.weeklyCommitmentHours}
                        onChange={(e) => setFormData({ ...formData, weeklyCommitmentHours: Number(e.target.value) })}
                        className="w-full accent-cyan-400"
                      />
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
                  تم استلام ملف انضمامك بنجاح، وتوليد بطاقة عضويتك الرقمية. سيصلك تأكيد تفعيل الحساب عبر بريدك الجامعي خلال 24 ساعة.
                </p>

                <button
                  onClick={() => {
                    sound.playClick();
                    setIsSubmitted(false);
                    setCurrentStep(1);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-mono text-gray-300 transition-colors"
                >
                  تعديل البيانات أو تقديم طلب جديد
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
            <div className="w-full max-w-sm rounded-3xl p-6 bg-gradient-to-b from-[#0f172a] to-[#07090e] border border-cyan-400/40 shadow-[0_0_35px_rgba(0,240,255,0.2)] relative overflow-hidden text-right font-mono">
              {/* Lanyard Clip Simulation Hole */}
              <div className="w-12 h-2.5 bg-black/80 rounded-full mx-auto mb-4 border border-white/20" />

              {/* Card Header */}
              <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-4 text-[11px]">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Cpu className="w-4 h-4" />
                  <span>ENG-CLUB SAUDI</span>
                </div>
                <span className="text-emerald-400">STATUS: ACTIVE</span>
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
                  <div className="text-gray-500">اللجنة المستهدفة:</div>
                  <div className="font-bold text-cyan-300 truncate">{formData.targetCommittee}</div>
                </div>
              </div>

              {/* Skills preview on badge */}
              <div className="mb-4">
                <div className="text-[10px] text-gray-500 mb-1">المهارات المعتمدة:</div>
                <div className="flex flex-wrap gap-1">
                  {formData.skills.slice(0, 3).map((s, i) => (
                    <span key={i} className="px-1.5 py-0.5 rounded bg-cyan-950/60 text-[9px] text-cyan-300 border border-cyan-500/30">
                      {s.split(' ')[0]}
                    </span>
                  ))}
                  {formData.skills.length > 3 && (
                    <span className="text-[9px] text-gray-500">+{formData.skills.length - 3}</span>
                  )}
                </div>
              </div>

              {/* Barcode & Security Chip */}
              <div className="pt-3 border-t border-dashed border-white/10 flex items-center justify-between">
                <div className="text-[9px] text-gray-500 text-left">
                  AUTH VERIFIED // 2026-2027
                  <br />
                  ENCRYPTED NFC CHIP
                </div>
                <QrCode className="w-10 h-10 text-cyan-400" />
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-4 text-center max-w-xs">
              تتحدث بيانات بطاقتك الذكية لحظياً وتُرسل لك بصيغة Apple Wallet / Digital Badge فور القبول.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
