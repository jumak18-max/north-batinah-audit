import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, ClipboardCheck, Download, LogOut, MessageSquare, Search, Settings2, Users, HelpCircle, Plus, Trash2, X, CheckCircle2, AlertTriangle, ChevronDown, Eye, EyeOff, History, Filter, RefreshCw } from "lucide-react";
import mohLogo from "./assets/de5a2654c982994c-MOH_Logo.png";
import { isSupabaseConfigured, supabase, getDataSourceLabel } from "./supabaseClient";
// TODO (Supabase migration): When VITE_SUPABASE_* env vars are present, replace api("records.*") calls below
// with supabase.from("plans"/"scores"/etc).select/insert/update/delete — see supabaseClient.ts and README.md for mapping.
// Fallback: if !isSupabaseConfigured, keep using existing records API so preview still works.

type Role = "Master" | "Admin" | "Wilayat";
type User = { username:string; password:string; role:Role; wilayat:string; label:string };
const DEFAULT_USERS: User[] = [
  {username:"master", password:"Masterin123", role:"Master", wilayat:"All Wilayats", label:"Master"},
  {username:"admin", password:"admin123", role:"Admin", wilayat:"All Wilayats", label:"Admin — Nursing Service Department"},
  {username:"suhar", password:"suhar123", role:"Wilayat", wilayat:"Suhar", label:"Suhar"},
  {username:"saham", password:"saham123", role:"Wilayat", wilayat:"Saham", label:"Saham"},
  {username:"khaboorah", password:"khaboorah123", role:"Wilayat", wilayat:"Khaboorah", label:"Khaboorah"},
  {username:"suwaiq", password:"suwaiq123", role:"Wilayat", wilayat:"Suwaiq", label:"Suwaiq"},
  {username:"shinas", password:"shinas123", role:"Wilayat", wilayat:"Shinas", label:"Shinas"},
  {username:"liwa", password:"liwa123", role:"Wilayat", wilayat:"Liwa", label:"Liwa"},
];
const WILAYAT_ORDER = ["Suhar","Saham","Suwaiq","Khaboorah","Shinas","Liwa"];
const INSTITUTIONS: Record<string,string[]> = {
  Suhar: ["Suhar EHC","Al Uwaynat HC","Falaj Al Qbail HC","Multaqa HC","Suhar MFC","Traif HC","Wadi Ahin HC","Wadi Heebi Hospital","Suhar RDC"],
  Saham: ["Saham Hospital","Saham Polyclinic","Hafeet HC","Ghuwaisah HC","Wadi Bani Omar HC","Saham RDC"],
  Suwaiq: ["Suwaiq Hospital","Suwaiq EHC","Bidaya HC","Khadhra HC","Mashaiq HC","Shireesa HC","Tharmad HC","Wadi Al Jahawer HC","Suwaiq RDC"],
  Khaboorah: ["Khaboorah EHC","Qasbia HC","Wadi Hawasna Hospital","Wadi Sarrami Hospital","Wadi Shafan HC"],
  Shinas: ["Shinas EHC","Abu Baqra HC","Shinas Labour Room","Shinas RDC"],
  Liwa: ["Liwa HC","Nabr HC","Rahab HC"],
};
const TOPICS = ["Crash Cart","Narcotics & Psychotropics","Escorting Patients","Death"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTH_INDEX: Record<string,number> = {}; MONTHS.forEach((m,i)=>{ MONTH_INDEX[m]=i; MONTH_INDEX[m.toLowerCase()]=i; });
const YEARS = Array.from({length:14},(_,i)=>2027+i);

function expandOldPeriod(label:string): number[] {
  const raw=(label||"").trim(); if(!raw) return [];
  const idxFor=(tok:string)=>{ const t=tok.trim().slice(0,3).toLowerCase(); const f=MONTHS.findIndex(m=>m.toLowerCase()===t); return f; };
  if(raw.includes("-")||raw.includes("–")){
    const parts=raw.split(/[-–]/).map(s=>s.trim()).filter(Boolean);
    if(parts.length>=2){ const a=idxFor(parts[0]); const b=idxFor(parts[parts.length-1]); if(a>=0&&b>=0&&b>=a){ const out:number[]=[]; for(let i=a;i<=b;i++) out.push(i); return out; } if(a>=0) return [a]; }
  }
  if(raw.includes("&")){ const parts=raw.split("&").map(s=>s.trim()).filter(Boolean); const out:number[]=[]; parts.forEach(p=>{ const v=idxFor(p); if(v>=0&&!out.includes(v)) out.push(v); }); return out.sort((a,b)=>a-b); }
  const single=idxFor(raw); return single>=0?[single]:[];
}
function normalizePeriodToMonth(period:string): string {
  if(MONTHS.includes(period)) return period; const e=expandOldPeriod(period); if(e.length) return MONTHS[e[0]]; return period;
}
type HistoryEntry = { score:string; comment:string; auditorName:string; auditedAt:string; };
type Plan = { id:string; topic:string; year:number; frequency:string; periods:string[]; active:boolean };
type Score = { id:string; planId:string; wilayat:string; institution:string; topic:string; year:number; period:string; score:string; comment:string; auditorName?:string; auditedAt?:string; history?:HistoryEntry[] };
type PwdOverride = { id:string; username:string; password:string };
type AuditorProfile = { id:string; username:string; lastName:string };
type SecuritySettings = { disabled:string[]; locked:boolean; recoveryCode:string; accessCodeEnabled:boolean; accessCode:string; sessionVersion:number; lastRevocationAt:string; lastRevocationBy:string; showDemoPasswords?:boolean };
type LoginAttempt = { id:string; username:string; success:boolean; status:string; at:string; reason:string };
const DEFAULT_SECURITY: SecuritySettings = { disabled:[], locked:false, recoveryCode:"", accessCodeEnabled:false, accessCode:"", sessionVersion:1, lastRevocationAt:"", lastRevocationBy:"", showDemoPasswords:false };

const CATEGORIES = ["General Nursing","Renal Medicine Center","Labour Rooms"] as const;
type Category = typeof CATEGORIES[number];
const COMP_RAW: Record<string,string[]> = {
  "General Nursing": ["Khaboorah_Khaboorah EHC","Khaboorah_Qasbia HC","Khaboorah_Wadi Hawasna Hospital","Khaboorah_Wadi Sarrami Hospital","Khaboorah_Wadi Shafan HC","Liwa_Liwa HC","Liwa_Nabr HC","Liwa_Rahab HC","Saham_Saham Polyclinic","Saham_Ghuwaisah HC","Saham_Hafeet HC","Saham_Wadi Bani Omar HC","Shinas_Abu Baqra HC","Shinas_Shinas EHC","Shinas_Shinas RDC","Suhar_Al Uwaynat HC","Suhar_Falaj Al Qbail HC","Suhar_Multaqa HC","Suhar_Suhar EHC","Suhar_Suhar MFC","Suhar_Traif HC","Suhar_Wadi Ahin HC","Suhar_Wadi Heebi Hospital","Suwaiq_Bidaya HC","Suwaiq_Khadhra HC","Suwaiq_Mashaiq HC","Suwaiq_Shireesa HC","Suwaiq_Suwaiq EHC","Suwaiq_Tharmad HC","Suwaiq_Wadi Al Jahawer HC"],
  "Renal Medicine Center": ["Suhar_Suhar RMC","Saham_Saham RMC","Suwaiq_Suwaiq RMC"],
  "Labour Rooms": ["Saham_Saham Hospital LR","Shinas_Shinas LR","Suwaiq_Suwaiq Hospital LR"],
};
function parseComp(list:string[]){ return list.map(s=>{ const i=s.indexOf("_"); return {wilayat:s.slice(0,i), institution:s.slice(i+1)}; }); }
const COMP_INSTITUTIONS: Record<string,{wilayat:string;institution:string}[]> = {
  "General Nursing": parseComp(COMP_RAW["General Nursing"]),
  "Renal Medicine Center": parseComp(COMP_RAW["Renal Medicine Center"]),
  "Labour Rooms": parseComp(COMP_RAW["Labour Rooms"]),
};
const PROCEDURES: string[] = [
  "[LR] 2nd Stage of Labour","[LR] 3rd Stage of Labour","[LR] Breast Feeding Assessment","[LR] Episiotomy Incision, Repair","[LR] Episiotomy suturing","[LR] Vaginal Examination",
  "[RMC] Commencing patient with Permanent access to HD Machine","[RMC] Commencing patient with temporary access to HD Machine","[RMC] Disconnecting patient with Permanent access from HD Machine","[RMC] Disconnecting patient with temporary access from HD Machine","[RMC] Post Dialysis assessment of Haemodialysis Patient","[RMC] Pre Dialysis assessment of Haemodialysis Patient","[RMC] Priming Dialysis Machine",
  "Abdominal palpation","Administering of rectal suppository","Administering oral medication","Administraion Phototherapy for new born","Administrating subcutaneous injection","Administration of Anticoagulants injection","Administration of intra dermal injection","AIR Embolism","Ambu bag manual ventilator","Applying O2 mask","Applying pressure bandage","Applying wet to dry dressing","Assessing Pulse rate","Assisting in Electrocariogram","Assisting in suturing","AVF care","Blood pressure checking","Blood Transfusion","Cast Application (Plaster)","Catheterization","Cervical Collar","Cesarean birth Preoperative care","Checking FHS (fetal heart sound)","Checking Temperature","CPR","CTG","Diabetic foot dressing","Documentation","Dressing for P.cath","ECG","Eye irrigation","First aids of amputated care","Hand washing","Incident Report","Injection preparation","Inserting Astright Catheter","Intra muscular injection","Intradermal Injection","IV Cannulation Insertion","IV Fluid Administration","IV therapy","Last office procedure","Lifting and moving technique","Magnesium Sulphate preparations","Management & Prevention measure of catheter related to infection","Management of blood leaking during HD","Management of Hypertention during & post HD","Management of hypotension during dialysis","Management of patient free heparin","Managemet Of Blood line clotting during HD","Measuring blood glucose level.","Measuring Oxygen Saturation","Metal clip removal","Mixing medication from two vials","Narcotic and psychotropic administration","Nasal Pharangel & Nasal Suction","Nebulization","Needle Removal","Needling","Neourological assessment","New-born Examination","NGT insertion","O2 Therapy","Oral / nasal pharyngeal suction","Oral Medication","P.Cath dressing","PPE","Pulse Oxemeter","Regulation IV flow rate","Remove needle","Removing unsterile gown and gloves","Stomach wash","Suction Nose & Mouth","Suture removal","Tempreature","Tracheostomy Care","Urinary Catheterization (Female)","Urinary Catheterization (Male)","vaccination","Venipuncture for blood collection","Vital signs","Waste management","Wound care / dressing","Wound stapler removal"
];
type CompPlan = { id:string; category:string; year:number; frequency:string; periods:string[]; procedures:(string|null)[]; feedback?:boolean[]; active:boolean };
type CompScore = { id:string; planId:string; wilayat:string; institution:string; category:string; year:number; period:string; procedure:string; score:string; comment:string; auditorName?:string; auditedAt?:string; history?:HistoryEntry[] };
type InstOverride = { id:string; kind:"add"|"edit"|"delete"; wilayat:string; name:string; assignments:string[]; originalWilayat?:string; originalName?:string };
type ProcOverride = { id:string; kind:"add"|"edit"|"delete"; name:string; originalName?:string };
type EffInst = { wilayat:string; institution:string; assignments:string[]; sourceId?:string; sourceKind?:string; originalWilayat?:string; originalName?:string };
type Block = { start:number; end:number; procedure:string; months:number[] };

function getBlocks(plan: CompPlan | undefined | null): Block[] {
  if(!plan) return []; const blocks: Block[] = []; let i=0;
  while(i<12){
    if(plan.feedback?.[i] || !plan.procedures?.[i]){ i++; continue; }
    const proc=plan.procedures[i]!; let j=i;
    while(j+1<12 && !plan.feedback?.[j+1] && plan.procedures?.[j+1]===proc){ j++; }
    const months:number[]=[]; for(let k=i;k<=j;k++) months.push(k);
    blocks.push({start:i,end:j,procedure:proc,months}); i=j+1;
  }
  return blocks;
}
function blockLabel(b:Block){ return b.start===b.end ? MONTHS[b.start] : `${MONTHS[b.start]}-${MONTHS[b.end]}`; }
function blockForMonth(plan:CompPlan|undefined|null, monthIdx:number): Block|undefined { return getBlocks(plan).find(b=>b.months.includes(monthIdx)); }
function feedbackCount(plan:CompPlan|undefined|null){ return plan?.feedback?.filter(Boolean).length||0; }
function cleanInstitutionName(raw:string, wilayat?:string):string{
  let s=(raw||"").trim(); let changed=true;
  while(changed){ changed=false; const idx=s.indexOf("_"); if(idx>0){ const prefix=s.slice(0,idx).trim(); const isWilayat = wilayat ? prefix.toLowerCase()===wilayat.toLowerCase() : WILAYAT_ORDER.some(w=>w.toLowerCase()===prefix.toLowerCase()); if(isWilayat){ s=s.slice(idx+1).trim(); changed=true; } } }
  return s;
}
function stripProcedurePrefix(name:string){ return name.replace(/^\[(LR|RMC)\]\s*/i,"").trim(); }

// --- API with cache busting to avoid CDN caching in shared link ---
async function api(action:string, args:any){
  const bust = Date.now() + Math.random();
  const res = await fetch("actions", {method:"POST", cache:"no-store", headers:{"content-type":"application/json", "x-cache-bust": String(bust)}, body: JSON.stringify({action, args, _t:bust})});
  const json = await res.json().catch(()=>({}));
  if(!res.ok || json.error) throw new Error(json.error || `Request failed (${res.status})`);
  return json.data;
}
async function apiTimed(action:string, args:any, timeoutMs:number){
  const bust = Date.now() + Math.random();
  const ctrl = new AbortController(); const timer=setTimeout(()=>ctrl.abort(), timeoutMs);
  try{
    const res = await fetch("actions", {method:"POST", cache:"no-store", headers:{"content-type":"application/json", "x-cache-bust": String(bust)}, body: JSON.stringify({action, args, _t:bust}), signal: ctrl.signal});
    const json = await res.json().catch(()=>({}));
    if(!res.ok || json.error) throw new Error(json.error || `Request failed (${res.status})`);
    return json.data;
  }catch(e:any){ if(e?.name==="AbortError") throw new Error(`Request timed out after ${timeoutMs}ms`); throw e; } finally { clearTimeout(timer); }
}
const RECORD_COLLECTIONS = ["audit_plans","audit_scores","audit_passwords","competency_plans","competency_scores","audit_institutions","audit_procedures","audit_auditor_names","audit_security","audit_login_attempts"] as const;
type FetchedBundle = { plans:Plan[]; scores:Score[]; overrides:PwdOverride[]; compPlans:CompPlan[]; compScores:CompScore[]; instOverrides:InstOverride[]; procOverrides:ProcOverride[]; auditorProfiles:AuditorProfile[]; security:SecuritySettings; securityId:string; loginAttempts:LoginAttempt[]; totalRecords:number };

async function fetchBundle(timeoutMs:number): Promise<FetchedBundle>{
  const raw = await Promise.all(RECORD_COLLECTIONS.map(c=> apiTimed("records.list",{collection:c}, timeoutMs)));
  raw.forEach((d:any, i:number)=>{
    if(!d || !Array.isArray(d.records)) throw new Error(`Invalid data for ${RECORD_COLLECTIONS[i]} — keeping last good data`);
    for(const r of d.records){ if(!r || typeof r.value!=="object" || r.value===null) throw new Error(`Invalid record in ${RECORD_COLLECTIONS[i]} — keeping last good data`); }
  });
  const [p,s,o,cp,cs,io,po,ap,sec,att] = raw;
  const totalRecords = raw.reduce((n:number,d:any)=> n + d.records.length, 0);
  const secRec = (sec.records||[])[0];
  const security:SecuritySettings = secRec ? {...DEFAULT_SECURITY, ...secRec.value, disabled:Array.isArray(secRec.value?.disabled)?secRec.value.disabled:[]} : {...DEFAULT_SECURITY};
  return {
    plans:(p.records||[]).map((r:any)=> normalizePlan({...r.value, id:r.id})),
    scores:(s.records||[]).map((r:any)=>({id:r.id, ...r.value, period: normalizePeriodToMonth(r.value.period||"Jan"), wilayat:r.value.wilayat, institution:cleanInstitutionName(r.value.institution, r.value.wilayat)})),
    overrides:(o.records||[]).map((r:any)=>({id:r.id, ...r.value})),
    compPlans:(cp.records||[]).map((r:any)=> normalizeCompPlan({...r.value, id:r.id})),
    compScores:(cs.records||[]).map((r:any)=>({id:r.id, ...r.value, period: normalizePeriodToMonth(r.value.period||"Jan"), wilayat:r.value.wilayat, institution:cleanInstitutionName(r.value.institution, r.value.wilayat)})),
    instOverrides:(io.records||[]).map((r:any)=>({id:r.id, ...r.value})),
    procOverrides:(po.records||[]).map((r:any)=>({id:r.id, ...r.value})),
    auditorProfiles:(ap.records||[]).map((r:any)=>({id:r.id, ...r.value})),
    security, securityId: secRec ? secRec.id : "",
    loginAttempts:(att.records||[]).map((r:any)=>({id:r.id, ...r.value})).sort((a:any,b:any)=> new Date(b.at||0).getTime()-new Date(a.at||0).getTime()),
    totalRecords,
  };
}
function fmtAvg(v:number|null){ return v===null ? "—" : `${v.toFixed(2)}%`; }
function scoreColor(s:string){
  if(s==="NA") return {background:"var(--amber)"};
  const n=parseFloat(s); if(isNaN(n)) return {};
  if(n>=95) return {background:"var(--green)"};
  if(n>=85) return {background:"#eef6c9"};
  return {background:"var(--red)"};
}
function labelFor(w:string, inst:string){ return cleanInstitutionName(inst, w); }
function procTag(p:string){ if(p.startsWith("[LR]")) return "LR"; if(p.startsWith("[RMC]")) return "RMC"; return "General"; }
function formatMuscat(iso?:string): string {
  if(!iso) return "—";
  try{
    const d = new Date(iso); if(isNaN(d.getTime())) return iso;
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Muscat', day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', hour12:false });
    const parts = fmt.formatToParts(d); const get = (t:string)=> parts.find(p=>p.type===t)?.value || "";
    return `${get('day')}-${get('month')}-${get('year')} ${get('hour')}:${get('minute')}`;
  }catch{ return iso; }
}
function formatLiveTime(iso?:string): string {
  if(!iso) return "—";
  try{ const d=new Date(iso); if(isNaN(d.getTime())) return iso; const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Muscat',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}); return fmt.format(d); }catch{ return iso; }
}
function normalizePlan(raw:any): Plan { return { id: raw.id, topic: raw.topic, year: raw.year, frequency:"Monthly", periods:[...MONTHS], active: !!raw.active }; }
function normalizeCompPlan(raw:any): CompPlan {
  const oldPeriods: string[] = Array.isArray(raw.periods) ? raw.periods : [...MONTHS];
  const oldProcs: (string|null)[] = Array.isArray(raw.procedures) ? raw.procedures : oldPeriods.map(()=>null);
  const oldFeedback: boolean[] = Array.isArray(raw.feedback) ? raw.feedback : [];
  const isAlreadyMonthly = oldPeriods.length===12 && oldPeriods.every((p,i)=>p===MONTHS[i]) && oldProcs.length===12;
  if(isAlreadyMonthly){ const feedback = Array.from({length:12},(_,i)=> !!oldFeedback[i]); const procedures = oldProcs.map((p,i)=> feedback[i] ? null : p); return { id: raw.id, category: raw.category, year: raw.year, frequency:"Monthly", periods:[...MONTHS], procedures, feedback, active: !!raw.active }; }
  const procedures: (string|null)[] = Array(12).fill(null); const feedback: boolean[] = Array(12).fill(false);
  oldPeriods.forEach((per, idx)=>{ const months = expandOldPeriod(per); const proc = oldProcs[idx] ?? null; const fb = !!oldFeedback[idx]; months.forEach(m=>{ if(fb){ feedback[m]=true; procedures[m]=null; } else if(proc && !procedures[m]){ procedures[m]=proc; } }); });
  return { id: raw.id, category: raw.category, year: raw.year, frequency:"Monthly", periods:[...MONTHS], procedures, feedback, active: !!raw.active };
}
function ProcedurePicker({value, category, procedures, displayProc, onChange}:{value:string|null; category:string; procedures:string[]; displayProc:(p:string|null)=>string; onChange:(v:string|null)=>void}){
  const [open,setOpen]=useState(false); const [q,setQ]=useState(""); const [showAll,setShowAll]=useState(false);
  const filtered = useMemo(()=>{
    let list = procedures.filter(p=> p.toLowerCase().includes(q.trim().toLowerCase()));
    if(category==="General Nursing" && !showAll) list = list.filter(p=>!p.startsWith("[LR]") && !p.startsWith("[RMC]"));
    const rank=(p:string)=>{ if(category==="General Nursing") return procTag(p)==="General"?0:1; if(category==="Renal Medicine Center") return procTag(p)==="RMC"?0: procTag(p)==="General"?1:2; if(category==="Labour Rooms") return procTag(p)==="LR"?0: procTag(p)==="General"?1:2; return 0; };
    return [...list].sort((a,b)=> rank(a)-rank(b) || a.localeCompare(b));
  },[q,showAll,category,procedures]);
  return <div className="relative">
    <button type="button" onClick={()=>setOpen(!open)} className="flex w-full items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-2 text-left text-sm font-semibold">
      <span className="[overflow-wrap:anywhere]">{value ? displayProc(value) : "— Skipped —"}</span><ChevronDown size={16} className="shrink-0"/>
    </button>
    {open && <div className="absolute left-0 right-0 z-30 mt-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-2xl">
      <input autoFocus value={q} onChange={e=>setQ(e.target.value)} placeholder="Search procedure…" className="w-full text-sm"/>
      <label className="mt-2 flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={showAll} onChange={e=>setShowAll(e.target.checked)} className="w-auto"/> Show all procedures {category==="General Nursing" ? "(include [LR] / [RMC])" : "(all categories)"}</label>
      <p className="mt-1 text-[11px] text-[var(--muted)]">{category==="General Nursing" && !showAll ? "Showing general procedures first. Tick “Show all” to include [LR] / [RMC]." : category==="Renal Medicine Center" ? "Showing [RMC] procedures first." : category==="Labour Rooms" ? "Showing [LR] procedures first." : "General procedures first."} {filtered.length} found.</p>
      <div className="mt-2 max-h-56 overflow-auto">
        {filtered.map(p=> <button key={p} type="button" onClick={()=>{onChange(p); setOpen(false); setQ("");}} className={`block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-[var(--surface2)] ${value===p?"bg-[var(--surface2)] font-bold":""}`}><span className="[overflow-wrap:anywhere]">{p}</span></button>)}
        {filtered.length===0 && <p className="p-2 text-sm text-[var(--muted)]">No procedure matches your search.</p>}
      </div>
      <button type="button" onClick={()=>{onChange(null); setOpen(false); setQ("");}} className="mt-2 w-full rounded-lg border px-2 py-1.5 text-sm font-bold">Set to — Skipped —</button>
    </div>}
  </div>;
}

// ---- Lightweight XLSX generator (no external deps) ----
function xmlEscape(s:string){ return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;"); }
function colLetter(idx:number){ let n=idx; let s=""; while(n>=0){ s=String.fromCharCode(65+(n%26))+s; n=Math.floor(n/26)-1; } return s; }
function isNumericCell(v:string){ if(v===""||v===null||v===undefined) return false; const t=String(v).trim().toUpperCase(); if(t==="NA"||t==="") return false; const num=Number(t); return !isNaN(num) && isFinite(num); }
function sheetRowsToXml(rows:string[][]):string{
  const rowsXml = rows.map((row,ri)=>{
    const rNum=ri+1;
    const cells = row.map((val,ci)=>{
      const col=colLetter(ci); const ref=`${col}${rNum}`;
      if(val===null||val===undefined) val="";
      const str=String(val);
      if(isNumericCell(str)){
        return `<c r="${ref}"><v>${xmlEscape(str)}</v></c>`;
      } else {
        return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(str)}</t></is></c>`;
      }
    }).join("");
    return `<row r="${rNum}">${cells}</row>`;
  }).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowsXml}</sheetData></worksheet>`;
}
function makeCRCTable(){ const table:number[]=[]; for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++){ c = (c & 1) ? (0xEDB88320 ^ (c>>>1)) : (c>>>1); } table[n]=c; } return table; }
const CRC_TABLE = makeCRCTable();
function crc32Bytes(buf:Uint8Array){ let crc=0 ^ (-1); for(let i=0;i<buf.length;i++){ crc = (crc>>>8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xFF]; } return (crc ^ (-1)) >>>0; }
function strToBytes(s:string){ return new TextEncoder().encode(s); }
type ZipFile = { name:string; data:Uint8Array };
function buildZip(files:ZipFile[]):Uint8Array{
  const localParts:number[][]=[]; const centralParts:number[][]=[]; let offset=0;
  const writeU16=(arr:number[],v:number)=>{ arr.push(v & 0xFF, (v>>>8) & 0xFF); };
  const writeU32=(arr:number[],v:number)=>{ arr.push(v & 0xFF, (v>>>8) & 0xFF, (v>>>16) & 0xFF, (v>>>24) & 0xFF); };
  for(const f of files){
    const nameBytes=strToBytes(f.name); const data=f.data; const crc=crc32Bytes(data);
    const local:number[]=[]; writeU32(local,0x04034b50); writeU16(local,20); writeU16(local,0); writeU16(local,0); writeU16(local,0); writeU16(local,0); writeU32(local,crc); writeU32(local,data.length); writeU32(local,data.length); writeU16(local,nameBytes.length); writeU16(local,0);
    localParts.push(local, Array.from(nameBytes), Array.from(data));
    const central:number[]=[]; writeU32(central,0x02014b50); writeU16(central,20); writeU16(central,20); writeU16(central,0); writeU16(central,0); writeU16(central,0); writeU16(central,0); writeU32(central,crc); writeU32(central,data.length); writeU32(central,data.length); writeU16(central,nameBytes.length); writeU16(central,0); writeU16(central,0); writeU16(central,0); writeU16(central,0); writeU32(central,0); writeU32(central,offset);
    centralParts.push(central, Array.from(nameBytes));
    offset += local.length + nameBytes.length + data.length;
  }
  let centralSize=0; for(const p of centralParts) centralSize+=p.length;
  const centralOffset=offset;
  const eocd:number[]=[]; writeU32(eocd,0x06054b50); writeU16(eocd,0); writeU16(eocd,0); writeU16(eocd,files.length); writeU16(eocd,files.length); writeU32(eocd,centralSize); writeU32(eocd,centralOffset); writeU16(eocd,0);
  const totalLen = offset + centralSize + eocd.length;
  const out=new Uint8Array(totalLen); let pos=0;
  const push=(arr:number[])=>{ for(const b of arr){ out[pos++]=b; } };
  for(const p of localParts) push(p);
  for(const p of centralParts) push(p);
  push(eocd);
  return out;
}
function sanitizeSheetName(name:string){ let s=name.replace(/[\\/*?:\[\]]/g,"_").slice(0,31); if(!s) s="Sheet"; return s; }
function downloadXLSX(filename:string, sheets:{name:string, rows:string[][]}[]){
  const safeSheets = sheets.map((sh,i)=> ({ name: sanitizeSheetName(sh.name||`Sheet${i+1}`), rows: sh.rows }));
  const contentTypesOverrides = safeSheets.map((_,i)=> `<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${contentTypesOverrides}</Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${safeSheets.map((_,i)=> `<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join("")}<Relationship Id="rId${safeSheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${safeSheets.map((sh,i)=> `<sheet name="${xmlEscape(sh.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join("")}</sheets></workbook>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs></styleSheet>`;
  const files:ZipFile[] = [
    { name:"[Content_Types].xml", data: strToBytes(contentTypes) },
    { name:"_rels/.rels", data: strToBytes(rels) },
    { name:"xl/_rels/workbook.xml.rels", data: strToBytes(workbookRels) },
    { name:"xl/workbook.xml", data: strToBytes(workbook) },
    { name:"xl/styles.xml", data: strToBytes(styles) },
  ];
  safeSheets.forEach((sh,i)=>{
    const xml = sheetRowsToXml(sh.rows);
    files.push({ name:`xl/worksheets/sheet${i+1}.xml`, data: strToBytes(xml) });
  });
  const zipBytes = buildZip(files);
  const blob = new Blob([zipBytes], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=filename; a.click(); setTimeout(()=>URL.revokeObjectURL(url), 1000);
}

export default function App(){
  useEffect(()=>{ document.title = "North Al Batinah — Nursing Audit System"; },[]);
  const [user,setUser]=useState<User|null>(null);
  const [username,setUsername]=useState("admin");
  const [password,setPassword]=useState("admin123");
  const [loginError,setLoginError]=useState("");
  const [part,setPart]=useState<"1"|"2">("1");
  const [tab,setTab]=useState("Dashboard");
  const [plans,setPlans]=useState<Plan[]>([]);
  const [scores,setScores]=useState<Score[]>([]);
  const [overrides,setOverrides]=useState<PwdOverride[]>([]);
  const [compPlans,setCompPlans]=useState<CompPlan[]>([]);
  const [compScores,setCompScores]=useState<CompScore[]>([]);
  const [instOverrides,setInstOverrides]=useState<InstOverride[]>([]);
  const [procOverrides,setProcOverrides]=useState<ProcOverride[]>([]);
  const [auditorProfiles,setAuditorProfiles]=useState<AuditorProfile[]>([]);
  const [security,setSecurity]=useState<SecuritySettings>(DEFAULT_SECURITY);
  const [securityId,setSecurityId]=useState<string>("");
  const [loginAttempts,setLoginAttempts]=useState<LoginAttempt[]>([]);
  const [userSessionVersion,setUserSessionVersion]=useState<number|null>(null);
  const [accessCodeInput,setAccessCodeInput]=useState("");
  const [recoveryInput,setRecoveryInput]=useState("");
  const [pendingDisable,setPendingDisable]=useState<string|null>(null);
  const [disableConfirm,setDisableConfirm]=useState("");
  const [pendingLock,setPendingLock]=useState(false);
  const [lockConfirm,setLockConfirm]=useState("");
  const [pendingForceLogout,setPendingForceLogout]=useState(false);
  const [forceConfirm,setForceConfirm]=useState("");
  const [newRecoveryCode,setNewRecoveryCode]=useState("");
  const [showRecoveryOnce,setShowRecoveryOnce]=useState("");
  const [newAccessCode,setNewAccessCode]=useState("");
  const [rotateMode,setRotateMode]=useState<"one"|"separate">("one");
  const [rotateSingle,setRotateSingle]=useState("");
  const [rotateConfirm,setRotateConfirm]=useState("");
  const [rotateResult,setRotateResult]=useState<{password:string; username:string; label:string}[]|null>(null);
  const [securityMsg,setSecurityMsg]=useState("");
  const [unlockRecoveryInput,setUnlockRecoveryInput]=useState("");
  const [loading,setLoading]=useState(true);
  const [backendError,setBackendError]=useState("");
  const [topic,setTopic]=useState(TOPICS[0]);
  const [planId,setPlanId]=useState("");
  const [wilayatFilter,setWilayatFilter]=useState("All");
  const [search,setSearch]=useState("");
  const [selectedCell,setSelectedCell]=useState<{wilayat:string; institution:string; period:string; part?:string; category?:string}|null>(null);
  const [scoreInput,setScoreInput]=useState("");
  const [commentInput,setCommentInput]=useState("");
  const [auditorNameInput,setAuditorNameInput]=useState("");
  const [saveMsg,setSaveMsg]=useState("");
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState<{saved:number; remaining:number; error:string|null; reloadError:string|null}|null>(null);
  const [showHelp,setShowHelp]=useState(false);
  const [printView,setPrintView]=useState(false);
  const [newPlan,setNewPlan]=useState({topic:TOPICS[0], year:2027});
  const [pwdForm,setPwdForm]=useState({username:"suhar", password:""});
  const [pwdConfirm,setPwdConfirm]=useState("");
  const [showPwd,setShowPwd]=useState(false);
  const [pwdMsg,setPwdMsg]=useState("");
  const [category,setCategory]=useState<string>(CATEGORIES[0]);
  const [compPlanId,setCompPlanId]=useState("");
  const [newCompPlan,setNewCompPlan]=useState({category:CATEGORIES[0] as string, year:2027, procedures: Array(12).fill(null) as (string|null)[], feedback: Array(12).fill(false) as boolean[]});
  const [editingCompPlanId,setEditingCompPlanId]=useState("");
  const [editingProcedures,setEditingProcedures]=useState<(string|null)[]>([]);
  const [editingFeedback,setEditingFeedback]=useState<boolean[]>([]);
  const [editWarn,setEditWarn]=useState("");
  const [instForm,setInstForm]=useState({wilayat:"Suhar", name:"", assignments:["Part 1"] as string[]});
  const [editingInst,setEditingInst]=useState<EffInst|null>(null);
  const [instMsg,setInstMsg]=useState("");
  const [pendingDeleteInst,setPendingDeleteInst]=useState<EffInst|null>(null);
  const [procForm,setProcForm]=useState({name:"", tag:"General"});
  const [editingProc,setEditingProc]=useState<{name:string; sourceId?:string; sourceKind?:string; originalName?:string}|null>(null);
  const [procMsg,setProcMsg]=useState("");
  const [pendingDeleteProc,setPendingDeleteProc]=useState<{name:string; sourceId?:string; sourceKind?:string; originalName?:string}|null>(null);
  const [procSearch,setProcSearch]=useState("");
  const [procFilterTag,setProcFilterTag]=useState("All");
  const [p1AuditorFilter,setP1AuditorFilter]=useState("");
  const [p1SortDesc,setP1SortDesc]=useState(true);
  const [p2AuditorFilter,setP2AuditorFilter]=useState("");
  const [p2SortDesc,setP2SortDesc]=useState(true);
  const [expandedHistoryId,setExpandedHistoryId]=useState<string|null>(null);
  const [lastUpdatedAt,setLastUpdatedAt]=useState<string>("");
  const [liveStatus,setLiveStatus]=useState<"live"|"offline"|"refreshing">("live");
  const [liveToast,setLiveToast]=useState<string|null>(null);
  const [newDataBadge,setNewDataBadge]=useState<string|null>(null);
  const [refreshing,setRefreshing]=useState(false);
  const [initialLoadDone,setInitialLoadDone]=useState(false);
  const [initialLoadError,setInitialLoadError]=useState("");
  const [refreshMsg,setRefreshMsg]=useState("");
  const initialLoadDoneRef=React.useRef(false);
  const loadOnceInFlightRef=React.useRef(false);
  const scoresRef=React.useRef<Score[]>([]);
  const compScoresRef=React.useRef<CompScore[]>([]);
  const plansRef=React.useRef<Plan[]>([]);
  const compPlansRef=React.useRef<CompPlan[]>([]);
  const selectedCellRef=React.useRef<{wilayat:string; institution:string; period:string; part?:string; category?:string}|null>(null);
  const userRef=React.useRef<User|null>(null);
  const sessionVersionRef=React.useRef<number|null>(null);
  const partRef=React.useRef<"1"|"2">("1");
  const topicRef=React.useRef<string>(TOPICS[0]);
  const categoryRef=React.useRef<string>(CATEGORIES[0]);
  const activePlanRef=React.useRef<Plan|undefined>(undefined);
  const activeCompPlanRef=React.useRef<CompPlan|undefined>(undefined);
  const ownSaveUntilRef=React.useRef(0);
  const pollingRef=React.useRef(false);
  const loginPasswordRef=React.useRef("");
  const loginAccessCodeRef=React.useRef("");
  const loginAccessEnabledRef=React.useRef(false);
  const toastTimerRef=React.useRef<any>(null);
  const [viewportWidth,setViewportWidth]=useState(typeof window!=="undefined"?window.innerWidth:1024);
  const [singleMonthView,setSingleMonthView]=useState(false);
  const [singleMonthUserSet,setSingleMonthUserSet]=useState(false);
  const [mobileMonthIdx,setMobileMonthIdx]=useState(()=>new Date().getMonth());
  const [expandedWilayats,setExpandedWilayats]=useState<string[]>([...WILAYAT_ORDER]);
  const gridRef=React.useRef<HTMLDivElement|null>(null);
  const gridScrollLeftRef=React.useRef(0);
  const isMobile = viewportWidth<640;
  const isVeryNarrow = viewportWidth<380;
  const [guideCopyMsg,setGuideCopyMsg]=useState("");
  const GUIDE_TEXT = `Wilayat Quick Guide — How to Enter Scores on Your Phone

Step 1: Open the shared link on your phone (Chrome/Safari), log in with your Wilayat account (e.g. suhar / suhar123). If you don't see Refresh button, pull down to refresh browser.

Step 2: Choose Part 1 — Documentation Audits or Part 2 — Competency Procedures at top.

Step 3: Choose Year and Topic (Part 1) or Category (Part 2) — e.g. 2027 + Crash Cart.

Step 4: In Audit Grid, swipe sideways to see months Jan-Dec. Tip: turn ON "Single month view" for easiest entry — shows one big month column.

Step 5: Tap a cell (e.g. Saham Hospital • Jan). A bottom sheet opens: enter Score (0-100 or NA), Your Name (mandatory, min 2 chars), Comment (optional). Tap Save. Row highlights until saved.

Step 6: To edit, tap same cell again, change, Save — history kept in Comments.

Step 7: Tap ⟳ Refresh at top to see latest scores from other Wilayats, or wait 10 seconds for auto-refresh. Live status shows "Live • Updated HH:mm:ss".

Step 8: Check Dashboard to see Completion % and what is missing.

Troubleshooting:
- If cell shows Locked/Approved, you cannot edit — contact Admin.
- If offline, banner shows "Offline — showing last saved data" — will retry when online.
- If you flip phone portrait/landscape, your data stays.

Tips:
- Tip: Swipe sideways for months
- Tip: Use Single month view on small phones
- Tip: Tap Refresh after colleague saves`;
  function copyGuideText(){
    try{
      const ta=document.createElement("textarea");
      ta.value=GUIDE_TEXT;
      ta.setAttribute("readonly","");
      ta.style.position="absolute";
      ta.style.left="-9999px";
      document.body.appendChild(ta);
      ta.select();
      // @ts-ignore
      document.execCommand("copy");
      document.body.removeChild(ta);
      setGuideCopyMsg("Guide copied to clipboard");
      setTimeout(()=>setGuideCopyMsg(""),3000);
    }catch{
      setGuideCopyMsg("Could not copy — please select text manually");
      setTimeout(()=>setGuideCopyMsg(""),3000);
    }
  }
  useEffect(()=>{
    const onResize=()=>{
      const w=window.innerWidth;
      if(gridRef.current) gridScrollLeftRef.current=gridRef.current.scrollLeft;
      setViewportWidth(w);
      requestAnimationFrame(()=>{ if(gridRef.current) gridRef.current.scrollLeft=gridScrollLeftRef.current; });
    };
    window.addEventListener("resize",onResize);
    window.addEventListener("orientationchange",onResize);
    return ()=>{ window.removeEventListener("resize",onResize); window.removeEventListener("orientationchange",onResize); };
  },[]);
  useEffect(()=>{ if(viewportWidth<380 && !singleMonthUserSet) setSingleMonthView(true); },[viewportWidth,singleMonthUserSet]);
  const toggleWilayat=(w:string)=> setExpandedWilayats(prev=> prev.includes(w)?prev.filter(x=>x!==w):[...prev,w]);
  const scrollToMonth=(month:string)=>{
    const idx=MONTH_INDEX[month]??0; setMobileMonthIdx(idx);
    requestAnimationFrame(()=>{
      const el=gridRef.current?.querySelector(`[data-month="${month}"]`);
      if(gridRef.current && el) gridRef.current.scrollLeft=Math.max(0,(el as HTMLElement).offsetLeft-180);
    });
  };
  const jumpToMyWilayat=()=>{ if(isAdmin) setWilayatFilter(user?.wilayat && user.wilayat!=="All Wilayats" ? user.wilayat : "All"); setSearch(""); requestAnimationFrame(()=>{ if(gridRef.current){ gridRef.current.scrollTop=0; gridRef.current.scrollLeft=0; } }); };

  const effectiveUsers = useMemo(()=> DEFAULT_USERS.map(u=>{
    const o=overrides.find(x=>x.username===u.username); return o? {...u, password:o.password}:u;
  }),[overrides]);

  const effInstList = useMemo<EffInst[]>(()=>{
    const map = new Map<string,EffInst>();
    const setEntry=(wilayat:string, institution:string, assignments:string[], source?:Partial<EffInst>)=>{
      const clean=cleanInstitutionName(institution,wilayat);
      const key=`${wilayat}||${clean.toLowerCase()}`;
      const existing=map.get(key);
      if(existing){
        const merged=[...new Set([...existing.assignments, ...assignments])];
        map.set(key,{...existing, assignments:merged, ...(source||{})});
      } else {
        map.set(key,{wilayat, institution:clean, assignments:[...assignments], ...(source||{})});
      }
    };
    Object.entries(INSTITUTIONS).forEach(([w,list])=> list.forEach(inst=> setEntry(w,inst,["Part 1"])));
    Object.entries(COMP_INSTITUTIONS).forEach(([cat,list])=> list.forEach(v=> setEntry(v.wilayat, v.institution, [cat])));
    instOverrides.forEach(rec=>{
      if(rec.kind==="delete"){
        const origW=rec.originalWilayat||rec.wilayat;
        const origN=cleanInstitutionName(rec.originalName||rec.name, origW);
        map.delete(`${origW}||${origN.toLowerCase()}`);
      } else if(rec.kind==="add"){
        const clean=cleanInstitutionName(rec.name, rec.wilayat);
        map.set(`${rec.wilayat}||${clean.toLowerCase()}`,{wilayat:rec.wilayat, institution:clean, assignments:[...(rec.assignments||[])], sourceId:rec.id, sourceKind:"add", originalWilayat:rec.wilayat, originalName:clean});
      } else if(rec.kind==="edit"){
        const origW=rec.originalWilayat||rec.wilayat;
        const origN=cleanInstitutionName(rec.originalName||rec.name, origW);
        map.delete(`${origW}||${origN.toLowerCase()}`);
        const clean=cleanInstitutionName(rec.name, rec.wilayat);
        map.set(`${rec.wilayat}||${clean.toLowerCase()}`,{wilayat:rec.wilayat, institution:clean, assignments:[...(rec.assignments||[])], sourceId:rec.id, sourceKind:"edit", originalWilayat:origW, originalName:origN});
      }
    });
    return [...map.values()].sort((a,b)=> WILAYAT_ORDER.indexOf(a.wilayat)-WILAYAT_ORDER.indexOf(b.wilayat) || a.institution.localeCompare(b.institution));
  },[instOverrides]);

  const effPart1 = useMemo<Record<string,string[]>>(()=>{
    const out:Record<string,string[]>={};
    WILAYAT_ORDER.forEach(w=>{ out[w]=effInstList.filter(e=>e.wilayat===w && e.assignments.includes("Part 1")).map(e=>e.institution).sort((a,b)=>a.localeCompare(b)); });
    return out;
  },[effInstList]);

  const effComp = useMemo<Record<string,{wilayat:string;institution:string}[]>>(()=>{
    const out:Record<string,{wilayat:string;institution:string}[]>={};
    CATEGORIES.forEach(cat=>{ out[cat]=effInstList.filter(e=>e.assignments.includes(cat)).map(e=>({wilayat:e.wilayat, institution:e.institution})).sort((a,b)=> WILAYAT_ORDER.indexOf(a.wilayat)-WILAYAT_ORDER.indexOf(b.wilayat) || a.institution.localeCompare(b.institution)); });
    return out;
  },[effInstList]);

  const effectiveProcedures = useMemo<string[]>(()=>{
    const map=new Map<string,{name:string; sourceId?:string; sourceKind?:string; originalName?:string}>();
    PROCEDURES.forEach(p=> map.set(p.toLowerCase(),{name:p}));
    procOverrides.forEach(rec=>{
      if(rec.kind==="delete"){ map.delete((rec.originalName||rec.name).toLowerCase()); }
      else if(rec.kind==="add"){ map.set(rec.name.toLowerCase(),{name:rec.name, sourceId:rec.id, sourceKind:"add", originalName:rec.name}); }
      else if(rec.kind==="edit"){ map.delete((rec.originalName||rec.name).toLowerCase()); map.set(rec.name.toLowerCase(),{name:rec.name, sourceId:rec.id, sourceKind:"edit", originalName:rec.originalName||rec.name}); }
    });
    return [...map.values()].map(v=>v.name);
  },[procOverrides]);

  const procSourceMap = useMemo(()=>{
    const m=new Map<string,{sourceId?:string; sourceKind?:string; originalName?:string}>();
    PROCEDURES.forEach(p=> m.set(p.toLowerCase(),{}));
    procOverrides.forEach(rec=>{
      if(rec.kind==="delete"){ m.delete((rec.originalName||rec.name).toLowerCase()); }
      else if(rec.kind==="add"){ m.set(rec.name.toLowerCase(),{sourceId:rec.id, sourceKind:"add", originalName:rec.name}); }
      else if(rec.kind==="edit"){ m.delete((rec.originalName||rec.name).toLowerCase()); m.set(rec.name.toLowerCase(),{sourceId:rec.id, sourceKind:"edit", originalName:rec.originalName||rec.name}); }
    });
    return m;
  },[procOverrides]);

  const displayProcedure = (proc:string|null|undefined):string=>{
    if(!proc) return "— Skipped —";
    const exists = effectiveProcedures.some(p=>p.toLowerCase()===proc.toLowerCase());
    return exists ? proc : "(Removed procedure)";
  };
  const getLastName = (uname:string)=> auditorProfiles.find(p=>p.username===uname)?.lastName || "";

  const applyBundle = (b:FetchedBundle)=>{
    setPlans(b.plans); setScores(b.scores); setOverrides(b.overrides); setCompPlans(b.compPlans); setCompScores(b.compScores);
    setInstOverrides(b.instOverrides); setProcOverrides(b.procOverrides); setAuditorProfiles(b.auditorProfiles);
    setSecurityId(b.securityId); setSecurity(b.security); setLoginAttempts(b.loginAttempts);
  };
  const isSuspiciousEmpty = (b:FetchedBundle)=>{
    const had = (plansRef.current.length + scoresRef.current.length + compPlansRef.current.length + compScoresRef.current.length) > 0;
    const nowEmpty = (b.plans.length + b.scores.length + b.compPlans.length + b.compScores.length) === 0;
    return had && (nowEmpty || b.totalRecords===0);
  };
  const reloadRecords = async()=>{
    const b = await fetchBundle(20000);
    if(isSuspiciousEmpty(b)) throw new Error("Server returned empty data — keeping last good data");
    applyBundle(b);
    const now = new Date().toISOString();
    setLastUpdatedAt(now); setLiveStatus("live"); setBackendError(""); setInitialLoadError("");
    initialLoadDoneRef.current = true; setInitialLoadDone(true);
    return b;
  };
  const loadOnce = async(): Promise<FetchedBundle|null>=>{
    if(loadOnceInFlightRef.current) return null;
    loadOnceInFlightRef.current = true;
    setLoading(true); setInitialLoadError("");
    try{
      const b = await fetchBundle(20000);
      if(isSuspiciousEmpty(b)) throw new Error("Server returned empty data — keeping last good data");
      // Seed if empty (first time ever) — create security + basic plans once
      if(b.totalRecords===0){
        try{
          const secVal={...DEFAULT_SECURITY};
          await api("records.create",{collection:"audit_security", value:secVal, idempotency_key:`sec-seed-${Date.now()}`});
        }catch{}
        // seed plans for Part1
        for(const t of TOPICS){
          try{
            await api("records.create",{collection:"audit_plans", value:{topic:t, year:2027, frequency:"Monthly", periods:[...MONTHS], active:true}, idempotency_key:`seed-plan-${t}-2027-${Date.now()}-${Math.random()}`});
          }catch{}
        }
        // seed competency plans
        const seedComp=[
          {category:"General Nursing", year:2027, procedures:["Neourological assessment","Neourological assessment","Neourological assessment","Urinary Catheterization (Male)","Urinary Catheterization (Male)",null,"IV Cannulation Insertion","IV Cannulation Insertion","IV Fluid Administration","Cast Application (Plaster)",null,null], feedback:[false,false,false,false,false,true,false,false,false,false,false,false]},
          {category:"Renal Medicine Center", year:2027, procedures:["[RMC] Pre Dialysis assessment of Haemodialysis Patient","[RMC] Pre Dialysis assessment of Haemodialysis Patient","[RMC] Priming Dialysis Machine","[RMC] Priming Dialysis Machine",null,"[RMC] Commencing patient with Permanent access to HD Machine","[RMC] Commencing patient with Permanent access to HD Machine","[RMC] Post Dialysis assessment of Haemodialysis Patient","[RMC] Disconnecting patient with Permanent access from HD Machine",null,"[RMC] Management of hypotension during dialysis",null], feedback:[false,false,false,false,true,false,false,false,false,false,false,false]},
          {category:"Labour Rooms", year:2027, procedures:["[LR] Vaginal Examination","[LR] Vaginal Examination","[LR] 2nd Stage of Labour","[LR] 2nd Stage of Labour",null,"[LR] 3rd Stage of Labour","[LR] 3rd Stage of Labour","[LR] Episiotomy Incision, Repair","[LR] Breast Feeding Assessment","Checking FHS (fetal heart sound)",null,null], feedback:[false,false,false,false,true,false,false,false,false,false,false,false]},
        ];
        for(const sp of seedComp){
          try{
            await api("records.create",{collection:"competency_plans", value:{category:sp.category, year:sp.year, frequency:"Monthly", periods:[...MONTHS], procedures:sp.procedures, feedback:sp.feedback, active:true}, idempotency_key:`seed-comp-${sp.category}-${Date.now()}-${Math.random()}`});
          }catch{}
        }
        // re-fetch after seed
        const b2 = await fetchBundle(20000);
        applyBundle(b2);
        const now = new Date().toISOString();
        setLastUpdatedAt(now); setLiveStatus("live"); setBackendError(""); setInitialLoadError("");
        initialLoadDoneRef.current=true; setInitialLoadDone(true);
        setLoading(false); loadOnceInFlightRef.current=false;
        return b2;
      }
      applyBundle(b);
      const now = new Date().toISOString();
      setLastUpdatedAt(now); setLiveStatus("live"); setBackendError(""); setInitialLoadError("");
      initialLoadDoneRef.current = true; setInitialLoadDone(true);
      setLoading(false); loadOnceInFlightRef.current = false;
      return b;
    }catch(e:any){
      const msg = e?.message || "Records service unavailable.";
      setInitialLoadError(msg); setBackendError(msg); setLiveStatus("offline");
      setLoading(false); loadOnceInFlightRef.current = false;
      return null;
    }
  };
  const loadOnceRef = React.useRef(loadOnce); loadOnceRef.current = loadOnce;
  useEffect(()=>{ (async()=>{ await loadOnceRef.current(); })(); },[]);

  const activePlan = useMemo(()=>{
    const forTopic = plans.filter(p=>p.topic===topic);
    if(planId){ const f=forTopic.find(p=>p.id===planId); if(f) return f; }
    return forTopic.find(p=>p.active) || forTopic[0];
  },[plans,topic,planId]);
  useEffect(()=>{ if(activePlan && planId!==activePlan.id) setPlanId(activePlan.id); },[activePlan]);
  const activeCompPlan = useMemo(()=>{
    const forCat = compPlans.filter(p=>p.category===category);
    if(compPlanId){ const f=forCat.find(p=>p.id===compPlanId); if(f) return f; }
    return forCat.find(p=>p.active) || forCat[0];
  },[compPlans,category,compPlanId]);
  useEffect(()=>{ if(activeCompPlan && compPlanId!==activeCompPlan.id) setCompPlanId(activeCompPlan.id); },[activeCompPlan]);
  useEffect(()=>{ scoresRef.current=scores; compScoresRef.current=compScores; plansRef.current=plans; compPlansRef.current=compPlans; selectedCellRef.current=selectedCell; userRef.current=user; sessionVersionRef.current=userSessionVersion; partRef.current=part; topicRef.current=topic; categoryRef.current=category; activePlanRef.current=activePlan; activeCompPlanRef.current=activeCompPlan; });
  const kickToLogin=(msg:string)=>{ setUser(null); setUserSessionVersion(null); setSelectedCell(null); setLoginError(msg); };

  const pollRefreshAuto = async(): Promise<boolean>=>{
    const curUser=userRef.current; if(!curUser) return false;
    if(!initialLoadDoneRef.current) return false;
    if(selectedCellRef.current) return true;
    if(typeof document!=="undefined" && document.hidden) return true;
    if(pollingRef.current) return true;
    pollingRef.current=true;
    try{
      const b = await fetchBundle(8000);
      if(isSuspiciousEmpty(b)) throw new Error("Poll returned empty data — keeping last good data");
      const nextSec:SecuritySettings = b.security;
      const newOverrides=b.overrides;
      if(nextSec.disabled.includes(curUser.username)){ kickToLogin("Your access was revoked by Master — your account was disabled. Please contact Nursing Service Department."); pollingRef.current=false; return false; }
      if(nextSec.locked && curUser.role!=="Master"){ kickToLogin("System locked by Master. Please contact Nursing Service Department."); pollingRef.current=false; return false; }
      if(sessionVersionRef.current!==null && nextSec.sessionVersion!==sessionVersionRef.current && curUser.role!=="Master"){ kickToLogin("Session ended — please log in again. Your session was ended by Master (Force Logout)."); pollingRef.current=false; return false; }
      const effPwd = (()=>{ const ov=newOverrides.find((x:any)=>x.username===curUser.username); if(ov) return ov.password; const d=DEFAULT_USERS.find(u=>u.username===curUser.username); return d?d.password:""; })();
      if(loginPasswordRef.current && effPwd!==loginPasswordRef.current){ kickToLogin("Session ended — please log in again. Your password was changed by Master."); pollingRef.current=false; return false; }
      if((nextSec.accessCodeEnabled!==loginAccessEnabledRef.current) || (nextSec.accessCodeEnabled && nextSec.accessCode!==loginAccessCodeRef.current)){ kickToLogin("Session ended — please log in again. The Directorate Access Code was changed by Master."); pollingRef.current=false; return false; }
      const oldById=new Map<string,any>(scoresRef.current.map(x=>[x.id, x]));
      const oldCompById=new Map<string,any>(compScoresRef.current.map(x=>[x.id, x]));
      const changed1=b.scores.filter((x:any)=>{ const o=oldById.get(x.id); return !o || o.score!==x.score || o.comment!==x.comment || o.auditedAt!==x.auditedAt || o.auditorName!==x.auditorName; });
      const changed2=b.compScores.filter((x:any)=>{ const o=oldCompById.get(x.id); return !o || o.score!==x.score || o.comment!==x.comment || o.auditedAt!==x.auditedAt || o.auditorName!==x.auditorName; });
      applyBundle(b);
      setLastUpdatedAt(new Date().toISOString()); setLiveStatus("live"); setBackendError(""); setInitialLoadError("");
      const isOwn = Date.now() < ownSaveUntilRef.current;
      if(!isOwn && (changed1.length || changed2.length)){
        const curPart=partRef.current; const curPlan=activePlanRef.current; const curComp=activeCompPlanRef.current;
        const inView1=changed1.find((x:any)=> curPlan && x.planId===curPlan.id);
        const inView2=changed2.find((x:any)=> curComp && x.planId===curComp.id);
        if(curPart==="1" && inView1){ setLiveToast(`New score received — ${labelFor(inView1.wilayat,inView1.institution)} • ${inView1.topic||curPlan?.topic||""} • ${inView1.period} • ${inView1.score}`); setNewDataBadge(null); }
        else if(curPart==="2" && inView2){ setLiveToast(`New score received — ${labelFor(inView2.wilayat,inView2.institution)} • ${inView2.category||curComp?.category||""} • ${inView2.period} • ${inView2.score}`); setNewDataBadge(null); }
        else {
          const other = changed1[0] || changed2[0];
          const planLabel = other?.topic ? other.topic : (b.compPlans.find((pp:any)=>pp.id===other?.planId)?.category || other?.category || "another plan");
          setNewDataBadge(`New data in ${planLabel} — tap Refresh to view`);
        }
        if(toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current=setTimeout(()=>setLiveToast(null), 8000);
      }
    }catch(e:any){
      setLiveStatus("offline"); pollingRef.current=false; return false;
    } finally { pollingRef.current=false; }
    return true;
  };
  const pollRefreshAutoRef=React.useRef(pollRefreshAuto); pollRefreshAutoRef.current=pollRefreshAuto;

  const manualRefresh = async()=>{
    const curUser=userRef.current; if(!curUser) return;
    if(pollingRef.current && refreshing){ setRefreshMsg("Already refreshing..."); return; }
    setNewDataBadge(null); setRefreshing(true); setRefreshMsg("Refreshing..."); setLiveStatus("refreshing"); pollingRef.current=true;
    try{
      const b = await fetchBundle(20000);
      if(isSuspiciousEmpty(b)) throw new Error("Server returned empty data — keeping last good data");
      const nextSec:SecuritySettings = b.security; const newOverrides=b.overrides;
      if(nextSec.disabled.includes(curUser.username)){ kickToLogin("Your access was revoked by Master — your account was disabled. Please contact Nursing Service Department."); return; }
      if(nextSec.locked && curUser.role!=="Master"){ kickToLogin("System locked by Master. Please contact Nursing Service Department."); return; }
      if(sessionVersionRef.current!==null && nextSec.sessionVersion!==sessionVersionRef.current && curUser.role!=="Master"){ kickToLogin("Session ended — please log in again. Your session was ended by Master (Force Logout)."); return; }
      const effPwd = (()=>{ const ov=newOverrides.find((x:any)=>x.username===curUser.username); if(ov) return ov.password; const d=DEFAULT_USERS.find(u=>u.username===curUser.username); return d?d.password:""; })();
      if(loginPasswordRef.current && effPwd!==loginPasswordRef.current){ kickToLogin("Session ended — please log in again. Your password was changed by Master."); return; }
      if((nextSec.accessCodeEnabled!==loginAccessEnabledRef.current) || (nextSec.accessCodeEnabled && nextSec.accessCode!==loginAccessCodeRef.current)){ kickToLogin("Session ended — please log in again. The Directorate Access Code was changed by Master."); return; }
      const oldById=new Map<string,any>(scoresRef.current.map(x=>[x.id, x]));
      const oldCompById=new Map<string,any>(compScoresRef.current.map(x=>[x.id, x]));
      const changed1=b.scores.filter((x:any)=>{ const o=oldById.get(x.id); return !o || o.score!==x.score || o.comment!==x.comment || o.auditedAt!==x.auditedAt || o.auditorName!==x.auditorName; });
      const changed2=b.compScores.filter((x:any)=>{ const o=oldCompById.get(x.id); return !o || o.score!==x.score || o.comment!==x.comment || o.auditedAt!==x.auditedAt || o.auditorName!==x.auditorName; });
      applyBundle(b);
      const now = new Date().toISOString(); setLastUpdatedAt(now); setLiveStatus("live"); setBackendError(""); setInitialLoadError(""); initialLoadDoneRef.current=true; setInitialLoadDone(true);
      setRefreshMsg(`Updated ${formatLiveTime(now)}`);
      const isOwn = Date.now() < ownSaveUntilRef.current;
      if(!isOwn && (changed1.length || changed2.length)){
        const curPart=partRef.current; const curPlan=activePlanRef.current; const curComp=activeCompPlanRef.current;
        const inView1=changed1.find((x:any)=> curPlan && x.planId===curPlan.id);
        const inView2=changed2.find((x:any)=> curComp && x.planId===curComp.id);
        if(curPart==="1" && inView1){ setLiveToast(`New score received — ${labelFor(inView1.wilayat,inView1.institution)} • ${inView1.topic||curPlan?.topic||""} • ${inView1.period} • ${inView1.score}`); }
        else if(curPart==="2" && inView2){ setLiveToast(`New score received — ${labelFor(inView2.wilayat,inView2.institution)} • ${inView2.category||curComp?.category||""} • ${inView2.period} • ${inView2.score}`); }
        else { setLiveToast(`New scores received — ${changed1.length+changed2.length} updated`); }
        if(toastTimerRef.current) clearTimeout(toastTimerRef.current); toastTimerRef.current=setTimeout(()=>setLiveToast(null), 8000);
      } else if(changed1.length===0 && changed2.length===0){ setLiveToast(`Up to date — no new scores`); if(toastTimerRef.current) clearTimeout(toastTimerRef.current); toastTimerRef.current=setTimeout(()=>setLiveToast(null), 3000); }
    }catch(e:any){ setLiveStatus("offline"); setRefreshMsg("Refresh failed — showing last saved data"); } finally { pollingRef.current=false; setRefreshing(false); }
  };
  const manualRefreshRef=React.useRef(manualRefresh); manualRefreshRef.current=manualRefresh;

  useEffect(()=>{
    if(!user || !initialLoadDone) return;
    const t=setInterval(()=>{ if(!document.hidden) pollRefreshAutoRef.current(); }, 10000);
    const onVis=()=>{ if(!document.hidden) pollRefreshAutoRef.current(); };
    const onFocus=()=>{ pollRefreshAutoRef.current(); };
    const onOnline=()=>{ pollRefreshAutoRef.current(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    return ()=>{ clearInterval(t); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("focus", onFocus); window.removeEventListener("online", onOnline); };
  },[user, initialLoadDone]);

  useEffect(()=>{ setSelectedCell(null); },[topic, activePlan?.id, category, activeCompPlan?.id, part]);
  useEffect(()=>{ if(!selectedCell) return; const onKey=(e:KeyboardEvent)=>{ if(e.key==="Escape") setSelectedCell(null); }; window.addEventListener("keydown",onKey); return ()=>window.removeEventListener("keydown",onKey); },[selectedCell]);

  const visibleWilayats = useMemo(()=>{
    if(!user) return []; if(user.role!=="Wilayat") return wilayatFilter==="All" ? [...WILAYAT_ORDER] : [wilayatFilter]; return [user.wilayat];
  },[user,wilayatFilter]);

  const visibleInstitutions = useMemo(()=>{
    const list: {wilayat:string; institution:string}[]=[];
    visibleWilayats.forEach(w=> (effPart1[w]||[]).forEach(inst=>{
      if(search && !(`${w} ${labelFor(w,inst)}`).toLowerCase().includes(search.toLowerCase()) && !labelFor(w,inst).toLowerCase().includes(search.toLowerCase())) return;
      list.push({wilayat:w, institution:labelFor(w,inst)});
    }));
    return list;
  },[visibleWilayats,search,effPart1]);

  const visibleCompInstitutions = useMemo(()=>{
    const all = effComp[category] || [];
    return all.filter(v=>{
      if(user?.role==="Wilayat" && user && v.wilayat!==user.wilayat) return false;
      if(user?.role!=="Wilayat" && wilayatFilter!=="All" && v.wilayat!==wilayatFilter) return false;
      if(search && !(`${v.wilayat} ${labelFor(v.wilayat,v.institution)}`).toLowerCase().includes(search.toLowerCase()) && !labelFor(v.wilayat,v.institution).toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  },[category,user,wilayatFilter,search,effComp]);

  const planScores = useMemo(()=> activePlan ? scores.filter(s=>s.planId===activePlan.id) : [],[scores,activePlan]);
  const findScore=(w:string,inst:string,period:string)=> planScores.find(s=>s.wilayat===w && s.institution===inst && s.period===period);
  const compPlanScores = useMemo(()=> activeCompPlan ? compScores.filter(s=>s.planId===activeCompPlan.id) : [],[compScores,activeCompPlan]);
  const findCompScore=(w:string,inst:string,period:string)=> compPlanScores.find(s=>s.wilayat===w && s.institution===inst && s.period===period);
  const activeBlocks = useMemo(()=> getBlocks(activeCompPlan),[activeCompPlan]);
  const findBlockScore=(w:string,inst:string,block:Block): CompScore|undefined=>{
    const cands = compPlanScores.filter(s=>s.wilayat===w && s.institution===inst && block.months.includes(MONTH_INDEX[s.period] ?? -1));
    if(!cands.length) return undefined;
    return [...cands].sort((a,b)=>{
      const da=a.auditedAt?new Date(a.auditedAt).getTime():0; const db=b.auditedAt?new Date(b.auditedAt).getTime():0;
      if(db!==da) return db-da;
      return (MONTH_INDEX[b.period]??0)-(MONTH_INDEX[a.period]??0);
    })[0];
  };
  const blockScoresFor=(w:string,inst:string): Map<string,CompScore>=>{
    const m=new Map<string,CompScore>();
    activeBlocks.forEach(b=>{ const s=findBlockScore(w,inst,b); if(s) m.set(`${b.start}-${b.end}`, s); });
    return m;
  };
  function statsFor(list:Score[]){ const nums=list.filter(s=>s.score!=="NA" && s.score!=="").map(s=>parseFloat(s.score)).filter(n=>!isNaN(n)); return {count:list.length, avg: nums.length? nums.reduce((a,b)=>a+b,0)/nums.length : null}; }
  function statsForComp(list:CompScore[]){ const nums=list.filter(s=>s.score!=="NA" && s.score!=="").map(s=>parseFloat(s.score)).filter(n=>!isNaN(n)); return {count:list.length, avg: nums.length? nums.reduce((a,b)=>a+b,0)/nums.length : null}; }
  const gridStats = useMemo(()=>{
    const relevant = planScores.filter(s=> visibleInstitutions.some(v=>v.wilayat===s.wilayat && v.institution===s.institution));
    const totalExpected = activePlan ? visibleInstitutions.length * activePlan.periods.length : 0;
    const st=statsFor(relevant);
    return {...st, totalExpected, missing: Math.max(0,totalExpected-relevant.length), completion: totalExpected? (relevant.length/totalExpected*100):0};
  },[planScores,visibleInstitutions,activePlan]);

  const compGridStats = useMemo(()=>{
    if(!activeCompPlan) return {count:0, avg:null as number|null, totalExpected:0, missing:0, completion:0};
    let count=0; const allBlockScores: CompScore[]=[];
    visibleCompInstitutions.forEach(v=>{
      activeBlocks.forEach(b=>{
        const s=findBlockScore(v.wilayat,v.institution,b);
        if(s){ count++; allBlockScores.push(s); }
      });
    });
    const totalExpected = visibleCompInstitutions.length * activeBlocks.length;
    const st=statsForComp(allBlockScores);
    return {count, avg:st.avg, totalExpected, missing: Math.max(0,totalExpected-count), completion: totalExpected? (count/totalExpected*100):0};
  },[compPlanScores,visibleCompInstitutions,activeCompPlan,activeBlocks]);

  const wilayatStats = useMemo(()=> WILAYAT_ORDER.map(w=>{
    const insts=effPart1[w]||[];
    const rel=scores.filter(s=>s.wilayat===w && (!activePlan || s.planId===activePlan.id));
    const expected=activePlan? insts.length*activePlan.periods.length:0;
    const st=statsFor(rel);
    return {wilayat:w, count:insts.length, ...st, expected, missing:Math.max(0,expected-rel.length), completion: expected? rel.length/expected*100:0};
  }),[scores,activePlan,effPart1]);

  const topicStats = useMemo(()=> TOPICS.map(t=>{
    const rel=scores.filter(s=>s.topic===t && (!activePlan || s.year===activePlan.year) && (user?.role!=="Wilayat" || s.wilayat===user?.wilayat));
    const st=statsFor(rel);
    const expectedPlans=plans.filter(p=>p.topic===t && (!activePlan || p.year===activePlan.year));
    const expected=expectedPlans.reduce((sum,p)=> sum + (user?.role!=="Wilayat"? Object.values(effPart1).reduce((a,b)=>a+b.length,0) : (effPart1[user?.wilayat||"Suhar"]?.length||0))*p.periods.length,0);
    return {topic:t, ...st, completion: expected? rel.length/expected*100:0, expected};
  }),[scores,plans,activePlan,user,effPart1]);

  const notStarted = useMemo(()=> visibleInstitutions.filter(v=> !planScores.some(s=>s.wilayat===v.wilayat && s.institution===v.institution)),[visibleInstitutions,planScores]);

  const compCategoryStats = useMemo(()=> CATEGORIES.map(cat=>{
    const plan = compPlans.find(p=>p.category===cat && p.active) || compPlans.find(p=>p.category===cat);
    const insts = (effComp[cat]||[]).filter(v=> user?.role!=="Wilayat" ? (wilayatFilter==="All" || v.wilayat===wilayatFilter) : v.wilayat===user?.wilayat);
    if(!plan) return {category:cat, plan:undefined as CompPlan|undefined, count:0, avg:null as number|null, completion:0, expected:0, missing:0, total:insts.length, blocks:[] as Block[]};
    const blocks=getBlocks(plan);
    const relScores: CompScore[]=[]; let count=0;
    insts.forEach(v=>{
      blocks.forEach(b=>{
        const cands=compScores.filter(s=>s.planId===plan.id && s.wilayat===v.wilayat && s.institution===v.institution && b.months.includes(MONTH_INDEX[s.period]??-1));
        if(cands.length){ count++; const latest=[...cands].sort((a,b2)=>{ const da=a.auditedAt?new Date(a.auditedAt).getTime():0; const db=b2.auditedAt?new Date(b2.auditedAt).getTime():0; return db-da; })[0]; relScores.push(latest); }
      });
    });
    const expected = insts.length * blocks.length;
    const st = statsForComp(relScores);
    return {category:cat, plan, count, avg:st.avg, completion: expected? count/expected*100:0, expected, missing:Math.max(0,expected-count), total:insts.length, blocks};
  }),[compPlans,compScores,user,wilayatFilter,effComp]);

  const compWilayatStats = useMemo(()=>{
    const wilayats = user?.role!=="Wilayat" ? (wilayatFilter==="All" ? [...WILAYAT_ORDER] : [wilayatFilter]) : [user?.wilayat||""];
    return wilayats.map(w=>{
      const plan = activeCompPlan;
      const insts = (effComp[category]||[]).filter(v=>v.wilayat===w);
      if(!plan) return {wilayat:w, count:insts.length, avg:null as number|null, completion:0, submitted:0, missing:0};
      const blocks=getBlocks(plan);
      let submitted=0; const blockScores: CompScore[]=[];
      insts.forEach(v=>{
        blocks.forEach(b=>{
          const cands=compPlanScores.filter(s=>s.wilayat===v.wilayat && s.institution===v.institution && b.months.includes(MONTH_INDEX[s.period]??-1));
          if(cands.length){ submitted++; const latest=[...cands].sort((a,b2)=>{ const da=a.auditedAt?new Date(a.auditedAt).getTime():0; const db=b2.auditedAt?new Date(b2.auditedAt).getTime():0; return db-da; })[0]; blockScores.push(latest); }
        });
      });
      const expected = insts.length * blocks.length;
      const st = statsForComp(blockScores);
      return {wilayat:w, count:insts.length, avg:st.avg, completion: expected? submitted/expected*100:0, submitted, missing:Math.max(0,expected-submitted)};
    });
  },[compScores,compPlanScores,activeCompPlan,category,user,wilayatFilter,effComp]);

  type CompMissing = {wilayat:string; institution:string; procedure:string; range:string; block:Block};
  const compNotStartedList = useMemo<CompMissing[]>(()=>{
    const out: CompMissing[]=[];
    visibleCompInstitutions.forEach(v=>{
      activeBlocks.forEach(b=>{
        const s=findBlockScore(v.wilayat,v.institution,b);
        if(!s) out.push({wilayat:v.wilayat, institution:v.institution, procedure:b.procedure, range:blockLabel(b), block:b});
      });
    });
    return out;
  },[visibleCompInstitutions,activeBlocks,compPlanScores]);

  const compProcedureStats = useMemo(()=>{
    return activeBlocks.map(b=>{
      const list: CompScore[]=[];
      visibleCompInstitutions.forEach(v=>{
        const s=findBlockScore(v.wilayat,v.institution,b);
        if(s) list.push(s);
      });
      const st=statsForComp(list);
      return {procedure:b.procedure, block:b, range:blockLabel(b), ...st};
    }).sort((a,b)=> (b.avg??-1)-(a.avg??-1));
  },[activeBlocks,visibleCompInstitutions,compPlanScores]);

  async function saveSecurity(next:SecuritySettings){
    if(securityId){ await api("records.replace",{collection:"audit_security", id:securityId, value:next}); }
    else { const created:any = await api("records.create",{collection:"audit_security", value:next, idempotency_key:`security-single-${Date.now()}`}); if(created?.id) setSecurityId(created.id); }
    setSecurity(next); return next;
  }
  async function logAttempt(attempt:{username:string; success:boolean; status:string; reason:string}){
    try{ await api("records.create",{collection:"audit_login_attempts", value:{...attempt, at:new Date().toISOString()}, idempotency_key:`login-${attempt.username}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}); }catch{}
  }
  async function refreshSecurityForSession(){
    try{
      const d:any = await api("records.list",{collection:"audit_security"});
      const rec = (d.records||[])[0];
      if(!rec) return;
      const next = {...DEFAULT_SECURITY, ...rec.value, disabled:Array.isArray(rec.value?.disabled)?rec.value.disabled:[]};
      setSecurity(next); setSecurityId(rec.id);
      if(!user) return;
      if(next.disabled.includes(user.username)){ setUser(null); setUserSessionVersion(null); setLoginError("Your account was disabled by Admin. Contact Nursing Service Department."); return; }
      if(next.locked && user.role!=="Master"){ setUser(null); setUserSessionVersion(null); setLoginError("System locked by Master. Contact Nursing Service Department."); return; }
      if(userSessionVersion!==null && next.sessionVersion!==userSessionVersion && user.role!=="Master"){ setUser(null); setUserSessionVersion(null); setLoginError("Your session was revoked by Master (Force Logout). Please log in again."); }
    }catch{}
  }
  useEffect(()=>{
    if(!user) return;
    const t = setInterval(()=>{ refreshSecurityForSession(); }, 30000);
    return ()=>clearInterval(t);
  },[user, userSessionVersion]);
  async function login(e:React.FormEvent){
    e.preventDefault(); setLoginError("");
    loginPasswordRef.current=password; loginAccessCodeRef.current=accessCodeInput.trim(); loginAccessEnabledRef.current=security.accessCodeEnabled;
    const uname = username.trim().toLowerCase();
    const found=effectiveUsers.find(u=>u.username===uname);
    const attemptStatus = (u:string)=> security.disabled.includes(u) ? "Disabled" : security.locked ? "Locked" : "Active";
    if(security.locked){
      const isMasterUser = found?.role==="Master";
      const recoveryOk = !security.recoveryCode || recoveryInput.trim()===security.recoveryCode;
      const unlockCodeOk = !security.accessCodeEnabled || accessCodeInput.trim()===security.accessCode;
      if(!isMasterUser || !found || found.password!==password || !recoveryOk || !unlockCodeOk){
        const reason = !isMasterUser ? "System locked — only Master Unlock allowed" : found?.password!==password ? "Incorrect Master password" : !recoveryOk ? "Incorrect Recovery Code" : "Incorrect Directorate Access Code";
        setLoginError("System locked by Master. Contact Nursing Service Department. Master Unlock requires Master password + Recovery Code" + (security.accessCodeEnabled ? " + Directorate Access Code." : "."));
        await logAttempt({username:uname, success:false, status:attemptStatus(uname), reason});
        try{ await reloadRecords(); }catch{} return;
      }
      const next = {...security, locked:false};
      try{ await saveSecurity(next); }catch(err:any){ setLoginError(`Could not unlock: ${err.message}`); return; }
      await logAttempt({username:uname, success:true, status:"Active", reason:"Master Unlock — system unlocked"});
      setUser(found); setUserSessionVersion(next.sessionVersion); setTab("Dashboard"); setUnlockRecoveryInput(""); setRecoveryInput(""); setAccessCodeInput("");
      setLoading(true); try{ await reloadRecords(); }catch{} setLoading(false); return;
    }
    if(!found || found.password!==password){
      setLoginError("Incorrect username or password. Use a demo login below.");
      await logAttempt({username:uname, success:false, status:found?attemptStatus(uname):"Unknown account", reason:"Incorrect username or password"});
      try{ await reloadRecords(); }catch{} return;
    }
    if(security.disabled.includes(found.username)){
      setLoginError("This account has been disabled by Admin. Contact Nursing Service Department.");
      await logAttempt({username:uname, success:false, status:"Disabled", reason:"Account disabled by Admin"});
      try{ await reloadRecords(); }catch{} return;
    }
    if(security.accessCodeEnabled && accessCodeInput.trim()!==security.accessCode){
      setLoginError("Incorrect Directorate Access Code. Contact Nursing Service Department for the current code.");
      await logAttempt({username:uname, success:false, status:attemptStatus(uname), reason:"Incorrect Directorate Access Code"});
      try{ await reloadRecords(); }catch{} return;
    }
    await logAttempt({username:uname, success:true, status:"Active", reason:"Login successful"});
    setUser(found); setUserSessionVersion(security.sessionVersion); setTab("Dashboard"); if(found.role!=="Admin") setWilayatFilter("All");
    setAccessCodeInput(""); setRecoveryInput(""); setLoading(true); setInitialLoadError("");
    try{ const b = await fetchBundle(20000); if(!isSuspiciousEmpty(b)){ applyBundle(b); const now=new Date().toISOString(); setLastUpdatedAt(now); setLiveStatus("live"); initialLoadDoneRef.current=true; setInitialLoadDone(true); } else { await reloadRecords(); } }catch(err:any){ setInitialLoadError(err.message||"Could not load data"); }
    setLoading(false);
  }
  async function toggleDisableAccount(uname:string){
    if(uname==="master" || uname==="admin"){ setSecurityMsg("Master and Admin accounts are Protected and cannot be disabled."); return; }
    const isDisabled = security.disabled.includes(uname);
    const next:SecuritySettings = {...security, disabled: isDisabled ? security.disabled.filter(x=>x!==uname) : [...security.disabled, uname]};
    setBusy(true); setSecurityMsg("");
    try{ await saveSecurity(next); await reloadRecords(); setSecurityMsg(isDisabled ? `Account ${uname} re-enabled.` : `Account ${uname} disabled.`); setPendingDisable(null); setDisableConfirm(""); }catch(err:any){ setSecurityMsg(`Could not update account status: ${err.message}`); } setBusy(false);
  }
  async function doLockSystem(){
    if(security.recoveryCode && lockConfirm.trim()!=="LOCK"){ setSecurityMsg("Type LOCK exactly to confirm Emergency Lock."); return; }
    if(!security.recoveryCode){ setSecurityMsg("Set a Recovery Code first — it is required to unlock after an Emergency Lock."); return; }
    setBusy(true); try{ const next:SecuritySettings={...security, locked:true}; await saveSecurity(next); await reloadRecords(); setSecurityMsg("System locked. Nobody can log in except Master via Master Unlock."); setPendingLock(false); setLockConfirm(""); }catch(err:any){ setSecurityMsg(`Could not lock system: ${err.message}`); } setBusy(false);
  }
  async function doUnlockFromPanel(){
    if(security.recoveryCode && unlockRecoveryInput.trim()!==security.recoveryCode){ setSecurityMsg("Incorrect Recovery Code — system stays locked."); return; }
    setBusy(true); try{ const next:SecuritySettings={...security, locked:false}; await saveSecurity(next); await reloadRecords(); setSecurityMsg("System unlocked."); setUnlockRecoveryInput(""); }catch(err:any){ setSecurityMsg(`Could not unlock: ${err.message}`); } setBusy(false);
  }
  async function doForceLogout(){
    if(forceConfirm.trim()!=="FORCE LOGOUT"){ setSecurityMsg("Type FORCE LOGOUT exactly to confirm."); return; }
    setBusy(true); try{ const next:SecuritySettings={...security, sessionVersion: (security.sessionVersion||1)+1, lastRevocationAt:new Date().toISOString(), lastRevocationBy:"Master"}; await saveSecurity(next); setUserSessionVersion(next.sessionVersion); await reloadRecords(); setSecurityMsg("Force Logout done. All Wilayat sessions are revoked."); setPendingForceLogout(false); setForceConfirm(""); }catch(err:any){ setSecurityMsg(`Could not force logout: ${err.message}`); } setBusy(false);
  }
  function randomPassword(){ const chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%"; let out=""; for(let i=0;i<12;i++) out+=chars[Math.floor(Math.random()*chars.length)]; return out; }
  async function doRotatePasswords(){
    if(rotateConfirm.trim()!=="ROTATE"){ setSecurityMsg("Type ROTATE exactly to confirm password rotation."); return; }
    if(rotateMode==="one" && rotateSingle.trim().length<4){ setSecurityMsg("Choose a new password of at least 4 characters for all Wilayat accounts."); return; }
    setBusy(true); setSecurityMsg("");
    try{
      const wilayats = DEFAULT_USERS.filter(u=>u.role==="Wilayat");
      const generated = wilayats.map(u=>({username:u.username, label:u.label, password: rotateMode==="one" ? rotateSingle.trim() : randomPassword()}));
      let saved=0; let error:string|null=null;
      for(const g of generated){
        try{
          const existing = overrides.find(o=>o.username===g.username);
          if(existing) await api("records.replace",{collection:"audit_passwords", id:existing.id, value:{username:g.username, password:g.password}});
          else await api("records.create",{collection:"audit_passwords", value:{username:g.username, password:g.password}, idempotency_key:`pwd-rotate-${g.username}-${Date.now()}`});
          saved++;
        }catch(err:any){ error=err.message; break; }
      }
      await reloadRecords();
      if(error){ setSecurityMsg(`Rotation stopped after ${saved} of ${generated.length} accounts: ${error}.`); }
      else { setRotateResult(generated); setSecurityMsg(`All ${generated.length} Wilayat passwords changed.`); }
      setRotateConfirm("");
    }catch(err:any){ setSecurityMsg(`Could not rotate passwords: ${err.message}`); } setBusy(false);
  }
  async function doSaveRecoveryCode(){
    if(newRecoveryCode.trim().length<6){ setSecurityMsg("Recovery Code must be at least 6 characters."); return; }
    setBusy(true); try{ const next:SecuritySettings={...security, recoveryCode:newRecoveryCode.trim()}; await saveSecurity(next); await reloadRecords(); setShowRecoveryOnce(newRecoveryCode.trim()); setNewRecoveryCode(""); setSecurityMsg("Recovery Code saved. It is shown once below — store it privately."); }catch(err:any){ setSecurityMsg(`Could not save Recovery Code: ${err.message}`); } setBusy(false);
  }
  async function doSaveAccessCode(){
    if(newAccessCode.trim().length<3){ setSecurityMsg("Access Code must be at least 3 characters (e.g. NB-2027)."); return; }
    setBusy(true); try{ const next:SecuritySettings={...security, accessCode:newAccessCode.trim(), accessCodeEnabled:true}; await saveSecurity(next); await reloadRecords(); setNewAccessCode(""); setSecurityMsg("Directorate Access Code saved and turned ON."); }catch(err:any){ setSecurityMsg(`Could not save Access Code: ${err.message}`); } setBusy(false);
  }
  async function doToggleAccessCode(){
    setBusy(true);
    try{
      if(security.accessCodeEnabled){ const next:SecuritySettings={...security, accessCodeEnabled:false}; await saveSecurity(next); setSecurityMsg("Directorate Access Code turned OFF."); }
      else { if(!security.accessCode){ setSecurityMsg("Set an Access Code first, then turn it ON."); setBusy(false); return; } const next:SecuritySettings={...security, accessCodeEnabled:true}; await saveSecurity(next); setSecurityMsg("Directorate Access Code turned ON."); }
      await reloadRecords();
    }catch(err:any){ setSecurityMsg(`Could not change Access Code setting: ${err.message}`); } setBusy(false);
  }
  async function doToggleShowDemoPasswords(){
    setBusy(true);
    try{
      const next:SecuritySettings={...security, showDemoPasswords: !security.showDemoPasswords};
      await saveSecurity(next);
      await reloadRecords();
      setSecurityMsg(next.showDemoPasswords ? "Demo passwords will now be visible on login page (testing mode)." : "Demo passwords hidden on login page (production mode).");
    }catch(err:any){ setSecurityMsg(`Could not change demo password visibility: ${err.message}`); }
    setBusy(false);
  }
  function logout(){ setUser(null); setPassword(""); setSelectedCell(null); setUserSessionVersion(null); }
  async function createRow(row:any, collection:string, key:string){ await api("records.create",{collection, value:row, idempotency_key:key}); }
  const isScoreValid = (v:string)=>{ const t=v.trim().toUpperCase(); if(t==="") return false; if(t==="NA") return true; const n=Number(t); return !isNaN(n) && n>=0 && n<=100; };
  const isNameValid = (v:string)=> v.trim().length>=2;

  async function saveCell(){
    if(!selectedCell || !user) return;
    ownSaveUntilRef.current=Date.now()+20000;
    const val=scoreInput.trim().toUpperCase();
    const nameVal=auditorNameInput.trim();
    if(!isScoreValid(scoreInput)){ setSaveMsg("Score is mandatory: enter 0–100 or NA."); return; }
    if(!isNameValid(auditorNameInput)){ setSaveMsg("Auditor Name is mandatory: enter at least 2 characters."); return; }
    if(selectedCell.part==="2"){
      if(!activeCompPlan) return;
      const idx = activeCompPlan.periods.indexOf(selectedCell.period);
      if(idx>=0 && activeCompPlan.feedback?.[idx]){ setSaveMsg("This month is Obtaining Feedback — it cannot receive a score."); return; }
      if(idx>=0 && !activeCompPlan.procedures?.[idx]){ setSaveMsg("This period is skipped — it cannot receive a score."); return; }
      setBusy(true); setSaveMsg("");
      const existing=findCompScore(selectedCell.wilayat,selectedCell.institution,selectedCell.period);
      const proc = (idx>=0 ? activeCompPlan.procedures?.[idx] : null) || "";
      const nowIso = new Date().toISOString();
      const block = blockForMonth(activeCompPlan, idx);
      const blockScore = block ? findBlockScore(selectedCell.wilayat,selectedCell.institution,block) : undefined;
      let history: HistoryEntry[] = existing?.history ? [...existing.history] : [];
      if(existing && existing.auditedAt){ const entry: HistoryEntry = { score: existing.score, comment: existing.comment||"", auditorName: existing.auditorName||"", auditedAt: existing.auditedAt }; history = [entry, ...history].slice(0,10); }
      else if(!existing && blockScore && blockScore.period!==selectedCell.period && blockScore.auditedAt){ const entry: HistoryEntry = { score: blockScore.score, comment: blockScore.comment||"", auditorName: blockScore.auditorName||"", auditedAt: blockScore.auditedAt }; history = [entry, ...(blockScore.history||[])].slice(0,10); }
      const value={planId:activeCompPlan.id, wilayat:selectedCell.wilayat, institution:cleanInstitutionName(selectedCell.institution,selectedCell.wilayat), category:selectedCell.category||category, year:activeCompPlan.year, period:selectedCell.period, procedure:proc, score:val, comment:commentInput.trim(), auditorName:nameVal, auditedAt:nowIso, history};
      try{
        if(existing) await api("records.replace",{collection:"competency_scores", id:existing.id, value});
        else await api("records.create",{collection:"competency_scores", value, idempotency_key:`compscore-${activeCompPlan.id}-${selectedCell.wilayat}-${selectedCell.institution}-${selectedCell.period}-${Date.now()}`});
        try{
          const prof = auditorProfiles.find(p=>p.username===user.username);
          if(prof){ if(prof.lastName!==nameVal) await api("records.replace",{collection:"audit_auditor_names", id:prof.id, value:{username:user.username, lastName:nameVal}}); }
          else { await api("records.create",{collection:"audit_auditor_names", value:{username:user.username, lastName:nameVal}, idempotency_key:`auditor-${user.username}-${Date.now()}`}); }
        }catch{}
        await reloadRecords(); setSaveMsg("Saved. Statistics updated."); setSelectedCell(null);
      }catch(e:any){ setSaveMsg(`Could not save: ${e.message}`); } setBusy(false); return;
    }
    if(!activePlan) return;
    setBusy(true); setSaveMsg("");
    const existing=findScore(selectedCell.wilayat,selectedCell.institution,selectedCell.period);
    const nowIso = new Date().toISOString();
    let history: HistoryEntry[] = existing?.history ? [...existing.history] : [];
    if(existing && existing.auditedAt){ const entry: HistoryEntry = { score: existing.score, comment: existing.comment||"", auditorName: existing.auditorName||"", auditedAt: existing.auditedAt }; history = [entry, ...history].slice(0,10); }
    const value={planId:activePlan.id, wilayat:selectedCell.wilayat, institution:cleanInstitutionName(selectedCell.institution,selectedCell.wilayat), topic:activePlan.topic, year:activePlan.year, period:selectedCell.period, score:val, comment:commentInput.trim(), auditorName:nameVal, auditedAt:nowIso, history};
    try{
      if(existing) await api("records.replace",{collection:"audit_scores", id:existing.id, value});
      else await api("records.create",{collection:"audit_scores", value, idempotency_key:`score-${activePlan.id}-${selectedCell.wilayat}-${selectedCell.institution}-${selectedCell.period}-${Date.now()}`});
      try{
        const prof = auditorProfiles.find(p=>p.username===user.username);
        if(prof){ if(prof.lastName!==nameVal) await api("records.replace",{collection:"audit_auditor_names", id:prof.id, value:{username:user.username, lastName:nameVal}}); }
        else { await api("records.create",{collection:"audit_auditor_names", value:{username:user.username, lastName:nameVal}, idempotency_key:`auditor-${user.username}-${Date.now()}`}); }
      }catch{}
      await reloadRecords(); setSaveMsg("Saved. Statistics updated."); setSelectedCell(null);
    }catch(e:any){ setSaveMsg(`Could not save: ${e.message}`); } setBusy(false);
  }
  async function deleteScore(){
    if(!selectedCell) return;
    if(selectedCell.part==="2"){ const ex=findCompScore(selectedCell.wilayat,selectedCell.institution,selectedCell.period); if(!ex) return; setBusy(true); try{ await api("records.delete",{collection:"competency_scores", id:ex.id}); await reloadRecords(); setSelectedCell(null); setSaveMsg("Entry removed."); }catch(e:any){ setSaveMsg(String(e)); } setBusy(false); return; }
    const ex=findScore(selectedCell.wilayat,selectedCell.institution,selectedCell.period); if(!ex) return;
    setBusy(true); try{ await api("records.delete",{collection:"audit_scores", id:ex.id}); await reloadRecords(); setSelectedCell(null); setSaveMsg("Entry removed."); }catch(e:any){ setSaveMsg(String(e)); } setBusy(false);
  }
  async function createPlan(e:React.FormEvent){
    e.preventDefault(); setBusy(true); setSaveMsg("");
    try{
      for(const p of plans.filter(p=>p.topic===newPlan.topic && p.year===newPlan.year && p.active)){
        await api("records.replace",{collection:"audit_plans", id:p.id, value:{...p, frequency:"Monthly", periods:[...MONTHS], active:false}});
      }
      const value={topic:newPlan.topic, year:newPlan.year, frequency:"Monthly", periods:[...MONTHS], active:true};
      await api("records.create",{collection:"audit_plans", value, idempotency_key:`plan-${newPlan.topic}-${newPlan.year}-Monthly-${Date.now()}`});
      await reloadRecords(); setSaveMsg("Plan created and set as active for that topic and year."); setTopic(newPlan.topic);
    }catch(e:any){ setSaveMsg(`Could not create plan: ${e.message}`); } setBusy(false);
  }
  async function setActivePlan(p:Plan){
    setBusy(true); try{
      for(const x of plans.filter(q=>q.topic===p.topic && q.year===p.year)) await api("records.replace",{collection:"audit_plans", id:x.id, value:{...x, frequency:"Monthly", periods:[...MONTHS], active:x.id===p.id}});
      await reloadRecords(); setTopic(p.topic); setPlanId(p.id);
    }catch(e:any){ setSaveMsg(String(e)); } setBusy(false);
  }
  async function deletePlan(p:Plan){
    setBusy(true); try{ await api("records.delete",{collection:"audit_plans", id:p.id}); await reloadRecords(); setSaveMsg("Plan deleted. Its scores remain in records and are not shown without the plan."); }catch(e:any){ setSaveMsg(String(e)); } setBusy(false);
  }
  async function createCompPlan(e:React.FormEvent){
    e.preventDefault(); setBusy(true); setSaveMsg("");
    try{
      for(const p of compPlans.filter(p=>p.category===newCompPlan.category && p.year===newCompPlan.year && p.active)){
        await api("records.replace",{collection:"competency_plans", id:p.id, value:{...p, frequency:"Monthly", periods:[...MONTHS], active:false}});
      }
      const value={category:newCompPlan.category, year:newCompPlan.year, frequency:"Monthly", periods:[...MONTHS], procedures:newCompPlan.procedures, feedback:newCompPlan.feedback, active:true};
      await api("records.create",{collection:"competency_plans", value, idempotency_key:`compplan-${newCompPlan.category}-${newCompPlan.year}-Monthly-${Date.now()}`});
      await reloadRecords(); setSaveMsg("Part 2 plan created and set as active for that category and year."); setCategory(newCompPlan.category);
    }catch(e:any){ setSaveMsg(`Could not create Part 2 plan: ${e.message}`); } setBusy(false);
  }
  async function setActiveCompPlan(p:CompPlan){
    setBusy(true); try{
      for(const x of compPlans.filter(q=>q.category===p.category && q.year===p.year)) await api("records.replace",{collection:"competency_plans", id:x.id, value:{...x, frequency:"Monthly", periods:[...MONTHS], active:x.id===p.id}});
      await reloadRecords(); setCategory(p.category); setCompPlanId(p.id);
    }catch(e:any){ setSaveMsg(String(e)); } setBusy(false);
  }
  async function deleteCompPlan(p:CompPlan){
    setBusy(true); try{ await api("records.delete",{collection:"competency_plans", id:p.id}); await reloadRecords(); setSaveMsg("Part 2 plan deleted."); }catch(e:any){ setSaveMsg(String(e)); } setBusy(false);
  }
  function startEditCompPlan(p:CompPlan){
    setEditingCompPlanId(p.id);
    setEditingProcedures([...(p.procedures || MONTHS.map(()=>null))]);
    setEditingFeedback([...(p.feedback || MONTHS.map(()=>false))]);
    const hasScores = compScores.some(s=>s.planId===p.id);
    setEditWarn(hasScores ? "Warning: this plan already has scores. Changing a procedure changes the header for existing scores in that period." : "");
  }
  async function saveEditCompPlan(){
    const p = compPlans.find(x=>x.id===editingCompPlanId); if(!p) return;
    setBusy(true); try{
      await api("records.replace",{collection:"competency_plans", id:p.id, value:{...p, frequency:"Monthly", periods:[...MONTHS], procedures:editingProcedures, feedback:editingFeedback}});
      await reloadRecords(); setSaveMsg("Procedure assignments updated."); setEditingCompPlanId("");
    }catch(e:any){ setSaveMsg(`Could not update procedures: ${e.message}`); } setBusy(false);
  }
  async function loadDemo(){
    setBusy(true); setResult(null); setSaveMsg("");
    const rows:any[]=[];
    TOPICS.forEach((t)=>{ rows.push({type:"plan", value:{topic:t, year:2027, frequency:"Monthly", periods:[...MONTHS], active:true}, key:`demo-plan-${t}-2027`, topic:t}); });
    let saved=0, error:string|null=null;
    try{ for(const r of rows){ await createRow(r.value,"audit_plans",r.key); saved++; } }catch(e){ error=e instanceof Error?e.message:String(e); }
    let reloadError:string|null=null; try{ await reloadRecords(); }catch(e){ reloadError=e instanceof Error?e.message:String(e); }
    if(!error){
      const demoScores: any[]=[
        {wilayat:"Suhar", institution:"Suhar EHC", period:"Jan", score:"95", comment:"Crash cart checklist complete.", auditorName:"Salim Al Mamari", auditedAt:"2026-11-22T03:42:00.000Z"},
        {wilayat:"Suhar", institution:"Suhar EHC", period:"Feb", score:"98", comment:"Minor labelling fixed on site.", auditorName:"Salim Al Mamari", auditedAt:"2026-11-22T04:10:00.000Z"},
        {wilayat:"Suhar", institution:"Al Uwaynat HC", period:"Jan", score:"100", comment:"Excellent documentation.", auditorName:"Ahmed Al Shamsi", auditedAt:"2026-11-20T06:15:00.000Z"},
        {wilayat:"Saham", institution:"Saham Hospital", period:"Jan", score:"95.64", comment:"Good records; one form dated late.", auditorName:"Fatma Al Balushi", auditedAt:"2026-11-21T07:30:00.000Z"},
        {wilayat:"Saham", institution:"Saham Hospital", period:"Feb", score:"NA", comment:"No qualifying event in this period.", auditorName:"Fatma Al Balushi", auditedAt:"2026-11-21T07:35:00.000Z"},
        {wilayat:"Suwaiq", institution:"Suwaiq Hospital", period:"Jan", score:"88", comment:"Follow-up needed on two files.", auditorName:"Khalid Al Hinai", auditedAt:"2026-11-19T08:00:00.000Z"},
        {wilayat:"Khaboorah", institution:"Khaboorah EHC", period:"Jan", score:"92", comment:"Documentation improving.", auditorName:"Mariam Al Saidi", auditedAt:"2026-11-18T09:00:00.000Z"},
        {wilayat:"Shinas", institution:"Shinas EHC", period:"Jan", score:"82", comment:"Action plan requested.", auditorName:"Yousuf Al Maqbali", auditedAt:"2026-11-18T10:00:00.000Z"},
        {wilayat:"Liwa", institution:"Liwa HC", period:"Jan", score:"97", comment:"Complete and well organised.", auditorName:"Salim Al Mamari", auditedAt:"2026-11-22T05:20:00.000Z"},
      ];
      let currentPlans=plans; try{ const d:any=await api("records.list",{collection:"audit_plans"}); currentPlans=(d.records||[]).map((r:any)=>({id:r.id,...r.value})); }catch{}
      for(const t of TOPICS){
        const plan=currentPlans.find((p:any)=>p.topic===t && p.year===2027);
        if(!plan) continue;
        for(const s of demoScores){
          const key=`demo-score-${t}-${s.wilayat}-${s.institution}-${s.period}`;
          try{ await createRow({planId:plan.id, topic:t, year:2027, wilayat:s.wilayat, institution:s.institution, period:s.period, score:s.score, comment:s.comment, auditorName:s.auditorName, auditedAt:s.auditedAt, history:[]},"audit_scores",key); saved++; }catch(e){ error=e instanceof Error?e.message:String(e); break; }
        }
        if(error) break;
      }
      try{ await reloadRecords(); }catch(e){ reloadError=e instanceof Error?e.message:String(e); }
      setResult({saved, remaining: Math.max(0, (rows.length+36)-saved), error, reloadError});
    } else { setResult({saved, remaining: rows.length-saved, error, reloadError}); }
    setBusy(false);
  }
  async function loadDemoComp(){
    setBusy(true); setResult(null); setSaveMsg("");
    let saved=0; let error:string|null=null; let reloadError:string|null=null;
    const demoPlans = [
      {category:"General Nursing", year:2027, periods:[...MONTHS], procedures:["Neourological assessment","Neourological assessment","Neourological assessment","Urinary Catheterization (Male)","Urinary Catheterization (Male)",null,"IV Cannulation Insertion","IV Cannulation Insertion","IV Fluid Administration","Cast Application (Plaster)",null,null], feedback:[false,false,false,false,false,true,false,false,false,false,false,false], key:"demo-comp-plan-GN-2027"},
      {category:"Renal Medicine Center", year:2027, periods:[...MONTHS], procedures:["[RMC] Pre Dialysis assessment of Haemodialysis Patient","[RMC] Pre Dialysis assessment of Haemodialysis Patient","[RMC] Priming Dialysis Machine","[RMC] Priming Dialysis Machine",null,"[RMC] Commencing patient with Permanent access to HD Machine","[RMC] Commencing patient with Permanent access to HD Machine","[RMC] Post Dialysis assessment of Haemodialysis Patient","[RMC] Disconnecting patient with Permanent access from HD Machine",null,"[RMC] Management of hypotension during dialysis",null], feedback:[false,false,false,false,true,false,false,false,false,false,false,false], key:"demo-comp-plan-RMC-2027"},
      {category:"Labour Rooms", year:2027, periods:[...MONTHS], procedures:["[LR] Vaginal Examination","[LR] Vaginal Examination","[LR] 2nd Stage of Labour","[LR] 2nd Stage of Labour",null,"[LR] 3rd Stage of Labour","[LR] 3rd Stage of Labour","[LR] Episiotomy Incision, Repair","[LR] Breast Feeding Assessment","Checking FHS (fetal heart sound)",null,null], feedback:[false,false,false,false,true,false,false,false,false,false,false,false], key:"demo-comp-plan-LR-2027"},
    ];
    try{ for(const r of demoPlans){ await createRow({category:r.category, year:r.year, frequency:"Monthly", periods:r.periods, procedures:r.procedures, feedback:r.feedback, active:true},"competency_plans",r.key); saved++; } }catch(e){ error=e instanceof Error?e.message:String(e); }
    try{ await reloadRecords(); }catch(e){ reloadError=e instanceof Error?e.message:String(e); }
    if(!error){
      const demoScores: any[] = [
        {category:"General Nursing", wilayat:"Khaboorah", institution:"Khaboorah EHC", period:"Jan", score:"92", comment:"Good technique, documentation complete.", auditorName:"Salim Al Mamari", auditedAt:"2026-11-22T03:42:00.000Z"},
        {category:"General Nursing", wilayat:"Khaboorah", institution:"Khaboorah EHC", period:"Apr", score:"88", comment:"Follow-up on aseptic steps.", auditorName:"Mariam Al Saidi", auditedAt:"2026-11-20T06:00:00.000Z"},
        {category:"General Nursing", wilayat:"Suhar", institution:"Suhar EHC", period:"Jan", score:"95", comment:"Confident assessment.", auditorName:"Ahmed Al Shamsi", auditedAt:"2026-11-20T06:30:00.000Z"},
        {category:"General Nursing", wilayat:"Suhar", institution:"Suhar EHC", period:"Jul", score:"97", comment:"Excellent cannulation.", auditorName:"Ahmed Al Shamsi", auditedAt:"2026-11-21T05:00:00.000Z"},
        {category:"General Nursing", wilayat:"Saham", institution:"Saham Polyclinic", period:"Jan", score:"90", comment:"Satisfactory.", auditorName:"Fatma Al Balushi", auditedAt:"2026-11-21T07:00:00.000Z"},
        {category:"General Nursing", wilayat:"Suwaiq", institution:"Suwaiq EHC", period:"Sep", score:"86", comment:"Fluid chart needs review.", auditorName:"Khalid Al Hinai", auditedAt:"2026-11-19T08:30:00.000Z"},
        {category:"General Nursing", wilayat:"Liwa", institution:"Liwa HC", period:"Oct", score:"94", comment:"Good cast care.", auditorName:"Salim Al Mamari", auditedAt:"2026-11-22T05:00:00.000Z"},
        {category:"Renal Medicine Center", wilayat:"Suhar", institution:"Suhar RMC", period:"Jan", score:"96", comment:"Thorough pre-dialysis checks.", auditorName:"Salim Al Mamari", auditedAt:"2026-11-22T04:00:00.000Z"},
        {category:"Renal Medicine Center", wilayat:"Saham", institution:"Saham RMC", period:"Jan", score:"90", comment:"Good assessment.", auditorName:"Fatma Al Balushi", auditedAt:"2026-11-21T06:45:00.000Z"},
        {category:"Renal Medicine Center", wilayat:"Suwaiq", institution:"Suwaiq RMC", period:"Mar", score:"93", comment:"Priming well done.", auditorName:"Khalid Al Hinai", auditedAt:"2026-11-19T09:00:00.000Z"},
        {category:"Labour Rooms", wilayat:"Saham", institution:"Saham Hospital LR", period:"Jan", score:"94", comment:"Accurate examination.", auditorName:"Fatma Al Balushi", auditedAt:"2026-11-21T06:00:00.000Z"},
        {category:"Labour Rooms", wilayat:"Shinas", institution:"Shinas LR", period:"Mar", score:"89", comment:"Supportive second-stage care.", auditorName:"Yousuf Al Maqbali", auditedAt:"2026-11-18T10:30:00.000Z"},
        {category:"Labour Rooms", wilayat:"Suwaiq", institution:"Suwaiq Hospital LR", period:"Jun", score:"91", comment:"Good third-stage management.", auditorName:"Khalid Al Hinai", auditedAt:"2026-11-19T08:45:00.000Z"},
      ];
      let current: any[]=[]; try{ const d:any=await api("records.list",{collection:"competency_plans"}); current=(d.records||[]).map((r:any)=>({id:r.id,...r.value})); }catch{}
      const totalExpected = 3 + demoScores.length;
      for(const s of demoScores){
        const plan=current.find((p:any)=>p.category===s.category && p.year===2027);
        if(!plan) continue;
        const idx = MONTHS.indexOf(s.period);
        const proc = idx>=0 ? plan.procedures?.[idx] || "" : "";
        const key=`demo-compscore-${s.category}-${s.wilayat}-${s.institution}-${s.period}`;
        try{ await createRow({planId:plan.id, wilayat:s.wilayat, institution:s.institution, category:s.category, year:2027, period:s.period, procedure:proc, score:s.score, comment:s.comment, auditorName:s.auditorName, auditedAt:s.auditedAt, history:[]},"competency_scores",key); saved++; }catch(e){ error=e instanceof Error?e.message:String(e); break; }
      }
      try{ await reloadRecords(); }catch(e){ reloadError=e instanceof Error?e.message:String(e); }
      setResult({saved, remaining: Math.max(0, totalExpected-saved), error, reloadError});
      if(!error) setSaveMsg("Part 2 demo plans and sample scores loaded.");
    } else { setResult({saved, remaining: demoPlans.length-saved, error, reloadError}); }
    setBusy(false);
  }
  async function changePassword(e:React.FormEvent){
    e.preventDefault(); setPwdMsg("");
    if(pwdForm.username==="master" && user?.role!=="Master"){ setPwdMsg("Only Master can change Master's password."); return; }
    if(!pwdForm.password || pwdForm.password.length<4){ setPwdMsg("Choose a password of at least 4 characters."); return; }
    if(pwdForm.password!==pwdConfirm){ setPwdMsg("Passwords do not match. Please re-enter the confirmation."); return; }
    setBusy(true); try{
      const existing=overrides.find(o=>o.username===pwdForm.username);
      if(existing) await api("records.replace",{collection:"audit_passwords", id:existing.id, value:{username:pwdForm.username, password:pwdForm.password}});
      else await api("records.create",{collection:"audit_passwords", value:{username:pwdForm.username, password:pwdForm.password}, idempotency_key:`pwd-${pwdForm.username}-${Date.now()}`});
      await reloadRecords(); setPwdMsg(`Password updated for ${pwdForm.username}.`); setPwdForm({...pwdForm,password:""}); setPwdConfirm("");
    }catch(e:any){ setPwdMsg(`Could not update: ${e.message}`); } setBusy(false);
  }

  function toggleInstAssignment(a:string){ setInstForm(prev=> ({...prev, assignments: prev.assignments.includes(a) ? prev.assignments.filter(x=>x!==a) : [...prev.assignments, a]})); }
  function startEditInst(eff:EffInst){ setEditingInst(eff); setInstForm({wilayat:eff.wilayat, name:eff.institution, assignments:[...eff.assignments]}); setInstMsg(""); setPendingDeleteInst(null); }
  async function saveInstitution(e:React.FormEvent){
    e.preventDefault(); setInstMsg("");
    const cleanName=cleanInstitutionName(instForm.name, instForm.wilayat);
    if(!cleanName){ setInstMsg("Enter an institution name."); return; }
    if(instForm.assignments.length===0){ setInstMsg("Tick at least one assignment (Part 1 / Part 2 category)."); return; }
    const duplicate = effInstList.some(x=>{ if(editingInst && x.wilayat===editingInst.wilayat && x.institution.toLowerCase()===editingInst.institution.toLowerCase()) return false; return x.wilayat.toLowerCase()===instForm.wilayat.toLowerCase() && x.institution.toLowerCase()===cleanName.toLowerCase() && x.assignments.some(a=>instForm.assignments.includes(a)); });
    if(duplicate){ setInstMsg("An institution with that clean name already exists in this Wilayat for one of the selected assignments."); return; }
    setBusy(true);
    try{
      if(!editingInst){ await api("records.create",{collection:"audit_institutions", value:{kind:"add", wilayat:instForm.wilayat, name:cleanName, assignments:instForm.assignments}, idempotency_key:`inst-add-${instForm.wilayat}-${cleanName}-${Date.now()}`}); setInstMsg(`Institution “${cleanName}” added under ${instForm.wilayat}.`); }
      else if(editingInst.sourceKind==="add" && editingInst.sourceId){ await api("records.replace",{collection:"audit_institutions", id:editingInst.sourceId, value:{kind:"add", wilayat:instForm.wilayat, name:cleanName, assignments:instForm.assignments}}); setInstMsg(`Institution updated to “${cleanName}” (${instForm.wilayat}).`); }
      else if(editingInst.sourceKind==="edit" && editingInst.sourceId){ await api("records.replace",{collection:"audit_institutions", id:editingInst.sourceId, value:{kind:"edit", wilayat:instForm.wilayat, name:cleanName, assignments:instForm.assignments, originalWilayat:editingInst.originalWilayat||editingInst.wilayat, originalName:editingInst.originalName||editingInst.institution}}); setInstMsg(`Institution updated to “${cleanName}” (${instForm.wilayat}).`); }
      else { await api("records.create",{collection:"audit_institutions", value:{kind:"edit", wilayat:instForm.wilayat, name:cleanName, assignments:instForm.assignments, originalWilayat:editingInst.wilayat, originalName:editingInst.institution}, idempotency_key:`inst-edit-${editingInst.wilayat}-${editingInst.institution}-${Date.now()}`}); setInstMsg(`Institution updated to “${cleanName}” (${instForm.wilayat}).`); }
      await reloadRecords(); setEditingInst(null); setInstForm({wilayat:"Suhar", name:"", assignments:["Part 1"]});
    }catch(err:any){ setInstMsg(`Could not save institution: ${err.message}`); } setBusy(false);
  }
  async function confirmDeleteInstitution(){
    const target=pendingDeleteInst; if(!target) return;
    setBusy(true); setInstMsg("");
    try{
      const toDelete1 = scores.filter(s=>s.wilayat===target.wilayat && cleanInstitutionName(s.institution,target.wilayat).toLowerCase()===target.institution.toLowerCase());
      const toDelete2 = compScores.filter(s=>s.wilayat===target.wilayat && cleanInstitutionName(s.institution,target.wilayat).toLowerCase()===target.institution.toLowerCase());
      for(const s of toDelete1){ await api("records.delete",{collection:"audit_scores", id:s.id}); }
      for(const s of toDelete2){ await api("records.delete",{collection:"competency_scores", id:s.id}); }
      if(target.sourceKind==="add" && target.sourceId){ await api("records.delete",{collection:"audit_institutions", id:target.sourceId}); }
      else if(target.sourceKind==="edit" && target.sourceId){ await api("records.delete",{collection:"audit_institutions", id:target.sourceId}); await api("records.create",{collection:"audit_institutions", value:{kind:"delete", wilayat:target.originalWilayat||target.wilayat, name:target.originalName||target.institution, assignments:[], originalWilayat:target.originalWilayat||target.wilayat, originalName:target.originalName||target.institution}, idempotency_key:`inst-del-${target.originalWilayat||target.wilayat}-${target.originalName||target.institution}-${Date.now()}`}); }
      else { await api("records.create",{collection:"audit_institutions", value:{kind:"delete", wilayat:target.wilayat, name:target.institution, assignments:[], originalWilayat:target.wilayat, originalName:target.institution}, idempotency_key:`inst-del-${target.wilayat}-${target.institution}-${Date.now()}`}); }
      await reloadRecords(); setInstMsg(`Institution “${target.institution}” removed. Its scores and comments were also deleted.`); setPendingDeleteInst(null); if(editingInst && editingInst.wilayat===target.wilayat && editingInst.institution===target.institution) setEditingInst(null);
    }catch(err:any){ setInstMsg(`Could not remove institution: ${err.message}`); } setBusy(false);
  }
  function normalizeProcName(raw:string, tag:string){ const trimmed=raw.trim(); if(tag==="LR" || tag==="RMC"){ const base=stripProcedurePrefix(trimmed); return `[${tag}] ${base}`; } return trimmed; }
  function startEditProc(name:string){ const src=procSourceMap.get(name.toLowerCase())||{}; setEditingProc({name, sourceId:src.sourceId, sourceKind:src.sourceKind, originalName:src.originalName||name}); setProcForm({name, tag: procTag(name)==="LR" ? "LR" : procTag(name)==="RMC" ? "RMC" : "General"}); setProcMsg(""); setPendingDeleteProc(null); }
  async function saveProcedure(e:React.FormEvent){
    e.preventDefault(); setProcMsg("");
    const finalName=normalizeProcName(procForm.name, procForm.tag);
    if(!finalName || !stripProcedurePrefix(finalName)){ setProcMsg("Enter a procedure name."); return; }
    const duplicate = effectiveProcedures.some(p=>{ if(editingProc && p.toLowerCase()===editingProc.name.toLowerCase()) return false; return p.toLowerCase()===finalName.toLowerCase(); });
    if(duplicate){ setProcMsg("A procedure with that name already exists (case-insensitive)."); return; }
    setBusy(true);
    try{
      if(!editingProc){ await api("records.create",{collection:"audit_procedures", value:{kind:"add", name:finalName}, idempotency_key:`proc-add-${finalName}-${Date.now()}`}); setProcMsg(`Procedure “${finalName}” added.`); }
      else if(editingProc.sourceKind==="add" && editingProc.sourceId){ await api("records.replace",{collection:"audit_procedures", id:editingProc.sourceId, value:{kind:"add", name:finalName}}); setProcMsg(`Procedure updated to “${finalName}”.`); }
      else if(editingProc.sourceKind==="edit" && editingProc.sourceId){ await api("records.replace",{collection:"audit_procedures", id:editingProc.sourceId, value:{kind:"edit", name:finalName, originalName:editingProc.originalName||editingProc.name}}); setProcMsg(`Procedure updated to “${finalName}”.`); }
      else { await api("records.create",{collection:"audit_procedures", value:{kind:"edit", name:finalName, originalName:editingProc.name}, idempotency_key:`proc-edit-${editingProc.name}-${Date.now()}`}); setProcMsg(`Procedure updated to “${finalName}”.`); }
      await reloadRecords(); setEditingProc(null); setProcForm({name:"", tag:"General"});
    }catch(err:any){ setProcMsg(`Could not save procedure: ${err.message}`); } setBusy(false);
  }
  async function confirmDeleteProcedure(){
    const target=pendingDeleteProc; if(!target) return;
    setBusy(true); setProcMsg("");
    try{
      if(target.sourceKind==="add" && target.sourceId){ await api("records.delete",{collection:"audit_procedures", id:target.sourceId}); }
      else if(target.sourceKind==="edit" && target.sourceId){ await api("records.delete",{collection:"audit_procedures", id:target.sourceId}); await api("records.create",{collection:"audit_procedures", value:{kind:"delete", name:target.originalName||target.name, originalName:target.originalName||target.name}, idempotency_key:`proc-del-${target.originalName||target.name}-${Date.now()}`}); }
      else { await api("records.create",{collection:"audit_procedures", value:{kind:"delete", name:target.name, originalName:target.name}, idempotency_key:`proc-del-${target.name}-${Date.now()}`}); }
      await reloadRecords(); setProcMsg(`Procedure “${target.name}” removed.`); setPendingDeleteProc(null); if(editingProc && editingProc.name===target.name) setEditingProc(null);
    }catch(err:any){ setProcMsg(`Could not remove procedure: ${err.message}`); } setBusy(false);
  }
  async function exportCompPlanToWord(plan:CompPlan){
    const esc=(s:string)=> String(s||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
    const displayCategory = plan.category === "Renal Medicine Center" ? "RMC" : plan.category;
    const title = `${displayCategory} Competency Procedures plan ${plan.year}`;
    const fileName = `${displayCategory.replace(/[^A-Za-z0-9]+/g,"_")}_Competency_Procedures_plan_${plan.year}.doc`;
    type ExportRow = { label:string; feedback:boolean; months:number[] };
    const rows: ExportRow[] = []; let i = 0;
    while(i < 12){
      if(plan.feedback?.[i]){ let j = i; while(j + 1 < 12 && plan.feedback?.[j + 1]) j++; rows.push({ label:"Obtaining Feedback", feedback:true, months: Array.from({length: j - i + 1}, (_,k)=> i + k) }); i = j + 1; continue; }
      const proc = plan.procedures?.[i]; if(!proc){ i++; continue; } let j = i; while(j + 1 < 12 && !plan.feedback?.[j + 1] && plan.procedures?.[j + 1] === proc) j++; rows.push({ label: displayProcedure(proc), feedback:false, months: Array.from({length: j - i + 1}, (_,k)=> i + k) }); i = j + 1;
    }
    let logoHtml = `<p style="font-size:13pt;font-weight:bold;margin:0 0 4pt;text-align:center;">Ministry of Health</p>`;
    try{
      let dataUrl: string | null = null;
      if(typeof mohLogo === "string" && mohLogo.startsWith("data:")){ dataUrl = mohLogo; }
      else if(typeof mohLogo === "string" && mohLogo){ const res = await fetch(mohLogo); if(res.ok){ const blob = await res.blob(); dataUrl = await new Promise<string>((resolve, reject)=>{ const reader = new FileReader(); reader.onload = ()=> resolve(String(reader.result)); reader.onerror = ()=> reject(new Error("Could not read logo")); reader.readAsDataURL(blob); }); } }
      if(dataUrl) logoHtml = `<p style="text-align:center;margin:0 0 6pt;"><img src="${dataUrl}" alt="Ministry of Health logo" style="height:72px;width:auto;" /></p>`;
    }catch{}
    const monthHeaders = MONTHS.map(m=>`<th style="width:6.5%;">${m}</th>`).join("");
    const tableRows = rows.map((row, idx)=>{
      const cells = MONTHS.map((_, mi)=>{
        if(!row.months.includes(mi)) return `<td>&nbsp;</td>`;
        if(row.feedback) return `<td style="background:#ede9fe;color:#4c1d95;font-size:8pt;font-weight:bold;text-align:center;">Obtaining Feedback</td>`;
        return `<td style="background:#c9ead9;">&nbsp;</td>`;
      }).join("");
      return `<tr><td style="text-align:center;">${idx + 1}</td><td style="text-align:left;">${esc(row.label)}</td>${cells}</tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${esc(title)}</title><style>@page WordSection1{size:29.7cm 21cm;mso-page-orientation:landscape;margin:1cm 1cm 1cm 1cm;} div.WordSection1{page:WordSection1;} body{font-family:Calibri,Arial,sans-serif;font-size:10pt;color:#102a2c;} p{margin:4pt 0;} table{border-collapse:collapse;width:100%;font-size:9pt;} th,td{border:1pt solid #7a8a88;padding:4pt 5pt;text-align:center;vertical-align:middle;} th{background:#0d6e6b;color:#ffffff;font-weight:bold;} thead{display:table-header-group;} tr{page-break-inside:avoid;}</style></head><body><div class="WordSection1"><div style="text-align:center;">${logoHtml}<p style="font-size:13pt;font-weight:bold;margin:2pt 0;">North Batinah Governorate</p><p style="font-size:13pt;font-weight:bold;margin:2pt 0;">Nursing Service Department</p><p style="font-size:15pt;font-weight:bold;margin:4pt 0 10pt;">${esc(title)}</p></div><table><thead><tr><th style="width:5%;">Serial Number</th><th style="width:22%;text-align:left;">Planned Procedures</th>${monthHeaders}</tr></thead><tbody>${tableRows}</tbody></table></div></body></html>`;
    const blob = new Blob(["\ufeff", html], {type:"application/msword"}); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = fileName; a.click(); URL.revokeObjectURL(url);
  }
  function exportCSV(){
    if(part==="2"){
      if(!activeCompPlan) return;
      const simpleHeader = ["Wilayat","Institution","Category","Number of Audits",...activeCompPlan.periods.map((p,i)=>`${p} | ${activeCompPlan.feedback?.[i]?"Obtaining Feedback":`Procedure: ${displayProcedure(activeCompPlan.procedures?.[i])}`} | Score`),...activeCompPlan.periods.map((p,i)=>`${p} | Comment`),...activeCompPlan.periods.map((p,i)=>`${p} | Audited by`),...activeCompPlan.periods.map((p,i)=>`${p} | Added at Muscat`),...activeCompPlan.periods.map((p,i)=>`${p} | Added at ISO`)];
      const simple: string[][] = [simpleHeader];
      visibleCompInstitutions.forEach(v=>{
        const blockMap=blockScoresFor(v.wilayat,v.institution);
        const count = blockMap.size;
        const scoreCells = activeCompPlan.periods.map((p,i)=>{
          if(activeCompPlan.feedback?.[i]) return "Feedback"; if(!activeCompPlan.procedures?.[i]) return "";
          const block=blockForMonth(activeCompPlan,i); if(!block) return ""; const bs=blockMap.get(`${block.start}-${block.end}`); if(!bs) return ""; if(bs.period===p) return bs.score; return `Covered — score in ${bs.period}`;
        });
        const commentCells = activeCompPlan.periods.map((p,i)=>{ if(activeCompPlan.feedback?.[i]) return "Feedback"; const block=blockForMonth(activeCompPlan,i); if(!block) return ""; const bs=blockMap.get(`${block.start}-${block.end}`); if(!bs) return ""; return bs.period===p ? (bs.comment||"") : ""; });
        const auditorCells = activeCompPlan.periods.map((p,i)=>{ if(activeCompPlan.feedback?.[i]) return ""; const block=blockForMonth(activeCompPlan,i); if(!block) return ""; const bs=blockMap.get(`${block.start}-${block.end}`); if(!bs) return ""; return bs.period===p ? (bs.auditorName||"") : ""; });
        const muscatCells = activeCompPlan.periods.map((p,i)=>{ if(activeCompPlan.feedback?.[i]) return ""; const block=blockForMonth(activeCompPlan,i); if(!block) return ""; const bs=blockMap.get(`${block.start}-${block.end}`); if(!bs) return ""; return bs.period===p ? (bs.auditedAt ? formatMuscat(bs.auditedAt) : "") : ""; });
        const isoCells = activeCompPlan.periods.map((p,i)=>{ if(activeCompPlan.feedback?.[i]) return ""; const block=blockForMonth(activeCompPlan,i); if(!block) return ""; const bs=blockMap.get(`${block.start}-${block.end}`); if(!bs) return ""; return bs.period===p ? (bs.auditedAt||"") : ""; });
        simple.push([v.wilayat,labelFor(v.wilayat,v.institution),category,String(count),...scoreCells,...commentCells,...auditorCells,...muscatCells,...isoCells]);
      });
      const csv=simple.map(r=>r.map(c=>`"${String(c).replaceAll('"','""')}"`).join(",")).join("\n");
      const blob=new Blob([csv],{type:"text/csv"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`competency-${activeCompPlan.category}-${activeCompPlan.year}.csv`; a.click(); URL.revokeObjectURL(url); return;
    }
    if(!activePlan) return;
    const rowsHeader = ["Wilayat","Institution","Number of Audits","Average (%)",...activePlan.periods.map(p=>`${p} Score`),...activePlan.periods.map(p=>`${p} Comment`),...activePlan.periods.map(p=>`${p} Audited by`),...activePlan.periods.map(p=>`${p} Added at Muscat DD-MM-YYYY HH:mm`),...activePlan.periods.map(p=>`${p} Added at ISO`)];
    const rows:string[][]=[rowsHeader];
    visibleInstitutions.forEach(v=>{
      const cells=activePlan.periods.map(p=>findScore(v.wilayat,v.institution,p));
      const nums=cells.filter(c=>c && c.score!=="NA").map(c=>parseFloat(c!.score)).filter(n=>!isNaN(n));
      rows.push([v.wilayat,labelFor(v.wilayat,v.institution),String(cells.filter(Boolean).length), nums.length?(nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(2):"", ...cells.map(c=>c?c.score:""), ...cells.map(c=>c?c.comment:""), ...cells.map(c=>c?.auditorName||""), ...cells.map(c=>c?.auditedAt?formatMuscat(c.auditedAt):""), ...cells.map(c=>c?.auditedAt||""),]);
    });
    const csv=rows.map(r=>r.map(c=>`"${String(c).replaceAll('"','""')}"`).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`audit-${activePlan.topic}-${activePlan.year}.csv`; a.click(); URL.revokeObjectURL(url);
  }
  function fileDateStampForName(){
    try{
      const fmt = new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Muscat', day:'2-digit', month:'short', year:'numeric'});
      const parts = fmt.formatToParts(new Date());
      const day = parts.find(p=>p.type==='day')?.value || "01";
      const monRaw = parts.find(p=>p.type==='month')?.value || "Jan";
      const year = parts.find(p=>p.type==='year')?.value || "2027";
      const mon = monRaw.replace(/[^A-Za-z]/g,'').slice(0,3);
      return `${day}${mon}${year}`;
    }catch{
      const d=new Date();
      const m=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()];
      return `${String(d.getDate()).padStart(2,'0')}${m}${d.getFullYear()}`;
    }
  }
  function sanitizeForFilename(s:string){
    const cleaned = s.replace(/[^A-Za-z0-9]/g,'');
    return cleaned || "All";
  }
  function exportPart1StatsExcel(){
    const nowIso=new Date().toISOString();
    const nowMuscat=formatMuscat(nowIso);
    const dateStamp=fileDateStampForName();
    const filterNote=`Topic=${topic} | Year=${activePlan?.year||"All"} | Wilayat=${wilayatFilter} | Search=${search||"None"} | Generated ${nowMuscat} Asia/Muscat`;
    const filteredScores = scores.filter(s=>{
      if(user?.role==="Wilayat" && s.wilayat!==user.wilayat) return false;
      if(isAdmin && wilayatFilter!=="All" && s.wilayat!==wilayatFilter) return false;
      if(search && !(`${s.wilayat} ${labelFor(s.wilayat,s.institution)}`.toLowerCase().includes(search.toLowerCase()))) return false;
      if(activePlan){ return s.planId===activePlan.id; }
      return s.topic===topic;
    });
    // Required columns: Wilayat, Institution, Topic, Year, Month, Score, Audited by, Added at (Asia/Muscat), Comment, Status
    const detailedHeader=["Wilayat","Institution","Topic","Year","Month","Score","Audited by","Added at (Asia/Muscat)","Comment","Status"];
    const detailedRows:string[][]=[["Part 1 Statistics",filterNote],[""],detailedHeader];
    // Sort by wilayat order, institution, month index
    const sorted = [...filteredScores].sort((a,b)=>{
      const wi = WILAYAT_ORDER.indexOf(a.wilayat)-WILAYAT_ORDER.indexOf(b.wilayat);
      if(wi!==0) return wi;
      const ii = a.institution.localeCompare(b.institution);
      if(ii!==0) return ii;
      return (MONTH_INDEX[a.period]??0)-(MONTH_INDEX[b.period]??0);
    });
    sorted.forEach(s=>{
      const status = s.score==="NA" ? "NA" : s.score ? "Submitted" : "Missing";
      detailedRows.push([
        s.wilayat,
        labelFor(s.wilayat,s.institution),
        s.topic,
        String(s.year),
        s.period,
        s.score,
        s.auditorName||"",
        s.auditedAt?formatMuscat(s.auditedAt):"",
        s.comment||"",
        status
      ]);
    });
    if(detailedRows.length===3){ detailedRows.push(["No data for current filters","","","","","","","","",""]); }
    const summaryHeader=["Wilayat","Institutions count","Audits count","Average","Completion %"];
    const summaryRows:string[][]=[["Summary by Wilayat - Part 1",filterNote],[""],summaryHeader];
    const wilayatsForSummary = user?.role==="Wilayat" ? [user.wilayat] : (wilayatFilter==="All" ? [...WILAYAT_ORDER] : [wilayatFilter]);
    wilayatsForSummary.forEach(w=>{
      const instCount = (effPart1[w]||[]).filter(inst=>{
        if(search && !(`${w} ${labelFor(w,inst)}`.toLowerCase().includes(search.toLowerCase()))) return false;
        return true;
      }).length;
      const rel = filteredScores.filter(s=>s.wilayat===w);
      const nums = rel.filter(s=>s.score!=="NA" && s.score!=="").map(s=>parseFloat(s.score)).filter(n=>!isNaN(n));
      const avg = nums.length? (nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(2) : "";
      const expected = instCount*12;
      const completion = expected? ((rel.length/expected)*100).toFixed(1) : "0";
      summaryRows.push([w,String(instCount),String(rel.length),avg,completion]);
    });
    const yearPart = activePlan?.year ? String(activePlan.year) : "All";
    const topicSafe = sanitizeForFilename(activePlan?.topic || topic);
    const wilayatPart = (user?.role==="Wilayat" ? `_${user.wilayat}` : (wilayatFilter!=="All" ? `_${wilayatFilter}` : ""));
    const fname = `Part1_Stats_${yearPart}_${topicSafe}${wilayatPart}_${dateStamp}.xlsx`;
    downloadXLSX(fname, [{name:"Detailed Scores", rows:detailedRows},{name:"Summary by Wilayat", rows:summaryRows}]);
  }
  function exportPart2StatsExcel(){
    const nowIso=new Date().toISOString();
    const nowMuscat=formatMuscat(nowIso);
    const dateStamp=fileDateStampForName();
    const filterNote=`Category=${category} | Year=${activeCompPlan?.year||"All"} | Wilayat=${wilayatFilter} | Search=${search||"None"} | Generated ${nowMuscat} Asia/Muscat`;
    const blocks = activeCompPlan ? getBlocks(activeCompPlan) : [];
    const planForExport = activeCompPlan;
    // Required: Category, Wilayat, Institution, Procedure, Year, Block (Jan-Mar), Month, Score, Audited by, Added at, Status
    // Plus Comment for usefulness? Spec says without comment, but we include as per Part1 we keep Comment optional — here we follow spec exactly but add Comment before Status for completeness is allowed? We follow spec: include Comment as extra column if we want? We keep spec columns exactly + Comment optional is not required. We'll include Comment as separate column after Added at? To satisfy spec we produce exact columns plus include Comment in same file as extra? Better follow spec: 11 cols as listed. For backward compatibility include Comment in second sheet note.
    const detailedHeader=["Category","Wilayat","Institution","Procedure","Year","Block","Month","Score","Audited by","Added at (Asia/Muscat)","Status"];
    const detailedRows:string[][]=[["Part 2 Statistics",filterNote],[""],detailedHeader];
    if(planForExport){
      const sortedInst = [...visibleCompInstitutions].sort((a,b)=> WILAYAT_ORDER.indexOf(a.wilayat)-WILAYAT_ORDER.indexOf(b.wilayat) || a.institution.localeCompare(b.institution));
      sortedInst.forEach(v=>{
        blocks.forEach(b=>{
          const s=findBlockScore(v.wilayat,v.institution,b);
          if(s){
            const status = s.score==="NA" ? "NA" : "Submitted";
            detailedRows.push([
              category,
              v.wilayat,
              labelFor(v.wilayat,v.institution),
              b.procedure,
              String(planForExport.year),
              blockLabel(b),
              s.period,
              s.score,
              s.auditorName||"",
              s.auditedAt?formatMuscat(s.auditedAt):"",
              status
            ]);
          } else {
            detailedRows.push([
              category,
              v.wilayat,
              labelFor(v.wilayat,v.institution),
              b.procedure,
              String(planForExport.year),
              blockLabel(b),
              MONTHS[b.start],
              "",
              "",
              "",
              "Missing"
            ]);
          }
        });
      });
    } else {
      const filtered = compScores.filter(s=>{
        if(user?.role==="Wilayat" && s.wilayat!==user.wilayat) return false;
        if(isAdmin && wilayatFilter!=="All" && s.wilayat!==wilayatFilter) return false;
        if(search && !(`${s.wilayat} ${labelFor(s.wilayat,s.institution)}`.toLowerCase().includes(search.toLowerCase()))) return false;
        if(s.category!==category) return false;
        return true;
      }).sort((a,b)=> WILAYAT_ORDER.indexOf(a.wilayat)-WILAYAT_ORDER.indexOf(b.wilayat) || a.institution.localeCompare(b.institution) || (MONTH_INDEX[a.period]??0)-(MONTH_INDEX[b.period]??0));
      filtered.forEach(s=>{
        detailedRows.push([
          s.category||category,
          s.wilayat,
          labelFor(s.wilayat,s.institution),
          s.procedure||"",
          String(s.year),
          s.period,
          s.period,
          s.score,
          s.auditorName||"",
          s.auditedAt?formatMuscat(s.auditedAt):"",
          s.score ? "Submitted" : "Missing"
        ]);
      });
      if(filtered.length===0) detailedRows.push(["No data for current filters","","","","","","","","","",""]);
    }
    if(detailedRows.length===3) detailedRows.push(["No data for current filters","","","","","","","","","",""]);
    const summaryHeader=["Category","Wilayat","Institutions count","Audits (blocks)","Expected blocks","Completion %","Average"];
    const summaryRows:string[][]=[["Summary by Category/Wilayat - Part 2",filterNote],[""],summaryHeader];
    const wilayatsForSummary = user?.role==="Wilayat" ? [user.wilayat] : (wilayatFilter==="All" ? [...WILAYAT_ORDER] : [wilayatFilter]);
    wilayatsForSummary.forEach(w=>{
      const insts = (effComp[category]||[]).filter(v=> v.wilayat===w && (!search || `${v.wilayat} ${labelFor(v.wilayat,v.institution)}`.toLowerCase().includes(search.toLowerCase())));
      const instCount=insts.length;
      const expected = planForExport ? instCount*blocks.length : instCount;
      let audits=0; const nums:number[]=[];
      insts.forEach(v=>{
        if(planForExport){
          blocks.forEach(b=>{ const s=findBlockScore(v.wilayat,v.institution,b); if(s){ audits++; if(s.score!=="NA"){ const n=parseFloat(s.score); if(!isNaN(n)) nums.push(n); } } });
        } else {
          const rel = compScores.filter(s=>s.wilayat===v.wilayat && s.institution===v.institution && s.category===category);
          audits+=rel.length;
          rel.forEach(r=>{ if(r.score!=="NA"){ const n=parseFloat(r.score); if(!isNaN(n)) nums.push(n); } });
        }
      });
      const avg = nums.length? (nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(2) : "";
      const completion = expected? ((audits/expected)*100).toFixed(1) : "0";
      summaryRows.push([category,w,String(instCount),String(audits),String(expected),completion,avg]);
    });
    const yearPart = activeCompPlan?.year ? String(activeCompPlan.year) : "All";
    const catSafe = sanitizeForFilename(activeCompPlan?.category || category);
    const wilayatPart = (user?.role==="Wilayat" ? `_${user.wilayat}` : (wilayatFilter!=="All" ? `_${wilayatFilter}` : ""));
    const fname = `Part2_Stats_${yearPart}_${catSafe}${wilayatPart}_${dateStamp}.xlsx`;
    downloadXLSX(fname, [{name:"Detailed Scores", rows:detailedRows},{name:"Summary by Category", rows:summaryRows}]);
  }
  function openCell(v:{wilayat:string;institution:string}, period:string, partOverride?:string, catOverride?:string){
    if(!user) return;
    if(partOverride==="2"){
      const ex=findCompScore(v.wilayat,v.institution,period);
      setSelectedCell({wilayat:v.wilayat,institution:v.institution,period,part:"2",category:catOverride||category});
      setScoreInput(ex?ex.score:""); setCommentInput(ex?ex.comment:""); setAuditorNameInput(ex?.auditorName || getLastName(user.username) || ""); setSaveMsg(""); return;
    }
    const ex=findScore(v.wilayat,v.institution,period);
    setSelectedCell({wilayat:v.wilayat,institution:v.institution,period,part:"1"});
    setScoreInput(ex?ex.score:""); setCommentInput(ex?ex.comment:""); setAuditorNameInput(ex?.auditorName || getLastName(user!.username) || ""); setSaveMsg("");
  }

  const isMaster=user?.role==="Master";
  const isAdminRole=user?.role==="Admin";
  const isAdmin=isMaster || isAdminRole;
  const canAccessControl=isMaster;
  const headerRoleText = isMaster ? "Master" : isAdminRole ? "Admin — Nursing Service Department" : `${user?.label} — Wilayat`;
  const tabs = ["Dashboard","Audit Grid","Comments","Guide", ...(isAdmin?["Plans","Control Panel"]:[])];

  const filteredP1Comments = useMemo(()=>{
    let list = scores.filter(s=> (s.comment || s.auditorName) && (isAdmin || s.wilayat===user?.wilayat) && (!activePlan || s.planId===activePlan.id));
    if(p1AuditorFilter.trim()){ const q=p1AuditorFilter.trim().toLowerCase(); list = list.filter(s=> (s.auditorName||"").toLowerCase().includes(q)); }
    list = [...list].sort((a,b)=>{ const da = a.auditedAt ? new Date(a.auditedAt).getTime() : 0; const db = b.auditedAt ? new Date(b.auditedAt).getTime() : 0; return p1SortDesc ? db-da : da-db; });
    return list;
  },[scores, isAdmin, user, activePlan, p1AuditorFilter, p1SortDesc]);

  const filteredP2Comments = useMemo(()=>{
    const deduped: CompScore[]=[]; const seen=new Set<string>();
    compScores.filter(s=> (s.comment || s.auditorName) && (isAdmin || s.wilayat===user?.wilayat) && (!activeCompPlan || s.planId===activeCompPlan.id)).forEach(s=>{
      const block = activeCompPlan ? blockForMonth(activeCompPlan, MONTH_INDEX[s.period]??-1) : undefined;
      if(block){ const key=`${s.planId}||${s.wilayat}||${s.institution}||${block.start}-${block.end}`; if(seen.has(key)) return; seen.add(key); const latest=findBlockScore(s.wilayat,s.institution,block); if(latest) deduped.push(latest); } else { deduped.push(s); }
    });
    let list=deduped; if(p2AuditorFilter.trim()){ const q=p2AuditorFilter.trim().toLowerCase(); list = list.filter(s=> (s.auditorName||"").toLowerCase().includes(q)); }
    list = [...list].sort((a,b)=>{ const da = a.auditedAt ? new Date(a.auditedAt).getTime() : 0; const db = b.auditedAt ? new Date(b.auditedAt).getTime() : 0; return p2SortDesc ? db-da : da-db; });
    return list;
  },[compScores, isAdmin, user, activeCompPlan, p2AuditorFilter, p2SortDesc, compPlanScores]);

  function renderNotStarted(list:{wilayat:string;institution:string}[]){
    if(list.length===0) return <p className="mt-2 text-sm text-[var(--muted)]">Every visible institution has at least one submitted cell in this plan.</p>;
    return <div className="mt-3 space-y-4">{WILAYAT_ORDER.map(w=>{
      const items=list.filter(v=>v.wilayat===w); if(items.length===0) return null; const open=expandedWilayats.includes(w);
      return <div key={w}><button type="button" onClick={()=>toggleWilayat(w)} aria-expanded={open} className="flex w-full items-center justify-between rounded-lg bg-[var(--surface2)] px-3 py-3 text-left font-extrabold"><span>{w} Wilayat — {items.length}</span><span aria-hidden="true">{open?"−":"+"}</span></button>{open && <ul className="mt-1 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">{items.map(v=><li key={v.wilayat+v.institution} className="rounded-lg bg-[var(--surface2)] px-3 py-2 text-sm font-semibold [overflow-wrap:anywhere]">{labelFor(v.wilayat,v.institution)}</li>)}</ul>}</div>;
    })}</div>;
  }
  function renderCompNotStarted(list:CompMissing[]){
    if(list.length===0) return <p className="mt-2 text-sm text-[var(--muted)]">Every visible procedure block has a score.</p>;
    return <div className="mt-3 space-y-4">{WILAYAT_ORDER.map(w=>{
      const items=list.filter(v=>v.wilayat===w); if(items.length===0) return null; const open=expandedWilayats.includes(w);
      return <div key={w}><button type="button" onClick={()=>toggleWilayat(w)} aria-expanded={open} className="flex w-full items-center justify-between rounded-lg bg-[var(--surface2)] px-3 py-3 text-left font-extrabold"><span>{w} Wilayat — {items.length} missing blocks</span><span aria-hidden="true">{open?"−":"+"}</span></button>{open && <ul className="mt-1 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">{items.map((v,idx)=><li key={v.wilayat+v.institution+v.range+v.procedure+idx} className="rounded-lg bg-[var(--surface2)] px-3 py-2 text-sm font-semibold [overflow-wrap:anywhere]"><span className="block">{labelFor(v.wilayat,v.institution)}</span><span className="block text-xs font-normal text-[var(--muted)]">{v.procedure} — {v.range}</span></li>)}</ul>}</div>;
    })}</div>;
  }
  const filteredProceduresForControl = useMemo(()=>{
    return effectiveProcedures.filter(p=>{
      if(procFilterTag!=="All" && procTag(p)!==procFilterTag) return false;
      if(procSearch && !p.toLowerCase().includes(procSearch.trim().toLowerCase())) return false;
      return true;
    }).sort((a,b)=> procTag(a).localeCompare(procTag(b)) || a.localeCompare(b));
  },[effectiveProcedures, procFilterTag, procSearch]);

  const part1Total = Object.values(effPart1).reduce((a,b)=>a+b.length,0);
  const part2Totals = CATEGORIES.map(c=> (effComp[c]||[]).length);
  const selectedBlock = selectedCell?.part==="2" && activeCompPlan ? blockForMonth(activeCompPlan, MONTH_INDEX[selectedCell.period]??-1) : undefined;
  const selectedBlockScore = selectedCell?.part==="2" && selectedBlock ? findBlockScore(selectedCell.wilayat, selectedCell.institution, selectedBlock) : undefined;
  const selectedBlockOtherScore = selectedBlockScore && selectedBlockScore.period!==selectedCell?.period ? selectedBlockScore : undefined;
  const compHeaderSegments = useMemo(()=>{
    if(!activeCompPlan) return [] as {type:"block"|"feedback"|"skipped"; start:number; end:number; procedure?:string}[];
    const segs: {type:"block"|"feedback"|"skipped"; start:number; end:number; procedure?:string}[]=[];
    let i=0;
    while(i<12){
      if(activeCompPlan.feedback?.[i]){ segs.push({type:"feedback", start:i, end:i}); i++; continue; }
      if(!activeCompPlan.procedures?.[i]){ segs.push({type:"skipped", start:i, end:i}); i++; continue; }
      const b=blockForMonth(activeCompPlan,i)!; segs.push({type:"block", start:b.start, end:b.end, procedure:b.procedure}); i=b.end+1;
    }
    return segs;
  },[activeCompPlan]);
  const compPlanSummary = (p:CompPlan)=> `${p.year} • Monthly • 12 months • ${feedbackCount(p)} Feedback month${feedbackCount(p)===1?"":"s"} • ${getBlocks(p).length} procedure blocks`;

  // Detect shared vs local preview for footer indicator — now aware of Supabase vs records API
  const dbMode = useMemo(()=>{
    try {
      // If Supabase env vars are present, show Supabase mode
      if (isSupabaseConfigured) return getDataSourceLabel();
      // Fallback to existing logic for preview/records API
      if(typeof window==="undefined") return getDataSourceLabel();
      const prot = window.location.protocol;
      if(prot==="https:" || prot==="http:") return getDataSourceLabel();
      return getDataSourceLabel();
    } catch {
      return "Shared Database • Live";
    }
  },[]);

  // ---- UNMISSABLE Refresh button styles ----
  const RefreshBig = (
    <button
      type="button"
      onClick={()=>manualRefreshRef.current()}
      disabled={refreshing}
      title="Tap to refresh scores from database"
      aria-label="Refresh scores from database"
      className="flex min-h-[44px] items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-[var(--teal)] shadow-[0_4px_14px_rgba(0,0,0,.25)] border border-white hover:bg-white/90 active:scale-[0.98] disabled:opacity-60"
      style={{minHeight:44}}
    >
      <RefreshCw size={18} className={refreshing?"animate-spin":""}/>⟳ Refresh
    </button>
  );

  return <div data-safe-area-inset-root style={{boxSizing:"border-box", paddingTop:"var(--safe-area-inset-top)", minHeight:"100vh", background:"var(--bg)"}} className="overflow-x-clip">
    {!user ? <>
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
              <div className="mt-6 text-sm text-white/85"><strong>Wilayats:</strong> {WILAYAT_ORDER.map(w=>`${w} (${(effPart1[w]||[]).length})`).join(" · ")}</div>
              <div className="mt-4 rounded-xl bg-white/10 p-3 text-sm"><strong>Part 2 — Competency Procedures:</strong> General Nursing ({part2Totals[0]}) · Renal Medicine Center ({part2Totals[1]}) · Labour Rooms ({part2Totals[2]}). Same logins, separate plans and scores.</div>
              <p className="mt-auto pt-6 text-center text-sm font-bold text-white">Brought to you by: Juma Al Marzouqi [Saham Hospital]</p>
              <p className="mt-3 text-center text-xs text-white/70">{dbMode}</p>
            </div>
            <div className="p-5 sm:p-7">
              <h2 className="text-xl font-extrabold">Sign in</h2><p className="text-sm text-[var(--muted)]">Choose a demo account, or type a username and password.</p>
              {security.locked && <div className="mt-4 rounded-xl border-2 border-red-600 bg-[var(--red)] p-3 text-sm font-bold">System locked by Master. Contact Nursing Service Department. Only Master Unlock below can sign in.</div>}
              {security.accessCodeEnabled && !security.locked && <div className="mt-4 rounded-xl bg-[var(--amber)] p-3 text-sm font-semibold">Directorate Access Code is required on this login. Ask Nursing Service Department for the current code — it is not posted with the link.</div>}
              <form onSubmit={login} className="mt-4 space-y-3"><label className="block text-sm font-bold">Username<input value={username} onChange={e=>setUsername(e.target.value)} className="mt-1 w-full" autoComplete="username"/></label><label className="block text-sm font-bold">Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full" autoComplete="current-password"/></label>{security.locked && <label className="block text-sm font-bold">Recovery Code <span className="text-red-600">* Required for Master Unlock</span><input type="password" value={recoveryInput} onChange={e=>setRecoveryInput(e.target.value)} className="mt-1 w-full" placeholder="Recovery Code set by Master" autoComplete="off"/></label>}{security.accessCodeEnabled && <label className="block text-sm font-bold">Directorate Access Code <span className="text-red-600">* Required</span><input type="password" value={accessCodeInput} onChange={e=>setAccessCodeInput(e.target.value)} className="mt-1 w-full" placeholder="Directorate Access Code" autoComplete="off"/></label>}{loginError && <p className="rounded-lg bg-[var(--red)] p-2 text-sm font-semibold">{loginError}</p>}<button className="w-full rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white">{security.locked ? "Master Unlock" : "Sign in"}</button>{security.locked && <p className="text-xs text-[var(--muted)]">Master Unlock only accepts the Master account + Master password + Recovery Code{security.accessCodeEnabled ? " + Directorate Access Code" : ""}. Admin and Wilayat accounts cannot unlock the system.</p>}</form>
              <div className="mt-5">
                {security.showDemoPasswords ? <div className="rounded-xl border border-amber-300 bg-[var(--amber)] p-3 text-sm font-bold">Demo mode — passwords visible for testing. Turn OFF before sharing widely.</div> : null}
                <p className="mt-3 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{security.showDemoPasswords ? "Demo logins — tap to fill" : "Accounts — tap to fill username"}</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {effectiveUsers.map(u=>{
                    const isPrivileged = u.role==="Master" || u.role==="Admin";
                    return <button key={u.username} onClick={()=>{setUsername(u.username); if(security.showDemoPasswords) setPassword(u.password);}} className="rounded-lg border border-[var(--line)] px-2 py-2 text-left text-sm hover:bg-[var(--surface2)]">
                      <span className="block font-bold capitalize">{u.label} {u.role==="Wilayat" ? "— Wilayat" : ""}</span>
                      {security.showDemoPasswords ? <span className="text-xs text-[var(--muted)]">{u.username} · {u.password}</span> : <span className="text-xs text-[var(--muted)]">{isPrivileged ? "Keep Master password private" : "Contact Nursing Service Department for your password"}</span>}
                    </button>;
                  })}
                </div>
                {!security.showDemoPasswords && <p className="mt-2 text-xs text-[var(--muted)]">Production mode — passwords are hidden. Tap an account to fill username, then enter your password. Master/Admin: keep password private.</p>}
              </div>
              {backendError && <p className="mt-4 rounded-lg bg-amber-100 p-3 text-sm text-amber-900">{backendError}</p>}
              {initialLoadError && !initialLoadDone && <div className="mt-4 rounded-lg bg-amber-100 p-3 text-sm text-amber-900"><p>Could not load data: {initialLoadError}</p><button onClick={()=>loadOnceRef.current()} disabled={loading} className="mt-2 rounded-lg bg-[var(--teal)] px-3 py-1.5 text-sm font-bold text-white disabled:opacity-60">{loading?"Loading...":"Retry"}</button></div>}
              <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]">Demo accounts are for this preview. Wilayat users only see their own Wilayat. Admin sees all Wilayats and can manage plans and Wilayat passwords. Master sees all and controls access. {dbMode}</p>
            </div>
          </div>
        </div>
      </div>
    </> : <>
    <header data-safe-area-sticky-top style={{top:"var(--safe-area-inset-top)"}} className="noprint sticky z-20 border-b border-[var(--line)] bg-[var(--teal)] text-white">
      {/* Row 1: logo + title + user */}
      <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-3 py-2 sm:flex-wrap sm:gap-3 sm:px-5 sm:py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"><img src={mohLogo} alt="Ministry of Health logo" className="h-10 w-auto shrink-0 rounded-lg bg-white object-contain p-1 sm:h-11" /><div className="min-w-0"><h1 className="truncate text-base font-black leading-tight sm:text-lg"><span className="sm:hidden">Nursing Audit System</span><span className="hidden sm:inline">North Al Batinah — Nursing Audit System</span></h1><p className="truncate text-xs text-white/85">Directorate · {headerRoleText}</p></div></div>
        <span className="shrink-0 rounded-full bg-white/20 px-2 py-1 text-xs font-black [overflow-wrap:anywhere]">{user?.wilayat}</span>
        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex"><div className="flex flex-wrap items-center justify-end gap-2"><button onClick={()=>setShowHelp(true)} className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold"><HelpCircle className="mr-1 inline" size={16}/>How to use</button><button onClick={logout} className="rounded-full bg-white px-3 py-1.5 text-sm font-bold text-[var(--teal)]"><LogOut className="mr-1 inline" size={16}/>Logout</button></div><p className="text-xs font-semibold text-white/90">Brought to you by: Juma Al Marzouqi [Saham Hospital]</p></div>
        <button onClick={()=>setShowHelp(true)} aria-label="How to use" className="shrink-0 rounded-full bg-white/15 px-3 text-sm font-bold sm:hidden"><HelpCircle className="mr-1 inline" size={16}/>Help</button>
      </div>

      {/* Row 2: UNMISSABLE REFRESH — full width, always visible even 360px */}
      <div className="mx-auto w-full max-w-[1500px] px-3 pb-3 sm:px-5">
        <div className="flex w-full flex-wrap items-center gap-2 rounded-xl bg-white/15 p-2 backdrop-blur">
          <div className="flex w-full flex-wrap items-center gap-2">
            {RefreshBig}
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              {liveStatus==="offline" ? <span className="flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-2 text-xs font-bold text-amber-900"><span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500"/>Offline — last saved data</span> : liveStatus==="refreshing" ? <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-2 text-xs font-bold"><RefreshCw size={14} className="animate-spin"/>Refreshing...</span> : <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-2 text-xs font-bold"><span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-green-400"/>Live • Updated {formatLiveTime(lastUpdatedAt)}</span>}
              {refreshMsg && <span className="rounded-full bg-white/20 px-3 py-2 text-xs font-bold">{refreshMsg}</span>}
              {newDataBadge && <button type="button" onClick={()=>manualRefreshRef.current()} className="rounded-full bg-amber-300 px-3 py-2 text-xs font-black text-amber-950">{newDataBadge}</button>}
            </div>
            <button type="button" onClick={logout} className="sm:hidden ml-auto rounded-full bg-white/15 px-3 py-2 text-xs font-bold">Logout</button>
          </div>
          <p className="w-full text-[11px] text-white/80">Tap Refresh to load latest scores from shared database — works in shared link on any phone. Phone A saves → Phone B taps Refresh → sees score.</p>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-3 pb-2 sm:px-5">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Part">
          <button onClick={()=>{setPart("1"); setTab("Dashboard"); setSelectedCell(null);}} aria-pressed={part==="1"} className={`rounded-full px-4 py-2 text-sm font-black ${part==="1"?"bg-white text-[var(--teal)]":"bg-white/10 text-white"}`}>Part 1 — Documentation Audits</button>
          <button onClick={()=>{setPart("2"); setTab("Dashboard"); setSelectedCell(null);}} aria-pressed={part==="2"} className={`rounded-full px-4 py-2 text-sm font-black ${part==="2"?"bg-white text-[var(--teal)]":"bg-white/10 text-white"}`}>Part 2 — Competency Procedures</button>
        </div>
      </div>
      <nav className="no-scrollbar mx-auto flex max-w-[1500px] flex-nowrap gap-1 overflow-x-auto px-3 pb-3 sm:flex-wrap sm:overflow-visible sm:px-5">{tabs.map(t=><button key={t} onClick={()=>setTab(t)} className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${tab===t?"bg-white text-[var(--teal)]":"bg-white/10 text-white"}`}>{t}</button>)}</nav>
    </header>

    <main className="mx-auto max-w-[1500px] px-3 py-4 pb-36 sm:px-5 sm:py-6 sm:pb-6">
      {!initialLoadDone && loading && <div className="card p-8 text-center"><div className="mx-auto flex flex-col items-center gap-3"><RefreshCw size={28} className="animate-spin text-[var(--teal)]"/><p className="text-lg font-black">Loading data from shared database...</p><p className="text-sm text-[var(--muted)]">Fetching plans, scores and institutions from database (cache-busted). {dbMode}</p></div></div>}
      {!initialLoadDone && !loading && initialLoadError && <div className="card p-6 text-center"><p className="font-black text-amber-900">Could not load data</p><p className="mt-1 text-sm text-[var(--muted)]">{initialLoadError}</p><button onClick={()=>loadOnceRef.current()} className="mt-4 rounded-lg bg-[var(--teal)] px-4 py-2 font-bold text-white">Retry</button><p className="mt-2 text-xs text-[var(--muted)]">Grid is hidden until data loads — retry keeps last good data. {dbMode}</p></div>}

      {liveToast && <div role="status" className="mb-4 flex items-start justify-between gap-2 rounded-xl border border-[var(--teal)] bg-[var(--surface)] p-3 text-sm font-bold shadow"><span>{liveToast}</span><button type="button" onClick={()=>setLiveToast(null)} aria-label="Dismiss notification" className="shrink-0 rounded-full border px-2 py-0.5 text-xs">Dismiss</button></div>}
      {backendError && initialLoadDone && <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="mr-1 inline" size={16}/> {backendError} Showing last saved data. {dbMode}</div>}
      {saveMsg && <div className="mb-4 rounded-xl bg-[var(--surface2)] p-3 text-sm font-semibold">{saveMsg}</div>}
      {result && <div className="mb-4 rounded-xl border p-3 text-sm"><strong>Demo load:</strong> saved {result.saved}, remaining {result.remaining}. {result.error?`Storage error: ${result.error}`:""} {result.reloadError?`Reload error: ${result.reloadError}`:""}</div>}

      {initialLoadDone && tab==="Control Panel" && isAdmin && <section>
        <h2 className="text-xl font-black">Control Panel</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Same panel in Part 1 and Part 2. Passwords, institutions, and procedures are saved in the database and apply immediately to grids and dropdowns. {dbMode}</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="card p-4"><h3 className="flex items-center gap-2 font-extrabold"><Users size={18}/> Accounts</h3><div className="mt-3 space-y-2">{effectiveUsers.map(u=><div key={u.username} className="flex justify-between gap-2 rounded-lg border p-3 text-sm"><span><strong>{u.label}</strong> — {u.username} · {u.role} · {u.wilayat}</span><span className="text-[var(--muted)]">{u.username==="master" && !isMaster ? "Password: Protected — only Master can view/change" : <>Password: {u.password}</>}{getLastName(u.username) ? ` · Last auditor: ${getLastName(u.username)}` : ""}</span></div>)}</div><p className="mt-3 text-xs text-[var(--muted)]">Wilayat users see only their own Wilayat. Admin sees everything. Password changes are saved through the records service. Last auditor name is auto-saved per account for quick re-use.</p></div>
          <form onSubmit={changePassword} className="card p-4"><h3 className="font-extrabold">Change a password</h3><label className="mt-3 block text-sm font-bold">Account<select value={pwdForm.username} onChange={e=>setPwdForm({...pwdForm,username:e.target.value})} className="mt-1 w-full">{effectiveUsers.filter(u=> isMaster || u.username!=="master").map(u=><option key={u.username} value={u.username}>{u.label} ({u.username}) — {u.role}</option>)}</select></label>{!isMaster && <p className="mt-1 text-xs text-[var(--muted)]">Admin cannot change Master&apos;s password. Only Master can change Master&apos;s password.</p>}<label className="mt-3 block text-sm font-bold">New password<div className="mt-1 flex gap-2"><input type={showPwd?"text":"password"} value={pwdForm.password} onChange={e=>setPwdForm({...pwdForm,password:e.target.value})} className="flex-1" placeholder="At least 4 characters"/><button type="button" onClick={()=>setShowPwd(!showPwd)} className="rounded-lg border px-3 text-sm font-bold" aria-label={showPwd?"Hide password":"Show password"}>{showPwd?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></label><label className="mt-3 block text-sm font-bold">Confirm new password<input type={showPwd?"text":"password"} value={pwdConfirm} onChange={e=>setPwdConfirm(e.target.value)} className="mt-1 w-full" placeholder="Re-enter new password"/></label>{pwdMsg && <p className="mt-3 rounded bg-[var(--surface2)] p-2 text-sm font-semibold">{pwdMsg}</p>}<button disabled={busy} className="mt-4 w-full rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white disabled:opacity-50">Update password</button></form>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <form onSubmit={saveInstitution} className="card p-4 lg:col-span-2"><h3 className="font-extrabold">{editingInst?"Edit institution":"Add institution"}</h3><p className="mt-1 text-xs text-[var(--muted)]">Type a clean name only — any “Wilayat_” prefix is stripped automatically. An institution can belong to multiple parts/categories.</p><label className="mt-3 block text-sm font-bold">Wilayat<select value={instForm.wilayat} onChange={e=>setInstForm({...instForm,wilayat:e.target.value})} className="mt-1 w-full">{WILAYAT_ORDER.map(w=><option key={w} value={w}>{w}</option>)}</select></label><label className="mt-3 block text-sm font-bold">Institution name (clean, no prefix)<input value={instForm.name} onChange={e=>setInstForm({...instForm,name:e.target.value})} className="mt-1 w-full" placeholder="e.g. Khaboorah EHC"/></label><p className="mt-1 text-xs text-[var(--muted)]">Preview: {instForm.name ? cleanInstitutionName(instForm.name, instForm.wilayat) : "—"}</p><fieldset className="mt-3"><legend className="text-sm font-bold">Category / Part assignment</legend>{["Part 1","General Nursing","Renal Medicine Center","Labour Rooms"].map(a=><label key={a} className="mt-2 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={instForm.assignments.includes(a)} onChange={()=>toggleInstAssignment(a)} className="w-auto"/> {a==="Part 1"?"Part 1 (Documentation Audits)":`Part 2 — ${a}`}</label>)}</fieldset>{instMsg && <p className="mt-3 rounded bg-[var(--surface2)] p-2 text-sm font-semibold">{instMsg}</p>}<div className="mt-4 flex gap-2"><button disabled={busy} className="flex-1 rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white disabled:opacity-50">{editingInst?"Save changes":"Add institution"}</button>{editingInst && <button type="button" onClick={()=>{setEditingInst(null); setInstForm({wilayat:"Suhar",name:"",assignments:["Part 1"]});}} className="rounded-lg border px-3 py-2 font-bold">Cancel</button>}</div></form>
          <div className="card p-4 lg:col-span-3"><h3 className="font-extrabold">Institutions — grouped by Wilayat ({effInstList.length})</h3>{pendingDeleteInst && <div className="mt-3 rounded-xl border border-red-300 bg-[var(--red)] p-3 text-sm"><p className="font-bold">Remove “{pendingDeleteInst.institution}” ({pendingDeleteInst.wilayat})?</p><p className="mt-1">This will remove that institution’s scores and comments from grids (they will be deleted). This cannot be undone.</p><div className="mt-2 flex gap-2"><button type="button" onClick={confirmDeleteInstitution} disabled={busy} className="rounded-lg bg-red-700 px-3 py-1.5 font-bold text-white disabled:opacity-50">Confirm remove</button><button type="button" onClick={()=>setPendingDeleteInst(null)} className="rounded-lg border px-3 py-1.5 font-bold">Cancel</button></div></div>}<div className="mt-3 space-y-4">{WILAYAT_ORDER.map(w=>{ const items=effInstList.filter(e=>e.wilayat===w); if(!items.length) return null; return <div key={w}><h4 className="font-bold">{w} Wilayat — {items.length}</h4><div className="mt-1 space-y-1">{items.map(e=><div key={e.wilayat+e.institution} className="flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm"><span className="font-bold [overflow-wrap:anywhere]">{e.institution}</span><span className="text-xs text-[var(--muted)]">{e.assignments.join(" · ")}</span><span className="ml-auto flex gap-1"><button type="button" onClick={()=>startEditInst(e)} className="rounded-full border px-2 py-1 text-xs font-bold">Edit</button><button type="button" onClick={()=>setPendingDeleteInst(e)} className="rounded-full border border-red-200 px-2 py-1 text-xs font-bold text-red-700">Delete</button></span></div>)}</div></div>; })}</div></div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <form onSubmit={saveProcedure} className="card p-4 lg:col-span-2"><h3 className="font-extrabold">{editingProc?"Edit procedure":"Add procedure"}</h3><p className="mt-1 text-xs text-[var(--muted)]">Exact text is used in Part 2 plan dropdowns. Choose a tag: LR adds “[LR] ”, RMC adds “[RMC] ”, General / All keeps what you typed.</p><label className="mt-3 block text-sm font-bold">Procedure name<input value={procForm.name} onChange={e=>setProcForm({...procForm,name:e.target.value})} className="mt-1 w-full" placeholder="e.g. IV Cannulation Insertion"/></label><label className="mt-3 block text-sm font-bold">Category tag<select value={procForm.tag} onChange={e=>setProcForm({...procForm,tag:e.target.value})} className="mt-1 w-full"><option value="General">General</option><option value="LR">[LR] — Labour Rooms</option><option value="RMC">[RMC] — Renal Medicine Center</option><option value="All">All (keep typed prefix)</option></select></label><p className="mt-1 text-xs text-[var(--muted)]">Preview: {procForm.name ? normalizeProcName(procForm.name, procForm.tag) : "—"}</p>{procMsg && <p className="mt-3 rounded bg-[var(--surface2)] p-2 text-sm font-semibold">{procMsg}</p>}<div className="mt-4 flex gap-2"><button disabled={busy} className="flex-1 rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white disabled:opacity-50">{editingProc?"Save changes":"Add procedure"}</button>{editingProc && <button type="button" onClick={()=>{setEditingProc(null); setProcForm({name:"",tag:"General"});}} className="rounded-lg border px-3 py-2 font-bold">Cancel</button>}</div></form>
          <div className="card p-4 lg:col-span-3"><h3 className="font-extrabold">Procedures ({effectiveProcedures.length})</h3><div className="mt-3 flex flex-wrap gap-2"><input value={procSearch} onChange={e=>setProcSearch(e.target.value)} placeholder="Search procedures…" className="min-w-[180px] flex-1 text-sm"/><select value={procFilterTag} onChange={e=>setProcFilterTag(e.target.value)} className="text-sm"><option value="All">All tags</option><option value="General">General</option><option value="LR">[LR]</option><option value="RMC">[RMC]</option></select></div>{pendingDeleteProc && <div className="mt-3 rounded-xl border border-red-300 bg-[var(--red)] p-3 text-sm"><p className="font-bold">Remove procedure “{pendingDeleteProc.name}”?</p><p className="mt-1">Periods currently using this procedure will keep their historical scores but show the procedure name as “(Removed procedure)” and Admin must reassign them in Plans. Scores are NOT deleted.</p><div className="mt-2 flex gap-2"><button type="button" onClick={confirmDeleteProcedure} disabled={busy} className="rounded-lg bg-red-700 px-3 py-1.5 font-bold text-white disabled:opacity-50">Confirm remove</button><button type="button" onClick={()=>setPendingDeleteProc(null)} className="rounded-lg border px-3 py-1.5 font-bold">Cancel</button></div></div>}<div className="mt-3 max-h-[420px] space-y-1 overflow-auto">{filteredProceduresForControl.length===0?<p className="text-sm text-[var(--muted)]">No procedures match.</p>:filteredProceduresForControl.map(p=><div key={p} className="flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm"><span className="chip bg-[var(--surface2)]">{procTag(p)}</span><span className="font-semibold [overflow-wrap:anywhere]">{p}</span><span className="ml-auto flex gap-1"><button type="button" onClick={()=>startEditProc(p)} className="rounded-full border px-2 py-1 text-xs font-bold">Edit</button><button type="button" onClick={()=>setPendingDeleteProc({name:p, ...(procSourceMap.get(p.toLowerCase())||{})})} className="rounded-full border border-red-200 px-2 py-1 text-xs font-bold text-red-700">Delete</button></span></div>)}</div></div>
        </div>

        <section className="mt-4 rounded-2xl border-2 border-red-200 bg-[var(--surface)] p-4">
          {!canAccessControl ? <div className="rounded-xl border border-red-300 bg-[var(--red)] p-4 text-sm font-bold">Only Master can access Access Control &amp; Revocation.</div> : <>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-black">Access Control &amp; Revocation</h3><p className="mt-1 text-sm text-[var(--muted)]">Master only · Same controls in Part 1 and Part 2 · All changes save to the database immediately. {dbMode}</p></div><span className={`rounded-full px-3 py-1 text-xs font-black ${security.locked ? "bg-red-700 text-white" : "bg-green-100 text-green-900"}`}>{security.locked ? "SYSTEM LOCKED" : "System open"}</span></div>
          {securityMsg && <p className="mt-3 rounded-xl bg-[var(--surface2)] p-3 text-sm font-semibold [overflow-wrap:anywhere]">{securityMsg}</p>}
          {showRecoveryOnce && <div className="mt-3 rounded-xl border border-amber-400 bg-[var(--amber)] p-3 text-sm"><p className="font-black">Recovery Code — shown once. Store it privately now:</p><p className="mt-1 text-lg font-black [overflow-wrap:anywhere]">{showRecoveryOnce}</p><button type="button" onClick={()=>setShowRecoveryOnce("")} className="mt-2 rounded-lg border bg-white px-3 py-1.5 text-sm font-bold">Hide this code</button><p className="mt-1 text-xs">This box will not show the code again. If you lose it, set a new Recovery Code here while you are still signed in as Master.</p></div>}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border p-4"><h4 className="font-extrabold">1) Disable / Enable accounts</h4><p className="mt-1 text-xs text-[var(--muted)]">Disabling blocks login even with the correct password. Scores and data are kept. Re-enabling restores the same password.</p><div className="mt-3 space-y-2">{DEFAULT_USERS.map(u=>{ const isDisabled = security.disabled.includes(u.username); return <div key={u.username} className="flex flex-wrap items-center gap-2 rounded-lg border p-2 text-sm"><span className="font-bold">{u.label} <span className="font-normal text-[var(--muted)]">({u.username})</span></span><span className={`rounded-full px-2 py-0.5 text-xs font-black ${isDisabled ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>{isDisabled ? "Disabled" : "Active"}</span>{(u.username==="master"||u.username==="admin") ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-black text-amber-900">Protected</span> : <span className="ml-auto">{pendingDisable===u.username ? <span className="flex flex-wrap items-center gap-1"><input value={disableConfirm} onChange={e=>setDisableConfirm(e.target.value)} placeholder="Type DISABLE" className="w-[130px] py-1 text-xs" /><button type="button" disabled={busy || disableConfirm!=="DISABLE"} onClick={()=>toggleDisableAccount(u.username)} className="rounded-lg bg-red-700 px-2 py-1 text-xs font-bold text-white disabled:opacity-50">Confirm Disable</button><button type="button" onClick={()=>{setPendingDisable(null); setDisableConfirm("");}} className="rounded-lg border px-2 py-1 text-xs font-bold">Cancel</button></span> : isDisabled ? <button type="button" disabled={busy} onClick={()=>toggleDisableAccount(u.username)} className="rounded-lg bg-[var(--teal)] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">Enable</button> : <button type="button" disabled={busy} onClick={()=>{setPendingDisable(u.username); setDisableConfirm(""); setSecurityMsg(`Disabling ${u.label} will immediately block that ${u.role==="Admin" ? "Admin" : "Wilayat"} from logging in. Type DISABLE to confirm.`);}} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-700">Disable</button>}</span>}</div>; })}</div></div>
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-red-300 bg-[var(--red)] p-4"><h4 className="font-extrabold text-red-900">2) Emergency Lock — Lock Entire System</h4><p className="mt-1 text-sm">When locked, nobody can log in except Master via Master Unlock.</p>{!security.recoveryCode && <p className="mt-2 rounded bg-white p-2 text-xs font-bold">Set a Recovery Code below first — it is required to unlock.</p>}{security.locked ? <div className="mt-3"><label className="block text-sm font-bold">Recovery Code to unlock<input type="password" value={unlockRecoveryInput} onChange={e=>setUnlockRecoveryInput(e.target.value)} className="mt-1 w-full" placeholder="Enter Recovery Code" /></label><button type="button" disabled={busy} onClick={doUnlockFromPanel} className="mt-2 w-full rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white disabled:opacity-50">Unlock System</button></div> : pendingLock ? <div className="mt-3"><label className="block text-sm font-bold">Type LOCK to confirm<input value={lockConfirm} onChange={e=>setLockConfirm(e.target.value)} className="mt-1 w-full" placeholder="Type LOCK" /></label><div className="mt-2 flex gap-2"><button type="button" disabled={busy || lockConfirm!=="LOCK" || !security.recoveryCode} onClick={doLockSystem} className="flex-1 rounded-lg bg-red-700 py-2.5 font-bold text-white disabled:opacity-50">Confirm — Lock System</button><button type="button" onClick={()=>{setPendingLock(false); setLockConfirm("");}} className="rounded-lg border bg-white px-3 py-2 font-bold">Cancel</button></div></div> : <button type="button" disabled={busy || !security.recoveryCode} onClick={()=>{setPendingLock(true); setLockConfirm("");}} className="mt-3 w-full rounded-lg bg-red-700 py-3 font-black text-white disabled:opacity-50">Lock System — Block All Logins</button>}</div>
              <div className="rounded-xl border p-4"><h4 className="font-extrabold">Recovery Code</h4><p className="mt-1 text-xs text-[var(--muted)]">Required to unlock after Emergency Lock.</p><p className="mt-2 text-sm">Status: <strong>{security.recoveryCode ? "Set (hidden)" : "Not set"}</strong></p><label className="mt-2 block text-sm font-bold">New Recovery Code (6+ characters)<input type="password" value={newRecoveryCode} onChange={e=>setNewRecoveryCode(e.target.value)} className="mt-1 w-full" placeholder="At least 6 characters" /></label><button type="button" disabled={busy} onClick={doSaveRecoveryCode} className="mt-2 w-full rounded-lg bg-[var(--teal)] py-2 font-bold text-white disabled:opacity-50">Save Recovery Code</button></div>
              <div className="rounded-xl border p-4"><h4 className="font-extrabold">4) Force Logout / Session Revocation</h4><p className="mt-1 text-sm">Bumps the session version. All Wilayat users are kicked to login within 30 seconds.</p><p className="mt-2 text-sm">Last revocation: <strong>{security.lastRevocationAt ? `${formatMuscat(security.lastRevocationAt)} by ${security.lastRevocationBy||"Master"}` : "Never"}</strong></p><p className="text-xs text-[var(--muted)]">Session version: {security.sessionVersion}</p>{pendingForceLogout ? <div className="mt-3"><label className="block text-sm font-bold">Type FORCE LOGOUT to confirm<input value={forceConfirm} onChange={e=>setForceConfirm(e.target.value)} className="mt-1 w-full" placeholder="Type FORCE LOGOUT" /></label><div className="mt-2 flex gap-2"><button type="button" disabled={busy || forceConfirm!=="FORCE LOGOUT"} onClick={doForceLogout} className="flex-1 rounded-lg bg-red-700 py-2 font-bold text-white disabled:opacity-50">Confirm Force Logout</button><button type="button" onClick={()=>{setPendingForceLogout(false); setForceConfirm("");}} className="rounded-lg border px-3 py-2 font-bold">Cancel</button></div></div> : <button type="button" disabled={busy} onClick={()=>{setPendingForceLogout(true); setForceConfirm("");}} className="mt-3 w-full rounded-lg bg-red-700 py-2.5 font-bold text-white disabled:opacity-50">Force Logout All Users</button>}</div>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border p-4"><h4 className="font-extrabold">3) Rotate All Wilayat Passwords</h4><p className="mt-1 text-xs text-[var(--muted)]">Old passwords stop working immediately.</p><div className="mt-3 flex gap-2"><button type="button" onClick={()=>setRotateMode("one")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${rotateMode==="one" ? "bg-[var(--teal)] text-white" : "border"}`}>One password for all 6</button><button type="button" onClick={()=>setRotateMode("separate")} className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${rotateMode==="separate" ? "bg-[var(--teal)] text-white" : "border"}`}>Generate 6 separate passwords</button></div>{rotateMode==="one" && <label className="mt-3 block text-sm font-bold">One new password for all 6 Wilayat accounts<input type="password" value={rotateSingle} onChange={e=>setRotateSingle(e.target.value)} className="mt-1 w-full" placeholder="At least 4 characters" /></label>}{rotateMode==="separate" && <p className="mt-3 text-sm text-[var(--muted)]">Six different random 12-character passwords will be generated and shown once below.</p>}<label className="mt-3 block text-sm font-bold">Type ROTATE to confirm<input value={rotateConfirm} onChange={e=>setRotateConfirm(e.target.value)} className="mt-1 w-full" placeholder="Type ROTATE" /></label><button type="button" disabled={busy || rotateConfirm!=="ROTATE"} onClick={doRotatePasswords} className="mt-2 w-full rounded-lg bg-red-700 py-2.5 font-bold text-white disabled:opacity-50">Change All Wilayat Passwords</button>{rotateResult && <div className="mt-3 rounded-xl border bg-[var(--surface2)] p-3"><p className="text-sm font-black">New passwords — shown once.</p><div className="mt-2 overflow-auto"><table className="w-full min-w-[320px] border-collapse text-left text-sm"><thead><tr className="border-b"><th className="p-2">Wilayat</th><th className="p-2">Username</th><th className="p-2">New password</th></tr></thead><tbody>{rotateResult.map(r=><tr key={r.username} className="border-b"><td className="p-2 font-bold">{r.label}</td><td className="p-2">{r.username}</td><td className="p-2 font-mono font-bold [overflow-wrap:anywhere]">{r.password}</td></tr>)}</tbody></table></div><button type="button" onClick={()=>setRotateResult(null)} className="mt-2 rounded-lg border px-3 py-1.5 text-sm font-bold">Hide passwords</button></div>}</div>
            <div className="rounded-xl border p-4"><h4 className="font-extrabold">6) Directorate Access Code (optional extra layer)</h4><p className="mt-1 text-sm">Status: <strong>{security.accessCodeEnabled ? "ON — required on every login" : "OFF"}</strong> {security.accessCode ? "· Code is set (hidden)" : "· No code set yet"}</p><p className="mt-1 text-xs text-[var(--muted)]">Fastest way to revoke access if the link leaks: change the Access Code and share the new code only inside the Directorate.</p><label className="mt-3 block text-sm font-bold">Set / change Access Code (e.g. NB-2027)<input type="password" value={newAccessCode} onChange={e=>setNewAccessCode(e.target.value)} className="mt-1 w-full" placeholder="e.g. NB-2027" /></label><div className="mt-2 flex gap-2"><button type="button" disabled={busy} onClick={doSaveAccessCode} className="flex-1 rounded-lg bg-[var(--teal)] py-2 font-bold text-white disabled:opacity-50">Save &amp; Turn ON</button><button type="button" disabled={busy || !security.accessCode} onClick={doToggleAccessCode} className="rounded-lg border px-3 py-2 font-bold">{security.accessCodeEnabled ? "Turn OFF" : "Turn ON"}</button></div></div>
            <div className="rounded-xl border p-4"><h4 className="font-extrabold">7) Show demo passwords on login page</h4><p className="mt-1 text-sm">When OFF (recommended for production), login page shows only usernames. When ON, shows passwords for testing.</p><p className="mt-2 text-sm">Status: <strong>{security.showDemoPasswords ? "ON — passwords visible on login" : "OFF — production mode, passwords hidden"}</strong></p><button type="button" disabled={busy} onClick={doToggleShowDemoPasswords} className={`mt-3 w-full rounded-lg py-2.5 font-bold text-white ${security.showDemoPasswords ? "bg-amber-600" : "bg-[var(--teal)]"} disabled:opacity-50`}>{security.showDemoPasswords ? "Turn OFF — Hide passwords (production)" : "Turn ON — Show passwords (testing)"}</button></div>
          </div>
          <div className="mt-4 rounded-xl border p-4"><h4 className="font-extrabold">5) Login Attempt Log — last 20</h4><p className="mt-1 text-xs text-[var(--muted)]">Watch for repeated failed attempts.</p>{loginAttempts.length===0 ? <p className="mt-2 text-sm">No login attempts recorded yet.</p> : <div className="mt-2 max-h-[320px] overflow-auto"><table className="w-full min-w-[640px] border-collapse text-left text-sm"><thead><tr className="border-b"><th className="p-2">Date / Time (Muscat)</th><th className="p-2">Username attempted</th><th className="p-2">Result</th><th className="p-2">Account status</th><th className="p-2">Reason</th></tr></thead><tbody>{loginAttempts.slice(0,20).map(a=><tr key={a.id} className="border-b align-top"><td className="p-2 whitespace-nowrap text-xs">{a.at ? formatMuscat(a.at) : "—"}</td><td className="p-2 font-bold [overflow-wrap:anywhere]">{a.username}</td><td className="p-2"><span className={`rounded-full px-2 py-0.5 text-xs font-bold ${a.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{a.success ? "Success" : "Failed"}</span></td><td className="p-2">{a.status}</td><td className="p-2 [overflow-wrap:anywhere]">{a.reason}</td></tr>)}</tbody></table></div>}</div>
          </>}
        </section>
      </section>}

      {initialLoadDone && tab==="Guide" && <section className="mx-auto max-w-[720px]">
        <div className="card p-4 sm:p-6">
          <h2 className="text-[clamp(1.4rem,5vw,1.9rem)] font-black leading-tight [overflow-wrap:anywhere]">Wilayat Quick Guide — How to Enter Scores on Your Phone</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">Simple steps for Wilayat users on a small phone. No horizontal scroll, large text.</p>

          <div className="mt-5 space-y-5 text-[16px] leading-[1.5]">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface2)] p-4">
              <p className="font-black text-[17px]">Step 1: Open the shared link</p>
              <p className="mt-2">Open the shared link on your phone (Chrome or Safari). Log in with your Wilayat account, for example <span className="font-mono font-bold bg-white px-1 rounded">suhar / suhar123</span>. If you do not see the Refresh button, pull down to refresh the browser.</p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
              <p className="font-black text-[17px]">Step 2: Choose Part</p>
              <p className="mt-2">At the top choose Part 1 — Documentation Audits or Part 2 — Competency Procedures.</p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
              <p className="font-black text-[17px]">Step 3: Choose Year and Topic or Category</p>
              <p className="mt-2">Choose Year and Topic for Part 1 or Category for Part 2 — for example 2027 + Crash Cart.</p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
              <p className="font-black text-[17px]">Step 4: See months in Audit Grid</p>
              <p className="mt-2">In Audit Grid, swipe sideways to see months Jan to Dec. Tip: turn ON Single month view for easiest entry — it shows one big month column.</p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
              <p className="font-black text-[17px]">Step 5: Tap a cell to enter score</p>
              <p className="mt-2">Tap a cell, for example Saham Hospital • Jan. A bottom sheet opens. Enter Score 0 to 100 or NA, Your Name mandatory minimum 2 characters, Comment optional. Tap Save. Row stays highlighted until saved.</p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
              <p className="font-black text-[17px]">Step 6: Edit again</p>
              <p className="mt-2">To edit, tap same cell again, change, Save — history is kept in Comments.</p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
              <p className="font-black text-[17px]">Step 7: Refresh to see latest</p>
              <p className="mt-2">Tap Refresh at top to see latest scores from other Wilayats, or wait 10 seconds for auto refresh. Live status shows Live • Updated HH:mm:ss.</p>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
              <p className="font-black text-[17px]">Step 8: Check Dashboard</p>
              <p className="mt-2">Check Dashboard to see Completion % and what is missing.</p>
            </div>

            <div className="rounded-xl border-2 border-amber-300 bg-[var(--amber)] p-4">
              <p className="font-black text-[17px]">Troubleshooting</p>
              <ul className="mt-2 list-disc pl-5 space-y-2">
                <li>If cell shows Locked or Approved, you cannot edit — contact Admin.</li>
                <li>If offline, banner shows Offline — showing last saved data — will retry when online.</li>
                <li>If you flip phone portrait or landscape, your data stays.</li>
              </ul>
            </div>

            <div className="grid gap-3">
              <div className="rounded-xl bg-[var(--teal)] text-white p-4 font-bold text-[15px]">Tip: Swipe sideways for months</div>
              <div className="rounded-xl bg-[var(--teal)] text-white p-4 font-bold text-[15px]">Tip: Use Single month view on small phones</div>
              <div className="rounded-xl bg-[var(--teal)] text-white p-4 font-bold text-[15px]">Tip: Tap Refresh after colleague saves</div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button type="button" onClick={copyGuideText} className="rounded-full bg-[var(--teal)] px-5 py-3 text-[15px] font-black text-white">Copy guide text</button>
              {guideCopyMsg && <span className="self-center rounded-full bg-[var(--surface2)] px-3 py-2 text-sm font-bold">{guideCopyMsg}</span>}
            </div>

            <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface2)] p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Full guide text (selectable)</p>
              <pre className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-relaxed [overflow-wrap:anywhere]">{GUIDE_TEXT}</pre>
            </div>
          </div>
        </div>
      </section>}

      {initialLoadDone && tab!=="Control Panel" && tab!=="Guide" && part==="1" && <>
      <section className="card mb-4 p-3 sm:p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div><label className="text-xs font-bold uppercase text-[var(--muted)]">Topic</label><div className="mt-1 flex flex-wrap gap-1">{TOPICS.map(t=><button key={t} onClick={()=>setTopic(t)} className={`rounded-full px-3 py-1.5 text-sm font-bold ${topic===t?"bg-[var(--teal)] text-white":"border border-[var(--line)]"}`}>{t}</button>)}</div></div>
          <label className="min-w-[220px] flex-1 text-sm font-bold">Plan<select value={activePlan?.id||""} onChange={e=>setPlanId(e.target.value)} className="mt-1 w-full"><option value="">No plan for this topic</option>{plans.filter(p=>p.topic===topic).map(p=><option key={p.id} value={p.id}>{p.year} · Monthly · 12 months{p.active?" · Active":""}</option>)}</select></label>
          {isAdmin && <label className="text-sm font-bold">Wilayat filter<select value={wilayatFilter} onChange={e=>setWilayatFilter(e.target.value)} className="mt-1"><option value="All">All Wilayats</option>{WILAYAT_ORDER.map(w=><option key={w} value={w}>{w} ({(effPart1[w]||[]).length})</option>)}</select></label>}
          <label className="flex-1 min-w-[180px] text-sm font-bold"><span className="flex items-center gap-1"><Search size={14}/> Search institution</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="e.g. Suhar EHC" className="mt-1 w-full"/></label>
          <div className="flex gap-2"><button onClick={exportCSV} disabled={!activePlan} className="rounded-lg bg-[var(--blue)] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><Download className="mr-1 inline" size={16}/>Export CSV</button><button onClick={()=>setPrintView(!printView)} className="rounded-lg border px-3 py-2 text-sm font-bold">{printView?"Exit print view":"Print-friendly view"}</button></div>
        </div>
        {!activePlan && <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">No plan yet for <strong>{topic}</strong>. {isAdmin?"Create one in Plans, or load the demo plans below.":"Ask the Admin to create a plan for this topic."} {isAdmin && <button onClick={loadDemo} disabled={busy} className="ml-2 rounded bg-[var(--teal)] px-2 py-1 font-bold text-white disabled:opacity-50">Load demo plans</button>}</div>}
      </section>

      {tab==="Dashboard" && <div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{topicStats.map(s=><article key={s.topic} className="card p-4"><p className="text-sm font-bold text-[var(--muted)]">{s.topic}</p><p className="mt-2 text-3xl font-black">{fmtAvg(s.avg)}</p><p className="mt-1 text-sm">Audits conducted: <strong>{s.count}</strong></p><p className="text-sm">Completion: <strong>{s.completion.toFixed(1)}%</strong></p><div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface2)]"><div className="h-full bg-[var(--teal)]" style={{width:`${Math.min(100,s.completion)}%`}}/></div></article>)}</div>
        <div className="mt-4 flex flex-wrap gap-3">
          {isAdmin ? <>
            <button onClick={exportPart1StatsExcel} className="flex items-center gap-2 rounded-xl bg-[var(--teal)] px-6 py-3 text-sm font-black text-white shadow-md hover:bg-[var(--teal2)]"><Download size={18}/>Export Part 1 Statistics Excel</button>
            <button onClick={exportPart2StatsExcel} className="flex items-center gap-2 rounded-xl bg-[var(--blue)] px-6 py-3 text-sm font-black text-white shadow-md"><Download size={18}/>Export Part 2 Statistics Excel</button>
          </> : <>
            <button onClick={exportPart1StatsExcel} className="flex items-center gap-2 rounded-xl bg-[var(--teal)] px-6 py-3 text-sm font-black text-white shadow-md"><Download size={18}/>Export My Statistics Excel</button>
          </>}
          <span className="self-center text-xs text-[var(--muted)]">Respects current filters • Asia/Muscat • clean names • real .xlsx 2 sheets • filename includes date</span>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <section className="card p-4 lg:col-span-3"><h2 className="flex items-center gap-2 font-extrabold"><BarChart3 size={18}/> Average by Wilayat — {topic}</h2><p className="text-xs text-[var(--muted)]">Current selected plan / topic. Bar length is the numeric average.</p><div className="mt-4 space-y-3">{wilayatStats.filter(w=>isAdmin||w.wilayat===user.wilayat).map(w=><div key={w.wilayat}><div className="flex justify-between text-sm"><span className="font-bold">{w.wilayat} <span className="font-normal text-[var(--muted)]">({w.count} institutions)</span></span><span>{fmtAvg(w.avg)} · {w.completion.toFixed(0)}%</span></div><div className="mt-1 h-3 overflow-hidden rounded-full bg-[var(--surface2)]"><div className="h-full bg-[var(--blue)]" style={{width:`${w.avg||0}%`}}/></div></div>)}</div></section>
          <section className="card p-4 lg:col-span-2"><h2 className="font-extrabold">Per-Wilayat summary</h2><div className="mt-3 space-y-2">{wilayatStats.filter(w=>isAdmin||w.wilayat===user.wilayat).map(w=><div key={w.wilayat} className="rounded-lg border border-[var(--line)] p-3 text-sm"><div className="flex justify-between font-bold"><span>{w.wilayat}</span><span>{fmtAvg(w.avg)}</span></div><div className="text-[var(--muted)]">Completion {w.completion.toFixed(1)}% · Submitted {w.count} · Missing {w.missing}</div></div>)}</div></section>
        </div>
        <section className="card mt-4 p-4"><h2 className="font-extrabold">Not started — 0 audits in this plan</h2>{renderNotStarted(notStarted)}</section>
      </div>}

      {tab==="Audit Grid" && <section className="card p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap gap-4 text-sm"><span><strong>{topic}</strong> · {activePlan?`${activePlan.year} · Monthly · 12 months`:"No plan"}</span><span>Completion <strong>{gridStats.completion.toFixed(1)}%</strong></span><span>Audits <strong>{gridStats.count}</strong></span><span>Overall average <strong>{fmtAvg(gridStats.avg)}</strong></span><span>Missing <strong>{gridStats.missing}</strong></span><span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">{dbMode}</span></div>
        {!activePlan ? <p className="text-sm text-[var(--muted)]">Select or create a plan to see the grid.</p> : <>
          <p className="mb-2 rounded-lg bg-[var(--amber)] px-3 py-2 text-sm font-semibold">Click a cell to edit — the row stays highlighted until you Save or Exit. Score and Auditor Name are mandatory. Use top Refresh button to get latest from shared database.</p>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <label className="w-full text-sm font-bold sm:w-auto">Jump to institution / Wilayat<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search institution…" className="mt-1 w-full sm:w-[220px]"/></label>
            <button type="button" onClick={jumpToMyWilayat} className="rounded-full border px-3 font-bold">Jump to my Wilayat</button>
            <button type="button" onClick={()=>{setSingleMonthUserSet(true); setSingleMonthView(!singleMonthView);}} aria-pressed={singleMonthView} className={`rounded-full px-4 font-bold ${singleMonthView?"bg-[var(--teal)] text-white":"border"}`}>{singleMonthView?"Single month view: ON":"Single month view: OFF"}</button>
          </div>
          <div className="mb-2"><label className="text-xs font-bold uppercase text-[var(--muted)]">Month picker</label><div className="no-scrollbar mt-1 flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Month picker">{MONTHS.map((m,mi)=><button key={m} type="button" onClick={()=>scrollToMonth(m)} aria-pressed={mobileMonthIdx===mi} className={`shrink-0 rounded-full px-3 text-sm font-bold ${mobileMonthIdx===mi?"bg-[var(--teal)] text-white":"border"}`}>{m}</button>)}</div></div>
          <p className="mb-2 text-sm font-semibold">← Swipe to see months → • Refresh button is always visible in top green bar (second row)</p>
          {singleMonthView && isMobile && activePlan && <div className="mb-3 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]"><div className="flex items-center justify-between bg-[var(--surface2)] px-3 py-2 text-sm font-extrabold"><span>{MONTHS[mobileMonthIdx]} — {topic}</span><span>Tap a score to edit</span></div>{visibleInstitutions.map(v=>{ const c=findScore(v.wilayat,v.institution,MONTHS[mobileMonthIdx]); const isEditingRow=!!selectedCell && selectedCell.part!=="2" && selectedCell.wilayat===v.wilayat && selectedCell.institution===v.institution; return <div key={v.wilayat+v.institution} className={`single-month-row flex items-center gap-2 border-b px-3 py-2 ${isEditingRow?"bg-[var(--highlight)]":""}`}><div className="min-w-0 flex-1"><div className="font-bold [overflow-wrap:anywhere]">{labelFor(v.wilayat,v.institution)}</div><div className="text-xs text-[var(--muted)]">{v.wilayat} · Audits: {activePlan.periods.map(p=>findScore(v.wilayat,v.institution,p)).filter(Boolean).length}</div></div><button type="button" onClick={()=>openCell(v,MONTHS[mobileMonthIdx],"1")} className="single-month-cell shrink-0 rounded-lg border px-3 font-bold" style={c?scoreColor(c.score):{}}>{c?c.score:"Tap to enter"}</button></div>; })}</div>}
          <div ref={gridRef} className={`gridwrap ${singleMonthView && isMobile ? "hidden" : ""}`}><table className="excel"><thead><tr><th>Institution</th><th>Wilayat</th><th>Number of Audits</th><th>Average</th>{activePlan.periods.map(p=><th key={p} data-month={p} className={mobileMonthIdx===MONTH_INDEX[p]?"!bg-[var(--highlight)]":""}>{p}</th>)}</tr></thead><tbody>
            <tr style={{background:"var(--surface2)"}}><td><strong>PERIOD AVERAGE</strong></td><td><strong>—</strong></td><td><strong>{gridStats.count}</strong></td><td><strong>{fmtAvg(gridStats.avg)}</strong></td>{activePlan.periods.map(p=>{ const nums=planScores.filter(s=>s.period===p && visibleInstitutions.some(v=>v.wilayat===s.wilayat&&v.institution===s.institution) && s.score!=="NA").map(s=>parseFloat(s.score)).filter(n=>!isNaN(n)); return <td key={p}><strong>{nums.length?(nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(2)+"%":"—"}</strong></td>})}</tr>
            {visibleInstitutions.map(v=>{
              const cells=activePlan.periods.map(p=>findScore(v.wilayat,v.institution,p));
              const nums=cells.filter(c=>c && c.score!=="NA").map(c=>parseFloat(c!.score)).filter(n=>!isNaN(n));
              const isEditingRow = !!selectedCell && selectedCell.part!=="2" && selectedCell.wilayat===v.wilayat && selectedCell.institution===v.institution;
              return <tr key={v.wilayat+v.institution} className={isEditingRow?"editing-row":""} aria-current={isEditingRow?"true":undefined}><td>{labelFor(v.wilayat,v.institution)}</td><td>{v.wilayat}</td><td>{cells.filter(Boolean).length}</td><td>{nums.length?(nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(2)+"%":"—"}</td>{activePlan.periods.map((p,idx)=>{ const c=cells[idx]; const isEditingCell = isEditingRow && selectedCell!.period===p; const tooltip = c ? `Score: ${c.score}${c.comment?`\nComment: ${c.comment}`:""}\nAudited by: ${c.auditorName||"—"}\nAdded at: ${c.auditedAt?formatMuscat(c.auditedAt):"—"}` : "Click to enter score"; return <td key={p} data-month={p} className={isEditingCell?"editing-cell":""} style={c?scoreColor(c.score):{background:"#f6f8f8"}}><button className={`cellBtn ${c?.comment?"hasComment":""}`} aria-pressed={isEditingCell} onClick={()=>openCell(v,p,"1")} title={tooltip}>{c?c.score:""}</button></td>})}</tr>
            })}
          </tbody></table></div>
          <p className="mt-2 text-xs text-[var(--muted)]">Click any cell to enter Score (0–100 or NA, mandatory), Comment (optional), and Auditor Name (mandatory, min 2 chars). Hover shows Audited by / Added at. NA counts as submitted, but is excluded from averages. Wilayat users can edit only their own Wilayat. {dbMode}</p>
          {selectedCell && selectedCell.part!=="2" && !isMobile && <div className="mt-4 rounded-xl border border-[var(--teal)] bg-[var(--surface2)] p-4">
            <div className="flex justify-between gap-3"><h3 className="font-extrabold">Edit audit — {labelFor(selectedCell.wilayat,selectedCell.institution)} · {topic} · {selectedCell.period}</h3><button onClick={()=>setSelectedCell(null)} aria-label="Close editor"><X/></button></div>
            {findScore(selectedCell.wilayat,selectedCell.institution,selectedCell.period)?.auditedAt && <div className="mt-2 rounded-lg bg-white p-2 text-xs"><span className="font-bold">Previous:</span> Audited by {findScore(selectedCell.wilayat,selectedCell.institution,selectedCell.period)?.auditorName} at {formatMuscat(findScore(selectedCell.wilayat,selectedCell.institution,selectedCell.period)?.auditedAt)}</div>}
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-bold">Score (0–100 or NA) <span className="text-red-600">* Mandatory</span><input value={scoreInput} onChange={e=>setScoreInput(e.target.value)} placeholder="e.g. 95.64 or NA" className={`mt-1 w-full ${!isScoreValid(scoreInput) && scoreInput!=="" ? "border-red-500" : ""}`}/><span className="mt-1 block text-[11px] text-[var(--muted)]">Mandatory — number 0–100 with decimals or NA</span></label>
              <label className="text-sm font-bold">Your Name / Auditor Name <span className="text-red-600">* Mandatory</span><input value={auditorNameInput} onChange={e=>setAuditorNameInput(e.target.value)} placeholder="e.g. Salim Al Mamari" className={`mt-1 w-full ${!isNameValid(auditorNameInput) && auditorNameInput!=="" ? "border-red-500" : ""}`}/><span className="mt-1 block text-[11px] text-[var(--muted)]">Mandatory — will be shown as Audited by</span></label>
              <label className="text-sm font-bold">Comment <span className="text-[var(--muted)]">(Optional)</span><textarea value={commentInput} onChange={e=>setCommentInput(e.target.value)} rows={3} placeholder="Add a comment for this audit... (optional)" className="mt-1 w-full"/></label>
            </div>
            <div className="mt-2 rounded bg-white p-2 text-xs text-[var(--muted)]"><div className="font-bold text-[var(--ink)]">How it will appear:</div><div className="mt-1">Audited by: {auditorNameInput.trim()||"—"}</div><div>Added at: {formatMuscat(new Date().toISOString())} (Asia/Muscat)</div></div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={saveCell} disabled={busy || !isScoreValid(scoreInput) || !isNameValid(auditorNameInput)} className="rounded-lg bg-[var(--teal)] px-4 py-2 font-bold text-white disabled:opacity-50"><CheckCircle2 className="mr-1 inline" size={16}/>{busy?"Saving…":"Save audit"}</button>
              <button type="button" onClick={()=>setSelectedCell(null)} disabled={busy} className="rounded-lg border px-3 py-2 font-bold">Cancel</button>
              {findScore(selectedCell.wilayat,selectedCell.institution,selectedCell.period) && <button onClick={deleteScore} disabled={busy} className="rounded-lg border border-red-300 px-3 py-2 font-bold text-red-700"><Trash2 className="mr-1 inline" size={16}/>Remove entry</button>}
            </div>
          </div>}
        </>}
      </section>}

      {tab==="Comments" && <section className="card p-4">
        <h2 className="flex items-center gap-2 font-extrabold"><MessageSquare size={18}/> Comments — {topic}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Now shows Auditor Name and Muscat timestamp. Even if comment is empty, Audited by / Added at is shown. Filter by auditor name, sort by Added at. {dbMode}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="flex items-center gap-2 text-sm font-bold"><Filter size={14}/> Audited by:<input value={p1AuditorFilter} onChange={e=>setP1AuditorFilter(e.target.value)} placeholder="Filter auditor name…" className="text-sm"/></label>
          <button onClick={()=>setP1SortDesc(!p1SortDesc)} className="rounded-lg border px-3 py-1.5 text-sm font-bold">{p1SortDesc?"Newest first":"Oldest first"}</button>
          <span className="text-xs text-[var(--muted)] self-center">{filteredP1Comments.length} entries • {dbMode}</span>
        </div>
        {filteredP1Comments.length===0?<p className="mt-4 text-sm">No audits yet for this selection.</p>:<>
        <div className="mt-3 space-y-3 sm:hidden">{filteredP1Comments.map(c=><article key={c.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-extrabold [overflow-wrap:anywhere]">{labelFor(c.wilayat,c.institution)}</p><p className="text-xs text-[var(--muted)]">{c.wilayat} · {c.topic} · {c.period}</p></div><span className="shrink-0 rounded-full bg-[var(--surface2)] px-3 py-1 font-black">{c.score}</span></div><p className="mt-2 text-sm [overflow-wrap:anywhere]">{c.comment || "No comment"}</p><p className="mt-2 text-xs text-[var(--muted)]">Audited by: {c.auditorName||"—"} · Added at: {c.auditedAt?formatMuscat(c.auditedAt):"—"}</p>{c.history && c.history.length>0 && <button onClick={()=>setExpandedHistoryId(expandedHistoryId===c.id?null:c.id)} className="mt-2 rounded-full border px-3 text-xs font-bold">History ({c.history.length})</button>}{expandedHistoryId===c.id && c.history && <div className="mt-2 space-y-1">{c.history.map((h,i)=><div key={i} className="rounded border bg-[var(--surface2)] p-2 text-xs"><span className="font-bold">{h.score}</span> — {h.comment||"No comment"} · {h.auditorName} · {formatMuscat(h.auditedAt)}</div>)}</div>}</article>)}</div>
        <div className="mt-3 hidden overflow-auto sm:block"><table className="w-full min-w-[1000px] border-collapse text-left text-sm"><thead><tr className="border-b"><th className="p-2">Wilayat</th><th className="p-2">Institution</th><th className="p-2">Topic</th><th className="p-2">Period</th><th className="p-2">Score</th><th className="p-2 min-w-[260px]">Comment + Audit trail</th><th className="p-2">Audited by</th><th className="p-2 cursor-pointer" onClick={()=>setP1SortDesc(!p1SortDesc)}>Added at {p1SortDesc?"▼":"▲"}</th><th className="p-2">History</th></tr></thead><tbody>{filteredP1Comments.map(c=><React.Fragment key={c.id}><tr className="border-b align-top">
          <td className="p-2 font-bold">{c.wilayat}</td>
          <td className="p-2 [overflow-wrap:anywhere]">{labelFor(c.wilayat,c.institution)}</td>
          <td className="p-2">{c.topic}</td><td className="p-2">{c.period}</td><td className="p-2 font-bold">{c.score}</td>
          <td className="p-2"><div className="[overflow-wrap:anywhere]">{c.comment ? c.comment : <span className="text-[var(--muted)] italic">No comment</span>}</div><div className="mt-2 border-t pt-1 text-xs text-[var(--muted)] leading-tight"><div>Audited by: {c.auditorName||"—"}</div><div>Added at: {c.auditedAt?formatMuscat(c.auditedAt):"—"}</div></div></td>
          <td className="p-2 font-semibold [overflow-wrap:anywhere]">{c.auditorName||"—"}</td>
          <td className="p-2 whitespace-nowrap text-xs"><div>{c.auditedAt?formatMuscat(c.auditedAt):"—"}</div><div className="text-[10px] text-[var(--muted)]">{c.auditedAt||""}</div></td>
          <td className="p-2">{c.history && c.history.length>0 ? <button onClick={()=>setExpandedHistoryId(expandedHistoryId===c.id?null:c.id)} className="rounded-full border px-2 py-1 text-xs font-bold flex items-center gap-1"><History size={12}/>{c.history.length}</button> : <span className="text-xs text-[var(--muted)]">—</span>}</td>
        </tr>
        {expandedHistoryId===c.id && c.history && <tr className="bg-[var(--surface2)]"><td colSpan={9} className="p-3"><p className="text-xs font-bold">History (last {c.history.length})</p><div className="mt-2 space-y-1">{c.history.map((h,i)=><div key={i} className="rounded border bg-white p-2 text-xs"><span className="font-bold">{h.score}</span> — {h.comment||"No comment"} <span className="text-[var(--muted)]">| Audited by: {h.auditorName} | Added at: {formatMuscat(h.auditedAt)}</span></div>)}</div></td></tr>}
        </React.Fragment>)}</tbody></table></div></>}
      </section>}

      {tab==="Plans" && isAdmin && <section className="grid gap-4 lg:grid-cols-5"><form onSubmit={createPlan} className="card p-4 lg:col-span-2"><h2 className="flex items-center gap-2 font-extrabold"><Settings2 size={18}/> Create new plan</h2><p className="mt-2 text-sm text-[var(--muted)]">All plans are Monthly: Jan–Dec, 12 months. No other schedule. {dbMode}</p><label className="mt-3 block text-sm font-bold">Topic<select value={newPlan.topic} onChange={e=>setNewPlan({...newPlan,topic:e.target.value})} className="mt-1 w-full">{TOPICS.map(t=><option key={t}>{t}</option>)}</select></label><label className="mt-3 block text-sm font-bold">Year<select value={newPlan.year} onChange={e=>setNewPlan({...newPlan,year:Number(e.target.value)})} className="mt-1 w-full">{YEARS.map(y=><option key={y} value={y}>{y}</option>)}</select></label><p className="mt-2 text-xs text-[var(--muted)]">Months: {MONTHS.join(", ")}</p><button disabled={busy} className="mt-4 w-full rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white disabled:opacity-50"><Plus className="mr-1 inline" size={16}/>Create plan</button><button type="button" onClick={loadDemo} disabled={busy} className="mt-2 w-full rounded-lg border py-2.5 font-bold">Load demo plans + sample scores</button></form><div className="card p-4 lg:col-span-3"><h2 className="font-extrabold">All plans ({plans.length})</h2>{plans.length===0?<p className="mt-2 text-sm text-[var(--muted)]">No plans yet. Create one, or load the demo plans.</p>:<div className="mt-3 space-y-2">{[...plans].sort((a,b)=>a.topic.localeCompare(b.topic)||a.year-b.year).map(p=><div key={p.id} className="flex flex-wrap items-center gap-2 rounded-lg border p-3 text-sm"><span className="font-bold">{p.topic}</span><span>{p.year} · Monthly · 12 months</span>{p.active?<span className="chip bg-green-100 text-green-800">Active</span>:<button onClick={()=>setActivePlan(p)} className="rounded-full border px-2 py-1 font-bold">Set active</button>}<button onClick={()=>{setTopic(p.topic); setPlanId(p.id); setTab("Audit Grid");}} className="ml-auto rounded-full bg-[var(--surface2)] px-3 py-1 font-bold">Open grid</button><button onClick={()=>deletePlan(p)} className="rounded-full border border-red-200 px-2 py-1 font-bold text-red-700">Delete</button></div>)}</div>}</div></section>}
      </>}

      {initialLoadDone && tab!=="Control Panel" && tab!=="Guide" && part==="2" && <>
      <section className="card mb-4 p-3 sm:p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full"><label className="text-xs font-bold uppercase text-[var(--muted)]">Category</label><div className="mt-1 flex flex-wrap gap-1">{CATEGORIES.map(c=><button key={c} onClick={()=>setCategory(c)} className={`rounded-full px-3 py-1.5 text-sm font-bold ${category===c?"bg-[var(--teal)] text-white":"border border-[var(--line)]"}`}>{c} ({(effComp[c]||[]).length})</button>)}</div></div>
          <label className="min-w-[220px] flex-1 text-sm font-bold">Plan<select value={activeCompPlan?.id||""} onChange={e=>setCompPlanId(e.target.value)} className="mt-1 w-full"><option value="">No plan for this category</option>{compPlans.filter(p=>p.category===category).map(p=><option key={p.id} value={p.id}>{p.year} · Monthly · 12 months · {feedbackCount(p)} Feedback · {getBlocks(p).length} blocks{p.active?" · Active":""}</option>)}</select></label>
          {isAdmin && <label className="text-sm font-bold">Wilayat filter<select value={wilayatFilter} onChange={e=>setWilayatFilter(e.target.value)} className="mt-1"><option value="All">All Wilayats</option>{WILAYAT_ORDER.map(w=><option key={w} value={w}>{w}</option>)}</select></label>}
          <label className="flex-1 min-w-[180px] text-sm font-bold"><span className="flex items-center gap-1"><Search size={14}/> Search institution</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="e.g. Saham RMC" className="mt-1 w-full"/></label>
          <div className="flex gap-2"><button onClick={exportCSV} disabled={!activeCompPlan} className="rounded-lg bg-[var(--blue)] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><Download className="mr-1 inline" size={16}/>Export CSV</button><button onClick={()=>activeCompPlan && exportCompPlanToWord(activeCompPlan)} disabled={!activeCompPlan} className="rounded-lg bg-[var(--teal)] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"><Download className="mr-1 inline" size={16}/>Export Plan to Word (.doc)</button><button onClick={()=>setPrintView(!printView)} className="rounded-lg border px-3 py-2 text-sm font-bold">{printView?"Exit print view":"Print-friendly view"}</button></div>
        </div>
        {!activeCompPlan && <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">No plan yet for <strong>{category}</strong>. {isAdmin?"Create one in Plans, or load the demo plans below.":"Ask the Admin to create a plan for this category."} {isAdmin && <button onClick={loadDemoComp} disabled={busy} className="ml-2 rounded bg-[var(--teal)] px-2 py-1 font-bold text-white disabled:opacity-50">Load demo Part 2 plans</button>}</div>}
        {activeCompPlan && <p className="mt-3 text-xs text-[var(--muted)]">All plans are Monthly Jan–Dec. Repeated procedures in consecutive months form one block — one score covers the whole block. Feedback months (purple) have no procedure and cannot receive scores. Skipped months are grey. {dbMode}</p>}
      </section>

      {tab==="Dashboard" && <div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{compCategoryStats.map(s=><article key={s.category} className="card p-4"><p className="text-sm font-bold text-[var(--muted)]">{s.category}</p><p className="mt-1 text-xs text-[var(--muted)]">{s.plan?`${s.plan.year} · Monthly · 12 months · ${feedbackCount(s.plan)} Feedback · ${s.blocks.length} blocks`:"No plan yet"}</p><p className="mt-2 text-3xl font-black">{s.completion.toFixed(1)}%</p><p className="mt-1 text-sm">Completion</p><p className="mt-1 text-sm">Audits conducted: <strong>{s.count}</strong> <span className="text-[var(--muted)]">(procedure blocks with a score)</span></p><p className="text-sm">Institutions: {s.total} · Missing blocks: {s.missing}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface2)]"><div className="h-full bg-[var(--teal)]" style={{width:`${Math.min(100,s.completion)}%`}}/></div><button onClick={()=>{setCategory(s.category); setTab("Audit Grid");}} className="mt-3 rounded-full bg-[var(--surface2)] px-3 py-1 text-sm font-bold">Open {s.category} grid</button></article>)}</div>
        <div className="mt-4 grid gap-4 lg:grid-cols-5">
          <section className="card p-4 lg:col-span-3"><h2 className="flex items-center gap-2 font-extrabold"><BarChart3 size={18}/> Completion by Wilayat — {category}</h2><p className="text-xs text-[var(--muted)]">Current selected plan / category. Feedback and skipped months excluded. Per-procedure averages are below. {dbMode}</p><div className="mt-4 space-y-3">{compWilayatStats.map(w=><div key={w.wilayat}><div className="flex justify-between text-sm"><span className="font-bold">{w.wilayat} <span className="font-normal text-[var(--muted)]">({w.count} institutions)</span></span><span>{w.completion.toFixed(0)}% · {w.submitted} audits</span></div><div className="mt-1 h-3 overflow-hidden rounded-full bg-[var(--surface2)]"><div className="h-full bg-[var(--blue)]" style={{width:`${Math.min(100,w.completion)}%`}}/></div></div>)}</div></section>
          <section className="card p-4 lg:col-span-2"><h2 className="font-extrabold">Per-Wilayat summary</h2><div className="mt-3 space-y-2">{compWilayatStats.map(w=><div key={w.wilayat} className="rounded-lg border border-[var(--line)] p-3 text-sm"><div className="flex justify-between font-bold"><span>{w.wilayat}</span><span>{w.completion.toFixed(1)}%</span></div><div className="text-[var(--muted)]">Completion {w.completion.toFixed(1)}% · Submitted {w.submitted} · Missing {w.missing}</div></div>)}</div></section>
        </div>
        <section className="card mt-4 p-4"><h2 className="font-extrabold">Per-procedure average — {category} (one row per procedure block)</h2>{compProcedureStats.length===0?<p className="mt-2 text-sm text-[var(--muted)]">No scores yet for this plan.</p>:<div className="mt-3 overflow-auto"><table className="w-full min-w-[560px] border-collapse text-left text-sm"><thead><tr className="border-b"><th className="p-2">Procedure block</th><th className="p-2">Months</th><th className="p-2">Average</th><th className="p-2">Audits</th></tr></thead><tbody>{compProcedureStats.map(x=><tr key={`${x.range}-${x.procedure}`} className="border-b"><td className="p-2 font-semibold [overflow-wrap:anywhere]">{displayProcedure(x.procedure)}</td><td className="p-2">{x.range} • 1 procedure</td><td className="p-2 font-bold">{fmtAvg(x.avg)}</td><td className="p-2">{x.count}</td></tr>)}</tbody></table></div>}</section>
        <section className="card mt-4 p-4"><h2 className="font-extrabold">Not started — procedure blocks with no score</h2>{renderCompNotStarted(compNotStartedList)}</section>
      </div>}

      {tab==="Audit Grid" && <section className="card p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap gap-4 text-sm"><span><strong>{category}</strong> · {activeCompPlan?`${activeCompPlan.year} · Monthly · 12 months · ${activeBlocks.length} blocks`:"No plan"}</span><span>Completion <strong>{compGridStats.completion.toFixed(1)}%</strong></span><span>Audits <strong>{compGridStats.count}</strong> <span className="text-[var(--muted)]">(blocks)</span></span><span>Missing blocks <strong>{compGridStats.missing}</strong></span><span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-800">{dbMode}</span></div>
        {!activeCompPlan ? <p className="text-sm text-[var(--muted)]">Select or create a plan to see the grid.</p> : <>
          <p className="mb-2 rounded-lg bg-[var(--amber)] px-3 py-2 text-sm font-semibold">Click a cell to edit — the row stays highlighted until you Save or Exit. Grey columns are skipped. Purple columns are Obtaining Feedback. A coloured bar above consecutive months with the same procedure means they are one block — one score covers the whole block. Score + Name mandatory. Use top Refresh button for latest from shared DB.</p>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <label className="w-full text-sm font-bold sm:w-auto">Jump to institution / Wilayat<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search institution…" className="mt-1 w-full sm:w-[220px]"/></label>
            <button type="button" onClick={jumpToMyWilayat} className="rounded-full border px-3 font-bold">Jump to my Wilayat</button>
            <button type="button" onClick={()=>{setSingleMonthUserSet(true); setSingleMonthView(!singleMonthView);}} aria-pressed={singleMonthView} className={`rounded-full px-4 font-bold ${singleMonthView?"bg-[var(--teal)] text-white":"border"}`}>{singleMonthView?"Single month view: ON":"Single month view: OFF"}</button>
          </div>
          <div className="mb-2"><label className="text-xs font-bold uppercase text-[var(--muted)]">Month picker</label><div className="no-scrollbar mt-1 flex gap-1 overflow-x-auto pb-1" role="tablist" aria-label="Month picker">{MONTHS.map((m,mi)=><button key={m} type="button" onClick={()=>scrollToMonth(m)} aria-pressed={mobileMonthIdx===mi} className={`shrink-0 rounded-full px-3 text-sm font-bold ${mobileMonthIdx===mi?"bg-[var(--teal)] text-white":"border"}`}>{m}</button>)}</div></div>
          <p className="mb-2 text-sm font-semibold">← Swipe to see months → • Refresh button is always visible in top green bar second row</p>
          {singleMonthView && isMobile && activeCompPlan && <div className="mb-3 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)]"><div className="flex items-center justify-between bg-[var(--surface2)] px-3 py-2 text-sm font-extrabold"><span>{MONTHS[mobileMonthIdx]} — {category}</span><span>Tap a score to edit</span></div><div className="px-3 py-1 text-xs text-[var(--muted)]">{activeCompPlan.feedback?.[mobileMonthIdx] ? "Obtaining Feedback — no score for this month." : activeCompPlan.procedures?.[mobileMonthIdx] ? `Procedure: ${displayProcedure(activeCompPlan.procedures?.[mobileMonthIdx])}` : "Skipped month — no score."}</div>{visibleCompInstitutions.map(v=>{ const blockMap=blockScoresFor(v.wilayat,v.institution); const block=blockForMonth(activeCompPlan,mobileMonthIdx); const bs=block?blockMap.get(`${block.start}-${block.end}`):undefined; const isEditingRow=!!selectedCell && selectedCell.part==="2" && selectedCell.wilayat===v.wilayat && selectedCell.institution===v.institution; const disabled=!!activeCompPlan.feedback?.[mobileMonthIdx] || !activeCompPlan.procedures?.[mobileMonthIdx]; return <div key={v.wilayat+v.institution} className={`single-month-row flex items-center gap-2 border-b px-3 py-2 ${isEditingRow?"bg-[var(--highlight)]":""}`}><div className="min-w-0 flex-1"><div className="font-bold [overflow-wrap:anywhere]">{labelFor(v.wilayat,v.institution)}</div><div className="text-xs text-[var(--muted)]">{v.wilayat} · Audits: {blockMap.size} blocks{bs && bs.period!==MONTHS[mobileMonthIdx] ? ` · Covered in ${bs.period}` : ""}</div></div><button type="button" disabled={disabled} onClick={()=>openCell(v,MONTHS[mobileMonthIdx],"2",category)} className="single-month-cell shrink-0 rounded-lg border px-3 font-bold disabled:opacity-50" style={bs && bs.period===MONTHS[mobileMonthIdx]?scoreColor(bs.score):{}}>{disabled?"—":bs? (bs.period===MONTHS[mobileMonthIdx]?bs.score:`Covered: ${bs.score}`) : "Tap to enter"}</button></div>; })}</div>}
          <div ref={gridRef} className={`gridwrap ${singleMonthView && isMobile ? "hidden" : ""}`}><table className="excel"><thead>
            <tr><th rowSpan={3}>Institution</th><th rowSpan={3}>Wilayat</th><th rowSpan={3}>Number of Audits<br/><span style={{fontWeight:400, fontSize:11}}>blocks</span></th>
            {compHeaderSegments.map((seg,idx)=> seg.type==="block" ? <th key={idx} colSpan={seg.end-seg.start+1} style={{background:"#dbeafe", color:"#1e3a8a", borderBottom:"3px solid #2563eb"}}><span className="[overflow-wrap:anywhere]">{displayProcedure(seg.procedure)}</span><span className="block text-[11px] font-bold">{blockLabel({start:seg.start,end:seg.end,procedure:seg.procedure||"",months:[]}) } • 1 procedure</span></th>
            : seg.type==="feedback" ? <th key={idx} style={{background:"#ede9fe", color:"#5b21b6"}}>Obtaining Feedback</th>
            : <th key={idx} style={{background:"#e5e7eb",color:"#6b7280"}}>— Skipped —</th>)}
            </tr>
            <tr>{activeCompPlan.periods.map((p,i)=> activeCompPlan.feedback?.[i] ? <th key={p} style={{background:"#ede9fe",color:"#5b21b6"}}>Obtaining Feedback</th> : activeCompPlan.procedures?.[i] ? <th key={p}>{displayProcedure(activeCompPlan.procedures?.[i])}</th> : <th key={p} style={{background:"#e5e7eb",color:"#6b7280"}}>— Skipped —</th>)}</tr>
            <tr>{activeCompPlan.periods.map((p,i)=> <th key={p} style={activeCompPlan.feedback?.[i]?{background:"#ede9fe",color:"#5b21b6"}: activeCompPlan.procedures?.[i]?{}:{background:"#e5e7eb",color:"#6b7280"}}>{p}</th>)}</tr>
          </thead><tbody>
            <tr style={{background:"var(--surface2)"}}><td><strong>PERIOD AVERAGE</strong></td><td><strong>—</strong></td><td><strong>{compGridStats.count}</strong></td>{activeCompPlan.periods.map((p,i)=>{
              if(activeCompPlan.feedback?.[i]) return <td key={p} style={{background:"#ede9fe",color:"#5b21b6"}}><strong>—</strong></td>;
              if(!activeCompPlan.procedures?.[i]) return <td key={p} style={{background:"#e5e7eb",color:"#6b7280"}}><strong>—</strong></td>;
              const block=blockForMonth(activeCompPlan,i)!;
              if(i!==block.start) return <td key={p} style={{background:"#f1f5f9",color:"#64748b"}}><span className="text-[11px]">Covered in block</span></td>;
              const nums: number[]=[];
              visibleCompInstitutions.forEach(v=>{ const bs=findBlockScore(v.wilayat,v.institution,block); if(bs && bs.score!=="NA"){ const n=parseFloat(bs.score); if(!isNaN(n)) nums.push(n); }});
              return <td key={p}><strong>{nums.length?(nums.reduce((a,b)=>a+b,0)/nums.length).toFixed(2)+"%":"—"}</strong></td>;
            })}</tr>
            {visibleCompInstitutions.map(v=>{
              const blockMap=blockScoresFor(v.wilayat,v.institution);
              const isEditingRow = !!selectedCell && selectedCell.part==="2" && selectedCell.wilayat===v.wilayat && selectedCell.institution===v.institution;
              return <tr key={v.wilayat+v.institution} className={isEditingRow?"editing-row":""} aria-current={isEditingRow?"true":undefined}><td>{labelFor(v.wilayat,v.institution)}</td><td>{v.wilayat}</td><td>{blockMap.size}</td>{activeCompPlan.periods.map((p,idx)=>{
                if(activeCompPlan.feedback?.[idx]) return <td key={p} style={{background:"#ede9fe",color:"#5b21b6"}} title="Feedback month — no procedure"><span className="text-[11px] font-bold">Feedback</span><span className="block text-[10px]">No procedure</span></td>;
                if(!activeCompPlan.procedures?.[idx]) return <td key={p} style={{background:"#e5e7eb",color:"#9ca3af"}} title="Skipped period — no procedure, cannot receive a score">—</td>;
                const block=blockForMonth(activeCompPlan,idx)!;
                const bs=blockMap.get(`${block.start}-${block.end}`);
                const isEditingCell = isEditingRow && selectedCell!.period===p;
                if(bs && bs.period!==p){
                  return <td key={p} className={isEditingCell?"editing-cell":""} style={{background:"#eef2ff"}}><button className="cellBtn" aria-pressed={isEditingCell} onClick={()=>openCell(v,p,"2",category)} title={`Covered — score ${bs.score} in ${bs.period}. Click to replace the block score.`}><span className="block text-[11px] leading-tight">Covered — score in {bs.period}</span></button></td>;
                }
                const c=bs && bs.period===p ? bs : undefined;
                const tooltip = c ? `Score: ${c.score}${c.comment?`\nComment: ${c.comment}`:""}\nAudited by: ${c.auditorName||"—"}\nAdded at: ${c.auditedAt?formatMuscat(c.auditedAt):"—"}` : `Procedure: ${displayProcedure(activeCompPlan.procedures?.[idx])} — Block ${blockLabel(block)} — Click to enter score`;
                return <td key={p} className={isEditingCell?"editing-cell":""} style={c?scoreColor(c.score):{background:"#f6f8f8"}}><button className={`cellBtn ${c?.comment?"hasComment":""}`} aria-pressed={isEditingCell} onClick={()=>openCell(v,p,"2",category)} title={tooltip}>{c?c.score:""}</button></td>;
              })}</tr>
            })}
          </tbody></table></div>
          <p className="mt-2 text-xs text-[var(--muted)]">Click any non-skipped, non-feedback cell to enter Score (0–100 or NA, mandatory), Comment (optional), Name (mandatory). Hover shows Audited by / Added at in Muscat time. One score in a block covers all months in that block. Feedback and skipped months are excluded from completion and averages. {dbMode}</p>
          {selectedCell && selectedCell.part==="2" && !isMobile && <div className="mt-4 rounded-xl border border-[var(--teal)] bg-[var(--surface2)] p-4">
            <div className="flex justify-between gap-3"><h3 className="font-extrabold">Edit audit — {labelFor(selectedCell.wilayat,selectedCell.institution)} · {selectedCell.category||category} · {selectedCell.period} · {displayProcedure(activeCompPlan.procedures?.[activeCompPlan.periods.indexOf(selectedCell.period)])} {selectedBlock ? `· Block ${blockLabel(selectedBlock)}` : ""}</h3><button onClick={()=>setSelectedCell(null)} aria-label="Close editor"><X/></button></div>
            {selectedBlockOtherScore && <div className="mt-2 rounded-lg bg-amber-100 p-2 text-xs font-semibold text-amber-900">This procedure already scored in {selectedBlockOtherScore.period} ({selectedBlockOtherScore.score} by {selectedBlockOtherScore.auditorName||"—"}). Entering here will replace it — the block score becomes the new entry, with history kept.</div>}
            {findCompScore(selectedCell.wilayat,selectedCell.institution,selectedCell.period)?.auditedAt && <div className="mt-2 rounded-lg bg-white p-2 text-xs"><span className="font-bold">Previous:</span> Audited by {findCompScore(selectedCell.wilayat,selectedCell.institution,selectedCell.period)?.auditorName} at {formatMuscat(findCompScore(selectedCell.wilayat,selectedCell.institution,selectedCell.period)?.auditedAt)}</div>}
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-bold">Score (0–100 or NA) <span className="text-red-600">* Mandatory</span><input value={scoreInput} onChange={e=>setScoreInput(e.target.value)} placeholder="e.g. 95.64 or NA" className={`mt-1 w-full ${!isScoreValid(scoreInput) && scoreInput!=="" ? "border-red-500" : ""}`}/><span className="mt-1 block text-[11px] text-[var(--muted)]">Mandatory — number 0–100 or NA</span></label>
              <label className="text-sm font-bold">Your Name / Auditor Name <span className="text-red-600">* Mandatory</span><input value={auditorNameInput} onChange={e=>setAuditorNameInput(e.target.value)} placeholder="e.g. Salim Al Mamari" className={`mt-1 w-full ${!isNameValid(auditorNameInput) && auditorNameInput!=="" ? "border-red-500" : ""}`}/><span className="mt-1 block text-[11px] text-[var(--muted)]">Mandatory — will be shown as Audited by</span></label>
              <label className="text-sm font-bold">Comment <span className="text-[var(--muted)]">(Optional)</span><textarea value={commentInput} onChange={e=>setCommentInput(e.target.value)} rows={3} placeholder="Add a comment for this audit... (optional)" className="mt-1 w-full"/></label>
            </div>
            <div className="mt-2 rounded bg-white p-2 text-xs text-[var(--muted)]"><div className="font-bold text-[var(--ink)]">How it will appear:</div><div className="mt-1">Audited by: {auditorNameInput.trim()||"—"}</div><div>Added at: {formatMuscat(new Date().toISOString())}</div></div>
            <div className="mt-3 flex flex-wrap gap-2"><button onClick={saveCell} disabled={busy || !isScoreValid(scoreInput) || !isNameValid(auditorNameInput)} className="rounded-lg bg-[var(--teal)] px-4 py-2 font-bold text-white disabled:opacity-50"><CheckCircle2 className="mr-1 inline" size={16}/>{busy?"Saving…":"Save audit"}</button><button type="button" onClick={()=>setSelectedCell(null)} disabled={busy} className="rounded-lg border px-3 py-2 font-bold">Cancel</button>{findCompScore(selectedCell.wilayat,selectedCell.institution,selectedCell.period) && <button onClick={deleteScore} disabled={busy} className="rounded-lg border border-red-300 px-3 py-2 font-bold text-red-700"><Trash2 className="mr-1 inline" size={16}/>Remove entry</button>}</div>
          </div>}
        </>}
      </section>}

      {tab==="Comments" && <section className="card p-4">
        <h2 className="flex items-center gap-2 font-extrabold"><MessageSquare size={18}/> Comments — {category}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">Part 2 comments show one row per procedure block (latest score in the block), with Auditor Name and Muscat timestamp. Filter by auditor, sort by Added at. Feedback months never appear. {dbMode}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="flex items-center gap-2 text-sm font-bold"><Filter size={14}/> Audited by:<input value={p2AuditorFilter} onChange={e=>setP2AuditorFilter(e.target.value)} placeholder="Filter auditor name…" className="text-sm"/></label>
          <button onClick={()=>setP2SortDesc(!p2SortDesc)} className="rounded-lg border px-3 py-1.5 text-sm font-bold">{p2SortDesc?"Newest first":"Oldest first"}</button>
          <span className="text-xs text-[var(--muted)] self-center">{filteredP2Comments.length} entries • {dbMode}</span>
        </div>
        {filteredP2Comments.length===0?<p className="mt-4 text-sm">No audits yet for this selection.</p>:<>
        <div className="mt-3 space-y-3 sm:hidden">{filteredP2Comments.map(c=><article key={c.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3"><div className="flex items-start justify-between gap-2"><div><p className="font-extrabold [overflow-wrap:anywhere]">{labelFor(c.wilayat,c.institution)} — {c.procedure?displayProcedure(c.procedure):c.category}</p><p className="text-xs text-[var(--muted)]">{c.wilayat} · {c.category} · {c.period}</p></div><span className="shrink-0 rounded-full bg-[var(--surface2)] px-3 py-1 font-black">{c.score}</span></div><p className="mt-2 text-sm [overflow-wrap:anywhere]">{c.comment || "No comment"}</p><p className="mt-2 text-xs text-[var(--muted)]">Audited by: {c.auditorName||"—"} · Added at: {c.auditedAt?formatMuscat(c.auditedAt):"—"}</p>{c.history && c.history.length>0 && <button onClick={()=>setExpandedHistoryId(expandedHistoryId===c.id?null:c.id)} className="mt-2 rounded-full border px-3 text-xs font-bold">History ({c.history.length})</button>}{expandedHistoryId===c.id && c.history && <div className="mt-2 space-y-1">{c.history.map((h,i)=><div key={i} className="rounded border bg-[var(--surface2)] p-2 text-xs"><span className="font-bold">{h.score}</span> — {h.comment||"No comment"} · {h.auditorName} · {formatMuscat(h.auditedAt)}</div>)}</div>}</article>)}</div>
        <div className="mt-3 hidden overflow-auto sm:block"><table className="w-full min-w-[1000px] border-collapse text-left text-sm"><thead><tr className="border-b"><th className="p-2">Wilayat</th><th className="p-2">Institution</th><th className="p-2">Category</th><th className="p-2">Period</th><th className="p-2">Procedure</th><th className="p-2">Score</th><th className="p-2 min-w-[260px]">Comment + Audit trail</th><th className="p-2">Audited by</th><th className="p-2 cursor-pointer" onClick={()=>setP2SortDesc(!p2SortDesc)}>Added at {p2SortDesc?"▼":"▲"}</th><th className="p-2">History</th></tr></thead><tbody>{filteredP2Comments.map(c=><React.Fragment key={c.id}><tr className="border-b align-top">
          <td className="p-2 font-bold">{c.wilayat}</td><td className="p-2 [overflow-wrap:anywhere]">{labelFor(c.wilayat,c.institution)}</td><td className="p-2">{c.category}</td><td className="p-2">{c.period}</td><td className="p-2 [overflow-wrap:anywhere]">{displayProcedure(c.procedure)}</td><td className="p-2 font-bold">{c.score}</td>
          <td className="p-2"><div className="[overflow-wrap:anywhere]">{c.comment ? c.comment : <span className="text-[var(--muted)] italic">No comment</span>}</div><div className="mt-2 border-t pt-1 text-xs text-[var(--muted)] leading-tight"><div>Audited by: {c.auditorName||"—"}</div><div>Added at: {c.auditedAt?formatMuscat(c.auditedAt):"—"}</div></div></td>
          <td className="p-2 font-semibold [overflow-wrap:anywhere]">{c.auditorName||"—"}</td>
          <td className="p-2 whitespace-nowrap text-xs"><div>{c.auditedAt?formatMuscat(c.auditedAt):"—"}</div><div className="text-[10px] text-[var(--muted)]">{c.auditedAt||""}</div></td>
          <td className="p-2">{c.history && c.history.length>0 ? <button onClick={()=>setExpandedHistoryId(expandedHistoryId===c.id?null:c.id)} className="rounded-full border px-2 py-1 text-xs font-bold flex items-center gap-1"><History size={12}/>{c.history.length}</button> : <span className="text-xs text-[var(--muted)]">—</span>}</td>
        </tr>
        {expandedHistoryId===c.id && c.history && <tr className="bg-[var(--surface2)]"><td colSpan={10} className="p-3"><p className="text-xs font-bold">History (last {c.history.length})</p><div className="mt-2 space-y-1">{c.history.map((h,i)=><div key={i} className="rounded border bg-white p-2 text-xs"><span className="font-bold">{h.score}</span> — {h.comment||"No comment"} <span className="text-[var(--muted)]">| Audited by: {h.auditorName} | Added at: {formatMuscat(h.auditedAt)}</span></div>)}</div></td></tr>}
        </React.Fragment>)}</tbody></table></div></>}
      </section>}

      {tab==="Plans" && isAdmin && <section className="grid gap-4 lg:grid-cols-5">
        <form onSubmit={createCompPlan} className="card p-4 lg:col-span-2"><h2 className="flex items-center gap-2 font-extrabold"><Settings2 size={18}/> Create Part 2 plan — Monthly only</h2><p className="mt-1 text-sm text-[var(--muted)]">All plans are Monthly Jan–Dec. Assign one procedure per month; repeating it in consecutive months makes one block. Tick Feedback for months with no procedure. {dbMode}</p>
          <label className="mt-3 block text-sm font-bold">Category<select value={newCompPlan.category} onChange={e=>setNewCompPlan({...newCompPlan,category:e.target.value})} className="mt-1 w-full">{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></label>
          <label className="mt-3 block text-sm font-bold">Year<select value={newCompPlan.year} onChange={e=>setNewCompPlan({...newCompPlan,year:Number(e.target.value)})} className="mt-1 w-full">{YEARS.map(y=><option key={y} value={y}>{y}</option>)}</select></label>
          <div className="mt-3 space-y-3">
            {MONTHS.map((m,idx)=><div key={m} className="rounded-lg border p-2"><div className="flex items-center justify-between"><span className="text-sm font-bold">{m}</span><label className="flex items-center gap-1 text-xs font-bold"><input type="checkbox" checked={!!newCompPlan.feedback[idx]} onChange={e=>{ const nf=[...newCompPlan.feedback]; nf[idx]=e.target.checked; const np=[...newCompPlan.procedures]; if(e.target.checked) np[idx]=null; setNewCompPlan({...newCompPlan,feedback:nf,procedures:np}); }} className="w-auto"/> Feedback</label></div>
            {newCompPlan.feedback[idx] ? <p className="mt-1 text-xs text-purple-700 font-bold">Obtaining Feedback — no procedure, no score allowed</p> : <div className="mt-1"><ProcedurePicker value={newCompPlan.procedures[idx]} category={newCompPlan.category} procedures={effectiveProcedures} displayProc={displayProcedure} onChange={(v)=>{ const np=[...newCompPlan.procedures]; np[idx]=v; setNewCompPlan({...newCompPlan,procedures:np}); }}/></div>}
            </div>)}
          </div>
          <button disabled={busy} className="mt-4 w-full rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white disabled:opacity-50"><Plus className="mr-1 inline" size={16}/>Create plan</button>
          <button type="button" onClick={loadDemoComp} disabled={busy} className="mt-2 w-full rounded-lg border py-2.5 font-bold">Load demo Part 2 plans + sample scores</button>
        </form>
        <div className="card p-4 lg:col-span-3">
          <h2 className="font-extrabold">All Part 2 plans ({compPlans.length}) — {dbMode}</h2>
          {compPlans.length===0?<p className="mt-2 text-sm text-[var(--muted)]">No plans yet. Create one, or load the demo plans.</p>:<div className="mt-3 space-y-3">
            {[...compPlans].sort((a,b)=>a.category.localeCompare(b.category)||a.year-b.year).map(p=>{
              const blocks=getBlocks(p);
              const isEditing = editingCompPlanId===p.id;
              return <div key={p.id} className="rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2"><span className="font-bold">{p.category}</span><span>{compPlanSummary(p)}</span>{p.active?<span className="chip bg-green-100 text-green-800">Active</span>:<button onClick={()=>setActiveCompPlan(p)} className="rounded-full border px-2 py-1 font-bold">Set active</button>}<button onClick={()=>{setCategory(p.category); setCompPlanId(p.id); setTab("Audit Grid");}} className="ml-auto rounded-full bg-[var(--surface2)] px-3 py-1 font-bold">Open grid</button><button onClick={()=>startEditCompPlan(p)} className="rounded-full border px-2 py-1 font-bold">Edit procedures</button><button onClick={()=>deleteCompPlan(p)} className="rounded-full border border-red-200 px-2 py-1 font-bold text-red-700">Delete</button></div>
                <div className="mt-2 flex flex-wrap gap-1">{p.periods.map((per,i)=> <span key={per} className={`rounded-full px-2 py-0.5 text-xs ${p.feedback?.[i] ? "bg-purple-100 text-purple-800" : p.procedures?.[i] ? "bg-blue-50 text-blue-900" : "bg-gray-100 text-gray-500"}`}>{per}: {p.feedback?.[i] ? "Feedback" : displayProcedure(p.procedures?.[i])}</span>)}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">Blocks: {blocks.map(b=>`${blockLabel(b)}=${displayProcedure(b.procedure)}`).join(" · ") || "None — all skipped/feedback"}</div>
                {isEditing && <div className="mt-3 rounded-xl border bg-[var(--surface2)] p-3">
                  {editWarn && <p className="mb-2 rounded bg-amber-100 p-2 text-xs font-bold text-amber-900">{editWarn}</p>}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {MONTHS.map((m,idx)=><div key={m} className="rounded-lg border bg-white p-2"><div className="flex items-center justify-between"><span className="text-xs font-bold">{m}</span><label className="flex items-center gap-1 text-xs font-bold"><input type="checkbox" checked={!!editingFeedback[idx]} onChange={e=>{ const nf=[...editingFeedback]; nf[idx]=e.target.checked; const np=[...editingProcedures]; if(e.target.checked) np[idx]=null; setEditingFeedback(nf); setEditingProcedures(np); }} className="w-auto"/> Feedback</label></div>
                    {editingFeedback[idx] ? <p className="mt-1 text-xs text-purple-700 font-bold">Obtaining Feedback</p> : <div className="mt-1"><ProcedurePicker value={editingProcedures[idx]} category={p.category} procedures={effectiveProcedures} displayProc={displayProcedure} onChange={(v)=>{ const np=[...editingProcedures]; np[idx]=v; setEditingProcedures(np); }}/></div>}
                    </div>)}
                  </div>
                  <div className="mt-2 flex gap-2"><button onClick={saveEditCompPlan} disabled={busy} className="rounded-lg bg-[var(--teal)] px-3 py-1.5 font-bold text-white disabled:opacity-50">Save procedure changes</button><button onClick={()=>setEditingCompPlanId("")} className="rounded-lg border px-3 py-1.5 font-bold">Cancel</button></div>
                </div>}
              </div>;
            })}
          </div>}
        </div>
      </section>}
      </>}

      {/* Footer Database Mode */}
      <footer className="mt-8 border-t border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-center text-xs font-bold text-[var(--muted)]">
        <span className="rounded-full bg-green-100 px-3 py-1 text-green-900">{dbMode}</span> • All data stored in shared backend database (records API) with cache-busting • No localStorage • Refresh button always visible in top green bar second row • Phone A saves → Phone B taps Refresh → sees score
      </footer>

      {/* Mobile bottom nav with middle Refresh */}
      <nav className="sm:hidden noprint fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--line)] bg-[var(--surface)] px-2 py-2">
        <div className="mx-auto flex max-w-[1500px] items-center justify-around gap-1">
          <button onClick={()=>setTab("Dashboard")} className={`flex flex-col items-center rounded-lg px-2 py-1 text-[11px] font-bold ${tab==="Dashboard"?"text-[var(--teal)] bg-[var(--surface2)]":"text-[var(--muted)]"}`}><BarChart3 size={18}/><span>Dashboard</span></button>
          <button onClick={()=>setTab("Audit Grid")} className={`flex flex-col items-center rounded-lg px-2 py-1 text-[11px] font-bold ${tab==="Audit Grid"?"text-[var(--teal)] bg-[var(--surface2)]":"text-[var(--muted)]"}`}><ClipboardCheck size={18}/><span>Grid</span></button>
          <button type="button" onClick={()=>manualRefreshRef.current()} disabled={refreshing} title="Tap to refresh scores from database" className="flex flex-col items-center rounded-full bg-[var(--teal)] px-4 py-2 text-[11px] font-black text-white shadow border-2 border-white disabled:opacity-60" style={{minHeight:44}}><RefreshCw size={18} className={refreshing?"animate-spin":""}/><span>⟳ Refresh</span></button>
          <button onClick={()=>setTab("Comments")} className={`flex flex-col items-center rounded-lg px-2 py-1 text-[11px] font-bold ${tab==="Comments"?"text-[var(--teal)] bg-[var(--surface2)]":"text-[var(--muted)]"}`}><MessageSquare size={18}/><span>Comments</span></button>
          {isAdmin && <button onClick={()=>setTab("Plans")} className={`flex flex-col items-center rounded-lg px-2 py-1 text-[11px] font-bold ${tab==="Plans"?"text-[var(--teal)] bg-[var(--surface2)]":"text-[var(--muted)]"}`}><Settings2 size={18}/><span>Plans</span></button>}
        </div>
        <div className="mt-1 text-center text-[10px] font-semibold text-[var(--muted)]">{liveStatus==="offline" ? "Offline — last saved data" : liveStatus==="refreshing" ? refreshMsg : `Live • ${formatLiveTime(lastUpdatedAt)} • ${refreshMsg || dbMode}`}</div>
      </nav>

      {/* Floating Refresh FAB above bottom nav for mobile - extra visibility */}
      <button type="button" onClick={()=>manualRefreshRef.current()} disabled={refreshing} title="Tap to refresh scores from database" aria-label="Refresh scores from database" className="sm:hidden fixed bottom-[84px] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--teal)] text-white shadow-xl border-2 border-white disabled:opacity-60" style={{minHeight:56}}>
        <RefreshCw size={22} className={refreshing?"animate-spin":""}/>
      </button>
    </main>
    </>
    }
    {showHelp && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 pt-[max(1rem,var(--safe-area-inset-top))] pb-6"><div className="min-h-full flex items-center justify-center px-3"><div className="w-full max-w-xl rounded-2xl bg-[var(--surface)] p-5 shadow-2xl"><div className="flex justify-between"><h2 className="text-lg font-black">How to use — Monthly plans, blocks &amp; Feedback</h2><button onClick={()=>setShowHelp(false)} aria-label="Close help"><X/></button></div><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed"><li><strong>Plans are Monthly:</strong> Jan–Dec, 12 months. Create a plan with Category/Topic + Year only.</li><li><strong>Part 2 blocks:</strong> Assign the same procedure to consecutive months (e.g. Jan–Mar Neurological assessment). Those months form one block — the header shows a coloured bar with “Jan-Mar • 1 procedure”. Enter one score in any month in the block and the whole block is done; other months show “Covered — score in [Month]” and are not counted as missing.</li><li><strong>Replacing a block score:</strong> Enter a score in another month of the same block. The new entry becomes the block score, with history kept. Entering in the same month overwrites that month.</li><li><strong>Obtaining Feedback:</strong> In Plan creation/edit, tick “Obtaining Feedback” for a month (or use “Set month to Feedback”). That month shows “Obtaining Feedback” in purple, has no procedure, cannot receive a score, and never counts as missing. Untick to restore a procedure. A Feedback month breaks a block.</li><li><strong>Live refresh — FIXED:</strong> Scores now stored ONLY in shared database (records API) with cache-busting. No localStorage. Shared link on two phones reads SAME database. Auto-poll every 10s + manual Refresh button. Refresh button is UNMISSABLE: top green bar second row full width (white background teal text strong shadow 44px min height) + bottom nav middle + floating FAB bottom 84px right 4. Title attribute “Tap to refresh scores from database”. Tap Refresh on Phone B to see Phone A’s new score instantly.</li><li><strong>Edit cell — 3 fields:</strong> Score (Mandatory, 0–100 or NA), Comment (Optional), Your Name / Auditor Name (Mandatory, min 2 chars).</li><li><strong>On Save:</strong> stores score, comment, auditorName, timestamp shown as DD-MM-YYYY HH:mm in Asia/Muscat (+04:00). Overwriting keeps history (max 10) visible in Comments.</li><li><strong>CSV export:</strong> includes Audited by, Added at Muscat, Added at ISO. Feedback months show “Obtaining Feedback” / “Feedback”; covered block months show “Covered — score in [Month]”.</li><li><strong>Dashboard:</strong> Number of Audits in Part 2 counts procedure blocks with a score, not months. Averages ignore NA.</li><li><strong>Database Mode footer:</strong> Shows “Shared Database • Live” on https:// shared link, “Local Preview — not shared” on file:// / container:// preview. All data (plans, institutions, scores, comments, auditor names, security, passwords, login attempts) ONLY in records API, never localStorage.</li></ol><button onClick={()=>setShowHelp(false)} className="mt-4 w-full rounded-lg bg-[var(--teal)] py-2.5 font-bold text-white">Got it</button></div></div></div>}
    {printView && <div className="fixed inset-0 z-40 overflow-y-auto bg-[var(--surface)] pt-[max(1rem,var(--safe-area-inset-top))] pb-6"><div className="mx-auto max-w-5xl px-4"><div className="flex justify-between"><h2 className="text-xl font-black">Print-friendly view — {part==="1" ? `${topic} · ${activePlan?.year} Monthly` : `${category} · ${activeCompPlan?.year} Monthly`}</h2><button onClick={()=>setPrintView(false)} className="rounded border px-3 py-1 font-bold">Close</button></div><p className="mt-2 text-sm">{part==="1" ? `Completion ${gridStats.completion.toFixed(1)}% · Audits ${gridStats.count} · Average ${fmtAvg(gridStats.avg)}` : `Completion ${compGridStats.completion.toFixed(1)}% · Audits ${compGridStats.count} (blocks)`}</p><div className="mt-4 space-y-2">{part==="1" ? visibleInstitutions.map(v=>{ const cells=activePlan?.periods.map(p=>findScore(v.wilayat,v.institution,p)); return <div key={v.wilayat+v.institution} className="flex justify-between border-b py-2 text-sm"><span className="font-bold [overflow-wrap:anywhere]">{labelFor(v.wilayat,v.institution)}</span><span>{cells?.map(c=>c?`${c.period}:${c.score} (${c.auditorName||""} ${c.auditedAt?formatMuscat(c.auditedAt):""})`:"").filter(Boolean).join(" · ") || "No entries"}</span></div>}) : visibleCompInstitutions.map(v=>{ const bm=blockScoresFor(v.wilayat,v.institution); const entries=[...bm.values()]; return <div key={v.wilayat+v.institution} className="flex justify-between border-b py-2 text-sm"><span className="font-bold [overflow-wrap:anywhere]">{labelFor(v.wilayat,v.institution)}</span><span>{entries.map(c=>`${c.period}:${c.score} (${c.auditorName||""} ${c.auditedAt?formatMuscat(c.auditedAt):""})`).join(" · ") || "No entries"}</span></div>})}</div></div></div>}
  </div>;
}
