// supabaseClient.ts — matches App.tsx imports:
// isSupabaseConfigured, supabaseLoadAll, supabaseUpsert, supabaseDelete, sbSave, sbLoadAll
// Table: audit_data (id text PK, data jsonb, updated_at timestamptz)
// Uses VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY (fallback VITE_SUPABASE_ANON_KEY)
// Both Vercel vars must hold the SAME sb_publishable_... key.

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_KEY =
  ((import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  ((import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  "";

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_URL.startsWith("http") && SUPABASE_KEY && SUPABASE_KEY.trim().length > 10
);

function headers(extra: Record<string, string> = {}) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function baseUrl() {
  return String(SUPABASE_URL || "").replace(/\/$/, "");
}

// Load ALL rows: returns { ok, rows, reason } — rows are { id, data, updated_at }
export async function sbLoadAll(): Promise<{ ok: boolean; rows: any[]; reason?: string }> {
  if (!isSupabaseConfigured) return { ok: false, rows: [], reason: "no-config" };
  try {
    const res = await fetch(`${baseUrl()}/rest/v1/audit_data?select=*`, { headers: headers() });
    if (!res.ok) return { ok: false, rows: [], reason: `HTTP ${res.status}` };
    const rows = await res.json();
    return { ok: true, rows: Array.isArray(rows) ? rows : [] };
  } catch (e: any) {
    return { ok: false, rows: [], reason: String(e?.message || e || "fetch failed") };
  }
}

// Legacy alias used by older App code — same shape as sbLoadAll
export async function supabaseLoadAll() {
  return sbLoadAll();
}

// Save / upsert ONE row: returns { ok, reason }
export async function sbSave(id: string, dataObj: any): Promise<{ ok: boolean; reason?: string }> {
  if (!isSupabaseConfigured) return { ok: false, reason: "no-config" };
  try {
    const res = await fetch(`${baseUrl()}/rest/v1/audit_data?on_conflict=id`, {
      method: "POST",
      headers: headers({ Prefer: "resolution=merge-duplicates,return=representation" }),
      body: JSON.stringify({ id, data: dataObj, updated_at: new Date().toISOString() }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, reason: `HTTP ${res.status} ${txt.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: String(e?.message || e || "save failed") };
  }
}

// Legacy alias: supabaseUpsert(id, data)
export async function supabaseUpsert(id: string, dataObj: any) {
  return sbSave(id, dataObj);
}

// Delete ONE row by id
export async function supabaseDelete(id: string): Promise<{ ok: boolean; reason?: string }> {
  if (!isSupabaseConfigured) return { ok: false, reason: "no-config" };
  try {
    const res = await fetch(`${baseUrl()}/rest/v1/audit_data?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: headers(),
    });
    if (!res.ok) return { ok: false, reason: `HTTP ${res.status}` };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, reason: String(e?.message || e || "delete failed") };
  }
}
