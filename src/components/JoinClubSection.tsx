import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { MemberCard } from './MemberCard';
import { memberCardFor } from '../utils/memberCard';
import type { ClubApplication } from '../types';
import { checkRateLimit } from '../utils/security';
import {
  normalizeCode,
  normalizePhone,
  validateEmail,
  validateFullName,
  validatePhone,
  suggestEmailFix,
  validateStudentId,
  validateUrl,
  universityEmailFor,
} from '../utils/validation';

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <p role="alert" className="text-sm text-red-300 mt-1.5 flex items-center gap-1.5">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </p>
  ) : null;

const inputClass = (hasError?: string) =>
  `w-full px-4 py-3 rounded-xl bg-black/40 border focus:outline-none text-white text-sm ${
    hasError ? 'border-red-400/70 focus:border-red-300' : 'border-white/10 focus:border-cyan-400'
  }`;

import { Sparkles, ArrowLeft, ArrowRight, Check, ShieldCheck, Lock, AlertCircle, Ban } from 'lucide-react';
import confetti from 'canvas-confetti';


export const JoinClubSection: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<'fullName' | 'studentId' | 'email' | 'phone' | 'portfolioUrl', string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const [recruitment, setRecruitment] = useState(() => dataService.getRecruitmentSettings());

  useEffect(() => {
    const unsub = dataService.subscribe(() => {
      setRecruitment(dataService.getRecruitmentSettings());
    });
    return unsub;
  }, []);

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

  const validateStep = (step: number): boolean => {
    const next: typeof errors = {};
    if (step === 1) {
      next.fullName = validateFullName(formData.fullName) || undefined;
      next.studentId = validateStudentId(formData.studentId) || undefined;
      next.email = validateEmail(formData.email) || undefined;
      next.phone = validatePhone(formData.phone) || undefined;
    }
    if (step === 4) {
      next.portfolioUrl = validateUrl(formData.portfolioUrl || '') || undefined;
    }
    const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v)) as typeof errors;
    setErrors(clean);
    return Object.keys(clean).length === 0;
  };

  const updateField = <K extends keyof ClubApplication>(key: K, value: ClubApplication[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (formError) setFormError(null);
  };

  const handleNext = () => {
    setFormError(null);
    if (!validateStep(currentStep)) return;
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Validate committee recruitment status before submitting
      const selectedCommObj = committees.find((c) => c.name === formData.targetCommittee);
      const selectedCommId = selectedCommObj?.id || 'general';
      const isCommClosed = !recruitment.isGlobalRecruitmentOpen || recruitment.committees[selectedCommId]?.isOpen === false;

      if (isCommClosed) {
        const notice = !recruitment.isGlobalRecruitmentOpen
          ? (recruitment.globalClosedMessage || 'باب استقطاب اللجان متوقف مؤقتاً')
          : (recruitment.committees[selectedCommId]?.closedNotice || 'اكتملت المقاعد المتاحة لهذه اللجنة');
        setFormError(`التقديم مغلق حالياً: ${notice}`);
        return;
      }

      void handleSubmit();
    }
  };

  const handlePrev = () => {
    setFormError(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleSkill = (skill: string) => {
    let updated = formData.skills.filter((s) => s !== 'طالب جديد — شغوف بالتعلم من الصفر');
    if (updated.includes(skill)) {
      updated = updated.filter((s) => s !== skill);
    } else {
      updated.push(skill);
    }
    setFormData({ ...formData, skills: updated });
  };

  const handleSubmit = async () => {
    if (isSending) return;
    const rateCheck = checkRateLimit('join_submission', 4000);
    if (!rateCheck.allowed) {
      setFormError(`انتظر ${rateCheck.waitSeconds} ثوانٍ ثم حاول مرة أخرى.`);
      return;
    }

    setIsSending(true);
    try {
      await dataService.submitApplication(formData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطأ غير معروف';
      // Problems with personal details are fixed on step 1
      if (/الاسم|الرقم الجامعي|البريد|الجوال/.test(message)) setCurrentStep(1);
      setFormError(message.includes('Failed to fetch') ? 'تعذر الاتصال. تأكد من الإنترنت وحاول مرة أخرى.' : message);
      return;
    } finally {
      setIsSending(false);
    }

    setIsSubmitted(true);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#00F0FF', '#3877FF', '#10B981', '#F59E0B'],
    });
  };


  return (
    <section id="join" className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#08041D]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-4">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>مكانك معنا في النادي الهندسي</span>
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
                      الخطوة {currentStep} من 5
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
                      <label htmlFor="join-name" className="block text-sm text-gray-300 mb-1.5">الاسم الرباعي الكامل</label>
                      <input
                        id="join-name"
                        type="text"
                        autoComplete="name"
                        placeholder="مثال: أحمد محمد خليل العمري"
                        value={formData.fullName}
                        aria-invalid={Boolean(errors.fullName)}
                        onChange={(e) => updateField('fullName', e.target.value)}
                        className={inputClass(errors.fullName)}
                      />
                      <FieldError message={errors.fullName} />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label htmlFor="join-student-id" className="block text-sm text-gray-300">الرقم الجامعي</label>
                          <span className="text-xs font-mono text-gray-400" dir="ltr">
                            {formData.studentId.replace(/\D/g, '').length}/9
                          </span>
                        </div>
                        <input
                          id="join-student-id"
                          type="text"
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="مثال: 120220145"
                          value={formData.studentId}
                          aria-invalid={Boolean(errors.studentId)}
                          onChange={(e) => updateField('studentId', normalizeCode(e.target.value))}
                          className={inputClass(errors.studentId)}
                        />
                        <FieldError message={errors.studentId} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-300 mb-1.5">السنة الدراسية:</label>
<select
                          value={formData.academicYear}
                          onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 focus:border-cyan-400 focus:outline-none text-white text-sm"
                        >
                          <option value="السنة الأولى">السنة الأولى (الإعدادي العام)</option>
                          <option value="السنة الثانية">السنة الثانية</option>
                          <option value="السنة الثالثة">السنة الثالثة</option>
                          <option value="السنة الرابعة">السنة الرابعة</option>
                          <option value="السنة الخامسة">السنة الخامسة (سنة التخرج الهندسية)</option>
                          <option value="خريج من الجامعة">خريج / خريجة من جامعة فلسطين 🎓</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label htmlFor="join-email" className="block text-sm text-gray-300">البريد الإلكتروني</label>
                          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                            يفضل الجامعي (@std.up.edu.ps)
                          </span>
                        </div>
                        <input
                          id="join-email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          placeholder="120220000@std.up.edu.ps"
                          value={formData.email}
                          aria-invalid={Boolean(errors.email)}
                          onChange={(e) => updateField('email', e.target.value.trim())}
                          className={`${inputClass(errors.email)} text-left`}
                          dir="ltr"
                        />
                        <FieldError message={errors.email} />
                        {!formData.email.trim() && universityEmailFor(formData.studentId) && (
                          <button
                            type="button"
                            onClick={() => updateField('email', universityEmailFor(formData.studentId) as string)}
                            className="mt-1.5 text-sm text-emerald-300 hover:text-white underline underline-offset-4 cursor-pointer text-right"
                          >
                            استخدم بريدك الجامعي: <span dir="ltr">{universityEmailFor(formData.studentId)}</span>
                          </button>
                        )}
                        {suggestEmailFix(formData.email) && (
                          <button
                            type="button"
                            onClick={() => updateField('email', suggestEmailFix(formData.email)!)}
                            className="mt-1.5 text-sm text-amber-300 hover:text-amber-200 underline underline-offset-4 cursor-pointer text-right"
                          >
                            هل تقصد <span dir="ltr">{suggestEmailFix(formData.email)}</span>؟
                          </button>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          يمكنك استخدام إيميل الجامعة الرسمي (@std.up.edu.ps) أو بريدك الشخصي (Gmail وغيره).
                        </p>
                      </div>
                      <div>
                        <label htmlFor="join-phone" className="block text-sm text-gray-300 mb-1.5">رقم الجوال (واتساب)</label>
                        <input
                          id="join-phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="0599123456"
                          value={formData.phone}
                          aria-invalid={Boolean(errors.phone)}
                          onChange={(e) => updateField('phone', normalizePhone(e.target.value))}
                          className={`${inputClass(errors.phone)} text-left`}
                          dir="ltr"
                        />
                        <FieldError message={errors.phone} />
                        <p className="text-xs text-gray-400 mt-1">
                          سيتم إرسال بطاقة العضوية وإشعار القبول عبر هذا الرقم مباشرة.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: College & Major */}
                {currentStep === 2 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div>
                      <label className="block text-xs text-gray-300 mb-2">اختر كليتك الأكاديمية:</label>
                      <div className="space-y-2">
                        {[
                          'كلية هندسة برمجيات وذكاء اصطناعي',
                          'كلية تكنولوجيا المعلومات IT',
                          'كلية الهندسة التطبيقية و التخطيط العمراني',
                        ].map((c) => (
                          <div
                            key={c}
                            onClick={() => {
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
                      <label className="block text-xs text-gray-300 mb-2">اختر تخصصك الهندسي الدقيق:</label>
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
                      <label className="block text-xs text-gray-300 mb-1.5">
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
                      <label className="block text-xs text-gray-300 mb-1.5">
                        رابط معرض أعمالك، GitHub، أو لينكدإن (اختياري):
                      </label>
                      <input
                        type="url"
                        inputMode="url"
                        placeholder="https://github.com/your-username"
                        value={formData.portfolioUrl || ''}
                        aria-invalid={Boolean(errors.portfolioUrl)}
                        onChange={(e) => updateField('portfolioUrl', e.target.value.trim())}
                        className={`${inputClass(errors.portfolioUrl)} text-left`}
                        dir="ltr"
                      />
                      <FieldError message={errors.portfolioUrl} />
                    </div>
                  </div>
                )}

                {/* Step 5: Target Committee & Commitment */}
                {currentStep === 5 && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    {/* Global Recruitment Warning if paused */}
                    {!recruitment.isGlobalRecruitmentOpen && (
                      <div className="p-4 rounded-2xl bg-amber-950/70 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-3 shadow-lg">
                        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-sm text-white mb-0.5">باب استقطاب اللجان متوقف مؤقتاً</div>
                          <div className="text-amber-200/90 text-xs leading-relaxed">
                            {recruitment.globalClosedMessage || 'تقوم إدارة النادي حالياً بفرز وتوزيع المتقدمين، التقديم للجان متوقف مؤقتاً.'}
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs text-gray-300">
                          اختر نوع الانضمام / اللجنة التي تناسبك:
                        </label>
                        <span className="text-xs font-mono text-gray-400">
                          (يتم تحديث شواغر اللجان بشكل فوري)
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {committees.map((comm) => {
                          const isSelected = formData.targetCommittee === comm.name;
                          const commStatus = recruitment.committees[comm.id];
                          const isClosed = !recruitment.isGlobalRecruitmentOpen || (commStatus && commStatus.isOpen === false);
                          const closedNotice = !recruitment.isGlobalRecruitmentOpen
                            ? (recruitment.globalClosedMessage || 'الاستقطاب متوقف حالياً')
                            : (commStatus?.closedNotice || 'اكتملت المقاعد المتاحة لهذه اللجنة');

                          return (
                            <div
                              key={comm.id}
                              onClick={() => {
                                if (isClosed) {
                                  setFormError(`التقديم لهذه اللجنة مغلق حالياً: ${closedNotice}. اختر لجنة أخرى أو العضوية العامة.`);
                                  return;
                                }
                                updateField('targetCommittee', comm.name);
                              }}
                              className={`p-4 rounded-2xl border transition-all relative ${
                                isClosed
                                  ? 'bg-black/20 border-white/5 opacity-60 cursor-not-allowed'
                                  : isSelected
                                    ? 'bg-cyan-950/40 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.15)] cursor-pointer'
                                    : 'bg-black/30 border-white/5 text-gray-400 hover:border-white/20 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className={`text-xs font-bold ${isClosed ? 'text-gray-400 line-through' : 'text-white'}`}>
                                  {comm.name}
                                </span>

                                {isClosed ? (
                                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-md border text-amber-400 bg-amber-950/80 border-amber-500/40 flex items-center gap-1 shadow">
                                    <Lock className="w-3 h-3" />
                                    <span>مكتمل الاستقطاب</span>
                                  </span>
                                ) : (
                                  <span className={`text-xs font-mono px-2 py-0.5 rounded-md border ${comm.badgeColor}`}>
                                    {comm.badge}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-gray-400 leading-relaxed">{comm.desc}</p>

                              {isClosed && (
                                <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-xs text-amber-400 font-mono">
                                  <Ban className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span>{closedNotice}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-300 mb-1">
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
                      <div className="flex justify-between text-xs font-mono text-gray-500 mt-1">
                        <span>2 ساعات (مشاركة خفيفة)</span>
                        <span>8 ساعات (متوسط)</span>
                        <span>15 ساعة (قيادي/نشط)</span>
                      </div>
                    </div>
                  </div>
                )}

                {formError && (
                  <div role="alert" className="mt-6 p-4 rounded-2xl bg-red-950/50 border border-red-500/40 text-red-200 text-sm flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{formError}</span>
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
                    disabled={isSending}
                    className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#7F1AB2] to-[#6F3993] hover:from-[#A26CC6] hover:to-[#7F1AB2] shadow-[0_8px_24px_rgba(127,26,178,0.35)] disabled:opacity-60 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <span>{currentStep === 5 ? (isSending ? 'جاري الإرسال...' : 'إرسال طلب الانضمام') : 'التالي'}</span>
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
            <div className="w-full text-center text-sm text-gray-300 mb-3">
              معاينة بطاقة عضويتك
            </div>

            <div className="w-full opacity-95">
              <MemberCard
                {...memberCardFor({
                  id: 'preview-00000000',
                  fullName: formData.fullName || 'اسمك هنا',
                  studentId: formData.studentId || '—',
                  major: formData.major,
                  targetCommittee: formData.targetCommittee,
                })}
                badge="قيد المراجعة"
                code="UP-ENG-XXXXXXXX"
              />
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
