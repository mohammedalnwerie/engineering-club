import type { College, Major, ProjectCaseStudy, EventItem, TrainingCourse, LeaderMember } from '../types';

export const COLLEGES: College[] = [
  {
    id: 'software-ai',
    code: 'ENG-AI',
    name: 'كلية هندسة برمجيات وذكاء اصطناعي',
    shortName: 'البرمجيات والذكاء الاصطناعي',
    tagline: 'تطوير البرمجيات المتقدمة وخوارزميات الذكاء الاصطناعي والحلول الرقمية',
    description: 'تمكين مهندسي المستقبل في بناء النظم البرمجية الحديثة، تطبيقات الويب والهواتف، وتطوير نماذج الذكاء الاصطناعي التوليدي، وتطبيقات الحوسبة الذكية.',
    accentColor: '#00F0FF',
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    coordinator: {
      name: 'ممثلو الكلية في النادي',
      role: 'لجنة التنسيق والمتابعة الطلابية',
      title: 'كلية هندسة برمجيات وذكاء اصطناعي — جامعة فلسطين',
      avatar: '',
      email: '',
    },
    majors: ['هندسة برمجيات', 'هندسة ذكاء اصطناعي'],
    labsCount: 4,
    studentsCount: 0,
    projectsCount: 0,
    featuredLabs: ['مختبر تطوير النظم والبرمجيات', 'مختبر الذكاء الاصطناعي وتعلم الآلة', 'معمل الحوسبة السحابية ومشاريع التخرج'],
    flagshipAchievement: 'إطلاق مسار التطوير البرمجي ونماذج الذكاء الاصطناعي لخدمة مجتمع الجامعة'
  },
  {
    id: 'it-computing',
    code: 'IT',
    name: 'كلية تكنولوجيا المعلومات IT',
    shortName: 'تكنولوجيا المعلومات IT',
    tagline: 'إدارة نظم المعلومات الرقمية وتصميم التجارب التفاعلية والوسائط المتعددة',
    description: 'تأهيل الكوادر التقنية في تحليل النظم المؤسسية، إدارة قواعد البيانات، وتطوير الإنتاج الرقمي التفاعلي ثلاثي الأبعاد وتصميم تجربة المستخدم UI/UX.',
    accentColor: '#3877FF',
    gradient: 'from-blue-600/20 via-indigo-500/10 to-transparent',
    coordinator: {
      name: 'ممثلو الكلية في النادي',
      role: 'لجنة التنسيق والمتابعة الطلابية',
      title: 'كلية تكنولوجيا المعلومات — جامعة فلسطين',
      avatar: '',
      email: '',
    },
    majors: ['تخصص نظم المعلومات', 'تخصص الوسائط المتعددة'],
    labsCount: 3,
    studentsCount: 0,
    projectsCount: 0,
    featuredLabs: ['استوديو إنتاج الوسائط المتعددة والتصميم الرقمي', 'مختبر نظم وقواعد البيانات والشبكات', 'معمل التصميم التفاعلي وتجربة المستخدم UI/UX'],
    flagshipAchievement: 'تأسيس فرق العمل لتطوير الأنظمة الرقمية والوسائط التفاعلية وإثراء المحتوى الجامعي'
  },
  {
    id: 'applied-urban',
    code: 'ENG-URB',
    name: 'كلية الهندسة التطبيقية و التخطيط العمراني',
    shortName: 'الهندسة التطبيقية والتخطيط العمراني',
    tagline: 'العمارة المبتكرة، الإنشاءات المستدامة، والتخطيط العمراني الذكي',
    description: 'دمج الإبداع المعماري بالهندسة الإنشائية والتخطيط الحضري لتطوير بيئات عمرانية متكاملة ومستدامة تسهم في خدمة المجتمع وإعادة البناء الذكي.',
    accentColor: '#10B981',
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    coordinator: {
      name: 'ممثلو الكلية في النادي',
      role: 'لجنة التنسيق والمتابعة الطلابية',
      title: 'كلية الهندسة التطبيقية والتخطيط العمراني — جامعة فلسطين',
      avatar: '',
      email: '',
    },
    majors: ['تخصص هندسة معمارية', 'تخصص هندسة مدنية'],
    labsCount: 4,
    studentsCount: 0,
    projectsCount: 0,
    featuredLabs: ['استوديو التصميم والنمذجة المعمارية', 'مختبر المواد وميكانيكا الإنشاءات', 'مركز نظم المعلومات الجغرافية GIS والتخطيط الحضري'],
    flagshipAchievement: 'تطوير أفكار ومبادرات إعادة التخطيط العمراني والحلول الإنشائية المستدامة'
  }
];

