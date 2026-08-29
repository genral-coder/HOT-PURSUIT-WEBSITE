/* ═══════════════════════════════════════════════════════════════
   HOT PURSUIT RP — مركز الإعدادات المركزي
   ───────────────────────────────────────────────────────────────
   كل القيم القابلة للتعديل للموقع تتركز هنا.
   عدّل من هذا الملف فقط ولا تلمس rest.dist.
   القيم الفارغة/الplaceholder marked بوضوح (TODO: replace).
   ═══════════════════════════════════════════════════════════════ */
window.SITE = {

  /* ميتا أساسية */
  meta: {
    title: "HOT PURSUIT RP | FiveM Roleplay Server",
    description: "Official website for the HOT PURSUIT RP FiveM roleplay server. Browse the store, apply, join our community and get the latest updates.",
    url: "https://genral-coder.github.io/Hot-store/",
    image: "images/Asset_2.webp",
    themeColor: "#0b0b0e",
  },

  server: {
    name: "HOT PURSUIT",
    tagline: "Your Story. Your Rules.",
    /* TODO: replace with real values */
    ip: "connect.example.com",
    ipFull: "connect.example.com:30120",
    playerLimit: 200,
    playersOnline: 127,
    online: true,
    version: "1.5.0",
    lastRestart: "30 Aug 2026",
    uptime: "99.9%",
    region: "Global / MENA",
  },

  links: {
    /* TODO: replace with real official links */
    discord: "https://discord.gg/REqWKXnrku",          // offical invite (primary)
    discordTicket: "discord://-/channels/1341426480827203584/1341516123123744881", // opens a purchase ticket in the Discord app
    tiktok: "",
    youtube: "",
    instagram: "",
    twitter: "",
    twitch: "",
    play: "",   // FiveM connect link (set to "fivem://connect/<ip>:<port>")
  },

  hero: {
    /* دعم فيديو، صورة، أو fallback. اترك videoEffect فارغاً لاستخدام الصورة المتدرجة. */
    video: "",
    image: "",
    tagline: "YOUR STORY. YOUR RULES.",
    subtitle: "HOT PURSUIT is a professional FiveM roleplay server. Create your story, live by your rules, and be part of the city.",
  },

  jobs: [
    { id: "police", name: "Police", nameAr: "الشرطة", emoji: "🚔", desc: "Maintain law and order across the city.", descAr: "حافظ على النظام والقانون في المدينة.", requirements: ["18+", "Stable microphone", "Good English/Arabic"], features: ["Fair progression", "Specialized units", "Leadership paths"] },
    { id: "ems", name: "EMS", nameAr: "الإسعاف", emoji: "🚑", desc: "Save lives and respond to emergencies.", descAr: "أنقذ الأرواح واستجب للحالات الطارئة.", requirements: ["18+", "Stable microphone"], features: ["Medical training", "Response rewards"] },
    { id: "mechanic", name: "Mechanic", nameAr: "ميكانيكي", emoji: "🔧", desc: "Repair and customize the city's vehicles.", descAr: "أصلح وخصص مركبات المدينة.", requirements: ["Active in-game"], features: ["Workshop access", "Custom work"] },
    { id: "taxi", name: "Taxi", nameAr: "تاكسي", emoji: "🚕", desc: "Drive the city and earn through transport.", descAr: "قُد في المدينة واكسب من النقل.", requirements: ["Active in-game"], features: ["Fares & tips", "Fleet growth"] },
    { id: "business", name: "Business Owner", nameAr: "صاحب بيزنس", emoji: "🏢", desc: "Own and run a business in the city.", descAr: "امتلك وشغّل بيزنس في المدينة.", requirements: ["Business license"], features: ["Full ownership", "Staff management"] },
    { id: "gang", name: "Gang", nameAr: "عصابة", emoji: "💀", desc: "Build your crew and control territory.", descAr: "ابنِ طاقمك وتحكم في الأراضي.", requirements: ["Crew of 5+"], features: ["Gang inventory", "Wars & turf"] },
  ],

  applications: [
    { id: "police", name: "Police", nameAr: "الشرطة", emoji: "🚔", desc: "Join the law enforcement team.", descAr: "انضم لفريق إنفاذ القانون.", requirements: ["18+", "Stable microphone", "Clean record"] },
    { id: "ems", name: "EMS", nameAr: "الإسعاف", emoji: "🚑", desc: "Join the medical response team.", descAr: "انضم لفريق الاستجابة الطبية.", requirements: ["18+", "Stable microphone"] },
    { id: "staff", name: "Staff", nameAr: "الإدارة", emoji: "🛡️", desc: "Help manage and moderate the server.", descAr: "ساعد في إدارة ومراقبة السيرفر.", requirements: ["Veteran player", "Mature conduct"] },
    { id: "gang", name: "Gang", nameAr: "عصابة", emoji: "💀", desc: "Register your gang with the city.", descAr: "سجّل عصابتك لدى المدينة.", requirements: ["5+ members"] },
    { id: "business", name: "Business", nameAr: "بيزنس", emoji: "🏢", desc: "Apply for a business license.", descAr: "قدّم طلب رخصة بيزنس.", requirements: ["Clear business plan"] },
    { id: "creator", name: "Content Creator", nameAr: "صانع محتوى", emoji: "🎥", desc: "Get creator benefits for content.", descAr: "احصل على مميزات صناع المحتوى.", requirements: ["Active channel", "Good quality"] },
  ],

  /* قوانين عامة قابلة للتعديل — أقسام توسّع/تُطوى */
  rules: [
    { id: "general", name: "General Rules", nameAr: "القواعد العامة", list: [
      { en: "Respect all players and staff at all times.", ar: "احترم جميع اللاعبين والإدارة في كل الأوقات." },
      { en: "No toxicity, harassment, or hate speech.", ar: "ممنوع التطاول أو المضايقة أو خطاب الكراهية." },
      { en: "Follow staff instructions at all times.", ar: "اتبع تعليمات الإدارة في كل الأوقات." },
    ]},
    { id: "roleplay", name: "Roleplay Rules", nameAr: "قواعد الرول بلاي", list: [
      { en: "Stay in character while in the city.", ar: "التزم بالشخصية أثناء التواجد في المدينة." },
      { en: "No RDM or VDM without valid roleplay context.", ar: "ممنوع القتل أو الدهس العشوائي دون سياق رول بلاي." },
    ]},
    { id: "police", name: "Police Rules", nameAr: "قواعد الشرطة", list: [
      { en: "Follow proper pursuit and arrest procedures.", ar: "اتبع إجراءات المطاردة والاعتقال الصحيحة." },
    ]},
    { id: "ems", name: "EMS Rules", nameAr: "قواعد الإسعاف", list: [
      { en: "Respond to all emergency callouts fairly.", ar: "استجب لجميع النداءات الطارئة بعدل." },
    ]},
    { id: "criminal", name: "Criminal Rules", nameAr: "القواعد الجنائية", list: [
      { en: "Hostage and heist scenarios must have clear roleplay.", ar: "سيناريوهات الرهائن والسطو يجب أن تتسم برول بلاي واضح." },
    ]},
    { id: "gang", name: "Gang Rules", nameAr: "قواعد العصابات", list: [
      { en: "Registered gangs only for turf conflicts.", ar: "العصابات المسجلة فقط للصراع على الأراضي." },
    ]},
    { id: "staff", name: "Staff Rules", nameAr: "قواعد الإدارة", list: [
      { en: "Staff must remain neutral and professional.", ar: "يجب على الإدارة أن تبقى محايدة ومحترفة." },
    ]},
    { id: "business", name: "Business Rules", nameAr: "قواعد البيزنس", list: [
      { en: "Businesses must follow city economic rules.", ar: "يجب أن تتبع البيزنسات قواعد الاقتصاد المدينة." },
    ]},
  ],

  /* أخبار/تحديثات — قابل للتعديل من لوحة التحكم لاحقاً */
  news: [
    {
      title: "UPDATE 1.5",
      cover: "",
      date: "2026-08-30",
      tag: "update",
      excerpt: "New cars, new jobs, new features and bug fixes.",
      excerptAr: "عربيات جديدة، وظائف جديدة، مزايا جديدة وإصلاح أخطاء.",
      body: ["NEW CARS", "NEW JOBS", "NEW FEATURES", "BUG FIXES"],
      bodyAr: ["عربيات جديدة", "وظائف جديدة", "مزايا جديدة", "إصلاح أخطاء"],
      gallery: [],
      video: "",
    },
    {
      title: "WELCOME TO THE CITY",
      cover: "",
      date: "2026-08-01",
      tag: "news",
      excerpt: "HOT PURSUIT RP is officially live. Join the community today.",
      excerptAr: "سيرفر HOT PURSUIT RP انطلق رسمياً. انضم للمجتمع اليوم.",
      body: ["Server launched", "Community open", "Store live"],
      bodyAr: ["انطلاق السيرفر", "المجتمع مفتوح", "المتجر يعمل"],
      gallery: [],
      video: "",
    },
  ],

  social: [
    { id: "discord", name: "Discord", emoji: "💬", url: "https://discord.gg/REqWKXnrku", primary: true },
    { id: "tiktok", name: "TikTok", emoji: "🎵", url: "", primary: false },
    { id: "youtube", name: "YouTube", emoji: "▶️", url: "", primary: false },
    { id: "instagram", name: "Instagram", emoji: "📷", url: "", primary: false },
  ],

  /* بيانات لوحة الصدارة — dev placeholders، تُستبدل لاحقاً من API/DB */
  leaderboards: [
    { id: "mostplaytime", name: "Most Playtime", nameAr: "أكثر وقت لعب", list: [
      { name: "PlayerOne", value: "412h" },
      { name: "PlayerTwo", value: "388h" },
      { name: "PlayerThree", value: "355h" },
    ]},
    { id: "richest", name: "Richest Players", nameAr: "الأثرياء", list: [
      { name: "Tycoon", value: "$2.4M" },
      { name: "Boss", value: "$1.9M" },
      { name: "King", value: "$1.5M" },
    ]},
  ],

  faq: [
    { q: "How do I buy a product?", qAr: "كيف أشتري منتجاً؟", a: "Open the Store, select a product, accept the purchase rules, and you will be redirected to a Discord ticket to complete your purchase.", aAr: "افتح المتجر، اختر المنتج، وافق على قوانين الشراء، وسيتم توجيهك إلى تذكرة ديسكورد لإتمام عملية الشراء." },
    { q: "How do I join the server?", qAr: "كيف أنضم للسيرفر؟", a: "Copy the server IP and press Connect, then follow the connection instructions.", aAr: "انسخ آي بي السيرفر واضغط اتصال، ثم اتبع تعليمات الاتصال." },
    { q: "How do I get support?", qAr: "كيف أحصل على الدعم؟", a: "Join our Discord and open a support ticket in the support channel.", aAr: "انضم إلى الديسكورد وافتح تذكرة دعم في قناة الدعم." },
  ],
};
