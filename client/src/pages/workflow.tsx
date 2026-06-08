import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  ClipboardList, CheckCircle2, AlertTriangle, XCircle, Plus, 
  FlaskConical, TrendingDown, TrendingUp, Minus, ChevronDown
} from "lucide-react";
import { format } from "date-fns";
import type { TestResult, TestSpecification, StabilityStudy, TimePoint } from "@shared/schema";

const resultStatusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "Pending", icon: Minus, color: "text-muted-foreground" },
  entered: { label: "Entered", icon: ClipboardList, color: "text-blue-500" },
  passed: { label: "Passed", icon: CheckCircle2, color: "text-green-500" },
  oos_suspected: { label: "OOS", icon: XCircle, color: "text-destructive" },
  oot_suspected: { label: "OOT", icon: AlertTriangle, color: "text-yellow-500" },
  failed: { label: "Failed", icon: XCircle, color: "text-destructive" },
  voided: { label: "Voided", icon: Minus, color: "text-muted-foreground" },
};

function ResultIndicator({ result, spec }: { result?: TestResult; spec: TestSpecification }) {
  if (!result || result.status === "pending") {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  
  const config = resultStatusConfig[result.status] ?? resultStatusConfig.pending;
  const Icon = config.icon;
  
  const isInSpec = result.value !== null && result.value !== undefined;
  const percentOfSpec = isInSpec && spec.specMax ? (result.value! / spec.specMax * 100) : null;
  
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-3.5 w-3.5 ${config.color}`} />
      <span className="font-medium tabular-nums text-sm">
        {result.value !== null && result.value !== undefined ? `${result.value} ${spec.unit ?? ""}` : result.valueText ?? "—"}
      </span>
      {result.autoFlagged && (
        <span className="text-xs text-destructive font-medium">!</span>
      )}
    </div>
  );
}

function EnterResultDialog({ spec, studyId, timePointId, existingResult, users }: any) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(existingResult?.value?.toString() ?? "");
  const [notes, setNotes] = useState(existingResult?.notes ?? "");
  const [analystId, setAnalystId] = useState(existingResult?.analystId ?? "");
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (data: any) => existingResult
      ? apiRequest("PATCH", `/api/results/${existingResult.id}`, data)
      : apiRequest("POST", "/api/results", data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/results"] });
      queryClient.invalidateQueries({ queryKey: ["/api/investigations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      const status = res?.status;
      if (status === "oos_suspected") {
        toast({ title: "OOS Result Detected", description: "Investigation automatically created.", variant: "destructive" });
      } else if (status === "oot_suspected") {
        toast({ title: "OOT Result Detected", description: "Investigation automatically created." });
      } else {
        toast({ title: "Result saved", description: "Result evaluated and stored." });
      }
      setOpen(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSubmit = () => {
    if (!value) return;
    const data = {
      testSpecId: spec.id, studyId, timePointId, value: parseFloat(value), notes,
      analystId: analystId || undefined, status: "entered",
    };
    mutation.mutate(data);
  };

  const numVal = parseFloat(value);
  let indicator = null;
  if (!isNaN(numVal) && spec) {
    if ((spec.specMin !== null && numVal < spec.specMin) || (spec.specMax !== null && numVal > spec.specMax)) {
      indicator = <span className="text-xs font-medium text-destructive flex items-center gap-1"><XCircle className="h-3 w-3" /> Outside specification limits</span>;
    } else if ((spec.alertMin !== null && numVal < spec.alertMin) || (spec.alertMax !== null && numVal > spec.alertMax)) {
      indicator = <span className="text-xs font-medium text-yellow-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Outside alert limits (OOT trigger)</span>;
    } else {
      indicator = <span className="text-xs font-medium text-green-500 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Within specification</span>;
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={existingResult ? "outline" : "default"} className="h-7 text-xs" data-testid={`button-enter-result-${spec.id}`}>
          {existingResult ? "Edit" : "Enter"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enter Result — {spec.testName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Method</span>
              <span className="font-medium">{spec.methodNumber ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Specification</span>
              <span className="font-medium">
                {spec.specMin !== null ? `≥${spec.specMin}` : ""}{spec.specMin !== null && spec.specMax !== null ? " — " : ""}{spec.specMax !== null ? `≤${spec.specMax}` : ""} {spec.unit ?? ""}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Alert limits</span>
              <span className="font-medium">
                {spec.alertMin !== null ? `≥${spec.alertMin}` : ""}{spec.alertMin !== null && spec.alertMax !== null ? " — " : ""}{spec.alertMax !== null ? `≤${spec.alertMax}` : ""} {spec.unit ?? ""}
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Result Value ({spec.unit ?? "—"})</Label>
            <Input data-testid="input-result-value" type="number" step="0.01" placeholder="Enter value..." value={value} onChange={e => setValue(e.target.value)} />
            {indicator && <div className="mt-1">{indicator}</div>}
          </div>
          <div className="space-y-1.5">
            <Label>Analyst</Label>
            <Select value={analystId} onValueChange={setAnalystId}>
              <SelectTrigger data-testid="select-result-analyst"><SelectValue placeholder="Select analyst" /></SelectTrigger>
              <SelectContent>
                {users?.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea data-testid="textarea-result-notes" placeholder="Optional notes..." value={notes} onChange={e => setNotes(e.target.value)} className="h-16" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button data-testid="button-save-result" onClick={handleSubmit} disabled={!value || mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Result"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Workflow() {
  const [selectedStudyId, setSelectedStudyId] = useState<string>("");
  const [selectedTimePointId, setSelectedTimePointId] = useState<string>("");

  const { data: studies = [] } = useQuery<StabilityStudy[]>({ queryKey: ["/api/studies"] });
  const { data: allTimePoints = [] } = useQuery<TimePoint[]>({ queryKey: ["/api/time-points"] });
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/users"] });

  const studyTimePoints = allTimePoints.filter(tp => tp.studyId === selectedStudyId);
  const selectedStudy = studies.find(s => s.id === selectedStudyId);
  const selectedTP = studyTimePoints.find(tp => tp.id === selectedTimePointId);

  const { data: specs = [] } = useQuery<TestSpecification[]>({ 
    queryKey: ["/api/test-specifications", selectedStudy?.productId],
    enabled: !!selectedStudy?.productId,
  });

  const { data: results = [], isLoading: loadingResults } = useQuery<TestResult[]>({
    queryKey: ["/api/results", selectedStudyId, selectedTimePointId],
    enabled: !!selectedStudyId && !!selectedTimePointId,
  });

  const getResultForSpec = (specId: string) => results.find(r => r.testSpecId === specId);
  
  const completedCount = specs.filter(s => {
    const r = getResultForSpec(s.id);
    return r && r.status !== "pending";
  }).length;

  const progress = specs.length > 0 ? Math.round((completedCount / specs.length) * 100) : 0;

  const activeStudies = studies.filter(s => s.status === "active");

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl mx-auto">
      <div>
        <h2 className="text-lg font-bold">Workflow Execution</h2>
        <p className="text-sm text-muted-foreground">Enter and review stability test results</p>
      </div>

      {/* Study / Time Point Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Select Study</Label>
          <Select value={selectedStudyId} onValueChange={v => { setSelectedStudyId(v); setSelectedTimePointId(""); }}>
            <SelectTrigger data-testid="select-workflow-study" className="bg-card">
              <SelectValue placeholder="Choose a stability study..." />
            </SelectTrigger>
            <SelectContent>
              {activeStudies.map(s => (
                <SelectItem key={s.id} value={s.id}>{s.studyNumber} — {s.batchNumber}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Select Time Point</Label>
          <Select value={selectedTimePointId} onValueChange={setSelectedTimePointId} disabled={!selectedStudyId}>
            <SelectTrigger data-testid="select-workflow-timepoint" className="bg-card">
              <SelectValue placeholder="Choose a time point..." />
            </SelectTrigger>
            <SelectContent>
              {studyTimePoints.map(tp => (
                <SelectItem key={tp.id} value={tp.id}>
                  {tp.label} — {format(new Date(tp.plannedDate), "dd MMM yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedStudyId && selectedTimePointId ? (
        <>
          {/* Progress */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                  <p className="text-sm font-semibold">{selectedStudy?.studyNumber} — {selectedTP?.label}</p>
                  <p className="text-xs text-muted-foreground">{completedCount} of {specs.length} tests completed</p>
                </div>
                <span className="text-2xl font-bold tabular-nums text-primary">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FlaskConical className="h-4 w-4 text-primary" />
                Test Results
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loadingResults ? (
                <div className="p-4 space-y-2">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : specs.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <p className="text-sm">No test specifications found for this product.</p>
                  <p className="text-xs mt-1">Configure test specifications in Settings.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/30 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                    <span className="col-span-3">Test</span>
                    <span className="col-span-2">Method</span>
                    <span className="col-span-2">Spec Limits</span>
                    <span className="col-span-2">Result</span>
                    <span className="col-span-2">Status</span>
                    <span className="col-span-1"></span>
                  </div>
                  {specs.map(spec => {
                    const result = getResultForSpec(spec.id);
                    const statusConfig = result ? resultStatusConfig[result.status] : null;
                    const Icon = statusConfig?.icon ?? Minus;
                    return (
                      <div key={spec.id} className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/20 transition-colors ${result?.autoFlagged ? "bg-destructive/5" : ""}`} data-testid={`result-row-${spec.id}`}>
                        <div className="col-span-3">
                          <p className="text-sm font-medium">{spec.testName}</p>
                          <p className="text-xs text-muted-foreground">{spec.category}</p>
                        </div>
                        <div className="col-span-2 text-xs text-muted-foreground">{spec.methodNumber ?? "—"}</div>
                        <div className="col-span-2 text-xs">
                          <span className="font-mono">{spec.specMin !== null ? `≥${spec.specMin}` : ""}{spec.specMin !== null && spec.specMax !== null ? "–" : ""}{spec.specMax !== null ? `≤${spec.specMax}` : ""}</span>
                          <span className="text-muted-foreground ml-1">{spec.unit}</span>
                        </div>
                        <div className="col-span-2">
                          <ResultIndicator result={result} spec={spec} />
                        </div>
                        <div className="col-span-2">
                          {result && (
                            <div className={`flex items-center gap-1 text-xs font-medium ${statusConfig?.color}`}>
                              <Icon className="h-3.5 w-3.5" />
                              {statusConfig?.label}
                            </div>
                          )}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <EnterResultDialog
                            spec={spec}
                            studyId={selectedStudyId}
                            timePointId={selectedTimePointId}
                            existingResult={result}
                            users={users}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">Select a study and time point</p>
          <p className="text-sm mt-1">Choose from the dropdowns above to view and enter results</p>
        </div>
      )}
    </div>
  );
}