export const MAJORS: Major[] = [
  {
    id: 'software-eng',
    code: 'SWE',
    name: 'هندسة برمجيات',
    collegeId: 'software-ai',
    collegeName: 'كلية هندسة برمجيات وذكاء اصطناعي',
    tagline: 'تصميم وبناء مواقع الويب، تطبيقات الهواتف، والأنظمة البرمجية الحديثة',
    description: 'يهتم هذا التخصص بتعلم لغات البرمجة الحديثة، وتطوير مواقع الويب وتطبيقات الهاتف الذكية، وبناء قواعد البيانات، وإدارة المشاريع البرمجية من الفكرة حتى إطلاق المشروع لسوق العمل.',
    iconName: 'Terminal',
    accentColor: '#00F0FF',
    techStack: ['React / Next.js', 'Flutter & Mobile', 'Python', 'Node.js', 'SQL & Databases', 'Git & GitHub'],
    careerPaths: ['مطور مواقع وإنترنت (Web Developer)', 'مبرمج تطبيقات هواتف (Mobile App Developer)', 'مهندس اختبار وجودة برمجيات (QA)'],
    keyCourses: ['برمجة وتطوير مواقع الويب (Full-Stack)', 'تطوير تطبيقات الهواتف الذكية', 'هندسة وإدارة المشاريع البرمجية'],
    featuredProjectTitle: 'منصة الخدمات الطلابية وبوابة النادي الرقمية'
  },
  {
    id: 'ai-eng',
    code: 'AIE',
    name: 'هندسة ذكاء اصطناعي',
    collegeId: 'software-ai',
    collegeName: 'كلية هندسة برمجيات وذكاء اصطناعي',
    tagline: 'تطوير الأنظمة الذكية، تعلم الآلة، وتحليل واستثمار البيانات',
    description: 'يركز التخصص على تدريب الحواسيب على حل المشكلات والتعلم الذاتي، وبناء تطبيقات التعرف على الصور والأصوات، وتطوير روبوتات المحادثة، وتوظيف أدوات الذكاء الاصطناعي لابتكار حلول عملية.',
    iconName: 'BrainCircuit',
    accentColor: '#818CF8',
    techStack: ['Python', 'Machine Learning', 'TensorFlow / PyTorch', 'Data Analysis', 'ChatGPT & AI Tools', 'Computer Vision'],
    careerPaths: ['مهندس ذكاء اصطناعي (AI Engineer)', 'محلل بيانات (Data Analyst)', 'مطور حلول الأتمتة والأنظمة الذكية'],
    keyCourses: ['مبادئ الذكاء الاصطناعي وتعلم الآلة', 'تحليل واستكشاف البيانات العلمية', 'الرؤية الحاسوبية ومعالجة اللغات'],
    featuredProjectTitle: 'المساعد الطلابي الذكي وأنظمة الأتمتة'
  },
  {
    id: 'is-major',
    code: 'IS',
    name: 'تخصص نظم المعلومات',
    collegeId: 'it-computing',
    collegeName: 'كلية تكنولوجيا المعلومات IT',
    tagline: 'إدارة قواعد البيانات، تحليل أنظمة الأعمال، وربط التقنية بالمؤسسات',
    description: 'حلقة الوصل بين التكنولوجيا وعالم الأعمال؛ يتعلم الطالب فيه كيفية تحليل احتياجات المؤسسات، وتصميم قواعد البيانات، وتطوير الأنظمة الرقمية التي ترفع كفاءة العمل.',
    iconName: 'Cpu',
    accentColor: '#38BDF8',
    techStack: ['SQL Databases', 'Power BI & Excel', 'Business Analysis', 'ERP & Cloud Systems', 'Web Management Apps'],
    careerPaths: ['محلل نظم أعمال (Business Systems Analyst)', 'مسؤول قواعد بيانات (Database Admin)', 'أخصائي تحول رقمي وحلول مؤسسية'],
    keyCourses: ['تحليل وتصميم نظم المعلومات', 'إدارة وتصميم قواعد البيانات', 'ذكاء الأعمال والتحول الرقمي'],
    featuredProjectTitle: 'منظومة إدارة الفعاليات والأنشطة المؤتمتة'
  },
  {
    id: 'multimedia-major',
    code: 'MM',
    name: 'تخصص الوسائط المتعددة',
    collegeId: 'it-computing',
    collegeName: 'كلية تكنولوجيا المعلومات IT',
    tagline: 'تصميم واجهات وتجربة المستخدم UI/UX، المونتاج، والمحتوى البصري',
    description: 'يجمع بين الإبداع الفني والمهارة التقنية؛ يتعلم فيه الطالب تصميم واجهات وتطبيقات جذابة وسهلة الاستخدام، والمونتاج وتحريك الرسوم (Motion Graphics)، وإنتاج المحتوى البصري التفاعلي.',
    iconName: 'Sparkles',
    accentColor: '#F59E0B',
    techStack: ['Figma (UI/UX)', 'Adobe Premiere', 'After Effects', 'Photoshop & Illustrator', 'Blender 3D'],
    careerPaths: ['مصمم واجهات وتجربة مستخدم (UI/UX Designer)', 'مصمم موشن جرافيك وفيديو (Motion Designer)', 'مصمم هويات بصرية ومحتوى رقمي'],
    keyCourses: ['تصميم واجهات وتجربة المستخدم UI/UX', 'التحريك الرقمي والموشن جرافيك', 'المونتاج والإنتاج المرئي الرقمي'],
    featuredProjectTitle: 'المعرض الرقمي التفاعلي والإنتاج البصري'
  },
  {
    id: 'architecture',
    code: 'ARCH',
    name: 'تخصص هندسة معمارية',
    collegeId: 'applied-urban',
    collegeName: 'كلية الهندسة التطبيقية و التخطيط العمراني',
    tagline: 'التصميم المعماري الإبداعي، النمذجة ثلاثية الأبعاد، وتخطيط الفضاءات',
    description: 'فن وعلم تخطيط وتصميم المباني والمساحات العمرانية؛ يركز على الجمع بين جمال المظهر والراحة والاستدامة، مع إتقان برامج الرسم والنمذجة المعمارية ثلاثية الأبعاد لإخراج المشاريع بواقعية.',
    iconName: 'Compass',
    accentColor: '#34D399',
    techStack: ['AutoCAD', 'Revit (BIM)', 'Sketchup', 'Lumion / 3ds Max', 'Photoshop Architecture'],
    careerPaths: ['مهندس معماري مصمم (Architectural Designer)', 'مصمم مناظير ثلاثية الأبعاد (3D Visualizer)', 'أخصائي نمذجة معمارية BIM'],
    keyCourses: ['مبادئ واستوديو التصميم المعماري', 'الرسم والنمذجة المعمارية بالحاسوب', 'العمارة البيئية والتصميم الداخلي'],
    featuredProjectTitle: 'مبادرة التصميم المعماري الصديق للبيئة وإعادة الإعمار'
  },
  {
    id: 'civil-eng',
    code: 'CIV',
    name: 'تخصص هندسة مدنية',
    collegeId: 'applied-urban',
    collegeName: 'كلية الهندسة التطبيقية و التخطيط العمراني',
    tagline: 'التصميم الإنشائي، إدارة مواقع البناء، وهندسة البنية التحتية',
    description: 'أساس بناء وتطوير المدن والمرافق؛ يتعلم فيه الطالب حساب الأحمال وتصميم المنشآت الخرسانية والمعدنية، وإدارة مواقع البناء، وحساب الكميات والتكاليف، وهندسة الطرق والمياه.',
    iconName: 'Building2',
    accentColor: '#10B981',
    techStack: ['AutoCAD', 'ETABS / SAP2000', 'حساب الكميات والتكاليف', 'Primavera / Project Management', 'Excel الهندسي'],
    careerPaths: ['مهندس موقع وتنفيذ (Site Engineer)', 'مهندس تصميم إنشائي (Structural Engineer)', 'مهندس حساب كميات ومكتب فني'],
    keyCourses: ['تصميم المنشآت والخرسانة المسلحة', 'إدارة وتنفيذ المشاريع الإنشائية', 'ميكانيكا التربة والأساسات والمساحة'],
    featuredProjectTitle: 'نماذج المنشآت المستدامة وإدارة المشاريع الإنشائية'
  }
];

