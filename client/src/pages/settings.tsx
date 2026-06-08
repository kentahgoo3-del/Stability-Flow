import { useState } from "react";
import { useCanDelete } from "@/hooks/use-can-delete";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Plus, Package, FlaskConical, Thermometer, User, Trash2, Edit, Upload, Download, FileText, CheckCircle2, AlertCircle, RefreshCw, ShieldAlert } from "lucide-react";
import type { Product, StorageCondition, Chamber, TestSpecification } from "@shared/schema";

function ProductDialog({ product, onSave }: { product?: Product; onSave: (data: any) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(product ?? { active: true });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {product ? (
          <Button size="icon" variant="ghost" data-testid={`button-edit-product-${product.id}`}><Edit className="h-3.5 w-3.5" /></Button>
        ) : (
          <Button size="sm" className="gap-1" data-testid="button-add-product"><Plus className="h-4 w-4" /> Add</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Product Name *</Label><Input data-testid="input-product-name" value={form.name ?? ""} onChange={e => set("name", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Code *</Label><Input data-testid="input-product-code" value={form.code ?? ""} onChange={e => set("code", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Strength</Label><Input value={form.strength ?? ""} onChange={e => set("strength", e.target.value)} placeholder="500mg" /></div>
            <div className="space-y-1.5"><Label>Dosage Form</Label><Input value={form.dosageForm ?? ""} onChange={e => set("dosageForm", e.target.value)} placeholder="Capsule" /></div>
          </div>
          <div className="space-y-1.5"><Label>Manufacturer</Label><Input value={form.manufacturer ?? ""} onChange={e => set("manufacturer", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Shelf Life (months)</Label><Input type="number" value={form.shelfLifeMonths ?? ""} onChange={e => set("shelfLifeMonths", parseInt(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Study Period (months)</Label><Input type="number" value={form.reorderPeriodMonths ?? ""} onChange={e => set("reorderPeriodMonths", parseInt(e.target.value))} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button data-testid="button-save-product" onClick={() => { onSave(form); setOpen(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TestSpecDialog({ spec, products, onSave }: { spec?: TestSpecification; products: Product[]; onSave: (data: any) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(spec ?? {});
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {spec ? (
          <Button size="icon" variant="ghost" data-testid={`button-edit-spec-${spec.id}`}><Edit className="h-3.5 w-3.5" /></Button>
        ) : (
          <Button size="sm" className="gap-1" data-testid="button-add-spec"><Plus className="h-4 w-4" /> Add</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{spec ? "Edit Test Specification" : "Add Test Specification"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label>Product *</Label>
            <Select value={form.productId} onValueChange={v => set("productId", v)}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Test Name *</Label><Input data-testid="input-spec-name" value={form.testName ?? ""} onChange={e => set("testName", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Unit</Label><Input value={form.unit ?? ""} onChange={e => set("unit", e.target.value)} placeholder="%, kP, mg/mL" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Method Number</Label><Input value={form.methodNumber ?? ""} onChange={e => set("methodNumber", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Spec Number</Label><Input value={form.specificationNumber ?? ""} onChange={e => set("specificationNumber", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Spec Min</Label><Input type="number" step="0.01" value={form.specMin ?? ""} onChange={e => set("specMin", parseFloat(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Spec Max</Label><Input type="number" step="0.01" value={form.specMax ?? ""} onChange={e => set("specMax", parseFloat(e.target.value))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Alert Min</Label><Input type="number" step="0.01" value={form.alertMin ?? ""} onChange={e => set("alertMin", parseFloat(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Alert Max</Label><Input type="number" step="0.01" value={form.alertMax ?? ""} onChange={e => set("alertMax", parseFloat(e.target.value))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Category</Label><Input value={form.category ?? ""} onChange={e => set("category", e.target.value)} placeholder="Chemical, Physical..." /></div>
            <div className="space-y-1.5"><Label>Instrument</Label><Input value={form.instrumentType ?? ""} onChange={e => set("instrumentType", e.target.value)} placeholder="HPLC, UV..." /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button data-testid="button-save-spec" onClick={() => { onSave(form); setOpen(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConditionDialog({ condition, onSave, trigger }: { condition?: StorageCondition; onSave: (data: any) => void; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(condition ?? {});
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{condition ? "Edit Condition" : "New Storage Condition"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Code *</Label><Input data-testid="input-condition-code" value={form.code ?? ""} onChange={e => set("code", e.target.value)} placeholder="25C/60RH" /></div>
            <div className="space-y-1.5"><Label>ICH Zone</Label><Input value={form.ichZone ?? ""} onChange={e => set("ichZone", e.target.value)} placeholder="I, II, III..." /></div>
          </div>
          <div className="space-y-1.5"><Label>Label</Label><Input value={form.label ?? ""} onChange={e => set("label", e.target.value)} placeholder="25°C / 60% RH (Long-Term)" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Temperature (°C) *</Label><Input type="number" step="0.1" value={form.temperature ?? ""} onChange={e => set("temperature", parseFloat(e.target.value))} /></div>
            <div className="space-y-1.5"><Label>Humidity (% RH)</Label><Input type="number" step="1" value={form.humidity ?? ""} onChange={e => set("humidity", parseFloat(e.target.value))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Temp Tolerance (±°C)</Label><Input type="number" step="0.1" value={form.tempTolerance ?? ""} onChange={e => set("tempTolerance", parseFloat(e.target.value))} placeholder="2" /></div>
            <div className="space-y-1.5"><Label>RH Tolerance (±%)</Label><Input type="number" step="1" value={form.humidityTolerance ?? ""} onChange={e => set("humidityTolerance", parseFloat(e.target.value))} placeholder="5" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button data-testid="button-save-condition" onClick={() => { onSave(form); setOpen(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UserDialog({ user, onSave, trigger }: { user?: any; onSave: (data: any) => void; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(user ?? { role: "analyst", active: true });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{user ? "Edit User" : "New User"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Full Name *</Label><Input data-testid="input-user-fullname" value={form.fullName ?? ""} onChange={e => set("fullName", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Username *</Label><Input value={form.username ?? ""} onChange={e => set("username", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email ?? ""} onChange={e => set("email", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Department</Label><Input value={form.department ?? ""} onChange={e => set("department", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role ?? "analyst"} onValueChange={v => set("role", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["admin", "manager", "section_head", "analyst"].map(r => <SelectItem key={r} value={r}>{r === "section_head" ? "Section Head" : r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {!user && <div className="space-y-1.5"><Label>Password *</Label><Input type="password" value={form.password ?? ""} onChange={e => set("password", e.target.value)} /></div>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button data-testid="button-save-user" onClick={() => { onSave(form); setOpen(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettingsChamberDialog({ chamber, conditions, onSave, trigger }: { chamber?: Chamber; conditions: StorageCondition[]; onSave: (data: any) => void; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(chamber ?? { status: "operational" });
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{chamber ? "Edit Chamber" : "New Chamber"}</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Chamber Name *</Label><Input data-testid="input-chamber-name" value={form.name ?? ""} onChange={e => set("name", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={form.location ?? ""} onChange={e => set("location", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status ?? "operational"} onValueChange={v => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["operational", "maintenance", "offline"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Capacity</Label><Input type="number" value={form.capacity ?? ""} onChange={e => set("capacity", parseInt(e.target.value))} /></div>
          </div>
          <div className="space-y-1.5">
            <Label>Storage Condition</Label>
            <Select value={form.conditionId ?? ""} onValueChange={v => set("conditionId", v)}>
              <SelectTrigger><SelectValue placeholder="Select condition" /></SelectTrigger>
              <SelectContent>{conditions.map(c => <SelectItem key={c.id} value={c.id}>{c.code}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button data-testid="button-save-chamber" onClick={() => { onSave(form); setOpen(false); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AnalystsTab({ users, createUserMutation, deleteUserMutation }: { users: any[]; createUserMutation: any; deleteUserMutation: any }) {
  const { toast } = useToast();
  const canDelete = useCanDelete();
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");

  const analysts = users.filter((u: any) => u.role === "analyst");

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) { toast({ title: "Name is required", variant: "destructive" }); return; }
    const username = trimmed.toLowerCase().replace(/\s+/g, ".") + "." + Date.now().toString().slice(-4);
    createUserMutation.mutate({
      fullName: trimmed,
      username,
      email: `${username}@stabilityflow.local`,
      password: "analyst123",
      role: "analyst",
      department: department.trim() || undefined,
    });
    setName("");
    setDepartment("");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Add Analyst</CardTitle>
          <p className="text-xs text-muted-foreground">Analysts added here will appear in the analyst dropdown throughout the application.</p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <Label>Full Name *</Label>
              <Input
                data-testid="input-analyst-fullname"
                placeholder="e.g. Jane Smith"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
              />
            </div>
            <div className="w-44 space-y-1.5">
              <Label>Department</Label>
              <Input
                data-testid="input-analyst-department"
                placeholder="e.g. QC Lab"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
              />
            </div>
            <Button
              data-testid="button-add-analyst"
              onClick={handleAdd}
              disabled={createUserMutation.isPending}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Analysts ({analysts.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {analysts.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">No analysts added yet. Add one above.</p>
          ) : (
            <div className="divide-y divide-border">
              {analysts.map((u: any) => (
                <div key={u.id} className="px-4 py-3 flex items-center gap-4" data-testid={`analyst-row-${u.id}`}>
                  <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{u.fullName}</p>
                    {u.department && <p className="text-xs text-muted-foreground">{u.department}</p>}
                  </div>
                  {canDelete && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => { if (confirm(`Remove analyst "${u.fullName}"?`)) deleteUserMutation.mutate(u.id); }}
                      data-testid={`button-delete-analyst-${u.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Settings() {
  const { toast } = useToast();
  const canDelete = useCanDelete();
  const isAdmin = (() => { try { const u = JSON.parse(localStorage.getItem("sf_user") || "{}"); return u?.role === "admin"; } catch { return false; } })();

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-center p-8">
        <SettingsIcon className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm font-medium text-muted-foreground">Settings are only accessible to administrators.</p>
      </div>
    );
  }
  const { data: products = [], isLoading: loadingProducts } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: specs = [], isLoading: loadingSpecs } = useQuery<TestSpecification[]>({ queryKey: ["/api/test-specifications"] });
  const { data: conditions = [] } = useQuery<StorageCondition[]>({ queryKey: ["/api/storage-conditions"] });
  const { data: chambers = [] } = useQuery<Chamber[]>({ queryKey: ["/api/chambers"] });
  const { data: users = [] } = useQuery<any[]>({ queryKey: ["/api/users"] });

  const createProductMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/products", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); toast({ title: "Product added" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/products/${id}`, undefined),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/products"] }); toast({ title: "Product deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createSpecMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/test-specifications", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/test-specifications"] }); toast({ title: "Specification added" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteSpecMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/test-specifications/${id}`, undefined),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/test-specifications"] }); toast({ title: "Specification deleted" }); },
  });

  const createConditionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/storage-conditions", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/storage-conditions"] }); toast({ title: "Condition added" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateConditionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/storage-conditions/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/storage-conditions"] }); toast({ title: "Condition updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteConditionMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/storage-conditions/${id}`, undefined),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/storage-conditions"] }); toast({ title: "Condition deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createChamberMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/chambers", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/chambers"] }); toast({ title: "Chamber created" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateChamberMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/chambers/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/chambers"] }); toast({ title: "Chamber updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteChamberMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/chambers/${id}`, undefined),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/chambers"] }); toast({ title: "Chamber deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/users", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); toast({ title: "User created" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/users/${id}`, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); toast({ title: "User updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`, undefined),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/users"] }); toast({ title: "User deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const getProductName = (productId: string | null) => products.find(p => p.id === productId)?.name ?? "—";
  const getConditionCode = (condId: string | null) => conditions.find(c => c.id === condId)?.code ?? "—";

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl mx-auto">
      <div>
        <h2 className="text-lg font-bold">Settings</h2>
        <p className="text-sm text-muted-foreground">Master data configuration and system settings</p>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products" className="gap-1.5"><Package className="h-3.5 w-3.5" /> Products</TabsTrigger>
          <TabsTrigger value="specs" className="gap-1.5"><FlaskConical className="h-3.5 w-3.5" /> Test Specs</TabsTrigger>
          <TabsTrigger value="conditions" className="gap-1.5"><Thermometer className="h-3.5 w-3.5" /> Conditions</TabsTrigger>
          <TabsTrigger value="chambers" className="gap-1.5"><Thermometer className="h-3.5 w-3.5" /> Chambers</TabsTrigger>
          <TabsTrigger value="analysts" className="gap-1.5"><User className="h-3.5 w-3.5" /> Analysts</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><User className="h-3.5 w-3.5" /> Users</TabsTrigger>
          <TabsTrigger value="import-export" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Import / Export</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="data-management" className="gap-1.5 text-destructive data-[state=active]:text-destructive">
              <ShieldAlert className="h-3.5 w-3.5" /> Data Management
            </TabsTrigger>
          )}
        </TabsList>

        {/* Products */}
        <TabsContent value="products" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Products ({products.length})</CardTitle>
              <ProductDialog onSave={createProductMutation.mutate} />
            </CardHeader>
            <CardContent className="p-0">
              {loadingProducts ? <Skeleton className="m-4 h-40" /> : (
                <div className="divide-y divide-border">
                  {products.map(p => (
                    <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3" data-testid={`product-row-${p.id}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{p.name}</p>
                          <span className="text-xs font-mono text-muted-foreground">{p.code}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{p.strength} {p.dosageForm} — {p.manufacturer}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{p.shelfLifeMonths}mo shelf-life</span>
                        <ProductDialog product={p} onSave={(data) => apiRequest("PATCH", `/api/products/${p.id}`, data).then(() => queryClient.invalidateQueries({ queryKey: ["/api/products"] }))} />
                        {canDelete && <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this product?")) deleteProductMutation.mutate(p.id); }} data-testid={`button-delete-product-${p.id}`}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Specifications */}
        <TabsContent value="specs" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Test Specifications ({specs.length})</CardTitle>
              <TestSpecDialog products={products} onSave={createSpecMutation.mutate} />
            </CardHeader>
            <CardContent className="p-0">
              {loadingSpecs ? <Skeleton className="m-4 h-40" /> : (
                <div className="divide-y divide-border">
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/30 text-[10px] font-semibold text-muted-foreground uppercase">
                    <span className="col-span-2">Product</span>
                    <span className="col-span-2">Test</span>
                    <span className="col-span-1">Unit</span>
                    <span className="col-span-2">Spec Limits</span>
                    <span className="col-span-2">Alert Limits</span>
                    <span className="col-span-2">Method</span>
                    <span className="col-span-1"></span>
                  </div>
                  {specs.map(s => (
                    <div key={s.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-sm" data-testid={`spec-row-${s.id}`}>
                      <span className="col-span-2 text-xs text-muted-foreground truncate">{getProductName(s.productId)}</span>
                      <span className="col-span-2 font-medium">{s.testName}</span>
                      <span className="col-span-1 text-xs">{s.unit}</span>
                      <span className="col-span-2 text-xs font-mono">{s.specMin ?? "—"} – {s.specMax ?? "—"}</span>
                      <span className="col-span-2 text-xs font-mono">{s.alertMin ?? "—"} – {s.alertMax ?? "—"}</span>
                      <span className="col-span-2 text-xs text-muted-foreground">{s.methodNumber}</span>
                      <div className="col-span-1 flex justify-end gap-1">
                        <TestSpecDialog spec={s} products={products} onSave={(data) => apiRequest("PATCH", `/api/test-specifications/${s.id}`, data)} />
                        {canDelete && <Button size="icon" variant="ghost" onClick={() => deleteSpecMutation.mutate(s.id)} data-testid={`button-delete-spec-${s.id}`}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Storage Conditions */}
        <TabsContent value="conditions" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Storage Conditions ({conditions.length})</CardTitle>
              <ConditionDialog onSave={createConditionMutation.mutate} trigger={<Button size="sm" className="gap-1" data-testid="button-add-condition"><Plus className="h-4 w-4" /> Add</Button>} />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {conditions.map(c => (
                  <div key={c.id} className="px-4 py-3 flex items-center gap-4" data-testid={`condition-row-${c.id}`}>
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Thermometer className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{c.code}</span>
                        {c.ichZone && <Badge variant="outline" className="text-[10px] no-default-active-elevate">{c.ichZone}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{c.label}</p>
                    </div>
                    <div className="text-right mr-2">
                      <p className="text-sm font-medium">{c.temperature}°C{c.humidity ? ` / ${c.humidity}% RH` : ""}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <ConditionDialog condition={c} onSave={(data) => updateConditionMutation.mutate({ id: c.id, data })} trigger={<Button size="icon" variant="ghost" data-testid={`button-edit-condition-${c.id}`}><Edit className="h-3.5 w-3.5" /></Button>} />
                      {canDelete && <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this condition?")) deleteConditionMutation.mutate(c.id); }} data-testid={`button-delete-condition-${c.id}`}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chambers */}
        <TabsContent value="chambers" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Chambers ({chambers.length})</CardTitle>
              <SettingsChamberDialog conditions={conditions} onSave={createChamberMutation.mutate} trigger={<Button size="sm" className="gap-1" data-testid="button-add-chamber"><Plus className="h-4 w-4" /> Add</Button>} />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {chambers.map(c => {
                  const cond = conditions.find(cd => cd.id === c.conditionId);
                  const statusColors: Record<string, string> = {
                    operational: "bg-green-500/10 text-green-600 dark:text-green-400",
                    excursion: "bg-destructive/10 text-destructive",
                    maintenance: "bg-yellow-500/10 text-yellow-600",
                    offline: "bg-muted text-muted-foreground",
                  };
                  return (
                    <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-4" data-testid={`chamber-row-${c.id}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{c.name}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[c.status] ?? ""}`}>
                            {c.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{c.location} — {cond?.code ?? "—"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground mr-1">Cap: {c.capacity ?? "—"}</span>
                        <SettingsChamberDialog chamber={c} conditions={conditions} onSave={(data) => updateChamberMutation.mutate({ id: c.id, data })} trigger={<Button size="icon" variant="ghost" data-testid={`button-edit-chamber-${c.id}`}><Edit className="h-3.5 w-3.5" /></Button>} />
                        {canDelete && <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this chamber?")) deleteChamberMutation.mutate(c.id); }} data-testid={`button-delete-chamber-settings-${c.id}`}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysts */}
        <TabsContent value="analysts" className="mt-4">
          <AnalystsTab
            users={users}
            createUserMutation={createUserMutation}
            deleteUserMutation={deleteUserMutation}
          />
        </TabsContent>

        {/* Users */}
        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">System Users ({users.length})</CardTitle>
              <UserDialog onSave={createUserMutation.mutate} trigger={<Button size="sm" className="gap-1" data-testid="button-add-user"><Plus className="h-4 w-4" /> Add</Button>} />
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {users.map(u => {
                  const roleColors: Record<string, string> = {
                    admin: "bg-destructive/10 text-destructive",
                    manager: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
                    section_head: "bg-primary/10 text-primary",
                    reviewer: "bg-primary/10 text-primary",
                    analyst: "bg-green-500/10 text-green-600 dark:text-green-400",
                  };
                  const roleLabels: Record<string, string> = {
                    admin: "ADMIN", manager: "MANAGER", section_head: "SECTION HEAD", reviewer: "SECTION HEAD", analyst: "ANALYST",
                  };
                  return (
                    <div key={u.id} className="px-4 py-3 flex items-center gap-4" data-testid={`user-row-${u.id}`}>
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{u.fullName}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${roleColors[u.role] ?? "bg-muted text-muted-foreground"}`}>
                            {roleLabels[u.role] ?? u.role?.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{u.username} — {u.department}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{u.email}</span>
                      <div className="flex items-center gap-1">
                        <UserDialog user={u} onSave={(data) => updateUserMutation.mutate({ id: u.id, data })} trigger={<Button size="icon" variant="ghost" data-testid={`button-edit-user-${u.id}`}><Edit className="h-3.5 w-3.5" /></Button>} />
                        {canDelete && <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this user?")) deleteUserMutation.mutate(u.id); }} data-testid={`button-delete-user-${u.id}`}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Import / Export */}
        <TabsContent value="import-export" className="mt-4">
          <ImportExportTab />
        </TabsContent>

        {/* Data Management (admin only) */}
        {isAdmin && (
          <TabsContent value="data-management" className="mt-4">
            <DataManagementTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// ─── CSV Utilities ────────────────────────────────────────────────────────────

function downloadCSV(filename: string, rows: any[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(row => headers.map(h => {
      const v = row[h] == null ? "" : String(row[h]);
      return `"${v.replace(/"/g, '""')}"`;
    }).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadTemplate(filename: string, headers: string[], exampleRows?: string[][]) {
  let csv = headers.join(",") + "\n";
  if (exampleRows) {
    for (const row of exampleRows) {
      csv += row.map(v => (v.includes(",") ? `"${v}"` : v)).join(",") + "\n";
    }
  }
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const MASTER_TEMPLATE_EXAMPLE_ROW = [
  // productName, productCode, strength, dosageForm, manufacturer, shelfLifeMonths
  "Amoxicillin Trihydrate", "AMX-500", "500mg", "Capsule", "PharmaCo Ltd", "36",
  // conditionCode, conditionLabel, conditionTemp, conditionHumidity, ichZone
  "25C/60RH", "25°C / 60% RH (Long-Term)", "25", "60", "II",
  // chamberName, chamberLocation
  "LT-01", "Lab A, Unit 1",
  // studyNumber, batchNumber, studyType, studyStatus, protocolNumber,
  // studyStartDate, manufacturingDate, expiryDate, containerType, packageSize, initialQuantity, studyNotes
  "STAB-2025-001", "AMX-B001", "long_term", "active", "PROT-LT-001",
  "2025-03-01", "2024-12-01", "2027-12-01", "HDPE Bottle", "100 count", "120", "",
  // timePointLabel, plannedPullDate, actualPullDate, timePointStatus
  "T0", "2025-03-01", "2025-03-01", "completed",
  // barcode, shelf, position,
  // numberOfContainers, quantityPerContainer, quantityPlaced, quantityRemaining,
  // orientationInChamber, containerClosureSystem,
  // sampleStatus, onHold, holdReason, placedAt, sampleNotes
  "AMX-S-001-T0", "Shelf A", "A1",
  "5", "20", "100", "80",
  "Upright", "Screw Cap",
  "stored", "false", "", "2025-03-01", "",
];

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, "").trim());
  return lines.slice(1).map(line => {
    const values: string[] = [];
    let cur = ""; let inQuote = false;
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === "," && !inQuote) { values.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    values.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

// ─── Import/Export Tab Component ─────────────────────────────────────────────

const MASTER_TEMPLATE_HEADERS = [
  // Product
  "productName", "productCode", "strength", "dosageForm", "manufacturer", "shelfLifeMonths",
  // Condition
  "conditionCode", "conditionLabel", "conditionTemp", "conditionHumidity", "ichZone",
  // Chamber
  "chamberName", "chamberLocation",
  // Study
  "studyNumber", "batchNumber", "studyType", "studyStatus", "protocolNumber",
  "studyStartDate", "manufacturingDate", "expiryDate", "containerType", "packageSize", "initialQuantity", "studyNotes",
  // Time Point
  "timePointLabel", "plannedPullDate", "actualPullDate", "timePointStatus",
  // Sample
  "barcode", "shelf", "position",
  "numberOfContainers", "quantityPerContainer", "quantityPlaced", "quantityRemaining",
  "orientationInChamber", "containerClosureSystem",
  "sampleStatus", "onHold", "holdReason", "placedAt", "sampleNotes",
];

function ImportExportTab() {
  const { toast } = useToast();
  const [importResults, setImportResults] = useState<Record<string, { imported?: number; created?: number; skipped?: number; total?: number; error?: string; errors?: string[] }>>({});
  const [masterImporting, setMasterImporting] = useState(false);

  const EXPORT_CONFIGS = [
    { key: "products", label: "Products", endpoint: "/api/export/products", filename: "products.csv" },
    { key: "test-specifications", label: "Test Specifications", endpoint: "/api/export/test-specifications", filename: "test_specifications.csv" },
    { key: "conditions", label: "Storage Conditions", endpoint: "/api/export/conditions", filename: "storage_conditions.csv" },
    { key: "chambers", label: "Chambers", endpoint: "/api/export/chambers", filename: "chambers.csv" },
    { key: "studies", label: "Stability Studies", endpoint: "/api/export/studies", filename: "stability_studies.csv" },
    { key: "samples", label: "Stability Samples (Full View)", endpoint: "/api/export/samples", filename: "stability_samples.csv" },
  ];

  const IMPORT_CONFIGS = [
    {
      key: "products",
      label: "Products",
      endpoint: "/api/import/products",
      templateHeaders: ["name", "code", "strength", "dosageForm", "manufacturer", "shelfLifeMonths", "reorderPeriodMonths", "notes"],
      templateFile: "products_template.csv",
      description: "Import product master data. Required: name, code.",
    },
    {
      key: "test-specifications",
      label: "Test Specifications",
      endpoint: "/api/import/test-specifications",
      templateHeaders: ["testName", "methodNumber", "specificationNumber", "unit", "specMin", "specMax", "alertMin", "alertMax", "ootCriteriaPercent", "instrumentType", "category"],
      templateFile: "test_specs_template.csv",
      description: "Import test specifications. Required: testName.",
    },
    {
      key: "studies",
      label: "Stability Studies",
      endpoint: "/api/import/studies",
      templateHeaders: ["studyNumber", "batchNumber", "studyType", "startDate", "protocolNumber", "initialQuantity", "containerType", "strength", "dosageForm", "manufacturingDate", "expiryDate", "notes"],
      templateFile: "studies_template.csv",
      description: "Import stability studies. Required: studyNumber, batchNumber, studyType, startDate.",
    },
    {
      key: "samples",
      label: "Stability Samples",
      endpoint: "/api/import/samples",
      templateHeaders: ["barcode", "shelf", "position", "quantityPlaced", "quantityRemaining", "numberOfContainers", "quantityPerContainer", "manufacturingDate", "expiryDate", "orientationInChamber", "containerClosureSystem", "status", "placedAt", "notes"],
      templateFile: "samples_template.csv",
      description: "Import stability samples. Required: status.",
    },
  ];

  async function handleExport(cfg: typeof EXPORT_CONFIGS[0]) {
    try {
      const res = await fetch(cfg.endpoint);
      const data = await res.json();
      downloadCSV(cfg.filename, data);
      toast({ title: `Exported ${data.length} records`, description: cfg.filename });
    } catch (e: any) {
      toast({ title: "Export failed", description: e.message, variant: "destructive" });
    }
  }

  async function handleMasterImport(file: File) {
    const text = await file.text();
    const rows = parseCSV(text);
    if (!rows.length) {
      toast({ title: "Empty file", description: "No data rows found in the CSV", variant: "destructive" });
      return;
    }
    setMasterImporting(true);
    try {
      const res = await fetch("/api/import/master", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rows) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      setImportResults(r => ({ ...r, master: result }));
      const parts = [`Created ${result.created} new`];
      if (result.updated) parts.push(`updated ${result.updated} existing`);
      if (result.skipped) parts.push(`skipped ${result.skipped}`);
      if (result.errors?.length) parts.push(`${result.errors.length} errors`);
      const msg = parts.join(" · ") + " samples";
      toast({ title: "Master import complete", description: msg });
    } catch (e: any) {
      setImportResults(r => ({ ...r, master: { created: 0, skipped: 0, error: e.message } }));
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    } finally {
      setMasterImporting(false);
    }
  }

  async function handleImport(cfg: typeof IMPORT_CONFIGS[0], file: File) {
    const text = await file.text();
    const rows = parseCSV(text);
    if (!rows.length) {
      toast({ title: "Empty file", description: "No data rows found in the CSV", variant: "destructive" });
      return;
    }
    const coerced = rows.map(row => {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(row)) {
        if (!v) continue;
        const numFields = ["specMin", "specMax", "alertMin", "alertMax", "ootCriteriaPercent", "temperature", "humidity", "shelfLifeMonths", "reorderPeriodMonths", "initialQuantity", "quantityPlaced", "quantityRemaining", "numberOfContainers", "quantityPerContainer", "intervalMonths"];
        if (numFields.includes(k)) { out[k] = parseFloat(v) || undefined; }
        else if (k.endsWith("At") || k.endsWith("Date")) { try { out[k] = new Date(v).toISOString(); } catch { out[k] = v; } }
        else { out[k] = v; }
      }
      return out;
    });
    try {
      const res = await fetch(cfg.endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(coerced) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      setImportResults(r => ({ ...r, [cfg.key]: result }));
      toast({ title: `Imported ${result.imported} of ${result.total} records`, description: `${cfg.label} import complete` });
    } catch (e: any) {
      setImportResults(r => ({ ...r, [cfg.key]: { imported: 0, total: rows.length, error: e.message } }));
      toast({ title: "Import failed", description: e.message, variant: "destructive" });
    }
  }

  const masterResult = importResults["master"];

  return (
    <div className="space-y-5">
      {/* ── Master Import (highlighted) ───────────────────────────────────── */}
      <Card className="border-primary/40 bg-primary/[0.02]">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
              <Upload className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-sm">Master Import Template</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                One spreadsheet to import everything — products, conditions, chambers, studies, time points, and samples in a single upload.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Column groups preview */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {[
              { group: "Product", cols: "productName, productCode, strength, dosageForm, manufacturer, shelfLifeMonths", color: "bg-blue-500/10 text-blue-700 dark:text-blue-300" },
              { group: "Condition", cols: "conditionCode, conditionLabel, conditionTemp, conditionHumidity, ichZone", color: "bg-teal-500/10 text-teal-700 dark:text-teal-300" },
              { group: "Chamber", cols: "chamberName, chamberLocation", color: "bg-purple-500/10 text-purple-700 dark:text-purple-300" },
              { group: "Study", cols: "studyNumber, batchNumber, studyType, protocolNumber, studyStartDate, manufacturingDate, expiryDate, containerType", color: "bg-orange-500/10 text-orange-700 dark:text-orange-300" },
              { group: "Time Point", cols: "timePointLabel, plannedPullDate, actualPullDate, timePointStatus", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300" },
              { group: "Sample", cols: "barcode, shelf, position, numberOfContainers, quantityPlaced, sampleStatus, onHold, placedAt", color: "bg-green-500/10 text-green-700 dark:text-green-300" },
            ].map(({ group, cols, color }) => (
              <div key={group} className={`rounded-md px-2.5 py-2 ${color}`}>
                <p className="font-semibold text-[10px] uppercase tracking-wide mb-0.5">{group}</p>
                <p className="leading-relaxed opacity-80">{cols}</p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
            <p className="font-medium text-foreground">How it works:</p>
            <p>• Each row = one stability sample with all its context</p>
            <p>• Products, conditions, chambers, studies, and time points are <strong>created or matched automatically</strong> — no need to pre-load them</p>
            <p>• Duplicate samples (same barcode) are skipped, not overwritten</p>
            <p>• Only <strong>studyNumber</strong>, <strong>batchNumber</strong>, and <strong>studyStartDate</strong> are required to create a study</p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => downloadTemplate("stability_master_template.csv", MASTER_TEMPLATE_HEADERS, [MASTER_TEMPLATE_EXAMPLE_ROW])}
              data-testid="button-download-master-template"
            >
              <FileText className="h-3.5 w-3.5" />
              Download Master Template
            </Button>
            <label>
              <div
                className={`flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-md cursor-pointer transition-colors border ${masterImporting ? "opacity-50 pointer-events-none bg-muted" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}
                data-testid="button-upload-master"
              >
                {masterImporting ? (
                  <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Importing…</>
                ) : (
                  <><Upload className="h-3.5 w-3.5" /> Import Master CSV</>
                )}
              </div>
              <input
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleMasterImport(f); e.target.value = ""; }}
                data-testid="input-master-file"
                disabled={masterImporting}
              />
            </label>
          </div>

          {/* Result */}
          {masterResult && (
            <div className={`rounded-md px-3 py-2.5 text-xs space-y-1 ${masterResult.error ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-700 dark:text-green-400"}`}>
              {masterResult.error ? (
                <div className="flex items-center gap-2"><AlertCircle className="h-3.5 w-3.5" /> {masterResult.error}</div>
              ) : (
                <>
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Import complete — {masterResult.created} created{(masterResult as any).updated ? `, ${(masterResult as any).updated} updated` : ""}{masterResult.skipped ? `, ${masterResult.skipped} skipped` : ""}
                  </div>
                  {masterResult.errors && masterResult.errors.length > 0 && (
                    <div className="pl-5 space-y-0.5 text-destructive">
                      {masterResult.errors.slice(0, 5).map((e, i) => <p key={i}>{e}</p>)}
                      {masterResult.errors.length > 5 && <p>…and {masterResult.errors.length - 5} more errors</p>}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Export Master Data</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Download any dataset as a CSV file for use in external tools.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {EXPORT_CONFIGS.map(cfg => (
              <Button
                key={cfg.key}
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-9"
                onClick={() => handleExport(cfg)}
                data-testid={`button-export-${cfg.key}`}
              >
                <Download className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{cfg.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Import */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Import Master Data</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">Upload CSV files to bulk-import records. Download templates to ensure correct column names.</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {IMPORT_CONFIGS.map(cfg => {
              const result = importResults[cfg.key];
              return (
                <div key={cfg.key} className="border rounded-lg p-4 space-y-3" data-testid={`import-card-${cfg.key}`}>
                  <div>
                    <p className="text-sm font-semibold">{cfg.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{cfg.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs h-8"
                      onClick={() => downloadTemplate(cfg.templateFile, cfg.templateHeaders)}
                      data-testid={`button-template-${cfg.key}`}
                    >
                      <FileText className="h-3 w-3" />
                      Template
                    </Button>
                    <label className="flex-1">
                      <div className="flex items-center justify-center gap-1.5 h-8 px-3 text-xs border border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors" data-testid={`button-import-${cfg.key}`}>
                        <Upload className="h-3 w-3" />
                        Choose CSV
                      </div>
                      <input
                        type="file"
                        accept=".csv"
                        className="sr-only"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleImport(cfg, f); e.target.value = ""; }}
                        data-testid={`input-file-${cfg.key}`}
                      />
                    </label>
                  </div>
                  {result && (
                    <div className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-md ${result.error ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-700 dark:text-green-400"}`}>
                      {result.error ? <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> : <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />}
                      {result.error ? result.error : `Imported ${result.imported} / ${result.total} records`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Format Guide */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">CSV Format Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• First row must contain column headers (case-sensitive, camelCase)</p>
            <p>• Dates should be in ISO format: <code className="font-mono bg-muted px-1 rounded">YYYY-MM-DD</code> or <code className="font-mono bg-muted px-1 rounded">YYYY-MM-DDTHH:mm:ssZ</code></p>
            <p>• Numeric fields: use decimal numbers without commas (e.g., <code className="font-mono bg-muted px-1 rounded">98.5</code>)</p>
            <p>• Boolean fields: use <code className="font-mono bg-muted px-1 rounded">true</code> / <code className="font-mono bg-muted px-1 rounded">false</code></p>
            <p>• Enum fields for studyType: <code className="font-mono bg-muted px-1 rounded">long_term</code>, <code className="font-mono bg-muted px-1 rounded">accelerated</code>, <code className="font-mono bg-muted px-1 rounded">intermediate</code>, <code className="font-mono bg-muted px-1 rounded">stress</code>, <code className="font-mono bg-muted px-1 rounded">photostability</code>, <code className="font-mono bg-muted px-1 rounded">freeze_thaw</code></p>
            <p>• Duplicate records (same unique key) will be skipped automatically</p>
            <p>• Download a template first to see the exact column names expected</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Data Management (Admin Only) ────────────────────────────────────────────

function DataManagementTab() {
  const { toast } = useToast();
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const MODULES = [
    { key: "studies", label: "Studies & Time Points", description: "Clears all stability studies, time points, samples, test results, and linked investigations.", icon: <FlaskConical className="h-4 w-4" />, destructive: true },
    { key: "investigations", label: "Investigations", description: "Removes all OOS/OOT investigation records.", icon: <AlertCircle className="h-4 w-4" />, destructive: true },
    { key: "excursions", label: "Chamber Excursions", description: "Clears all excursion logs and resets chambers flagged as in excursion.", icon: <Thermometer className="h-4 w-4" />, destructive: false },
    { key: "test_log", label: "Test Log", description: "Removes all pull test completion entries from the test log.", icon: <CheckCircle2 className="h-4 w-4" />, destructive: false },
    { key: "monthly_reports", label: "Monthly Report Notes & Sign-offs", description: "Clears all monthly report notes and sign-off records.", icon: <FileText className="h-4 w-4" />, destructive: false },
    { key: "audit_logs", label: "Audit Trail", description: "Permanently deletes all audit log entries.", icon: <ShieldAlert className="h-4 w-4" />, destructive: true },
    { key: "notifications", label: "Notifications", description: "Clears all user notification records.", icon: <RefreshCw className="h-4 w-4" />, destructive: false },
  ];

  async function handleScrub(moduleKey: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/scrub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module: moduleKey }),
      });
      const result = await res.json();
      if (result.ok) {
        toast({ title: `${MODULES.find(m => m.key === moduleKey)?.label} cleared successfully` });
        queryClient.invalidateQueries();
      } else {
        toast({ title: "Scrub failed", description: result.message, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
        <ShieldAlert className="h-4 w-4 text-destructive flex-shrink-0" />
        <p className="text-sm text-destructive font-medium">Admin only — these actions permanently delete data and cannot be undone.</p>
      </div>
      <div className="grid gap-3">
        {MODULES.map(mod => (
          <Card key={mod.key} className={mod.destructive ? "border-destructive/30" : ""}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${mod.destructive ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                {mod.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{mod.label}</p>
                <p className="text-xs text-muted-foreground">{mod.description}</p>
              </div>
              {confirming === mod.key ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-destructive font-medium">Are you sure?</span>
                  <Button size="sm" variant="destructive" onClick={() => handleScrub(mod.key)} disabled={busy} data-testid={`button-confirm-scrub-${mod.key}`}>
                    {busy ? "Clearing…" : "Yes, clear it"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirming(null)} disabled={busy}>Cancel</Button>
                </div>
              ) : (
                <Button size="sm" variant={mod.destructive ? "destructive" : "outline"} onClick={() => setConfirming(mod.key)} data-testid={`button-scrub-${mod.key}`} className="flex-shrink-0">
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />Clear
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
