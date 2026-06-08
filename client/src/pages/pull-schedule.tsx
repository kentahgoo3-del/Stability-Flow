import { useState } from "react";
import { useCanDelete } from "@/hooks/use-can-delete";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Calendar, CalendarClock, CheckCircle2, AlertCircle, Clock, Play, User, ChevronRight, Trash2, Lock, FlaskConical } from "lucide-react";
import { format, isToday, isTomorrow, isPast, isFuture, differenceInDays, startOfDay } from "date-fns";
import type { TimePoint, StabilityStudy, User as UserType, Product, StorageCondition } from "@shared/schema";

function getDaysLabel(date: Date) {
  if (isPast(date)) {
    const days = differenceInDays(new Date(), date);
    return { text: days === 0 ? "Today" : `${days}d overdue`, color: "text-destructive" };
  }
  if (isToday(date)) return { text: "Due today", color: "text-destructive" };
  if (isTomorrow(date)) return { text: "Tomorrow", color: "text-orange-500" };
  const days = differenceInDays(date, new Date());
  if (days <= 7) return { text: `In ${days} days`, color: "text-yellow-500 dark:text-yellow-400" };
  return { text: `In ${days} days`, color: "text-muted-foreground" };
}

function TimePointRow({ tp, study, product, condition, users, onStart, onComplete, onDelete, completedAnalysts }: {

  tp: TimePoint; study?: StabilityStudy; product?: Product; condition?: StorageCondition;
  users: UserType[]; onStart: (id: string) => void; onComplete: (id: string) => void; onDelete: (id: string) => void;
  completedAnalysts?: string[];
}) {
  const canDelete = useCanDelete();
  const analyst = users.find(u => u.id === tp.assignedAnalystId);
  const { text, color } = getDaysLabel(new Date(tp.plannedDate));
  const isOverdue = isPast(new Date(tp.plannedDate)) && tp.status !== "completed";

  const statusConfig: Record<string, { label: string; cls: string }> = {
    pending: { label: "Pending", cls: "bg-muted text-muted-foreground" },
    due: { label: "Due", cls: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
    overdue: { label: "Overdue", cls: "bg-destructive/10 text-destructive" },
    in_progress: { label: "In Progress", cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    completed: { label: "Completed", cls: "bg-green-500/10 text-green-600 dark:text-green-400" },
  };
  const status = isOverdue && tp.status === "pending" ? "overdue" : tp.status;
  const sc = statusConfig[status] ?? statusConfig.pending;

  return (
    <div className="flex items-center gap-4 py-3 px-4 hover:bg-muted/30 transition-colors" data-testid={`timepoint-${tp.id}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{tp.label}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.cls}`}>{sc.label}</span>
          {tp.priority === "high" || tp.priority === "critical" ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
              {tp.priority.toUpperCase()}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {product && <span className="text-xs font-medium text-foreground/80">{product.name}</span>}
          {condition && <span className="text-xs text-muted-foreground">{condition.code}</span>}
          {study && <span className="text-xs text-muted-foreground">— {study.studyNumber}</span>}
        </div>
      </div>
      <div className="text-right flex-shrink-0 hidden sm:block">
        <p className="text-sm">{format(new Date(tp.plannedDate), "dd MMM yyyy")}</p>
        <p className={`text-xs font-medium ${color}`}>{text}</p>
      </div>
      {tp.status === "completed" && completedAnalysts && completedAnalysts.length > 0 ? (
        <div className="hidden md:flex flex-wrap gap-1 max-w-[160px]">
          {completedAnalysts.map(a => (
            <span key={a} className="inline-flex items-center gap-1 text-[10px] bg-green-500/10 text-green-700 dark:text-green-400 rounded-full px-2 py-0.5 font-medium">
              <User className="h-2.5 w-2.5" />{a.split(" ")[0]}
            </span>
          ))}
        </div>
      ) : analyst && (
        <div className="hidden md:flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-3 w-3 text-primary" />
          </div>
          <span className="text-xs text-muted-foreground">{analyst.fullName.split(" ")[0]}</span>
        </div>
      )}
      <div className="flex gap-1.5 flex-shrink-0 items-center">
        {tp.status === "completed" ? null
          : tp.status === "in_progress" ? (
            <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => onComplete(tp.id)} data-testid={`button-complete-${tp.id}`}>
              <CheckCircle2 className="h-3 w-3" /> Complete
            </Button>
          ) : isFuture(startOfDay(new Date(tp.plannedDate))) ? (
            // Future date — locked, cannot start
            <div
              className="flex items-center gap-1 h-7 px-2 rounded-md border border-dashed border-muted-foreground/30 text-xs text-muted-foreground/50 cursor-not-allowed select-none"
              title={`Pull not due until ${format(new Date(tp.plannedDate), "dd MMM yyyy")}`}
              data-testid={`button-start-locked-${tp.id}`}
            >
              <Lock className="h-3 w-3" />
              <span className="hidden sm:inline">Due {format(new Date(tp.plannedDate), "dd MMM")}</span>
            </div>
          ) : (
            // Due today or past — allow start
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => onStart(tp.id)} data-testid={`button-start-${tp.id}`}>
              <Play className="h-3 w-3" /> Start
            </Button>
          )
        }
        {canDelete && (
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(tp.id)} data-testid={`button-delete-tp-${tp.id}`}>
            <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default function PullSchedule() {
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const { data: upcoming = [], isLoading: loadingUpcoming } = useQuery<TimePoint[]>({ queryKey: ["/api/time-points/upcoming"] });
  const { data: overdue = [], isLoading: loadingOverdue } = useQuery<TimePoint[]>({ queryKey: ["/api/time-points/overdue"] });
  const { data: allTimePoints = [] } = useQuery<TimePoint[]>({ queryKey: ["/api/time-points"] });
  const { data: studies = [] } = useQuery<StabilityStudy[]>({ queryKey: ["/api/studies"] });
  const { data: products = [] } = useQuery<Product[]>({ queryKey: ["/api/products"] });
  const { data: conditions = [] } = useQuery<StorageCondition[]>({ queryKey: ["/api/storage-conditions"] });
  const { data: users = [] } = useQuery<UserType[]>({ queryKey: ["/api/users"] });
  const { data: testLog = [] } = useQuery<any[]>({ queryKey: ["/api/test-log"] });

  const analystsByTp = (testLog as any[]).reduce((acc: Record<string, Set<string>>, c: any) => {
    if (!c.completedByName) return acc;
    if (!acc[c.timePointId]) acc[c.timePointId] = new Set<string>();
    acc[c.timePointId].add(c.completedByName);
    return acc;
  }, {});

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest("PATCH", `/api/time-points/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-points"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/register"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/time-points/${id}`, undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-points"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/register"] });
      toast({ title: "Time point deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleStart = (id: string) => {
    const tp = allTimePoints.find(t => t.id === id);
    if (tp) {
      const plannedDate = startOfDay(new Date(tp.plannedDate));
      const today = startOfDay(new Date());
      if (plannedDate > today) {
        toast({
          title: "Pull not due yet",
          description: `This sample cannot be pulled before ${format(new Date(tp.plannedDate), "dd MMM yyyy")}. Pulling before the planned date is not permitted.`,
          variant: "destructive",
        });
        return;
      }
    }
    updateMutation.mutate({ id, data: { status: "in_progress" } });
    toast({ title: "Pull started", description: "Time point marked as in progress." });
  };

  const handleComplete = (id: string) => {
    updateMutation.mutate({ id, data: { status: "completed", actualDate: new Date() } });
    toast({ title: "Pull completed", description: "Time point successfully closed." });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this time point? This cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const getStudy = (tp: TimePoint) => studies.find(s => s.id === tp.studyId);
  const getProduct = (study?: StabilityStudy) => products.find(p => p.id === study?.productId);
  const getCondition = (study?: StabilityStudy) => conditions.find(c => c.id === study?.conditionId);

  const filterTPs = (tps: TimePoint[]) =>
    tps.filter(tp => {
      const study = getStudy(tp);
      return !search || tp.label.toLowerCase().includes(search.toLowerCase()) || study?.studyNumber.toLowerCase().includes(search.toLowerCase()) || study?.batchNumber.toLowerCase().includes(search.toLowerCase());
    });

  const inProgress = allTimePoints.filter(tp => tp.status === "in_progress");

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">Pull Schedule</h2>
          <p className="text-sm text-muted-foreground">Manage stability sample pulls and time point execution</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            <span className="text-xs font-medium text-destructive">{overdue.length} Overdue</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{inProgress.length} In Progress</span>
          </div>
        </div>
      </div>

      <Input placeholder="Search by study number, batch..." className="max-w-xs h-9" value={search} onChange={e => setSearch(e.target.value)} data-testid="input-search-pulls" />

      <Tabs defaultValue="overdue">
        <TabsList>
          <TabsTrigger value="overdue" className="gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            Overdue ({overdue.length})
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            In Progress ({inProgress.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        {[
          { key: "overdue", tps: filterTPs(overdue), title: "Overdue Pulls" },
          { key: "in_progress", tps: filterTPs(inProgress), title: "In Progress" },
          { key: "upcoming", tps: filterTPs(upcoming), title: "Upcoming Pulls" },
          { key: "all", tps: filterTPs(allTimePoints.slice(0, 100)), title: "All Time Points" },
        ].map(({ key, tps, title }) => (
          <TabsContent key={key} value={key} className="mt-4">
            <Card>
              <CardHeader className="pb-0 px-4 pt-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              </CardHeader>
              <CardContent className="p-0 mt-2">
                {loadingUpcoming || loadingOverdue ? (
                  <div className="p-4 space-y-2">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : tps.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No time points in this category</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {tps.map(tp => {
                      const study = getStudy(tp);
                      return (
                        <TimePointRow key={tp.id} tp={tp} study={study} product={getProduct(study)} condition={getCondition(study)} users={users} onStart={handleStart} onComplete={handleComplete} onDelete={handleDelete} completedAnalysts={analystsByTp[tp.id] ? Array.from(analystsByTp[tp.id]) : []} />
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