export const FLAGSHIP_PROJECTS: ProjectCaseStudy[] = [
  {
    id: 'up-digital-portal',
    title: 'منصة النادي الرقمية — UP Engineering Portal',
    tagline: 'المنظومة الرقمية التفاعلية الموحدة لإدارة العضويات، الفعاليات، والتحقق الفوري من البطاقات الذكية',
    category: 'software',
    collegeId: 'software-ai',
    collegeName: 'كلية هندسة برمجيات وذكاء اصطناعي',
    featured: true,
    award: 'مشروع النادي التقني لعام 2026',
    status: 'Deployed',
    problem: 'الحاجة إلى واجهة إلكترونية حديثة تمثل طلبة الكليات الهندسية في جامعة فلسطين، وتسهل الانضمام للنادي وإصدار البطاقات الرقمية والتحقق الفوري منها بسلاسة.',
    solution: 'تم تصميم وتطوير هذه المنصة التفاعلية المتكاملة بتقنيات الويب الحديثة، متضمنة نظام تحقق فوري عبر كود QR وتكامل مع قواعد البيانات ولوحة تحكم مركزية متقدمة للهيئة الإدارية.',
    impactMetrics: [
      { label: 'كليات وتخصصات مغطاة', value: '100%' },
      { label: 'نظام التحقق الذاتي', value: 'QR Code فوري' },
      { label: 'سهولة إصدار البطاقات', value: 'لحظي' },
      { label: 'الوصول للطلبة', value: 'متاح للجميع' }
    ],
    techStack: ['React 19', 'TypeScript', 'Tailwind CSS', 'Vite', 'Supabase', 'QR Verification Engine'],
    team: [
      { name: 'فريق البرمجة والتطوير', role: 'هندسة النظم والواجهات', major: 'هندسة برمجيات' },
      { name: 'فريق الوسائط والتصميم', role: 'تصميم الهوية وتجربة المستخدم UI/UX', major: 'تخصص الوسائط المتعددة' },
      { name: 'فريق المتابعة والتوثيق', role: 'إدارة البيانات والفحص', major: 'تخصص نظم المعلومات' }
    ],
    demoUrl: 'https://engineering-club-phi.vercel.app',
    githubUrl: 'https://github.com/mohammedalnwerie/engineering-club',
    schematicType: 'Client UI -> State Manager -> QR Hash Engine -> Verification Modal'
  },
  {
    id: 'up-open-repo',
    title: 'مستودع مشاريع التخرج المفتوح — UP Engineering Archive',
    tagline: 'مبادرة طلابية لبناء مكتبة رقمية مفتوحة تتيح للطلبة الاستفادة من أبحاث وأفكار مشاريع التخرج السابقة',
    category: 'ai',
    collegeId: 'it-computing',
    collegeName: 'كلية تكنولوجيا المعلومات IT',
    featured: true,
    award: 'مبادرة طلابية قيد التأسيس',
    status: 'Prototyped',
    problem: 'تشتت مشاريع التخرج والأبحاث الهندسية بعد مناقشتها وصعوبة وصول الطلبة الجدد للتوثيق والخبرات المتراكمة للسنوات السابقة للاستفادة منها والبناء عليها.',
    solution: 'تأسيس مستودع رقمي وفهرس موحد يصنف المشاريع حسب التخصص والكلية، مع ملخصات وأكواد ومخططات معمارية لإلهام الطلبة المقبلين على التخرج.',
    impactMetrics: [
      { label: 'مستوى الجاهزية', value: 'مرحلة النمذجة' },
      { label: 'الهدف الأكاديمي', value: 'توثيق المشاريع' },
      { label: 'المستفيدون', value: 'كافة طلبة الهندسة' },
      { label: 'نوع الوصول', value: 'مفتوح مجاني' }
    ],
    techStack: ['Digital Archiving', 'Search & Filter Index', 'PDF & CAD Viewers', 'Git Repositories'],
    team: [
      { name: 'فريق نظم المعلومات', role: 'تصنيف وفهرسة البيانات', major: 'تخصص نظم المعلومات' },
      { name: 'فريق الذكاء الاصطناعي', role: 'محرك البحث والتصنيف', major: 'هندسة ذكاء اصطناعي' }
    ],
    demoUrl: 'https://engineering-club-phi.vercel.app/#projects',
    githubUrl: 'https://github.com/mohammedalnwerie/engineering-club',
    schematicType: 'Project Submission -> Faculty Review -> Metadata Indexing -> Student Search Portal'
  },
  {
    id: 'smart-reconstruction',
    title: 'مبادرة الحلول الهندسية وإعادة الإعمار الذكي — Smart Reconstruction',
    tagline: 'حاضنة لابتكار تصاميم معمارية وبنى تحتية مستدامة وحلول طاقة بديلة لخدمة المجتمع المحلي',
    category: 'architecture',
    collegeId: 'applied-urban',
    collegeName: 'كلية الهندسة التطبيقية و التخطيط العمراني',
    featured: true,
    award: 'مبادرة النادي للمسؤولية المجتمعية',
    status: 'In Testing',
    problem: 'الحاجة الماسة إلى أفكار وحلول هندسية ومعمارية مبتكرة وسريعة التنفيذ تساهم في التخطيط المستدام وتوفير بدائل الطاقة والمياه وإعادة التأهيل العمراني.',
    solution: 'تشكيل مجموعات عمل من طلبة الهندسة المعمارية والمدنية وأنظمة الطاقة لدراسة وتصميم وحدات سكنية اقتصادية ونماذج شبكات مياه وطاقة شمسية ملائمة للمجتمع المحلي.',
    impactMetrics: [
      { label: 'المجال المستهدف', value: 'إعادة الإعمار والاستدامة' },
      { label: 'التخصصات المشاركة', value: 'عمارة + مدني + أنظمة' },
      { label: 'نمط الحلول', value: 'اقتصادي ومستدام' },
      { label: 'المرحلة الحالية', value: 'دراسات ومخططات أولية' }
    ],
    techStack: ['Revit & AutoCAD', 'BIM Modeling', 'GIS Urban Mapping', 'Solar Simulation Tools'],
    team: [
      { name: 'فريق التصميم المعماري', role: 'تخطيط النماذج السكنية', major: 'تخصص هندسة معمارية' },
      { name: 'فريق الهندسة المدنية', role: 'دراسة السلامة والإنشاءات', major: 'تخصص هندسة مدنية' }
    ],
    demoUrl: 'https://engineering-club-phi.vercel.app/#projects',
    githubUrl: 'https://github.com/mohammedalnwerie/engineering-club',
    schematicType: 'Urban Damage Assessment -> Generative Modular CAD -> Structural Integrity Check -> Feasibility Report'
  }
];

