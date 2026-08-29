/* ═══════════════════════════════════════════════════════════
   GitHub Config — إعدادات مستودع GitHub الخاص بموقعك
   ═══════════════════════════════════════════════════════════
   املأ البيانات دي بعد ما تعمل المستودع على GitHub:
   1) اعمل حساب على https://github.com
   2) اعمل مستودع جديد (New repository) — مثلاً اسمه: hot-store
   3) ارفع ملفات الموقع جوه المستودع (الروت مباشرة)
   4) شغّل GitHub Pages من المستودع:
      Settings → Pages → Source: Deploy from a branch → main → Save
   5) اعمل Personal Access Token (مهم للوحة التحكم):
      Settings → Developer settings → Personal access tokens
      → Tokens (classic) → Generate new token
      → فعّل صلاحية: repo (كلها) و user:email
      → انسخ التوكن (بيظهر مرة واحدة بس — احفظه في ورقة)

   ⚠️ سيب قيم owner/repo فاضيين لو مش هتستخدم لوحة التحكم
      — الموقع هيشتغل عادي من products.json المحلي.
   ═══════════════════════════════════════════════════════════ */
window.GH = {
  owner: "genral-coder",        // GitHub account owner (بدون @)
  repo: "HOT-PURSUIT-WEBSITE",  // repository name
  branch: "main",               // branch to read/write
  filePath: "products.json",    // products file path
};
