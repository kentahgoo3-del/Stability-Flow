import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle, Clock, FlaskConical, CheckCheck, Trash2, X, Bell, BellOff,
} from "lucide-react";
import type { Notification } from "@shared/schema";

const TYPE_META: Record<string, { icon: typeof AlertTriangle; color: string; label: string }> = {
  overdue: { icon: AlertTriangle, color: "text-red-500", label: "Overdue" },
  upcoming: { icon: Clock, color: "text-amber-500", label: "Upcoming" },
  oos_oot: { icon: FlaskConical, color: "text-orange-600", label: "OOS/OOT" },
  info: { icon: Bell, color: "text-blue-500", label: "Info" },
};

function timeAgo(ts: string | Date): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotifCard({
  n, onRead, onDismiss,
}: { n: Notification; onRead: (id: string) => void; onDismiss: (id: string) => void }) {
  const meta = TYPE_META[n.type] ?? TYPE_META.info;
  const Icon = meta.icon;

  return (
    <div
      data-testid={`notification-card-${n.id}`}
      className={`relative flex gap-3 px-4 py-3 border-b last:border-b-0 transition-colors cursor-pointer hover:bg-muted/40 ${!n.read ? "bg-primary/5" : ""}`}
      onClick={() => !n.read && onRead(n.id)}
    >
      {!n.read && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
      )}
      <div className={`mt-0.5 shrink-0 ${meta.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"}`}>
            {n.title}
          </p>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
            {timeAgo(n.createdAt!)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
      </div>
      <button
        data-testid={`button-dismiss-notification-${n.id}`}
        className="shrink-0 self-start mt-0.5 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground/50 transition-colors"
        onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
        title="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function NotificationPanel({ open, onClose, userId }: Props) {
  const [tab, setTab] = useState("all");

  const { data: allNotifs = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", userId],
    queryFn: async () => {
      const r = await fetch(`/api/notifications/${userId}`);
      if (!r.ok) throw new Error("Failed to load");
      return r.json();
    },
    enabled: !!userId,
    refetchInterval: open ? 30000 : false,
  });

  const syncMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/notifications/sync/${userId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications", userId] }),
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications", userId] }),
  });

  const readAllMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/notifications/user/${userId}/read-all`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications", userId] }),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/notifications/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications", userId] }),
  });

  const clearAllMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/notifications/user/${userId}/all`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications", userId] }),
  });

  useEffect(() => {
    if (open && userId) {
      syncMutation.mutate();
    }
  }, [open, userId]);

  const unread = allNotifs.filter(n => !n.read);
  const byType = (type: string) => allNotifs.filter(n => n.type === type);

  const displayed =
    tab === "all" ? allNotifs :
    tab === "unread" ? unread :
    byType(tab);

  const tabCount = (arr: Notification[]) =>
    arr.length > 0 ? <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px]">{arr.length}</Badge> : null;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col gap-0">
        <SheetHeader className="px-4 pt-4 pb-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Notifications
              {unread.length > 0 && (
                <Badge className="h-5 min-w-5 px-1.5 text-xs">{unread.length}</Badge>
              )}
            </SheetTitle>
            <div className="flex items-center gap-1">
              {unread.length > 0 && (
                <Button
                  variant="ghost" size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => readAllMutation.mutate()}
                  disabled={readAllMutation.isPending}
                  data-testid="button-mark-all-read"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </Button>
              )}
              {allNotifs.length > 0 && (
                <Button
                  variant="ghost" size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-destructive"
                  onClick={() => clearAllMutation.mutate()}
                  disabled={clearAllMutation.isPending}
                  data-testid="button-clear-all-notifications"
                >
                  <Trash2 className="h-3 w-3" /> Clear all
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0">
          <TabsList className="mx-4 mt-3 mb-0 shrink-0 w-auto justify-start bg-muted/50 h-8">
            <TabsTrigger value="all" className="text-xs h-6 px-2.5" data-testid="tab-notifications-all">
              All {tabCount(allNotifs)}
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs h-6 px-2.5" data-testid="tab-notifications-unread">
              Unread {tabCount(unread)}
            </TabsTrigger>
            <TabsTrigger value="overdue" className="text-xs h-6 px-2.5" data-testid="tab-notifications-overdue">
              Overdue {tabCount(byType("overdue"))}
            </TabsTrigger>
            <TabsTrigger value="oos_oot" className="text-xs h-6 px-2.5" data-testid="tab-notifications-oos">
              OOS/OOT {tabCount(byType("oos_oot"))}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="text-xs h-6 px-2.5" data-testid="tab-notifications-upcoming">
              Upcoming {tabCount(byType("upcoming"))}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="flex-1 min-h-0 mt-3 data-[state=active]:flex flex-col">
            <ScrollArea className="flex-1">
              {isLoading || syncMutation.isPending ? (
                <div className="flex flex-col gap-2 px-4 py-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
                  ))}
                </div>
              ) : displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <BellOff className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No notifications</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {tab === "unread" ? "You're all caught up!" : "Nothing to show here."}
                  </p>
                </div>
              ) : (
                <div className="border rounded-md mx-4 overflow-hidden">
                  {displayed.map(n => (
                    <NotifCard
                      key={n.id}
                      n={n}
                      onRead={id => readMutation.mutate(id)}
                      onDismiss={id => dismissMutation.mutate(id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="px-4 py-2 border-t shrink-0 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground">
            {allNotifs.length} total &middot; {unread.length} unread
          </p>
          <Button
            variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            data-testid="button-refresh-notifications"
          >
            {syncMutation.isPending ? "Syncing…" : "Refresh"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function useUnreadCount(userId: string) {
  const { data = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications", userId],
    queryFn: async () => {
      const r = await fetch(`/api/notifications/${userId}`);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!userId,
    refetchInterval: 60000,
  });
  return (data as Notification[]).filter(n => !n.read).length;
}