export const CLUB_EVENTS: EventItem[] = [
  {
    id: 'launch-event',
    title: 'اللقاء التعريفي الافتتاحي للنادي الهندسي — جامعة فلسطين',
    category: 'Conference',
    date: 'قريباً مع انطلاق الفصل الدراسي',
    time: '11:00 ص – 01:00 م',
    location: 'قاعة المؤتمرات الكبرى — جامعة فلسطين',
    capacity: 200,
    registeredCount: 45,
    speakers: [
      { name: 'الهيئة الإدارية للنادي الهندسي', title: 'فريق قيادة وممثلو لجان النادي' },
      { name: 'نخبة من أساتذة الكليات الهندسية', title: 'جامعة فلسطين' }
    ],
    description: 'لقاء مفتوح لجميع طلبة الكليات الهندسية وتكنولوجيا المعلومات للتعريف برؤية ورسالة النادي، واستعراض خطة الفعاليات واللجان وفتح باب المشاركة والتطوير.',
    prerequisites: ['مفتوح لكافة طلبة كليات الهندسة وتكنولوجيا المعلومات في الجامعة'],
    badgeColor: '#00F0FF'
  },
  {
    id: 'swe-workshop',
    title: 'ورشة عمل: بناء المشاريع البرمجية وأدوات الويب الحديثة',
    category: 'Workshop',
    date: 'خلال الأسابيع الأولى من الإطلاق',
    time: '02:00 م – 04:30 م',
    location: 'مختبر الحاسوب المركزي — مبنى الخوارزمي',
    capacity: 40,
    registeredCount: 18,
    speakers: [
      { name: 'فريق لجنة العلاقات والتدريب', title: 'النادي الهندسي' }
    ],
    description: 'ورشة تطبيقية مكثفة حول أساسيات بناء المواقع والأنظمة الحديثة وإدارة المشاريع البرمجية باستخدام Git و GitHub.',
    prerequisites: ['معرفة مبدئية بأساسيات الحاسوب أو البرمجة', 'إحضار حاسوب محمول إن أمكن'],
    badgeColor: '#10B981'
  },
  {
    id: 'arch-forum',
    title: 'ملتقى العمارة والإنشاء: أفكار وتحديات التخطيط العمراني المستدام',
    category: 'Conference',
    date: 'يُحدد لاحقاً',
    time: '12:00 م – 02:30 م',
    location: 'مرسم واستوديو التصميم المعماري — كلية الهندسة',
    capacity: 60,
    registeredCount: 22,
    speakers: [
      { name: 'فريق طلبة الهندسة المعمارية والمدنية', title: 'مبادرة إعادة الإعمار الذكي' }
    ],
    description: 'جلسة نقاشية وعرض تصاميم معمارية ونماذج إنشائية تركز على الاستدامة، وحلول الطاقة البديلة وإعادة البناء الذكي.',
    prerequisites: ['طلبة الهندسة المعمارية والتطبيقية والمهتمين بالاستدامة'],
    badgeColor: '#38BDF8'
  }
];

