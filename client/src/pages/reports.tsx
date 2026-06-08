import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2, Clock, AlertCircle, UserCheck, Shield,
  CalendarDays, Printer, ChevronLeft, ChevronRight,
  FlaskConical, Save, TrendingDown, Activity, BarChart3
} from "lucide-react";
import { format, isAfter, differenceInDays } from "date-fns";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DEFAULT_OBJECTIVE = "To review and document all pharmaceutical stability samples scheduled for the reporting period, ensuring samples have been pulled and tested in accordance with the approved stability protocol and ICH guidelines.";
const DEFAULT_SCOPE = "This report covers all stability studies registered in StabilityFlow that have time points falling within the reporting period. It includes assessment of sample compliance, identification of overdue samples, and recording of any out-of-specification (OOS) or out-of-trend (OOT) results observed.";
const DEFAULT_DISCUSSION = "Summarise the key observations for the period. Comment on any overdue samples and their justification, OOS/OOT results and associated investigations, and corrective actions taken or planned.";
const DEFAULT_CONCLUSION = "All stability samples due for the reporting period have been reviewed. Overdue and anomalous results have been documented and are subject to investigation as appropriate.";

function fmt(d: any) {
  if (!d) return "—";
  try { return format(new Date(d), "dd MMM yyyy"); } catch { return "—"; }
}
function fmtTs(d: any) {
  if (!d) return "—";
  try { return format(new Date(d), "dd MMM yyyy, HH:mm"); } catch { return "—"; }
}

