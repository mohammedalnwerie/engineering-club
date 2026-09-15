import type { College, Major, ProjectCaseStudy, EventItem, TrainingCourse, LeaderMember } from '../types';


export const COLLEGES: College[] = [
  {
    id: 'software-ai',
    code: 'ENG-AI',
    name: 'كلية هندسة برمجيات وذكاء اصطناعي',
    shortName: 'البرمجيات والذكاء الاصطناعي',
    tagline: 'حيث تلتقي معمارية البرمجيات المعقدة بنماذج وخوارزميات الذكاء الاصطناعي',
    description: 'تخريج مهندسين متخصصين في بناء الأنظمة البرمجية الموزعة، وتطوير خوارزميات ونماذج الذكاء الاصطناعي التوليدي، وتطبيقات الحوسبة فائقة الأداء.',
    accentColor: '#00F0FF',
    gradient: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    coordinator: {
      name: 'م. راكان بن فهد',
      role: 'منسق كلية هندسة برمجيات وذكاء اصطناعي',
      title: 'باحث في معمارية النظم وهندسة الذكاء الاصطناعي',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      email: 'rakan.ai@engclub.edu',
    },
    majors: ['هندسة برمجيات', 'هندسة ذكاء اصطناعي'],
    labsCount: 8,
    studentsCount: 460,
    projectsCount: 32,
    featuredLabs: ['مختبر الحوسبة الفائقة ونماذج الذكاء الاصطناعي GPU Cluster', 'مختبر هندسة البرمجيات والنظم السحابية', 'معمل الرؤية الحاسوبية ومعالجة اللغات الطبيعية'],
    flagshipAchievement: 'الفوز بالمركز الأول في هاكاثون الذكاء الاصطناعي الوطني وتطوير نماذج برمجية سيادية'
  },
  {
    id: 'it-computing',
    code: 'IT',
    name: 'كلية تكنولوجيا المعلومات IT',
    shortName: 'تكنولوجيا المعلومات IT',
    tagline: 'إدارة نظم المعلومات الرقمية وتصميم التجارب التفاعلية والوسائط المتعددة',
    description: 'تمكين الكوادر التقنية في تحليل النظم المؤسسية، إدارة وتكامل البيانات الضخمة، وتطوير الإنتاج الرقمي التفاعلي ثلاثي الأبعاد والوسائط المتعددة.',
    accentColor: '#3877FF',
    gradient: 'from-blue-600/20 via-indigo-500/10 to-transparent',
    coordinator: {
      name: 'م. ليلى السبيعي',
      role: 'منسقة كلية تكنولوجيا المعلومات IT',
      title: 'متخصصة في نظم المعلومات وتصميم التجارب والوسائط الرقمية',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
      email: 'layla.it@engclub.edu',
    },
    majors: ['تخصص نظم المعلومات', 'تخصص الوسائط المتعددة'],
    labsCount: 6,
    studentsCount: 490,
    projectsCount: 29,
    featuredLabs: ['استوديو إنتاج الوسائط المتعددة والواقع الافتراضي VR/AR', 'مختبر نظم وتكامل قواعد البيانات Enterprise ERP', 'معمل التصميم الرقمي وتجربة المستخدم UX/UI'],
    flagshipAchievement: 'تطوير المنظومة الرقمية والبيئة التفاعلية الشاملة لخدمات الحرم الجامعي'
  },
  {
    id: 'applied-urban',
    code: 'ENG-URB',
    name: 'كلية الهندسة التطبيقية و التخطيط العمراني',
    shortName: 'الهندسة التطبيقية والتخطيط العمراني',
    tagline: 'نصمم المدن الذكية، نشيد البنى التحتية، ونرسم ملامح العمران المستدام',
    description: 'دمج الإبداع المعماري بالهندسة الإنشائية والتخطيط الحضري لتطوير بيئات عمرانية متكاملة ومستدامة وفق معايير الاستدامة العالمية.',
    accentColor: '#10B981',
    gradient: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    coordinator: {
      name: 'م. طارق العمري',
      role: 'منسق كلية الهندسة التطبيقية والتخطيط العمراني',
      title: 'استشاري التخطيط الحضري والهندسة المعمارية المستدامة',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      email: 'tariq.arch@engclub.edu',
    },
    majors: ['تخصص هندسة معمارية', 'تخصص هندسة مدنية'],
    labsCount: 7,
    studentsCount: 380,
    projectsCount: 24,
    featuredLabs: ['استوديو التصميم المعماري البارامتري والتخطيط الحضري', 'مختبر ميكانيكا المواد والإنشاءات الذكية', 'مركز نظم المعلومات الجغرافية GIS والاستشعار عن بعد'],
    flagshipAchievement: 'الفوز بجائزة التخطيط العمراني المستدام وتصميم المخطط التوجيهي للحرم الأخضر'
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
    featuredProjectTitle: 'منصة الخدمات الطلابية والتواصل الأكاديمي'
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
    featuredProjectTitle: 'المساعد الطلابي الذكي للإرشاد الجامعي'
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
    featuredProjectTitle: 'نظام إدارة الفعاليات والأنشطة الجامعية المؤتمت'
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
    featuredProjectTitle: 'معرض رقمي تفاعلي ثلاثي الأبعاد لإبداعات الطلبة'
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
    featuredProjectTitle: 'تصميم المركز الطلابي الصديق للبيئة'
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
    featuredProjectTitle: 'دراسة وتصميم مبنى سكني متكامل مع حساب الكميات'
  }
];

