import { useState } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider, ThemeToggle } from "@/components/theme-provider";
import { NotificationPanel, useUnreadCount } from "@/components/notification-panel";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Studies from "@/pages/studies";
import AuditTrail from "@/pages/audit-trail";
import Settings from "@/pages/settings";
import SampleRegister from "@/pages/sample-register";
import Reports from "@/pages/reports";
import TestLog from "@/pages/test-log";
import IchMatrix from "@/pages/ich-matrix";
import Login from "@/pages/login";
import PullSchedule from "@/pages/pull-schedule";
import Investigations from "@/pages/investigations";
import Chambers from "@/pages/chambers";
import Analytics from "@/pages/analytics";
import Samples from "@/pages/samples";
import Workflow from "@/pages/workflow";
import { Bell, FlaskConical, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

function Header({ onLogout, user }: { onLogout: () => void; user: any }) {
  const [location] = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadCount = useUnreadCount(user?.id ?? "");

  const pageTitle: Record<string, string> = {
    "/": "Dashboard",
    "/studies": "Stability Studies",
    "/audit-trail": "Audit Trail",
    "/settings": "Settings",
    "/sample-register": "Sample Register",
    "/reports": "Monthly Reports & Sign-off",
    "/test-log": "Test Log",
    "/ich-matrix": "ICH Study Matrix",
    "/pull-schedule": "Pull Schedule",
    "/investigations": "Investigations",
    "/chambers": "Chamber Management",
    "/analytics": "Analytics",
    "/samples": "Samples",
    "/workflow": "Workflow Execution",
  };

  return (
    <>
      <header className="h-14 flex items-center justify-between px-4 border-b bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <SidebarTrigger data-testid="button-sidebar-toggle" className="-ml-1" />
          <div className="h-4 w-px bg-border hidden sm:block" />
          <h1 className="text-sm font-semibold text-foreground hidden sm:block">
            {pageTitle[location] ?? "StabilityFlow"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              size="icon" variant="ghost"
              data-testid="button-notifications"
              onClick={() => setNotifOpen(true)}
              className={unreadCount > 0 ? "text-primary" : ""}
            >
              <Bell className="h-4 w-4" />
            </Button>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold pointer-events-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <ThemeToggle />
          <div className="flex items-center gap-2 pl-2 border-l">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
              <FlaskConical className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user?.fullName ?? "Admin"}
            </span>
          </div>
          <Button
            size="icon" variant="ghost"
            onClick={onLogout}
            data-testid="button-logout"
            title="Sign out"
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        userId={user?.id ?? ""}
      />
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/studies" component={Studies} />
      <Route path="/audit-trail" component={AuditTrail} />
      <Route path="/settings" component={Settings} />
      <Route path="/sample-register" component={SampleRegister} />
      <Route path="/reports" component={Reports} />
      <Route path="/test-log" component={TestLog} />
      <Route path="/ich-matrix" component={IchMatrix} />
      <Route path="/pull-schedule" component={PullSchedule} />
      <Route path="/investigations" component={Investigations} />
      <Route path="/chambers" component={Chambers} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/samples" component={Samples} />
      <Route path="/workflow" component={Workflow} />
      <Route component={NotFound} />
    </Switch>
  );
}

const sidebarStyle = {
  "--sidebar-width": "14rem",
  "--sidebar-width-icon": "3.5rem",
};

function AuthenticatedApp({ onLogout, user }: { onLogout: () => void; user: any }) {
  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header onLogout={onLogout} user={user} />
          <main className="flex-1 overflow-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  const [user, setUser] = useState<any>(() => {
    try {
      const stored = localStorage.getItem("sf_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  function handleLogin(u: any) {
    localStorage.setItem("sf_user", JSON.stringify(u));
    setUser(u);
  }

  function handleLogout() {
    localStorage.removeItem("sf_user");
    setUser(null);
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          {user ? (
            <AuthenticatedApp onLogout={handleLogout} user={user} />
          ) : (
            <Login onLogin={handleLogin} />
          )}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
