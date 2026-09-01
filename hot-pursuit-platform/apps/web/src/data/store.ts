/**
 * HOT PURSUIT RP — Store metadata (migrated verbatim from the legacy
 * script.js: categories, business types, vehicle classes, purchase rules,
 * vehicle rules and payment methods).
 */
import type {
  BusinessType,
  Category,
  LocalizedRule,
  PaymentMethod,
  ProductCategoryId,
  VehicleClass,
} from "@hotpursuit/types";

export const categories: Category[] = [
  { id: "vehicles", name: "Vehicles", nameAr: "المركبات", emoji: "🚗", color: "#ff2d3f" },
  { id: "mlo", name: "Business", nameAr: "بيزنس", emoji: "🏢", color: "#4da6ff" },
  { id: "vip", name: "VIP", nameAr: "VIP", emoji: "💎", color: "#ffc24b" },
  { id: "bundles", name: "Bundles", nameAr: "الباقات", emoji: "🎁", color: "#b26bff" },
];

export const businessTypes: BusinessType[] = [
  { id: "restaurant", name: "Restaurants", nameAr: "المطاعم", emoji: "🍽️" },
  { id: "mechanic", name: "Mechanics", nameAr: "الميكانيكا", emoji: "🔧" },
  { id: "dealership", name: "Dealerships", nameAr: "المعارض", emoji: "🚗" },
  { id: "nightclub", name: "Nightclubs", nameAr: "النوادي الليلية", emoji: "🕺" },
  { id: "cafe", name: "Cafes", nameAr: "الكافيهات", emoji: "☕" },
  { id: "hotel", name: "Hotels", nameAr: "الفنادق", emoji: "🏨" },
];

export const vehicleClasses: VehicleClass[] = [
  { id: "S", monthly: "20$", season: "100$", color: "#ff8a00" },
  { id: "S+", monthly: "25$", season: "150$", color: "#e63a00" },
  { id: "S++", monthly: "30$", season: "200$", color: "#ff2d3f" },
  { id: "X", monthly: "40$", season: "250$", color: "#b26bff" },
];

export const purchaseRules: LocalizedRule[] = [
  { en: "All purchases are non-refundable in case if no issues with our end.", ar: "جميع المشتريات غير قابلة للاسترداد في حال عدم وجود أي مشكلة من طرفنا." },
  { en: "Purchases are either Monthly, Quarterly, or per season.", ar: "تكون المشتريات إما شهرية، أو ربع سنوية، أو لكل موسم." },
  { en: "Purchases made per season have special discounts.", ar: "المشتريات الخاصة بالموسم تتضمن خصومات مميزة." },
  { en: "No Pay-to-Win. Our store is designed to enhance your experience while maintaining fair and enjoyable gameplay for everyone.", ar: "لا يوجد نظام الدفع للفوز (Pay-to-Win)، حيث تم تصميم متجرنا لتحسين تجربتكم مع الحفاظ على أسلوب لعب عادل وممتع للجميع." },
  { en: "Store packages do not exempt you from the rules. All players, including supporters, must follow the server rules at all times.", ar: "الحصول على باقات المتجر لا يعفيك من الالتزام بالقوانين. يجب على جميع اللاعبين، بما فيهم الداعمون، الالتزام بقوانين السيرفر في جميع الأوقات." },
  { en: "Abuse of purchased packages may result in their removal. Exploiting or using packages to disrupt gameplay can lead to punishment without compensation.", ar: "إساءة استخدام الباقات المشتراة قد يؤدي إلى سحبها. كما أن استغلال الباقات أو استخدامها لتعطيل تجربة اللعب قد يترتب عليه عقوبات دون أي تعويض." },
  { en: "Package contents may change. To keep the server balanced, we reserve the right to adjust or modify package contents at any time.", ar: "محتويات الباقات قابلة للتغيير. وللحفاظ على توازن السيرفر، نحتفظ بحق تعديل أو تغيير محتويات الباقات في أي وقت." },
  { en: "Purchased delivery time will change based on the package purchased without exceeding 1 week as a maximum.", ar: "تختلف مدة تسليم المشتريات حسب نوع الباقة، على ألا تتجاوز أسبوعًا واحدًا كحد أقصى." },
  { en: "Need help? If you experience any issues with your purchase, contact our support team through Tickets, and we'll be happy to assist you.", ar: "تحتاج إلى مساعدة؟ إذا واجهت أي مشكلة في مشترياتك، يرجى التواصل مع فريق الدعم عبر التذاكر (Tickets)، وسيسعدنا مساعدتك." },
  { en: "Rules are subject to change so please be aware of any notifications made on this channel.", ar: "القوانين قابلة للتغيير، لذا يرجى متابعة أي إشعارات أو تحديثات يتم نشرها في هذه القناة." },
];

export const vehicleRules: LocalizedRule[] = [
  { en: "Any purchased vehicle will follow its class and server handling rules.", ar: "أي مركبة يتم شراؤها ستخضع لفئتها (Class) وقواعد الهاندلينج (Handling) المعتمدة في السيرفر." },
  { en: "1 of 1 vehicles are agreed on their prices and models within a donation ticket.", ar: "يتم الاتفاق على سعر وموديل المركبات الحصرية (1of1) من خلال تذكرة تبرع (Donation Ticket)." },
];

export const paymentMethods: PaymentMethod[] = [
  {
    id: "bank",
    name: "Bank Transfer",
    nameAr: "تحويل بنكي",
    icon:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10h18M4 21V10M9 21V10M15 21V10M20 21V10"/><path d="M3 6l9-3 9 3"/><path d="M2 21h20"/></svg>',
  },
  {
    id: "instapay",
    name: "Instapay",
    nameAr: "انستا باي",
    icon:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3.2"/></svg>',
  },
  {
    id: "vodafone",
    name: "Vodafone Cash",
    nameAr: "فودافون كاش",
    icon:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2.5"/><path d="M11 18h2"/></svg>',
  },
  {
    id: "paypal",
    name: "PayPal",
    nameAr: "باي بال",
    icon:
      '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 21 8.9 13h4.3c2.9 0 4.6-1.3 5.2-3.9.5-2.2-.3-3.9-2.3-4.8C15.6 4 13.5 4 11 4H6.7L4.5 21h3z"/></svg>',
  },
  {
    id: "crypto",
    name: "Crypto",
    nameAr: "كريبتو",
    icon:
      '<svg viewBox="0 0 24 24" fill="currentColor"><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-size="21" font-family="Arial, sans-serif" font-weight="700">₿</text></svg>',
  },
];

export const categoryMap: Record<ProductCategoryId, Category> = Object.fromEntries(
  categories.map((c) => [c.id, c]),
) as Record<ProductCategoryId, Category>;

export const businessTypeMap: Record<string, BusinessType> = Object.fromEntries(
  businessTypes.map((b) => [b.id, b]),
);

export const vehicleClassMap: Record<string, VehicleClass> = Object.fromEntries(
  vehicleClasses.map((v) => [v.id, v]),
);
