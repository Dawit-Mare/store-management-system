import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  ClipboardList,
  LayoutDashboard,
  LogIn,
  LogOut,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useMyRole } from "../hooks/useQueries";

const navItems = [
  {
    to: "/" as const,
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard.link",
  },
  {
    to: "/visitors" as const,
    label: "Visitors",
    icon: Users,
    ocid: "nav.visitors.link",
  },
  {
    to: "/log" as const,
    label: "Activity Log",
    icon: ClipboardList,
    ocid: "nav.log.link",
  },
  {
    to: "/users" as const,
    label: "Users",
    icon: Shield,
    ocid: "nav.users.link",
  },
];

type RoleKey = "super_admin" | "admin" | "user" | "guest";

const roleConfig: Record<RoleKey, { label: string; className: string }> = {
  super_admin: {
    label: "Super Admin",
    className: "role-badge role-super-admin",
  },
  admin: {
    label: "Admin",
    className: "role-badge role-admin",
  },
  user: {
    label: "User",
    className: "role-badge role-user",
  },
  guest: {
    label: "Guest",
    className: "role-badge role-user",
  },
};

function normaliseRole(raw: string | null | undefined): RoleKey {
  if (!raw) return "guest";
  const lower = raw.toLowerCase().replace(/\s+/g, "_");
  if (lower in roleConfig) return lower as RoleKey;
  return "guest";
}

export function Sidebar() {
  const { login, clear, loginStatus, identity, isAuthenticated } =
    useInternetIdentity();
  const { data: rawRole } = useMyRole();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const roleKey = normaliseRole(rawRole);
  const role = roleConfig[roleKey];

  return (
    <aside className="w-60 shrink-0 bg-sidebar flex flex-col h-screen sticky top-0 border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="font-display font-bold text-sm text-foreground leading-tight">
            GateWatch
          </div>
          <div className="text-xs text-muted-foreground">Gate Management</div>
        </div>
      </div>

      {/* Nav */}
      <nav
        className="flex-1 px-3 py-4 space-y-0.5"
        aria-label="Primary navigation"
      >
        {navItems.map((item) => {
          const isActive =
            item.to === "/"
              ? currentPath === "/"
              : currentPath.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              data-ocid={item.ocid}
              className={`flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-all ${
                isActive
                  ? "sidebar-item-active"
                  : "sidebar-item text-muted-foreground"
              }`}
            >
              <item.icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-3">
        {isAuthenticated && identity && (
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded bg-sidebar-accent">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary uppercase">
                {roleKey === "super_admin"
                  ? "SA"
                  : roleKey === "admin"
                    ? "A"
                    : "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-xs text-muted-foreground truncate font-mono-nums"
                title={identity.getPrincipal().toString()}
              >
                {identity.getPrincipal().toString().slice(0, 14)}…
              </div>
              <span className={`${role.className} inline-block mt-1`}>
                {role.label}
              </span>
            </div>
          </div>
        )}

        {isAuthenticated ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground border-sidebar-border hover:bg-sidebar-accent"
            onClick={() => clear()}
            data-ocid="auth.logout.button"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full justify-start gap-2 bg-primary/90 hover:bg-primary text-primary-foreground"
            onClick={() => login()}
            disabled={loginStatus === "logging-in"}
            data-ocid="auth.login.button"
          >
            <LogIn className="w-4 h-4" />
            {loginStatus === "logging-in" ? "Connecting…" : "Sign In"}
          </Button>
        )}

        <Link
          to="/users"
          data-ocid="nav.settings.link"
          className="sidebar-item flex items-center gap-3 px-3 py-2 rounded text-xs text-muted-foreground transition-all"
        >
          <Settings className="w-3.5 h-3.5 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
