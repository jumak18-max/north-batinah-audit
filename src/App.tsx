import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, ClipboardCheck, Download, LogOut, MessageSquare, Search, Settings2, Users, HelpCircle, X, CheckCircle2, Eye, EyeOff, Trash2, RefreshCw } from "lucide-react";
import mohLogo from "../assets/de5a2654c982994c-MOH_Logo.png";
import { isSupabaseConfigured, supabaseLoadAll, supabaseUpsert, supabaseDelete, sbSave, sbLoadAll } from "./supabaseClient";

type Role = "Master" | "Admin" | "Wilayat";
type User = { username: string; password: string; role: Role; wilayat: string; label: string };
const DEFAULT_USERS: User[] = [
  { username: "master", password: "Masterin123", role: "Master", wilayat: "All Wilayats", label: "Master" },
  { username: "admin", password: "admin123", role: "Admin", wilayat: "All Wilayats", label: "Admin — Nursing Service Department" },
  { username: "suhar", password: "suhar123", role: "Wilayat", wilayat: "Suhar", label: "Suhar" },
  { username: "saham", password: "saham123", role: "Wilayat", wilayat: "Saham", label: "Saham" },
  { username: "khaboorah", password: "khaboorah123", role: "Wilayat", wilayat: "Khaboorah", label: "Khaboorah" },
  { username: "suwaiq", password: "suwaiq123", role: "Wilayat", wilayat: "Suwaiq", label: "Suwaiq" },
  { username: "shinas", password: "shinas123", role: "Wilayat", wilayat: "Shinas", label: "Shinas" },
  { username: "liwa", password: "liwa123", role: "Wilayat", wilayat: "Liwa", label: "Liwa" },
];
const WILAYAT_ORDER = ["Suhar", "Saham", "Suwaiq", "Khaboorah", "Shinas", "Liwa"];
const INSTITUTIONS: Record<string, string[]> = {
  Suhar: ["Suhar EHC", "Al Uwaynat HC", "Falaj Al Qbail HC", "Multaqa HC", "Suhar MFC", "Traif HC", "Wadi Ahin HC", "Wadi Heebi Hospital", "Suhar RDC"],
  Saham: ["Saham Hospital", "Saham Polyclinic", "Hafeet HC", "Ghuwaisah HC", "Wadi Bani Omar HC", "Saham RDC"],
  Suwaiq: ["Suwaiq Hospital", "Suwaiq EHC", "Bidaya HC", "Khadhra HC", "Mashaiq HC", "Shireesa HC", "Tharmad HC", "Wadi Al Jahawer HC", "Suwaiq RDC"],
  Khaboorah: ["Khaboorah EHC", "Qasbia HC", "Wadi Hawasna Hospital", "Wadi Sarrami Hospital", "Wadi Shafan HC"],
  Shinas: ["Shinas EHC", "Abu Baqra HC", "Shinas Labour Room", "Shinas RDC"],
  Liwa: ["Liwa HC", "Nabr HC", "Rahab HC"],
};
const TOPICS = ["Crash Cart", "Narcotics & Psychotropics", "Escorting Patients", "Death"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_INDEX: Record<string, number> = {};
MONTHS.forEach((m, i) => { MONTH_INDEX[m] = i; MONTH_INDEX[m.toLowerCase()] = i; });
const CATEGORIES = ["General Nursing", "Renal Medicine Center", "Labour Rooms"] as const;

function cleanInstitutionName(raw: string, wilayat?: string): string {
  let s = (raw || "").trim(); let changed = true;
  while (changed) { changed = false; const idx = s.indexOf("_"); if (idx > 0) { const prefix = s.slice(0, idx).trim(); const isWilayat = wilayat ? prefix.toLowerCase() === wilayat.toLowerCase() : WILAYAT_ORDER.some(w => w.toLowerCase() === prefix.toLowerCase()); if (isWilayat) { s = s.slice(idx + 1).trim(); changed = true; } } }
  return s;
}
type HistoryEntry = { score: string; comment: string; auditorName: string; auditedAt: string; };
type Plan = { id: string; topic: string; year: number; frequency: string; periods: string[]; active: boolean };
type Score = { id: string; planId: string; wilayat: string; institution: string; topic: string; year: number; period: string; score: string; comment: string; auditorName?: string; auditedAt?: string; history?: HistoryEntry[] };
type PwdOverride = { id: string; username: string; password: string };
type AuditorProfile = { id: string; username: string; lastName: string };
type SecuritySettings = { disabled: string[]; locked: boolean; recoveryCode: string; accessCodeEnabled: boolean; accessCode: string; sessionVersion: number; lastRevocationAt: string; lastRevocationBy: string; showDemoPasswords?: boolean };
type LoginAttempt = { id: string; username: string; success: boolean; status: string; at: string; reason: string };
const DEFAULT_SECURITY: SecuritySettings = { disabled: [], locked: false, recoveryCode: "", accessCodeEnabled: false, accessCode: "", sessionVersion: 1, lastRevocationAt: "", lastRevocationBy: "", showDemoPasswords: false };
type CompPlan = { id: string; category: string; year: number; frequency: string; periods: string[]; procedures: (string | null)[]; feedback?: boolean[]; active: boolean };
type CompScore = { id: string; planId: string; wilayat: string; institution: string; category: string; year: number; period: string; procedure: string; score: string; comment: string; auditorName?: string; auditedAt?: string; history?: HistoryEntry[] };
type InstOverride = { id: string; kind: "add" | "edit" | "delete"; wilayat: string; name: string; assignments: string[]; originalWilayat?: string; originalName?: string };
type ProcOverride = { id: string; kind: "add" | "edit" | "delete"; name: string; originalName?: string };
type EffInst = { wilayat: string; institution: string; assignments: string[]; sourceId?: string; sourceKind?: string; originalWilayat?: string; originalName?: string };
type Block = { start: number; end: number; procedure: string; months: number[] };
const PROCEDURES: string[] = [
  "[LR] 2nd Stage of Labour", "[LR] 3rd Stage of Labour", "[LR] Breast Feeding Assessment", "[LR] Episiotomy Incision, Repair", "[LR] Episiotomy suturing", "[LR] Vaginal Examination",
  "[RMC] Commencing patient with Permanent access to HD Machine", "[RMC] Commencing patient with temporary access to HD Machine", "[RMC] Disconnecting patient with Permanent access from HD Machine", "[RMC] Disconnecting patient with temporary access from HD Machine", "[RMC] Post Dialysis assessment of Haemodialysis Patient", "[RMC] Pre Dialysis assessment of Haemodialysis Patient", "[RMC] Priming Dialysis Machine",
  "Abdominal palpation", "Administering of rectal suppository", "Administering oral medication", "Administraion Phototherapy for new born", "Administrating subcutaneous injection", "Administration of Anticoagulants injection", "Administration of intra dermal injection", "AIR Embolism", "Ambu bag manual ventilator", "Applying O2 mask", "Applying pressure bandage", "Applying wet to dry dressing", "Assessing Pulse rate", "Assisting in Electrocariogram", "Assisting in suturing", "AVF care", "Blood pressure checking", "Blood Transfusion", "Cast Application (Plaster)", "Catheterization", "Cervical Collar", "Cesarean birth Preoperative care", "Checking FHS (fetal heart sound)", "Checking Temperature", "CPR", "CTG", "Diabetic foot dressing", "Documentation", "Dressing for P.cath", "ECG", "Eye irrigation", "First aids of amputated care", "Hand washing", "Incident Report", "Injection preparation", "Inserting Astright Catheter", "Intra muscular injection", "Intradermal Injection", "IV Cannulation Insertion", "IV Fluid Administration", "IV therapy", "Last office procedure", "Lifting and moving technique", "Magnesium Sulphate preparations", "Management & Prevention measure of catheter related to infection", "Management of blood leaking during HD", "Management of Hypertention during & post HD", "Management of hypotension during dialysis", "Management of patient free heparin", "Managemet Of Blood line clotting during HD", "Measuring blood glucose level.", "Measuring Oxygen Saturation", "Metal clip removal", "Mixing medication from two vials", "Narcotic and psychotropic administration", "Nasal Pharangel & Nasal Suction", "Nebulization", "Needle Removal", "Needling", "Neourological assessment", "New-born Examination", "NGT insertion", "O2 Therapy", "Oral / nasal pharyngeal suction", "Oral Medication", "P.Cath dressing", "PPE", "Pulse Oxemeter", "Regulation IV flow rate", "Remove needle", "Removing unsterile gown and gloves", "Stomach wash", "Suction Nose & Mouth", "Suture removal", "Tempreature", "Tracheostomy Care", "Urinary Catheterization (Female)", "Urinary Catheterization (Male)", "vaccination", "Venipuncture for blood collection", "Vital signs", "Waste management", "Wound care / dressing", "Wound stapler removal"
];
function getBlocks(plan: CompPlan | undefined | null): Block[] {
  if (!plan) return []; const blocks: Block[] = []; let i = 0;
  while (i < 12) {
    if (plan.feedback?.[i] || !plan.procedures?.[i]) { i++; continue; }
    const proc = plan.procedures[i]!; let j = i;
    while (j + 1 < 12 && !plan.feedback?.[j + 1] && plan.procedures?.[j + 1] === proc) { j++; }
    const months: number[] = []; for (let k = i; k <= j; k++) months.push(k);
    blocks.push({ start: i, end: j, procedure: proc, months }); i = j + 1;
  }
  return blocks;
}
function blockLabel(b: Block) { return b.start === b.end ? MONTHS[b.start] : `${MONTHS[b.start]}-${MONTHS[b.end]}`; }
function blockForMonth(plan: CompPlan | undefined | null, monthIdx: number): Block | undefined { return getBlocks(plan).find(b => b.months.includes(monthIdx)); }
function formatMuscat(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso); if (isNaN(d.getTime())) return iso;
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Muscat', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
    const parts = fmt.formatToParts(d); const get = (t: string) => parts.find(p => p.type === t)?.value || "";
    return `${get('day')}-${get('month')}-${get('year')} ${get('hour')}:${get('minute')}`;
  } catch { return iso; }
}
function formatLiveTime(iso?: string): string {
  if (!iso) return "—";
  try { const d = new Date(iso); if (isNaN(d.getTime())) return iso; const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Muscat', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); return fmt.format(d); } catch { return iso; }
}
function labelFor(w: string, inst: string) { return cleanInstitutionName(inst, w); }
function scoreColor(s: string) {
  if (s === "NA") return { background: "#FDE68A", color: "#111111", fontWeight: 700 };
  const n = parseFloat(s); if (isNaN(n)) return {};
  if (n >= 95) return { background: "#C9EAD9", color: "#0B3D2E", fontWeight: 700 };
  if (n >= 85) return { background: "#EEF6C9", color: "#111111", fontWeight: 700 };
  return { background: "#FECACA", color: "#7F1D1D", fontWeight: 700 };
}
function procTag(p: string) { if (p.startsWith("[LR]")) return "LR"; if (p.startsWith("[RMC]")) return "RMC"; return "General"; }
function stripProcedurePrefix(name: string) { return name.replace(/^\[(LR|RMC)\]\s*/i, "").trim(); }

function xmlEscape(s: string) { return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
function colLetter(idx: number) { let n = idx; let s = ""; while (n >= 0) { s = String.fromCharCode(65 + (n % 26)) + s; n = Math.floor(n / 26) - 1; } return s; }
function isNumericCell(v: string) { if (v === "" || v === null || v === undefined) return false; const t = String(v).trim().toUpperCase(); if (t === "NA" || t === "") return false; const num = Number(t); return !isNaN(num) && isFinite(num); }
function sheetRowsToXml(rows: string[][]): string {
  const maxCols = Math.max(1, ...rows.map(r => r.length));
  const widths: number[] = [];
  for (let ci = 0; ci < maxCols; ci++) { let mx = 10; rows.forEach(r => { const v = String(r[ci] ?? ""); mx = Math.max(mx, Math.min(42, v.length + 2)); }); widths.push(mx); }
  const colsXml = `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w.toFixed(1)}" customWidth="1"/>`).join("")}</cols>`;
  const rowsXml = rows.map((row, ri) => {
    const rNum = ri + 1; const isHeader = ri <= 1;
    const cells = row.map((val, ci) => {
      const col = colLetter(ci); const ref = `${col}${rNum}`;
      if (val === null || val === undefined) val = "";
      const str = String(val); const s = isHeader ? ` s="1"` : ` s="0"`;
      if (isNumericCell(str)) { return `<c r="${ref}"${s}><v>${xmlEscape(str)}</v></c>`; } else { return `<c r="${ref}" t="inlineStr"${s}><is><t>${xmlEscape(str)}</t></is></c>`; }
    }).join("");
    return `<row r="${rNum}"${isHeader ? ' ht="20"' : ""}>${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${colsXml}<sheetData>${rowsXml}</sheetData><autoFilter ref="A1:${colLetter(maxCols - 1)}${rows.length}"/></worksheet>`;
}
function makeCRCTable() { const table: number[] = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) { c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); } table[n] = c; } return table; }
const CRC_TABLE = makeCRCTable();
function crc32Bytes(buf: Uint8Array) { let crc = 0 ^ (-1); for (let i = 0; i < buf.length; i++) { crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xFF]; } return (crc ^ (-1)) >>> 0; }
function strToBytes(s: string) { return new TextEncoder().encode(s); }
type ZipFile = { name: string; data: Uint8Array };
function buildZip(files: ZipFile[]): Uint8Array {
  const localParts: number[][] = []; const centralParts: number[][] = []; let offset = 0;
  const writeU16 = (arr: number[], v: number) => { arr.push(v & 0xFF, (v >>> 8) & 0xFF); };
  const writeU32 = (arr: number[], v: number) => { arr.push(v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF); };
  for (const f of files) {
    const nameBytes = strToBytes(f.name); const data = f.data; const crc = crc32Bytes(data);
    const local: number[] = []; writeU32(local, 0x04034b50); writeU16(local, 20); writeU16(local, 0); writeU16(local, 0); writeU16(local, 0); writeU16(local, 0); writeU32(local, crc); writeU32(local, data.length); writeU32(local, data.length); writeU16(local, nameBytes.length); writeU16(local, 0);
    localParts.push(local, Array.from(nameBytes), Array.from(data));
    const central: number[] = []; writeU32(central, 0x02014b50); writeU16(central, 20); writeU16(central, 20); writeU16(central, 0); writeU16(central, 0); writeU16(central, 0); writeU16(central, 0); writeU32(central, crc); writeU32(central, data.length); writeU32(central, data.length); writeU16(central, nameBytes.length); writeU16(central, 0); writeU16(central, 0); writeU16(central, 0); writeU16(central, 0); writeU32(central, 0); writeU32(central, offset);
    centralParts.push(central, Array.from(nameBytes));
    offset += local.length + nameBytes.length + data.length;
  }
  let centralSize = 0; for (const p of centralParts) centralSize += p.length;
  const centralOffset = offset;
  const eocd: number[] = []; writeU32(eocd, 0x06054b50); writeU16(eocd, 0); writeU16(eocd, 0); writeU16(eocd, files.length); writeU16(eocd, files.length); writeU32(eocd, centralSize); writeU32(eocd, centralOffset); writeU16(eocd, 0);
  const totalLen = offset + centralSize + eocd.length;
  const out = new Uint8Array(totalLen); let pos = 0;
  const push = (arr: number[]) => { for (const b of arr) { out[pos++] = b; } };
  for (const p of localParts) push(p);
  for (const p of centralParts) push(p);
  push(eocd);
  return out;
}
function sanitizeSheetName(name: string) { let s = name.replace(/[\\/*?:\[\]]/g, "_").slice(0, 31); if (!s) s = "Sheet"; return s; }
function downloadXLSX(filename: string, sheets: { name: string, rows: string[][] }[]) {
  const safeSheets = sheets.map((sh, i) => ({ name: sanitizeSheetName(sh.name || `Sheet${i + 1}`), rows: sh.rows }));
  const contentTypesOverrides = safeSheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${contentTypesOverrides}</Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${safeSheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${safeSheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${safeSheets.map((sh, i) => `<sheet name="${xmlEscape(sh.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F766E"/><bgColor rgb="FF0F766E"/></patternFill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color auto="1"/></left><right style="thin"><color auto="1"/></right><top style="thin"><color auto="1"/></top><bottom style="thin"><color auto="1"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" alignment="1" horizontal="center" vertical="center"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const files: ZipFile[] = [
    { name: "[Content_Types].xml", data: strToBytes(contentTypes) },
    { name: "_rels/.rels", data: strToBytes(rels) },
    { name: "xl/_rels/workbook.xml.rels", data: strToBytes(workbookRels) },
    { name: "xl/workbook.xml", data: strToBytes(workbook) },
    { name: "xl/styles.xml", data: strToBytes(styles) },
  ];
  safeSheets.forEach((sh, i) => {
    const xml = sheetRowsToXml(sh.rows);
    files.push({ name: `xl/worksheets/sheet${i + 1}.xml`, data: strToBytes(xml) });
  });
  const zipBytes = buildZip(files);
  const zipCopy: Uint8Array<ArrayBuffer> = new Uint8Array(zipBytes);
  const blob = new Blob([zipCopy.buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const DEFAULT_PLANS: Plan[] = TOPICS.map(t => ({ id: `default-plan-${t}`, topic: t, year: 2027, frequency: "Monthly", periods: [...MONTHS], active: true }));
const DEFAULT_COMP_PLANS: CompPlan[] = [
  { id: "default-comp-General Nursing", category: "General Nursing", year: 2027, frequency: "Monthly", periods: [...MONTHS], procedures: ["Neourological assessment", "Neourological assessment", "Neourological assessment", "Urinary Catheterization (Male)", "Urinary Catheterization (Male)", null, "IV Cannulation Insertion", "IV Cannulation Insertion", "IV Fluid Administration", "Cast Application (Plaster)", null, null], feedback: [false, false, false, false, false, true, false, false, false, false, false, false], active: true },
  { id: "default-comp-Renal Medicine Center", category: "Renal Medicine Center", year: 2027, frequency: "Monthly", periods: [...MONTHS], procedures: ["[RMC] Pre Dialysis assessment of Haemodialysis Patient", "[RMC] Pre Dialysis assessment of Haemodialysis Patient", "[RMC] Priming Dialysis Machine", "[RMC] Priming Dialysis Machine", null, "[RMC] Commencing patient with Permanent access to HD Machine", "[RMC] Commencing patient with Permanent access to HD Machine", "[RMC] Post Dialysis assessment of Haemodialysis Patient", "[RMC] Disconnecting patient with Permanent access from HD Machine", null, "[RMC] Management of hypotension during dialysis", null], feedback: [false, false, false, false, true, false, false, false, false, false, false, false], active: true },
  { id: "default-comp-Labour Rooms", category: "Labour Rooms", year: 2027, frequency: "Monthly", periods: [...MONTHS], procedures: ["[LR] Vaginal Examination", "[LR] Vaginal Examination", "[LR] 2nd Stage of Labour", "[LR] 2nd Stage of Labour", null, "[LR] 3rd Stage of Labour", "[LR] 3rd Stage of Labour", "[LR] Episiotomy Incision, Repair", "[LR] Breast Feeding Assessment", "Checking FHS (fetal heart sound)", null, null], feedback: [false, false, false, false, true, false, false, false, false, false, false, false], active: true },
];
const DEFAULT_SCORES: Score[] = [
  { id: "default-score-1", planId: "default-plan-Crash Cart", wilayat: "Suhar", institution: "Suhar EHC", topic: "Crash Cart", year: 2027, period: "Jan", score: "95", comment: "Crash cart checklist complete.", auditorName: "Salim Al Mamari", auditedAt: "2026-11-22T03:42:00.000Z", history: [] },
  { id: "default-score-2", planId: "default-plan-Crash Cart", wilayat: "Suhar", institution: "Suhar EHC", topic: "Crash Cart", year: 2027, period: "Feb", score: "98", comment: "Minor labelling fixed on site.", auditorName: "Salim Al Mamari", auditedAt: "2026-11-22T04:10:00.000Z", history: [] },
];
const DEFAULT_COMP_SCORES: CompScore[] = [
  { id: "default-comp-score-1", planId: "default-comp-General Nursing", wilayat: "Khaboorah", institution: "Khaboorah EHC", category: "General Nursing", year: 2027, period: "Jan", procedure: "Neourological assessment", score: "92", comment: "Good technique.", auditorName: "Salim Al Mamari", auditedAt: "2026-11-22T03:42:00.000Z", history: [] },
];

async function api(action: string, args: any) {
  const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch("actions", { method: "POST", cache: "no-store", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, args }), signal: ctrl.signal });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.error) {
      throw new Error(json.error || `Request failed (${res.status})`);
    }
    return json.data;
  } finally { clearTimeout(timer); }
}

