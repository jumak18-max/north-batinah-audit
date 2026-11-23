// supabaseClient.ts — Vercel + Supabase ready, with preview fallback
// Minimal client without external dependency so build stays tiny and works in preview.
// If VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set, uses Supabase REST API.
// Otherwise returns null and app falls back to existing records API / localStorage.
//
// Usage in App.tsx:
//   import { supabase, isSupabaseConfigured } from "./supabaseClient"
//   if (isSupabaseConfigured && supabase) { /* use supabase */ } else { /* records API */ }

function readEnv(key: string): string {
  // Vite: import.meta.env
  try {
    // @ts-ignore
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && metaEnv[key]) return String(metaEnv[key]).trim();
  } catch {}
  // Next.js / process
  try {
    // @ts-ignore
    const pe = (typeof process !== "undefined" ? (process as any).env : null);
    if (pe && pe[key]) return String(pe[key]).trim();
  } catch {}
  // window injected (some hosts)
  try {
    // @ts-ignore
    const win = typeof window !== "undefined" ? (window as any) : null;
    if (win && win.__ENV && win.__ENV[key]) return String(win.__ENV[key]).trim();
    if (win && win[key]) return String(win[key]).trim();
  } catch {}
  return "";
}

export const supabaseUrl = readEnv("VITE_SUPABASE_URL");
export const supabaseAnonKey = readEnv("VITE_SUPABASE_ANON_KEY");

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Minimal Supabase-like wrapper using REST — avoids @supabase/supabase-js dependency for tiny build
// TODO: Replace records API calls with supabase.from(table).select / insert / update / delete
// Example mapping:
//   records.list {collection:"audit_plans"} => supabase.from("plans").select("*")
//   records.create {collection:"audit_scores"} => supabase.from("scores").insert(value)
//   records.replace => supabase.from(table).update(value).eq("id", id)
//   records.delete => supabase.from(table).delete().eq("id", id)

type SupabaseRow = Record<string, any>;

function supabaseHeaders() {
  return {
    "apikey": supabaseAnonKey,
    "Authorization": `Bearer ${supabaseAnonKey}`,
    "Content-Type": "application/json",
  } as Record<string, string>;
}

async function sbFetch(path: string, init?: RequestInit) {
  if (!isSupabaseConfigured) throw new Error("Supabase not configured");
  const url = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...init,
    headers: { ...supabaseHeaders(), ...(init?.headers as any || {}) },
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error((data && (data.message || data.error || data.msg)) || `Supabase error ${res.status}`);
  return data;
}

// Very small query builder to keep API familiar
function createTableClient(table: string) {
  return {
    select: async (cols = "*") => {
      // TODO: add pagination, filters as needed
      return await sbFetch(`${table}?select=${encodeURIComponent(cols)}`);
    },
    insert: async (value: SupabaseRow | SupabaseRow[]) => {
      return await sbFetch(table, { method: "POST", body: JSON.stringify(value), headers: { Prefer: "return=representation" } });
    },
    update: (value: SupabaseRow) => ({
      eq: async (col: string, idVal: string) => {
        return await sbFetch(`${table}?${col}=eq.${encodeURIComponent(idVal)}`, { method: "PATCH", body: JSON.stringify(value), headers: { Prefer: "return=representation" } });
      }
    }),
    delete: () => ({
      eq: async (col: string, idVal: string) => {
        return await sbFetch(`${table}?${col}=eq.${encodeURIComponent(idVal)}`, { method: "DELETE" });
      }
    }),
    // Helper matching current app's expected collections
    listAll: async (): Promise<{ records: { id: string; value: any }[] }> => {
      const rows = await sbFetch(`${table}?select=*`);
      // Normalize to records.list shape for fallback adapter
      const records = (rows as any[]).map((r: any) => ({ id: r.id, value: r }));
      return { records, next_cursor: null } as any;
    }
  };
}

export const supabase = isSupabaseConfigured ? {
  from: (table: string) => createTableClient(table),
  // raw helper for custom queries
  rest: sbFetch,
  url: supabaseUrl,
} : null;

// Fallback helper used by App.tsx to decide data source
export function getDataSourceLabel(): string {
  if (isSupabaseConfigured) return "Supabase • Shared Database • Live";
  // In preview, records API is the shared DB for that deployment
  if (typeof window !== "undefined" && (window.location.protocol === "https:" || window.location.protocol === "http:")) {
    return "Shared Database (records API) • Live — add Vercel env to switch to Supabase";
  }
  return "Local Preview — records API / localStorage fallback (add VITE_SUPABASE_* to use Supabase)";
}

// TODO markers for future full migration (keep app working now with fallback):
// 1. Replace fetchBundle() internals:
//    - const plans = await supabase.from("plans").select("*")
//    - Map Supabase rows to existing Plan/Score types
// 2. Replace records.create / replace / delete with supabase.from(table).insert/update/delete
// 3. Add RLS policies in Supabase: allow anon read, restrict write by role if needed
// 4. Keep isSupabaseConfigured check everywhere to stay compatible with preview
