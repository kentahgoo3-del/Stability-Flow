import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { FlaskConical, Download, Search, X, AlertTriangle, RefreshCw, Trash2 } from "lucide-react";
import { format } from "date-fns";

type SampleView = {
  id: string;
  barcode: string | null;
  shelf: string | null;
  position: string | null;
  quantityPlaced: number | null;
  quantityRemaining: number | null;
  quantityUsed: number | null;
  quantityDestroyed: number | null;
  numberOfContainers: number | null;
  quantityPerContainer: number | null;
  manufacturingDate: string | null;
  expiryDate: string | null;
  orientationInChamber: string | null;
  containerClosureSystem: string | null;
  status: string;
  onHold: boolean | null;
  holdReason: string | null;
  placedAt: string | null;
  pulledAt: string | null;
  notes: string | null;
  studyId: string | null;
  studyNumber: string | null;
  batchNumber: string | null;
  studyType: string | null;
  studyStatus: string | null;
  studyStrength: string | null;
  studyDosageForm: string | null;
  studyManufacturingDate: string | null;
  studyExpiryDate: string | null;
  studyStartDate: string | null;
  containerType: string | null;
  productName: string | null;
  productCode: string | null;
  productStrength: string | null;
  productDosageForm: string | null;
  chamberName: string | null;
  chamberLocation: string | null;
  conditionCode: string | null;
  conditionLabel: string | null;
  conditionTemp: number | null;
  conditionHumidity: number | null;
  timePointLabel: string | null;
  timePointPlannedDate: string | null;
  timePointActualDate: string | null;
  timePointStatus: string | null;
  timePointIntervalMonths: number | null;
};

const STATUS_COLORS: Record<string, string> = {
  stored: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  in_testing: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  tested: "bg-green-500/10 text-green-600 dark:text-green-400",
  destroyed: "bg-muted text-muted-foreground",
  lost: "bg-destructive/10 text-destructive",
};

const TP_STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  due: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  overdue: "bg-destructive/10 text-destructive",
  in_progress: "bg-primary/10 text-primary",
  completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  cancelled: "bg-muted text-muted-foreground",
};

const STUDY_TYPE_LABELS: Record<string, string> = {
  long_term: "LT",
  accelerated: "ACC",
  intermediate: "INT",
  stress: "STR",
  photostability: "PHO",
  freeze_thaw: "F/T",
};

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try { return format(new Date(d), "dd-MMM-yyyy"); } catch { return "—"; }
}

