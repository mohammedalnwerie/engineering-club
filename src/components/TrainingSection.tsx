import React, { useState } from 'react';
import { TRAINING_COURSES } from '../data/clubData';
import type { TrainingCourse } from '../types';
import { sound } from '../utils/soundEngine';
import { GraduationCap, ChevronDown, ChevronUp, Check } from 'lucide-react';
import confetti from 'canvas-confetti';


export const TrainingSection: React.FC = () => {
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<Record<string, boolean>>({});

  const toggleSyllabus = (courseId: string) => {
    sound.playClick();
    setExpandedCourseId(expandedCourseId === courseId ? null : courseId);
  };

  const handleEnroll = (course: TrainingCourse) => {
    sound.playSuccess();
    setEnrolledCourses((prev) => ({ ...prev, [course.id]: true }));
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#00F0FF', '#3877FF', '#10B981'],
    });
  };

  return (
    <section id="training" className="py-28 px-4 sm:px-6 lg:px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/40 border border-blue-500/30 text-blue-400 text-xs font-mono mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>ACADEMY & BOOTCAMPS // SKILL MASTERY</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              أكاديمية التدريب والمعسكرات المتقدمة
            </h2>
          </div>
          <p className="max-w-md text-sm sm:text-base text-gray-400 font-light">
            مناهج عملية مكثفة يشرف عليها مهندسون وخبراء صناعة، تسد الفجوة بين المقررات النظرية ومتطلبات المشاريع الحقيقية.
          </p>
        </div>

        {/* Courses Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {TRAINING_COURSES.map((course) => {
            const isEnrolled = enrolledCourses[course.id];
            const isExpanded = expandedCourseId === course.id;
            const occupancyRate = Math.round(
              ((course.totalSeats - course.availableSeats) / course.totalSeats) * 100
            );

            return (
              <div
                key={course.id}
                className="rounded-3xl glass-panel border border-white/10 hover:border-cyan-400/40 p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 relative group overflow-hidden"
              >
                <div>
                  {/* Category & Level Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-white/[0.04] border border-white/10 text-cyan-300">
                      {course.category}
                    </span>

                    <span
                      className={`font-mono text-xs px-2.5 py-0.5 rounded-full border ${
                        course.level === 'متقدم'
                          ? 'border-amber-500/40 text-amber-400 bg-amber-950/20'
                          : 'border-blue-500/40 text-blue-400 bg-blue-950/20'
                      }`}
                    >
                      المستوى: {course.level}
                    </span>
                  </div>

                  {/* Course Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-4 group-hover:text-cyan-300 transition-colors leading-snug">
                    {course.title}
                  </h3>

                  {/* Instructor Bio */}
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-black/30 border border-white/5 mb-6">
                    <img
                      src={course.instructor.avatar}
                      alt={course.instructor.name}
                      className="w-11 h-11 rounded-xl object-cover border border-cyan-400/30"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{course.instructor.name}</div>
                      <div className="text-[11px] text-gray-400 line-clamp-1">{course.instructor.title}</div>
                    </div>
                  </div>

                  {/* Meta: Duration, Hours, Start Date */}
                  <div className="grid grid-cols-3 gap-2 mb-6 text-center">
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="font-mono text-xs font-bold text-cyan-400">{course.duration}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">المدة الزمنية</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="font-mono text-xs font-bold text-blue-400">{course.totalHours} ساعة</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">تدريب عملي</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
                      <div className="font-mono text-xs font-bold text-emerald-400">{course.availableSeats}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">مقاعد شاغرة</div>
                    </div>
                  </div>

                  {/* Skills Learned */}
                  <div className="mb-6">
                    <div className="text-xs font-mono uppercase text-gray-400 mb-2">
                      // المهارات المكتسبة:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {course.skillsGained.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 rounded bg-cyan-950/30 border border-cyan-500/20 text-[11px] font-mono text-cyan-300"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Syllabus Accordion Trigger */}
                  <button
                    onClick={() => toggleSyllabus(course.id)}
                    className="w-full py-2 px-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 text-xs text-gray-300 flex items-center justify-between transition-colors cursor-pointer mb-6"
                  >
                    <span className="font-mono">مفردات المنهج الأسبوعي ({course.syllabusWeeks.length} أسابيع)</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-cyan-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </button>

                  {/* Syllabus Detail View */}
                  {isExpanded && (
                    <div className="space-y-2 mb-6 p-3 rounded-xl bg-black/40 border border-white/10 text-xs animate-in fade-in duration-200">
                      {course.syllabusWeeks.map((week) => (
                        <div key={week.week} className="pb-2 border-b border-white/5 last:border-none last:pb-0">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span className="text-cyan-400 font-mono">W0{week.week}:</span>
                            <span>{week.title}</span>
                          </div>
                          <div className="text-[11px] text-gray-400 mt-0.5 pr-6">
                            {week.topics.join(' • ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Enrollment Action Button */}
                <div className="pt-4 border-t border-white/5">
                  <div className="flex justify-between text-[11px] font-mono text-gray-400 mb-2">
                    <span>انطلاق المعسكر: {course.startDate}</span>
                    <span>نسبة الإشغال {occupancyRate}%</span>
                  </div>

                  {isEnrolled ? (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl font-bold text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-center gap-2 cursor-default"
                    >
                      <Check className="w-4 h-4" />
                      <span>تم تأكيد تسجيلك في هذا المعسكر</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course)}
                      onMouseEnter={() => sound.playHover()}
                      className="w-full py-3 rounded-xl font-bold text-xs text-black bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>حجز مقعد في المعسكر الآن</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