// ── Sign-off Dialog ───────────────────────────────────────────────────────────
function SignoffDialog({ open, onClose, role, periodYear, periodMonth }: {
  open: boolean; onClose: () => void; role: string; periodYear: number; periodMonth: number;
}) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");

  const mut = useMutation({
    mutationFn: () => apiRequest("POST", "/api/monthly-signoffs", {
      periodYear, periodMonth, roleLabel: role,
      signedByName: name.trim(), comment: comment.trim() || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/monthly-report"] });
      toast({ title: `${role === "section_head" ? "Section Head" : "QC Manager"} sign-off recorded` });
      onClose(); setName(""); setComment("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {role === "section_head" ? <UserCheck className="h-4 w-4 text-blue-600" /> : <Shield className="h-4 w-4 text-blue-600" />}
            {role === "section_head" ? "Section Head Sign-off" : "QC Manager Sign-off"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{MONTHS[periodMonth - 1]} {periodYear}</p>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div>
            <Label className="text-xs font-medium">Full Name *</Label>
            <Input data-testid="input-signoff-name" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-medium">Comment (optional)</Label>
            <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Observations or notes for this period…" rows={3} className="mt-1 text-sm" />
          </div>
          <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded p-2">
            By signing, you confirm the stability data for {MONTHS[periodMonth - 1]} {periodYear} has been reviewed.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => mut.mutate()} disabled={!name.trim() || mut.isPending} data-testid="button-confirm-signoff">
            {mut.isPending ? "Signing…" : "Confirm Sign-off"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Print Styles (injected into <head>) ──────────────────────────────────────
const PRINT_CSS = `
@media print {
  @page {
    size: A4 portrait;
    margin: 14mm 16mm 18mm 16mm;
  }

  html, body {
    font-family: 'Helvetica Neue', Arial, sans-serif !important;
    font-size: 9pt !important;
    color: #111 !important;
    background: white !important;
    overflow: visible !important;
  }

  /* Hide sidebar, top header, and screen-only controls */
  aside, header, .no-print,
  [data-radix-toast-viewport], [data-sonner-toaster],
  [role="region"][aria-label*="Notifications"] { display: none !important; }

  /* Unlock all layout containers so content flows freely */
  #root,
  #root > *,
  #root > * > *,
  #root > * > * > * { overflow: visible !important; height: auto !important; }

  /* The outer flex row (sidebar + content column) */
  .flex.h-screen { display: block !important; }

  /* The content column (header + main) */
  .flex.flex-col.flex-1 { display: block !important; overflow: visible !important; }

  /* Main scroll container */
  main { overflow: visible !important; height: auto !important; padding: 0 !important; }

  /* Report shell */
  #report-shell {
    display: flex !important;
    flex-direction: column !important;
    height: auto !important;
    overflow: visible !important;
    background: white !important;
  }

  /* Scrollable document area */
  #report-shell > .flex-1 {
    overflow: visible !important;
    height: auto !important;
    padding: 0 !important;
  }

  .no-print { display: none !important; }
  .print-only { display: block !important; }

  /* Document wrapper */
  #report-document {
    width: 100% !important;
    max-width: none !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
    border-radius: 0 !important;
    border: none !important;
  }

  /* Header stripe */
  .doc-header-stripe {
    background: #1e3a5f !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Summary stat cards */
  .stat-card {
    border: 1px solid #d1d5db !important;
    break-inside: avoid !important;
  }

  /* Tables */
  table {
    width: 100% !important;
    border-collapse: collapse !important;
    table-layout: fixed !important;
    font-size: 8pt !important;
    break-inside: auto !important;
  }
  thead { display: table-header-group !important; }
  tr { break-inside: avoid !important; page-break-inside: avoid !important; }
  th, td {
    border: 1px solid #9ca3af !important;
    padding: 3pt 4pt !important;
    word-break: break-word !important;
    overflow-wrap: break-word !important;
    vertical-align: top !important;
  }
  th {
    background: #f3f4f6 !important;
    font-weight: 600 !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  tr:nth-child(even) td {
    background: #fafafa !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  /* Section headings don't orphan */
  .doc-section-head { break-after: avoid !important; page-break-after: avoid !important; }
  .doc-section { break-inside: avoid-page !important; margin-bottom: 10pt !important; }

  /* OOS/OOT table */
  .oos-flag-oos { color: #b91c1c !important; font-weight: 700 !important; }
  .oos-flag-oot { color: #c2410c !important; font-weight: 700 !important; }
  .status-completed { color: #15803d !important; }
  .status-overdue   { color: #b91c1c !important; }
  .status-inprog    { color: #b45309 !important; }
  .status-pending   { color: #6b7280 !important; }

  /* Signature blocks */
  .sig-block {
    border: 1px solid #374151 !important;
    break-inside: avoid !important;
  }

  /* Print-only footer per page */
  .print-page-footer {
    display: block !important;
    position: fixed !important;
    bottom: 8mm !important;
    left: 0 !important;
    right: 0 !important;
    font-size: 7pt !important;
    color: #6b7280 !important;
    border-top: 0.5pt solid #d1d5db !important;
    padding-top: 2mm !important;
    padding-left: 16mm !important;
    padding-right: 16mm !important;
  }

  /* Textarea → text paragraph */
  .editable-textarea { display: none !important; }
  .editable-print { display: block !important; }
}
`;

// ── Editable Narrative Section ────────────────────────────────────────────────
function NarrativeSection({ num, title, value, placeholder, onChange, rows = 4 }: {
  num: string; title: string; value: string; placeholder: string;
  onChange: (v: string) => void; rows?: number;
}) {
  return (
    <div className="doc-section mb-6">
      <div className="doc-section-head flex items-center gap-3 mb-2">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-bold flex-shrink-0">{num}</span>
        <h3 className="text-sm font-bold tracking-wide uppercase text-blue-900 dark:text-blue-200">{title}</h3>
      </div>
      <div className="ml-9">
        <Textarea
          className="editable-textarea w-full text-sm leading-relaxed resize-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-blue-400 transition-colors"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          data-testid={`textarea-section-${num}`}
        />
        <p className="editable-print hidden text-[9pt] leading-relaxed text-gray-800 whitespace-pre-wrap min-h-[3rem]">
          {value || placeholder}
        </p>
      </div>
    </div>
  );
}

// ── Status pill (screen + print) ──────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { cls: string; printCls: string; label: string }> = {
    completed:   { cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", printCls: "status-completed", label: "Completed" },
    in_progress: { cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",         printCls: "status-inprog",    label: "In Progress" },
    overdue:     { cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",                 printCls: "status-overdue",   label: "Overdue" },
    pending:     { cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",            printCls: "status-pending",   label: "Pending" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded ${s.cls} ${s.printCls}`}>
      {s.label}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, sub }: { label: string; value: number; color: string; sub?: string }) {
  return (
    <div className={`stat-card border rounded-lg px-4 py-3 text-center bg-white dark:bg-slate-900 ${value > 0 && (label === "Overdue" || label === "OOS / OOT") ? "border-red-200 dark:border-red-900" : "border-slate-200 dark:border-slate-700"}`}>
      <div className={`text-3xl font-bold tabular-nums ${color}`}>{value}</div>
      <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{label}</div>
      {sub && <div className="text-[10px] text-slate-400 dark:text-slate-500">{sub}</div>}
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────────────────────
function SectionDivider() {
  return <div className="border-t border-slate-200 dark:border-slate-700 my-6" />;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Reports() {
  const { toast } = useToast();
  const now = new Date();
  const [year, setYear]     = useState(now.getFullYear());
  const [month, setMonth]   = useState(now.getMonth() + 1);
  const [signoffRole, setSignoffRole] = useState<string | null>(null);
  const [dirty, setDirty]   = useState(false);
  const [saving, setSaving] = useState(false);
  const saveTimer           = useRef<any>(null);

  const [objective,  setObjective]  = useState(DEFAULT_OBJECTIVE);
  const [scope,      setScope]      = useState(DEFAULT_SCOPE);
  const [deviations, setDeviations] = useState("");
  const [discussion, setDiscussion] = useState(DEFAULT_DISCUSSION);
  const [conclusion, setConclusion] = useState(DEFAULT_CONCLUSION);

  // inject print CSS
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "report-print-css";
    el.innerHTML = PRINT_CSS;
    document.head.appendChild(el);
    return () => { document.getElementById("report-print-css")?.remove(); };
  }, []);

  const { data: report, isLoading } = useQuery<any>({
    queryKey: ["/api/monthly-report", year, month],
    queryFn: () => fetch(`/api/monthly-report?year=${year}&month=${month}`).then(r => r.json()),
  });

  useEffect(() => {
    const n = report?.notes;
    if (n) {
      if (n.objective)         setObjective(n.objective);
      if (n.scope)             setScope(n.scope);
      if (n.deviations != null) setDeviations(n.deviations || "");
      if (n.discussion)        setDiscussion(n.discussion);
      if (n.conclusion)        setConclusion(n.conclusion);
    } else {
      setObjective(DEFAULT_OBJECTIVE);
      setScope(DEFAULT_SCOPE);
      setDeviations("");
      setDiscussion(DEFAULT_DISCUSSION);
      setConclusion(DEFAULT_CONCLUSION);
    }
    setDirty(false);
  }, [report?.notes?.id, year, month]);

  const saveMut = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/monthly-report-notes?year=${year}&month=${month}`, {
      objective, scope, deviations, discussion, conclusion,
    }),
    onSuccess: () => { setSaving(false); setDirty(false); queryClient.invalidateQueries({ queryKey: ["/api/monthly-report", year, month] }); },
    onError: (e: any) => { setSaving(false); toast({ title: "Save failed", description: e.message, variant: "destructive" }); },
  });

  const scheduleAutoSave = useCallback(() => {
    setDirty(true); setSaving(true);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveMut.mutate(), 2000);
  }, [year, month]);

  const change = (setter: (v: string) => void) => (v: string) => { setter(v); scheduleAutoSave(); };

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); }

  const summary      = report?.summary || {};
  const items: any[] = report?.items || [];
  const oosOotItems: any[] = report?.oosOotItems || [];
  const overdueItems: any[] = report?.overdueItems || [];
  const signoffs: any[]    = report?.signoffs || [];
  const headSignoff  = signoffs.find(s => s.roleLabel === "section_head");
  const mgrSignoff   = signoffs.find(s => s.roleLabel === "manager");
  const bothSigned   = headSignoff && mgrSignoff;
  const docNumber    = `SF-MSR-${year}-${String(month).padStart(2, "0")}`;
  const periodLabel  = `${MONTHS[month - 1]} ${year}`;

  return (
    <div id="report-shell" className="flex flex-col h-full bg-slate-100 dark:bg-slate-950">

      {/* ── Top toolbar (no-print) ── */}
      <div className="no-print flex items-center justify-between px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm flex-shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth} data-testid="button-prev-month"><ChevronLeft className="h-4 w-4" /></Button>
            <div className="flex items-center gap-1.5 px-2">
              <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-semibold text-sm min-w-[130px] text-center">{periodLabel}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth} data-testid="button-next-month"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <span className="text-xs text-slate-400 font-mono">{docNumber}</span>
          {saving && <span className="text-xs text-slate-400 animate-pulse">Saving…</span>}
          {!saving && dirty && <span className="text-xs text-amber-500">Unsaved changes</span>}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="h-7 text-xs gap-1 bg-blue-700 hover:bg-blue-800 text-white"
            disabled={saveMut.isPending}
            onClick={() => {
              clearTimeout(saveTimer.current);
              saveMut.mutate(undefined, {
                onSuccess: () => {
                  window.open(`/api/report-print?year=${year}&month=${month}`, "_blank");
                },
              });
            }}
            data-testid="button-save-download"
          >
            <Printer className="h-3 w-3" />{saveMut.isPending ? "Saving…" : "Save & Download PDF"}
          </Button>
        </div>
      </div>

      {/* ── Scrollable document area ── */}
      <div className="flex-1 overflow-auto py-8 px-4">
        <div id="report-document" className="w-full max-w-[794px] mx-auto bg-white dark:bg-slate-900 rounded-lg shadow-[0_2px_24px_rgba(0,0,0,0.10)] dark:shadow-[0_2px_24px_rgba(0,0,0,0.4)] overflow-hidden">

          {/* Document header stripe */}
          <div className="doc-header-stripe bg-[#1e3a5f] px-8 py-5">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                  <FlaskConical className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-white font-bold text-lg leading-tight">Monthly Stability Report</div>
                  <div className="text-blue-200 text-xs mt-0.5">Pharmaceutical Stability Management — StabilityFlow</div>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <table className="text-xs text-right">
                  <tbody>
                    <tr><td className="text-blue-300 pr-2 pb-0.5">Document No:</td><td className="text-white font-mono font-semibold">{docNumber}</td></tr>
                    <tr><td className="text-blue-300 pr-2 pb-0.5">Period:</td><td className="text-white">{periodLabel}</td></tr>
                    <tr><td className="text-blue-300 pr-2 pb-0.5">Generated:</td><td className="text-white">{format(now, "dd MMM yyyy, HH:mm")}</td></tr>
                    <tr><td className="text-blue-300 pr-2">Status:</td><td className={bothSigned ? "text-emerald-300 font-semibold" : "text-amber-300"}>{bothSigned ? "✓ Fully Signed Off" : "Pending Sign-off"}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Approval / sign-off bar */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-8 py-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Section Head */}
              <div className={`sig-block rounded-lg border-2 p-4 ${headSignoff ? "border-emerald-400 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/20" : "border-dashed border-slate-300 dark:border-slate-600"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                    <UserCheck className="h-3.5 w-3.5" />Section Head
                  </div>
                  {!headSignoff && (
                    <Button size="sm" className="no-print h-6 text-xs bg-blue-700 hover:bg-blue-800 text-white" onClick={() => setSignoffRole("section_head")} data-testid="button-signoff-section-head">
                      Sign Off
                    </Button>
                  )}
                  {headSignoff && (
                    <Button size="sm" variant="outline" className="no-print h-6 text-xs" onClick={() => setSignoffRole("section_head")} data-testid="button-signoff-section-head">
                      Re-sign
                    </Button>
                  )}
                </div>
                {headSignoff ? (
                  <div className="mt-2">
                    <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">{headSignoff.signedByName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{fmtTs(headSignoff.signedAt)}</p>
                    {headSignoff.comment && <p className="text-[11px] italic text-slate-500 mt-1 border-t border-slate-200 dark:border-slate-700 pt-1">"{headSignoff.comment}"</p>}
                  </div>
                ) : (
                  <div className="mt-3 border-t border-dashed border-slate-300 dark:border-slate-600 pt-2">
                    <p className="text-[11px] text-slate-400 italic">Awaiting signature…</p>
                    <p className="mt-3 text-[10px] text-slate-400">Signature: ___________________</p>
                    <p className="text-[10px] text-slate-400">Date: ________________________</p>
                  </div>
                )}
              </div>

              {/* QC Manager */}
              <div className={`sig-block rounded-lg border-2 p-4 ${mgrSignoff ? "border-emerald-400 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/20" : "border-dashed border-slate-300 dark:border-slate-600"}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                    <Shield className="h-3.5 w-3.5" />QC Manager
                  </div>
                  {!mgrSignoff && (
                    <Button size="sm" className="no-print h-6 text-xs bg-blue-700 hover:bg-blue-800 text-white" onClick={() => setSignoffRole("manager")} data-testid="button-signoff-manager">
                      Sign Off
                    </Button>
                  )}
                  {mgrSignoff && (
                    <Button size="sm" variant="outline" className="no-print h-6 text-xs" onClick={() => setSignoffRole("manager")} data-testid="button-signoff-manager">
                      Re-sign
                    </Button>
                  )}
                </div>
                {mgrSignoff ? (
                  <div className="mt-2">
                    <p className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">{mgrSignoff.signedByName}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{fmtTs(mgrSignoff.signedAt)}</p>
                    {mgrSignoff.comment && <p className="text-[11px] italic text-slate-500 mt-1 border-t border-slate-200 dark:border-slate-700 pt-1">"{mgrSignoff.comment}"</p>}
                  </div>
                ) : (
                  <div className="mt-3 border-t border-dashed border-slate-300 dark:border-slate-600 pt-2">
                    <p className="text-[11px] text-slate-400 italic">Awaiting signature…</p>
                    <p className="mt-3 text-[10px] text-slate-400">Signature: ___________________</p>
                    <p className="text-[10px] text-slate-400">Date: ________________________</p>
                  </div>
                )}
              </div>
            </div>
            {bothSigned && (
              <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-md px-3 py-2">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                This report has been fully reviewed and signed off by both Section Head and QC Manager.
              </div>
            )}
          </div>

          {/* ── Document body ── */}
          <div className="px-8 py-7 space-y-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm">Loading report data…</div>
            ) : (
              <>
                {/* 1. Objective */}
                <NarrativeSection num="1" title="Objective" value={objective} placeholder={DEFAULT_OBJECTIVE} onChange={change(setObjective)} />
                <SectionDivider />

                {/* 2. Scope */}
                <NarrativeSection num="2" title="Scope" value={scope} placeholder={DEFAULT_SCOPE} onChange={change(setScope)} />
                <SectionDivider />

                {/* 3. Summary */}
                <div className="doc-section mb-6">
                  <div className="doc-section-head flex items-center gap-3 mb-4">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-bold flex-shrink-0">3</span>
                    <h3 className="text-sm font-bold tracking-wide uppercase text-blue-900 dark:text-blue-200">Summary — {periodLabel}</h3>
                  </div>
                  <div className="ml-9 grid grid-cols-3 sm:grid-cols-6 gap-3">
                    <StatCard label="Total Due"   value={summary.total ?? 0}       color="text-slate-800 dark:text-slate-100" />
                    <StatCard label="Completed"   value={summary.completed ?? 0}   color="text-emerald-700 dark:text-emerald-400" />
                    <StatCard label="On Time"     value={summary.pulledOnTime ?? 0} color="text-emerald-600 dark:text-emerald-500" sub="of completed" />
                    <StatCard label="In Progress" value={summary.inProgress ?? 0}  color="text-amber-600 dark:text-amber-400" />
                    <StatCard label="Overdue"     value={summary.overdue ?? 0}     color="text-red-600 dark:text-red-400" />
                    <StatCard label="OOS / OOT"  value={summary.oosOotCount ?? 0} color="text-red-700 dark:text-red-300" />
                  </div>
                  {isAfter(new Date(year, month - 1, 1), now) && (
                    <p className="ml-9 mt-2 text-xs text-slate-400 italic">Note: Future period — data may be incomplete.</p>
                  )}
                </div>
                <SectionDivider />

                {/* 4. Samples Scheduled */}
                <div className="doc-section mb-6">
                  <div className="doc-section-head flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-bold flex-shrink-0">4</span>
                    <h3 className="text-sm font-bold tracking-wide uppercase text-blue-900 dark:text-blue-200">
                      Samples Scheduled — {periodLabel}
                    </h3>
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">({items.length} time point{items.length !== 1 ? "s" : ""})</span>
                  </div>
                  {items.length === 0 ? (
                    <div className="ml-9 border border-dashed border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
                      <CalendarDays className="h-6 w-6 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-400">No samples scheduled for this period.</p>
                    </div>
                  ) : (
                    <div className="ml-9 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                      <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
                        <colgroup>
                          <col style={{ width: "11%" }} />
                          <col style={{ width: "20%" }} />
                          <col style={{ width: "9%" }} />
                          <col style={{ width: "10%" }} />
                          <col style={{ width: "8%" }} />
                          <col style={{ width: "10%" }} />
                          <col style={{ width: "10%" }} />
                          <col style={{ width: "7%" }} />
                          <col style={{ width: "10%" }} />
                        </colgroup>
                        <thead>
                          <tr className="bg-slate-100 dark:bg-slate-800 text-left">
                            {["Study No","Product","Batch","Condition","T-Point","Planned","Actual","Tests","Status"].map(h => (
                              <th key={h} className="px-2 py-2 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 text-[11px]">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((r: any, i: number) => (
                            <tr key={i} className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${i % 2 === 1 ? "bg-slate-50/60 dark:bg-slate-800/30" : ""}`} data-testid={`row-report-${r.timePointId}`}>
                              <td className="px-2 py-1.5 font-mono text-slate-600 dark:text-slate-400 truncate">{r.studyNumber || "—"}</td>
                              <td className="px-2 py-1.5 font-medium text-slate-800 dark:text-slate-200 leading-tight break-words">{r.product}</td>
                              <td className="px-2 py-1.5 font-mono text-slate-600 dark:text-slate-400 truncate">{r.batch}</td>
                              <td className="px-2 py-1.5 text-slate-600 dark:text-slate-400 truncate">{r.conditionCode || "—"}</td>
                              <td className="px-2 py-1.5 text-slate-700 dark:text-slate-300">{r.label}</td>
                              <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400 text-[11px]">{fmt(r.plannedDate)}</td>
                              <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400 text-[11px]">{fmt(r.actualDate)}</td>
                              <td className="px-2 py-1.5 text-center">
                                {r.testsTotal > 0 ? (
                                  <span className={`font-semibold text-[11px] ${r.testsCompleted === r.testsTotal ? "text-emerald-600" : r.testsCompleted > 0 ? "text-amber-600" : "text-slate-400"}`}>
                                    {r.testsCompleted}/{r.testsTotal}
                                  </span>
                                ) : <span className="text-slate-300">—</span>}
                              </td>
                              <td className="px-2 py-1.5"><StatusPill status={r.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <SectionDivider />

                {/* 5. OOS / OOT */}
                <div className="doc-section mb-6">
                  <div className="doc-section-head flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-bold flex-shrink-0">5</span>
                    <h3 className="text-sm font-bold tracking-wide uppercase text-blue-900 dark:text-blue-200">OOS / OOT Results</h3>
                    {oosOotItems.length > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">{oosOotItems.length} result{oosOotItems.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                  <div className="ml-9">
                    {oosOotItems.length === 0 ? (
                      <div className="border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-lg p-5 text-center">
                        <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-500 mb-1.5" />
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">No OOS or OOT results for this period</p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-red-200 dark:border-red-900">
                        <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
                          <colgroup>
                            <col style={{ width: "6%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "16%" }} />
                            <col style={{ width: "8%" }} />
                            <col style={{ width: "8%" }} />
                            <col style={{ width: "12%" }} />
                            <col style={{ width: "24%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "6%" }} />
                          </colgroup>
                          <thead>
                            <tr className="bg-red-50 dark:bg-red-950/30 text-left">
                              {["Flag","Study No","Product","Batch","T-Point","Test","Failure Note","Analyst","Date"].map(h => (
                                <th key={h} className="px-2 py-2 font-semibold text-red-800 dark:text-red-300 border-b border-red-200 dark:border-red-900 text-[11px]">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {oosOotItems.map((r: any, i: number) => (
                              <tr key={i} className={`border-b border-red-100 dark:border-red-900 last:border-0 ${i % 2 === 1 ? "bg-red-50/30 dark:bg-red-950/10" : ""}`} data-testid={`row-oosoot-${r.id}`}>
                                <td className="px-2 py-1.5">
                                  <span className={`font-bold text-xs ${r.oosOotFlag === "OOS" ? "oos-flag-oos text-red-700" : "oos-flag-oot text-orange-700"}`}>{r.oosOotFlag}</span>
                                </td>
                                <td className="px-2 py-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">{r.studyNumber || "—"}</td>
                                <td className="px-2 py-1.5 font-medium text-slate-800 dark:text-slate-200 break-words leading-tight">{r.product}</td>
                                <td className="px-2 py-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">{r.batch}</td>
                                <td className="px-2 py-1.5 text-slate-700 dark:text-slate-300">{r.label}</td>
                                <td className="px-2 py-1.5 font-medium text-slate-700 dark:text-slate-300 break-words">{r.testName}</td>
                                <td className="px-2 py-1.5 italic text-slate-500 dark:text-slate-400 break-words leading-tight">{r.oosOotNote || "—"}</td>
                                <td className="px-2 py-1.5 text-slate-600 dark:text-slate-400 break-words">{r.completedByName}</td>
                                <td className="px-2 py-1.5 text-[11px] text-slate-500">{fmt(r.completedAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
                <SectionDivider />

                {/* 6. Overdue */}
                <div className="doc-section mb-6">
                  <div className="doc-section-head flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-700 text-white text-xs font-bold flex-shrink-0">6</span>
                    <h3 className="text-sm font-bold tracking-wide uppercase text-blue-900 dark:text-blue-200">Overdue Samples</h3>
                    {overdueItems.length > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">{overdueItems.length} overdue</span>
                    )}
                  </div>
                  <div className="ml-9">
                    {overdueItems.length === 0 ? (
                      <div className="border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-lg p-5 text-center">
                        <CheckCircle2 className="h-5 w-5 mx-auto text-emerald-500 mb-1.5" />
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">No overdue samples for this period</p>
                      </div>
                    ) : (
                      <div className="overflow-hidden rounded-lg border border-amber-200 dark:border-amber-900">
                        <table className="w-full text-xs" style={{ tableLayout: "fixed" }}>
                          <colgroup>
                            <col style={{ width: "12%" }} />
                            <col style={{ width: "22%" }} />
                            <col style={{ width: "11%" }} />
                            <col style={{ width: "12%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "11%" }} />
                            <col style={{ width: "11%" }} />
                            <col style={{ width: "11%" }} />
                          </colgroup>
                          <thead>
                            <tr className="bg-amber-50 dark:bg-amber-950/30 text-left">
                              {["Study No","Product","Batch","Condition","T-Point","Planned Date","Days Late","Status"].map(h => (
                                <th key={h} className="px-2 py-2 font-semibold text-amber-800 dark:text-amber-300 border-b border-amber-200 dark:border-amber-900 text-[11px]">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {overdueItems.map((r: any, i: number) => {
                              const daysLate = Math.max(0, differenceInDays(now, new Date(r.plannedDate)));
                              return (
                                <tr key={i} className={`border-b border-amber-100 dark:border-amber-900 last:border-0 ${i % 2 === 1 ? "bg-amber-50/30 dark:bg-amber-950/10" : ""}`} data-testid={`row-overdue-${r.timePointId}`}>
                                  <td className="px-2 py-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">{r.studyNumber || "—"}</td>
                                  <td className="px-2 py-1.5 font-medium text-slate-800 dark:text-slate-200 break-words leading-tight">{r.product}</td>
                                  <td className="px-2 py-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">{r.batch}</td>
                                  <td className="px-2 py-1.5 text-slate-600 dark:text-slate-400 truncate">{r.conditionCode || "—"}</td>
                                  <td className="px-2 py-1.5 text-slate-700 dark:text-slate-300">{r.label}</td>
                                  <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400 text-[11px]">{fmt(r.plannedDate)}</td>
                                  <td className="px-2 py-1.5">
                                    <span className={`font-bold text-xs ${daysLate > 30 ? "text-red-600" : daysLate > 14 ? "text-amber-600" : "text-yellow-600"}`}>
                                      {daysLate > 0 ? `${daysLate}d` : "<1d"}
                                    </span>
                                  </td>
                                  <td className="px-2 py-1.5"><StatusPill status={r.status} /></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
                <SectionDivider />

                {/* 7. Deviations */}
                <NarrativeSection
                  num="7" title="Deviations"
                  value={deviations}
                  placeholder='List any deviations from the stability protocol or testing schedule observed during this period. Include deviation reference numbers where applicable. Enter "None" if no deviations were observed.'
                  onChange={change(setDeviations)}
                  rows={4}
                />
                <SectionDivider />

                {/* 8. Discussion */}
                <NarrativeSection
                  num="8" title="Discussion"
                  value={discussion}
                  placeholder={DEFAULT_DISCUSSION}
                  onChange={change(setDiscussion)}
                  rows={6}
                />
                <SectionDivider />

                {/* 9. Conclusion */}
                <NarrativeSection
                  num="9" title="Conclusion"
                  value={conclusion}
                  placeholder={DEFAULT_CONCLUSION}
                  onChange={change(setConclusion)}
                  rows={3}
                />
              </>
            )}
          </div>

          {/* Document footer strip */}
          <div className="bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-700 px-8 py-3 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">StabilityFlow — Pharmaceutical Stability Management Platform</span>
            <span className="text-[10px] text-slate-400 font-mono">{docNumber} · {periodLabel}</span>
          </div>
        </div>

        {/* Print-only page footer (appears on every printed page) */}
        <div className="print-page-footer hidden">
          <div className="flex justify-between items-center text-[7pt] text-gray-500">
            <span>StabilityFlow — Pharmaceutical Stability Management</span>
            <span className="font-mono">{docNumber} — {periodLabel}</span>
            <span>CONFIDENTIAL — For internal use only</span>
          </div>
        </div>
      </div>

      {signoffRole && (
        <SignoffDialog open onClose={() => setSignoffRole(null)} role={signoffRole} periodYear={year} periodMonth={month} />
      )}
    </div>
  );
}
