import { useState, useRef, useEffect, useCallback } from "react";
import { useCanDelete } from "@/hooks/use-can-delete";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AnalystCombobox } from "@/components/analyst-combobox";
import { Plus, Pencil, Upload, Download, FileSpreadsheet, CheckCircle2, Clock, AlertCircle, FlaskConical, X, Search, User, Play, Lock, Trash2 } from "lucide-react";
import { format, isPast, isFuture, differenceInDays, startOfDay, isToday, isTomorrow } from "date-fns";

const AVAILABLE_TESTS = [
  "Appearance", "Water Content", "pH", "Hardness", "Friability",
  "Disintegration", "Identification", "TLC", "Assay", "Dissolution",
  "Related Substances", "Content Uniformity", "Microbiology",
  "Data Reviewed", "Report Compiled", "Residual Solvents", "Ethanol Content",
];

const CONDITIONS = ["25°C/60%", "30°C/65%", "40°C/75%", "2-8°C", "30°C/75%"];
const CONTAINERS = [
  "Alu-Foil", "Amber glass bottle", "Clear glass bottle", "Blister",
  "Double plastic inside drum", "Double plastic inside box", "Plastic bottle",
  "Printed tube", "Securitainer", "Unprinted tube",
];

function fmt(d: any) {
  if (!d) return "—";
  try { return format(new Date(d), "yyyy-MM-dd"); } catch { return "—"; }
}

function getDaysLabel(date: Date) {
  if (isToday(date)) return { text: "Due today", color: "text-destructive" };
  if (isPast(date)) {
    const days = differenceInDays(new Date(), date);
    return { text: `${days}d overdue`, color: "text-destructive" };
  }
  if (isTomorrow(date)) return { text: "Tomorrow", color: "text-orange-500 dark:text-orange-400" };
  const days = differenceInDays(date, new Date());
  if (days <= 7) return { text: `In ${days}d`, color: "text-yellow-600 dark:text-yellow-400" };
  return { text: `In ${days}d`, color: "text-muted-foreground" };
}

function StatusBadge({ status }: { status: string }) {
  if (status === "completed") return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-0"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
  if (status === "in_progress") return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
  if (status === "overdue") return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-0"><AlertCircle className="h-3 w-3 mr-1" />Overdue</Badge>;
  return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
}