export const FLAGSHIP_PROJECTS: ProjectCaseStudy[] = [
  {
    id: 'smart-grid-ai',
    title: 'SmartGrid AI — نظام موازنة أحمال الطاقة الحرمية',
    tagline: 'منظومة تنبؤية ذكية خفضت استهلاك الطاقة في مرافق الحرم الجامعي بنسبة 28%',
    category: 'ai',
    collegeId: 'software-ai',
    collegeName: 'كلية هندسة برمجيات وذكاء اصطناعي',
    featured: true,
    award: 'جائزة الابتكار الهندسي المفتوح 2025',
    status: 'Deployed',
    problem: 'كانت مرافق الحرم الجامعي تعاني من ذروات استهلاك غير متوقعة للكهرباء والتكييف دون وجود قراءات فورية أو توزيع حمل ديناميكي بين مباني الكليات.',
    solution: 'قمنا بتطوير منصة تدمج مجسات IoT الموزعة في 12 مبنى مع نموذج شبكات عصبية زمنية (LSTM) للتنبؤ بالأحمال وضبط تدفق الطاقة والتبريد آلياً في الوقت الفعلي.',
    impactMetrics: [
      { label: 'انخفاض في استهلاك الطاقة', value: '28%' },
      { label: 'أجهزة استشعار متصلة', value: '340+' },
      { label: 'وفر مالي سنوي تقديري', value: '180,000 ريال' },
      { label: 'زمن استجابة المنظومة', value: '< 200ms' }
    ],
    techStack: ['Python', 'PyTorch LSTM', 'MQTT Protocol', 'TimescaleDB', 'Grafana UI', 'ESP32 Nodes'],
    team: [
      { name: 'فيصل الحربي', role: 'قائد المشروع & مهندس برمجيات', major: 'هندسة برمجيات' },
      { name: 'سارة القحطاني', role: 'مهندسة ذكاء اصطناعي وتحليل بيانات', major: 'هندسة ذكاء اصطناعي' },
      { name: 'عمر الدوسري', role: 'مهندس نظم ومعلومات ذكية', major: 'تخصص نظم المعلومات' }
    ],
    demoUrl: 'https://smartgrid-demo.engclub.edu',
    githubUrl: 'https://github.com/engclub/smartgrid-ai-core',
    schematicType: 'IoT Sensors Node -> MQTT Broker -> LSTM Inference Engine -> Modbus Controller'
  },
  {
    id: 'bim-genesis',
    title: 'BIM Genesis — المحلل التوليدي للمخططات الإنشائية',
    tagline: 'خوارزمية توليد وتدقيق مخططات البناء وفق الكود العمراني في ثوانٍ معدودة',
    category: 'architecture',
    collegeId: 'applied-urban',
    collegeName: 'كلية الهندسة التطبيقية و التخطيط العمراني',
    featured: true,
    award: 'أفضل ابتكار في مسابقة البناء الرقمي 2025',
    status: 'Prototyped',
    problem: 'يستغرق تدقيق المخططات الإنشائية والتأكد من مطابقتها لاشتراطات كود البناء وأبعاد السلامة أسابيع من التدقيق اليدوي المعرض للأخطاء البشرية.',
    solution: 'نظام برمجي يتكامل مع ملفات IFC وRevit، يحلل الهندسة الفراغية باستخدام خوارزميات الهندسة الحسابية (Computational Geometry) ويكشف أي تعارض إنشائي أو مخالفة للكود بلحظات.',
    impactMetrics: [
      { label: 'تسريع التدقيق الفراغي', value: '14x أسرع' },
      { label: 'دقة رصد التعارضات', value: '99.4%' },
      { label: 'مخططات تم اختبارها', value: '1,200+' }
    ],
    techStack: ['C# .NET', 'Revit API', 'Grasshopper', 'OpenCASCADE', 'React Three Fiber', 'WebAssembly'],
    team: [
      { name: 'مها الشريف', role: 'مهندسة معمارية ومصممة خوارزميات', major: 'تخصص هندسة معمارية' },
      { name: 'خالد باوزير', role: 'مهندس إنشائي ومبرمج تكامل', major: 'تخصص هندسة مدنية' },
      { name: 'زياد السعيد', role: 'مهندس وسائط رقمية ونمذجة 3D', major: 'تخصص الوسائط المتعددة' }
    ],
    demoUrl: 'https://bimgenesis.engclub.edu',
    githubUrl: 'https://github.com/engclub/bim-genesis',
    schematicType: 'IFC Parser -> Topological Spatial Graph -> Rule Engine Evaluator -> 3D WebGL Diff Viewer'
  },
  {
    id: 'aeropulse-robotics',
    title: 'AeroPulse — روبوت الفحص الذاتي للهياكل الإنشائية',
    tagline: 'روبوت مجنزر ومسيّر للكشف عن الشقوق الدقيقة في الجسور والأنابيب الصناعية',
    category: 'robotics',
    collegeId: 'software-ai',
    collegeName: 'كلية هندسة برمجيات وذكاء اصطناعي',
    featured: true,
    status: 'In Testing',
    problem: 'صعوبة وخطورة الفحص البشري في المواقع العالية وتحت الجسور وفي قنوات الأنفاق الصناعية الضيقة والمغلقة.',
    solution: 'صمم الفريق مركبة فحص مستقلة مجهزة بحساسات ليزر LiDAR وكاميرات تصوير حراري ميكروسكوبية، تبني خريطة ثلاثية الأبعاد للموقع وتحدد بدقة المليمتر أي شروخ خرسانية أو صدأ معدني.',
    impactMetrics: [
      { label: 'دقة رصد الشقوق', value: '0.2 mm' },
      { label: 'زمن الفحص الميداني', value: 'تخفيض 70%' },
      { label: 'مدى التغطية اللاسلكية', value: '1.5 كم' }
    ],
    techStack: ['ROS2 (Robot OS)', 'C++', 'YOLOv10 Vision', 'LiDAR SLAM', 'SolidWorks CAD', '3D Carbon Fiber'],
    team: [
      { name: 'سلطان الرويلي', role: 'مهندس برمجيات ونظم روبوتات', major: 'هندسة برمجيات' },
      { name: 'نورة العتيبي', role: 'مهندسة رؤية حاسوبية وذكاء اصطناعي', major: 'هندسة ذكاء اصطناعي' },
      { name: 'فهد المطيري', role: 'مهندس سلامة إنشائية واختبار مواد', major: 'تخصص هندسة مدنية' }
    ],
    demoUrl: 'https://aeropulse.engclub.edu',
    githubUrl: 'https://github.com/engclub/aeropulse-autonomous-inspector',
    schematicType: 'Stereo Vision & LiDAR -> ROS2 Navigation Node -> Jetson Orin Nano AI -> Real-Time Telemetry'
  },
  {
    id: 'cybershield-campus',
    title: 'CyberShield — منصة الأمان اللامركزي للوثائق الأكاديمية',
    tagline: 'بروتوكول تحقق تشفيري فوري يمنع التزوير الأكاديمي ويحمي براءات الاختراع',
    category: 'software',
    collegeId: 'it-computing',
    collegeName: 'كلية تكنولوجيا المعلومات IT',
    featured: false,
    status: 'Deployed',
    problem: 'صعوبة التحقق الدولي الفوري من وثائق المشروعات الطلابية والشهادات الهندسية دون الحاجة لمراسلات بطيئة.',
    solution: 'نظام هجين يعتمد على خوارزميات الإثبات الصفري (Zero-Knowledge Proofs) وسجلات تشفيرية لتوثيق ملكية المشاريع الهندسية ونتائج المعامل بأعلى درجات الخصوصية والأمان.',
    impactMetrics: [
      { label: 'وثيقة وبراءة مسجلة', value: '8,500+' },
      { label: 'زمن التحقق التشفيري', value: '45 ms' },
      { label: 'مستوى حماية التشفير', value: 'AES-256 / SHA3' }
    ],
    techStack: ['Rust', 'Zero-Knowledge Snarks', 'Docker', 'React / Vite', 'REST & gRPC APIs'],
    team: [
      { name: 'عبدالله التميمي', role: 'مهندس أمن سيبراني وتشفير', major: 'الأمن السيبراني' },
      { name: 'ريم المنصور', role: 'مطورة واجهات وتجربة مستخدم', major: 'هندسة البرمجيات' }
    ],
    demoUrl: 'https://cybershield.engclub.edu',
    githubUrl: 'https://github.com/engclub/cybershield-core',
    schematicType: 'Document Hasher -> ZK Proof Prover -> Cryptographic Ledger -> Verifier Portal'
  }
];