export const TRAINING_COURSES: TrainingCourse[] = [
  {
    id: 'course-web-dev',
    title: 'مسار تطوير الويب والأنظمة البرمجية المتكاملة',
    instructor: {
      name: 'فريق التدريب البرمجي',
      title: 'مدربون من طلبة السنوات المتقدمة وخريجي التخصص',
      avatar: ''
    },
    level: 'مبتدئ',
    duration: '4 أسابيع',
    totalHours: 24,
    totalSeats: 30,
    availableSeats: 12,
    startDate: 'يُحدد مع جدول الأنشطة',
    category: 'هندسة البرمجيات',
    skillsGained: ['HTML5 & CSS3', 'JavaScript / React', 'Git & GitHub', 'REST APIs'],
    syllabusWeeks: [
      { week: 1, title: 'أساسيات الويب الحديث وهيكلة الصفحات', topics: ['Modern HTML & CSS', 'Responsive Layouts', 'Flexbox & Grid'] },
      { week: 2, title: 'البرمجة التفاعلية بـ JavaScript', topics: ['DOM Manipulation', 'Async & Fetch', 'ES6+ Features'] },
      { week: 3, title: 'مقدمة في React والمكونات', topics: ['Components & Props', 'State Hooks', 'Tailwind CSS'] },
      { week: 4, title: 'مشروع عملي متكامل ونشره على الإنترنت', topics: ['Git Version Control', 'Vercel Deployment', 'Project Showcase'] }
    ]
  },
  {
    id: 'course-bim-intro',
    title: 'أساسيات النمذجة المعمارية الرقمية (Revit & AutoCAD)',
    instructor: {
      name: 'فريق التدريب المعماري',
      title: 'مدربون متخصصون في النمذجة المعمارية والـ BIM',
      avatar: ''
    },
    level: 'مبتدئ',
    duration: '4 أسابيع',
    totalHours: 20,
    totalSeats: 25,
    availableSeats: 8,
    startDate: 'يُحدد مع جدول الأنشطة',
    category: 'العمارة والتصميم',
    skillsGained: ['AutoCAD 2D Drafting', 'Revit 3D Modeling', 'Architectural Visualization', 'Drafting Standards'],
    syllabusWeeks: [
      { week: 1, title: 'مبادئ الرسم المعماري وضبط المقاييس', topics: ['AutoCAD Interface', 'Precision Drawing', 'Layers & Dimensions'] },
      { week: 2, title: 'الانتقال إلى عالم نمذجة معلومات البناء BIM', topics: ['Revit Basics', 'Walls, Doors & Windows', 'Levels & Grids'] },
      { week: 3, title: 'الخامات والكتل والإظهار ثلاثي الأبعاد', topics: ['Materials', 'Cameras & Lighting', 'Rendering Setup'] },
      { week: 4, title: 'إخراج لوحات مشروع معماري متكامل', topics: ['Sheets & Schedules', 'Section Views', 'Final Portfolio'] }
    ]
  }
];

