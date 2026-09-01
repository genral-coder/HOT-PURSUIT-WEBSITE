/**
 * HOT PURSUIT RP — Public site content (migrated verbatim from the legacy
 * site-config.js so no public-facing content is lost).
 *
 * This is the single source of truth for static public content. Backend-driven
 * systems (news CMS, media CMS, live leaderboards, FiveM status) hook in later
 * by replacing/feeding these arrays — the pages only consume these interfaces.
 */
import type {
  ApplicationOffer,
  FaqItem,
  Job,
  NewsPost,
  RuleCategory,
  SiteFeature,
  SocialLink,
  WhyUsCard,
} from "@hotpursuit/types";

/* ── Home: Why choose HOT PURSUIT ─────────────────────────────── */
export const whyUs: WhyUsCard[] = [
  { icon: "🎭", title: "Deep Roleplay", titleAr: "رول بلاي عميق", text: "Meaningful scenarios, immersive jobs and a living economy that reward how you play.", textAr: "سيناريوهات هادفة ووظائف غامرة واقتصاد حي يكافئ طريقة لعبك." },
  { icon: "⚖️", title: "Fair Staff", titleAr: "إدارة عادلة", text: "A professional, transparent team that keeps the city fair for everyone.", textAr: "فريق محترف وشفاف يحافظ على عدالة المدينة للجميع." },
  { icon: "🚔", title: "Career Jobs", titleAr: "وظائف مهنية", text: "Police, EMS, gangs, business owners and more — climb every career path.", textAr: "شرطة، إسعاف، عصابات، أصحاب بيزنسات وغيرها — تصدّر في كل مسار." },
  { icon: "🛒", title: "In-Game Store", titleAr: "متجر داخل اللعبة", text: "Vehicles, businesses, VIP perks and bundles delivered straight in-game.", textAr: "عربيات، بيزنسات، مميزات VIP وباقات تُسلم داخل اللعبة مباشرة." },
  { icon: "🎮", title: "Optimized", titleAr: "أداء محسّن", text: "A stable, optimized city built for smooth performance.", textAr: "مدينة مستقرة ومحسّنة لأداء سلس." },
  { icon: "💬", title: "Active Community", titleAr: "مجتمع نشط", text: "A friendly community and fast support, always around in Discord.", textAr: "مجتمع ودود ودعم سريع متواجد دائماً في الديسكورد." },
];

/* ── Home: Server features (showcase) ─────────────────────────── */
export const features: SiteFeature[] = [
  { icon: "🏙️", title: "Immersive City", titleAr: "مدينة غامرة", text: "Custom MLOs, interiors and businesses across the map.", textAr: "MLOs ومباني وبيزنسات مخصصة في أرجاء الخريطة." },
  { icon: "👔", title: "Department System", titleAr: "نظام الأقسام", text: "Police, EMS, mechanics, taxi and more with real progression.", textAr: "شرطة، إسعاف، ميكانيكا، تاكسي وغيرها بتدرّج حقيقي." },
  { icon: "💰", title: "Living Economy", titleAr: "اقتصاد حي", text: "Jobs, businesses and a balanced economy.", textAr: "وظائف وبيزنسات واقتصاد متوازن." },
  { icon: "🔒", title: "Fair Whitelist", titleAr: "وايت ليست عادل", text: "Clean applications and a safe, moderated environment.", textAr: "تقديمات نظيفة وبيئة آمنة ومُراقبة." },
];

/* ── Jobs / Departments (Server + Home) ───────────────────────── */
export const jobs: Job[] = [
  { id: "police", name: "Police", nameAr: "الشرطة", emoji: "🚔", desc: "Maintain law and order across the city.", descAr: "حافظ على النظام والقانون في المدينة.", requirements: ["18+", "Stable microphone", "Good English/Arabic"], features: ["Fair progression", "Specialized units", "Leadership paths"] },
  { id: "ems", name: "EMS", nameAr: "الإسعاف", emoji: "🚑", desc: "Save lives and respond to emergencies.", descAr: "أنقذ الأرواح واستجب للحالات الطارئة.", requirements: ["18+", "Stable microphone"], features: ["Medical training", "Response rewards"] },
  { id: "mechanic", name: "Mechanic", nameAr: "ميكانيكي", emoji: "🔧", desc: "Repair and customize the city's vehicles.", descAr: "أصلح وخصص مركبات المدينة.", requirements: ["Active in-game"], features: ["Workshop access", "Custom work"] },
  { id: "taxi", name: "Taxi", nameAr: "تاكسي", emoji: "🚕", desc: "Drive the city and earn through transport.", descAr: "قُد في المدينة واكسب من النقل.", requirements: ["Active in-game"], features: ["Fares & tips", "Fleet growth"] },
  { id: "business", name: "Business Owner", nameAr: "صاحب بيزنس", emoji: "🏢", desc: "Own and run a business in the city.", descAr: "امتلك وشغّل بيزنس في المدينة.", requirements: ["Business license"], features: ["Full ownership", "Staff management"] },
  { id: "gang", name: "Gang", nameAr: "عصابة", emoji: "💀", desc: "Build your crew and control territory.", descAr: "ابنِ طاقمك وتحكم في الأراضي.", requirements: ["Crew of 5+"], features: ["Gang inventory", "Wars & turf"] },
];

