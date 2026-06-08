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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Thermometer, AlertTriangle, CheckCircle2, Wrench, Plus, Zap, Clock, Info, Edit, Trash2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import type { Chamber, ChamberExcursion, StorageCondition } from "@shared/schema";

const chamberStatusConfig: Record<string, { label: string; icon: any; color: string; bg: string; dot: string }> = {
  operational: { label: "Operational", icon: CheckCircle2, color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", dot: "bg-green-500" },
  excursion: { label: "Excursion", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", dot: "bg-destructive" },
  maintenance: { label: "Maintenance", icon: Wrench, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500/10", dot: "bg-yellow-500" },
  offline: { label: "Offline", icon: Zap, color: "text-muted-foreground", bg: "bg-muted", dot: "bg-muted-foreground" },
};

function ChamberCard({ chamber, condition, excursions, onEdit, onDelete }: { chamber: Chamber; condition?: StorageCondition; excursions: ChamberExcursion[]; onEdit: (c: Chamber) => void; onDelete: (id: string) => void }) {
  const canDelete = useCanDelete();
  const activeExcursion = excursions.find(e => e.chamberId === chamber.id && e.status === "active");
  const sc = chamberStatusConfig[chamber.status] ?? chamberStatusConfig.operational;
  const Icon = sc.icon;

  return (
    <Card className="hover-elevate" data-testid={`chamber-card-${chamber.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`h-2 w-2 rounded-full ${sc.dot} ${chamber.status === "excursion" ? "animate-pulse" : ""}`} />
              <h3 className="font-bold text-base">{chamber.name}</h3>
            </div>
            {chamber.location && <p className="text-xs text-muted-foreground">{chamber.location}</p>}
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold ${sc.bg} ${sc.color}`}>
            <Icon className="h-3 w-3" />
            {sc.label}
          </div>
        </div>

        {condition && (
          <div className="p-3 rounded-lg bg-muted/40 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Thermometer className="h-3.5 w-3.5 text-primary" />
                <span className="text-sm font-semibold">{condition.temperature}°C</span>
                {condition.humidity && <span className="text-xs text-muted-foreground">/ {condition.humidity}% RH</span>}
              </div>
              <span className="text-xs font-medium text-muted-foreground">{condition.code}</span>
            </div>
          </div>
        )}

        {activeExcursion && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 mb-3">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs font-semibold text-destructive">Active Excursion</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {activeExcursion.minTemp}–{activeExcursion.maxTemp}°C | Started {formatDistanceToNow(new Date(activeExcursion.startTime))} ago
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div>
            <p className="text-muted-foreground">Capacity</p>
            <p className="font-medium">{chamber.capacity ? `${chamber.capacity} units` : "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Next Calibration</p>
            <p className="font-medium">{chamber.nextCalibrationDue ? format(new Date(chamber.nextCalibrationDue), "dd MMM yyyy") : "—"}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-1 pt-2 border-t border-border">
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(chamber)} data-testid={`button-edit-chamber-${chamber.id}`}>
            <Edit className="h-3 w-3" />
          </Button>
          {canDelete && (
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onDelete(chamber.id)} data-testid={`button-delete-chamber-${chamber.id}`}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function NewExcursionDialog({ chambers, users }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({
    status: "active",
    startTime: new Date().toISOString().slice(0, 16),
    placeSamplesOnHold: true,
  });
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/excursions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/excursions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chambers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Excursion logged", description: "Chamber placed under excursion status." });
      setOpen(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    if (!form.chamberId || !form.excursionNumber) {
      toast({ title: "Validation", description: "Fill in required fields.", variant: "destructive" });
      return;
    }
    mutation.mutate({ ...form, startTime: new Date(form.startTime), minTemp: parseFloat(form.minTemp), maxTemp: parseFloat(form.maxTemp), affectedStudiesCount: parseInt(form.affectedStudiesCount ?? "0") });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="gap-2" data-testid="button-log-excursion">
          <AlertTriangle className="h-4 w-4" /> Log Excursion
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Chamber Excursion</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Excursion Number *</Label>
              <Input data-testid="input-exc-number" placeholder="EXC-2026-001" value={form.excursionNumber ?? ""} onChange={e => set("excursionNumber", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Chamber *</Label>
              <Select value={form.chamberId} onValueChange={v => set("chamberId", v)}>
                <SelectTrigger data-testid="select-exc-chamber"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {chambers.map((c: Chamber) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Start Time *</Label>
            <Input type="datetime-local" value={form.startTime} onChange={e => set("startTime", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Min Temp (°C)</Label>
              <Input type="number" step="0.1" data-testid="input-exc-min-temp" value={form.minTemp ?? ""} onChange={e => set("minTemp", e.target.value)} placeholder="e.g. 26.5" />
            </div>
            <div className="space-y-1.5">
              <Label>Max Temp (°C)</Label>
              <Input type="number" step="0.1" data-testid="input-exc-max-temp" value={form.maxTemp ?? ""} onChange={e => set("maxTemp", e.target.value)} placeholder="e.g. 34.2" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Affected Studies</Label>
            <Input type="number" value={form.affectedStudiesCount ?? ""} onChange={e => set("affectedStudiesCount", e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label>Impact Assessment</Label>
            <Textarea value={form.impactAssessment ?? ""} onChange={e => set("impactAssessment", e.target.value)} placeholder="Initial assessment of impact..." className="h-16" />
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <input type="checkbox" id="onhold" checked={form.placeSamplesOnHold} onChange={e => set("placeSamplesOnHold", e.target.checked)} className="h-4 w-4" />
            <label htmlFor="onhold" className="text-sm font-medium text-destructive">Place affected samples on hold</label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" data-testid="button-submit-excursion" onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "Logging..." : "Log Excursion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ExcursionRow({ exc, chambers, onResolve, onDelete }: { exc: ChamberExcursion; chambers: Chamber[]; onResolve: (id: string) => void; onDelete: (id: string) => void }) {
  const canDelete = useCanDelete();
  const chamber = chambers.find(c => c.id === exc.chamberId);
  const statusColors: Record<string, string> = {
    active: "bg-destructive/10 text-destructive",
    resolved: "bg-green-500/10 text-green-600 dark:text-green-400",
    under_review: "bg-yellow-500/10 text-yellow-600",
  };

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-colors" data-testid={`excursion-${exc.id}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{exc.excursionNumber}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[exc.status] ?? "bg-muted text-muted-foreground"}`}>
            {exc.status.replace("_", " ").toUpperCase()}
          </span>
          {exc.placeSamplesOnHold && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400">SAMPLES ON HOLD</span>}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {chamber?.name} — {exc.minTemp && exc.maxTemp ? `${exc.minTemp}–${exc.maxTemp}°C` : "—"} — Started {format(new Date(exc.startTime), "dd MMM yyyy HH:mm")}
        </p>
        {exc.affectedStudiesCount ? <p className="text-xs text-muted-foreground">{exc.affectedStudiesCount} studies affected</p> : null}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {exc.status === "active" && (
          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onResolve(exc.id)} data-testid={`button-resolve-${exc.id}`}>
            <CheckCircle2 className="h-3 w-3" /> Resolve
          </Button>
        )}
        {canDelete && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(exc.id)} data-testid={`button-delete-excursion-${exc.id}`}>
            <Trash2 className="h-3 w-3 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}

function ChamberDialog({ chamber, conditions, open, onOpenChange, onSave }: { chamber?: Chamber; conditions: StorageCondition[]; open: boolean; onOpenChange: (v: boolean) => void; onSave: (data: any) => void }) {
  const isEdit = !!chamber;
  const [form, setForm] = useState<any>(chamber ?? { status: "operational" });
  const { toast } = useToast();

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name) {
      toast({ title: "Validation", description: "Chamber name is required.", variant: "destructive" });
      return;
    }
    onSave({ ...form, capacity: form.capacity ? parseInt(form.capacity) : undefined });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Chamber" : "New Chamber"}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Chamber Name *</Label>
              <Input data-testid="input-chamber-name" value={form.name ?? ""} onChange={e => set("name", e.target.value)} placeholder="e.g. LT-01" />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={form.location ?? ""} onChange={e => set("location", e.target.value)} placeholder="e.g. Lab A" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status ?? "operational"} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["operational", "maintenance", "offline", "excursion"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Capacity</Label>
              <Input type="number" value={form.capacity ?? ""} onChange={e => set("capacity", e.target.value)} placeholder="units" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Storage Condition</Label>
            <Select value={form.conditionId ?? ""} onValueChange={v => set("conditionId", v)}>
              <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
              <SelectContent>{conditions.map(c => <SelectItem key={c.id} value={c.id}>{c.code} — {c.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Calibration Due</Label>
            <Input type="date" value={form.nextCalibrationDue ? new Date(form.nextCalibrationDue).toISOString().slice(0, 10) : ""} onChange={e => set("nextCalibrationDue", e.target.value || null)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} data-testid="button-save-chamber">{isEdit ? "Save Changes" : "Create Chamber"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Chambers() {
  const { toast } = useToast();
  const [chamberDialogOpen, setChamberDialogOpen] = useState(false);
  const [editingChamber, setEditingChamber] = useState<Chamber | undefined>(undefined);

  const { data: chambers = [], isLoading: loadingChambers } = useQuery<Chamber[]>({ queryKey: ["/api/chambers"] });
  const { data: excursions = [], isLoading: loadingExcursions } = useQuery<ChamberExcursion[]>({ queryKey: ["/api/excursions"] });
  const { data: conditions = [] } = useQuery<StorageCondition[]>({ queryKey: ["/api/storage-conditions"] });
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/users"] });

  const resolveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/excursions/${id}`, { status: "resolved", endTime: new Date() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/excursions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chambers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Excursion resolved", description: "Chamber status restored to operational." });
    },
  });

  const deleteExcursionMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/excursions/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/excursions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chambers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Excursion deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createChamberMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/chambers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chambers"] });
      toast({ title: "Chamber created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateChamberMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/chambers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chambers"] });
      toast({ title: "Chamber updated" });
      setEditingChamber(undefined);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteChamberMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/chambers/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chambers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/studies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Chamber deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleSaveChamber = (data: any) => {
    if (editingChamber) {
      updateChamberMutation.mutate({ id: editingChamber.id, data });
    } else {
      createChamberMutation.mutate(data);
    }
  };

  const handleDeleteChamber = (id: string) => {
    if (confirm("Delete this chamber? This cannot be undone.")) deleteChamberMutation.mutate(id);
  };

  const handleDeleteExcursion = (id: string) => {
    if (confirm("Delete this excursion record? This cannot be undone.")) deleteExcursionMutation.mutate(id);
  };

  const activeExcursions = excursions.filter(e => e.status === "active");
  const getCondition = (c: Chamber) => conditions.find(cond => cond.id === c.conditionId);

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Chamber Management</h2>
          <p className="text-sm text-muted-foreground">Monitor storage chambers and manage excursion events</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-2" onClick={() => { setEditingChamber(undefined); setChamberDialogOpen(true); }} data-testid="button-new-chamber">
            <Plus className="h-4 w-4" /> New Chamber
          </Button>
          <NewExcursionDialog chambers={chambers} users={users} />
        </div>
      </div>

      {activeExcursions.length > 0 && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0 animate-pulse" />
          <div>
            <p className="text-sm font-semibold text-destructive">{activeExcursions.length} Active Chamber Excursion{activeExcursions.length > 1 ? "s" : ""}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Immediate action required. Affected samples may be on hold pending impact assessment.</p>
          </div>
        </div>
      )}

      {/* Chamber Grid */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Storage Chambers</h3>
        {loadingChambers ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {chambers.map(c => (
              <ChamberCard key={c.id} chamber={c} condition={getCondition(c)} excursions={excursions} onEdit={(chamber) => { setEditingChamber(chamber); setChamberDialogOpen(true); }} onDelete={handleDeleteChamber} />
            ))}
          </div>
        )}
      </div>

      {/* Excursions */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Excursion History</h3>
        <Card>
          <CardContent className="p-0">
            {loadingExcursions ? (
              <div className="p-4 space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : excursions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No excursions recorded</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {excursions.map(exc => (
                  <ExcursionRow key={exc.id} exc={exc} chambers={chambers} onResolve={id => resolveMutation.mutate(id)} onDelete={handleDeleteExcursion} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ChamberDialog
        chamber={editingChamber}
        conditions={conditions}
        open={chamberDialogOpen}
        onOpenChange={(v) => { setChamberDialogOpen(v); if (!v) setEditingChamber(undefined); }}
        onSave={handleSaveChamber}
      />
    </div>
  );
}
