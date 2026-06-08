import { useState } from "react";
import { useCanDelete } from "@/hooks/use-can-delete";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, FlaskConical, Search, Thermometer, Edit, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import type { StabilityStudy, Product, StorageCondition, Chamber } from "@shared/schema";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const studyTypeLabels: Record<string, string> = {
  long_term: "Long-Term",
  accelerated: "Accelerated",
  intermediate: "Intermediate",
  stress: "Stress",
  photostability: "Photostability",
  freeze_thaw: "Freeze/Thaw",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-green-500/10 text-green-600 dark:text-green-400",
  on_hold: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500",
  completed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  discontinued: "bg-destructive/10 text-destructive",
};

const typeBadge: Record<string, string> = {
  long_term: "bg-primary/10 text-primary",
  accelerated: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  intermediate: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  stress: "bg-red-500/10 text-red-600 dark:text-red-400",
  photostability: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500",
  freeze_thaw: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
};

// ── Edit Dialog ───────────────────────────────────────────────────────────────
function EditStudyDialog({ study, products, conditions, chambers, users, open, onOpenChange, onSave }: {
  study: StabilityStudy; products: Product[]; conditions: StorageCondition[]; chambers: Chamber[]; users: any[];
  open: boolean; onOpenChange: (v: boolean) => void; onSave: (data: any) => void;
}) {
  const [form, setForm] = useState<any>({
    ...study,
    startDate: study.startDate ? new Date(study.startDate).toISOString().slice(0, 10) : "",
  });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const { toast } = useToast();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Study</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Study Number *</Label>
              <Input value={form.studyNumber ?? ""} onChange={e => set("studyNumber", e.target.value)} /></div>
            <div className="space-y-1"><Label>Batch Number *</Label>
              <Input value={form.batchNumber ?? ""} onChange={e => set("batchNumber", e.target.value)} /></div>
          </div>
          <div className="space-y-1"><Label>Product *</Label>
            <Select value={form.productId} onValueChange={v => set("productId", v)}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} — {p.strength}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Study Type</Label>
              <Select value={form.studyType} onValueChange={v => set("studyType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(studyTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Status</Label>
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["draft","active","on_hold","completed","discontinued"].map(s => <SelectItem key={s} value={s}>{s.replace("_"," ")}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Start Date</Label>
              <Input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} /></div>
            <div className="space-y-1"><Label>Protocol Number</Label>
              <Input value={form.protocolNumber ?? ""} onChange={e => set("protocolNumber", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Storage Condition *</Label>
              <Select value={form.conditionId} onValueChange={v => set("conditionId", v)}>
                <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>{conditions.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Chamber</Label>
              <Select value={form.chamberId ?? ""} onValueChange={v => set("chamberId", v)}>
                <SelectTrigger><SelectValue placeholder="Select chamber" /></SelectTrigger>
                <SelectContent>{chambers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1"><Label>Analyst</Label>
            <Select value={form.analystId ?? ""} onValueChange={v => set("analystId", v)}>
              <SelectTrigger><SelectValue placeholder="Select analyst" /></SelectTrigger>
              <SelectContent>{users.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button data-testid="button-save-study" onClick={() => {
            if (!form.productId || !form.batchNumber || !form.conditionId || !form.studyNumber) return;
            onSave({ ...form, startDate: new Date(form.startDate) });
            onOpenChange(false);
          }}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── New Study Dialog ──────────────────────────────────────────────────────────
function NewStudyDialog({ products, conditions, chambers, users }: any) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ studyType: "long_term", status: "active", startDate: new Date().toISOString().slice(0, 10) });
  const { toast } = useToast();
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/studies", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Study created", description: "Time points auto-generated." });
      setOpen(false);
      setForm({ studyType: "long_term", status: "active", startDate: new Date().toISOString().slice(0, 10) });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-new-study" className="gap-2"><Plus className="h-4 w-4" />New Study</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Register Stability Study</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Study Number *</Label>
              <Input data-testid="input-study-number" placeholder="STAB-2026-001" value={form.studyNumber ?? ""} onChange={e => set("studyNumber", e.target.value)} /></div>
            <div className="space-y-1"><Label>Batch Number *</Label>
              <Input data-testid="input-batch-number" placeholder="BATCH-001" value={form.batchNumber ?? ""} onChange={e => set("batchNumber", e.target.value)} /></div>
          </div>
          <div className="space-y-1"><Label>Product *</Label>
            <Select value={form.productId} onValueChange={v => set("productId", v)}>
              <SelectTrigger data-testid="select-product"><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>{products?.map((p: Product) => <SelectItem key={p.id} value={p.id}>{p.name} — {p.strength}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Study Type *</Label>
              <Select value={form.studyType} onValueChange={v => set("studyType", v)}>
                <SelectTrigger data-testid="select-study-type"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(studyTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Start Date *</Label>
              <Input type="date" data-testid="input-start-date" value={form.startDate} onChange={e => set("startDate", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Storage Condition *</Label>
              <Select value={form.conditionId} onValueChange={v => set("conditionId", v)}>
                <SelectTrigger data-testid="select-condition"><SelectValue placeholder="Select condition" /></SelectTrigger>
                <SelectContent>{conditions?.map((c: StorageCondition) => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Chamber</Label>
              <Select value={form.chamberId} onValueChange={v => set("chamberId", v)}>
                <SelectTrigger data-testid="select-chamber"><SelectValue placeholder="Select chamber" /></SelectTrigger>
                <SelectContent>{chambers?.map((c: Chamber) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label>Protocol Number</Label>
              <Input data-testid="input-protocol" placeholder="PROT-001" value={form.protocolNumber ?? ""} onChange={e => set("protocolNumber", e.target.value)} /></div>
            <div className="space-y-1"><Label>Initial Quantity</Label>
              <Input type="number" data-testid="input-quantity" placeholder="120" value={form.initialQuantity ?? ""} onChange={e => set("initialQuantity", parseInt(e.target.value))} /></div>
          </div>
          <div className="space-y-1"><Label>Analyst</Label>
            <Select value={form.analystId} onValueChange={v => set("analystId", v)}>
              <SelectTrigger data-testid="select-analyst"><SelectValue placeholder="Select analyst" /></SelectTrigger>
              <SelectContent>{users?.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.fullName}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
            <span className="font-medium text-primary">Auto-generation: </span>Time points will be automatically scheduled based on the selected study type.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button data-testid="button-submit-study" onClick={() => {
            if (!form.productId || !form.batchNumber || !form.conditionId || !form.studyNumber) {
              toast({ title: "Please fill in all required fields.", variant: "destructive" }); return;
            }
            mutation.mutate({ ...form, startDate: new Date(form.startDate) });
          }} disabled={mutation.isPending}>
            {mutation.isPending ? "Creating…" : "Create Study"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Studies Table ─────────────────────────────────────────────────────────────
function StudiesTable({ studies, products, conditions, chambers, onEdit, onDelete }: {
  studies: StabilityStudy[]; products: Product[]; conditions: StorageCondition[]; chambers: Chamber[];
  onEdit: (s: StabilityStudy) => void; onDelete: (id: string) => void;
}) {
  const canDelete = useCanDelete();
  if (studies.length === 0) return (
    <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
      <FlaskConical className="h-10 w-10 mb-3 opacity-30" />
      <p className="text-sm">No studies found</p>
    </div>
  );

  return (
    <div className="overflow-auto rounded-md border">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b text-left">
            <th className="px-3 py-2 text-xs font-medium">Study No</th>
            <th className="px-3 py-2 text-xs font-medium">Product</th>
            <th className="px-3 py-2 text-xs font-medium">Batch</th>
            <th className="px-3 py-2 text-xs font-medium">Type</th>
            <th className="px-3 py-2 text-xs font-medium">Condition</th>
            <th className="px-3 py-2 text-xs font-medium">Chamber</th>
            <th className="px-3 py-2 text-xs font-medium">Start Date</th>
            <th className="px-3 py-2 text-xs font-medium">Protocol</th>
            <th className="px-3 py-2 text-xs font-medium">Status</th>
            <th className="px-3 py-2 text-xs font-medium w-16"></th>
          </tr>
        </thead>
        <tbody>
          {studies.map(s => {
            const product = products.find(p => p.id === s.productId);
            const condition = conditions.find(c => c.id === s.conditionId);
            const chamber = chambers.find(c => c.id === s.chamberId);
            return (
              <tr key={s.id} className="border-b hover:bg-muted/30 transition-colors" data-testid={`study-row-${s.id}`}>
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{s.studyNumber}</td>
                <td className="px-3 py-2">
                  <div className="font-medium leading-tight">{product?.name ?? "—"}</div>
                  {product?.strength && <div className="text-xs text-muted-foreground">{product.strength} {product.dosageForm}</div>}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{s.batchNumber}</td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${typeBadge[s.studyType] ?? "bg-muted text-muted-foreground"}`}>
                    {studyTypeLabels[s.studyType] ?? s.studyType}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs">{condition?.code ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{chamber?.name ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{s.startDate ? format(new Date(s.startDate), "dd MMM yyyy") : "—"}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">{s.protocolNumber ?? "—"}</td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[s.status]}`}>
                    {s.status.replace("_", " ").toUpperCase()}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(s)} data-testid={`button-edit-study-${s.id}`}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    {canDelete && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onDelete(s.id)} data-testid={`button-delete-study-${s.id}`}>
                        <Trash2 className="h-3 w-3 text-destructive" />
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
export default function Studies() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [editingStudy, setEditingStudy] = useState<StabilityStudy | null>(null);
  const { toast } = useToast();

  const { data: studies = [], isLoading } = useQuery<StabilityStudy[]>({ queryKey: ["/api/studies"] });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: conditions = [] } = useQuery<StorageCondition[]>({ queryKey: ["/api/storage-conditions"] });
  const { data: chambers = [] } = useQuery<Chamber[]>({ queryKey: ["/api/chambers"] });
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/users"] });

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/studies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Study updated" });
      setEditingStudy(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/studies/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/studies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Study deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleDelete = (id: string) => {
    if (confirm("Delete this study and all its time points? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  // Derive unique years present in studies for month filter context
  const activeFilters = filterType !== "all" || filterStatus !== "all" || filterProduct !== "all" || filterMonth !== "all" || !!search;

  const filtered = studies.filter(s => {
    const product = products.find(p => p.id === s.productId);
    if (search) {
      const q = search.toLowerCase();
      if (!s.studyNumber.toLowerCase().includes(q) && !s.batchNumber.toLowerCase().includes(q) && !(product?.name.toLowerCase().includes(q))) return false;
    }
    if (filterType !== "all" && s.studyType !== filterType) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (filterProduct !== "all" && s.productId !== filterProduct) return false;
    if (filterMonth !== "all") {
      const m = parseInt(filterMonth);
      const sm = s.startDate ? new Date(s.startDate).getMonth() : -1;
      if (sm !== m) return false;
    }
    return true;
  });

  const byStatus = {
    active: filtered.filter(s => s.status === "active"),
    on_hold: filtered.filter(s => s.status === "on_hold"),
    completed: filtered.filter(s => s.status === "completed"),
    draft: filtered.filter(s => s.status === "draft"),
  };

  function clearFilters() {
    setSearch(""); setFilterType("all"); setFilterStatus("all");
    setFilterProduct("all"); setFilterMonth("all");
  }

  return (
    <div className="p-6 space-y-4 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Stability Studies</h2>
          <p className="text-sm text-muted-foreground">{studies.length} total · {filtered.length} shown</p>
        </div>
        <NewStudyDialog products={products} conditions={conditions} chambers={chambers} users={users} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input data-testid="input-search-studies" placeholder="Search study, batch…" className="pl-8 h-8 w-44 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Product filter */}
        <Select value={filterProduct} onValueChange={setFilterProduct}>
          <SelectTrigger className="h-8 w-44 text-sm" data-testid="select-filter-product">
            <SelectValue placeholder="All Products" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {(products as Product[]).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Month filter (start month) */}
        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="h-8 w-36 text-sm" data-testid="select-filter-month">
            <SelectValue placeholder="All Months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Type filter */}
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-8 w-36 text-sm" data-testid="select-filter-type"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(studyTypeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-32 text-sm" data-testid="select-filter-status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        {activeFilters && (
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-muted-foreground" onClick={clearFilters} data-testid="button-clear-filters">
            <X className="h-3 w-3" />Clear
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active" data-testid="tab-active">Active ({byStatus.active.length})</TabsTrigger>
          <TabsTrigger value="on_hold" data-testid="tab-on-hold">On Hold ({byStatus.on_hold.length})</TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">Completed ({byStatus.completed.length})</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">All ({filtered.length})</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="mt-4 space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <>
            {["active","on_hold","completed","all"].map(tab => (
              <TabsContent key={tab} value={tab} className="mt-3">
                <StudiesTable
                  studies={tab === "all" ? filtered : byStatus[tab as keyof typeof byStatus]}
                  products={products}
                  conditions={conditions}
                  chambers={chambers}
                  onEdit={setEditingStudy}
                  onDelete={handleDelete}
                />
              </TabsContent>
            ))}
          </>
        )}
      </Tabs>

      {editingStudy && (
        <EditStudyDialog
          study={editingStudy}
          products={products}
          conditions={conditions}
          chambers={chambers}
          users={users}
          open={!!editingStudy}
          onOpenChange={v => { if (!v) setEditingStudy(null); }}
          onSave={data => editMutation.mutate({ id: editingStudy.id, data })}
        />
      )}
    </div>
  );
}