export const LEADERSHIP_MEMBERS: LeaderMember[] = [
  // 1. رئيس النادي
  {
    id: 'pres-1',
    name: '',
    role: 'رئيس النادي الهندسي',
    tier: 'executive',
    department: 'رئاسة النادي',
    avatar: '',
    quote: 'نؤمن أن المهندس لا ينتظر الفرصة، بل يبتكر أدوات بنائها ويقود التحول الإيجابي في جامعته ومجتمعه.',
    email: '',
    skills: ['القيادة الطلابية', 'إدارة الابتكار الهندسي', 'التنسيق الأكاديمي وصناعة القرار']
  },
  // 2. نائب رئيس النادي للشؤون الإدارية
  {
    id: 'vp-admin',
    name: '',
    role: 'نائب رئيس النادي للشؤون الإدارية',
    tier: 'executive',
    department: 'الهيئة الإدارية',
    avatar: '',
    quote: 'إدارة الهيكل التنظيمي، التنسيق الإداري، والارتقاء بالأداء المؤسسي للنادي.',
    email: '',
    skills: ['الإدارة التنظيمية', 'التنسيق والمتابعة', 'الحوكمة وضبط العمليات']
  },
  // 3. نائب رئيس النادي للشؤون التنفيذية
  {
    id: 'vp-exec',
    name: '',
    role: 'نائب رئيس النادي للشؤون التنفيذية',
    tier: 'executive',
    department: 'الهيئة الإدارية',
    avatar: '',
    quote: 'متابعة تنفيذ المبادرات الهندسية الميدانية، وتوجيه فرق العمل لتحقيق أثر ملموس.',
    email: '',
    skills: ['التنفيذ الميداني', 'إدارة المشاريع الهندسية', 'توجيه الفرق الطلابية']
  },
  // 4. أمين الصندوق
  {
    id: 'treasurer-1',
    name: '',
    role: 'أمين صندوق النادي',
    tier: 'executive',
    department: 'الهيئة الإدارية',
    avatar: '',
    quote: 'إدارة الموارد بكفاءة وشفافية تضمن تنفيذ الفعاليات والمشاريع بأعلى جودة ممكنة.',
    email: '',
    skills: ['الإدارة المالية والموازنات', 'الشفافية والتنظيم', 'إدارة الموارد والعهد']
  },
  // 5. لجنة الفعاليات والأنشطة
  {
    id: 'comm-events',
    name: '',
    role: 'رئيس لجنة الفعاليات والأنشطة',
    tier: 'committee-lead',
    department: 'لجنة الفعاليات والأنشطة',
    avatar: '',
    quote: 'نبتكر فعاليات ومسابقات وورش عمل تصنع تجربة جامعية غنية وممتعة لجميع الزملاء.',
    email: '',
    skills: ['إدارة وتنظيم الفعاليات', 'إقامة الهاكاثونات', 'التخطيط الميداني واللوجستي']
  },
  // 6. لجنة العلاقات والتدريب
  {
    id: 'comm-training',
    name: '',
    role: 'رئيس لجنة العلاقات والتدريب',
    tier: 'committee-lead',
    department: 'لجنة العلاقات والتدريب',
    avatar: '',
    quote: 'نبني جسوراً من الشراكات وورش التدريب لتطوير قدرات الطلبة وتأهيلهم لسوق العمل.',
    email: '',
    skills: ['الشراكات الطلابية', 'تنظيم الورش والتدريبات', 'التواصل المؤسسي']
  },
  // 7. اللجنة الإعلامية
  {
    id: 'comm-media',
    name: '',
    role: 'رئيس اللجنة الإعلامية',
    tier: 'committee-lead',
    department: 'اللجنة الإعلامية',
    avatar: '',
    quote: 'نبرز إبداعات مهندسي فلسطين وننقل رسالة النادي وأنشطته بهوية بصرية احترافية وملهمة.',
    email: '',
    skills: ['صناعة المحتوى الرقمي', 'التغطيات الإعلامية', 'التصميم والإنتاج المرئي']
  },
  // 8. ممثل كلية هندسة برمجيات وذكاء اصطناعي
  {
    id: 'lead-col-software-ai',
    name: '',
    role: 'منسق وممثل كلية هندسة برمجيات وذكاء اصطناعي',
    tier: 'college-lead',
    department: 'كلية هندسة برمجيات وذكاء اصطناعي',
    avatar: '',
    quote: 'تمثيل طلبة الكلية والتنسيق الفعّال مع إدارة النادي لإطلاق المبادرات والحلول البرمجية والذكية.',
    email: '',
    skills: ['تمثيل الكلية', 'التنسيق الأكاديمي', 'هندسة البرمجيات والذكاء الاصطناعي']
  },
  // 9. ممثل كلية تكنولوجيا المعلومات IT
  {
    id: 'lead-col-it-computing',
    name: '',
    role: 'منسق وممثل كلية تكنولوجيا المعلومات IT',
    tier: 'college-lead',
    department: 'كلية تكنولوجيا المعلومات IT',
    avatar: '',
    quote: 'تمثيل طلبة تكنولوجيا المعلومات وتفعيل مشاريع قواعد البيانات والوسائط المتعددة بالأنشطة الجامعية.',
    email: '',
    skills: ['تمثيل الكلية', 'إدارة النظم والمعلومات', 'الوسائط الرقمية والتصميم']
  },
  // 10. ممثل كلية الهندسة التطبيقية والتخطيط العمراني
  {
    id: 'lead-col-applied-urban',
    name: '',
    role: 'منسق وممثل كلية الهندسة التطبيقية والتخطيط العمراني',
    tier: 'college-lead',
    department: 'كلية الهندسة التطبيقية و التخطيط العمراني',
    avatar: '',
    quote: 'تمثيل طلبة الهندسة المعمارية والمدنية وربط الابتكارات العمرانية بمبادرات التطوير وإعادة البناء الذكي.',
    email: '',
    skills: ['تمثيل الكلية', 'التصميم المعماري', 'الهندسة الإنشائية والتخطيط']
  }
];