// ── Mark Complete Dialog ──────────────────────────────────────────────────────
function MarkCompleteDialog({ item, onClose, onConfirm, isPending }: {
  item: any; onClose: () => void; isPending?: boolean;
  onConfirm: (data: { actualDate: string; oosOotFlag: string; oosOotNote: string }) => void;
}) {
  const defaultDate = item?.plannedDate
    ? format(new Date(item.plannedDate), "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");
  const [actualDate, setActualDate] = useState(defaultDate);
  const [oosOotFlag, setOosOotFlag] = useState(item?.oosOotFlag || "");
  const [oosOotNote, setOosOotNote] = useState(item?.oosOotNote || "");

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Mark Complete — {item?.label}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <div className="text-sm text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
            <span className="font-medium text-foreground">{item?.product}</span> · {item?.batch} · {item?.conditionCode}
          </div>
          <div className="space-y-1">
            <Label>Actual Completion Date</Label>
            <Input type="date" value={actualDate} onChange={e => setActualDate(e.target.value)} data-testid="input-actual-date" />
            <p className="text-xs text-muted-foreground">Planned: {fmt(item?.plannedDate)} — edit for historical pulls</p>
          </div>
          <div className="space-y-2">
            <Label>OOS / OOT Flag</Label>
            <div className="flex gap-2">
              {["", "OOS", "OOT"].map(opt => (
                <button
                  key={opt}
                  onClick={() => { setOosOotFlag(opt); if (!opt) setOosOotNote(""); }}
                  className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
                    oosOotFlag === opt
                      ? opt === "OOS" ? "bg-red-500 text-white border-red-500"
                        : opt === "OOT" ? "bg-orange-500 text-white border-orange-500"
                        : "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  }`}
                  data-testid={`flag-option-${opt || "none"}`}
                >
                  {opt || "None"}
                </button>
              ))}
            </div>
          </div>
          {oosOotFlag && (
            <div className="space-y-1">
              <Label>Flag Note <span className="text-destructive">*</span></Label>
              <Textarea
                value={oosOotNote}
                onChange={e => setOosOotNote(e.target.value)}
                rows={2}
                placeholder={oosOotFlag === "OOS" ? "e.g. Assay 87% — below 90% spec limit" : "e.g. Upward trend observed"}
                data-testid="input-oos-note"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button
            onClick={() => onConfirm({ actualDate, oosOotFlag, oosOotNote })}
            disabled={isPending || (!!oosOotFlag && !oosOotNote.trim())}
            data-testid="button-confirm-complete"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            {isPending ? "Saving…" : "Mark Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Register Entry Dialog ────────────────────────────────────────────────────
function toDateInput(d: any): string {
  if (!d) return "";
  try { const s = format(new Date(d), "yyyy-MM-dd"); return s === "Invalid Date" ? "" : s; } catch { return ""; }
}

function buildFormState(editing?: any) {
  if (editing) {
    return {
      productName: editing.product || "",
      batch: editing.batch || "",
      strength: editing.strength || "",
      conditionCode: editing.conditionCode || "",
      chamberName: editing.chamber || "",
      startDate: toDateInput(editing.startDate),
      intervalsMonthsCsv: editing.intervalsMonthsCsv || "",
      container: editing.container || "",
      mnfDate: toDateInput(editing.mnfDate),
      packedDate: toDateInput(editing.packedDate),
      packSize: editing.packSize || "",
      protocolRef: editing.protocolRef || "",
      testPlan: (editing.testPlan || "").split(",").map((t: string) => t.trim()).filter(Boolean),
      notes: editing.notes || "",
    };
  }
  return {
    productName: "", batch: "", strength: "", conditionCode: "", chamberName: "",
    startDate: format(new Date(), "yyyy-MM-dd"), intervalsMonthsCsv: "0,3,6,12,24",
    container: "", mnfDate: "", packedDate: "", packSize: "", protocolRef: "",
    testPlan: [] as string[], notes: "",
  };
}

function RegisterDialog({ open, onClose, editing }: { open: boolean; onClose: () => void; editing?: any }) {
  const { toast } = useToast();
  const isEdit = !!editing;
  const [form, setForm] = useState(() => buildFormState(editing));

  // Re-populate every time a different item is opened for editing
  useEffect(() => {
    setForm(buildFormState(editing));
  }, [editing?.studyId, open]);

  const { data: chambers } = useQuery<any[]>({ queryKey: ["/api/chambers"] });

  const mut = useMutation({
    mutationFn: async (d: any) => {
      if (isEdit) return apiRequest("PATCH", `/api/register/${editing.studyId}`, d);
      return apiRequest("POST", "/api/register", d);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/register"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: isEdit ? "Entry updated" : "Entry added" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function toggleTest(t: string) {
    setForm(f => ({
      ...f,
      testPlan: f.testPlan.includes(t) ? f.testPlan.filter((x: string) => x !== t) : [...f.testPlan, t],
    }));
  }

  function handleSubmit() {
    if (!form.productName.trim()) { toast({ title: "Product name is required", variant: "destructive" }); return; }
    if (!form.batch.trim()) { toast({ title: "Batch is required", variant: "destructive" }); return; }
    if (!form.startDate.trim()) { toast({ title: "Start date is required", variant: "destructive" }); return; }
    if (!form.intervalsMonthsCsv.trim()) { toast({ title: "Intervals are required (e.g. 0,3,6,12)", variant: "destructive" }); return; }
    mut.mutate({ ...form, testPlan: form.testPlan.join(",") });
  }

  const set = (k: string) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Register Entry" : "Add Register Entry"}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="space-y-1">
            <Label>Product *</Label>
            <Input data-testid="input-product" value={form.productName} onChange={e => set("productName")(e.target.value)} placeholder="e.g. Paracetamol 500mg Tabs" />
          </div>
          <div className="space-y-1">
            <Label>Batch *</Label>
            <Input data-testid="input-batch" value={form.batch} onChange={e => set("batch")(e.target.value)} placeholder="e.g. B12345" />
          </div>
          <div className="space-y-1">
            <Label>Strength</Label>
            <Input value={form.strength} onChange={e => set("strength")(e.target.value)} placeholder="e.g. 500mg" />
          </div>
          <div className="space-y-1">
            <Label>Condition</Label>
            <Select value={form.conditionCode} onValueChange={set("conditionCode")}>
              <SelectTrigger data-testid="select-condition"><SelectValue placeholder="Select condition" /></SelectTrigger>
              <SelectContent>
                {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Chamber</Label>
            <Select value={form.chamberName} onValueChange={set("chamberName")}>
              <SelectTrigger><SelectValue placeholder="Select chamber" /></SelectTrigger>
              <SelectContent>
                {(chambers || []).map((c: any) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                <SelectItem value="__other">Other (type below)</SelectItem>
              </SelectContent>
            </Select>
            {form.chamberName === "__other" && (
              <Input className="mt-1" placeholder="Chamber name" onChange={e => set("chamberName")(e.target.value)} />
            )}
          </div>
          <div className="space-y-1">
            <Label>Container</Label>
            <Select value={form.container} onValueChange={set("container")}>
              <SelectTrigger><SelectValue placeholder="Select container" /></SelectTrigger>
              <SelectContent>
                {CONTAINERS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Start Date (Placed in chamber) *</Label>
            <Input type="date" value={form.startDate} onChange={e => set("startDate")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>MNF Date</Label>
            <Input type="date" value={form.mnfDate} onChange={e => set("mnfDate")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Packed Date</Label>
            <Input type="date" value={form.packedDate} onChange={e => set("packedDate")(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Pack Size</Label>
            <Input value={form.packSize} onChange={e => set("packSize")(e.target.value)} placeholder="e.g. 30 tabs" />
          </div>
          <div className="space-y-1">
            <Label>Intervals (months, comma-separated) *</Label>
            <Input value={form.intervalsMonthsCsv} onChange={e => set("intervalsMonthsCsv")(e.target.value)} placeholder="e.g. 0,3,6,9,12,18,24" />
          </div>
          <div className="space-y-1">
            <Label>Protocol Ref</Label>
            <Input value={form.protocolRef} onChange={e => set("protocolRef")(e.target.value)} placeholder="e.g. STAB/PROT/2025-001" />
          </div>
          <div className="col-span-2 space-y-1">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={e => set("notes")(e.target.value)} rows={2} />
          </div>
          <div className="col-span-2 space-y-2">
            <Label>Test Plan (select all that apply)</Label>
            <div className="grid grid-cols-3 gap-2 border rounded-md p-3 bg-muted/30">
              {AVAILABLE_TESTS.map(t => (
                <div key={t} className="flex items-center gap-2">
                  <Checkbox
                    id={`test-${t}`}
                    checked={form.testPlan.includes(t)}
                    onCheckedChange={() => toggleTest(t)}
                    data-testid={`checkbox-test-${t.toLowerCase().replace(/\s+/g, "-")}`}
                  />
                  <label htmlFor={`test-${t}`} className="text-sm cursor-pointer">{t}</label>
                </div>
              ))}
            </div>
            {form.testPlan.length > 0 && (
              <p className="text-xs text-muted-foreground">{form.testPlan.length} test(s) selected: {form.testPlan.join(", ")}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={mut.isPending} data-testid="button-save-entry">
            {mut.isPending ? "Saving…" : isEdit ? "Save Changes" : "Add Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Tests Dialog ─────────────────────────────────────────────────────────────
function TestsDialog({ open, onClose, item }: { open: boolean; onClose: () => void; item: any }) {
  const { toast } = useToast();
  const [analystName, setAnalystName] = useState("");
  const [actualDate, setActualDate] = useState(() =>
    item?.plannedDate ? format(new Date(item.plannedDate), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd")
  );
  // per-test flag editing state: { [completionId]: { flag, note, expanded } }
  const [testFlagState, setTestFlagState] = useState<Record<string, { flag: string; note: string; expanded: boolean }>>({});

  useEffect(() => {
    if (open && item) {
      setTestFlagState({});
      const dateRef = item.actualDate || item.plannedDate;
      setActualDate(dateRef ? format(new Date(dateRef), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"));
    }
  }, [open, item?.timePointId]);

  const { data: completions = [], refetch } = useQuery<any[]>({
    queryKey: ["/api/test-completions", item?.timePointId],
    enabled: !!item?.timePointId,
  });

  const tests = (item?.testPlan || "").split(",").map((t: string) => t.trim()).filter(Boolean);
  const doneSet = new Set((completions as any[]).map((c: any) => c.testName));

  const addMut = useMutation({
    mutationFn: (testName: string) => apiRequest("POST", "/api/test-completions", {
      timePointId: item.timePointId,
      testName,
      completedByName: analystName || "Unknown",
    }),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/register"] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/test-completions/${id}`),
    onSuccess: () => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/register"] });
    },
  });

  function toggleTest(testName: string) {
    const existing = (completions as any[]).find((c: any) => c.testName === testName);
    if (existing) {
      removeMut.mutate(existing.id);
    } else {
      if (!analystName.trim()) {
        toast({ title: "Please enter analyst name before ticking a test", variant: "destructive" });
        return;
      }
      addMut.mutate(testName);
    }
  }

  const allDone = tests.length > 0 && tests.every((t: string) => doneSet.has(t));

  const completeTpMut = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/time-points/${item.timePointId}`, {
      status: "completed",
      actualDate: new Date(actualDate),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/register"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Pull marked complete", description: `Actual date: ${actualDate}` });
      onClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveFlagMut = useMutation({
    mutationFn: ({ completionId, flag, note }: { completionId: string; flag: string; note: string }) =>
      apiRequest("PATCH", `/api/test-completions/${completionId}`, {
        oosOotFlag: flag || null,
        oosOotNote: note.trim() || null,
      }),
    onSuccess: (_data, vars) => {
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/register"] });
      queryClient.invalidateQueries({ queryKey: ["/api/oos-oot-flags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: vars.flag ? `${vars.flag} flagged` : "Flag cleared" });
      setTestFlagState(prev => ({ ...prev, [vars.completionId]: { ...prev[vars.completionId], expanded: false } }));
    },
    onError: (e: any) => toast({ title: "Error saving flag", description: e.message, variant: "destructive" }),
  });

  function getTestFs(completionId: string, completion: any) {
    return testFlagState[completionId] ?? { flag: completion?.oosOotFlag || "", note: completion?.oosOotNote || "", expanded: false };
  }

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            Mark Tests — {item.product} · {item.label}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{item.batch} · {item.conditionCode} · Planned: {fmt(item.plannedDate)}</p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Analyst Name</Label>
              <AnalystCombobox
                data-testid="input-analyst-name"
                value={analystName}
                onChange={setAnalystName}
              />
            </div>
            <div className="space-y-1">
              <Label>Actual Completion Date</Label>
              <Input
                type="date"
                value={actualDate}
                onChange={e => setActualDate(e.target.value)}
                data-testid="input-tests-actual-date"
              />
              <p className="text-xs text-muted-foreground">Planned: {fmt(item.plannedDate)}</p>
            </div>
          </div>

          {tests.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No test plan defined for this study. Edit the entry to add tests.</p>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tests ({(completions as any[]).length}/{tests.length} done)</Label>
                <div className="flex items-center gap-2">
                  {allDone
                    ? <Badge className="bg-green-100 text-green-800 border-0">All Complete ✓</Badge>
                    : (
                      <button
                        type="button"
                        onClick={() => {
                          if (!analystName.trim()) {
                            toast({ title: "Please enter analyst name first", variant: "destructive" });
                            return;
                          }
                          const remaining = tests.filter((t: string) => !doneSet.has(t));
                          remaining.forEach((t: string) => addMut.mutate(t));
                        }}
                        className="text-xs text-primary underline-offset-2 hover:underline"
                        data-testid="button-select-all-tests"
                      >
                        Select all
                      </button>
                    )
                  }
                </div>
              </div>
              <div className="border rounded-md divide-y">
                {tests.map((t: string) => {
                  const completion = (completions as any[]).find((c: any) => c.testName === t);
                  const fs = completion ? getTestFs(completion.id, completion) : null;
                  const hasFlag = completion?.oosOotFlag && !testFlagState[completion?.id];
                  return (
                    <div key={t} className={`${completion?.oosOotFlag ? (completion.oosOotFlag === "OOS" ? "bg-red-50/60 dark:bg-red-950/20" : "bg-orange-50/60 dark:bg-orange-950/20") : completion ? "bg-green-50 dark:bg-green-950/20" : ""}`}>
                      <div className="flex items-center gap-3 px-3 py-2">
                        <Checkbox
                          checked={!!completion}
                          onCheckedChange={() => toggleTest(t)}
                          data-testid={`checkbox-complete-${t.toLowerCase().replace(/\s+/g, "-")}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-sm font-medium ${completion && !completion.oosOotFlag ? "line-through text-muted-foreground" : ""}`}>{t}</span>
                            {completion?.oosOotFlag && (
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${completion.oosOotFlag === "OOS" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"}`}>
                                {completion.oosOotFlag}
                              </span>
                            )}
                          </div>
                          {completion && (
                            <p className="text-xs text-muted-foreground">
                              {completion.completedByName} · {fmt(completion.completedAt)} {format(new Date(completion.completedAt), "HH:mm")}
                              {hasFlag && completion.oosOotNote && <span className="ml-1 italic">— {completion.oosOotNote}</span>}
                            </p>
                          )}
                        </div>
                        {completion && (
                          <button
                            type="button"
                            onClick={() => setTestFlagState(prev => ({ ...prev, [completion.id]: { ...getTestFs(completion.id, completion), expanded: !getTestFs(completion.id, completion).expanded } }))}
                            data-testid={`button-flag-${t.toLowerCase().replace(/\s+/g, "-")}`}
                            className={`text-xs px-2 py-1 rounded border font-medium transition-colors ${fs?.expanded ? "bg-muted border-border" : completion.oosOotFlag ? "border-transparent text-muted-foreground hover:bg-muted" : "border-border text-muted-foreground hover:bg-muted"}`}
                          >
                            {completion.oosOotFlag ? "Edit flag" : "Flag"}
                          </button>
                        )}
                      </div>

                      {/* Inline flag editor */}
                      {fs?.expanded && (
                        <div className="px-3 pb-3 space-y-2 border-t bg-muted/20">
                          <div className="flex gap-2 pt-2">
                            {["", "OOS", "OOT"].map(opt => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setTestFlagState(prev => ({ ...prev, [completion.id]: { ...getTestFs(completion.id, completion), flag: opt, expanded: true } }))}
                                data-testid={`flag-btn-${t.toLowerCase().replace(/\s+/g, "-")}-${opt || "none"}`}
                                className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
                                  fs.flag === opt
                                    ? opt === "OOS" ? "bg-red-500 text-white border-red-500"
                                      : opt === "OOT" ? "bg-orange-500 text-white border-orange-500"
                                      : "bg-muted text-foreground border-border"
                                    : "bg-background text-muted-foreground border-border hover:bg-muted"
                                }`}
                              >
                                {opt === "" ? "None" : opt}
                              </button>
                            ))}
                          </div>
                          {fs.flag && (
                            <Textarea
                              data-testid={`input-flag-note-${t.toLowerCase().replace(/\s+/g, "-")}`}
                              placeholder={fs.flag === "OOS" ? "e.g. Assay 87% — below 90% spec limit" : "e.g. Upward trend observed at T6 and T12"}
                              value={fs.note}
                              onChange={e => setTestFlagState(prev => ({ ...prev, [completion.id]: { ...getTestFs(completion.id, completion), note: e.target.value, expanded: true } }))}
                              rows={2}
                              className="text-xs"
                            />
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={fs.flag ? "destructive" : "outline"}
                              className="flex-1"
                              disabled={saveFlagMut.isPending || (!!fs.flag && !fs.note.trim())}
                              onClick={() => saveFlagMut.mutate({ completionId: completion.id, flag: fs.flag, note: fs.note })}
                              data-testid={`button-save-flag-${t.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                              {saveFlagMut.isPending ? "Saving…" : fs.flag ? `Save ${fs.flag}` : "Clear Flag"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setTestFlagState(prev => ({ ...prev, [completion.id]: { ...getTestFs(completion.id, completion), expanded: false } }))}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {allDone && item?.status !== "completed" && (
            <Button
              onClick={() => completeTpMut.mutate()}
              disabled={completeTpMut.isPending}
              data-testid="button-tests-mark-complete"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              {completeTpMut.isPending ? "Saving…" : "Mark Complete"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Register Table ────────────────────────────────────────────────────────────
function RegisterTable({ items, onEdit, onClickRow, onComplete, showActions = true }: { items: any[]; onEdit?: (item: any) => void; onClickRow?: (item: any) => void; onComplete?: (item: any) => void; showActions?: boolean }) {
  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <FlaskConical className="h-10 w-10 mb-3 opacity-30" />
      <p className="text-sm">No entries found</p>
    </div>
  );

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-3 py-2 font-medium text-xs">Product</th>
            <th className="px-3 py-2 font-medium text-xs">Batch</th>
            <th className="px-3 py-2 font-medium text-xs">Strength</th>
            <th className="px-3 py-2 font-medium text-xs">Condition</th>
            <th className="px-3 py-2 font-medium text-xs">Chamber</th>
            <th className="px-3 py-2 font-medium text-xs">Time Point</th>
            <th className="px-3 py-2 font-medium text-xs">Container</th>
            <th className="px-3 py-2 font-medium text-xs">Pack Size</th>
            <th className="px-3 py-2 font-medium text-xs">MNF Date</th>
            <th className="px-3 py-2 font-medium text-xs">Date Placed</th>
            <th className="px-3 py-2 font-medium text-xs">Planned Date</th>
            <th className="px-3 py-2 font-medium text-xs">Protocol Ref</th>
            <th className="px-3 py-2 font-medium text-xs">Tests</th>
            <th className="px-3 py-2 font-medium text-xs">Status</th>
            {showActions && <th className="px-3 py-2 font-medium text-xs">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item: any, i: number) => (
            <tr
              key={`${item.timePointId}-${i}`}
              className={`border-b hover:bg-muted/30 transition-colors ${onClickRow ? "cursor-pointer" : ""} ${item.status === "in_progress" ? "bg-amber-50/50 dark:bg-amber-950/10" : ""} ${item.status === "completed" ? "bg-green-50/30 dark:bg-green-950/10" : ""}`}
              onClick={() => onClickRow?.(item)}
              data-testid={`row-register-${item.timePointId}`}
            >
              <td className="px-3 py-2 font-medium">{item.product || "—"}</td>
              <td className="px-3 py-2 font-mono text-xs">{item.batch || "—"}</td>
              <td className="px-3 py-2">{item.strength || "—"}</td>
              <td className="px-3 py-2">{item.conditionCode || "—"}</td>
              <td className="px-3 py-2">{item.chamber || "—"}</td>
              <td className="px-3 py-2 font-medium">{item.label}</td>
              <td className="px-3 py-2">{item.container || "—"}</td>
              <td className="px-3 py-2">{item.packSize || "—"}</td>
              <td className="px-3 py-2">{fmt(item.mnfDate)}</td>
              <td className="px-3 py-2">{fmt(item.startDate)}</td>
              <td className="px-3 py-2">{fmt(item.plannedDate)}</td>
              <td className="px-3 py-2 text-xs">{item.protocolRef || "—"}</td>
              <td className="px-3 py-2">
                {item.testsTotal > 0 ? (
                  <span className={`text-xs font-medium ${item.testsCompleted === item.testsTotal ? "text-green-600" : "text-muted-foreground"}`}>
                    {item.testsCompleted}/{item.testsTotal}
                  </span>
                ) : <span className="text-xs text-muted-foreground">—</span>}
              </td>
              <td className="px-3 py-2">
                <div className="flex flex-col gap-1">
                  <StatusBadge status={item.status} />
                  {item.oosOotFlag && (
                    <span
                      title={item.oosOotNote || ""}
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold ${item.oosOotFlag === "OOS" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"}`}
                      data-testid={`badge-oos-oot-${item.timePointId}`}
                    >
                      {item.oosOotFlag}
                    </span>
                  )}
                </div>
              </td>
              {showActions && (
                <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    {onComplete && (
                      <Button size="sm" className="h-6 gap-1 text-xs" onClick={() => onComplete(item)} data-testid={`button-complete-pull-${item.timePointId}`}>
                        <CheckCircle2 className="h-3 w-3" />Complete
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onEdit?.(item)} data-testid={`button-edit-${item.timePointId}`}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Completed Table (with analyst column) ─────────────────────────────────────
function CompletedTable({ items, onEdit, onClickRow }: { items: any[]; onEdit?: (item: any) => void; onClickRow?: (item: any) => void }) {
  const { data: allCompletions = [] } = useQuery<any[]>({ queryKey: ["/api/test-log"] });

  const analystsByTp = (allCompletions as any[]).reduce((acc: any, c: any) => {
    if (!c.completedByName) return acc;
    if (!acc[c.timePointId]) acc[c.timePointId] = new Set<string>();
    acc[c.timePointId].add(c.completedByName);
    return acc;
  }, {} as Record<string, Set<string>>);

  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <CheckCircle2 className="h-10 w-10 mb-3 opacity-30 text-green-500" />
      <p className="text-sm">No completed samples yet</p>
    </div>
  );

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-3 py-2 font-medium text-xs">Product</th>
            <th className="px-3 py-2 font-medium text-xs">Batch</th>
            <th className="px-3 py-2 font-medium text-xs">Condition</th>
            <th className="px-3 py-2 font-medium text-xs">Time Point</th>
            <th className="px-3 py-2 font-medium text-xs">Protocol Ref</th>
            <th className="px-3 py-2 font-medium text-xs">Tests</th>
            <th className="px-3 py-2 font-medium text-xs">Analysts</th>
            <th className="px-3 py-2 font-medium text-xs">Actual Date</th>
            <th className="px-3 py-2 font-medium text-xs">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any, i: number) => {
            const analysts = analystsByTp[item.timePointId]
              ? Array.from(analystsByTp[item.timePointId] as Set<string>)
              : [];
            return (
              <tr key={`${item.timePointId}-${i}`} className="border-b hover:bg-muted/30 transition-colors bg-green-50/30 dark:bg-green-950/10 cursor-pointer" onClick={() => onClickRow?.(item)} data-testid={`row-completed-${item.timePointId}`}>
                <td className="px-3 py-2 font-medium">{item.product || "—"}</td>
                <td className="px-3 py-2 font-mono text-xs">{item.batch || "—"}</td>
                <td className="px-3 py-2 text-xs">{item.conditionCode || "—"}</td>
                <td className="px-3 py-2 font-medium">{item.label}</td>
                <td className="px-3 py-2 text-xs">{item.protocolRef || "—"}</td>
                <td className="px-3 py-2">
                  <span className="text-xs font-medium text-green-600">{item.testsCompleted}/{item.testsTotal}</span>
                </td>
                <td className="px-3 py-2">
                  {analysts.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {analysts.map((a: string) => (
                        <span key={a} className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-medium">
                          <User className="h-2.5 w-2.5" />{a}
                        </span>
                      ))}
                    </div>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{item.actualDate ? fmt(item.actualDate) : fmt(item.plannedDate)}</td>
                <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onEdit?.(item)} data-testid={`button-edit-completed-${item.timePointId}`}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Overdue Table ─────────────────────────────────────────────────────────────
function OverdueTable({ items, onMarkComplete, onDelete, onClickRow }: {
  items: any[]; onMarkComplete: (item: any) => void; onDelete: (id: string) => void; onClickRow?: (item: any) => void;
}) {
  const canDelete = useCanDelete();
  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <CheckCircle2 className="h-10 w-10 mb-3 opacity-30 text-green-500" />
      <p className="text-sm font-medium">No overdue pulls</p>
      <p className="text-xs mt-1">All time points are on schedule</p>
    </div>
  );

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b bg-muted/50 text-left">
            <th className="px-3 py-2 font-medium text-xs">Urgency</th>
            <th className="px-3 py-2 font-medium text-xs">Product</th>
            <th className="px-3 py-2 font-medium text-xs">Batch</th>
            <th className="px-3 py-2 font-medium text-xs">Condition</th>
            <th className="px-3 py-2 font-medium text-xs">Time Point</th>
            <th className="px-3 py-2 font-medium text-xs">Planned Date</th>
            <th className="px-3 py-2 font-medium text-xs">Protocol Ref</th>
            <th className="px-3 py-2 font-medium text-xs">Tests</th>
            <th className="px-3 py-2 font-medium text-xs">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item: any, i: number) => {
            const { text, color } = getDaysLabel(new Date(item.plannedDate));
            return (
              <tr
                key={`${item.timePointId}-${i}`}
                className="border-b hover:bg-muted/30 transition-colors bg-red-50/30 dark:bg-red-950/10 cursor-pointer"
                onClick={() => onClickRow?.(item)}
                data-testid={`row-overdue-${item.timePointId}`}
              >
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive bg-destructive/10 rounded-full px-2 py-0.5">
                    <AlertCircle className="h-3 w-3" />{text}
                  </span>
                </td>
                <td className="px-3 py-2 font-medium">{item.product || "—"}</td>
                <td className="px-3 py-2 font-mono text-xs">{item.batch || "—"}</td>
                <td className="px-3 py-2 text-xs">{item.conditionCode || "—"}</td>
                <td className="px-3 py-2 font-medium">{item.label}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{fmt(item.plannedDate)}</td>
                <td className="px-3 py-2 text-xs">{item.protocolRef || "—"}</td>
                <td className="px-3 py-2">
                  {item.testsTotal > 0
                    ? <span className="text-xs text-muted-foreground">{item.testsCompleted}/{item.testsTotal}</span>
                    : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <Button size="sm" className="h-6 gap-1 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={() => onMarkComplete(item)} data-testid={`button-mark-complete-${item.timePointId}`}>
                      <CheckCircle2 className="h-3 w-3" />Mark Complete
                    </Button>
                    {canDelete && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onDelete(item.timePointId)} data-testid={`button-delete-overdue-${item.timePointId}`}>
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const MONTHS_FULL = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function SampleRegister() {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [testsItem, setTestsItem] = useState<any>(null);
  const [completeItem, setCompleteItem] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tpImportRef = useRef<HTMLInputElement>(null);

  const { data: items = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/register"] });

  const tpMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/time-points/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/register"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
  });

  const deleteTpMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/time-points/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/register"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Time point deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  function handleConfirmComplete(data: { actualDate: string; oosOotFlag: string; oosOotNote: string }) {
    if (!completeItem) return;
    tpMutation.mutate({
      id: completeItem.timePointId,
      data: {
        status: "completed",
        actualDate: new Date(data.actualDate),
        oosOotFlag: data.oosOotFlag || null,
        oosOotNote: data.oosOotNote || null,
      },
    }, {
      onSuccess: () => {
        toast({ title: "Pull marked complete", description: data.oosOotFlag ? `${data.oosOotFlag} flag recorded` : undefined });
        setCompleteItem(null);
        queryClient.invalidateQueries({ queryKey: ["/api/oos-oot-flags"] });
      },
    });
  }

  async function handleTpImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { raw: false }) as any[];
      if (rows.length === 0) { toast({ title: "No data found in file", variant: "destructive" }); return; }
      const res = await fetch("/api/register/import-timepoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const result = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/register"] });
      queryClient.invalidateQueries({ queryKey: ["/api/oos-oot-flags"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      if (result.errors?.length) {
        toast({ title: `${result.updated} time points updated`, description: `${result.errors.length} skipped — see console`, variant: "destructive" });
      } else {
        toast({ title: `${result.updated} time points updated successfully` });
      }
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    }
  }

  function handleDeleteTp(id: string) {
    if (confirm("Delete this time point? This cannot be undone.")) deleteTpMutation.mutate(id);
  }

  // Unique product names for the filter dropdown
  const productNames = Array.from(new Set((items as any[]).map((r: any) => r.product).filter(Boolean))).sort();

  const activeFilters = !!search || filterProduct !== "all" || filterMonth !== "all";

  const filtered = (items as any[]).filter((r: any) => {
    if (search) {
      const s = search.toLowerCase();
      if (!(r.product || "").toLowerCase().includes(s)
        && !(r.batch || "").toLowerCase().includes(s)
        && !(r.conditionCode || "").toLowerCase().includes(s)
        && !(r.chamber || "").toLowerCase().includes(s)
        && !(r.protocolRef || "").toLowerCase().includes(s)) return false;
    }
    if (filterProduct !== "all" && (r.product || "") !== filterProduct) return false;
    if (filterMonth !== "all") {
      const m = parseInt(filterMonth);
      const pm = r.plannedDate ? new Date(r.plannedDate).getMonth() : -1;
      if (pm !== m) return false;
    }
    return true;
  });

  const overdueItems = filtered.filter((r: any) => r.status === "overdue")
    .sort((a: any, b: any) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime());
  const registerItems = filtered;
  const inProgressItems = filtered.filter((r: any) => r.status === "in_progress");
  const completedItems = filtered.filter((r: any) => r.status === "completed");

  const { data: oosOotFlags = [] } = useQuery<any[]>({ queryKey: ["/api/oos-oot-flags"] });

  // ── Import preview state ──────────────────────────────────────────────────
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importing, setImporting] = useState(false);

  async function handleExport() {
    const a = document.createElement("a");
    a.href = "/api/register/export";
    a.download = `stability-register-${Date.now()}.xlsx`;
    a.click();
  }

  async function handleTemplate() {
    const a = document.createElement("a");
    a.href = "/api/register/template";
    a.download = "stability-import-template.xlsx";
    a.click();
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { raw: false }) as any[];
      if (rows.length === 0) { toast({ title: "No data found in file", variant: "destructive" }); return; }
      setImportRows(rows);
      setImportFile(file);
      setShowImportPreview(true);
    } catch (err: any) {
      toast({ title: "Could not read file", description: err.message, variant: "destructive" });
    }
  }

  async function confirmImport() {
    if (!importFile) return;
    setImporting(true);
    const fd = new FormData();
    fd.append("file", importFile);
    try {
      const res = await fetch("/api/register/import", { method: "POST", body: fd });
      const result = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/register"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setShowImportPreview(false);
      setImportRows([]);
      setImportFile(null);
      if (result.errors?.length) {
        toast({ title: `${result.created} entries imported`, description: `${result.errors.length} row(s) skipped: ${result.errors[0]}`, variant: "destructive" });
      } else {
        toast({ title: `${result.created} entries imported successfully` });
      }
    } catch (err: any) {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-6 py-3 border-b bg-background flex items-center gap-2 flex-wrap">
        <Button size="sm" onClick={() => setShowAdd(true)} data-testid="button-add-entry">
          <Plus className="h-4 w-4 mr-1" />Add
        </Button>
        <div className="h-4 w-px bg-border" />
        <Button size="sm" variant="outline" onClick={handleTemplate} data-testid="button-export-template">
          <FileSpreadsheet className="h-4 w-4 mr-1" />Template
        </Button>
        <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} data-testid="button-import">
          <Upload className="h-4 w-4 mr-1" />Import Excel
        </Button>
        <Button size="sm" variant="outline" onClick={handleExport} data-testid="button-export">
          <Download className="h-4 w-4 mr-1" />Export Excel
        </Button>
        <Button size="sm" variant="outline" onClick={() => tpImportRef.current?.click()} data-testid="button-import-timepoints" title="Bulk update time point statuses from CSV">
          <CheckCircle2 className="h-4 w-4 mr-1" />Update Time Points
        </Button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileSelect} />
        <input ref={tpImportRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleTpImport} />
        <div className="flex-1" />

        {/* Product filter */}
        <Select value={filterProduct} onValueChange={setFilterProduct}>
          <SelectTrigger className="h-8 w-40 text-sm" data-testid="select-filter-product">
            <SelectValue placeholder="All Products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {(productNames as string[]).map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Pull month filter */}
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="h-8 w-36 text-sm" data-testid="select-filter-month">
            <SelectValue placeholder="All Months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {MONTHS_FULL.map((m, i) => (
              <SelectItem key={i} value={String(i)}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Text search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 w-44 h-8 text-sm"
            data-testid="input-register-search"
          />
        </div>

        {activeFilters && (
          <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs text-muted-foreground" onClick={() => { setSearch(""); setFilterProduct("all"); setFilterMonth("all"); }} data-testid="button-clear-filters">
            <X className="h-3 w-3" />Clear
          </Button>
        )}
      </div>

      {/* Summary bar */}
      <div className="px-6 py-2 border-b bg-muted/20 flex gap-6 text-xs text-muted-foreground">
        <span>Total: <strong className="text-foreground">{filtered.length}</strong></span>
        {overdueItems.length > 0 && (
          <span className="text-destructive font-medium">Overdue: <strong>{overdueItems.length}</strong></span>
        )}
        <span className="text-amber-600 dark:text-amber-400">In Progress: <strong>{inProgressItems.length}</strong></span>
        <span className="text-green-600 dark:text-green-400">Completed: <strong>{completedItems.length}</strong></span>
        {(oosOotFlags as any[]).length > 0 && (
          <span className="text-red-600 dark:text-red-400">OOS/OOT: <strong>{(oosOotFlags as any[]).length}</strong></span>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="register" className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-6 mt-3 w-fit">
          <TabsTrigger value="register" data-testid="tab-register">
            All Samples ({registerItems.length})
          </TabsTrigger>
          <TabsTrigger value="inprogress" data-testid="tab-inprogress">
            In Progress ({inProgressItems.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completed ({completedItems.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" data-testid="tab-overdue" className="gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            Overdue
            {overdueItems.length > 0 && (
              <span className="ml-0.5 bg-destructive text-destructive-foreground rounded px-1 text-[10px] font-bold">{overdueItems.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="oosoot" data-testid="tab-oosoot" className="data-[state=active]:text-orange-600">
            OOS / OOT {(oosOotFlags as any[]).length > 0 && <span className="ml-1 bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 rounded px-1 text-xs font-bold">{(oosOotFlags as any[]).length}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overdue" className="flex-1 overflow-auto mt-2 mx-6 mb-4">
          <OverdueTable
            items={overdueItems}
            onMarkComplete={item => setCompleteItem(item)}
            onDelete={handleDeleteTp}
            onClickRow={item => setTestsItem(item)}
          />
        </TabsContent>

        <TabsContent value="register" className="flex-1 overflow-auto mt-2 mx-6 mb-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">Loading…</div>
          ) : (
            <RegisterTable
              items={registerItems}
              onEdit={item => setEditing(item)}
            />
          )}
        </TabsContent>

        <TabsContent value="inprogress" className="flex-1 overflow-auto mt-2 mx-6 mb-4">
          {inProgressItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No samples currently in progress</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground mb-2">Click a row to mark tests — or use "Complete" to close the pull.</p>
              <RegisterTable
                items={inProgressItems}
                onEdit={item => setEditing(item)}
                onClickRow={item => setTestsItem(item)}
                onComplete={item => setCompleteItem(item)}
                showActions={true}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="flex-1 overflow-auto mt-2 mx-6 mb-4">
          <CompletedTable items={completedItems} onEdit={item => setEditing(item)} onClickRow={item => setTestsItem(item)} />
        </TabsContent>

        <TabsContent value="oosoot" className="flex-1 overflow-auto mt-2 mx-6 mb-4">
          {(oosOotFlags as any[]).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mb-3 opacity-30 text-green-500" />
              <p className="text-sm font-medium">No OOS/OOT flags</p>
              <p className="text-xs mt-1">All test results are within specification</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted/50 text-left">
                    <th className="px-3 py-2 font-medium text-xs">Flag</th>
                    <th className="px-3 py-2 font-medium text-xs">Product</th>
                    <th className="px-3 py-2 font-medium text-xs">Batch</th>
                    <th className="px-3 py-2 font-medium text-xs">Condition</th>
                    <th className="px-3 py-2 font-medium text-xs">Time Point</th>
                    <th className="px-3 py-2 font-medium text-xs">Test</th>
                    <th className="px-3 py-2 font-medium text-xs">Description</th>
                    <th className="px-3 py-2 font-medium text-xs">Analyst</th>
                    <th className="px-3 py-2 font-medium text-xs">Flagged</th>
                  </tr>
                </thead>
                <tbody>
                  {(oosOotFlags as any[]).map((f: any) => (
                    <tr key={f.id} className={`border-b hover:bg-muted/30 transition-colors ${f.oosOotFlag === "OOS" ? "bg-red-50/40 dark:bg-red-950/10" : "bg-orange-50/40 dark:bg-orange-950/10"}`} data-testid={`row-flag-${f.id}`}>
                      <td className="px-3 py-2">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${f.oosOotFlag === "OOS" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"}`}>
                          {f.oosOotFlag}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-medium">{f.product || "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs">{f.batch || "—"}</td>
                      <td className="px-3 py-2">{f.conditionCode || "—"}</td>
                      <td className="px-3 py-2 font-medium">{f.timePointLabel || "—"}</td>
                      <td className="px-3 py-2 font-medium">{f.testName}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground italic max-w-xs truncate" title={f.oosOotNote || ""}>{f.oosOotNote || "—"}</td>
                      <td className="px-3 py-2 text-xs">{f.completedByName || "—"}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{f.completedAt ? format(new Date(f.completedAt), "dd MMM yyyy HH:mm") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showAdd && <RegisterDialog open onClose={() => setShowAdd(false)} />}
      {editing && <RegisterDialog open onClose={() => setEditing(null)} editing={editing} />}
      {testsItem && <TestsDialog open onClose={() => setTestsItem(null)} item={testsItem} />}
      {completeItem && (
        <MarkCompleteDialog
          item={completeItem}
          onClose={() => setCompleteItem(null)}
          onConfirm={handleConfirmComplete}
          isPending={tpMutation.isPending}
        />
      )}

      {/* Import Preview Dialog */}
      <Dialog open={showImportPreview} onOpenChange={v => { if (!v && !importing) { setShowImportPreview(false); setImportRows([]); setImportFile(null); } }}>
        <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Import Preview — {importRows.length} {importRows.length === 1 ? "entry" : "entries"} found
            </DialogTitle>
            <p className="text-sm text-muted-foreground">Review the data below before importing. Required columns: <span className="font-medium">Product, Batch, Condition</span>.</p>
          </DialogHeader>

          <div className="overflow-auto flex-1 border rounded-md">
            <table className="w-full text-xs">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left px-2 py-2 font-semibold whitespace-nowrap">#</th>
                  {["Product","Batch","Strength","Condition","Chamber","Start Date","Intervals","Container","MNF Date","Packed Date","Pack Size","Protocol Ref","Test Plan"].map(h => (
                    <th key={h} className="text-left px-2 py-2 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {importRows.map((row, i) => {
                  const missing = !row["Product"] || !row["Batch"] || !row["Condition"];
                  return (
                    <tr key={i} className={missing ? "bg-destructive/10" : "hover:bg-muted/40"}>
                      <td className="px-2 py-1.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-2 py-1.5 font-medium whitespace-nowrap">{row["Product"] || <span className="text-destructive">MISSING</span>}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{row["Batch"] || <span className="text-destructive">MISSING</span>}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{row["Strength"] || "—"}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{row["Condition"] || <span className="text-destructive">MISSING</span>}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{row["Chamber"] || "—"}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{row["Start Date"] || "—"}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{row["Intervals (months csv)"] || row["Intervals"] || "0,3,6,12,24"}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{row["Container"] || "—"}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{row["MNF Date"] || "—"}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{row["Packed Date"] || "—"}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{row["Pack Size"] || "—"}</td>
                      <td className="px-2 py-1.5 whitespace-nowrap">{row["Protocol Ref"] || "—"}</td>
                      <td className="px-2 py-1.5 max-w-[200px] truncate" title={row["Test Plan"] || ""}>{row["Test Plan"] || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {importRows.some((r: any) => !r["Product"] || !r["Batch"] || !r["Condition"]) && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Rows highlighted in red are missing required fields and will be skipped during import.
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImportPreview(false); setImportRows([]); setImportFile(null); }} disabled={importing}>
              Cancel
            </Button>
            <Button onClick={confirmImport} disabled={importing} data-testid="button-confirm-import">
              <Upload className="h-4 w-4 mr-1.5" />
              {importing ? "Importing…" : `Import ${importRows.length} ${importRows.length === 1 ? "Entry" : "Entries"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
