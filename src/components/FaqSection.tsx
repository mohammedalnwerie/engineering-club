import React, { useState } from 'react';
import { ChevronDown, HelpCircle, MessageSquare, ArrowLeft } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface FaqSectionProps {
  onOpenComplaints?: () => void;
  onOpenJoin?: () => void;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ onOpenComplaints, onOpenJoin }) => {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const faqs: FaqItem[] = [
    {
      id: 'faq-1',
      category: 'العضوية والتسجيل',
      question: 'هل الانضمام للنادي الهندسي مجاني؟ وما هي شروط العضوية؟',
      answer: 'نعم، النادي الهندسي هو إطار طلابي تطوعي وغير ربحي بالكامل. الانضمام والمشاركة في الفعاليات والبرامج وورش العمل مجاني تماماً وبدون أي رسوم لكافة طلبة الكليات الهندسية والتقنية وتكنولوجيا المعلومات في جامعة فلسطين.'
    },
    {
      id: 'faq-2',
      category: 'التخصصات والكليات',
      question: 'أنا طالب في كلية الهندسة التطبيقية (عمارة / مدني / ديكور)، كيف يفيدني النادي؟',
      answer: 'النادي ليس مخصصاً لطلبة البرمجيات فقط، بل هو مظلة طلابية جامعة لكل التخصصات الهندسية. نعمل على تنظيم ورش عمل في برامج النمذجة والتصميم الهندسي (BIM, Revit, AutoCAD)، وإطلاق مسابقات في التصميم المعماري والإنشائي، بالإضافة لتشكيل فرق عمل متكاملة تجمع المعماري والمدني والبرمجي في مشاريع تحاكي بيئة العمل الحقيقية.'
    },
    {
      id: 'faq-3',
      category: 'الخريجون',
      question: 'هل يمكن لخريجي جامعة فلسطين الانضمام والاستفادة من النادي؟',
      answer: 'نعم بكل تأكيد! يرحب النادي بكافة مهندسي ومهندسات جامعة فلسطين الخريجين للانضمام كأعضاء أو مدربين وموجهين للطلبة، والاستفادة من برامج التشبيك المهني والشراكات مع الشركات والمؤسسات وسوق العمل.'
    },
    {
      id: 'faq-4',
      category: 'العضوية واللجان',
      question: 'ما الفرق بين «العضوية العامة» وعضوية «اللجان التنفيذية»؟',
      answer: 'العضوية العامة تمنحك بطاقة العضوية الرسمية وحق حضور كافة ورش العمل والمسابقات والاستفادة من أنشطة النادي بحرية تامة دون أي التزام إداري. أما عضوية اللجان التنفيذية (الأنشطة، العلاقات والتدريب، الإعلام) فهي مخصصة للطلبة الراغبين في المشاركة في إدارة وتنظيم أنشطة النادي وتطوير مهاراتهم القيادية.'
    },
    {
      id: 'faq-5',
      category: 'البطاقات الرقمية',
      question: 'كيف أحصل على بطاقة عضويتي الرقمية المعتمدة وكيف أتحقق من صحتها؟',
      answer: 'بمجرد مراجعة طلب انضمامك من قِبل إدارة النادي، يتم إصدار بطاقتك الرقمية المعتمدة تلقائياً. ستصلك رسالة عبر البريد الإلكتروني والواتساب تحتوي على رابط مباشر لبطاقتك، ويمكنك دائماً استخدام خانة "التحقق من العضوية" في أعلى الموقع للاستعلام عن بطاقتك وتنزيلها كصورة أو PDF.'
    },
    {
      id: 'faq-6',
      category: 'المشاريع والمقترحات',
      question: 'لدي فكرة مشروع ريادي أو مقترح ورشة تدريبية، كيف يمكنني تقديمها للنادي؟',
      answer: 'يسعدنا جداً استقبال أفكاركم ومشاريعكم! يمكنك تقديم مقترحك في أي وقت عبر "صندوق الشكاوى والمقترحات" في الموقع، أو التواصل المباشر مع ممثل كليتك في النادي، وستعمل اللجان المختصة على دراسة الفكرة ودعم تنفيذها.'
    }
  ];

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 relative z-10 bg-[#08041D]/90 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#381C4A]/60 border border-[#3FE7E3]/30 text-[#3FE7E3] text-xs font-mono mb-4 shadow-[0_0_20px_rgba(63,231,227,0.12)]">
            <HelpCircle className="w-4 h-4" />
            <span>الأسئلة الشائعة والإرشاد الطلابي</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            كل ما تود معرفته عن النادي
          </h2>

          <p className="text-base sm:text-lg text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
            إجابات واضحة ومباشرة عن أهم الاستفسارات التي تخص العضوية، الكليات المشمولة، والأنشطة والبطاقات الرقمية.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4 mb-14">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? 'bg-white/[0.04] border-[#7F1AB2]/40 shadow-[0_4px_20px_rgba(127,26,178,0.15)]'
                    : 'bg-black/30 border-white/10 hover:border-white/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-5 sm:p-6 text-right flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-white/5 text-[#3FE7E3] border border-white/5 shrink-0 hidden sm:inline-block">
                      {faq.category}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white text-right">
                      {faq.question}
                    </h3>
                  </div>

                  <div
                    className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center text-gray-300 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-[#3FE7E3] bg-[#3FE7E3]/10' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-sm sm:text-base text-gray-300 leading-relaxed font-light border-t border-white/5 animate-in fade-in duration-200">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Callout Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#381C4A]/70 via-[#7F1AB2]/20 to-[#381C4A]/70 border border-[#7F1AB2]/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-right">
            <div className="w-12 h-12 rounded-2xl bg-[#7F1AB2]/20 border border-[#7F1AB2]/30 flex items-center justify-center text-[#3FE7E3] shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-white mb-1">
                هل لديك استفسار آخر أو سؤال لم تجد إجابته؟
              </h4>
              <p className="text-xs sm:text-sm text-gray-300 font-light">
                فريق النادي مستعد دائماً للتواصل وتقديم المساعدة والإرشاد لجميع الطلبة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onOpenComplaints}
              className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs sm:text-sm font-medium text-gray-200 transition-colors cursor-pointer"
            >
              أرسل استفسارك
            </button>

            <button
              type="button"
              onClick={onOpenJoin}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(22,163,74,0.3)] transition-all cursor-pointer flex items-center gap-2"
            >
              <span>انضم الآن</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
