import { Button } from "@/components/ui/button";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useMyRole } from "../hooks/useQueries";
import type { AppRole } from "../types";

// ─── Nav Items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  {
    to: "/" as const,
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard.link",
    minRole: null, // visible to all
  },
  {
    to: "/visitors" as const,
    label: "Visitors",
    icon: Users,
    ocid: "nav.visitors.link",
    minRole: null,
  },
  {
    to: "/log" as const,
    label: "Activity Log",
    icon: ClipboardList,
    ocid: "nav.log.link",
    minRole: null,
  },
  {
    to: "/users" as const,
    label: "Users",
    icon: Shield,
    ocid: "nav.users.link",
    minRole: "Admin" as AppRole, // Admin and SuperAdmin only
  },
];

// ─── Role Config ──────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<
  AppRole,
  { label: string; className: string; abbr: string }
> = {
  SuperAdmin: {
    label: "Super Admin",
    className: "role-badge role-super-admin",
    abbr: "SA",
  },
  Admin: { label: "Admin", className: "role-badge role-admin", abbr: "A" },
  User: { label: "User", className: "role-badge role-user", abbr: "U" },
};

function canSeeItem(minRole: AppRole | null, role: AppRole): boolean {
  if (!minRole) return true;
  if (minRole === "Admin") return role === "Admin" || role === "SuperAdmin";
  if (minRole === "SuperAdmin") return role === "SuperAdmin";
  return true;
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { currentUser, logout } = useAuth();
  const { data: rawRole } = useMyRole();
  const routerState = useRouterState();
  const navigate = useNavigate();
  const currentPath = routerState.location.pathname;

  const role = (rawRole as AppRole) ?? "User";
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.User;

  function handleLogout() {
    logout();
    navigate({ to: "/" });
  }

  const visibleNav = NAV_ITEMS.filter((item) => canSeeItem(item.minRole, role));

  return (
    <aside
      className="w-60 shrink-0 bg-sidebar flex flex-col h-screen sticky top-0 border-r border-sidebar-border"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-primary" aria-hidden="true" />
        </div>
        <div>
          <div className="font-display font-bold text-sm text-foreground leading-tight">
            GateWatch
          </div>
          <div className="text-xs text-muted-foreground">Gate Management</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {visibleNav.map((item) => {
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
                className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-3">
        {currentUser && (
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded bg-sidebar-accent">
            <div
              className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5"
              aria-hidden="true"
            >
              <span className="text-xs font-bold text-primary uppercase">
                {cfg.abbr}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-sm font-medium text-foreground truncate"
                title={currentUser.username}
                data-ocid="sidebar.username"
              >
                {currentUser.username}
              </div>
              <span
                className={`${cfg.className} inline-block mt-1`}
                data-ocid="sidebar.role_badge"
              >
                {cfg.label}
              </span>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground border-sidebar-border hover:bg-sidebar-accent"
          onClick={handleLogout}
          data-ocid="auth.logout.button"
          aria-label="Sign out of your account"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          Sign Out
        </Button>

        {(role === "Admin" || role === "SuperAdmin") && (
          <Link
            to="/users"
            data-ocid="nav.settings.link"
            className="sidebar-item flex items-center gap-3 px-3 py-2 rounded text-xs text-muted-foreground transition-all"
          >
            <Settings className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            User Settings
          </Link>
        )}
      </div>
    </aside>
  );
}
