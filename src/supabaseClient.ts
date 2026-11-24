// Supabase client without external dependency — uses REST API directly
// Implements minimal API needed by App.tsx: from(table).select(), upsert, delete, etc.
// Keeps isSupabaseConfigured flag based on VITE_SUPABASE_URL + KEY env.

function readEnv(key: string): string {
  try {
    // @ts-ignore Vite
    const metaEnv = (import.meta as any)?.env;
    if (metaEnv && metaEnv[key]) return String(metaEnv[key]).trim();
  } catch {}
  try {
    // @ts-ignore Node / process
    const pe = typeof process !== "undefined" ? (process as any).env : null;
    if (pe && pe[key]) return String(pe[key]).trim();
  } catch {}
  try {
    // @ts-ignore window injection
    const win = typeof window !== "undefined" ? (window as any) : null;
    if (win && win.__ENV && win.__ENV[key]) return String(win.__ENV[key]).trim();
  } catch {}
  return "";
}

const urlRaw = readEnv("VITE_SUPABASE_URL");
const keyRaw = readEnv("VITE_SUPABASE_PUBLISHABLE_KEY") || readEnv("VITE_SUPABASE_ANON_KEY") || "";

const supabaseUrl = urlRaw;
const supabaseKey = keyRaw;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

function headers() {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
  } as Record<string, string>;
}

async function sbFetch(path: string, init?: RequestInit) {
  if (!isSupabaseConfigured) throw new Error("Supabase not configured");
  const base = supabaseUrl.replace(/\/$/, "");
  const full = `${base}/rest/v1/${path}`;
  const res = await fetch(full, { ...init, headers: { ...headers(), ...(init?.headers as any || {}) } });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) throw new Error((data && (data.message || data.error || data.msg)) || `Supabase error ${res.status}`);
  return data;
}

export type AuditDataRow = { id: string; data: any; updated_at?: string };

export async function supabaseLoadAll(): Promise<AuditDataRow[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const rows = await sbFetch("audit_data?select=*");
    return (rows as AuditDataRow[]) || [];
  } catch {
    return [];
  }
}

export async function supabaseUpsert(id: string, dataObj: any): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    await sbFetch("audit_data", {
      method: "POST",
      body: JSON.stringify({ id, data: dataObj, updated_at: new Date().toISOString() }),
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    });
    // The above with merge-duplicates may not work on all setups, try upsert via PATCH fallback
    return true;
  } catch {
    // Try alternative upsert via ?on_conflict=id
    try {
      await sbFetch("audit_data?on_conflict=id", {
        method: "POST",
        body: JSON.stringify({ id, data: dataObj, updated_at: new Date().toISOString() }),
        headers: { Prefer: "resolution=merge-duplicates" } as any,
      });
      return true;
    } catch {
      return false;
    }
  }
}

export async function supabaseDelete(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    await sbFetch(`audit_data?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    return true;
  } catch {
    return false;
  }
}

// Minimal supabase-like object for compatibility with older code
function createTableClient(table: string) {
  return {
    select: async (_cols = "*") => {
      return await sbFetch(`${table}?select=*`);
    },
    upsert: async (row: any, opts?: any) => {
      const onConflict = opts?.onConflict || "id";
      return await sbFetch(`${table}?on_conflict=${onConflict}`, {
        method: "POST",
        body: JSON.stringify(row),
        headers: { Prefer: "resolution=merge-duplicates" } as any,
      });
    },
  };
}

export const supabase = isSupabaseConfigured ? {
  from: (table: string) => ({
    select: async (cols = "*") => {
      try {
        const data = await sbFetch(`${table}?select=${encodeURIComponent(cols)}`);
        return { data, error: null };
      } catch (e: any) {
        return { data: null, error: e };
      }
    },
    upsert: async (row: any, opts?: any) => {
      try {
        const onConflict = opts?.onConflict || "id";
        const data = await sbFetch(`${table}?on_conflict=${onConflict}`, {
          method: "POST",
          body: JSON.stringify(row),
          headers: { Prefer: "resolution=merge-duplicates", "Content-Type": "application/json" } as any,
        });
        return { data, error: null };
      } catch (e: any) {
        return { data: null, error: e };
      }
    },
    delete: () => ({
      eq: async (col: string, val: string) => {
        try {
          await sbFetch(`${table}?${col}=eq.${encodeURIComponent(val)}`, { method: "DELETE" });
          return { error: null };
        } catch (e: any) {
          return { error: e };
        }
      }
    }),
  }),
  url: supabaseUrl,
} : null;

export function getDataSourceLabel(): string {
  if (isSupabaseConfigured) return "Live • Supabase • Shared";
  return "Local mode • Offline";
}
