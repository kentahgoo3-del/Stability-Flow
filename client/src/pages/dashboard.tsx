import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  FlaskConical, CalendarClock,
  TrendingUp, TrendingDown, Clock, CheckCircle2, XCircle,
  ChevronRight, Activity, AlertCircle, ShieldAlert
} from "lucide-react";
import { format, isToday, isTomorrow, addDays } from "date-fns";

function getTimePointUrgency(tp: any) {
  const date = new Date(tp.plannedDate);
  const now = new Date();
  if (date < now) return { label: "Overdue", variant: "destructive" as const };
  if (isToday(date)) return { label: "Today", variant: "destructive" as const };
  if (isTomorrow(date)) return { label: "Tomorrow", variant: "secondary" as const };
  if (date <= addDays(now, 7)) return { label: "This week", variant: "secondary" as const };
  return { label: format(date, "MMM d"), variant: "outline" as const };
}

function OosOotFlagsCard() {
  const { data: flags = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/oos-oot-flags"] });
  const recent = (flags as any[]).slice(0, 6);
  return (
    <Card data-testid="card-oos-oot-flags" className="flex flex-col">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between gap-2 border-b">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ShieldAlert className="h-3.5 w-3.5 text-orange-500" />
          OOS / OOT Flags
          {!isLoading && recent.length > 0 && (
            <span className="ml-1 text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 rounded px-1.5 py-0.5">{recent.length}</span>
          )}
        </CardTitle>
        <Link href="/sample-register">
          <span className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 cursor-pointer transition-colors">
            View all <ChevronRight className="h-3 w-3" />
          </span>
        </Link>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {isLoading ? (
          <div className="p-3 space-y-2">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
          </div>
        ) : !recent.length ? (
          <div className="flex items-center gap-2 px-4 py-5 text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            <span className="text-sm">All results within specification</span>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((f: any) => (
              <Link key={f.id} href="/sample-register">
                <div className="px-4 py-2.5 flex items-center gap-2.5 hover:bg-muted/30 transition-colors cursor-pointer" data-testid={`flag-item-${f.id}`}>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${f.oosOotFlag === "OOS" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400"}`}>
                    {f.oosOotFlag}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate leading-tight">{f.testName} — {f.product ?? "—"}</p>
                    <p className="text-xs text-muted-foreground truncate leading-tight">
                      {f.batch} · {f.conditionCode} · {f.timePointLabel}
                      {f.oosOotNote && <span className="italic ml-1 text-muted-foreground/70">— {f.oosOotNote}</span>}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground flex-shrink-0">{f.completedByName}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<any>({ queryKey: ["/api/dashboard/stats"] });

  const kpis = [
    {
      title: "Active Studies", value: stats?.activeStudies ?? 0,
      icon: FlaskConical, linkTo: "/studies",
      accent: "text-primary", bg: "bg-primary/8",
    },
    {
      title: "Overdue Pulls", value: stats?.overduePulls ?? 0,
      icon: CalendarClock, linkTo: "/pull-schedule",
      accent: stats?.overduePulls > 0 ? "text-destructive" : "text-muted-foreground",
      bg: stats?.overduePulls > 0 ? "bg-destructive/8" : "bg-muted/40",
      alert: stats?.overduePulls > 0,
    },
    {
      title: "OOS/OOT Flags", value: stats?.oosOotFlagCount ?? 0,
      icon: ShieldAlert, linkTo: "/sample-register",
      accent: stats?.oosOotFlagCount > 0 ? "text-orange-500" : "text-muted-foreground",
      bg: stats?.oosOotFlagCount > 0 ? "bg-orange-500/8" : "bg-muted/40",
      alert: stats?.oosOotFlagCount > 0,
    },
    {
      title: "Upcoming (30d)", value: stats?.upcomingPulls ?? 0,
      icon: Clock, linkTo: "/pull-schedule",
      accent: "text-blue-500", bg: "bg-blue-500/8",
    },
    {
      title: "OOS Results", value: stats?.oosResults ?? 0,
      icon: XCircle, linkTo: "/sample-register",
      accent: stats?.oosResults > 0 ? "text-destructive" : "text-muted-foreground",
      bg: stats?.oosResults > 0 ? "bg-destructive/8" : "bg-muted/40",
    },
    {
      title: "OOT Results", value: stats?.ootResults ?? 0,
      icon: AlertCircle, linkTo: "/sample-register",
      accent: stats?.ootResults > 0 ? "text-yellow-500" : "text-muted-foreground",
      bg: stats?.ootResults > 0 ? "bg-yellow-500/8" : "bg-muted/40",
    },
    {
      title: "Due This Week", value: stats?.urgentPulls?.length ?? 0,
      icon: Activity, linkTo: "/pull-schedule",
      accent: "text-green-500", bg: "bg-green-500/8",
    },
  ];

  const complianceGood = (stats?.overduePulls ?? 0) === 0;

  return (
    <div className="p-5 space-y-4 max-w-screen-2xl mx-auto">

      {/* Compact KPI strip */}
      <div className="grid grid-cols-4 xl:grid-cols-8 gap-2">
        {kpis.map((kpi) => (
          <Link key={kpi.title} href={kpi.linkTo}>
            <div
              className={`relative rounded-lg border px-3 py-2.5 flex flex-col gap-1 hover:shadow-sm transition-shadow cursor-pointer ${kpi.alert ? "border-current/20" : "border-border"} bg-card`}
              data-testid={`stat-${kpi.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-medium text-muted-foreground leading-tight">{kpi.title}</span>
                <div className={`h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 ${kpi.bg}`}>
                  <kpi.icon className={`h-3.5 w-3.5 ${kpi.accent}`} />
                </div>
              </div>
              {isLoading ? (
                <Skeleton className="h-6 w-10 mt-0.5" />
              ) : (
                <span className={`text-xl font-bold tabular-nums leading-none ${kpi.alert ? kpi.accent : "text-foreground"}`}>
                  {kpi.value}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Status bar */}
      <div className="flex items-center gap-4 px-4 py-2 rounded-lg bg-muted/30 border text-xs flex-wrap">
        <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
          <CheckCircle2 className={`h-3.5 w-3.5 ${complianceGood ? "text-green-500" : "text-orange-500"}`} />
          Compliance: <span className={complianceGood ? "text-green-600 dark:text-green-400 font-semibold" : "text-orange-600 dark:text-orange-400 font-semibold"}>{complianceGood ? "Good" : "Review needed"}</span>
        </span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <CheckCircle2 className="h-3 w-3 text-green-500" />
          Studies on track: <strong className="text-foreground ml-1">{Math.max(0, (stats?.activeStudies ?? 0) - (stats?.oosOotFlagCount ?? 0))} / {stats?.activeStudies ?? 0}</strong>
        </span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <TrendingDown className="h-3 w-3 text-destructive" />
          OOS rate: <strong className="text-foreground ml-1">{stats?.activeStudies ? Math.round((stats.oosResults / Math.max(1, stats.activeStudies)) * 100) : 0}%</strong>
        </span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <TrendingUp className="h-3 w-3 text-yellow-500" />
          OOT rate: <strong className="text-foreground ml-1">{stats?.activeStudies ? Math.round((stats.ootResults / Math.max(1, stats.activeStudies)) * 100) : 0}%</strong>
        </span>
      </div>

      {/* Two-panel lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Urgent Pulls */}
        <Card data-testid="card-urgent-pulls" className="flex flex-col">
          <CardHeader className="py-3 px-4 flex flex-row items-center justify-between gap-2 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarClock className="h-3.5 w-3.5 text-primary" />
              Urgent Pulls — Next 7 Days
            </CardTitle>
            <Link href="/pull-schedule">
              <span className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 cursor-pointer transition-colors">
                View all <ChevronRight className="h-3 w-3" />
              </span>
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {isLoading ? (
              <div className="p-3 space-y-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
              </div>
            ) : !stats?.urgentPulls?.length ? (
              <div className="flex items-center gap-2 px-4 py-5 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">No pulls due in the next 7 days</span>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {stats.urgentPulls.map((tp: any) => {
                  const urgency = getTimePointUrgency(tp);
                  return (
                    <Link key={tp.id} href="/pull-schedule">
                      <div className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors cursor-pointer" data-testid={`pull-item-${tp.id}`}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate leading-tight">{tp.productName ?? tp.label}</p>
                            {tp.conditionCode && <span className="text-[10px] font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded flex-shrink-0">{tp.conditionCode}</span>}
                          </div>
                          <p className="text-xs text-muted-foreground leading-tight">{tp.label} · {format(new Date(tp.plannedDate), "dd MMM yyyy")}</p>
                        </div>
                        <Badge variant={urgency.variant} className="flex-shrink-0 no-default-active-elevate text-[10px] h-5">
                          {urgency.label}
                        </Badge>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <OosOotFlagsCard />
      </div>
    </div>
  );
}
