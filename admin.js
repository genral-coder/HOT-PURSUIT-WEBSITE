/* ═══════════════════════════════════════════════════════════
   HOT PURSUIT — Admin Panel (لوحة التحكم)
   ═══════════════════════════════════════════════════════════
   اللوحة دي بتعدّل على ملف products.json جوه مستودع GitHub
   باستخدام GitHub API — املأ github-config.js الأول.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const toast = (msg, ok = true) => {
    const t = $("toast");
    t.textContent = msg;
    t.classList.toggle("ok", ok);
    t.classList.add("show");
    clearTimeout(t._t);
    t._t = setTimeout(() => t.classList.remove("show"), 2600);
  };
  const err = (msg) => toast("❌ " + msg, false);

  const cfg = window.GH || {};

  /* ---------- التحقق من الإعدادات ---------- */
  if (!cfg.owner || !cfg.repo) {
    $("loginError").textContent =
      "GitHub is not configured. Open github-config.js and add your owner + repo.";
    $("loginError").hidden = false;
    $("loginBtn").disabled = true;
  }

  let token = "";
  let sha = null;          // SHA آخر نسخة من products.json (لازم للتحديث)
  let products = [];
  let editingId = null;

  const CAT_NAMES = { vehicles: "Vehicles", mlo: "Business", vip: "VIP", bundles: "Bundles" };
  const CAT_EMOJI = { vehicles: "🚗", mlo: "🏢", vip: "💎", bundles: "🎁" };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

  const api = (path, opts = {}) =>
    fetch("https://api.github.com" + path, {
      ...opts,
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      },
    });

  /* ---------- تسجيل الدخول (بالـ Token) ---------- */
  async function login(tok) {
    token = tok;
    try {
      const res = await api("/user");
      if (!res.ok) throw new Error("Invalid token (" + res.status + ")");
      const user = await res.json();
      if (cfg.adminUser && cfg.adminUser.toLowerCase() !== user.login.toLowerCase()) {
        throw new Error("This token does not belong to the admin account.");
      }
      sessionStorage.setItem("gh_token", token);
      enterDash();
      toast("Welcome, " + user.login + " ✓");
    } catch (e) {
      token = "";
      $("loginError").textContent = "Login failed: " + e.message;
      $("loginError").hidden = false;
    }
  }

  /* ---------- تحميل المنتجات من GitHub ---------- */
  async function loadProducts() {
    const path = encodeURIComponent(cfg.filePath);
    const url = `/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
    try {
      const res = await api(url + (sha ? "" : "?t=" + Date.now()), { cache: "no-store" });
      if (res.status === 404) {
        err("products.json not found in the repo. Upload it first.");
        return;
      }
      if (!res.ok) throw new Error("GitHub error (" + res.status + ")");
      const data = await res.json();
      sha = data.sha;
      const text = b64ToUtf8(data.content);
      products = JSON.parse(text);
      if (!Array.isArray(products)) throw new Error("products.json must be an array");
      renderTable();
    } catch (e) {
      err("Failed to load products: " + e.message);
    }
  }

  /* ---------- ترميز/فك ترميز صحيح لـ UTF-8 (عشان العربي) ---------- */
  function b64ToUtf8(b64) {
    const bin = atob(b64.replace(/\n/g, ""));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8").decode(bytes);
  }

  function utf8ToB64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  }

  /* ---------- حفظ المنتجات على GitHub ---------- */
  async function saveToGithub(message) {
    const content = utf8ToB64(JSON.stringify(products, null, 2));
    const body = {
      message: message || "Update products",
      content: content,
      branch: cfg.branch,
    };
    if (sha) body.sha = sha;
    const res = await api(`/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(cfg.filePath)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.message || "GitHub update failed (" + res.status + ")");
    }
    const data = await res.json();
    sha = data.content.sha;
  }

  /* ---------- الكروت ---------- */
  function renderTable() {
    const q = $("adminSearch").value.trim().toLowerCase();
    const cat = $("adminFilter").value;
    const list = products.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (q) {
        const hay = (p.name + " " + (p.nameAr || "") + " " + p.price + " " + (p.type || "")).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    $("adminEmpty").hidden = list.length > 0;
    const wrap = $("adminCards");
    wrap.innerHTML = "";
    list.forEach((p, i) => {
      wrap.appendChild(adminCard(p, i));
    });
    updateStats();
  }

  function adminCard(p, i) {
    const card = document.createElement("article");
    card.className = "a-card" + (p.sold ? " sold" : "");
    card.style.animationDelay = (i * 0.04) + "s";
    card.innerHTML = `
      <div class="a-img">
        ${thumb(p)}
        ${p.sold ? `<span class="p-badge sold">SOLD</span>` : ""}
        ${p.popular ? `<span class="p-badge popular">★</span>` : ""}
        ${p.new ? `<span class="p-badge new">NEW</span>` : ""}
      </div>
      <div class="a-body">
        <span class="a-cat">${CAT_EMOJI[p.category] || ""} ${esc(CAT_NAMES[p.category] || p.category)}</span>
        <h3>${esc(p.name)}</h3>
        ${p.nameAr ? `<span class="a-sub">${esc(p.nameAr)}</span>` : ""}
        <span class="a-price">${esc(p.price)}</span>
        <label class="a-sold"><input type="checkbox" data-sold="${p.id}" ${p.sold ? "checked" : ""} /> <span>Sold / مباع</span></label>
        <label class="a-sold"><input type="checkbox" data-new="${p.id}" ${p.new ? "checked" : ""} /> <span>New ✨</span></label>
        <div class="a-actions">
          <button class="btn-sm" data-edit="${p.id}">Edit</button>
          <button class="btn-sm danger" data-del="${p.id}">Delete</button>
        </div>
      </div>`;
    return card;
  }

  function thumb(p) {
    if (p.image) return `<img src="${esc(p.image)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />`;
    const emoji = CAT_EMOJI[p.category] || "📦";
    return `<div class="thumb-ph">${emoji}</div>`;
  }

  function updateStats() {
    const sold = products.filter((p) => p.sold).length;
    $("dashStats").innerHTML = `
      <div class="stat"><b>${products.length}</b><span>Products</span></div>
      <div class="stat"><b>${sold}</b><span>Sold</span></div>
      <div class="stat"><b>${products.filter((p) => p.popular).length}</b><span>Popular</span></div>
      <div class="stat"><b>${products.filter((p) => p.new).length}</b><span>New</span></div>`;
  }

  /* ---------- مودال التعديل ---------- */
  function openModal() { $("editModal").classList.add("open"); document.body.style.overflow = "hidden"; }
  function closeModal() {
    $("editModal").classList.remove("open");
    document.body.style.overflow = "";
    $("editError").hidden = true;
  }

  function editProduct(p) {
    editingId = p ? p.id : null;
    $("editTitle").textContent = p ? "Edit Product" : "Add Product";
    $("f_name").value = p ? p.name : "";
    $("f_nameAr").value = p ? p.nameAr || "" : "";
    $("f_category").value = p ? p.category : "vip";
    $("f_price").value = p ? p.price : "";
    $("f_type").value = p ? p.type || "" : "";
    $("f_class").value = p ? p.class || "" : "";
    $("f_short").value = p ? p.short || "" : "";
    $("f_shortAr").value = p ? p.shortAr || "" : "";
    $("f_desc").value = p ? p.description || "" : "";
    $("f_descAr").value = p ? p.descriptionAr || "" : "";
    $("f_features").value = p ? (p.features || []).join("\n") : "";
    $("f_featuresAr").value = p ? (p.featuresAr || []).join("\n") : "";
    $("f_image").value = p ? p.image || "" : "";
    $("f_sold").checked = p ? !!p.sold : false;
    $("f_popular").checked = p ? !!p.popular : false;
    $("f_new").checked = p ? !!p.new : false;
    $("f_imageFile").value = "";
    updatePreview();
    openModal();
    if (!p) $("f_name").focus();
  }

  function updatePreview() {
    const url = $("f_image").value.trim();
    const img = $("f_imagePreview");
    if (url) { img.src = url; img.hidden = false; }
    else img.hidden = true;
  }

  function formToProduct() {
    const splitLines = (v) => v.split("\n").map((s) => s.trim()).filter(Boolean);
    return {
      id: editingId,
      category: $("f_category").value,
      name: $("f_name").value.trim(),
      nameAr: $("f_nameAr").value.trim(),
      short: $("f_short").value.trim(),
      shortAr: $("f_shortAr").value.trim(),
      description: $("f_desc").value.trim(),
      descriptionAr: $("f_descAr").value.trim(),
      features: splitLines($("f_features").value),
      featuresAr: splitLines($("f_featuresAr").value),
      price: $("f_price").value.trim(),
      image: $("f_image").value.trim(),
      type: $("f_type").value || null,
      class: $("f_class").value || null,
      sold: $("f_sold").checked,
      popular: $("f_popular").checked,
      new: $("f_new").checked,
      likes: (() => {
        const old = editingId ? products.find((x) => x.id === editingId) : null;
        return old ? old.likes || 0 : 0;
      })(),
    };
  }

  /* ---------- رفع صورة إلى المستودع ---------- */
  async function uploadImage(file) {
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const name = "prod-" + Date.now() + "." + ext;
    const cat = $("f_category").value || "products";
    const path = "images/products/" + cat + "/" + name;
    const reader = new FileReader();
    const b64 = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const body = {
      message: "Upload product image: " + name,
      content: b64,
      branch: cfg.branch,
    };
    const res = await api(`/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(path)}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Image upload failed (" + res.status + ")");
    return path;
  }

  async function saveProduct(ev) {
    ev.preventDefault();
    const p = formToProduct();
    if (!p.name || !p.price) {
      $("editError").textContent = "Name and price are required.";
      $("editError").hidden = false;
      return;
    }
    const btn = $("editSave");
    btn.disabled = true;
    btn.textContent = "Saving...";
    try {
      const file = $("f_imageFile").files[0];
      if (file) {
        p.image = await uploadImage(file);
        $("f_image").value = p.image;
      }
      if (editingId) {
        const i = products.findIndex((x) => x.id === editingId);
        if (i >= 0) products[i] = p;
      } else {
        p.id = products.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
        products.push(p);
      }
      await saveToGithub(editingId ? "Update product " + p.name : "Add product " + p.name);
      closeModal();
      renderTable();
      toast(editingId ? "Product updated ✓ (published)" : "Product added ✓ (published)");
    } catch (e) {
      $("editError").textContent = e.message;
      $("editError").hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = "Save";
    }
  }

  async function deleteProduct(id) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    if (!confirm(`Delete "${p.name}"? This will publish the change.`)) return;
    try {
      products = products.filter((x) => x.id !== id);
      await saveToGithub("Delete product " + p.name);
      renderTable();
      toast("Product deleted ✓ (published)");
    } catch (e) {
      err(e.message);
    }
  }

  async function toggleSold(id, checked) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    p.sold = checked;
    try {
      await saveToGithub((checked ? "Mark sold: " : "Unmark sold: ") + p.name);
      renderTable();
      toast(checked ? "Marked as sold ✓ (published)" : "Marked as available ✓ (published)");
    } catch (e) {
      err(e.message);
    }
  }

  async function toggleNew(id, checked) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    p.new = checked;
    try {
      await saveToGithub((checked ? "Mark new: " : "Unmark new: ") + p.name);
      renderTable();
      toast(checked ? "Marked as new ✓ (published)" : "Removed from new ✓ (published)");
    } catch (e) {
      err(e.message);
    }
  }

  /* ---------- إعادة ترقيم ids (لو في تكرار) ---------- */
  function renumber() {
    products.forEach((p, i) => { p.id = i + 1; });
  }

  /* ---------- تنقل للوحة ---------- */
  function enterDash() {
    $("loginView").hidden = true;
    $("dashView").hidden = false;
    loadProducts();
  }

  function logout() {
    token = "";
    sessionStorage.removeItem("gh_token");
    location.reload();
  }

  /* ---------- الأحداث ---------- */
  $("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    login($("loginToken").value.trim());
  });

  $("logoutBtn").addEventListener("click", logout);

  $("adminSearch").addEventListener("input", renderTable);
  $("adminFilter").addEventListener("change", renderTable);

  $("addBtn").addEventListener("click", () => editProduct(null));
  $("editClose").addEventListener("click", closeModal);
  $("editCancel").addEventListener("click", closeModal);
  $("editForm").addEventListener("submit", saveProduct);
  $("f_image").addEventListener("input", updatePreview);

  document.addEventListener("click", (e) => {
    const sold = e.target.closest("[data-sold]");
    if (sold) { toggleSold(+sold.dataset.sold, sold.checked); return; }
    const nw = e.target.closest("[data-new]");
    if (nw) { toggleNew(+nw.dataset.new, nw.checked); return; }
    const ed = e.target.closest("[data-edit]");
    if (ed) {
      const p = products.find((x) => x.id === +ed.dataset.edit);
      if (p) editProduct(p);
      return;
    }
    const dl = e.target.closest("[data-del]");
    if (dl) { deleteProduct(+dl.dataset.del); return; }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  /* ---------- استعادة الجلسة ---------- */
  const saved = sessionStorage.getItem("gh_token");
  if (saved) login(saved);
})();
