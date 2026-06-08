import { useState } from "react";
import { useCanDelete } from "@/hooks/use-can-delete";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, XCircle, TrendingDown, Clock, CheckCircle2, User, Calendar, FileText, Edit, ChevronRight, Trash2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { Investigation } from "@shared/schema";

const typeConfig: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  oos: { label: "OOS", icon: XCircle, color: "text-destructive", bg: "bg-destructive/10" },
  oot: { label: "OOT", icon: AlertTriangle, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  critical_trend: { label: "Critical Trend", icon: TrendingDown, color: "text-orange-500", bg: "bg-orange-500/10" },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "bg-destructive/10 text-destructive" },
  phase1: { label: "Phase 1", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  phase2: { label: "Phase 2", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500" },
  closed: { label: "Closed", color: "bg-green-500/10 text-green-600 dark:text-green-400" },
  invalidated: { label: "Invalidated", color: "bg-muted text-muted-foreground" },
};

function InvestigationDetailDialog({ inv, users, onClose }: { inv: Investigation; users: any[]; onClose: () => void }) {
  const [form, setForm] = useState<any>({
    status: inv.status,
    assignedToId: inv.assignedToId ?? "",
    phase1Conclusion: inv.phase1Conclusion ?? "",
    phase2Conclusion: inv.phase2Conclusion ?? "",
    rootCause: inv.rootCause ?? "",
    capaReference: inv.capaReference ?? "",
    description: inv.description ?? "",
  });
  const { toast } = useToast();
  const canDelete = useCanDelete();
  const tc = typeConfig[inv.type] ?? typeConfig.oos;
  const Icon = tc.icon;
  const sc = statusConfig[inv.status] ?? statusConfig.open;

  const mutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", `/api/investigations/${inv.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investigations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Investigation updated" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/investigations/${inv.id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/investigations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Investigation deleted" });
      onClose();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const assignedUser = users.find(u => u.id === inv.assignedToId);

  return (
    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${tc.bg}`}>
            <Icon className={`h-4 w-4 ${tc.color}`} />
          </div>
          <div>
            <span className="font-bold">{inv.investigationNumber}</span>
            <span className="text-sm text-muted-foreground ml-2">— {tc.label}</span>
          </div>
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-5">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-muted/30">
          {[
            { label: "Product/Batch", value: `${inv.batchNumber ?? "—"}` },
            { label: "Test", value: inv.testName ?? "—" },
            { label: "Condition", value: inv.condition ?? "—" },
            { label: "Time Point", value: inv.timePoint ?? "—" },
            { label: "Result Value", value: inv.value !== null && inv.value !== undefined ? String(inv.value) : "—" },
            { label: "Specification", value: inv.specLimit ?? "—" },
          ].map(item => (
            <div key={item.label}>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-sm font-medium">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger data-testid="select-inv-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Assigned To</Label>
            <Select value={form.assignedToId} onValueChange={v => set("assignedToId", v)}>
              <SelectTrigger data-testid="select-inv-assignee"><SelectValue placeholder="Assign analyst" /></SelectTrigger>
              <SelectContent>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Description / Initial Assessment</Label>
          <Textarea data-testid="textarea-inv-description" value={form.description} onChange={e => set("description", e.target.value)} className="h-16" placeholder="Describe the investigation..." />
        </div>

        <Separator />

        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Phase 1 Investigation</h4>
          <Textarea data-testid="textarea-phase1" placeholder="Laboratory investigation findings..." value={form.phase1Conclusion} onChange={e => set("phase1Conclusion", e.target.value)} className="h-16" />
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Phase 2 Full Investigation</h4>
          <Textarea data-testid="textarea-phase2" placeholder="Extended investigation findings..." value={form.phase2Conclusion} onChange={e => set("phase2Conclusion", e.target.value)} className="h-16" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Root Cause</Label>
            <Textarea data-testid="textarea-root-cause" value={form.rootCause} onChange={e => set("rootCause", e.target.value)} className="h-14" placeholder="Identified root cause..." />
          </div>
          <div className="space-y-1.5">
            <Label>CAPA Reference</Label>
            <Input data-testid="input-capa" value={form.capaReference} onChange={e => set("capaReference", e.target.value)} placeholder="CAPA-2026-001" />
          </div>
        </div>
      </div>
      
      <DialogFooter>
        {canDelete && (
          <Button variant="ghost" className="mr-auto text-destructive hover:text-destructive" data-testid="button-delete-investigation" onClick={() => { if (confirm("Delete this investigation? This cannot be undone.")) deleteMutation.mutate(); }} disabled={deleteMutation.isPending}>
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button data-testid="button-save-investigation" onClick={() => mutation.mutate(form)} disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function InvestigationCard({ inv, users, onClick }: { inv: Investigation; users: any[]; onClick: () => void }) {
  const tc = typeConfig[inv.type] ?? typeConfig.oos;
  const sc = statusConfig[inv.status] ?? statusConfig.open;
  const Icon = tc.icon;
  const assignedUser = users.find(u => u.id === inv.assignedToId);
  const daysUntilDue = inv.dueDate ? Math.ceil((new Date(inv.dueDate).getTime() - Date.now()) / 86400000) : null;

  return (
    <Card className="hover-elevate cursor-pointer" onClick={onClick} data-testid={`inv-card-${inv.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tc.bg}`}>
              <Icon className={`h-3.5 w-3.5 ${tc.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">{inv.investigationNumber}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tc.bg} ${tc.color}`}>{tc.label}</span>
              </div>
              <p className="text-sm font-medium">{inv.testName ?? "Unknown Test"}</p>
            </div>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${sc.color}`}>
            {sc.label}
          </span>
        </div>

        <div className="text-xs text-muted-foreground space-y-1 mb-3">
          <p>{inv.batchNumber} {inv.condition && `— ${inv.condition}`}</p>
          {inv.value !== null && inv.value !== undefined && (
            <p>Value: <span className="font-medium text-foreground">{inv.value}</span> (spec: {inv.specLimit})</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          {assignedUser ? (
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-2.5 w-2.5 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">{assignedUser.fullName.split(" ")[0]}</span>
            </div>
          ) : <div />}
          {daysUntilDue !== null && (
            <div className={`flex items-center gap-1 text-xs font-medium ${daysUntilDue < 0 ? "text-destructive" : daysUntilDue <= 5 ? "text-orange-500" : "text-muted-foreground"}`}>
              <Clock className="h-3 w-3" />
              {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d overdue` : `${daysUntilDue}d left`}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Investigations() {
  const [selectedInv, setSelectedInv] = useState<Investigation | null>(null);
  const [search, setSearch] = useState("");

  const { data: investigations = [], isLoading } = useQuery<Investigation[]>({ queryKey: ["/api/investigations"] });
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/users"] });

  const filtered = investigations.filter(inv =>
    !search || inv.investigationNumber.toLowerCase().includes(search.toLowerCase()) ||
    (inv.testName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (inv.batchNumber ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const byStatus = {
    open: filtered.filter(i => i.status === "open"),
    phase1: filtered.filter(i => i.status === "phase1"),
    phase2: filtered.filter(i => i.status === "phase2"),
    closed: filtered.filter(i => i.status === "closed" || i.status === "invalidated"),
  };

  const stats = {
    total: filtered.length,
    oos: filtered.filter(i => i.type === "oos").length,
    oot: filtered.filter(i => i.type === "oot").length,
    trend: filtered.filter(i => i.type === "critical_trend").length,
  };

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">OOS / OOT Investigations</h2>
          <p className="text-sm text-muted-foreground">Monitor and resolve out-of-specification and out-of-trend results</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "OOS", count: stats.oos, color: "bg-destructive/10 text-destructive border-destructive/20" },
            { label: "OOT", count: stats.oot, color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20" },
            { label: "Trend", count: stats.trend, color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
          ].map(item => (
            <div key={item.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${item.color}`}>
              <span className="text-xs font-bold">{item.count}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <Input placeholder="Search investigations..." className="max-w-xs h-9" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-investigations" />

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">Open ({byStatus.open.length})</TabsTrigger>
          <TabsTrigger value="phase1">Phase 1 ({byStatus.phase1.length})</TabsTrigger>
          <TabsTrigger value="phase2">Phase 2 ({byStatus.phase2.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({byStatus.closed.length})</TabsTrigger>
          <TabsTrigger value="all">All ({filtered.length})</TabsTrigger>
        </TabsList>

        {["open", "phase1", "phase2", "closed", "all"].map(tab => {
          const items = tab === "all" ? filtered : byStatus[tab as keyof typeof byStatus] ?? filtered;
          return (
            <TabsContent key={tab} value={tab} className="mt-4">
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No investigations in this category</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map(inv => (
                    <InvestigationCard key={inv.id} inv={inv} users={users} onClick={() => setSelectedInv(inv)} />
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {selectedInv && (
        <Dialog open={!!selectedInv} onOpenChange={() => setSelectedInv(null)}>
          <InvestigationDetailDialog inv={selectedInv} users={users} onClose={() => setSelectedInv(null)} />
        </Dialog>
      )}
    </div>
  );
}
