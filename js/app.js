/* ============================================================
   app.js — logika website (bahasa, data, keranjang, form)
   Owner tidak perlu mengubah file ini.
   ============================================================ */
(function () {
  "use strict";
  const S = window.SITE, DICT = window.T;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const yen = (n) => "¥" + Number(n || 0).toLocaleString("ja-JP");
  const jget = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch (e) { return d; } };
  const jset = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  /* ---------- bahasa ---------- */
  let lang = localStorage.getItem("lang") || ((navigator.language || "").startsWith("ja") ? "jp" : "en");
  const listeners = [];
  const onLang = (fn) => listeners.push(fn);
  const t = (k) => (DICT[k] ? DICT[k][lang] || DICT[k].en : k);
  const L = (o, f) => (o[f + "_" + lang] || o[f + "_en"] || "");
  function setLang(l) {
    lang = l; try { localStorage.setItem("lang", l); } catch (e) {}
    document.documentElement.lang = l === "jp" ? "ja" : "en";
    $$(".lang button").forEach((b) => b.classList.toggle("on", b.dataset.l === l));
    applyI18n(); listeners.forEach((f) => f());
  }
  function applyI18n(root = document) {
    $$("[data-i18n]", root).forEach((e) => (e.textContent = t(e.dataset.i18n)));
    $$("[data-i18n-ph]", root).forEach((e) => (e.placeholder = t(e.dataset.i18nPh)));
    $$("[data-brand]", root).forEach((e) => (e.textContent = lang === "jp" ? S.BRAND_JP : S.BRAND_EN));
    const ti = document.body.dataset.title;
    document.title = (ti ? t(ti) + " | " : "") + (lang === "jp" ? S.BRAND_JP : S.BRAND_EN);
  }

  /* ---------- data (Google Sheets via Apps Script, atau file JSON lokal) ---------- */
  async function getData(name) {
    const ck = "d_" + name;
    const cached = sessionStorage.getItem(ck);
    if (cached) { try { return JSON.parse(cached); } catch (e) {} }
    let data = null;
    if (S.API_URL) {
      try {
        const r = await fetch(S.API_URL + "?action=" + name);
        const j = await r.json();
        if (j && j.ok) data = j.data;
      } catch (e) { console.warn("API gagal, memakai data lokal:", name); }
    }
    if (!data) {
      try { data = await (await fetch("data/" + name + ".json")).json(); } catch (e) { data = []; }
    }
    try { sessionStorage.setItem(ck, JSON.stringify(data)); } catch (e) {}
    return data;
  }
  const visible = (a) => a.filter((x) => String(x.status || "TRUE").toUpperCase() !== "FALSE" && String(x.status).toLowerCase() !== "hidden");

  /* teks dari tab Pages menimpa teks bawaan */
  async function loadOverrides() {
    const rows = await getData("pages");
    (rows || []).forEach((r) => { if (r.key) DICT[r.key] = { en: r.text_en || (DICT[r.key] && DICT[r.key].en) || "", jp: r.text_jp || (DICT[r.key] && DICT[r.key].jp) || "" }; });
  }

  /* ---------- gambar placeholder (muncul jika foto belum diisi) ---------- */
  const PAL = [["#2B3A55", "#41567f"], ["#8E2F3A", "#b04a55"], ["#4a5a48", "#71866d"], ["#5b4a3a", "#8a7258"], ["#34495e", "#5f7f9c"], ["#6b4a62", "#92708a"]];
  function ph(seed) {
    let h = 0; String(seed).split("").forEach((c) => (h = (h * 31 + c.charCodeAt(0)) >>> 0));
    const [a, b] = PAL[h % PAL.length];
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500'><defs><pattern id='p' width='40' height='20' patternUnits='userSpaceOnUse'><rect width='40' height='20' fill='${a}'/><g fill='none' stroke='${b}' stroke-width='1.2'><circle cx='20' cy='20' r='19'/><circle cx='20' cy='20' r='14'/><circle cx='20' cy='20' r='9'/><circle cx='0' cy='10' r='19'/><circle cx='0' cy='10' r='14'/><circle cx='0' cy='10' r='9'/><circle cx='40' cy='10' r='19'/><circle cx='40' cy='10' r='14'/><circle cx='40' cy='10' r='9'/></g></pattern></defs><rect width='400' height='500' fill='url(#p)'/></svg>`;
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  const img = (url, seed) => url || ph(seed);
  const drive = (u) => { // ubah link Google Drive biasa menjadi link gambar langsung
    const m = String(u || "").match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/);
    return m ? "https://lh3.googleusercontent.com/d/" + m[1] : u;
  };
  const pic = (url, seed) => img(drive(url), seed);

  /* ---------- header, footer, drawer, lightbox ---------- */
  const NAV = [["index.html", "nav_home"], ["brand.html", "nav_brand"], ["philosophy.html", "nav_philosophy"], ["gallery.html", "nav_gallery"], ["shop.html", "nav_shop"], ["kaitori.html", "nav_kaitori"], ["blog.html", "nav_blog"], ["contact.html", "nav_contact"]];
  function chrome() {
    const cur = location.pathname.split("/").pop() || "index.html";
    const links = NAV.map(([h, k]) => `<a href="${h}" class="${h === cur ? "on" : ""}" data-i18n="${k}"></a>`).join("");
    $("#hdr").innerHTML = `<header class="site"><div class="wrap bar">
      <a class="logo" href="index.html"><img class="logo-img" src="images/logo.png" alt="" onload="this.parentNode.classList.add('has-img')" onerror="this.remove()"><span data-brand></span><small>${esc(S.TAGLINE_EN || "")}</small></a>
      <nav class="main" id="nav">${links}</nav>
      <div class="tools"><div class="lang"><button data-l="en">EN</button><button data-l="jp">日本語</button></div>
      <button class="cart-btn" id="cartBtn" aria-label="cart">🛍<b id="cartN">0</b></button><button class="burger" id="burger" aria-label="menu">☰</button></div></div></header>`;
    $("#ftr").innerHTML = `<footer class="site"><div class="wrap"><div class="cols">
      <div><h4 data-brand></h4><p>${esc(S.EMAIL)}</p><p data-i18n="hours"></p></div>
      <div><h4 data-i18n="f_explore"></h4>${NAV.slice(1, 5).map(([h, k]) => `<a href="${h}" data-i18n="${k}"></a>`).join("")}</div>
      <div><h4 data-i18n="f_info"></h4><a href="kaitori.html" data-i18n="nav_kaitori"></a><a href="blog.html" data-i18n="nav_blog"></a><a href="contact.html" data-i18n="nav_contact"></a></div>
      <div><h4 data-i18n="f_follow"></h4>${S.INSTAGRAM ? `<a href="${esc(S.INSTAGRAM)}" target="_blank" rel="noopener">Instagram</a>` : ""}${S.LINE_URL ? `<a href="${esc(S.LINE_URL)}" target="_blank" rel="noopener">LINE</a>` : ""}<a href="legal.html" data-i18n="f_legal"></a></div>
      </div><div class="copy">© ${new Date().getFullYear()} <span data-brand></span>. <span data-i18n="rights"></span></div></div></footer>
      ${S.LINE_URL ? `<a class="line-fab" href="${esc(S.LINE_URL)}" target="_blank" rel="noopener" data-i18n="line_btn"></a>` : ""}`;
    const nl = $("#newsletter");
    if (nl) nl.innerHTML = `<section class="news"><div class="wrap narrow"><span class="eyebrow" style="color:#e9d9c0">Newsletter</span><h2 data-i18n="news_h"></h2><p data-i18n="news_t"></p>
      <form id="newsForm"><input type="email" required data-i18n-ph="news_ph" name="email"><input class="hp" name="website" tabindex="-1" autocomplete="off"><button data-i18n="send"></button></form><div class="msg" id="newsMsg"></div></div></section>`;
    document.body.insertAdjacentHTML("beforeend", `
      <div class="shade" id="shade"></div>
      <aside class="drawer" id="drawer"><header><span data-i18n="cart"></span><button id="dClose" aria-label="close">✕</button></header><div class="items" id="dItems"></div><footer id="dFoot"></footer></aside>
      <div class="lb" id="lb"><button class="x" id="lbX">×</button><button class="nv pv" id="lbP">‹</button><img id="lbImg" alt=""><button class="nv nx" id="lbN">›</button><p id="lbCap"></p></div>
      <div class="modal" id="modal"><div class="box" id="modalBox"></div></div>`);
    $$(".lang button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.l)));
    $("#burger").onclick = () => $("#nav").classList.toggle("open");
    $("#cartBtn").onclick = openCart; $("#dClose").onclick = closeCart; $("#shade").onclick = closeCart;
    const nf = $("#newsForm");
    if (nf) nf.addEventListener("submit", async (e) => {
      e.preventDefault(); const m = $("#newsMsg"); const r = await post("subscribe", { email: nf.email.value, website: nf.website.value, lang });
      m.className = "msg"; m.style.display = "block"; m.textContent = r.demo ? t("demo_mode") : r.ok ? t("sent_ok") : t("sent_err"); if (r.ok) nf.reset();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeCart(); closeLb(); closeModal(); } });
  }

  /* ---------- kirim data ke Apps Script ---------- */
  async function post(action, data) {
    if (!S.API_URL) return { ok: true, demo: true, order_id: "DEMO-" + Date.now().toString().slice(-6) };
    try {
      // text/plain agar tidak memicu preflight CORS di Apps Script
      const r = await fetch(S.API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, ...data }) });
      return await r.json();
    } catch (e) { return { ok: false, error: String(e) }; }
  }

  /* ---------- keranjang ---------- */
  let cart = jget("cart", []);
  const saveCart = () => { jset("cart", cart); renderCart(); };
  function addToCart(p, qty = 1) {
    const stock = Number(p.stock);
    const ex = cart.find((c) => c.id === p.id);
    const nq = Math.min((ex ? ex.qty : 0) + qty, stock || 1);
    if (ex) ex.qty = nq; else cart.push({ id: p.id, name_en: p.name_en, name_jp: p.name_jp, price: Number(p.price), image_url: p.image_url, qty: nq, stock });
    saveCart(); openCart();
  }
  function calc() {
    const sub = cart.reduce((a, c) => a + c.price * c.qty, 0);
    const ship = !cart.length ? 0 : sub >= S.FREE_SHIPPING_OVER ? 0 : S.SHIPPING_FLAT;
    return { sub, ship, total: sub + ship };
  }
  function renderCart() {
    $("#cartN").textContent = cart.reduce((a, c) => a + c.qty, 0);
    const box = $("#dItems"), foot = $("#dFoot"); if (!box) return;
    if (!cart.length) { box.innerHTML = `<p style="padding:30px 0;color:var(--muted)">${t("cart_empty")}</p>`; foot.innerHTML = ""; return; }
    box.innerHTML = cart.map((c, i) => `<div class="ci"><img src="${esc(pic(c.image_url, c.id))}" alt=""><div><div>${esc(lang === "jp" ? c.name_jp : c.name_en)}</div><small>${yen(c.price)} × ${c.qty}</small><br><button class="rm" data-rm="${i}">${t("remove")}</button></div><div class="price">${yen(c.price * c.qty)}</div></div>`).join("");
    const k = calc();
    foot.innerHTML = `<div class="sum"><span>${t("subtotal")}</span><span>${yen(k.sub)}</span></div><div class="sum"><span>${t("shipping")}</span><span>${k.ship ? yen(k.ship) : t("free")}</span></div><div class="sum t"><span>${t("total")}</span><span>${yen(k.total)}</span></div><a class="btn solid" style="display:block;text-align:center;margin-top:14px" href="checkout.html">${t("checkout")}</a>`;
    $$("[data-rm]", box).forEach((b) => (b.onclick = () => { cart.splice(+b.dataset.rm, 1); saveCart(); }));
  }
  const openCart = () => { $("#drawer").classList.add("open"); $("#shade").classList.add("open"); renderCart(); };
  const closeCart = () => { $("#drawer") && $("#drawer").classList.remove("open"); $("#shade") && $("#shade").classList.remove("open"); };

  /* ---------- wishlist (disimpan di browser, tanpa login) ---------- */
  let wish = jget("wish", []);
  const toggleWish = (id) => { wish = wish.includes(id) ? wish.filter((x) => x !== id) : [...wish, id]; jset("wish", wish); };

  /* ---------- lightbox ---------- */
  let lbList = [], lbI = 0;
  function openLb(list, i) { lbList = list; lbI = i; showLb(); $("#lb").classList.add("open"); }
  function showLb() { const it = lbList[lbI]; $("#lbImg").src = it.src; $("#lbCap").textContent = it.cap || ""; }
  const closeLb = () => $("#lb") && $("#lb").classList.remove("open");
  function lbStep(d) { lbI = (lbI + d + lbList.length) % lbList.length; showLb(); }
  const closeModal = () => $("#modal") && $("#modal").classList.remove("open");

  /* ---------- kartu produk ---------- */
  function cardHTML(p) {
    const stock = Number(p.stock), sold = stock <= 0;
    const tag = sold ? `<span class="tag sold">${t("sold_out")}</span>` : stock <= 1 ? `<span class="tag">${t("low_stock")}</span>` : "";
    const i1 = pic(p.image_url, p.id), i2 = p.image_url2 ? pic(p.image_url2, p.id + "b") : "";
    return `<article class="card" data-id="${esc(p.id)}"><div class="imgbox">${tag}<button class="heart ${wish.includes(p.id) ? "on" : ""}" data-w="${esc(p.id)}" aria-label="wishlist">♥</button><img src="${esc(i1)}" alt="${esc(L(p, "name"))}" loading="lazy">${i2 ? `<img class="img2" src="${esc(i2)}" alt="" loading="lazy">` : ""}</div><div class="meta"><h3>${esc(L(p, "name"))}</h3><span class="price">${yen(p.price)}</span></div></article>`;
  }
  function bindCards(root, products) {
    $$(".card", root).forEach((c) => c.addEventListener("click", (e) => {
      const w = e.target.closest("[data-w]");
      if (w) { toggleWish(w.dataset.w); w.classList.toggle("on"); return; }
      productModal(products.find((p) => p.id === c.dataset.id));
    }));
  }
  function productModal(p) {
    if (!p) return;
    const stock = Number(p.stock), imgs = [pic(p.image_url, p.id), ...(p.image_url2 ? [pic(p.image_url2, p.id + "b")] : [])];
    let q = 1;
    const box = $("#modalBox");
    box.innerHTML = `<button class="x" id="mx">×</button><div><div class="ph" style="aspect-ratio:4/5"><img id="mImg" src="${esc(imgs[0])}" style="width:100%;height:100%;object-fit:cover" alt=""></div>${imgs.length > 1 ? `<div class="thumbs">${imgs.map((s, i) => `<img src="${esc(s)}" class="${i ? "" : "on"}" data-i="${i}" alt="">`).join("")}</div>` : ""}</div>
      <div class="info"><span class="eyebrow">${esc(L(p, "category"))}</span><h2>${esc(L(p, "name"))}</h2><span class="price">${yen(p.price)}</span><p>${esc(L(p, "desc"))}</p><p class="note" style="margin-top:14px">${p.size ? t("size") + "：" + esc(p.size) + "<br>" : ""}${p.material_en ? t("material") + "：" + esc(L(p, "material")) : ""}</p>
      <div style="margin-top:22px;display:flex;gap:14px;align-items:center;flex-wrap:wrap">${stock > 1 ? `<div class="qty"><button id="qm">−</button><span id="qn">1</span><button id="qp">+</button></div>` : ""}<button class="btn solid" id="addB" ${stock <= 0 ? "disabled" : ""}>${stock <= 0 ? t("sold_out") : t("add_cart")}</button></div></div>`;
    $("#modal").classList.add("open");
    $("#mx").onclick = closeModal;
    $$(".thumbs img", box).forEach((th) => (th.onclick = () => { $("#mImg").src = th.src; $$(".thumbs img", box).forEach((x) => x.classList.toggle("on", x === th)); }));
    if ($("#qm")) { $("#qm").onclick = () => { q = Math.max(1, q - 1); $("#qn").textContent = q; }; $("#qp").onclick = () => { q = Math.min(stock, q + 1); $("#qn").textContent = q; }; }
    $("#addB").onclick = () => { closeModal(); addToCart(p, q); };
  }

  /* ---------- halaman ---------- */
  const pages = {
    async home() {
      const [prods, gal, posts] = await Promise.all([getData("products"), getData("gallery"), getData("posts")]);
      const draw = () => {
        const ps = visible(prods), feat = ps.filter((p) => String(p.featured).toUpperCase() === "TRUE").slice(0, 4);
        const list = feat.length ? feat : ps.slice(0, 4);
        $("#featured").innerHTML = list.map(cardHTML).join(""); bindCards($("#featured"), ps);
        $("#homeGal").innerHTML = visible(gal).slice(0, 6).map((g) => `<figure data-s="${esc(pic(g.image_url, g.id))}" data-c="${esc(L(g, "caption"))}"><img src="${esc(pic(g.image_url, g.id))}" alt="${esc(L(g, "caption"))}" loading="lazy"><figcaption>${esc(L(g, "caption"))}</figcaption></figure>`).join("");
        const items = $$("#homeGal figure").map((f) => ({ src: f.dataset.s, cap: f.dataset.c }));
        $$("#homeGal figure").forEach((f, i) => (f.onclick = () => openLb(items, i)));
        $("#homePosts").innerHTML = postsHTML(visible(posts).sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 3));
        bindPosts(visible(posts));
      };
      draw(); onLang(draw);
    },
    async brand() {
      const tl = await getData("timeline");
      const draw = () => ($("#timeline").innerHTML = tl.map((x) => `<div class="tl rv"><div class="yr">${esc(x.year)}</div><div><h3>${esc(L(x, "title"))}</h3><p>${esc(L(x, "text"))}</p>${x.image_url ? `<img src="${esc(pic(x.image_url, x.id))}" alt="">` : ""}</div></div>`).join(""));
      draw(); onLang(draw); reveal();
    },
    philosophy() { },
    async gallery() {
      const gal = visible(await getData("gallery"));
      let cat = "all";
      const draw = () => {
        const cats = [...new Set(gal.map((g) => L(g, "category")).filter(Boolean))];
        $("#galFilters").innerHTML = [`<button data-c="all" class="${cat === "all" ? "on" : ""}">${t("all")}</button>`, ...cats.map((c) => `<button data-c="${esc(c)}" class="${cat === c ? "on" : ""}">${esc(c)}</button>`)].join("");
        $$("#galFilters button").forEach((b) => (b.onclick = () => { cat = b.dataset.c; draw(); }));
        const list = gal.filter((g) => cat === "all" || L(g, "category") === cat);
        $("#galGrid").innerHTML = list.map((g, i) => `<figure data-i="${i}"><img src="${esc(pic(g.image_url, g.id))}" alt="${esc(L(g, "caption"))}" loading="lazy"><figcaption>${esc(L(g, "caption"))}</figcaption></figure>`).join("") || `<p class="center">${t("empty_list")}</p>`;
        const items = list.map((g) => ({ src: pic(g.image_url, g.id), cap: L(g, "caption") }));
        $$("#galGrid figure").forEach((f, i) => (f.onclick = () => openLb(items, i)));
      };
      draw(); onLang(draw);
    },
    async shop() {
      const prods = visible(await getData("products")); let cat = "all";
      const draw = () => {
        const cats = [...new Set(prods.map((p) => L(p, "category")).filter(Boolean))];
        $("#shopFilters").innerHTML = [`<button data-c="all" class="${cat === "all" ? "on" : ""}">${t("all")}</button>`, ...cats.map((c) => `<button data-c="${esc(c)}" class="${cat === c ? "on" : ""}">${esc(c)}</button>`)].join("");
        $$("#shopFilters button").forEach((b) => (b.onclick = () => { cat = b.dataset.c; draw(); }));
        const list = prods.filter((p) => cat === "all" || L(p, "category") === cat);
        $("#shopGrid").innerHTML = list.map(cardHTML).join("") || `<p class="center">${t("empty_list")}</p>`; bindCards($("#shopGrid"), prods);
      };
      draw(); onLang(draw);
    },
    async blog() {
      const posts = visible(await getData("posts")).sort((a, b) => String(b.date).localeCompare(String(a.date)));
      const draw = () => { $("#blogGrid").innerHTML = postsHTML(posts); bindPosts(posts); };
      draw(); onLang(draw);
    },
    kaitori() { initKaitori(); },
    contact() { initContact(); },
    checkout() { initCheckout(); },
    legal() { }
  };
  function postsHTML(list) {
    return list.map((p) => `<article class="post" data-id="${esc(p.id)}"><div class="ph" style="background-image:url('${esc(pic(p.image_url, p.id))}')"></div><small>${esc(p.date)} · ${esc(L(p, "category"))}</small><h3>${esc(L(p, "title"))}</h3><p>${esc(L(p, "summary"))}</p></article>`).join("") || `<p class="center">${t("empty_list")}</p>`;
  }
  function bindPosts(list) {
    $$(".post").forEach((el) => (el.onclick = () => {
      const p = list.find((x) => x.id === el.dataset.id); if (!p) return;
      $("#modalBox").innerHTML = `<button class="x" id="mx">×</button><div><div class="ph" style="aspect-ratio:1;background-image:url('${esc(pic(p.image_url, p.id))}')"></div></div><div class="info"><span class="eyebrow">${esc(p.date)} · ${esc(L(p, "category"))}</span><h2>${esc(L(p, "title"))}</h2><div class="rule" style="margin:14px 0"></div><p class="article">${esc(L(p, "body"))}</p></div>`;
      $("#modal").classList.add("open"); $("#mx").onclick = closeModal;
    }));
  }

  /* ---------- form: kaitori ---------- */
  function resize(file, max = 1100) {
    return new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => { const im = new Image(); im.onload = () => { const r = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement("canvas"); c.width = im.width * r; c.height = im.height * r; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL("image/jpeg", 0.8)); }; im.src = fr.result; };
      fr.readAsDataURL(file);
    });
  }
  function initKaitori() {
    const f = $("#kaiForm"), input = $("#kPhotos"), prev = $("#kPrev"); let shots = [];
    input.addEventListener("change", async () => {
      shots = []; prev.innerHTML = "";
      for (const file of [...input.files].slice(0, S.KAITORI_MAX_PHOTOS)) { const d = await resize(file); shots.push(d); prev.insertAdjacentHTML("beforeend", `<img src="${d}" alt="">`); }
    });
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); const m = $("#kMsg"), b = f.querySelector("button[type=submit]"); b.disabled = true; b.textContent = t("sending");
      const fd = Object.fromEntries(new FormData(f).entries()); delete fd.photos;
      const r = await post("kaitori", { ...fd, photos: shots, lang });
      m.className = "msg " + (r.demo ? "demo" : r.ok ? "ok" : "err"); m.textContent = r.demo ? t("demo_mode") : r.ok ? t("sent_ok") + (r.id ? " (" + r.id + ")" : "") : t("sent_err");
      b.disabled = false; b.textContent = t("send"); if (r.ok && !r.demo) { f.reset(); prev.innerHTML = ""; shots = []; }
    });
  }
  function initContact() {
    const f = $("#conForm");
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); const m = $("#cMsg"), b = f.querySelector("button[type=submit]"); b.disabled = true; b.textContent = t("sending");
      const r = await post("contact", { ...Object.fromEntries(new FormData(f).entries()), lang });
      m.className = "msg " + (r.demo ? "demo" : r.ok ? "ok" : "err"); m.textContent = r.demo ? t("demo_mode") : r.ok ? t("sent_ok") : t("sent_err");
      b.disabled = false; b.textContent = t("send"); if (r.ok && !r.demo) f.reset();
    });
  }

  /* ---------- checkout ---------- */
  function initCheckout() {
    const f = $("#coForm"), sum = $("#coSum");
    const draw = () => {
      if (!cart.length && !$("#done").hidden) return;
      const k = calc(), jp = (f.country.value || "Japan") === "Japan";
      sum.innerHTML = (cart.length ? cart.map((c) => `<div class="ci"><img src="${esc(pic(c.image_url, c.id))}" alt=""><div>${esc(lang === "jp" ? c.name_jp : c.name_en)}<br><small>${yen(c.price)} × ${c.qty}</small></div><div class="price">${yen(c.price * c.qty)}</div></div>`).join("") : `<p>${t("cart_empty")}</p>`) +
        `<div class="sum"><span>${t("subtotal")}</span><span>${yen(k.sub)}</span></div><div class="sum"><span>${t("shipping")}</span><span>${jp ? (k.ship ? yen(k.ship) : t("free")) : (lang === "jp" ? "別途ご案内" : "Quoted by email")}</span></div><div class="sum t"><span>${t("total")}</span><span>${yen(jp ? k.total : k.sub)}</span></div>`;
      f.querySelector("button[type=submit]").disabled = !cart.length;
    };
    f.country.addEventListener("change", draw); draw(); onLang(draw);
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); const m = $("#coMsg"), b = f.querySelector("button[type=submit]"); b.disabled = true; b.textContent = t("sending");
      const d = Object.fromEntries(new FormData(f).entries());
      const r = await post("order", { ...d, lang, items: cart.map((c) => ({ id: c.id, qty: c.qty })) });
      if (r.ok) {
        const id = r.order_id; cart = []; jset("cart", cart); renderCart();
        f.hidden = true; sum.parentElement.hidden = true;
        const dn = $("#done"); dn.hidden = false;
        $("#doneId").textContent = id; $("#demoNote").hidden = !r.demo;
      } else { m.className = "msg err"; m.textContent = (r.error && /stock|在庫/i.test(r.error) ? r.error : t("sent_err")); b.disabled = false; b.textContent = t("place_order"); }
    });
  }

  /* ---------- animasi muncul ---------- */
  function reveal() {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
    $$(".rv").forEach((el) => io.observe(el));
  }

  /* ---------- gambar statis dari folder images/ (jika belum ada, tampil pola placeholder) ---------- */
  function fillImgs() {
    $$("[data-img]").forEach((el) => {
      const src = el.dataset.img, fallback = ph(src), probe = new Image();
      el.style.backgroundImage = "url('" + fallback + "')";
      probe.onload = () => (el.style.backgroundImage = "url('" + src + "')");
      probe.src = src;
    });
  }

  /* ---------- mulai ---------- */
  document.addEventListener("DOMContentLoaded", async () => {
    chrome();
    $("#lbX").onclick = closeLb; $("#lbP").onclick = () => lbStep(-1); $("#lbN").onclick = () => lbStep(1);
    $("#lb").addEventListener("click", (e) => { if (e.target.id === "lb") closeLb(); });
    $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
    await loadOverrides();
    document.documentElement.lang = lang === "jp" ? "ja" : "en";
    $$(".lang button").forEach((b) => b.classList.toggle("on", b.dataset.l === lang));
    applyI18n(); renderCart(); reveal(); fillImgs();
    onLang(renderCart);
    const p = document.body.dataset.page; if (pages[p]) pages[p]();
  });
})();
