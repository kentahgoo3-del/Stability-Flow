import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckCircle2, Circle, AlertCircle, Clock, XCircle, Minus } from "lucide-react";

const STUDY_TYPE_LABELS: Record<string, string> = {
  long_term: "Long-term",
  accelerated: "Accelerated",
  intermediate: "Intermediate",
  stress: "Stress",
  photostability: "Photostability",
  freeze_thaw: "Freeze/Thaw",
};

const STATUS_ORDER = ["overdue", "in_progress", "due", "pending", "completed", "cancelled"];

function studyStatusBadge(status: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    active:       { label: "Active",       variant: "default" },
    draft:        { label: "Draft",        variant: "secondary" },
    on_hold:      { label: "On Hold",      variant: "outline" },
    completed:    { label: "Completed",    variant: "secondary" },
    discontinued: { label: "Discontinued", variant: "outline" },
  };
  const m = map[status] ?? { label: status, variant: "outline" };
  return <Badge variant={m.variant} className="text-[9px] h-4 px-1">{m.label}</Badge>;
}

interface TpCell {
  id: string;
  label: string;
  status: string;
  plannedDate: string;
  actualDate: string | null;
}

function Cell({ tp }: { tp: TpCell | undefined }) {
  if (!tp) {
    return (
      <div className="flex items-center justify-center h-10 w-full text-muted-foreground/25">
        <Minus className="h-3 w-3" />
      </div>
    );
  }

  const cfg: Record<string, { icon: typeof CheckCircle2; cls: string; label: string }> = {
    completed:   { icon: CheckCircle2, cls: "text-emerald-600 dark:text-emerald-400", label: "Completed" },
    in_progress: { icon: Clock,        cls: "text-amber-500",                         label: "In Progress" },
    overdue:     { icon: AlertCircle,  cls: "text-red-500",                           label: "Overdue" },
    due:         { icon: AlertCircle,  cls: "text-orange-500",                        label: "Due" },
    pending:     { icon: Circle,       cls: "text-slate-400 dark:text-slate-500",     label: "Pending" },
    cancelled:   { icon: XCircle,      cls: "text-slate-300 dark:text-slate-600",     label: "Cancelled" },
  };
  const c = cfg[tp.status] ?? cfg.pending;
  const Icon = c.icon;

  const fmtDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`flex items-center justify-center h-10 w-full cursor-default transition-colors rounded hover:bg-muted/60 ${
            tp.status === "overdue" ? "bg-red-50 dark:bg-red-950/20" :
            tp.status === "in_progress" ? "bg-amber-50 dark:bg-amber-950/20" :
            tp.status === "completed" ? "bg-emerald-50 dark:bg-emerald-950/20" : ""
          }`}
          data-testid={`cell-${tp.id}`}
        >
          <Icon className={`h-4 w-4 ${c.cls}`} />
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs max-w-48 space-y-1">
        <p className="font-semibold">{tp.label} — {c.label}</p>
        <p className="text-muted-foreground">Planned: {fmtDate(tp.plannedDate)}</p>
        {tp.actualDate && <p className="text-muted-foreground">Actual: {fmtDate(tp.actualDate)}</p>}
      </TooltipContent>
    </Tooltip>
  );
}