export const CLUB_EVENTS: EventItem[] = [
  {
    id: 'hackathon-2026',
    title: 'هاكاثون الابتكار الهندسي 2026: نبني مدن الغد',
    category: 'Hackathon',
    date: '24 - 26 أكتوبر 2026',
    time: '48 ساعة متواصلة من التطوير',
    location: 'قاعة الابتكار الكبرى — مركز المؤتمرات الجامعي',
    capacity: 250,
    registeredCount: 194,
    speakers: [
      { name: 'د. يوسف الشمري', title: 'خبير المدن الذكية ومستشار تقني' },
      { name: 'م. هالة الغامدي', title: 'كبير مهندسي البرمجيات في الحوسبة السحابية' }
    ],
    description: 'تحدٍ هندسي مكثف يجمع طلاب البرمجيات، الذكاء الاصطناعي، العمارة، والهندسة المدنية لبناء نماذج حية تسهم في حل مشكلات الطاقة الحضرية وإدارة البنية التحتية.',
    prerequisites: ['معرفة بأساسيات البرمجة أو النمذجة ثلاثية الأبعاد', 'إحضار حاسوب محمول شخصي', 'شغف العمل الفريقي متعدد التخصصات'],
    badgeColor: '#00F0FF'
  },
  {
    id: 'bim-advanced-workshop',
    title: 'معسكر النمذجة المتقدمة BIM & Revit في المنشآت العملاقة',
    category: 'Workshop',
    date: '12 نوفمبر 2026',
    time: '04:00 م – 08:00 م',
    location: 'مختبر الحوسبة الهندسية — مبنى 4',
    capacity: 40,
    registeredCount: 38,
    speakers: [
      { name: 'م. حسام الشهري', title: 'معماري معتمد في نمذجة BIM 4D/5D' }
    ],
    description: 'ورشة تطبيقية احترافية في ربط الجداول الزمنية والتكاليف بنماذج المباني ثلاثية الأبعاد واكتشاف تعارضات التمديدات الكهروميكانيكية MEP.',
    prerequisites: ['معرفة مبدئية ببرنامج Revit أو AutoCAD', 'جهاز حاسب محمول يدعم البرامج الإنشائية'],
    badgeColor: '#10B981'
  },
  {
    id: 'ai-edge-conference',
    title: 'ملتقى أنظمة الحوسبة الطرفية Edge Computing والروبوتات',
    category: 'Conference',
    date: '03 ديسمبر 2026',
    time: '09:00 ص – 02:00 م',
    location: 'المدرج الهندسي الرئيسي',
    capacity: 300,
    registeredCount: 220,
    speakers: [
      { name: 'د. كريم عبدالفتاح', title: 'أستاذ الروبوتات والأنظمة الذكية' },
      { name: 'م. ندى القاسم', title: 'رئيسة فرق إنترنت الأشياء الصناعي' }
    ],
    description: 'أوراق بحثية وعروض حية لأحدث ما توصلت إليه المعامل في تشغيل نماذج الذكاء الاصطناعي على الشرائح متناهية الصغر بدون إنترنت.',
    prerequisites: ['مفتوح لجميع طلاب وطالبات الكليات الهندسية والتقنية'],
    badgeColor: '#818CF8'
  },
  {
    id: 'site-visit-metro',
    title: 'زيارة ميدانية: مركز التحكم التشغيلي والأنظمة الحضرية',
    category: 'Site Visit',
    date: '18 ديسمبر 2026',
    time: '08:00 ص – 01:00 م',
    location: 'مقر شبكة النقل الذكية — التجمع عند بوابة النادي',
    capacity: 35,
    registeredCount: 35,
    speakers: [
      { name: 'م. ماجد العنزي', title: 'مدير عمليات البنية التحتية والتحكم الآلي' }
    ],
    description: 'جولة فنية داخل غرف التحكم المركزية والمحطات الفرعية، للاطلاع الميداني على خوارزميات SCADA وحسابات الأحمال والتحكم في الإشارات.',
    prerequisites: ['التسجيل المسبق عبر النادي', 'الالتزام بمتطلبات السلامة الميدانية'],
    badgeColor: '#F59E0B'
  }
];

