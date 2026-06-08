import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollText, User, Clock, Plus, Edit, Trash2, CheckCircle2, XCircle, LogIn, LogOut, FlaskConical } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useState } from "react";
import type { AuditLog } from "@shared/schema";

const actionConfig: Record<string, { icon: any; color: string; label: string }> = {
  create: { icon: Plus, color: "text-green-500", label: "Created" },
  update: { icon: Edit, color: "text-blue-500", label: "Updated" },
  delete: { icon: Trash2, color: "text-destructive", label: "Deleted" },
  approve: { icon: CheckCircle2, color: "text-green-500", label: "Approved" },
  reject: { icon: XCircle, color: "text-destructive", label: "Rejected" },
  login: { icon: LogIn, color: "text-primary", label: "Login" },
  logout: { icon: LogOut, color: "text-muted-foreground", label: "Logout" },
  test_complete: { icon: FlaskConical, color: "text-green-500", label: "Test Done" },
};

const entityColors: Record<string, string> = {
  study: "bg-primary/10 text-primary",
  result: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  investigation: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  excursion: "bg-destructive/10 text-destructive",
  chamber: "bg-green-500/10 text-green-600 dark:text-green-400",
  user: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  test: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

export default function AuditTrail() {
  const [search, setSearch] = useState("");
  const { data: logs = [], isLoading } = useQuery<AuditLog[]>({ queryKey: ["/api/audit-logs"] });

  const filtered = logs.filter(log =>
    !search ||
    log.description.toLowerCase().includes(search.toLowerCase()) ||
    log.entityType.toLowerCase().includes(search.toLowerCase()) ||
    (log.action ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl mx-auto">
      <div>
        <h2 className="text-lg font-bold">Audit Trail</h2>
        <p className="text-sm text-muted-foreground">Complete record of all system actions and changes</p>
      </div>

      <div className="flex items-center gap-3">
        <Input
          placeholder="Search audit trail..."
          className="max-w-xs h-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
          data-testid="input-search-audit"
        />
        <span className="text-xs text-muted-foreground">{filtered.length} entries</span>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ScrollText className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No audit entries found</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/30 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                <span className="col-span-1">Action</span>
                <span className="col-span-2">Entity</span>
                <span className="col-span-4">Description</span>
                <span className="col-span-2">Performed by</span>
                <span className="col-span-3 text-right">Time</span>
              </div>
              <div className="divide-y divide-border">
                {filtered.map(log => {
                  const ac = actionConfig[log.action] ?? actionConfig.update;
                  const Icon = ac.icon;
                  return (
                    <div key={log.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/20 transition-colors" data-testid={`audit-log-${log.id}`}>
                      <div className="col-span-1">
                        <div className="flex items-center">
                          <Icon className={`h-3.5 w-3.5 ${ac.color}`} />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${entityColors[log.entityType] ?? "bg-muted text-muted-foreground"}`}>
                          {log.entityType}
                        </span>
                      </div>
                      <div className="col-span-4">
                        <p className="text-sm">{log.description}</p>
                        {log.entityId && <p className="text-xs text-muted-foreground font-mono">{log.entityId.slice(0, 12)}...</p>}
                      </div>
                      <div className="col-span-2">
                        {log.entityType === "test" && log.oldValue ? (
                          <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <User className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-xs truncate">{log.oldValue}</span>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                      <div className="col-span-3 text-right">
                        {log.createdAt && (
                          <>
                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</p>
                            <p className="text-[10px] text-muted-foreground/60">{format(new Date(log.createdAt), "dd MMM HH:mm")}</p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