function MatrixTable({ studies }: { studies: any[] }) {
  // Collect all unique intervals across all studies for this product
  const intervals = useMemo(() => {
    const set = new Set<number>();
    for (const s of studies) {
      for (const tp of s.timePoints) set.add(tp.intervalMonths);
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [studies]);

  // For each study, build a map intervalMonths → tp
  const studyMaps = useMemo(() =>
    studies.map(s => {
      const m = new Map<number, TpCell>();
      for (const tp of s.timePoints) m.set(tp.intervalMonths, tp);
      return m;
    }), [studies]);

  // Summary counts per study
  const summarise = (s: any) => {
    const counts = { completed: 0, in_progress: 0, overdue: 0, pending: 0, total: s.timePoints.length };
    for (const tp of s.timePoints) {
      if (tp.status === "completed") counts.completed++;
      else if (tp.status === "in_progress") counts.in_progress++;
      else if (tp.status === "overdue") counts.overdue++;
      else counts.pending++;
    }
    return counts;
  };

  // Legend mapping for header colour blobs
  const intervalLabel = (m: number) => m === 0 ? "T0" : `T${m}`;

  return (
    <div className="overflow-x-auto rounded-lg border border-border shadow-sm">
      <table className="w-full border-collapse text-sm" style={{ minWidth: `${Math.max(700, 220 + intervals.length * 62)}px` }}>
        <thead>
          {/* ICH standard row header */}
          <tr className="bg-muted/60 border-b border-border">
            <th className="text-left px-4 py-2.5 font-semibold text-xs text-muted-foreground w-52 sticky left-0 bg-muted/60 z-10 border-r border-border" rowSpan={1}>
              Condition / Study
            </th>
            <th className="text-center px-2 py-2.5 font-semibold text-xs text-muted-foreground w-28 border-r border-border">
              Progress
            </th>
            {intervals.map(m => (
              <th key={m} className="text-center py-2.5 font-semibold text-xs text-foreground/80 border-r last:border-r-0 border-border w-14">
                <div>{intervalLabel(m)}</div>
                <div className="text-[9px] font-normal text-muted-foreground">{m === 0 ? "Initial" : `${m}mo`}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {studies.map((s, si) => {
            const counts = summarise(s);
            const pct = counts.total > 0 ? Math.round((counts.completed / counts.total) * 100) : 0;
            const tpMap = studyMaps[si];
            return (
              <tr
                key={s.id}
                className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors"
                data-testid={`row-study-${s.id}`}
              >
                {/* Row header */}
                <td className="px-4 py-2 sticky left-0 bg-background z-10 border-r border-border">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-xs text-foreground leading-tight">
                        {s.condition?.code ?? "—"}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {s.condition?.temperature != null ? `${s.condition.temperature}°C` : ""}
                        {s.condition?.humidity != null ? `/${s.condition.humidity}%RH` : ""}
                      </span>
                      {studyStatusBadge(s.status)}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono leading-tight">{s.studyNumber}</div>
                    <div className="flex items-center gap-1 flex-wrap mt-0.5">
                      <span className="text-[9px] bg-muted px-1 py-0 rounded text-muted-foreground">
                        {STUDY_TYPE_LABELS[s.studyType] ?? s.studyType}
                      </span>
                      <span className="text-[9px] text-muted-foreground">Batch: {s.batchNumber}</span>
                    </div>
                  </div>
                </td>

                {/* Progress summary */}
                <td className="px-3 py-2 border-r border-border text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-xs font-bold text-foreground">{counts.completed}/{counts.total}</div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: pct === 100 ? "#16a34a" : pct > 50 ? "#d97706" : "#3b82f6",
                        }}
                      />
                    </div>
                    <div className="text-[9px] text-muted-foreground">{pct}%</div>
                    {counts.overdue > 0 && (
                      <span className="text-[9px] text-red-500 font-semibold">{counts.overdue} overdue</span>
                    )}
                  </div>
                </td>

                {/* Time-point cells */}
                {intervals.map(m => (
                  <td key={m} className="border-r last:border-r-0 border-border p-0">
                    <Cell tp={tpMap.get(m)} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Legend() {
  const items = [
    { icon: CheckCircle2, cls: "text-emerald-600", label: "Completed" },
    { icon: Clock,        cls: "text-amber-500",   label: "In Progress" },
    { icon: AlertCircle,  cls: "text-red-500",     label: "Overdue" },
    { icon: AlertCircle,  cls: "text-orange-500",  label: "Due" },
    { icon: Circle,       cls: "text-slate-400",   label: "Pending" },
    { icon: Minus,        cls: "text-muted-foreground/30", label: "Not Scheduled" },
  ];
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {items.map(({ icon: Icon, cls, label }) => (
        <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className={`h-3.5 w-3.5 ${cls}`} />
          {label}
        </div>
      ))}
    </div>
  );
}

export default function IchMatrix() {
  const { data = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/ich-matrix"] });
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const products = useMemo(() => data.map((d: any) => d.product), [data]);

  // Auto-select first product
  const effectiveId = selectedProductId || (products[0]?.id ?? "");
  const selected = data.find((d: any) => d.product.id === effectiveId);

  const allStudies = selected?.studies ?? [];
  const sortedStudies = useMemo(() =>
    [...allStudies].sort((a: any, b: any) => {
      const ai = STATUS_ORDER.indexOf(a.status);
      const bi = STATUS_ORDER.indexOf(b.status);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    }), [allStudies]);

  const totalTps = sortedStudies.reduce((n: number, s: any) => n + s.timePoints.length, 0);
  const completedTps = sortedStudies.reduce((n: number, s: any) =>
    n + s.timePoints.filter((t: any) => t.status === "completed").length, 0);
  const overdueTps = sortedStudies.reduce((n: number, s: any) =>
    n + s.timePoints.filter((t: any) => t.status === "overdue").length, 0);

  return (
    <div className="p-6 space-y-5 max-w-full">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">ICH Study Matrix</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Time point intervals vs storage conditions — per-product stability planning view
          </p>
        </div>
        <div className="w-72">
          <Select
            value={effectiveId}
            onValueChange={setSelectedProductId}
            data-testid="select-product"
          >
            <SelectTrigger className="w-full" data-testid="trigger-select-product">
              <SelectValue placeholder="Select a product…" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p: any) => (
                <SelectItem key={p.id} value={p.id} data-testid={`option-product-${p.id}`}>
                  {p.name}
                  {p.strength ? ` ${p.strength}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : !selected ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <p className="text-sm">No products found. Register a stability study first.</p>
        </div>
      ) : (
        <>
          {/* Product info strip */}
          <div className="rounded-lg border border-border bg-card px-5 py-3 flex items-center gap-6 flex-wrap">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">Product</p>
              <p className="font-bold text-sm text-foreground">{selected.product.name}</p>
            </div>
            {selected.product.code && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">Code</p>
                <p className="text-sm font-mono">{selected.product.code}</p>
              </div>
            )}
            {selected.product.strength && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">Strength</p>
                <p className="text-sm">{selected.product.strength}</p>
              </div>
            )}
            {selected.product.dosageForm && (
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wide">Form</p>
                <p className="text-sm">{selected.product.dosageForm}</p>
              </div>
            )}
            <div className="ml-auto flex items-center gap-4">
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{sortedStudies.length}</p>
                <p className="text-[10px] text-muted-foreground">Studies</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{completedTps}/{totalTps}</p>
                <p className="text-[10px] text-muted-foreground">T-Points Done</p>
              </div>
              {overdueTps > 0 && (
                <div className="text-center">
                  <p className="text-xl font-bold text-red-500">{overdueTps}</p>
                  <p className="text-[10px] text-muted-foreground">Overdue</p>
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <Legend />

          {/* Matrix */}
          {sortedStudies.length === 0 ? (
            <div className="rounded-lg border border-border p-10 text-center text-muted-foreground text-sm">
              No studies registered for this product.
            </div>
          ) : (
            <MatrixTable studies={sortedStudies} />
          )}

          {/* ICH guideline footer */}
          <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground space-y-0.5">
            <p className="font-semibold text-foreground/70">ICH Q1A(R2) Reference Intervals</p>
            <p><span className="font-medium">Long-term (25°C/60%RH):</span> T0, T3, T6, T9, T12, T18, T24, T36, T48, T60</p>
            <p><span className="font-medium">Accelerated (40°C/75%RH):</span> T0, T3, T6</p>
            <p><span className="font-medium">Intermediate (30°C/65%RH):</span> T0, T6, T9, T12</p>
          </div>
        </>
      )}
    </div>
  );
}