export const TRAINING_COURSES: TrainingCourse[] = [
  {
    id: 'course-distributed-systems',
    title: 'معمارية النظم الموزعة والحوسبة السحابية عالية التوافر',
    instructor: {
      name: 'م. أحمد الخالدي',
      title: 'مهندس نظم رئيسي ومدرب معتمد في Cloud Architecture',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80'
    },
    level: 'متقدم',
    duration: '6 أسابيع',
    totalHours: 36,
    totalSeats: 30,
    availableSeats: 7,
    startDate: '15 أكتوبر 2026',
    category: 'هندسة البرمجيات',
    skillsGained: ['Microservices Architecture', 'Kubernetes Clusters', 'Event-Driven Systems (Kafka)', 'Resilience Engineering'],
    syllabusWeeks: [
      { week: 1, title: 'الأسس النظرية للأنظمة الموزعة ونظرية CAP', topics: ['Consensus Algorithms', 'Network Partitions', 'Data Replication'] },
      { week: 2, title: 'تصميم خدمات المايكروسيرفيس المستقلة', topics: ['Domain-Driven Design', 'API Gateway Patterns', 'gRPC vs REST'] },
      { week: 3, title: 'رسائل الأحداث والتدفق الفوري للبيانات', topics: ['Apache Kafka', 'Event Sourcing', 'CQRS Architecture'] },
      { week: 4, title: 'إدارة الحاويات ونشر النظم في Kubernetes', topics: ['Pods & Services', 'Ingress Controllers', 'ConfigMaps & Secrets'] },
      { week: 5, title: 'مراقبة النظم ورصد الأعطال Observability', topics: ['Prometheus & Grafana', 'Distributed Tracing', 'OpenTelemetry'] },
      { week: 6, title: 'المشروع النهائي: إطلاق منظومة موزعة فائقة التحمل', topics: ['Chaos Engineering Testing', 'Load Testing', 'Final Review'] }
    ]
  },
  {
    id: 'course-parametric-bim',
    title: 'التصميم البارامتري المتقدم واستراتيجيات الاستدامة العمرانية',
    instructor: {
      name: 'م. وجدان الحارثي',
      title: 'معمارية وباحثة في الخوارزميات الفراغية والطاقة المتجددة',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
    },
    level: 'متوسط',
    duration: '4 أسابيع',
    totalHours: 24,
    totalSeats: 25,
    availableSeats: 4,
    startDate: '20 أكتوبر 2026',
    category: 'العمارة والتصميم',
    skillsGained: ['Grasshopper Algorithmic Modeling', 'Solar Radiation Analysis', 'Parametric Facades', 'Carbon Footprint Calculation'],
    syllabusWeeks: [
      { week: 1, title: 'مدخل إلى الخوارزميات الرياضية في التشكيل المعماري', topics: ['Vector Math', 'NURBS Curves & Surfaces', 'Mathematical Patterns'] },
      { week: 2, title: 'الواجهات الحركية المتفاعلة مع حركة الشمس', topics: ['Kinetic Shading Systems', 'Sun Vectors Simulation', 'Ladybug Tools'] },
      { week: 3, title: 'الربط التبادلي بين Grasshopper وبرنامج Revit', topics: ['Rhino.Inside.Revit', 'Automated Geometry Generation', 'Data Linking'] },
      { week: 4, title: 'مشروع تخرج المعسكر: مجمع بحثي بيئي منعدم الانبعاثات', topics: ['Net-Zero Optimization', 'Structural Feasibility', 'Digital Model Presentation'] }
    ]
  },
  {
    id: 'course-industrial-iot',
    title: 'إنترنت الأشياء الصناعي والروبوتات المدمجة من الألف إلى الياء',
    instructor: {
      name: 'م. سامي الحربي',
      title: 'مهندس إلكترونيات وأنظمة تحكم صناعي Embedded Systems',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80'
    },
    level: 'متوسط',
    duration: '5 أسابيع',
    totalHours: 30,
    totalSeats: 28,
    availableSeats: 9,
    startDate: '01 نوفمبر 2026',
    category: 'الأنظمة الصناعية والروبوتات',
    skillsGained: ['Embedded C/C++', 'FreeRTOS Architecture', 'Industrial Protocols (Modbus, CAN bus)', 'PCB Design in KiCad'],
    syllabusWeeks: [
      { week: 1, title: 'معماريات المعالجات الدقيقة ونظم التشغيل المضمنة', topics: ['ARM Cortex-M Architecture', 'Memory Mapping', 'Bare Metal Programming'] },
      { week: 2, title: 'نظام التشغيل الآني Real-Time OS (FreeRTOS)', topics: ['Tasks & Schedulers', 'Mutexes & Semaphores', 'Queue Management'] },
      { week: 3, title: 'بروتوكولات الاتصال الصناعية والحساسات الدقيقة', topics: ['CAN Bus', 'Modbus RTU/TCP', 'I2C & SPI Drivers'] },
      { week: 4, title: 'تصميم لوحات الدوائر الإلكترونية المطبوعة (PCB)', topics: ['Schematic Capture', 'Routing Best Practices', 'Signal Integrity'] },
      { week: 5, title: 'تجميع واختبار ذراع روبوتية صناعية متصلة بالسحاب', topics: ['Kinematic Inversion', 'Cloud Telemetry', 'Hardware Assembly'] }
    ]
  }
];

