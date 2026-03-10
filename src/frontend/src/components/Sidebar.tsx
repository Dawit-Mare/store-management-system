import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Package,
  ShoppingCart,
  Tag,
  User,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerRole } from "../hooks/useQueries";

const navItems = [
  {
    to: "/" as const,
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard.link",
  },
  {
    to: "/products" as const,
    label: "Products",
    icon: Package,
    ocid: "nav.products.link",
  },
  {
    to: "/orders" as const,
    label: "Orders",
    icon: ShoppingCart,
    ocid: "nav.orders.link",
  },
  {
    to: "/categories" as const,
    label: "Categories",
    icon: Tag,
    ocid: "nav.categories.link",
  },
];

const roleColors: Record<string, string> = {
  admin: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  user: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  guest: "bg-muted text-muted-foreground border-border",
};

export function Sidebar() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const { data: role } = useCallerRole();
  const routerState = useRouterState();
  const isLoggedIn = !!identity;
  const roleStr = role ? String(role) : "guest";
  const currentPath = routerState.location.pathname;

  return (
    <aside className="w-60 shrink-0 bg-sidebar flex flex-col h-screen sticky top-0 border-r border-sidebar-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <img
          src="/assets/generated/store-logo-transparent.dim_64x64.png"
          alt="Store Logo"
          className="w-8 h-8 rounded"
        />
        <div>
          <div className="font-display font-bold text-sm text-foreground leading-tight">
            StoreMS
          </div>
          <div className="text-xs text-muted-foreground">Management System</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
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
                className={`w-4 h-4 ${
                  isActive ? "text-amber-400" : "text-muted-foreground"
                }`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-3">
        {isLoggedIn && (
          <div className="flex items-center gap-2 px-3 py-2 rounded bg-accent/30">
            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground truncate">
                {identity.getPrincipal().toString().slice(0, 16)}…
              </div>
              <Badge
                className={`text-xs mt-0.5 border ${
                  roleColors[roleStr] ?? roleColors.guest
                }`}
                variant="outline"
              >
                {roleStr}
              </Badge>
            </div>
          </div>
        )}

        {isLoggedIn ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
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
      </div>
    </aside>
  );
}
