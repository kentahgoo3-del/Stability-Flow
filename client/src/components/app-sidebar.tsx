import { Link, useLocation } from "wouter";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, FlaskConical,
  ScrollText, Settings,
  ClipboardCheck, FileBarChart2, BookOpen, Grid3X3
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
const logoSrc = "/stabilityflow-logo.png";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Sample Register", url: "/sample-register", icon: ClipboardCheck },
  { title: "Monthly Reports", url: "/reports", icon: FileBarChart2 },
  { title: "Studies", url: "/studies", icon: FlaskConical },
  { title: "ICH Matrix", url: "/ich-matrix", icon: Grid3X3 },
  { title: "Test Log", url: "/test-log", icon: BookOpen },
  { title: "Audit Trail", url: "/audit-trail", icon: ScrollText },
];

function getRole(): string {
  try { return JSON.parse(localStorage.getItem("sf_user") || "{}").role ?? ""; } catch { return ""; }
}

export function AppSidebar() {
  const [location] = useLocation();
  const { data: stats } = useQuery<any>({ queryKey: ["/api/dashboard/stats"] });
  const isAdmin = getRole() === "admin";

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center group-data-[collapsible=icon]:hidden">
          <img
            src={logoSrc}
            alt="StabilityFlow"
            className="w-full h-auto object-contain"
            data-testid="img-sidebar-logo"
          />
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex items-center justify-center py-0.5">
          <img
            src={logoSrc}
            alt="SF"
            className="h-7 w-7 object-contain"
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navItems.map((item) => {
                const isActive = location === item.url;
                const alertCount = item.alertKey ? (stats?.[item.alertKey] ?? 0) : 0;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
                      className="h-8"
                    >
                      <Link href={item.url} className="flex items-center gap-2.5 px-2 rounded-md">
                        <item.icon className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1 text-sm">{item.title}</span>
                        {alertCount > 0 && (
                          <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px] no-default-active-elevate">
                            {alertCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {isAdmin && (
        <SidebarFooter className="px-2 py-3 border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={location === "/settings"} className="h-8">
                <Link href="/settings" className="flex items-center gap-2.5 px-2">
                  <Settings className="h-4 w-4" />
                  <span className="text-sm">Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