export const LEADERSHIP_MEMBERS: LeaderMember[] = [
  // 1. رئيس النادي
  {
    id: 'pres-1',
    name: 'م. بدر بن عبدالعزيز المنصور',
    role: 'رئيس النادي الهندسي',
    tier: 'executive',
    department: 'رئاسة النادي',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    quote: 'نؤمن أن المهندس لا ينتظر الفرصة، بل يبتكر أدوات بنائها ويقود التحول التقني.',
    linkedin: 'https://linkedin.com',
    github: 'https://github.com',
    email: 'president@engclub.edu',
    skills: ['القيادة الاستراتيجية', 'إدارة الابتكار الهندسي', 'الحوكمة وصناعة القرار']
  },
  // 2. نائب الرئيس
  {
    id: 'vp-1',
    name: 'م. سارة بنت فهد الحازمي',
    role: 'نائب رئيس النادي',
    tier: 'executive',
    department: 'الهيئة الإدارية',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&auto=format&fit=crop&q=80',
    quote: 'التكامل بين التخطيط الاستراتيجي والتنفيذ الميداني هو سر استدامة التميز.',
    linkedin: 'https://linkedin.com',
    email: 'vp@engclub.edu',
    skills: ['الإدارة التنفيذية', 'التنسيق والمتابعة', 'تطوير الخطط والمبادرات']
  },
  // 3. أمين السر
  {
    id: 'sec-1',
    name: 'م. محمد بن صالح الغامدي',
    role: 'أمين سر النادي',
    tier: 'executive',
    department: 'الهيئة الإدارية',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    quote: 'التوثيق الدقيق وإدارة المحاضر والتدفقات التنظيمية هما البوصلة الإدارية للنادي.',
    linkedin: 'https://linkedin.com',
    email: 'secretary@engclub.edu',
    skills: ['إدارة المحاضر والتوثيق', 'التنظيم الإداري', 'الحوكمة ومتابعة القرارات']
  },
  // 4. أمين الصندوق
  {
    id: 'treasurer-1',
    name: 'م. ريان بن خالد العتيبي',
    role: 'أمين صندوق النادي',
    tier: 'executive',
    department: 'الهيئة الإدارية',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    quote: 'حوكمة الميزانيات وتوجيه الموارد المالية بكفاءة يضمن نجاح واستدامة كل مبادرة.',
    linkedin: 'https://linkedin.com',
    email: 'treasurer@engclub.edu',
    skills: ['الإدارة المالية والموازنات', 'التدقيق والشفافية', 'إدارة الرعايات والعهد']
  },
  // 5. لجنة الفعاليات والأنشطة
  {
    id: 'comm-events',
    name: 'م. طارق بن كمال العمري',
    role: 'رئيس لجنة الفعاليات والأنشطة',
    tier: 'committee-lead',
    department: 'لجنة الفعاليات والأنشطة',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    quote: 'نبتكر فعاليات ومسابقات غير مسبوقة تصنع تجربة هندسية ثرية لجميع الطلاب.',
    email: 'events@engclub.edu',
    skills: ['إدارة الحشود والفعاليات', 'تنظيم الهاكاثونات', 'التخطيط اللوجستي الميداني']
  },
  // 6. لجنة العلاقات والتدريب
  {
    id: 'comm-training',
    name: 'م. ليلى بنت ناصر السبيعي',
    role: 'رئيسة لجنة العلاقات والتدريب',
    tier: 'committee-lead',
    department: 'لجنة العلاقات والتدريب',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    quote: 'نبني جسوراً متينة من الشراكات الصناعية والبرامج التدريبية لتأهيل الكفاءات.',
    email: 'training@engclub.edu',
    skills: ['الشراكات الاستراتيجية', 'تطوير المسارات التدريبية', 'استقطاب الخبراء والمدربين']
  },
  // 7. اللجنة الإعلامية
  {
    id: 'comm-media',
    name: 'أ. جود بنت راشد التميمي',
    role: 'رئيسة اللجنة الإعلامية',
    tier: 'committee-lead',
    department: 'اللجنة الإعلامية',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    quote: 'نترجم الإنجازات والابتكارات الهندسية إلى قصص بصرية ومحتوى رقمي ملهم.',
    email: 'media@engclub.edu',
    skills: ['صناعة المحتوى الرقمي', 'التغطيات الإعلامية', 'الهوية والتصميم والإنتاج المرئي']
  }
];

