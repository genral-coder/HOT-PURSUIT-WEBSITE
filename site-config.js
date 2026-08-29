/* ═══════════════════════════════════════════════════════════════
   HOT PURSUIT RP — Central Configuration (مركز الإعدادات الوحيد)
   ───────────────────────────────────────────────────────────────
   Single source of truth for the whole website. Edit THIS file only.
   Values are loaded into `window.SITE` and used across script.js.

   ⚠️  NO FAKE DATA RULE:
   Real server values (players, IP, uptime, version, news, leaderboards)
   must NOT be presented as real. Anything not yet connected to a live
   source is marked dev/demo and rendered as clearly-marked sample data,
   or using configurable placeholders in site-config.js.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  window.SITE = {

    /* ---------- Meta / SEO ---------- */
    meta: {
      title: "HOT PURSUIT RP | FiveM Roleplay Server",
      description: "HOT PURSUIT RP is a premium FiveM roleplay city. Create your story, live by your rules. Join the server, browse the store, apply to departments and join our community.",
      url: "https://genral-coder.github.io/HOT-PURSUIT-WEBSITE/",
      image: "images/Asset_2.webp",
      imageAbsolute: "https://genral-coder.github.io/HOT-PURSUIT-WEBSITE/images/Asset_2.webp",
      themeColor: "#0b0b0e",
    },

    /* ---------- Server identity ---------- */
    brand: {
      name: "HOT PURSUIT",
      logo: "images/Asset_2.webp",
      logoFallbackText: "HP",
    },

    /* ---------- Server / FiveM data ----------
       The GUI shows real-style values ONLY from here.
       Until a live FiveM API is connected, keep `mock: true` so the UI
       labels this data as "DEMO". Set `mock: false` + real values to go live.
    */
    server: {
      mock: true,                 // true → UI shows DEV/DEMO badge on status
      online: true,
      name: "HOT PURSUIT RP",
      description: "HOT PURSUIT RP is a premium FiveM roleplay experience where your choices shape your story. Create depth, build reputation, and write your own story in the city.",
      tagline: "YOUR STORY. YOUR RULES.",
      ip: "connect.example.com",          // TODO: replace with real server IP
      port: "30120",
      ipFull: "connect.example.com:30120",// TODO: replace with real address
      playersOnline: 0,                   // TODO: wired to live API
      playerLimit: 200,
      version: "1.5.0",                   // TODO: replace with real version
      lastRestart: "—",                   // TODO: real value
      uptime: "—",                        // TODO: real value
      region: "Global / MENA",            // TODO: real region
    },

    /* ---------- Links (leave "" to hide the platform) ---------- */
    links: {
      discord: "https://discord.gg/REqWKXnrku",   // TODO: replace with real invite
      discordTicket: "discord://-/channels/1341426480827203584/1341516123123744881",
      play: "",               // e.g. "fivem://connect/1.2.3.4:30120"
      tiktok: "",
      youtube: "",
      instagram: "",
      twitter: "",
      twitch: "",
    },

    /* ---------- Cinematic Hero ----------
       Video first, image fallback, then gradient fallback.
       Leave `video` and `image` empty to use the built-in gradient + glow.
    */
    hero: {
      video: "",                        // e.g. "media/hero.mp4" (self-hosted)
      image: "",                        // e.g. "images/hero.jpg"
      title: "YOUR STORY. YOUR RULES.",
      subtitle: "A premium FiveM roleplay experience where your choices shape your story. Build your reputation, join a department, and live the life you choose.",
      buttonPrimary: "PLAY NOW",
      buttonSecondary: "JOIN DISCORD",
    },

    /* ---------- Home: Why choose HOT PURSUIT ---------- */
    whyUs: [
      { icon: "🎭", title: "Deep Roleplay",     titleAr: "رول بلاي عميق",     text: "Meaningful scenarios, immersive jobs and a living economy that reward how you play.", textAr: "سيناريوهات هادفة ووظائف غامرة واقتصاد حي يكافئ طريقة لعبك." },
      { icon: "⚖️", title: "Fair Staff",        titleAr: "إدارة عادلة",       text: "A professional, transparent team that keeps the city fair for everyone.", textAr: "فريق محترف وشفاف يحافظ على عدالة المدينة للجميع." },
      { icon: "🚔", title: "Career Jobs",        titleAr: "وظائف مهنية",       text: "Police, EMS, gangs, business owners and more — climb every career path.", textAr: "شرطة، إسعاف، عصابات، أصحاب بيزنسات وغيرها — تصدّر في كل مسار." },
      { icon: "🛒", title: "In-Game Store",      titleAr: "متجر داخل اللعبة",   text: "Vehicles, businesses, VIP perks and bundles delivered straight in-game.", textAr: "عربيات، بيزنسات، مميزات VIP وباقات تُسلم داخل اللعبة مباشرة." },
      { icon: "🎮", title: "Optimized",          titleAr: "أداء محسّن",         text: "A stable, optimized city built for smooth performance.", textAr: "مدينة مستقرة ومحسّنة لأداء سلس." },
      { icon: "💬", title: "Active Community",   titleAr: "مجتمع نشط",          text: "A friendly community and fast support, always around in Discord.", textAr: "مجتمع ودود ودعم سريع متواجد دائماً في الديسكورد." },
    ],

    /* ---------- Home: Server features (showcase) ---------- */
    features: [
      { icon: "🏙️", title: "Immersive City",    titleAr: "مدينة غامرة",       text: "Custom MLOs, interiors and businesses across the map.", textAr: "MLOs ومباني وبيزنسات مخصصة في أرجاء الخريطة." },
      { icon: "👔", title: "Department System",  titleAr: "نظام الأقسام",       text: "Police, EMS, mechanics, taxi and more with real progression.", textAr: "شرطة، إسعاف، ميكانيكا، تاكسي وغيرها بتدرّج حقيقي." },
      { icon: "💰", title: "Living Economy",     titleAr: "اقتصاد حي",          text: "Jobs, businesses and a balanced economy.", textAr: "وظائف وبيزنسات واقتصاد متوازن." },
      { icon: "🔒", title: "Fair Whitelist",     titleAr: "وايت ليست عادل",     text: "Clean applications and a safe, moderated environment.", textAr: "تقديمات نظيفة وبيئة آمنة ومُراقبة." },
    ],

    /* ---------- Jobs / Departments (used on Server + Home) ---------- */
    jobs: [
      { id: "police", name: "Police", nameAr: "الشرطة", emoji: "🚔", desc: "Maintain law and order across the city.", descAr: "حافظ على النظام والقانون في المدينة.", requirements: ["18+", "Stable microphone", "Good English/Arabic"], features: ["Fair progression", "Specialized units", "Leadership paths"] },
      { id: "ems", name: "EMS", nameAr: "الإسعاف", emoji: "🚑", desc: "Save lives and respond to emergencies.", descAr: "أنقذ الأرواح واستجب للحالات الطارئة.", requirements: ["18+", "Stable microphone"], features: ["Medical training", "Response rewards"] },
      { id: "mechanic", name: "Mechanic", nameAr: "ميكانيكي", emoji: "🔧", desc: "Repair and customize the city's vehicles.", descAr: "أصلح وخصص مركبات المدينة.", requirements: ["Active in-game"], features: ["Workshop access", "Custom work"] },
      { id: "taxi", name: "Taxi", nameAr: "تاكسي", emoji: "🚕", desc: "Drive the city and earn through transport.", descAr: "قُد في المدينة واكسب من النقل.", requirements: ["Active in-game"], features: ["Fares & tips", "Fleet growth"] },
      { id: "business", name: "Business Owner", nameAr: "صاحب بيزنس", emoji: "🏢", desc: "Own and run a business in the city.", descAr: "امتلك وشغّل بيزنس في المدينة.", requirements: ["Business license"], features: ["Full ownership", "Staff management"] },
      { id: "gang", name: "Gang", nameAr: "عصابة", emoji: "💀", desc: "Build your crew and control territory.", descAr: "ابنِ طاقمك وتحكم في الأراضي.", requirements: ["Crew of 5+"], features: ["Gang inventory", "Wars & turf"] },
    ],

    /* ---------- Applications (frontend only; backend later) ---------- */
    applications: [
      { id: "police", name: "Police", nameAr: "الشرطة", emoji: "🚔", desc: "Join the law enforcement team.", descAr: "انضم لفريق إنفاذ القانون.", requirements: ["18+", "Stable microphone", "Clean record"] },
      { id: "ems", name: "EMS", nameAr: "الإسعاف", emoji: "🚑", desc: "Join the medical response team.", descAr: "انضم لفريق الاستجابة الطبية.", requirements: ["18+", "Stable microphone"] },
      { id: "staff", name: "Staff", nameAr: "الإدارة", emoji: "🛡️", desc: "Help manage and moderate the server.", descAr: "ساعد في إدارة ومراقبة السيرفر.", requirements: ["Veteran player", "Mature conduct"] },
      { id: "gang", name: "Gang", nameAr: "عصابة", emoji: "💀", desc: "Register your gang with the city.", descAr: "سجّل عصابتك لدى المدينة.", requirements: ["5+ members"] },
      { id: "business", name: "Business", nameAr: "بيزنس", emoji: "🏢", desc: "Apply for a business license.", descAr: "قدّم طلب رخصة بيزنس.", requirements: ["Clear business plan"] },
      { id: "creator", name: "Content Creator", nameAr: "صانع محتوى", emoji: "🎥", desc: "Get creator benefits for content.", descAr: "احصل على مميزات صناع المحتوى.", requirements: ["Active channel", "Good quality"] },
    ],

    /* ---------- Server Rules ---------- */
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

    /* ---------- News — sample/dev content until configured ---------- */
    news: [
      {
        title: "UPDATE 1.5",
        cover: "",
        date: "2026-08-30",
        tag: "update",
        sample: true,               // marks this as sample/development content
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
        sample: true,               // marks this as sample/development content
        excerpt: "HOT PURSUIT RP is officially live. Join the community today.",
        excerptAr: "سيرفر HOT PURSUIT RP انطلق رسمياً. انضم للمجتمع اليوم.",
        body: ["Server launched", "Community open", "Store live"],
        bodyAr: ["انطلاق السيرفر", "المجتمع مفتوح", "المتجر يعمل"],
        gallery: [],
        video: "",
      },
    ],

    /* ---------- Social (empty url hides the platform) ---------- */
    social: [
      { id: "discord", name: "Discord", emoji: "💬", url: "https://discord.gg/REqWKXnrku", primary: true },
      { id: "tiktok", name: "TikTok", emoji: "🎵", url: "", primary: false },
      { id: "youtube", name: "YouTube", emoji: "▶️", url: "", primary: false },
      { id: "instagram", name: "Instagram", emoji: "📷", url: "", primary: false },
    ],

    /* ---------- Media (configurable; empty hides a tab) ---------- */
    media: {
      screenshots: [],
      videos: [],
    },

    /* ---------- Leaderboards — dev/demo until connected to live data ---------- */
    leaderboardMock: true,
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

    /* ---------- FAQ ---------- */
    faq: [
      { q: "How do I buy a product?", qAr: "كيف أشتري منتجاً؟", a: "Open the Store, select a product, accept the purchase rules, and you will be redirected to a Discord ticket to complete your purchase.", aAr: "افتح المتجر، اختر المنتج، وافق على قوانين الشراء، وسيتم توجيهك إلى تذكرة ديسكورد لإتمام عملية الشراء." },
      { q: "How do I join the server?", qAr: "كيف أنضم للسيرفر؟", a: "Copy the server IP and press Connect, then follow the connection instructions.", aAr: "انسخ آي بي السيرفر واضغط اتصال، ثم اتبع تعليمات الاتصال." },
      { q: "How do I get support?", qAr: "كيف أحصل على الدعم؟", a: "Join our Discord and open a support ticket in the support channel.", aAr: "انضم إلى الديسكورد وافتح تذكرة دعم في قناة الدعم." },
    ],
  };
})();
