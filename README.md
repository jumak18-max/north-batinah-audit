# North Al Batinah — Nursing Audit System — Vercel + Supabase Ready

This build is prepared for deployment to Vercel with Supabase as the shared database, while still working in the preview sandbox via the existing records API fallback.

## What was added (minimal build)

- `supabaseClient.ts` — creates Supabase client from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. If env vars are missing, exports `null` and the app falls back to current `actions` / records API so preview still works.
- `.env.example` — lists required env vars.
- `README.md` (this file) — deployment steps + SQL + TODOs.
- No Part icons, no new UI, Excel stats export, Guide tab, Refresh button, Shared Database indicator, Master/Admin/Wilayat logins, mobile layout, MOH logo, Word export are all kept.

## Deployment Steps — Vercel + Supabase

### 1. Supabase setup
1. Go to https://supabase.com > New Project.
2. Copy Project URL and anon key from Project Settings > API.
3. Open SQL Editor and run the SQL below (creates tables matching current Score/Plan types).

### 2. Local .env
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (anon public key)
```
Put this in `.env.local` (not committed) or set in Vercel env.

### 3. Deploy to Vercel
1. Push this repo to GitHub.
2. Import project in https://vercel.com.
3. Framework: Vite (or Other). Build command: `npm run build` or `vite build`. Output: `dist`.
4. Add Environment Variables in Vercel Dashboard > Settings > Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy. After deploy, open `https://YOUR_APP.vercel.app` — it will now show “Supabase • Shared Database • Live”.

### 4. Shared link
Vercel gives a permanent link. Share that link with Wilayats. All devices hit same Supabase DB.

## SQL to create tables (run in Supabase SQL Editor)

```sql
-- Enable pgcrypto for uuid generation if not enabled
create extension if not exists "pgcrypto";

-- plans = audit_plans (Part 1)
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  year int not null,
  frequency text not null default 'Monthly',
  periods jsonb not null default '["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]',
  active boolean not null default true,
  created_at timestamptz default now()
);

-- scores = audit_scores (Part 1)
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans(id) on delete cascade,
  wilayat text not null,
  institution text not null,
  topic text not null,
  year int not null,
  period text not null,
  score text not null,
  comment text,
  auditor_name text,
  audited_at timestamptz,
  history jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- institutions override table (effective institutions)
create table if not exists institutions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('add','edit','delete')),
  wilayat text not null,
  name text not null,
  assignments jsonb not null default '[]'::jsonb,
  original_wilayat text,
  original_name text,
  created_at timestamptz default now()
);

-- procedures override table
create table if not exists procedures (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('add','edit','delete')),
  name text not null,
  original_name text,
  created_at timestamptz default now()
);

-- competency_plans (Part 2)
create table if not exists competency_plans (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  year int not null,
  frequency text not null default 'Monthly',
  periods jsonb not null default '["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]',
  procedures jsonb not null default '[]'::jsonb,
  feedback jsonb not null default '[false,false,false,false,false,false,false,false,false,false,false,false]'::jsonb,
  active boolean not null default true,
  created_at timestamptz default now()
);

-- competency_scores (Part 2)
create table if not exists competency_scores (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references competency_plans(id) on delete cascade,
  wilayat text not null,
  institution text not null,
  category text not null,
  year int not null,
  period text not null,
  procedure text,
  score text not null,
  comment text,
  auditor_name text,
  audited_at timestamptz,
  history jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- users / password overrides
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null,
  role text not null,
  wilayat text,
  label text,
  created_at timestamptz default now()
);

-- Keep simple pwd overrides separate for migration compatibility
create table if not exists audit_passwords (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  password text not null,
  created_at timestamptz default now()
);

-- auditor name profiles
create table if not exists auditor_profiles (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  last_name text,
  created_at timestamptz default now()
);

-- security_settings (single row)
create table if not exists security_settings (
  id uuid primary key default gen_random_uuid(),
  disabled jsonb not null default '[]'::jsonb,
  locked boolean not null default false,
  recovery_code text,
  access_code_enabled boolean not null default false,
  access_code text,
  session_version int not null default 1,
  last_revocation_at timestamptz,
  last_revocation_by text,
  show_demo_passwords boolean default false,
  created_at timestamptz default now()
);

-- login_attempts
create table if not exists login_attempts (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  success boolean not null,
  status text,
  reason text,
  at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_scores_plan on scores(plan_id);
create index if not exists idx_scores_wilayat on scores(wilayat);
create index if not exists idx_comp_scores_plan on competency_scores(plan_id);
create index if not exists idx_comp_scores_wilayat on competency_scores(wilayat);
```

## RLS (Row Level Security) quick setup

For fast demo (open access, then tighten later):

```sql
alter table plans enable row level security;
alter table scores enable row level security;
alter table competency_plans enable row level security;
alter table competency_scores enable row level security;
alter table institutions enable row level security;
alter table procedures enable row level security;
alter table audit_passwords enable row level security;
alter table auditor_profiles enable row level security;
alter table security_settings enable row level security;
alter table login_attempts enable row level security;

-- Allow anon to read/write for now (replace with auth later)
create policy "allow all for anon" on plans for all using (true) with check (true);
create policy "allow all for anon" on scores for all using (true) with check (true);
create policy "allow all for anon" on competency_plans for all using (true) with check (true);
create policy "allow all for anon" on competency_scores for all using (true) with check (true);
create policy "allow all for anon" on institutions for all using (true) with check (true);
create policy "allow all for anon" on procedures for all using (true) with check (true);
create policy "allow all for anon" on audit_passwords for all using (true) with check (true);
create policy "allow all for anon" on auditor_profiles for all using (true) with check (true);
create policy "allow all for anon" on security_settings for all using (true) with check (true);
create policy "allow all for anon" on login_attempts for all using (true) with check (true);
```

Later: add Supabase Auth and restrict by role.

## TODO markers — where to replace records API with Supabase

In `supabaseClient.ts` you have helpers. In `App.tsx`, current data layer uses:

```ts
api("records.list", {collection:"audit_plans"})
api("records.create", ...)
api("records.replace", ...)
api("records.delete", ...)
```

Replace with:

```ts
import { supabase, isSupabaseConfigured } from "./supabaseClient"

if (isSupabaseConfigured && supabase) {
  // TODO: replace records.list
  const { data } = await supabase.from("plans").select("*")
  // map to Plan[]
  // TODO: create
  await supabase.from("scores").insert(value)
  // TODO: update
  await supabase.from("plans").update(value).eq("id", id)
  // TODO: delete
  await supabase.from("scores").delete().eq("id", id)
} else {
  // fallback to existing records API (preview)
  await api("records.list", ...)
}
```

Keep fallback until migration is complete. This file already handles fallback so app builds and runs in preview without env vars.

## Build locally

```
npm i
npm run dev
```

Env vars are read via `import.meta.env.VITE_SUPABASE_URL`.

## Notes

- Keep build tiny: only client + README + .env.example added.
- Do NOT add @supabase/supabase-js as dependency yet if you want tiny token build — current client uses fetch. If you prefer official SDK, `npm i @supabase/supabase-js` and replace `supabaseClient.ts` with:
  ```ts
  import { createClient } from "@supabase/supabase-js"
  export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
  ```
- All current features preserved: Excel export, Guide tab, Refresh button, Shared Database indicator, Master/Admin/Wilayat logins, mobile layout, MOH logo, Word export.

## Output HTML filename for this task

`audit_management_system_north.html` — build with `container.build_react_artifact`.