export const LIVE_ACTIVITY_STREAM = [
  { id: '1', title: 'تم اكتمال مراجعة الكود', desc: 'الفريق البرمجي أطلق التحديث v2.4 لمنصة التدقيق الإنشائي', time: 'منذ 8 دقائق', tag: 'SWE' },
  { id: '2', title: 'تسجيل مقعد جديد', desc: 'انضم 5 طلاب جدد لمعسكر النظم الموزعة والحوسبة السحابية', time: 'منذ 23 دقيقة', tag: 'TRAIN' },
  { id: '3', title: 'نموذج أولي مطبوع', desc: 'مختبر الروبوتات أتم طباعة الذراع المفصلية بألياف الكربون', time: 'منذ 45 دقيقة', tag: 'ROBOT' },
  { id: '4', title: 'اعتماد شريك صناعي', desc: 'توقيع اتفاقية رعاية ومقاعد تدريبية مع شركة أتمتة الأنظمة', time: 'منذ ساعتين', tag: 'PARTNER' }
];

export const STUDENT_SPOTLIGHT = {
  name: 'المهندسة سارة بنت منصور القحطاني',
  major: 'علوم الحاسب والذكاء الاصطناعي — السنة الرابعة',
  achievement: 'قادت فريق تطوير خوارزمية التنبؤ بالأحمال الكهربائية (SmartGrid AI)، وفازت بجائزة الطالب المبتكر للعام 2025 بعد تجربة الخوارزمية بنجاح على 12 مبنى بالحرم الجامعي.',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80',
  quote: 'النادي الهندسي لم يكن مجرد نشاط طلابي، بل كان مسرّعة أعمال هندسية ومختبراً حياً نقل أفكارنا من الورق إلى الواقع الميداني الفعلي.',
  projectsCount: 4,
  awardsCount: 3,
  publicationsCount: 2
};