// No browser fallback: a failed shared-backend write must
// surface as an error, never look saved on one device only.
function saveLocalBackup(_state: any) {}
function loadLocalBackup(): any | null { return null; }

export default function App() {
  useEffect(() => { document.title = "North Al Batinah — Nursing Audit System"; }, []);
  // Login persistence: per-device localStorage (NOT Supabase).
  // Supabase row "audit_current_user" was shared for everyone, so one
  // device logging in overwrote another device's login. localStorage
  // keeps Saham logged in on iPhone and Admin logged in on laptop.
  // Only username + sessionVersion are saved, never a password.
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('audit_current_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      const found = DEFAULT_USERS.find(u => u.username === String(parsed.username || '').toLowerCase());
      return found || null;
    } catch { return null; }
  });
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loginError, setLoginError] = useState("");
  const [part, setPart] = useState<"1" | "2">("1");
  const [tab, setTab] = useState("Dashboard");
  const [plans, setPlans] = useState<Plan[]>(DEFAULT_PLANS);
  const [scores, setScores] = useState<Score[]>(DEFAULT_SCORES);
  const [overrides, setOverrides] = useState<PwdOverride[]>([]);
  const [compPlans, setCompPlans] = useState<CompPlan[]>(DEFAULT_COMP_PLANS);
  const [compScores, setCompScores] = useState<CompScore[]>(DEFAULT_COMP_SCORES);
  const [instOverrides, setInstOverrides] = useState<InstOverride[]>([]);
  const [procOverrides, setProcOverrides] = useState<ProcOverride[]>([]);
  const [auditorProfiles, setAuditorProfiles] = useState<AuditorProfile[]>([]);
  const [security, setSecurity] = useState<SecuritySettings>(DEFAULT_SECURITY);
  const [securityId, setSecurityId] = useState<string>("");
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [userSessionVersion, setUserSessionVersion] = useState<number | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState("");
  const [recoveryInput, setRecoveryInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [planId, setPlanId] = useState("");
  const [wilayatFilter, setWilayatFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedCell, setSelectedCell] = useState<{ wilayat: string; institution: string; period: string; part?: string; category?: string } | null>(null);
  const [scoreInput, setScoreInput] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [auditorNameInput, setAuditorNameInput] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [pwdForm, setPwdForm] = useState({ username: "suhar", password: "" });
  const [pwdConfirm, setPwdConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [compPlanId, setCompPlanId] = useState("");
  const [newPlan, setNewPlan] = useState({ topic: TOPICS[0], year: 2027 });
  const [newCompPlan, setNewCompPlan] = useState({ category: CATEGORIES[0] as string, year: 2027, procedures: Array(12).fill(null) as (string | null)[], feedback: Array(12).fill(false) as boolean[] });
  const [editingCompPlanId, setEditingCompPlanId] = useState<string | null>(null);
  function setCompMonth(i: number, mode: "procedure" | "skip" | "feedback", proc?: string | null) {
    setNewCompPlan(prev => {
      const procedures = [...prev.procedures]; const feedback = [...prev.feedback];
      if (mode === "skip") { procedures[i] = null; feedback[i] = false; }
      else if (mode === "feedback") { procedures[i] = null; feedback[i] = true; }
      else { procedures[i] = proc ?? procedures[i]; feedback[i] = false; }
      return { ...prev, procedures, feedback };
    });
  }
  const [editingCompPlanId, setEditingCompPlanId] = useState("");
  const [editingProcedures, setEditingProcedures] = useState<(string | null)[]>([]);
  const [editingFeedback, setEditingFeedback] = useState<boolean[]>([]);
  const [instForm, setInstForm] = useState({ wilayat: "Suhar", name: "", assignments: ["Part 1"] as string[] });
  const [editingInst, setEditingInst] = useState<EffInst | null>(null);
  const [instMsg, setInstMsg] = useState("");
  const [procForm, setProcForm] = useState({ name: "", tag: "General" });
  const [editingProc, setEditingProc] = useState<{ name: string; sourceId?: string; sourceKind?: string; originalName?: string } | null>(null);
  const [procMsg, setProcMsg] = useState("");
  const [procSearch, setProcSearch] = useState("");
  const [procFilterTag, setProcFilterTag] = useState("All");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(new Date().toISOString());
  const [liveStatus, setLiveStatus] = useState<"live" | "offline" | "refreshing">("live");
  const [liveToast, setLiveToast] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [securityMsg, setSecurityMsg] = useState("");
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [supabaseReason, setSupabaseReason] = useState("");
  const [syncRowsLoaded, setSyncRowsLoaded] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState("");
  const [viewportWidth, setViewportWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  const [singleMonthView, setSingleMonthView] = useState(false);
  const [mobileMonthIdx, setMobileMonthIdx] = useState(() => new Date().getMonth());
  const gridRef = React.useRef<HTMLDivElement | null>(null);

  const GUIDE_TEXT = `Wilayat Quick Guide — How to Enter Scores on Your Phone
1. Open shared link, log in with Wilayat account (e.g. suhar / suhar123)
2. Choose Part 1 or Part 2 at top
3. Choose Year and Topic/Category
4. In Audit Grid, swipe sideways to see months. Turn ON Single month view for easiest entry.
5. Tap a cell (e.g. Saham Hospital • Jan) -> bottom sheet opens: enter Score (0-100 or NA), Your Name mandatory, Comment optional, Save.
6. To edit, tap same cell again.
7. Tap Refresh at top to see latest scores from other Wilayats.
8. Check Dashboard for completion %.`;

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => { window.removeEventListener("resize", onResize); window.removeEventListener("orientationchange", onResize); };
  }, []);

  const effectiveUsers = useMemo(() => DEFAULT_USERS.map(u => { const o = overrides.find(x => x.username === u.username); return o ? { ...u, password: o.password } : u; }), [overrides]);

  const effInstList = useMemo<EffInst[]>(() => {
    const map = new Map<string, EffInst>();
    const setEntry = (wilayat: string, institution: string, assignments: string[], source?: Partial<EffInst>) => {
      const clean = cleanInstitutionName(institution, wilayat);
      const key = `${wilayat}||${clean.toLowerCase()}`;
      const existing = map.get(key);
      if (existing) {
        const merged = [...new Set([...existing.assignments, ...assignments])];
        map.set(key, { ...existing, assignments: merged, ...(source || {}) });
      } else {
        map.set(key, { wilayat, institution: clean, assignments: [...assignments], ...(source || {}) });
      }
    };
    Object.entries(INSTITUTIONS).forEach(([w, list]) => list.forEach(inst => setEntry(w, inst, ["Part 1"])));
    const COMP_INSTITUTIONS_RAW: Record<string, string[]> = {
      "General Nursing": ["Khaboorah_Khaboorah EHC", "Khaboorah_Qasbia HC", "Khaboorah_Wadi Hawasna Hospital", "Khaboorah_Wadi Sarrami Hospital", "Khaboorah_Wadi Shafan HC", "Liwa_Liwa HC", "Liwa_Nabr HC", "Liwa_Rahab HC", "Saham_Saham Polyclinic", "Saham_Ghuwaisah HC", "Saham_Hafeet HC", "Saham_Wadi Bani Omar HC", "Shinas_Abu Baqra HC", "Shinas_Shinas EHC", "Shinas_Shinas RDC", "Suhar_Al Uwaynat HC", "Suhar_Falaj Al Qbail HC", "Suhar_Multaqa HC", "Suhar_Suhar EHC", "Suhar_Suhar MFC", "Suhar_Traif HC", "Suhar_Wadi Ahin HC", "Suhar_Wadi Heebi Hospital", "Suwaiq_Bidaya HC", "Suwaiq_Khadhra HC", "Suwaiq_Mashaiq HC", "Suwaiq_Shireesa HC", "Suwaiq_Suwaiq EHC", "Suwaiq_Tharmad HC", "Suwaiq_Wadi Al Jahawer HC"],
      "Renal Medicine Center": ["Suhar_Suhar RMC", "Saham_Saham RMC", "Suwaiq_Suwaiq RMC"],
      "Labour Rooms": ["Saham_Saham Hospital LR", "Shinas_Shinas LR", "Suwaiq_Suwaiq Hospital LR"],
    };
    Object.entries(COMP_INSTITUTIONS_RAW).forEach(([cat, list]) => list.forEach(s => { const i = s.indexOf("_"); setEntry(s.slice(0, i), s.slice(i + 1), [cat]); }));
    instOverrides.forEach(rec => {
      if (rec.kind === "delete") {
        const origW = rec.originalWilayat || rec.wilayat; const origN = cleanInstitutionName(rec.originalName || rec.name, origW); map.delete(`${origW}||${origN.toLowerCase()}`);
      } else if (rec.kind === "add") {
        const clean = cleanInstitutionName(rec.name, rec.wilayat); map.set(`${rec.wilayat}||${clean.toLowerCase()}`, { wilayat: rec.wilayat, institution: clean, assignments: [...(rec.assignments || [])], sourceId: rec.id, sourceKind: "add", originalWilayat: rec.wilayat, originalName: clean });
      } else if (rec.kind === "edit") {
        const origW = rec.originalWilayat || rec.wilayat; const origN = cleanInstitutionName(rec.originalName || rec.name, origW); map.delete(`${origW}||${origN.toLowerCase()}`); const clean = cleanInstitutionName(rec.name, rec.wilayat); map.set(`${rec.wilayat}||${clean.toLowerCase()}`, { wilayat: rec.wilayat, institution: clean, assignments: [...(rec.assignments || [])], sourceId: rec.id, sourceKind: "edit", originalWilayat: origW, originalName: origN });
      }
    });
    return [...map.values()].sort((a, b) => WILAYAT_ORDER.indexOf(a.wilayat) - WILAYAT_ORDER.indexOf(b.wilayat) || a.institution.localeCompare(b.institution));
  }, [instOverrides]);

  const effPart1 = useMemo<Record<string, string[]>>(() => {
    const out: Record<string, string[]> = {}; WILAYAT_ORDER.forEach(w => { out[w] = effInstList.filter(e => e.wilayat === w && e.assignments.includes("Part 1")).map(e => e.institution).sort((a, b) => a.localeCompare(b)); }); return out;
  }, [effInstList]);
  const effComp = useMemo<Record<string, { wilayat: string; institution: string }[]>>(() => {
    const out: Record<string, { wilayat: string; institution: string }[]> = {}; CATEGORIES.forEach(cat => { out[cat] = effInstList.filter(e => e.assignments.includes(cat)).map(e => ({ wilayat: e.wilayat, institution: e.institution })).sort((a, b) => WILAYAT_ORDER.indexOf(a.wilayat) - WILAYAT_ORDER.indexOf(b.wilayat) || a.institution.localeCompare(b.institution)); }); return out;
  }, [effInstList]);
  const effectiveProcedures = useMemo<string[]>(() => {
    const map = new Map<string, { name: string }>(); PROCEDURES.forEach(p => map.set(p.toLowerCase(), { name: p }));
    procOverrides.forEach(rec => {
      if (rec.kind === "delete") { map.delete((rec.originalName || rec.name).toLowerCase()); }
      else if (rec.kind === "add") { map.set(rec.name.toLowerCase(), { name: rec.name }); }
      else if (rec.kind === "edit") { map.delete((rec.originalName || rec.name).toLowerCase()); map.set(rec.name.toLowerCase(), { name: rec.name }); }
    });
    return [...map.values()].map(v => v.name);
  }, [procOverrides]);
  const displayProcedure = (proc: string | null | undefined): string => { if (!proc) return "— Skipped —"; const exists = effectiveProcedures.some(p => p.toLowerCase() === proc.toLowerCase()); return exists ? proc : "(Removed procedure)"; };

  const applySupabaseRows = (rows: any[]) => {
    if (!rows || rows.length === 0) return false;
    // Merge rule: shared database wins. Sort oldest -> newest by updated_at
    // so that when the same logical record exists twice (two devices saved
    // the same cell), the newest copy is the one kept below.
    const sortedRows = [...rows].sort((a: any, b: any) => {
      const ta = a?.updated_at ? new Date(a.updated_at).getTime() : 0;
      const tb = b?.updated_at ? new Date(b.updated_at).getTime() : 0;
      return ta - tb;
    });
    rows = sortedRows;
    let hasData = false;
    const newPlans: Plan[] = []; const newScores: Score[] = []; const newCompPlans: CompPlan[] = []; const newCompScores: CompScore[] = [];
    const newInst: InstOverride[] = []; const newProc: ProcOverride[] = []; const newPwd: PwdOverride[] = []; const newAuditor: AuditorProfile[] = [];
    let newSecurity: SecuritySettings | null = null; let newSecId = ""; const newAttempts: LoginAttempt[] = [];
    let sessionCandidate: { username: string; sessionVersion: number } | null = null;
    rows.forEach(r => {
      const id = r.id || ""; const d = r.data || {};
      try {
        if (id === "audit_current_user" || id.startsWith("audit_session")) { /* IGNORED: login is per-device localStorage, shared row must never overwrite this device's login. */ return; }
        // Aggregate rows: one row whose data is the whole collection.
        if ((id === "audit_scores" || id === "audit_plans" || id === "audit_institutions" || id === "audit_procedures" || id === "audit_users") && Array.isArray(d)) {
          hasData = true;
          if (id === "audit_scores") d.forEach((item: any) => { if (item) newScores.push({ id: item.id || `agg-${Date.now()}-${Math.random()}`, planId: item.planId, wilayat: item.wilayat, institution: cleanInstitutionName(item.institution, item.wilayat), topic: item.topic, year: item.year, period: item.period, score: item.score, comment: item.comment, auditorName: item.auditorName, auditedAt: item.auditedAt, history: item.history || [] }); });
          if (id === "audit_plans") d.forEach((item: any) => { if (item) newPlans.push({ id: item.id || `agg-plan-${Date.now()}`, topic: item.topic, year: item.year, frequency: item.frequency || "Monthly", periods: item.periods || [...MONTHS], active: !!item.active }); });
          if (id === "audit_institutions") d.forEach((item: any) => { if (!item) return; if (item.kind) newInst.push({ id: item.id || `agg-inst-${Date.now()}-${Math.random()}`, kind: item.kind, wilayat: item.wilayat, name: item.name, assignments: item.assignments || [], originalWilayat: item.originalWilayat, originalName: item.originalName }); else newInst.push({ id: `agg-inst-${Date.now()}-${Math.random()}`, kind: "add", wilayat: item.wilayat, name: item.institution || item.name, assignments: item.assignments || ["Part 1"], originalWilayat: item.wilayat, originalName: item.institution || item.name }); });
          if (id === "audit_procedures") d.forEach((item: any) => { if (!item) return; if (typeof item === "string") newProc.push({ id: `agg-proc-${Date.now()}-${Math.random()}`, kind: "add", name: item }); else if (item.kind) newProc.push({ id: item.id || `agg-proc-${Date.now()}-${Math.random()}`, kind: item.kind, name: item.name, originalName: item.originalName }); else newProc.push({ id: `agg-proc-${Date.now()}-${Math.random()}`, kind: "add", name: item.name }); });
          if (id === "audit_users") d.forEach((item: any) => { if (item?.username && item?.password) newPwd.push({ id: item.id || `agg-user-${item.username}`, username: item.username, password: item.password }); });
          return;
        }
        // V5 FIX: Part 1 scores MUST be checked BEFORE plans. Old code checked
        // plans first with (topic && year) — every Part 1 score has topic+year,
        // so scores were misfiled as plans and never appeared on other devices.
        // Part 2 worked because its scores have no topic. Plans now match ONLY by ID.
        if (id.startsWith("audit_scores_") || (d.wilayat && d.institution && d.period && d.topic && (d.score !== undefined || d.planId))) { newScores.push({ id: d.id || id, planId: d.planId, wilayat: d.wilayat, institution: cleanInstitutionName(d.institution, d.wilayat), topic: d.topic, year: d.year, period: d.period, score: d.score, comment: d.comment, auditorName: d.auditorName, auditedAt: d.auditedAt, history: d.history || [] }); hasData = true; }
        else if (id.startsWith("audit_plans_")) { newPlans.push({ id: d.id || id, topic: d.topic, year: d.year, frequency: d.frequency || "Monthly", periods: d.periods || [...MONTHS], active: !!d.active }); hasData = true; }
        else if (id.startsWith("competency_plans_") || (d.category && d.procedures)) { newCompPlans.push({ id: d.id || id, category: d.category, year: d.year, frequency: d.frequency || "Monthly", periods: d.periods || [...MONTHS], procedures: d.procedures || Array(12).fill(null), feedback: d.feedback || Array(12).fill(false), active: !!d.active }); hasData = true; }
        else if (id.startsWith("competency_scores_") || (d.wilayat && d.procedure && d.category)) { newCompScores.push({ id: d.id || id, planId: d.planId, wilayat: d.wilayat, institution: cleanInstitutionName(d.institution, d.wilayat), category: d.category, year: d.year, period: d.period, procedure: d.procedure, score: d.score, comment: d.comment, auditorName: d.auditorName, auditedAt: d.auditedAt, history: d.history || [] }); hasData = true; }
        else if (id.startsWith("audit_institutions_")) { newInst.push({ id: d.id || id, kind: d.kind, wilayat: d.wilayat, name: d.name, assignments: d.assignments || [], originalWilayat: d.originalWilayat, originalName: d.originalName }); hasData = true; }
        else if (id.startsWith("audit_procedures_")) { newProc.push({ id: d.id || id, kind: d.kind, name: d.name, originalName: d.originalName }); hasData = true; }
        else if (id.startsWith("audit_passwords_") || (d.username && d.password)) { newPwd.push({ id: d.id || id, username: d.username, password: d.password }); hasData = true; }
        else if (id.startsWith("audit_auditor_names_")) { newAuditor.push({ id: d.id || id, username: d.username, lastName: d.lastName }); hasData = true; }
        else if (id.startsWith("audit_security") || d.disabled || d.recoveryCode !== undefined) { newSecurity = { ...DEFAULT_SECURITY, ...d, disabled: Array.isArray(d.disabled) ? d.disabled : [] }; newSecId = d.id || id; hasData = true; }
        else if (id.startsWith("audit_login_attempts_")) { newAttempts.push({ id: d.id || id, username: d.username, success: d.success, status: d.status, at: d.at, reason: d.reason }); }
      } catch {}
    });
    // Restore a persisted login only on a fresh load (no user yet). The
    // effective security + overrides from this same batch decide whether
    // the saved session is still valid.
    if (sessionCandidate && !user) {
      const effSecurity = newSecurity || security;
      const candidateUser = DEFAULT_USERS.find(u => u.username === sessionCandidate.username);
      if (candidateUser && sessionCandidate.sessionVersion === effSecurity.sessionVersion && !effSecurity.disabled.includes(candidateUser.username) && !(effSecurity.locked && candidateUser.role !== "Master")) {
        setUser(candidateUser);
        setUserSessionVersion(sessionCandidate.sessionVersion);
        setTab("Dashboard");
      }
    }
    // De-duplicate by logical key, keeping the newest (last, after the
    // updated_at sort above) so a second device's newer save wins over an
    // older copy of the same cell / plan instead of showing both.
    const dedupBy = <T,>(arr: T[], key: (v: T) => string): T[] => {
      const m = new Map<string, T>();
      arr.forEach((v) => m.set(key(v), v));
      return [...m.values()];
    };
    // V4: dedup plans with Active = OR. Supabase holds old + new rows for same topic.
    // If any copy is Active, keep Active. Never let an old inactive copy turn it off.
    const dedupedPlans = (() => { const m = new Map<string, any>(); newPlans.forEach(v => { const k = `${v.topic}||${v.year}`; const e = m.get(k); m.set(k, e ? { ...v, active: !!(e.active || v.active) } : v); }); return [...m.values()]; })();
    const dedupedScores = dedupBy(newScores, (s) => `${s.planId}||${s.wilayat}||${s.institution}||${s.period}`);
    const dedupedCompPlans = (() => { const m = new Map<string, any>(); newCompPlans.forEach(v => { const k = `${v.category}||${v.year}`; const e = m.get(k); m.set(k, e ? { ...v, active: !!(e.active || v.active) } : v); }); return [...m.values()]; })();
    const dedupedCompScores = dedupBy(newCompScores, (s) => `${s.planId}||${s.wilayat}||${s.institution}||${s.period}`);
    // MERGE, never replace: a fetch that runs seconds after a save may not yet
    // include that just-saved row. Replacing would wipe it from the screen.
    // Merge keeps local scores not yet in Supabase, Supabase wins on conflict.
    // PLAN-ID FIX: if Supabase returns the same Crash Cart plan with a different
    // id, scores saved under the old id would become invisible (grid filters by
    // planId). So merge scores by wilayat||institution||period||topic, ignoring
    // planId, and keep the local plan id. Never let a plan copy hide a score.
    if (dedupedScores.length) setScores(prev => { const m = new Map(prev.map(x => [`${x.wilayat}||${x.institution}||${x.period}||${x.topic || ''}`, x])); dedupedScores.forEach(x => { const k = `${x.wilayat}||${x.institution}||${x.period}||${x.topic || ''}`; const existing = m.get(k); m.set(k, existing ? { ...x, planId: existing.planId, id: existing.id } : x); }); return [...m.values()]; });
    if (dedupedPlans.length) setPlans(prev => { const m = new Map(prev.map(x => [`${x.topic}||${x.year}`, x])); dedupedPlans.forEach(x => { const k = `${x.topic}||${x.year}`; const existing = m.get(k); m.set(k, existing ? { ...x, id: existing.id, active: !!(existing.active || x.active) } : x); }); return [...m.values()]; });
    if (dedupedCompPlans.length) setCompPlans(prev => { const m = new Map(prev.map(x => [`${x.category}||${x.year}`, x])); dedupedCompPlans.forEach(x => { const k = `${x.category}||${x.year}`; const existing = m.get(k); m.set(k, existing ? { ...x, id: existing.id, active: !!(existing.active || x.active) } : x); }); return [...m.values()]; });
    if (dedupedCompScores.length) setCompScores(prev => { const m = new Map(prev.map(x => [`${x.wilayat}||${x.institution}||${x.period}||${x.category || ''}`, x])); dedupedCompScores.forEach(x => { const k = `${x.wilayat}||${x.institution}||${x.period}||${x.category || ''}`; const existing = m.get(k); m.set(k, existing ? { ...x, planId: existing.planId, id: existing.id } : x); }); return [...m.values()]; });
    if (newInst.length) setInstOverrides(newInst);
    if (newProc.length) setProcOverrides(newProc);
    if (newPwd.length) setOverrides(newPwd);
    if (newAuditor.length) setAuditorProfiles(newAuditor);
    if (newSecurity) { setSecurity(newSecurity); setSecurityId(newSecId); }
    if (newAttempts.length) setLoginAttempts(newAttempts.sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime()));
    return hasData;
  };

  const loadFromSupabase = async (): Promise<boolean> => {
    if (!isSupabaseConfigured) { setSupabaseConnected(false); setSupabaseReason("no-config"); return false; }
    setLiveStatus("refreshing");
    const res = await sbLoadAll();
    const now = new Date().toISOString();
    if (!res.ok) {
      setSupabaseConnected(false); setSupabaseReason(res.reason || "unknown"); setLiveStatus("offline");
      setLiveToast(`Supabase not connected: ${res.reason || "unknown"} — showing local data only`);
      return false;
    }
    setSupabaseConnected(true); setSupabaseReason(""); setSyncRowsLoaded(res.rows.length); setLastSyncAt(now); setLastUpdatedAt(now); setLiveStatus("live"); setBackendError("");
    if (res.rows.length === 0) { return true; }
    const ok = applySupabaseRows(res.rows);
    if (ok) { saveLocalBackup({ plans, scores, compPlans, compScores, instOverrides, procOverrides, overrides, auditorProfiles, security }); }
    return true;
  };

  const reloadRecords = async (): Promise<boolean> => {
    if (isSupabaseConfigured) {
      const ok = await loadFromSupabase();
      if (ok) return true;
      // Shared fetch failed: fall through to the records-API path below
      // instead of clearing state, and never touch the logged-in user.
    }
    try {
      const cols = ["audit_plans", "audit_scores", "audit_passwords", "competency_plans", "competency_scores", "audit_institutions", "audit_procedures", "audit_auditor_names", "audit_security", "audit_login_attempts"];
      const raw = await Promise.all(cols.map(c => api("records.list", { collection: c }).catch(() => ({ records: [] }))));
      const byIdx = (i: number) => (raw[i] as any)?.records || [];
      const p = byIdx(0).map((r: any) => ({ id: r.id, topic: r.value.topic, year: r.value.year, frequency: r.value.frequency || "Monthly", periods: r.value.periods || [...MONTHS], active: !!r.value.active }));
      const s = byIdx(1).map((r: any) => ({ id: r.id, ...r.value, institution: cleanInstitutionName(r.value.institution, r.value.wilayat) }));
      const o = byIdx(2).map((r: any) => ({ id: r.id, ...r.value }));
      const cp = byIdx(3).map((r: any) => ({ id: r.id, category: r.value.category, year: r.value.year, frequency: r.value.frequency || "Monthly", periods: r.value.periods || [...MONTHS], procedures: r.value.procedures || Array(12).fill(null), feedback: r.value.feedback || Array(12).fill(false), active: !!r.value.active }));
      const cs = byIdx(4).map((r: any) => ({ id: r.id, ...r.value, institution: cleanInstitutionName(r.value.institution, r.value.wilayat) }));
      const io = byIdx(5).map((r: any) => ({ id: r.id, ...r.value }));
      const po = byIdx(6).map((r: any) => ({ id: r.id, ...r.value }));
      const ap = byIdx(7).map((r: any) => ({ id: r.id, ...r.value }));
      const secRec = byIdx(8)[0]; const sec = secRec ? { ...DEFAULT_SECURITY, ...secRec.value, disabled: Array.isArray(secRec.value?.disabled) ? secRec.value.disabled : [] } : DEFAULT_SECURITY;
      const att = byIdx(9).map((r: any) => ({ id: r.id, ...r.value })).sort((a: any, b: any) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime());
      if (p.length) setPlans(prev => { const m = new Map(prev.map((x:any)=>[`${x.topic}||${x.year}`, x])); p.forEach((x:any)=>m.set(`${x.topic}||${x.year}`, x)); return [...m.values()]; }); if (s.length) setScores(prev => { const m = new Map(prev.map((x:any)=>[`${x.planId}||${x.wilayat}||${x.institution}||${x.period}`, x])); s.forEach((x:any)=>m.set(`${x.planId}||${x.wilayat}||${x.institution}||${x.period}`, x)); return [...m.values()]; }); if (o.length) setOverrides(o); if (cp.length) setCompPlans(cp); if (cs.length) setCompScores(cs); if (io.length) setInstOverrides(io); if (po.length) setProcOverrides(po); if (ap.length) setAuditorProfiles(ap); setSecurity(sec); setSecurityId(secRec ? secRec.id : ""); setLoginAttempts(att);
      const now = new Date().toISOString(); setLastUpdatedAt(now); setLiveStatus("live");
      saveLocalBackup({ plans: p.length ? p : plans, scores: s.length ? s : scores, compPlans: cp.length ? cp : compPlans, compScores: cs.length ? cs : compScores, instOverrides: io, procOverrides: po, overrides: o, auditorProfiles: ap, security: sec });
      return true;
    } catch {
      const backup = loadLocalBackup();
      if (backup) {
        if (backup.plans) setPlans(backup.plans); if (backup.scores) setScores(backup.scores); if (backup.compPlans) setCompPlans(backup.compPlans); if (backup.compScores) setCompScores(backup.compScores);
        if (backup.overrides) setOverrides(backup.overrides); if (backup.instOverrides) setInstOverrides(backup.instOverrides); if (backup.procOverrides) setProcOverrides(backup.procOverrides);
        if (backup.security) setSecurity(backup.security);
        setLiveStatus("offline");
      } else {
        setLiveStatus("offline");
      }
      return false;
    }
  };

  useEffect(() => { (async () => { await reloadRecords(); })(); }, []);

  // Auto-refresh every 10 seconds: re-fetch + merge from the shared
  // database only. Never reloads the page and never clears the user.
  // Skipped while a score sheet is open or a save is in flight so an
  // in-progress edit is not overwritten by incoming data.
  const reloadRef = React.useRef(reloadRecords);
  const lastSaveAtRef = React.useRef(0);
  useEffect(() => { reloadRef.current = reloadRecords; });
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(async () => {
      if (selectedCell || busy) return;
      if (Date.now() - lastSaveAtRef.current < 20000) return;
      try { await reloadRef.current(); } catch { /* status already set to offline by reloadRecords */ }
    }, 10000);
    return () => clearInterval(timer);
  }, [user, selectedCell, busy]);

  // Sync-first save: Supabase FIRST, awaited. On failure show a visible
  // toast — never silently fall back. Local backup / records API run after.
  const syncSaveFirst = async (id: string, dataObj: any) => {
    if (!isSupabaseConfigured) { setSupabaseConnected(false); setSupabaseReason("no-config"); setLiveToast("Save failed to Supabase: no-config — not saved"); return { ok: false, reason: "no-config" }; }
    const res = await sbSave(id, dataObj);
    const now = new Date().toISOString();
    if (res.ok) { setSupabaseConnected(true); setSupabaseReason(""); setLastSyncAt(now); setLastUpdatedAt(now); setLiveStatus("live"); }
    else { setSupabaseConnected(false); setSupabaseReason(res.reason || "unknown"); setLiveStatus("offline"); setLiveToast(`Save failed to Supabase: ${res.reason || "unknown"} — not saved. Try again.`); }
    return res;
  };

  const activePlan = useMemo(() => {
    const forTopic = plans.filter(p => p.topic === topic);
    if (planId) { const f = forTopic.find(p => p.id === planId); if (f) return f; }
    return forTopic.find(p => p.active) || forTopic[0];
  }, [plans, topic, planId]);
  useEffect(() => { if (activePlan && planId !== activePlan.id) setPlanId(activePlan.id); }, [activePlan]);
  const activeCompPlan = useMemo(() => {
    const forCat = compPlans.filter(p => p.category === category);
    if (compPlanId) { const f = forCat.find(p => p.id === compPlanId); if (f) return f; }
    return forCat.find(p => p.active) || forCat[0];
  }, [compPlans, category, compPlanId]);
  useEffect(() => { if (activeCompPlan && compPlanId !== activeCompPlan.id) setCompPlanId(activeCompPlan.id); }, [activeCompPlan]);

  const visibleWilayats = useMemo(() => { if (!user) return []; if (user.role !== "Wilayat") return wilayatFilter === "All" ? [...WILAYAT_ORDER] : [wilayatFilter]; return [user.wilayat]; }, [user, wilayatFilter]);
  const visibleInstitutions = useMemo(() => {
    const list: { wilayat: string; institution: string }[] = [];
    visibleWilayats.forEach(w => (effPart1[w] || []).forEach(inst => {
      if (search && !(`${w} ${labelFor(w, inst)}`).toLowerCase().includes(search.toLowerCase()) && !labelFor(w, inst).toLowerCase().includes(search.toLowerCase())) return;
      list.push({ wilayat: w, institution: labelFor(w, inst) });
    }));
    return list;
  }, [visibleWilayats, search, effPart1]);
  const visibleCompInstitutions = useMemo(() => {
    const all = effComp[category] || []; return all.filter(v => {
      if (user?.role === "Wilayat" && user && v.wilayat !== user.wilayat) return false;
      if (user?.role !== "Wilayat" && wilayatFilter !== "All" && v.wilayat !== wilayatFilter) return false;
      if (search && !(`${v.wilayat} ${labelFor(v.wilayat, v.institution)}`).toLowerCase().includes(search.toLowerCase()) && !labelFor(v.wilayat, v.institution).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [category, user, wilayatFilter, search, effComp]);

  // V3: filter by topic, NOT planId — Saham and Admin can load different copies
  // of the same plan with different ids. Filtering by planId hid Saham scores from Admin.
  const planScores = useMemo(() => activePlan ? scores.filter(s => (s.topic || '') === (activePlan.topic || '') && (!s.year || !activePlan.year || s.year === activePlan.year)) : [], [scores, activePlan]);
  const findScore = (w: string, inst: string, period: string) => planScores.find(s => s.wilayat === w && s.institution === inst && s.period === period);
  // V3: same fix for Part 2 — filter by category, not planId.
  const compPlanScores = useMemo(() => activeCompPlan ? compScores.filter(s => (s.category || '') === (activeCompPlan.category || '') && (!s.year || !activeCompPlan.year || s.year === activeCompPlan.year)) : [], [compScores, activeCompPlan]);
  const findCompScore = (w: string, inst: string, period: string) => compPlanScores.find(s => s.wilayat === w && s.institution === inst && s.period === period);
  const activeBlocks = useMemo(() => getBlocks(activeCompPlan), [activeCompPlan]);
  const findBlockScore = (w: string, inst: string, block: Block): CompScore | undefined => {
    const cands = compPlanScores.filter(s => s.wilayat === w && s.institution === inst && block.months.includes(MONTH_INDEX[s.period] ?? -1));
    if (!cands.length) return undefined;
    return [...cands].sort((a, b) => { const da = a.auditedAt ? new Date(a.auditedAt).getTime() : 0; const db = b.auditedAt ? new Date(b.auditedAt).getTime() : 0; if (db !== da) return db - da; return (MONTH_INDEX[b.period] ?? 0) - (MONTH_INDEX[a.period] ?? 0); })[0];
  };

  const manualRefresh = async () => {
    // Refresh = re-fetch + merge only. No page reload, no logout:
    // the logged-in user state is left untouched.
    if (refreshing) return;
    setRefreshing(true); setLiveStatus("refreshing");
    let ok = false;
    try { ok = await reloadRecords(); } catch { ok = false; }
    const now = new Date().toISOString();
    setRefreshing(false);
    if (ok) {
      setLastUpdatedAt(now); setLiveStatus("live");
      setLiveToast(`Live • Updated ${formatLiveTime(now)}`);
    } else {
      setLiveStatus("offline");
      setLiveToast("Local only — shared database could not be reached. Your login is kept; try Refresh again.");
    }
    setTimeout(() => setLiveToast(null), 4000);
  };

  async function login(e: React.FormEvent) {
    e.preventDefault(); setLoginError("");
    const uname = username.trim().toLowerCase(); const entered = password;
    const defaultUser = DEFAULT_USERS.find(u => u.username === uname);
    const override = overrides.find(o => o.username === uname);
    const effective = effectiveUsers.find(u => u.username === uname) || defaultUser;
    const defaultMatches = !!defaultUser && defaultUser.password === entered;
    const overrideMatches = !!override && override.password === entered;
    const passwordOk = override ? overrideMatches : defaultMatches;
    const matchedUser = passwordOk ? (override ? effective : defaultUser) : undefined;
    if (!matchedUser || !passwordOk) { setLoginError("Incorrect username or password. Use a demo login below."); return; }
    if (security.disabled.includes(matchedUser.username)) { setLoginError("This account has been disabled by Admin."); return; }
    if (security.locked && matchedUser.role !== "Master") { setLoginError("System locked by Master."); return; }
    if (security.accessCodeEnabled && accessCodeInput.trim() !== security.accessCode) { setLoginError("Incorrect Directorate Access Code."); return; }
    setUser(matchedUser); setUserSessionVersion(security.sessionVersion); setTab("Dashboard"); setAccessCodeInput(""); setRecoveryInput(""); setLoginError("");
    // Persist only username + sessionVersion on THIS device (never password, never Supabase).
    try { localStorage.setItem('audit_current_user', JSON.stringify({ username: matchedUser.username, sessionVersion: security.sessionVersion })); } catch {}
    await reloadRecords();
  }
  async function logout() { setUser(null); setPassword(""); setSelectedCell(null); setUserSessionVersion(null); try { localStorage.removeItem('audit_current_user'); } catch {} }

  const isScoreValid = (v: string) => { const t = v.trim().toUpperCase(); if (t === "") return false; if (t === "NA") return true; const n = Number(t); return !isNaN(n) && n >= 0 && n <= 100; };
  const isNameValid = (v: string) => v.trim().length >= 2;

  async function saveCell() {
    if (!selectedCell || !user) return;
    const val = scoreInput.trim().toUpperCase();
    const nameVal = auditorNameInput.trim();
    if (!isScoreValid(scoreInput)) { setLiveToast("Score is mandatory: enter 0–100 or NA."); return; }
    if (!isNameValid(auditorNameInput)) { setLiveToast("Auditor Name is mandatory: enter at least 2 characters."); return; }
    setBusy(true); setSaveMsg(""); lastSaveAtRef.current = Date.now();
    const nowIso = new Date().toISOString();
    if (selectedCell.part === "2") {
      if (!activeCompPlan) { setBusy(false); return; }
      const idx = activeCompPlan.periods.indexOf(selectedCell.period);
      if (idx >= 0 && activeCompPlan.feedback?.[idx]) { setLiveToast("This month is Obtaining Feedback — it cannot receive a score."); setBusy(false); return; }
      const proc = (idx >= 0 ? activeCompPlan.procedures?.[idx] : null) || "";
      const existing = findCompScore(selectedCell.wilayat, selectedCell.institution, selectedCell.period);
      const value = { planId: activeCompPlan.id, wilayat: selectedCell.wilayat, institution: cleanInstitutionName(selectedCell.institution, selectedCell.wilayat), category: selectedCell.category || category, year: activeCompPlan.year, period: selectedCell.period, procedure: proc, score: val, comment: commentInput.trim(), auditorName: nameVal, auditedAt: nowIso, history: existing?.history || [] };
      const newId = existing ? existing.id : `comp-score-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newRec: CompScore = { id: newId, ...value } as CompScore;
      setCompScores(prev => { const filtered = prev.filter(s => !(s.wilayat === selectedCell.wilayat && s.institution === selectedCell.institution && s.period === selectedCell.period && s.planId === activeCompPlan.id)); return [...filtered, newRec]; });
      const supId = `competency_scores_${newId}`;
      await syncSaveFirst(supId, { id: newId, ...value });
      try { if (existing) await api("records.replace", { collection: "competency_scores", id: existing.id, value }); else await api("records.create", { collection: "competency_scores", value, idempotency_key: `compscore-${activeCompPlan.id}-${selectedCell.wilayat}-${selectedCell.institution}-${selectedCell.period}-${Date.now()}` }); } catch {}
      saveLocalBackup({ plans, scores, compPlans, compScores: [...compScores.filter(s => !(s.wilayat === selectedCell.wilayat && s.institution === selectedCell.institution && s.period === selectedCell.period && s.planId === activeCompPlan.id)), newRec], instOverrides, procOverrides, overrides, auditorProfiles, security });
      setSaveMsg(""); setSelectedCell(null); setBusy(false);
      setLastUpdatedAt(nowIso); setLiveStatus("live");
      return;
    }
    if (!activePlan) { setBusy(false); return; }
    const existing = findScore(selectedCell.wilayat, selectedCell.institution, selectedCell.period);
    const value = { planId: activePlan.id, wilayat: selectedCell.wilayat, institution: cleanInstitutionName(selectedCell.institution, selectedCell.wilayat), topic: activePlan.topic, year: activePlan.year, period: selectedCell.period, score: val, comment: commentInput.trim(), auditorName: nameVal, auditedAt: nowIso, history: existing?.history || [] };
    const newId = existing ? existing.id : `score-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newRec: Score = { id: newId, ...value } as Score;
    setScores(prev => { const filtered = prev.filter(s => !(s.wilayat === selectedCell.wilayat && s.institution === selectedCell.institution && s.period === selectedCell.period && s.planId === activePlan.id)); return [...filtered, newRec]; });
    const supId = `audit_scores_${newId}`;
    await syncSaveFirst(supId, { id: newId, ...value });
    try { if (existing) await api("records.replace", { collection: "audit_scores", id: existing.id, value }); else await api("records.create", { collection: "audit_scores", value, idempotency_key: `score-${activePlan.id}-${selectedCell.wilayat}-${selectedCell.institution}-${selectedCell.period}-${Date.now()}` }); } catch {}
    saveLocalBackup({ plans, scores: [...scores.filter(s => !(s.wilayat === selectedCell.wilayat && s.institution === selectedCell.institution && s.period === selectedCell.period && s.planId === activePlan.id)), newRec], compPlans, compScores, instOverrides, procOverrides, overrides, auditorProfiles, security });
    setSaveMsg(""); setSelectedCell(null); setBusy(false); setLastUpdatedAt(nowIso); setLiveStatus("live");
  }

  async function deleteScore() {
    if (!selectedCell) return;
    setBusy(true);
    if (selectedCell.part === "2") {
      const ex = findCompScore(selectedCell.wilayat, selectedCell.institution, selectedCell.period); if (!ex) { setBusy(false); return; }
      setCompScores(prev => prev.filter(s => s.id !== ex.id));
      await supabaseDelete(`competency_scores_${ex.id}`);
      try { await api("records.delete", { collection: "competency_scores", id: ex.id }); } catch {}
    } else {
      const ex = findScore(selectedCell.wilayat, selectedCell.institution, selectedCell.period); if (!ex) { setBusy(false); return; }
      setScores(prev => prev.filter(s => s.id !== ex.id));
      await supabaseDelete(`audit_scores_${ex.id}`);
      try { await api("records.delete", { collection: "audit_scores", id: ex.id }); } catch {}
    }
    setSelectedCell(null); setLiveToast("Entry removed."); setBusy(false);
  }

  function openCell(v: { wilayat: string; institution: string }, period: string, partOverride?: string, catOverride?: string) {
    if (!user) return;
    // 9 - Deactivated plan: Wilayat can view but cannot edit. Admin/Master can still edit.
    if (user.role === "Wilayat") {
      if (partOverride === "2" && activeCompPlan && !activeCompPlan.active) { setLiveToast("This Competency plan is deactivated — view only. Ask Admin to activate it to edit."); return; }
      if (partOverride !== "2" && activePlan && !activePlan.active) { setLiveToast("This Part 1 plan is deactivated — view only. Ask Admin to activate it to edit."); return; }
    }
    if (partOverride === "2") {
      const ex = findCompScore(v.wilayat, v.institution, period);
      setSelectedCell({ wilayat: v.wilayat, institution: v.institution, period, part: "2", category: catOverride || category });
      setScoreInput(ex ? ex.score : ""); setCommentInput(ex ? ex.comment : ""); setAuditorNameInput(ex?.auditorName || auditorProfiles.find(p => p.username === user.username)?.lastName || ""); setSaveMsg(""); return;
    }
    const ex = findScore(v.wilayat, v.institution, period);
    setSelectedCell({ wilayat: v.wilayat, institution: v.institution, period, part: "1" });
    setScoreInput(ex ? ex.score : ""); setCommentInput(ex ? ex.comment : ""); setAuditorNameInput(ex?.auditorName || auditorProfiles.find(p => p.username === user.username)?.lastName || ""); setSaveMsg("");
  }

  const isMaster = user?.role === "Master";
  const isAdminRole = user?.role === "Admin";
  const isAdmin = isMaster || isAdminRole;
  const headerRoleText = isMaster ? "Master" : isAdminRole ? "Admin — Nursing Service Department" : `${user?.label} — Wilayat`;
  const tabs = ["Dashboard", "Audit Grid", "Comments", "Guide", ...(isAdmin ? ["Plans", "Control Panel"] : [])];

  function statsFor(list: Score[]) { const nums = list.filter(s => s.score !== "NA" && s.score !== "").map(s => parseFloat(s.score)).filter(n => !isNaN(n)); return { count: list.length, avg: nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null }; }
  function statsForComp(list: CompScore[]) { const nums = list.filter(s => s.score !== "NA" && s.score !== "").map(s => parseFloat(s.score)).filter(n => !isNaN(n)); return { count: list.length, avg: nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null }; }
  const gridStats = useMemo(() => {
    const relevant = planScores.filter(s => visibleInstitutions.some(v => v.wilayat === s.wilayat && v.institution === s.institution));
    const totalExpected = activePlan ? visibleInstitutions.length * activePlan.periods.length : 0;
    const st = statsFor(relevant);
    return { ...st, totalExpected, missing: Math.max(0, totalExpected - relevant.length), completion: totalExpected ? (relevant.length / totalExpected * 100) : 0 };
  }, [planScores, visibleInstitutions, activePlan]);
  const compGridStats = useMemo(() => {
    if (!activeCompPlan) return { count: 0, avg: null as number | null, totalExpected: 0, missing: 0, completion: 0 };
    let count = 0; const allBlockScores: CompScore[] = [];
    visibleCompInstitutions.forEach(v => { activeBlocks.forEach(b => { const s = findBlockScore(v.wilayat, v.institution, b); if (s) { count++; allBlockScores.push(s); } }); });
    const totalExpected = visibleCompInstitutions.length * activeBlocks.length;
    const st = statsForComp(allBlockScores);
    return { count, avg: st.avg, totalExpected, missing: Math.max(0, totalExpected - count), completion: totalExpected ? (count / totalExpected * 100) : 0 };
  }, [compPlanScores, visibleCompInstitutions, activeCompPlan, activeBlocks]);

  const dbLabel = isSupabaseConfigured && supabaseConnected ? `Live • Supabase • Connected • Updated ${formatLiveTime(lastUpdatedAt)}` : isSupabaseConfigured ? `Local only • Supabase not connected: ${supabaseReason || "unknown"}` : `Local mode • Updated ${formatLiveTime(lastUpdatedAt)}`;

  function exportCSV() {
    if (part === "2") {
      if (!activeCompPlan) return;
      const simpleHeader = ["Wilayat", "Institution", "Category", "Number of Audits", ...activeCompPlan.periods.map((p, i) => `${p} | ${activeCompPlan.feedback?.[i] ? "Obtaining Feedback" : `Procedure: ${displayProcedure(activeCompPlan.procedures?.[i])}`} | Score`), ...activeCompPlan.periods.map((p, i) => `${p} | Comment`), ...activeCompPlan.periods.map((p, i) => `${p} | Audited by`), ...activeCompPlan.periods.map((p, i) => `${p} | Added at Muscat`), ...activeCompPlan.periods.map((p, i) => `${p} | Added at ISO`)];
      const simple: string[][] = [simpleHeader];
      visibleCompInstitutions.forEach(v => {
        const blockMap = new Map<string, CompScore>();
        activeBlocks.forEach(b => { const s = findBlockScore(v.wilayat, v.institution, b); if (s) blockMap.set(`${b.start}-${b.end}`, s); });
        const count = blockMap.size;
        const scoreCells = activeCompPlan.periods.map((p, i) => {
          if (activeCompPlan.feedback?.[i]) return "Feedback"; if (!activeCompPlan.procedures?.[i]) return "";
          const block = blockForMonth(activeCompPlan, i); if (!block) return ""; const bs = blockMap.get(`${block.start}-${block.end}`); if (!bs) return ""; if (bs.period === p) return bs.score; return `Covered — score in ${bs.period}`;
        });
        const commentCells = activeCompPlan.periods.map((p, i) => { if (activeCompPlan.feedback?.[i]) return "Feedback"; const block = blockForMonth(activeCompPlan, i); if (!block) return ""; const bs = blockMap.get(`${block.start}-${block.end}`); if (!bs) return ""; return bs.period === p ? (bs.comment || "") : ""; });
        const auditorCells = activeCompPlan.periods.map((p, i) => { if (activeCompPlan.feedback?.[i]) return ""; const block = blockForMonth(activeCompPlan, i); if (!block) return ""; const bs = blockMap.get(`${block.start}-${block.end}`); if (!bs) return ""; return bs.period === p ? (bs.auditorName || "") : ""; });
        const muscatCells = activeCompPlan.periods.map((p, i) => { if (activeCompPlan.feedback?.[i]) return ""; const block = blockForMonth(activeCompPlan, i); if (!block) return ""; const bs = blockMap.get(`${block.start}-${block.end}`); if (!bs) return ""; return bs.period === p ? (bs.auditedAt ? formatMuscat(bs.auditedAt) : "") : ""; });
        const isoCells = activeCompPlan.periods.map((p, i) => { if (activeCompPlan.feedback?.[i]) return ""; const block = blockForMonth(activeCompPlan, i); if (!block) return ""; const bs = blockMap.get(`${block.start}-${block.end}`); if (!bs) return ""; return bs.period === p ? (bs.auditedAt || "") : ""; });
        simple.push([v.wilayat, labelFor(v.wilayat, v.institution), category, String(count), ...scoreCells, ...commentCells, ...auditorCells, ...muscatCells, ...isoCells]);
      });
      const csv = simple.map(r => r.map(c => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `competency-${activeCompPlan.category}-${activeCompPlan.year}.csv`; a.click(); URL.revokeObjectURL(url); return;
    }
    if (!activePlan) return;
    const rowsHeader = ["Wilayat", "Institution", "Number of Audits", "Average (%)", ...activePlan.periods.map(p => `${p} Score`), ...activePlan.periods.map(p => `${p} Comment`), ...activePlan.periods.map(p => `${p} Audited by`), ...activePlan.periods.map(p => `${p} Added at Muscat DD-MM-YYYY HH:mm`), ...activePlan.periods.map(p => `${p} Added at ISO`)];
    const rows: string[][] = [rowsHeader];
    visibleInstitutions.forEach(v => {
      const cells = activePlan.periods.map(p => findScore(v.wilayat, v.institution, p));
      const nums = cells.filter(c => c && c.score !== "NA").map(c => parseFloat(c!.score)).filter(n => !isNaN(n));
      rows.push([v.wilayat, labelFor(v.wilayat, v.institution), String(cells.filter(Boolean).length), nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : "", ...cells.map(c => c ? c.score : ""), ...cells.map(c => c ? c.comment : ""), ...cells.map(c => c?.auditorName || ""), ...cells.map(c => c?.auditedAt ? formatMuscat(c.auditedAt) : ""), ...cells.map(c => c?.auditedAt || ""),]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `audit-${activePlan.topic}-${activePlan.year}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  function exportPart1StatsExcel() {
    const nowIso = new Date().toISOString(); const nowMuscat = formatMuscat(nowIso);
    const filteredScores = scores.filter(s => {
      if (user?.role === "Wilayat" && s.wilayat !== user.wilayat) return false;
      if (isAdmin && wilayatFilter !== "All" && s.wilayat !== wilayatFilter) return false;
      if (search && !(`${s.wilayat} ${labelFor(s.wilayat, s.institution)}`.toLowerCase().includes(search.toLowerCase()))) return false;
      if (activePlan) { return s.planId === activePlan.id; }
      return s.topic === topic;
    });
    const detailedHeader = ["Wilayat", "Institution", "Topic", "Year", "Month", "Score", "Audited by", "Added at (Asia/Muscat)", "Comment", "Status"];
    const detailedRows: string[][] = [["Part 1 Statistics", `Topic=${topic} | Year=${activePlan?.year || "All"} | Wilayat=${wilayatFilter} | Generated ${nowMuscat}`], [""], detailedHeader];
    const sorted = [...filteredScores].sort((a, b) => { const wi = WILAYAT_ORDER.indexOf(a.wilayat) - WILAYAT_ORDER.indexOf(b.wilayat); if (wi !== 0) return wi; const ii = a.institution.localeCompare(b.institution); if (ii !== 0) return ii; return (MONTH_INDEX[a.period] ?? 0) - (MONTH_INDEX[b.period] ?? 0); });
    sorted.forEach(s => { const status = s.score === "NA" ? "NA" : s.score ? "Submitted" : "Missing"; detailedRows.push([s.wilayat, labelFor(s.wilayat, s.institution), s.topic, String(s.year), s.period, s.score, s.auditorName || "", s.auditedAt ? formatMuscat(s.auditedAt) : "", s.comment || "", status]); });
    if (detailedRows.length === 3) { detailedRows.push(["No data for current filters", "", "", "", "", "", "", "", "", ""]); }
    const summaryHeader = ["Wilayat", "Institutions count", "Audits count", "Average", "Completion %"];
    const summaryRows: string[][] = [["Summary by Wilayat - Part 1", `Generated ${nowMuscat}`], [""], summaryHeader];
    const wilayatsForSummary = user?.role === "Wilayat" ? [user.wilayat] : (wilayatFilter === "All" ? [...WILAYAT_ORDER] : [wilayatFilter]);
    wilayatsForSummary.forEach(w => {
      const instCount = (effPart1[w] || []).filter(inst => { if (search && !(`${w} ${labelFor(w, inst)}`.toLowerCase().includes(search.toLowerCase()))) return false; return true; }).length;
      const rel = filteredScores.filter(s => s.wilayat === w);
      const nums = rel.filter(s => s.score !== "NA" && s.score !== "").map(s => parseFloat(s.score)).filter(n => !isNaN(n));
      const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : "";
      const expected = instCount * 12;
      const completion = expected ? ((rel.length / expected) * 100).toFixed(1) : "0";
      summaryRows.push([w, String(instCount), String(rel.length), avg, completion]);
    });
    downloadXLSX(`Part1_Stats_${activePlan?.year || "All"}_${topic}_${Date.now()}.xlsx`, [{ name: "Detailed Scores", rows: detailedRows }, { name: "Summary by Wilayat", rows: summaryRows }]);
  }

  function exportPart2StatsExcel() {
    const nowMuscat = formatMuscat(new Date().toISOString());
    const blocks = activeCompPlan ? getBlocks(activeCompPlan) : [];
    const detailedHeader = ["Category", "Wilayat", "Institution", "Procedure", "Year", "Block", "Month", "Score", "Audited by", "Added at (Asia/Muscat)", "Status"];
    const detailedRows: string[][] = [["Part 2 Statistics", `Category=${category} | Year=${activeCompPlan?.year || "All"} | Generated ${nowMuscat}`], [""], detailedHeader];
    if (activeCompPlan) {
      const sortedInst = [...visibleCompInstitutions].sort((a, b) => WILAYAT_ORDER.indexOf(a.wilayat) - WILAYAT_ORDER.indexOf(b.wilayat) || a.institution.localeCompare(b.institution));
      sortedInst.forEach(v => {
        blocks.forEach(b => {
          const s = findBlockScore(v.wilayat, v.institution, b);
          if (s) { detailedRows.push([category, v.wilayat, labelFor(v.wilayat, v.institution), b.procedure, String(activeCompPlan.year), blockLabel(b), s.period, s.score, s.auditorName || "", s.auditedAt ? formatMuscat(s.auditedAt) : "", "Submitted"]); }
          else { detailedRows.push([category, v.wilayat, labelFor(v.wilayat, v.institution), b.procedure, String(activeCompPlan.year), blockLabel(b), MONTHS[b.start], "", "", "", "Missing"]); }
        });
      });
    }
    const summaryHeader = ["Category", "Wilayat", "Institutions count", "Audits (blocks)", "Expected blocks", "Completion %", "Average"];
    const summaryRows: string[][] = [["Summary by Category/Wilayat - Part 2", `Generated ${nowMuscat}`], [""], summaryHeader];
    const wilayatsForSummary = user?.role === "Wilayat" ? [user.wilayat] : (wilayatFilter === "All" ? [...WILAYAT_ORDER] : [wilayatFilter]);
    wilayatsForSummary.forEach(w => {
      const insts = (effComp[category] || []).filter(v => v.wilayat === w && (!search || `${v.wilayat} ${labelFor(v.wilayat, v.institution)}`.toLowerCase().includes(search.toLowerCase())));
      const instCount = insts.length; const expected = activeCompPlan ? instCount * blocks.length : instCount;
      let audits = 0; const nums: number[] = [];
      insts.forEach(v => { if (activeCompPlan) { blocks.forEach(b => { const s = findBlockScore(v.wilayat, v.institution, b); if (s) { audits++; if (s.score !== "NA") { const n = parseFloat(s.score); if (!isNaN(n)) nums.push(n); } } }); } });
      const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : ""; const completion = expected ? ((audits / expected) * 100).toFixed(1) : "0";
      summaryRows.push([category, w, String(instCount), String(audits), String(expected), completion, avg]);
    });
    downloadXLSX(`Part2_Stats_${activeCompPlan?.year || "All"}_${category}_${Date.now()}.xlsx`, [{ name: "Detailed Scores", rows: detailedRows }, { name: "Summary by Category", rows: summaryRows }]);
  }

  // 9 - Master/Admin can activate / deactivate plans. Deactivated = Wilayat sees scores but cannot edit.
  async function togglePart1PlanActive(plan: Plan) {
    const next = !plan.active;
    setPlans(prev => prev.map(x => x.id === plan.id ? { ...x, active: next } : x));
    try { await syncSaveFirst(`audit_plans_${plan.id}`, { id: plan.id, topic: plan.topic, year: plan.year, frequency: plan.frequency, periods: plan.periods, active: next }); } catch {}
    setLiveToast(next ? `${plan.topic} · ${plan.year} activated.` : `${plan.topic} · ${plan.year} deactivated — Wilayat view only.`);
  }
  async function toggleCompPlanActive(plan: CompPlan) {
    const next = !plan.active;
    setCompPlans(prev => prev.map(x => x.id === plan.id ? { ...x, active: next } : x));
    try { await syncSaveFirst(`competency_plans_${plan.id}`, { id: plan.id, category: plan.category, year: plan.year, frequency: plan.frequency, periods: plan.periods, procedures: plan.procedures, feedback: plan.feedback, active: next }); } catch {}
    setLiveToast(next ? `${plan.category} · ${plan.year} activated.` : `${plan.category} · ${plan.year} deactivated — Wilayat view only.`);
  }
  // 5 - Export Competency plan to Word (.doc) — SAME style/text as previous chat version.
  // Logo must be EMBEDDED as base64 (Word cannot open a /assets/... path), so we fetch the
  // imported logo file and convert it to a data URL before building the file.
  async function exportCompPlanWord() {
    if (!activeCompPlan) return;
    const shortCat = activeCompPlan.category.includes("Renal") ? "RMC" : activeCompPlan.category.includes("Labour") ? "Labour Rooms" : activeCompPlan.category;
    const title = `${shortCat} Competency Procedures plan ${activeCompPlan.year}`;
    // --- Logo as base64 (fixes "logo can't display") ---
    let logoDataUrl = "";
    try {
      const res = await fetch(mohLogo);
      const blob = await res.blob();
      logoDataUrl = await new Promise<string>((resolve) => { const r = new FileReader(); r.onload = () => resolve(String(r.result || "")); r.onerror = () => resolve(""); r.readAsDataURL(blob); });
    } catch { logoDataUrl = ""; }
    const logoImg = logoDataUrl ? `<img src="${logoDataUrl}" alt="Ministry of Health logo" style="height:72px;width:auto;" />` : "";
    // --- Build rows: one row per unique procedure/block, highlight months according to plan ---
    // Walk months in order, group consecutive months with the same procedure into one block.
    type PlanRow = { name: string; months: Set<number>; feedback: boolean };
    const rows: PlanRow[] = [];
    const blocks = getBlocks(activeCompPlan);
    // Use blocks (same logic as grid) so a procedure repeated for 3 months = 1 row with 3 highlighted months.
    blocks.forEach((b) => {
      const proc = displayProcedure(activeCompPlan.procedures?.[b.start]) || "";
      const months = new Set<number>(); for (let i = b.start; i <= b.end; i++) months.add(i);
      rows.push({ name: proc, months, feedback: false, _start: b.start } as any);
    });
    // Feedback months are skipped by getBlocks, so group consecutive feedback months into their own row(s)
    // in the same order as the plan (e.g. Nov-Dec = one "Obtaining Feedback" row, purple).
    {
      let i = 0;
      while (i < 12) {
        if (!activeCompPlan.feedback?.[i]) { i++; continue; }
        let j = i; while (j + 1 < 12 && activeCompPlan.feedback?.[j + 1]) j++;
        const months = new Set<number>(); for (let k = i; k <= j; k++) months.add(k);
        rows.push({ name: "Obtaining Feedback", months, feedback: true, _start: i } as any);
        i = j + 1;
      }
      rows.sort((a: any, b: any) => a._start - b._start);
    }
    // Fallback: if no blocks (empty plan), show one row per month
    if (rows.length === 0) {
      activeCompPlan.periods.forEach((_, i) => {
        const isFb = !!activeCompPlan.feedback?.[i];
        rows.push({ name: isFb ? "Obtaining Feedback" : (displayProcedure(activeCompPlan.procedures?.[i]) || "—"), months: new Set([i]), feedback: isFb });
      });
    }
    const monthHeaders = MONTHS.map(m => `<th style="width:6.5%;">${m}</th>`).join("");
    const bodyRows = rows.map((r, idx) => {
      const cells = MONTHS.map((_, mi) => {
        if (r.feedback && r.months.has(mi)) return `<td style="background:#ede9fe;color:#4c1d95;font-size:8pt;font-weight:bold;text-align:center;">Obtaining Feedback</td>`;
        if (r.months.has(mi)) return `<td style="background:#c9ead9;">&nbsp;</td>`;
        return `<td>&nbsp;</td>`;
      }).join("");
      return `<tr><td style="text-align:center;">${idx + 1}</td><td style="text-align:left;">${xmlEscape(r.name)}</td>${cells}</tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${xmlEscape(title)}</title><style>@page WordSection1{size:29.7cm 21cm;mso-page-orientation:landscape;margin:1cm 1cm 1cm 1cm;} div.WordSection1{page:WordSection1;} body{font-family:Calibri,Arial,sans-serif;font-size:10pt;color:#102a2c;} p{margin:4pt 0;} table{border-collapse:collapse;width:100%;font-size:9pt;} th,td{border:1pt solid #7a8a88;padding:4pt 5pt;text-align:center;vertical-align:middle;} th{background:#0d6e6b;color:#ffffff;font-weight:bold;} thead{display:table-header-group;} tr{page-break-inside:avoid;}</style></head><body><div class="WordSection1"><div style="text-align:center;"><p style="text-align:center;margin:0 0 6pt;">${logoImg}</p><p style="font-size:13pt;font-weight:bold;margin:2pt 0;">North Batinah Governorate</p><p style="font-size:13pt;font-weight:bold;margin:2pt 0;">Nursing Service Department</p><p style="font-size:15pt;font-weight:bold;margin:4pt 0 10pt;">${xmlEscape(title)}</p></div><table><thead><tr><th style="width:5%;">Serial Number</th><th style="width:22%;text-align:left;">Planned Procedures</th>${monthHeaders}</tr></thead><tbody>${bodyRows}</tbody></table></div></body></html>`;
    const outBlob = new Blob(["\ufeff" + html], { type: "application/msword" });
    const url = URL.createObjectURL(outBlob); const a = document.createElement("a"); a.href = url; a.download = `${title.replace(/\s+/g, "_")}.doc`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function createPlan(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const value = { topic: newPlan.topic, year: newPlan.year, frequency: "Monthly", periods: [...MONTHS], active: true };
      const newId = `plan-${Date.now()}`;
      const newP: Plan = { id: newId, ...value };
      setPlans(prev => [...prev.filter(p => !(p.topic === value.topic && p.year === value.year)), newP]);
      await syncSaveFirst(`audit_plans_${newId}`, { id: newId, ...value });
      try { await api("records.create", { collection: "audit_plans", value, idempotency_key: `plan-${newPlan.topic}-${newPlan.year}-${Date.now()}` }); } catch {}
      setLiveToast("Plan created and set as active."); setTopic(newPlan.topic);
    } catch (err: any) { setSaveMsg(`Could not create plan: ${err.message}`); }
    setBusy(false);
  }
  async function createCompPlan(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const editing = editingCompPlanId ? compPlans.find(p => p.id === editingCompPlanId) : null;
      const value = { category: newCompPlan.category, year: newCompPlan.year, frequency: "Monthly", periods: [...MONTHS], procedures: newCompPlan.procedures, feedback: newCompPlan.feedback, active: editing ? editing.active : true };
      const newId = editing ? editing.id : `compplan-${Date.now()}`;
      const newP: CompPlan = { id: newId, ...value };
      setCompPlans(prev => editing ? prev.map(p => p.id === newId ? newP : p) : [...prev.filter(p => !(p.category === value.category && p.year === value.year)), newP]);
      await syncSaveFirst(`competency_plans_${newId}`, { id: newId, ...value });
      try { await api("records.create", { collection: "competency_plans", value, idempotency_key: `compplan-${newCompPlan.category}-${newCompPlan.year}-${Date.now()}` }); } catch {}
      setLiveToast(editingCompPlanId ? "Part 2 plan updated." : "Part 2 plan created."); setCategory(newCompPlan.category); setEditingCompPlanId(null);
    } catch (err: any) { setSaveMsg(`Could not create Part 2 plan: ${err.message}`); }
    setBusy(false);
  }
  async function changePassword(e: React.FormEvent) {
    e.preventDefault(); setPwdMsg("");
    if (pwdForm.username === "master" && user?.role !== "Master") { setPwdMsg("Only Master can change Master's password."); return; }
    if (!pwdForm.password || pwdForm.password.length < 4) { setPwdMsg("Choose a password of at least 4 characters."); return; }
    if (pwdForm.password !== pwdConfirm) { setPwdMsg("Passwords do not match."); return; }
    setBusy(true);
    try {
      const existing = overrides.find(o => o.username === pwdForm.username);
      const newId = existing ? existing.id : `pwd-${Date.now()}`;
      const val = { username: pwdForm.username, password: pwdForm.password };
      if (existing) setOverrides(prev => prev.map(o => o.id === existing.id ? { ...o, ...val } : o)); else setOverrides(prev => [...prev, { id: newId, ...val }]);
      await syncSaveFirst(`audit_passwords_${pwdForm.username}`, { id: newId, ...val });
      if (existing) await api("records.replace", { collection: "audit_passwords", id: existing.id, value: val }).catch(() => {});
      else await api("records.create", { collection: "audit_passwords", value: val, idempotency_key: `pwd-${pwdForm.username}-${Date.now()}` }).catch(() => {});
      setPwdMsg(`Password updated for ${pwdForm.username}.`); setPwdForm({ ...pwdForm, password: "" }); setPwdConfirm("");
    } catch (err: any) { setPwdMsg(`Could not update: ${err.message}`); }
    setBusy(false);
  }

  function toggleInstAssignment(a: string) { setInstForm(prev => ({ ...prev, assignments: prev.assignments.includes(a) ? prev.assignments.filter(x => x !== a) : [...prev.assignments, a] })); }
  async function saveInstitution(e: React.FormEvent) {
    e.preventDefault(); setInstMsg("");
    const cleanName = cleanInstitutionName(instForm.name, instForm.wilayat);
    if (!cleanName) { setInstMsg("Enter an institution name."); return; }
    if (instForm.assignments.length === 0) { setInstMsg("Tick at least one assignment."); return; }
    setBusy(true);
    try {
      const newId = editingInst?.sourceId || `inst-${Date.now()}`;
      const val = { kind: editingInst ? "edit" : "add", wilayat: instForm.wilayat, name: cleanName, assignments: instForm.assignments, originalWilayat: editingInst?.wilayat, originalName: editingInst?.institution };
      if (editingInst) setInstOverrides(prev => prev.map(x => x.id === newId ? { ...x, ...val, id: newId } as InstOverride : x)); else setInstOverrides(prev => [...prev, { id: newId, ...val } as InstOverride]);
      await syncSaveFirst(`audit_institutions_${newId}`, { id: newId, ...val });
      setInstMsg(`Institution "${cleanName}" saved.`); setEditingInst(null); setInstForm({ wilayat: "Suhar", name: "", assignments: ["Part 1"] });
    } catch (err: any) { setInstMsg(`Could not save: ${err.message}`); }
    setBusy(false);
  }

  function normalizeProcName(raw: string, tag: string) { const trimmed = raw.trim(); if (tag === "LR" || tag === "RMC") { const base = stripProcedurePrefix(trimmed); return `[${tag}] ${base}`; } return trimmed; }
  async function saveProcedure(e: React.FormEvent) {
    e.preventDefault(); setProcMsg("");
    const finalName = normalizeProcName(procForm.name, procForm.tag);
    if (!finalName) { setProcMsg("Enter a procedure name."); return; }
    setBusy(true);
    try {
      const newId = editingProc?.sourceId || `proc-${Date.now()}`;
      const val = { kind: editingProc ? "edit" : "add", name: finalName, originalName: editingProc?.originalName || editingProc?.name };
      if (editingProc) setProcOverrides(prev => prev.map(x => x.id === newId ? { ...x, ...val, id: newId } as ProcOverride : x)); else setProcOverrides(prev => [...prev, { id: newId, ...val } as ProcOverride]);
      await syncSaveFirst(`audit_procedures_${newId}`, { id: newId, ...val });
      setProcMsg(`Procedure "${finalName}" saved.`); setEditingProc(null); setProcForm({ name: "", tag: "General" });
    } catch (err: any) { setProcMsg(`Could not save: ${err.message}`); }
    setBusy(false);
  }

  const part1Total = Object.values(effPart1).reduce((a, b) => a + b.length, 0);

  // ---------- FIXED HEADER LAYOUT ----------
  const CompactHeader = (
    <header data-safe-area-sticky-top style={{ top: "var(--safe-area-inset-top)" }} className="noprint sticky z-10 border-b border-white/10 bg-[var(--teal)] text-white">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3">
        <img src={mohLogo} alt="MOH Logo" className="h-10 w-auto shrink-0 rounded-lg bg-white p-1 object-contain" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
            <h1 className="truncate text-[15px] font-black leading-tight sm:text-[17px]">North Al Batinah — Nursing Audit System</h1>
            <span className="hidden text-xs font-semibold text-white/80 sm:inline">Directorate of Health Services • {headerRoleText}</span>
            <span className="truncate text-[11px] font-semibold text-white/80 sm:hidden">{headerRoleText} • {user?.wilayat}</span>
          </div>
        </div>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <span className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">{user?.wilayat}</span>
          <button type="button" onClick={() => setShowHelp(true)} className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold hover:bg-white/25">Guide</button>
          <button type="button" onClick={logout} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-[var(--teal)] hover:bg-white/90"><LogOut className="mr-1 inline" size={14} />Logout</button>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:hidden">
          <button type="button" onClick={() => setShowHelp(true)} aria-label="Guide" className="rounded-full bg-white/15 p-2"><HelpCircle size={18} /></button>
          <button type="button" onClick={logout} aria-label="Logout" className="rounded-full bg-white p-2 text-[var(--teal)]"><LogOut size={18} /></button>
        </div>
      </div>
    </header>
  );

  const SecondaryBar = (
    <div className="noprint border-b border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-4 py-2.5">
        <button
          type="button"
          onClick={manualRefresh}
          disabled={refreshing}
          className="flex min-h-[40px] items-center gap-2 rounded-full bg-[var(--teal)] px-4 py-2 text-sm font-black text-white shadow-sm hover:bg-[var(--teal2)] disabled:opacity-60"
          style={{ touchAction: 'manipulation' }}
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {liveStatus === "refreshing" ? (
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--surface2)] px-3 py-1.5 text-xs font-bold"><RefreshCw size={12} className="animate-spin" />Refreshing...</span>
          ) : isSupabaseConfigured && supabaseConnected ? (
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--surface2)] px-3 py-1.5 text-xs font-bold"><span className="h-2.5 w-2.5 rounded-full bg-green-500" />Live • Supabase • Connected</span>
          ) : isSupabaseConfigured ? (
            <span className="flex items-center gap-2"><span className="flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1.5 text-xs font-bold text-red-800"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Local only • Supabase not connected: {supabaseReason || "unknown"}</span><button type="button" onClick={manualRefresh} disabled={refreshing} className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-bold text-white">Retry</button></span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-[var(--surface2)] px-3 py-1.5 text-xs font-bold"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Local mode</span>
          )}
        </div>
        <div className="ml-auto hidden text-[11px] font-semibold text-[var(--muted)] sm:block">Tap Refresh to load latest scores — shared link works on any phone</div>
      </div>
    </div>
  );

  const PartTabsBar = (
    <div className="noprint border-b border-[var(--line)] bg-[var(--surface2)]">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-4 py-2.5">
        <div className="flex gap-2">
          <button onClick={() => { setPart("1"); setTab("Dashboard"); setSelectedCell(null); }} aria-pressed={part === "1"} className={`rounded-full px-4 py-2 text-sm font-black ${part === "1" ? "bg-[var(--teal)] text-white" : "bg-white border border-[var(--line)] text-[var(--ink)]"}`}>Part 1 — Documentation</button>
          <button onClick={() => { setPart("2"); setTab("Dashboard"); setSelectedCell(null); }} aria-pressed={part === "2"} className={`rounded-full px-4 py-2 text-sm font-black ${part === "2" ? "bg-[var(--teal)] text-white" : "bg-white border border-[var(--line)] text-[var(--ink)]"}`}>Part 2 — Competency</button>
        </div>
        <div className="ml-2 hidden h-6 w-px bg-[var(--line)] sm:block" />
        <nav className="no-scrollbar flex flex-nowrap gap-1 overflow-x-auto sm:flex-wrap sm:overflow-visible">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={tab === t ? { background: "#0d6e6b", color: "#ffffff", border: "2px solid #0d6e6b" } : { background: "#ffffff", color: "#102a2c", border: "1px solid #cbd5d1" }} className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-black">{t}</button>
          ))}
        </nav>
      </div>
    </div>
  );

  return (
    <div data-safe-area-inset-root style={{ boxSizing: "border-box", paddingTop: "var(--safe-area-inset-top)", minHeight: "100vh", background: "var(--bg)" }} className="overflow-x-clip">
      {!user ? (
        <div className="mx-auto max-w-6xl px-3 py-6 sm:px-6">
          <div className="mb-5 flex flex-col items-center text-center">
            <div className="rounded-2xl bg-white p-3 shadow-sm"><img src={mohLogo} alt="Ministry of Health logo" className="h-[76px] w-auto object-contain sm:h-[84px]" /></div>
            <p className="mt-3 text-xs font-bold tracking-[.2em] uppercase text-[var(--muted)]">Directorate of Health Services</p>
            <h1 className="mt-2 text-[clamp(1.8rem,5vw,2.8rem)] font-black leading-[1.05]">North Al Batinah — Nursing Audit System</h1>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
            <div className="grid md:grid-cols-2">
              <div className="flex flex-col bg-[var(--teal)] p-6 text-white sm:p-8">
                <p className="mt-4 max-w-md text-white/90">Submit audit results by plan, keep comments with every score, and see completion and averages update as Wilayats enter their work.</p>
                <div className="mt-8 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white/15 p-3"><div className="text-2xl font-black">{part1Total}</div><div className="text-xs">Institutions</div></div>
                  <div className="rounded-xl bg-white/15 p-3"><div className="text-2xl font-black">6</div><div className="text-xs">Wilayats</div></div>
                  <div className="rounded-xl bg-white/15 p-3"><div className="text-2xl font-black">4</div><div className="text-xs">Topics</div></div>
                </div>
                <div className="mt-6 text-sm text-white/85"><strong>Wilayats:</strong> {WILAYAT_ORDER.map(w => `${w} (${(effPart1[w] || []).length})`).join(" · ")}</div>
                <div className="mt-4 rounded-xl bg-white/10 p-3 text-sm"><strong>Part 2 — Competency Procedures:</strong> General Nursing, Renal Medicine Center, Labour Rooms. Same logins, separate plans and scores.</div>
                <p className="mt-auto pt-6 text-center text-sm font-bold text-white">Brought to you by: Juma Al Marzouqi [Saham Hospital]</p>
                <p className="mt-3 text-center text-xs text-white/70">{isSupabaseConfigured ? "Live • Supabase • Shared Database" : "Local mode — add VITE_SUPABASE env to enable cross-PC sync"}</p>
              </div>
              <div className="p-5 sm:p-7">
                <h2 className="text-xl font-extrabold">Sign in</h2><p className="text-sm text-[var(--muted)]">Choose a demo account, or type a username and password.</p>
                <form onSubmit={login} className="mt-4 space-y-3">
                  <label className="block text-sm font-bold">Username<input value={username} onChange={e => setUsername(e.target.value)} className="mt-1 w-full" autoComplete="username" /></label>
                  <label className="block text-sm font-bold">Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full" autoComplete="current-password" /></label>
                  {security.locked && <label className="block text-sm font-bold">Recovery Code <span className="text-red-600">* Required for Master Unlock</span><input type="password" value={recoveryInput} onChange={e => setRecoveryInput(e.target.value)} className="mt-1 w-full" placeholder="Recovery Code set by Master" autoComplete="off" /></label>}
                  {security.accessCodeEnabled && <label className="block text-sm font-bold">Directorate Access Code <span className="text-red-600">* Required</span><input type="password" value={accessCodeInput} onChange={e => setAccessCodeInput(e.target.value)} className="mt-1 w-full" placeholder="Directorate Access Code" autoComplete="off" /></label>}
                  {loginError && <p className="rounded-lg bg-[var(--red)] p-2 text-sm font-semibold">{loginError}</p>}
                  <button className="w-full rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white">{security.locked ? "Master Unlock" : "Sign in"}</button>
                </form>
                <div className="mt-5">
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Demo logins — tap to fill</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {effectiveUsers.map(u => <button key={u.username} onClick={() => { setUsername(u.username); setPassword(u.password); }} className="rounded-lg border border-[var(--line)] px-2 py-2 text-left text-sm hover:bg-[var(--surface2)]">
                      <span className="block font-bold capitalize">{u.label} {u.role === "Wilayat" ? "— Wilayat" : ""}</span>
                      <span className="text-xs text-[var(--muted)]">{u.username} · ••••••••</span>
                    </button>)}
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {CompactHeader}
          {SecondaryBar}
          {PartTabsBar}

          <main className="mx-auto max-w-[1500px] px-3 py-4 pb-6 sm:px-5 sm:py-6 sm:pb-6">
            {liveToast && <div role="status" className="mb-4 flex items-start justify-between gap-2 rounded-xl border border-[var(--teal)] bg-[var(--surface)] p-3 text-sm font-bold shadow"><span>{liveToast}</span><button type="button" onClick={() => setLiveToast(null)} aria-label="Dismiss notification" className="shrink-0 rounded-full border px-2 py-0.5 text-xs">Dismiss</button></div>}

            {backendError && <div className="mb-4 rounded-xl bg-[var(--red)] p-3 text-sm font-bold">{backendError}</div>}

            {tab === "Control Panel" && isAdmin && (
              <section>
                <h2 className="text-xl font-black">Control Panel</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">Same panel in Part 1 and Part 2. Passwords, institutions, and procedures are saved in the shared database (audit_data) and apply immediately. {dbLabel}</p>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="card p-4"><h3 className="flex items-center gap-2 font-extrabold"><Users size={18} /> Accounts</h3><div className="mt-3 space-y-2">{effectiveUsers.map(u => <div key={u.username} className="flex justify-between gap-2 rounded-lg border p-3 text-sm"><span><strong>{u.label}</strong> — {u.username} · {u.role} · {u.wilayat}</span><span className="text-[var(--muted)]">Password: {u.password}</span></div>)}</div></div>
                  <form onSubmit={changePassword} className="card p-4"><h3 className="font-extrabold">Change a password</h3><label className="mt-3 block text-sm font-bold">Account<select value={pwdForm.username} onChange={e => setPwdForm({ ...pwdForm, username: e.target.value })} className="mt-1 w-full">{effectiveUsers.filter(u => isMaster || u.username !== "master").map(u => <option key={u.username} value={u.username}>{u.label} ({u.username}) — {u.role}</option>)}</select></label><label className="mt-3 block text-sm font-bold">New password<div className="mt-1 flex gap-2"><input type={showPwd ? "text" : "password"} value={pwdForm.password} onChange={e => setPwdForm({ ...pwdForm, password: e.target.value })} className="flex-1" placeholder="At least 4 characters" /><button type="button" onClick={() => setShowPwd(!showPwd)} className="rounded-lg border px-3 text-sm font-bold" aria-label={showPwd ? "Hide password" : "Show password"}>{showPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label><label className="mt-3 block text-sm font-bold">Confirm new password<input type={showPwd ? "text" : "password"} value={pwdConfirm} onChange={e => setPwdConfirm(e.target.value)} className="mt-1 w-full" placeholder="Re-enter new password" /></label>{pwdMsg && <p className="mt-3 rounded bg-[var(--surface2)] p-2 text-sm font-semibold">{pwdMsg}</p>}<button disabled={busy} className="mt-4 w-full rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white disabled:opacity-50">Update password</button></form>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <form onSubmit={saveInstitution} className="card p-4"><h3 className="font-extrabold">{editingInst ? "Edit institution" : "Add institution"}</h3><label className="mt-3 block text-sm font-bold">Wilayat<select value={instForm.wilayat} onChange={e => setInstForm({ ...instForm, wilayat: e.target.value })} className="mt-1 w-full">{WILAYAT_ORDER.map(w => <option key={w} value={w}>{w}</option>)}</select></label><label className="mt-3 block text-sm font-bold">Institution name<input value={instForm.name} onChange={e => setInstForm({ ...instForm, name: e.target.value })} className="mt-1 w-full" placeholder="e.g. Khaboorah EHC" /></label><fieldset className="mt-3"><legend className="text-sm font-bold">Assignments</legend>{["Part 1", "General Nursing", "Renal Medicine Center", "Labour Rooms"].map(a => <label key={a} className="mt-2 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={instForm.assignments.includes(a)} onChange={() => toggleInstAssignment(a)} className="w-auto" /> {a}</label>)}</fieldset>{instMsg && <p className="mt-3 rounded bg-[var(--surface2)] p-2 text-sm font-semibold">{instMsg}</p>}<div className="mt-4 flex gap-2"><button disabled={busy} className="flex-1 rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white disabled:opacity-50">{editingInst ? "Save changes" : "Add institution"}</button>{editingInst && <button type="button" onClick={() => { setEditingInst(null); setInstForm({ wilayat: "Suhar", name: "", assignments: ["Part 1"] }); }} className="rounded-lg border px-3 py-2 font-bold">Cancel</button>}</div></form>
                  <div className="card p-4"><h3 className="font-extrabold">Institutions ({effInstList.length})</h3><div className="mt-3 space-y-2 max-h-[420px] overflow-auto">{WILAYAT_ORDER.map(w => { const items = effInstList.filter(e => e.wilayat === w); if (!items.length) return null; return <div key={w}><h4 className="font-bold">{w} — {items.length}</h4><div className="mt-1 space-y-1">{items.map(e => <div key={e.wilayat + e.institution} className="flex items-center gap-2 rounded border p-2 text-sm"><span className="font-bold [overflow-wrap:anywhere]">{e.institution}</span><span className="text-xs text-[var(--muted)]">{e.assignments.join(" · ")}</span><button type="button" onClick={() => { setEditingInst(e); setInstForm({ wilayat: e.wilayat, name: e.institution, assignments: [...e.assignments] }); }} className="ml-auto rounded-full border px-2 py-1 text-xs font-bold">Edit</button></div>)}</div></div>; })}</div></div>
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <form onSubmit={saveProcedure} className="card p-4"><h3 className="font-extrabold">{editingProc ? "Edit procedure" : "Add procedure"}</h3><label className="mt-3 block text-sm font-bold">Procedure name<input value={procForm.name} onChange={e => setProcForm({ ...procForm, name: e.target.value })} className="mt-1 w-full" placeholder="e.g. IV Cannulation" /></label><label className="mt-3 block text-sm font-bold">Tag<select value={procForm.tag} onChange={e => setProcForm({ ...procForm, tag: e.target.value })} className="mt-1 w-full"><option value="General">General</option><option value="LR">[LR]</option><option value="RMC">[RMC]</option></select></label>{procMsg && <p className="mt-3 rounded bg-[var(--surface2)] p-2 text-sm font-semibold">{procMsg}</p>}<button disabled={busy} className="mt-4 w-full rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white disabled:opacity-50">{editingProc ? "Save changes" : "Add procedure"}</button></form>
                  <div className="card p-4"><h3 className="font-extrabold">Procedures ({effectiveProcedures.length})</h3><div className="mt-3 flex gap-2"><input value={procSearch} onChange={e => setProcSearch(e.target.value)} placeholder="Search..." className="flex-1 text-sm" /><select value={procFilterTag} onChange={e => setProcFilterTag(e.target.value)} className="text-sm"><option value="All">All</option><option value="General">General</option><option value="LR">[LR]</option><option value="RMC">[RMC]</option></select></div><div className="mt-3 max-h-[420px] space-y-1 overflow-auto">{effectiveProcedures.filter(p => { if (procFilterTag !== "All" && procTag(p) !== procFilterTag) return false; if (procSearch && !p.toLowerCase().includes(procSearch.toLowerCase())) return false; return true; }).map(p => <div key={p} className="flex items-center gap-2 rounded border p-2 text-sm"><span className="chip bg-[var(--surface2)]">{procTag(p)}</span><span className="font-semibold [overflow-wrap:anywhere]">{p}</span><button type="button" onClick={() => { setEditingProc({ name: p }); setProcForm({ name: p, tag: procTag(p) }); }} className="ml-auto rounded-full border px-2 py-1 text-xs font-bold">Edit</button></div>)}</div></div>
                </div>
              </section>
            )}

            {tab === "Guide" && <section className="mx-auto max-w-[720px]"><div className="card p-4 sm:p-6"><h2 className="text-[clamp(1.4rem,5vw,1.9rem)] font-black leading-tight">Wilayat Quick Guide — How to Enter Scores on Your Phone</h2><p className="mt-2 text-[15px] text-[var(--muted)]">Simple steps for Wilayat users on a small phone.</p><div className="mt-5 space-y-5 text-[16px] leading-[1.5]"><div className="rounded-xl border bg-[var(--surface2)] p-4"><p className="font-black">Step 1: Open shared link</p><p className="mt-2">Open shared link on phone, log in with Wilayat account, e.g. suhar / suhar123. If no Refresh button, pull down to refresh.</p></div><div className="rounded-xl border p-4"><p className="font-black">Step 2: Choose Part</p><p>Choose Part 1 or Part 2 at top.</p></div><div className="rounded-xl border p-4"><p className="font-black">Step 3: Year and Topic/Category</p><p>Choose Year and Topic or Category — e.g. 2027 + Crash Cart.</p></div><div className="rounded-xl border p-4"><p className="font-black">Step 4: Audit Grid months</p><p>Swipe sideways to see months Jan-Dec. Turn ON Single month view for easiest entry.</p></div><div className="rounded-xl border p-4"><p className="font-black">Step 5: Tap a cell</p><p>Tap a cell, e.g. Saham Hospital • Jan. Bottom sheet opens: Score 0-100 or NA, Your Name mandatory, Comment optional, Save.</p></div><div className="rounded-xl border p-4"><p className="font-black">Step 6: Refresh</p><p>Tap Refresh at top to see latest scores from other Wilayats. Live status shows updated time. Supabase sync: Phone A saves → Phone B taps Refresh → sees score.</p></div></div><pre className="mt-4 whitespace-pre-wrap break-words text-[14px] bg-[var(--surface2)] p-3 rounded-xl">{GUIDE_TEXT}</pre></div></section>}

            {tab !== "Control Panel" && tab !== "Guide" && part === "1" && <>
              <section className="card mb-4 p-3 sm:p-4">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <div><label className="text-xs font-bold uppercase text-[var(--muted)]">Topic</label><div className="mt-1 flex flex-wrap gap-1">{TOPICS.map(t => <button key={t} onClick={() => setTopic(t)} className={`rounded-full px-3 py-1.5 text-sm font-bold ${topic === t ? "bg-[var(--teal)] text-white" : "border border-[var(--line)]"}`}>{t}</button>)}</div></div>
                  <label className="text-sm font-bold">Plan<select value={activePlan?.id || ""} onChange={e => setPlanId(e.target.value)} className="mt-1 w-full"><option value="">No plan for this topic</option>{plans.filter(p => p.topic === topic).map(p => <option key={p.id} value={p.id}>{p.year} · Monthly · 12 months{p.active ? " · Active" : ""}</option>)}</select></label>
                  <div className="flex flex-wrap items-end gap-2">
                    {isAdmin && <label className="flex-1 text-sm font-bold">Wilayat filter<select value={wilayatFilter} onChange={e => setWilayatFilter(e.target.value)} className="mt-1 w-full"><option value="All">All Wilayats</option>{WILAYAT_ORDER.map(w => <option key={w} value={w}>{w} ({(effPart1[w] || []).length})</option>)}</select></label>}
                    <label className="flex-1 min-w-[180px] text-sm font-bold"><span className="flex items-center gap-1"><Search size={14} /> Search</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="e.g. Suhar EHC" className="mt-1 w-full" /></label>
                    <div className="flex gap-2"><button onClick={exportCSV} disabled={!activePlan} className="rounded-lg bg-[var(--blue)] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><Download className="mr-1 inline" size={16} />CSV</button><button onClick={() => setTab("Dashboard")} className="rounded-lg border px-3 py-2 text-sm font-bold">Dashboard</button></div>
                  </div>
                </div>
                {!activePlan && <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">No plan yet for <strong>{topic}</strong>. {isAdmin ? "Create one in Plans." : "Ask Admin to create a plan."}</div>}
              </section>

              {tab === "Dashboard" && <div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {isAdmin ? <>
                    <button onClick={exportPart1StatsExcel} className="flex items-center gap-2 rounded-xl bg-[var(--teal)] px-6 py-3 text-sm font-black text-white shadow-md"><Download size={18} />Export Part 1 Statistics Excel</button>
                  </> : <button onClick={exportPart1StatsExcel} className="flex items-center gap-2 rounded-xl bg-[var(--teal)] px-6 py-3 text-sm font-black text-white shadow-md"><Download size={18} />Export My Statistics Excel</button>}
                  <span className="self-center text-xs text-[var(--muted)]">{dbLabel} • Asia/Muscat • real .xlsx</span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <section className="card p-4 lg:col-span-2"><h2 className="flex items-center gap-2 font-extrabold"><BarChart3 size={18} /> Summary — {topic}</h2><div className="mt-3 grid gap-3 sm:grid-cols-2"> <div className="rounded-xl bg-[var(--surface2)] p-3"><div className="text-xs text-[var(--muted)]">Completion</div><div className="text-xl font-black">{gridStats.completion.toFixed(1)}%</div></div><div className="rounded-xl bg-[var(--surface2)] p-3"><div className="text-xs text-[var(--muted)]">Audits</div><div className="text-xl font-black">{gridStats.count}</div></div><div className="rounded-xl bg-[var(--surface2)] p-3"><div className="text-xs text-[var(--muted)]">Average</div><div className="text-xl font-black">{gridStats.avg ? gridStats.avg.toFixed(2) + "%" : "—"}</div></div><div className="rounded-xl bg-[var(--surface2)] p-3"><div className="text-xs text-[var(--muted)]">Missing</div><div className="text-xl font-black">{gridStats.missing}</div></div></div></section>
                  <section className="card p-4"><h3 className="font-bold">Sync status</h3><p className="mt-2 text-sm"><strong>Last sync:</strong> {lastSyncAt ? formatMuscat(lastSyncAt) : "—"}</p><p className="mt-1 text-sm"><strong>Supabase connected:</strong> {isSupabaseConfigured && supabaseConnected ? "Yes" : "No"}{isSupabaseConfigured && !supabaseConnected && supabaseReason ? ` — ${supabaseReason}` : ""}</p><p className="mt-1 text-sm"><strong>Rows loaded:</strong> {syncRowsLoaded}</p>{isSupabaseConfigured && !supabaseConnected && <button type="button" onClick={manualRefresh} disabled={refreshing} className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white">Retry sync</button>}<p className="mt-2 text-xs text-[var(--muted)]">{dbLabel}</p></section>
                </div>
              </div>}

              {tab === "Audit Grid" && <section className="card p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap gap-4 text-sm"><span><strong>{topic}</strong> · {activePlan ? `${activePlan.year} · Monthly · 12 months` : "No plan"}</span><span>Completion <strong>{gridStats.completion.toFixed(1)}%</strong></span><span>Audits <strong>{gridStats.count}</strong></span><span>Average <strong>{gridStats.avg ? gridStats.avg.toFixed(2) + "%" : "—"}</strong></span><span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">{dbLabel}</span></div>
                {!activePlan ? <p className="text-sm text-[var(--muted)]">Select or create a plan to see the grid.</p> : <>

                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <label className="w-full text-sm font-bold sm:w-auto">Jump to institution<input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search institution…" className="mt-1 w-full sm:w-[220px]" /></label>
                    <button type="button" onClick={() => setSingleMonthView(!singleMonthView)} aria-pressed={singleMonthView} className={`rounded-full px-4 py-2 text-sm font-bold ${singleMonthView ? "bg-[var(--teal)] text-white" : "border bg-white"}`}>{singleMonthView ? "Single month view: ON" : "Single month view: OFF"}</button>
                  </div>
                  <div className="mb-2"><label className="text-xs font-bold uppercase text-[var(--muted)]">Month picker</label><div className="no-scrollbar mt-1 flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Month picker">{MONTHS.map((m, mi) => <button key={m} type="button" onClick={() => { setMobileMonthIdx(mi); const el = gridRef.current?.querySelector(`[data-month="${m}"]`); if (gridRef.current && el) gridRef.current.scrollLeft = Math.max(0, (el as HTMLElement).offsetLeft - 180); }} aria-pressed={mobileMonthIdx === mi} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-bold ${mobileMonthIdx === mi ? "bg-[var(--teal)] text-white" : "border bg-white"}`}>{m}</button>)}</div></div>
                  <p className="mb-2 text-sm font-semibold">← Swipe to see months on mobile → Desktop shows full table</p>
                  <div ref={gridRef} className="gridwrap">
                    <table className="excel">
                      <thead><tr><th>Institution</th>{(singleMonthView ? [MONTHS[mobileMonthIdx]] : MONTHS).map(m => <th key={m} data-month={m}>{m}</th>)}</tr></thead>
                      <tbody>
                        {visibleInstitutions.map(v => {
                          const isEditingRow = selectedCell && selectedCell.wilayat === v.wilayat && selectedCell.institution === v.institution && selectedCell.part !== "2";
                          return <tr key={v.wilayat + v.institution} className={isEditingRow ? "editing-row" : ""}>
                            <td className="font-bold [overflow-wrap:anywhere]">{labelFor(v.wilayat, v.institution)}<span className="block text-xs font-normal text-[var(--muted)]">{v.wilayat}</span></td>
                            {(singleMonthView ? [MONTHS[mobileMonthIdx]] : MONTHS).map(period => {
                              const s = findScore(v.wilayat, v.institution, period);
                              const isEditingCell = selectedCell && selectedCell.wilayat === v.wilayat && selectedCell.institution === v.institution && selectedCell.period === period && selectedCell.part !== "2";
                              return <td key={period} className={isEditingCell ? "editing-cell" : ""} style={s ? scoreColor(s.score) : {}}>
                                <button
                                  type="button"
                                  onClick={() => openCell(v, period)}
                                  className={`cellBtn ${s?.comment ? "hasComment" : ""}`}
                                  style={{ touchAction: 'manipulation', cursor: 'pointer', minHeight: 44, color: 'inherit', fontWeight: 700 }}
                                  aria-label={`Edit ${labelFor(v.wilayat, v.institution)} ${period} score ${s?.score || "empty"}`}
                                >
                                  {s ? s.score : "—"}
                                </button>
                              </td>;
                            })}
                          </tr>;
                        })}
                      </tbody>
                    </table>
                  </div>
                  {visibleInstitutions.length === 0 && <p className="mt-3 text-sm text-[var(--muted)]">No institutions match your filter.</p>}
                </>}
              </section>}

              {tab === "Comments" && <section className="card p-4"><h2 className="flex items-center gap-2 font-extrabold"><MessageSquare size={18} /> Comments — {topic}</h2><p className="mt-1 text-sm text-[var(--muted)]">{dbLabel}</p>
                <div className="mt-3 space-y-3">{planScores.filter(s => s.comment || s.auditorName).map(c => <article key={c.id} className="rounded-xl border p-3"><div className="flex justify-between"><p className="font-bold">{labelFor(c.wilayat, c.institution)} — {c.period}</p><span className="font-black">{c.score}</span></div><p className="mt-1 text-sm [overflow-wrap:anywhere]">{c.comment || "No comment"}</p><p className="mt-1 text-xs text-[var(--muted)]">Audited by: {c.auditorName || "—"} · Added at: {c.auditedAt ? formatMuscat(c.auditedAt) : "—"} · {c.wilayat}</p></article>)}{planScores.filter(s => s.comment || s.auditorName).length === 0 && <p className="text-sm">No comments yet.</p>}</div>
              </section>}
            </>}

            {tab !== "Control Panel" && tab !== "Guide" && part === "2" && <>
              <section className="card mb-4 p-3 sm:p-4">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <div><label className="text-xs font-bold uppercase text-[var(--muted)]">Category</label><div className="mt-1 flex flex-wrap gap-1">{CATEGORIES.map(c => <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1.5 text-sm font-bold ${category === c ? "bg-[var(--teal)] text-white" : "border border-[var(--line)]"}`}>{c}</button>)}</div></div>
                  <label className="text-sm font-bold">Plan<select value={activeCompPlan?.id || ""} onChange={e => setCompPlanId(e.target.value)} className="mt-1 w-full"><option value="">No plan for this category</option>{compPlans.filter(p => p.category === category).map(p => <option key={p.id} value={p.id}>{p.year} · Monthly · 12 months{p.active ? " · Active" : ""}</option>)}</select></label>
                  <div className="flex flex-wrap items-end gap-2">
                    {isAdmin && <label className="flex-1 text-sm font-bold">Wilayat filter<select value={wilayatFilter} onChange={e => setWilayatFilter(e.target.value)} className="mt-1 w-full"><option value="All">All Wilayats</option>{WILAYAT_ORDER.map(w => <option key={w} value={w}>{w} ({(effComp[category] || []).length})</option>)}</select></label>}
                    <label className="flex-1 min-w-[180px] text-sm font-bold"><span className="flex items-center gap-1"><Search size={14} /> Search</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="e.g. Suhar RMC" className="mt-1 w-full" /></label>
                    <button onClick={exportCSV} disabled={!activeCompPlan} className="rounded-lg bg-[var(--blue)] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><Download className="mr-1 inline" size={16} />CSV</button>
                  </div>
                </div>
              </section>

              {tab === "Dashboard" && <div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={exportPart2StatsExcel} className="flex items-center gap-2 rounded-xl bg-[var(--blue)] px-6 py-3 text-sm font-black text-white shadow-md"><Download size={18} />Export Part 2 Statistics Excel</button>
                  <button onClick={exportCompPlanWord} className="flex items-center gap-2 rounded-xl bg-[var(--teal)] px-6 py-3 text-sm font-black text-white shadow-md"><Download size={18} />Export Competency Plan to Word</button>
                  <span className="self-center text-xs text-[var(--muted)]">{dbLabel} • real .xlsx</span>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                  <section className="card p-4 lg:col-span-2"><h2 className="flex items-center gap-2 font-extrabold"><BarChart3 size={18} /> Summary — {category}</h2><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[var(--surface2)] p-3"><div className="text-xs text-[var(--muted)]">Completion</div><div className="text-xl font-black">{compGridStats.completion.toFixed(1)}%</div></div><div className="rounded-xl bg-[var(--surface2)] p-3"><div className="text-xs text-[var(--muted)]">Audits (blocks)</div><div className="text-xl font-black">{compGridStats.count}</div></div><div className="rounded-xl bg-[var(--surface2)] p-3"><div className="text-xs text-[var(--muted)]">Average</div><div className="text-xl font-black">{compGridStats.avg ? compGridStats.avg.toFixed(2) + "%" : "—"}</div></div><div className="rounded-xl bg-[var(--surface2)] p-3"><div className="text-xs text-[var(--muted)]">Missing</div><div className="text-xl font-black">{compGridStats.missing}</div></div></div></section>
                  <section className="card p-4"><h3 className="font-bold">Blocks</h3><p className="mt-2 text-sm">Part 2 uses block system: same procedure in consecutive months = one block, one score per block.</p><div className="mt-3 border-t pt-3"><h4 className="font-bold">Sync status</h4><p className="mt-1 text-sm"><strong>Last sync:</strong> {lastSyncAt ? formatMuscat(lastSyncAt) : "—"}</p><p className="mt-1 text-sm"><strong>Supabase connected:</strong> {isSupabaseConfigured && supabaseConnected ? "Yes" : "No"}{isSupabaseConfigured && !supabaseConnected && supabaseReason ? ` — ${supabaseReason}` : ""}</p><p className="mt-1 text-sm"><strong>Rows loaded:</strong> {syncRowsLoaded}</p>{isSupabaseConfigured && !supabaseConnected && <button type="button" onClick={manualRefresh} disabled={refreshing} className="mt-3 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white">Retry sync</button>}</div></section>
                </div>
              </div>}

              {tab === "Audit Grid" && <section className="card p-3 sm:p-4">
                <div className="mb-3 flex flex-wrap gap-4 text-sm"><span><strong>{category}</strong> · {activeCompPlan ? `${activeCompPlan.year} · Monthly · ${getBlocks(activeCompPlan).length} blocks` : "No plan"}</span><span>Completion <strong>{compGridStats.completion.toFixed(1)}%</strong></span><span>Audits <strong>{compGridStats.count}</strong></span><span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">{dbLabel}</span></div>
                {!activeCompPlan ? <p className="text-sm text-[var(--muted)]">Select or create a plan to see the grid.</p> : <>

                  <div ref={gridRef} className="gridwrap">
                    <table className="excel">
                      <thead><tr><th>Institution / Procedure block</th>{activeCompPlan.periods.map((p, i) => <th key={i}>{p}<span className="block text-[10px] font-normal">{activeCompPlan.feedback?.[i] ? "Feedback" : displayProcedure(activeCompPlan.procedures?.[i])}</span></th>)}</tr></thead>
                      <tbody>
                        {visibleCompInstitutions.map(v => {
                          const isEditingRow = selectedCell && selectedCell.wilayat === v.wilayat && selectedCell.institution === v.institution && selectedCell.part === "2";
                          return <tr key={v.wilayat + v.institution} className={isEditingRow ? "editing-row" : ""}>
                            <td className="font-bold [overflow-wrap:anywhere]">{labelFor(v.wilayat, v.institution)}<span className="block text-xs font-normal text-[var(--muted)]">{v.wilayat}</span></td>
                            {activeCompPlan.periods.map((period, idx) => {
                              if (activeCompPlan.feedback?.[idx]) return <td key={idx} style={{ background: "#ede9fe" }}><span className="text-xs font-bold">Feedback</span></td>;
                              if (!activeCompPlan.procedures?.[idx]) return <td key={idx}></td>;
                              const block = blockForMonth(activeCompPlan, idx); if (!block) return <td key={idx}></td>;
                              if (idx !== block.start) { const s = findBlockScore(v.wilayat, v.institution, block); return <td key={idx} style={s ? scoreColor(s.score) : {}}><span className="text-xs text-[var(--muted)]">{s ? `Covered — ${s.period}` : ""}</span></td>; }
                              const s = findBlockScore(v.wilayat, v.institution, block);
                              const isEditingCell = selectedCell && selectedCell.wilayat === v.wilayat && selectedCell.institution === v.institution && selectedCell.period === period;
                              return <td key={idx} className={isEditingCell ? "editing-cell" : ""} style={s ? scoreColor(s.score) : {}} colSpan={block.end - block.start + 1}>
                                <button
                                  type="button"
                                  onClick={() => openCell(v, period, "2", category)}
                                  className={`cellBtn ${s?.comment ? "hasComment" : ""}`}
                                  style={{ touchAction: 'manipulation', cursor: 'pointer', minHeight: 44, color: 'inherit', fontWeight: 700 }}
                                  aria-label={`Edit ${labelFor(v.wilayat, v.institution)} ${blockLabel(block)} ${s?.score || "empty"}`}
                                >
                                  {s ? s.score : "—"}
                                </button>
                              </td>;
                            })}
                          </tr>;
                        })}
                      </tbody>
                    </table>
                  </div>
                </>}
              </section>}

              {tab === "Comments" && <section className="card p-4"><h2 className="flex items-center gap-2 font-extrabold"><MessageSquare size={18} /> Comments — {category}</h2><p className="mt-1 text-sm text-[var(--muted)]">{dbLabel}</p>
                <div className="mt-3 space-y-3">{compPlanScores.filter(s => s.comment || s.auditorName).map(c => <article key={c.id} className="rounded-xl border p-3"><div className="flex justify-between"><p className="font-bold">{labelFor(c.wilayat, c.institution)} — {c.period} — {displayProcedure(c.procedure)}</p><span className="font-black">{c.score}</span></div><p className="mt-1 text-sm [overflow-wrap:anywhere]">{c.comment || "No comment"}</p><p className="mt-1 text-xs text-[var(--muted)]">Audited by: {c.auditorName || "—"} · Added at: {c.auditedAt ? formatMuscat(c.auditedAt) : "—"} · {c.wilayat}</p></article>)}{compPlanScores.filter(s => s.comment || s.auditorName).length === 0 && <p className="text-sm">No comments yet.</p>}</div>
              </section>}
            </>}

            {tab === "Plans" && isAdmin && <section className="card p-4">
              <h2 className="text-xl font-black">Plans</h2><p className="mt-1 text-sm text-[var(--muted)]">Create Monthly plans (Jan-Dec). Plans are saved to the shared audit_data table — only the changed plan row is upserted. {dbLabel}</p>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <form onSubmit={createPlan} className="rounded-xl border p-4"><h3 className="font-extrabold">Create Part 1 plan</h3><label className="mt-3 block text-sm font-bold">Topic<select value={newPlan.topic} onChange={e => setNewPlan({ ...newPlan, topic: e.target.value })} className="mt-1 w-full">{TOPICS.map(t => <option key={t} value={t}>{t}</option>)}</select></label><label className="mt-3 block text-sm font-bold">Year<input type="number" value={newPlan.year} onChange={e => setNewPlan({ ...newPlan, year: Number(e.target.value) })} className="mt-1 w-full" /></label><button disabled={busy} className="mt-3 w-full rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white disabled:opacity-50">Create Part 1 plan</button></form>
                <form onSubmit={createCompPlan} className="rounded-xl border p-4"><h3 className="font-extrabold">{editingCompPlanId ? "Edit Part 2 plan" : "Create Part 2 plan"}</h3><label className="mt-3 block text-sm font-bold">Category<select value={newCompPlan.category} onChange={e => setNewCompPlan({ ...newCompPlan, category: e.target.value })} className="mt-1 w-full">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></label><label className="mt-3 block text-sm font-bold">Year<input type="number" value={newCompPlan.year} onChange={e => setNewCompPlan({ ...newCompPlan, year: Number(e.target.value) })} className="mt-1 w-full" /></label><div className="mt-4 space-y-2"><p className="text-sm font-bold">Month by month — for each month choose Procedure, Skip month, or Obtaining Feedback</p>{MONTHS.map((m, i) => { const mode = newCompPlan.feedback[i] ? "feedback" : newCompPlan.procedures[i] ? "procedure" : "skip"; return <div key={m} className="rounded-lg border p-2"><div className="flex flex-wrap items-center gap-2"><span className="w-10 text-sm font-black">{m}</span><select value={mode} onChange={e => setCompMonth(i, e.target.value as any)} className="flex-1 min-w-[130px]"><option value="procedure">Procedure</option><option value="skip">Skip month</option><option value="feedback">Obtaining Feedback</option></select>{mode === "procedure" && <select value={newCompPlan.procedures[i] || ""} onChange={e => setCompMonth(i, "procedure", e.target.value || null)} className="w-full"><option value="">— Select procedure —</option>{PROCEDURES.map(pr => <option key={pr} value={pr}>{pr}</option>)}</select>}{mode === "feedback" && <span className="rounded bg-[#ede9fe] px-2 py-1 text-xs font-bold text-[#4c1d95]">Obtaining Feedback — no score</span>}{mode === "skip" && <span className="text-xs text-[var(--muted)]">Skipped — no score</span>}</div></div>; })}</div>{editingCompPlanId && <button type="button" onClick={() => { setEditingCompPlanId(null); setNewCompPlan({ category: CATEGORIES[0] as string, year: 2027, procedures: Array(12).fill(null) as (string | null)[], feedback: Array(12).fill(false) as boolean[] }); }} className="mt-3 w-full rounded-lg border py-2 font-bold">Cancel edit — back to Create</button>}<button disabled={busy} className="mt-3 w-full rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white disabled:opacity-50">{editingCompPlanId ? "Save changes to Part 2 plan" : "Create Part 2 plan"}</button></form>
              </div>
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div><h3 className="font-extrabold">Part 1 plans ({plans.length})</h3><div className="mt-2 space-y-2 max-h-[320px] overflow-auto">{plans.map(p => <div key={p.id} className="flex items-center gap-2 rounded border p-2 text-sm"><span className="font-bold">{p.topic} · {p.year}</span><span className="text-xs text-[var(--muted)]">{p.active ? "Active" : "Deactivated"}</span><button type="button" onClick={() => togglePart1PlanActive(p)} className="rounded-full border px-2 py-1 text-xs font-bold">{p.active ? "Deactivate" : "Activate"}</button><button type="button" onClick={() => { setTopic(p.topic); setPlanId(p.id); setTab("Audit Grid"); setPart("1"); }} className="rounded-full border px-2 py-1 text-xs font-bold">Open</button></div>)}</div></div>
                <div><h3 className="font-extrabold">Part 2 plans ({compPlans.length})</h3><div className="mt-2 space-y-2 max-h-[320px] overflow-auto">{compPlans.map(p => <div key={p.id} className="flex items-center gap-2 rounded border p-2 text-sm"><span className="font-bold">{p.category} · {p.year}</span><span className="text-xs text-[var(--muted)]">{p.active ? "Active" : "Deactivated"} · {getBlocks(p).length} blocks</span><button type="button" onClick={() => toggleCompPlanActive(p)} className="rounded-full border px-2 py-1 text-xs font-bold">{p.active ? "Deactivate" : "Activate"}</button><button type="button" onClick={() => { setCategory(p.category); setCompPlanId(p.id); setTab("Audit Grid"); setPart("2"); }} className="ml-auto rounded-full border px-2 py-1 text-xs font-bold">Open</button><button type="button" onClick={() => { setEditingCompPlanId(p.id); setNewCompPlan({ category: p.category, year: p.year, procedures: [...(p.procedures || Array(12).fill(null))], feedback: [...(p.feedback || Array(12).fill(false))] }); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-full border px-2 py-1 text-xs font-bold">Edit</button></div>)}</div></div>
              </div>
            </section>}

            {selectedCell && (
              <div className="fixed inset-0 overflow-y-auto bg-black/50 pt-[max(1rem,var(--safe-area-inset-top))] pb-6" style={{ zIndex: 10000 }}>
                <div className="min-h-full flex items-center justify-center px-3">
                  <div className="w-full max-w-md rounded-2xl bg-[var(--surface)] p-5 shadow-2xl sheet-up">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-lg font-black">Enter audit score</h3>
                        <p className="mt-1 text-sm font-bold [overflow-wrap:anywhere]">{labelFor(selectedCell.wilayat, selectedCell.institution)} • {selectedCell.period} • {selectedCell.part === "2" ? (selectedCell.category || category) : topic}</p>
                        <p className="text-xs text-[var(--muted)]">{selectedCell.wilayat} Wilayat • {isSupabaseConfigured ? "Will sync to Supabase" : "Will sync to local backup"}</p>
                      </div>
                      <button type="button" onClick={() => setSelectedCell(null)} aria-label="Close score dialog" className="rounded-full border p-1" style={{ minHeight: 44, minWidth: 44, touchAction: 'manipulation', cursor: 'pointer' }}><X size={18} /></button>
                    </div>
                    <div className="mt-4 space-y-3">
                      <label className="block text-sm font-bold">Score <span className="text-red-600">* Mandatory</span> (0-100 or NA)
                        <input
                          type="text"
                          inputMode="text"
                          autoCapitalize="characters"
                          autoCorrect="off"
                          value={scoreInput}
                          onChange={e => setScoreInput(e.target.value)}
                          placeholder="e.g. 95 or NA"
                          autoComplete="off"
                          className={`mt-1 w-full ${!isScoreValid(scoreInput) && scoreInput !== "" ? "border-red-500" : ""}`}
                          style={{ fontSize: 16, minHeight: 48 }}
                        />
                        <span className="mt-1 block text-[11px] text-[var(--muted)]">Mandatory — enter 0-100 or NA</span>
                      </label>
                      <label className="block text-sm font-bold">Your Name / Auditor Name <span className="text-red-600">* Mandatory</span>
                        <input
                          value={auditorNameInput}
                          onChange={e => setAuditorNameInput(e.target.value)}
                          placeholder="e.g. Salim Al Mamari"
                          className={`mt-1 w-full ${!isNameValid(auditorNameInput) && auditorNameInput !== "" ? "border-red-500" : ""}`}
                          style={{ fontSize: 16, minHeight: 48 }}
                        />
                        <span className="mt-1 block text-[11px] text-[var(--muted)]">Mandatory — will be shown as Audited by</span>
                      </label>
                      <label className="block text-sm font-bold">Comment <span className="text-[var(--muted)]">(Optional)</span>
                        <textarea value={commentInput} onChange={e => setCommentInput(e.target.value)} rows={3} placeholder="Add a comment for this audit... (optional)" className="mt-1 w-full" style={{ fontSize: 16, minHeight: 80 }} />
                      </label>
                    </div>
                    <div className="mt-2 rounded bg-white p-2 text-xs text-[var(--muted)]"><div className="font-bold text-[var(--ink)]">How it will appear:</div><div className="mt-1">Audited by: {auditorNameInput.trim() || "—"}</div><div>Added at: {formatMuscat(new Date().toISOString())}</div><div className="mt-1">Sync: shared database — only this row is upserted</div></div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={saveCell}
                        disabled={busy || !isScoreValid(scoreInput) || !isNameValid(auditorNameInput)}
                        className="rounded-lg bg-[var(--teal)] px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                        style={{ minHeight: 48, touchAction: 'manipulation', cursor: 'pointer' }}
                      >
                        <CheckCircle2 className="mr-1 inline" size={16} />{busy ? "Saving…" : "Save audit"}
                      </button>
                      <button type="button" onClick={() => setSelectedCell(null)} disabled={busy} className="rounded-lg border px-4 py-3 font-bold" style={{ minHeight: 48, touchAction: 'manipulation', cursor: 'pointer' }}>Cancel</button>
                      <button type="button" onClick={deleteScore} disabled={busy} className="rounded-lg border border-red-300 px-3 py-3 font-bold text-red-700" style={{ minHeight: 48, touchAction: 'manipulation' }}><Trash2 className="mr-1 inline" size={16} />Remove</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            
          </main>
        </>
      )}
      {showHelp && <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/50 pt-[max(1rem,var(--safe-area-inset-top))] pb-6"><div className="min-h-full flex items-center justify-center px-3"><div className="w-full max-w-xl rounded-2xl bg-[var(--surface)] p-5 shadow-2xl"><div className="flex justify-between"><h2 className="text-lg font-black">How to use — Monthly plans, blocks &amp; Feedback + Supabase sync</h2><button onClick={() => setShowHelp(false)} aria-label="Close help"><X /></button></div><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed"><li><strong>Header fixed:</strong> Green bar is now compact h-16 desktop (~64px), ~72px mobile stacked, not half page. Logo + title + role on same line desktop, compact stacked mobile.</li><li><strong>Secondary bars:</strong> Refresh + Live status in white bar, Part toggle + tabs in light gray bar, both below green header. Desktop shows tabs horizontal.</li><li><strong>Dashboard:</strong> grid grid-cols-1 lg:grid-cols-3 gap-4 — summary cards side-by-side on desktop.</li><li><strong>Audit Grid:</strong> Table scrolls horizontally on mobile (overflow-auto) but shows full on desktop. Main content starts right after header.</li><li><strong>Supabase sync:</strong> All saves upsert only the changed row to the shared audit_data table. Refresh re-fetches from the shared database and merges it — it never reloads the page and never logs you out.</li><li><strong>Mobile tap fix preserved:</strong> cell buttons with touch-action manipulation, fixed z-index 9999 dialog.</li></ol><button onClick={() => setShowHelp(false)} className="mt-4 w-full rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white">Got it</button></div></div></div>}
    </div>
  );
}