/* ── Applications (frontend, real categories; submission later) ── */
export const applications: ApplicationOffer[] = [
  { id: "police", name: "Police", nameAr: "الشرطة", emoji: "🚔", desc: "Join the law enforcement team.", descAr: "انضم لفريق إنفاذ القانون.", requirements: ["18+", "Stable microphone", "Clean record"] },
  { id: "ems", name: "EMS", nameAr: "الإسعاف", emoji: "🚑", desc: "Join the medical response team.", descAr: "انضم لفريق الاستجابة الطبية.", requirements: ["18+", "Stable microphone"] },
  { id: "staff", name: "Staff", nameAr: "الإدارة", emoji: "🛡️", desc: "Help manage and moderate the server.", descAr: "ساعد في إدارة ومراقبة السيرفر.", requirements: ["Veteran player", "Mature conduct"] },
  { id: "gang", name: "Gang", nameAr: "عصابة", emoji: "💀", desc: "Register your gang with the city.", descAr: "سجّل عصابتك لدى المدينة.", requirements: ["5+ members"] },
  { id: "business", name: "Business", nameAr: "بيزنس", emoji: "🏢", desc: "Apply for a business license.", descAr: "قدّم طلب رخصة بيزنس.", requirements: ["Clear business plan"] },
  { id: "creator", name: "Content Creator", nameAr: "صانع محتوى", emoji: "🎥", desc: "Get creator benefits for content.", descAr: "احصل على مميزات صناع المحتوى.", requirements: ["Active channel", "Good quality"] },
];

/* ── Server Rules ─────────────────────────────────────────────── */
export const rules: RuleCategory[] = [
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
];

/* ── News (dev/sample content — marked sample; real content later) ── */
export const newsPosts: NewsPost[] = [
  {
    title: "UPDATE 1.5",
    date: "2026-08-30",
    tag: "update",
    sample: true,
    excerpt: "New cars, new jobs, new features and bug fixes.",
    excerptAr: "عربيات جديدة، وظائف جديدة، مزايا جديدة وإصلاح أخطاء.",
    body: ["NEW CARS", "NEW JOBS", "NEW FEATURES", "BUG FIXES"],
    bodyAr: ["عربيات جديدة", "وظائف جديدة", "مزايا جديدة", "إصلاح أخطاء"],
    gallery: [],
    video: "",
  },
  {
    title: "WELCOME TO THE CITY",
    date: "2026-08-01",
    tag: "news",
    sample: true,
    excerpt: "HOT PURSUIT RP is officially live. Join the community today.",
    excerptAr: "سيرفر HOT PURSUIT RP انطلق رسمياً. انضم للمجتمع اليوم.",
    body: ["Server launched", "Community open", "Store live"],
    bodyAr: ["انطلاق السيرفر", "المجتمع مفتوح", "المتجر يعمل"],
    gallery: [],
    video: "",
  },
];

/* ── FAQ (Support) ────────────────────────────────────────────── */
export const faq: FaqItem[] = [
  { q: "How do I buy a product?", qAr: "كيف أشتري منتجاً؟", a: "Open the Store, select a product, accept the purchase rules, and you will be redirected to a Discord ticket to complete your purchase.", aAr: "افتح المتجر، اختر المنتج، وافق على قوانين الشراء، وسيتم توجيهك إلى تذكرة ديسكورد لإتمام عملية الشراء." },
  { q: "How do I join the server?", qAr: "كيف أنضم للسيرفر؟", a: "Copy the server IP and press Connect, then follow the connection instructions.", aAr: "انسخ آي بي السيرفر واضغط اتصال، ثم اتبع تعليمات الاتصال." },
  { q: "How do I get support?", qAr: "كيف أحصل على الدعم؟", a: "Join our Discord and open a support ticket in the support channel.", aAr: "انضم إلى الديسكورد وافتح تذكرة دعم في قناة الدعم." },
];

/* ── Social / Community platforms ─────────────────────────────── */
export const socialLinks: SocialLink[] = [
  { id: "discord", name: "Discord", emoji: "💬", url: "", primary: true },
  { id: "tiktok", name: "TikTok", emoji: "🎵", url: "", primary: false },
  { id: "youtube", name: "YouTube", emoji: "▶️", url: "", primary: false },
  { id: "instagram", name: "Instagram", emoji: "📷", url: "", primary: false },
];