function exportCSV(data: SampleView[]) {
  const headers = [
    "Sample ID", "Barcode", "Study Number", "Product", "Product Code",
    "Batch Number", "Study Type", "Study Status", "Strength", "Dosage Form",
    "Container Type", "Condition", "Chamber", "Shelf", "Position",
    "Time Point", "Planned Pull Date", "Actual Pull Date", "Time Point Status",
    "Qty Placed", "Qty Remaining", "Qty Used", "No. Containers", "Qty/Container",
    "Mfg Date", "Expiry Date", "Orientation", "Container Closure",
    "Status", "On Hold", "Hold Reason", "Placed At", "Pulled At", "Notes"
  ];
  const rows = data.map(s => [
    s.id, s.barcode ?? "", s.studyNumber ?? "", s.productName ?? "", s.productCode ?? "",
    s.batchNumber ?? "", STUDY_TYPE_LABELS[s.studyType ?? ""] ?? s.studyType ?? "",
    s.studyStatus ?? "", s.studyStrength ?? s.productStrength ?? "",
    s.studyDosageForm ?? s.productDosageForm ?? "",
    s.containerType ?? "", s.conditionCode ?? "", s.chamberName ?? "",
    s.shelf ?? "", s.position ?? "",
    s.timePointLabel ?? "", fmtDate(s.timePointPlannedDate), fmtDate(s.timePointActualDate),
    s.timePointStatus ?? "",
    s.quantityPlaced ?? "", s.quantityRemaining ?? "", s.quantityUsed ?? "",
    s.numberOfContainers ?? "", s.quantityPerContainer ?? "",
    fmtDate(s.manufacturingDate ?? s.studyManufacturingDate),
    fmtDate(s.expiryDate ?? s.studyExpiryDate),
    s.orientationInChamber ?? "", s.containerClosureSystem ?? "",
    s.status, s.onHold ? "Yes" : "No", s.holdReason ?? "",
    fmtDate(s.placedAt), fmtDate(s.pulledAt), s.notes ?? ""
  ]);
  const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `stability_samples_${format(new Date(), "yyyyMMdd")}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function Samples() {
  const { toast } = useToast();
  const { data: samples = [], isLoading, refetch } = useQuery<SampleView[]>({ queryKey: ["/api/samples/view"] });

  const [filters, setFilters] = useState<Record<string, string>>({});
  const setFilter = (k: string, v: string) => setFilters(f => ({ ...f, [k]: v }));
  const clearFilter = (k: string) => setFilters(f => { const n = { ...f }; delete n[k]; return n; });
  const clearAll = () => setFilters({});

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/samples/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/samples/view"] }); toast({ title: "Sample updated" }); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/samples/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/samples/view"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Sample deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleDeleteSample = (id: string) => {
    if (confirm("Delete this sample? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  // Unique values for filter dropdowns
  const unique = (key: keyof SampleView) => Array.from(new Set(samples.map(s => s[key]).filter(Boolean) as string[])).sort();

  const filtered = useMemo(() => {
    return samples.filter(s => {
      for (const [k, v] of Object.entries(filters)) {
        if (!v || v === "all") continue;
        const val = String((s as any)[k] ?? "");
        if (k === "searchText") {
          const term = v.toLowerCase();
          const searchFields = [s.barcode, s.studyNumber, s.batchNumber, s.productName, s.productCode, s.chamberName, s.conditionCode, s.shelf, s.position].join(" ").toLowerCase();
          if (!searchFields.includes(term)) return false;
        } else if (!val.toLowerCase().includes(v.toLowerCase())) {
          return false;
        }
      }
      return true;
    });
  }, [samples, filters]);

  const activeFilterCount = Object.values(filters).filter(v => v && v !== "all").length;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Live Stability Samples</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filtered.length} of {samples.length} samples · All chambers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5" data-testid="button-refresh-samples">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => exportCSV(filtered)} data-testid="button-export-samples">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="border-dashed">
        <CardContent className="py-3 px-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px] space-y-1">
              <label className="text-[10px] font-semibold uppercase text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  className="pl-8 h-8 text-sm"
                  placeholder="Barcode, study, batch, product..."
                  value={filters.searchText ?? ""}
                  onChange={e => e.target.value ? setFilter("searchText", e.target.value) : clearFilter("searchText")}
                  data-testid="input-sample-search"
                />
              </div>
            </div>

            <FilterSelect label="Product" value={filters.productName ?? "all"} onValue={v => v === "all" ? clearFilter("productName") : setFilter("productName", v)} options={unique("productName")} testId="select-filter-product" />
            <FilterSelect label="Study Type" value={filters.studyType ?? "all"} onValue={v => v === "all" ? clearFilter("studyType") : setFilter("studyType", v)} options={unique("studyType")} labelMap={STUDY_TYPE_LABELS} testId="select-filter-study-type" />
            <FilterSelect label="Condition" value={filters.conditionCode ?? "all"} onValue={v => v === "all" ? clearFilter("conditionCode") : setFilter("conditionCode", v)} options={unique("conditionCode")} testId="select-filter-condition" />
            <FilterSelect label="Chamber" value={filters.chamberName ?? "all"} onValue={v => v === "all" ? clearFilter("chamberName") : setFilter("chamberName", v)} options={unique("chamberName")} testId="select-filter-chamber" />
            <FilterSelect label="Time Point" value={filters.timePointLabel ?? "all"} onValue={v => v === "all" ? clearFilter("timePointLabel") : setFilter("timePointLabel", v)} options={unique("timePointLabel")} testId="select-filter-timepoint" />
            <FilterSelect label="TP Status" value={filters.timePointStatus ?? "all"} onValue={v => v === "all" ? clearFilter("timePointStatus") : setFilter("timePointStatus", v)} options={unique("timePointStatus")} testId="select-filter-tp-status" />
            <FilterSelect label="Sample Status" value={filters.status ?? "all"} onValue={v => v === "all" ? clearFilter("status") : setFilter("status", v)} options={unique("status")} testId="select-filter-status" />
            <FilterSelect label="Study Status" value={filters.studyStatus ?? "all"} onValue={v => v === "all" ? clearFilter("studyStatus") : setFilter("studyStatus", v)} options={unique("studyStatus")} testId="select-filter-study-status" />

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1.5 h-8 text-destructive hover:text-destructive" data-testid="button-clear-filters">
                <X className="h-3.5 w-3.5" />
                Clear ({activeFilterCount})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Samples Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FlaskConical className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No samples match the current filters</p>
              {activeFilterCount > 0 && (
                <Button variant="link" size="sm" onClick={clearAll} className="mt-1">Clear filters</Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" data-testid="samples-table">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Status</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Barcode</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Product</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Batch</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Study</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Type</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Strength</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Form</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Condition</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Chamber</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Shelf</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Position</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Time Point</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">TP Status</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Planned Pull</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Actual Pull</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Qty Placed</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Qty Rem.</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap"># Containers</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Qty/Cont.</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Container</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Orientation</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Mfg Date</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Expiry Date</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">On Hold</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground whitespace-nowrap">Placed At</th>
                    <th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(s => (
                    <tr
                      key={s.id}
                      className="hover:bg-muted/30 transition-colors"
                      data-testid={`sample-row-${s.id}`}
                    >
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] ?? "bg-muted text-muted-foreground"}`}>
                          {s.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono whitespace-nowrap">{s.barcode ?? "—"}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div>
                          <span className="font-medium">{s.productName ?? "—"}</span>
                          {s.productCode && <span className="ml-1 text-muted-foreground">({s.productCode})</span>}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono whitespace-nowrap">{s.batchNumber ?? "—"}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="text-primary font-medium">{s.studyNumber ?? "—"}</span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {s.studyType && (
                          <Badge variant="outline" className="text-[10px] no-default-active-elevate">
                            {STUDY_TYPE_LABELS[s.studyType] ?? s.studyType}
                          </Badge>
                        )}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{s.studyStrength ?? s.productStrength ?? "—"}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{s.studyDosageForm ?? s.productDosageForm ?? "—"}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <div>
                          <span className="font-medium">{s.conditionCode ?? "—"}</span>
                          {s.conditionTemp != null && (
                            <span className="ml-1 text-muted-foreground">{s.conditionTemp}°C{s.conditionHumidity ? `/${s.conditionHumidity}%` : ""}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{s.chamberName ?? "—"}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{s.shelf ?? "—"}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{s.position ?? "—"}</td>
                      <td className="px-3 py-2.5 font-medium whitespace-nowrap">{s.timePointLabel ?? "—"}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {s.timePointStatus ? (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TP_STATUS_COLORS[s.timePointStatus] ?? ""}`}>
                            {s.timePointStatus.replace("_", " ").toUpperCase()}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{fmtDate(s.timePointPlannedDate)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{fmtDate(s.timePointActualDate)}</td>
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">{s.quantityPlaced ?? "—"}</td>
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <span className={s.quantityRemaining === 0 ? "text-destructive font-semibold" : ""}>{s.quantityRemaining ?? "—"}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">{s.numberOfContainers ?? "—"}</td>
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">{s.quantityPerContainer ?? "—"}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{s.containerType ?? "—"}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">{s.orientationInChamber ?? "—"}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{fmtDate(s.manufacturingDate ?? s.studyManufacturingDate)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{fmtDate(s.expiryDate ?? s.studyExpiryDate)}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        {s.onHold ? (
                          <span className="flex items-center gap-1 text-destructive font-semibold">
                            <AlertTriangle className="h-3 w-3" />
                            HOLD
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">{fmtDate(s.placedAt)}</td>
                      <td className="px-3 py-2.5">
                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleDeleteSample(s.id)} data-testid={`button-delete-sample-${s.id}`}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer stats */}
      {!isLoading && filtered.length > 0 && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground px-1">
          <span>Stored: <strong>{filtered.filter(s => s.status === "stored").length}</strong></span>
          <span>In Testing: <strong>{filtered.filter(s => s.status === "in_testing").length}</strong></span>
          <span>Tested: <strong>{filtered.filter(s => s.status === "tested").length}</strong></span>
          <span>On Hold: <strong className="text-destructive">{filtered.filter(s => s.onHold).length}</strong></span>
          <span>Overdue: <strong className="text-destructive">{filtered.filter(s => s.timePointStatus === "overdue").length}</strong></span>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label, value, onValue, options, labelMap, testId
}: {
  label: string;
  value: string;
  onValue: (v: string) => void;
  options: string[];
  labelMap?: Record<string, string>;
  testId?: string;
}) {
  return (
    <div className="space-y-1 min-w-[120px]">
      <label className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onValue}>
        <SelectTrigger className="h-8 text-xs" data-testid={testId}>
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {options.map(o => (
            <SelectItem key={o} value={o}>{labelMap?.[o] ?? o.replace(/_/g, " ")}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