export const LIVE_ACTIVITY_STREAM = [
  { id: '1', title: 'إطلاق بوابة النادي الرقمية', desc: 'تدشين المنصة الرسمية وإتاحة التحقق التلقائي من البطاقات الذكية بالكامل', time: 'اليوم', tag: 'LAUNCH' },
  { id: '2', title: 'فتح باب العضوية واللجان', desc: 'بدء استقبال طلبات الانضمام لطلبة كليات الهندسة وتكنولوجيا المعلومات', time: 'الآن', tag: 'JOIN' },
  { id: '3', title: 'إعداد خطة الورش التطبيقية', desc: 'لجنة العلاقات والتدريب تعكف على جدولة أولى الورش التخصصية', time: 'مستمر', tag: 'TRAIN' },
  { id: '4', title: 'تأسيس حاضنة المشاريع الطلابية', desc: 'فتح باب مقترحات المشاريع لربط فرق العمل وتوفير الإرشاد الأكاديمي', time: 'جديد', tag: 'PROJECTS' }
];

export const STUDENT_SPOTLIGHT = {
  name: 'طالب متميز من مهندسي جامعة فلسطين',
  major: 'كليات الهندسة وتكنولوجيا المعلومات',
  achievement: 'مشاركة فاعلة في تأسيس مبادرات النادي الهندسي والمساهمة في بناء بيئة طلابية ملهمة تدعم كافة الزملاء والزميلات في التخصصات الهندسية.',
  avatar: '',
  quote: 'النادي الهندسي في جامعة فلسطين هو بوابتنا لتحويل ما نتعلمه في القاعات إلى أثر حقيقي ومشاريع نخدم بها مجتمعنا ووطننا.',
  projectsCount: 2,
  awardsCount: 1,
  publicationsCount: 0
};
