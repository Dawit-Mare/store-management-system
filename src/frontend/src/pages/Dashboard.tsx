import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  Briefcase,
  LogIn,
  Shield,
  Star,
  TrendingUp,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useActivityLog, useListUsers, useMyRole } from "../hooks/useQueries";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Category =
  | "guest"
  | "employer"
  | "soldier"
  | "temporary_employee"
  | "special_guest";

interface CategoryConfig {
  key: Category;
  label: string;
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  accentColor: string;
}

// ---------------------------------------------------------------------------
// Category config
// ---------------------------------------------------------------------------

const CATEGORIES: CategoryConfig[] = [
  {
    key: "guest",
    label: "Guest",
    Icon: User,
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
    accentColor: "#60a5fa",
  },
  {
    key: "employer",
    label: "Employer",
    Icon: Briefcase,
    iconBg: "bg-cyan-500/15",
    iconColor: "text-cyan-400",
    accentColor: "#22d3ee",
  },
  {
    key: "soldier",
    label: "Soldier",
    Icon: Shield,
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
    accentColor: "oklch(0.62 0.14 145)",
  },
  {
    key: "temporary_employee",
    label: "Temp Employee",
    Icon: UserCheck,
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
    accentColor: "oklch(0.72 0.15 65)",
  },
  {
    key: "special_guest",
    label: "Special Guest",
    Icon: Star,
    iconBg: "bg-purple-500/15",
    iconColor: "text-purple-400",
    accentColor: "#c084fc",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normCat(e: any): string {
  return String(e.category ?? "")
    .toLowerCase()
    .replace(/\s+/g, "_");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normStatus(e: any): string {
  return String(e.status ?? "")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function entryDate(e: any): string {
  const ts = e.timestamp ? new Date(Number(e.timestamp) / 1_000_000) : null;
  if (!ts) return "";
  return `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, "0")}-${String(ts.getDate()).padStart(2, "0")}`;
}

function todayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function weekStartStr(): string {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
}

function formatTimestamp(raw: unknown): string {
  const ts = raw ? new Date(Number(raw) / 1_000_000) : null;
  if (!ts || Number.isNaN(ts.getTime())) return "—";
  const date = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, "0")}-${String(ts.getDate()).padStart(2, "0")}`;
  const time = `${String(ts.getHours()).padStart(2, "0")}:${String(ts.getMinutes()).padStart(2, "0")}:${String(ts.getSeconds()).padStart(2, "0")}`;
  return `${date} ${time}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function countActive(log: any[], cat?: Category): number {
  return log.filter(
    (e) => normStatus(e) === "checked_in" && (cat ? normCat(e) === cat : true),
  ).length;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function countToday(log: any[], cat?: Category): number {
  const today = todayStr();
  return log.filter(
    (e) => entryDate(e) === today && (cat ? normCat(e) === cat : true),
  ).length;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function countThisWeek(log: any[], cat?: Category): number {
  const ws = weekStartStr();
  return log.filter((e) => {
    const d = entryDate(e);
    return d >= ws && (cat ? normCat(e) === cat : true);
  }).length;
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_CLASSES: Record<string, string> = {
  checked_in:
    "bg-accent/15 text-accent border border-accent/30 px-2.5 py-0.5 rounded-full text-xs font-semibold",
  checked_out:
    "bg-primary/15 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full text-xs font-semibold",
};

function statusClass(raw: string): string {
  const key = raw.toLowerCase().replace(/[\s-]+/g, "_");
  return STATUS_CLASSES[key] ?? STATUS_CLASSES.checked_out;
}

function statusLabel(raw: string): string {
  return raw.replace(/_/g, "-").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Category pill
const CAT_PILL: Record<string, string> = {
  guest: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  employer: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20",
  soldier: "bg-accent/15 text-accent border border-accent/20",
  temporary_employee: "bg-primary/15 text-primary border border-primary/20",
  special_guest: "bg-purple-500/15 text-purple-300 border border-purple-500/20",
};

function catClass(raw: string): string {
  const key = raw.toLowerCase().replace(/\s+/g, "_");
  return (
    CAT_PILL[key] ?? "bg-muted/30 text-muted-foreground border border-border/50"
  );
}

function catLabel(raw: string): string {
  const map: Record<string, string> = {
    guest: "Guest",
    employer: "Employer",
    soldier: "Soldier",
    temporary_employee: "Temp Employee",
    special_guest: "Special Guest",
  };
  const key = raw.toLowerCase().replace(/\s+/g, "_");
  return (
    map[key] ?? raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

// ---------------------------------------------------------------------------
// Summary stat card
// ---------------------------------------------------------------------------

interface SummaryCardProps {
  label: string;
  value: number | string;
  sub?: string;
  Icon: React.ElementType;
  accentClass: string;
  bgClass: string;
  loading?: boolean;
  ocid: string;
  delay?: number;
}

function SummaryCard({
  label,
  value,
  sub,
  Icon,
  accentClass,
  bgClass,
  loading,
  ocid,
  delay = 0,
}: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="stat-card rounded-xl p-5 flex flex-col gap-3"
      data-ocid={ocid}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <div className={`rounded-lg p-2 ${bgClass}`}>
          <Icon className={`w-4 h-4 ${accentClass}`} />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-9 w-20" />
      ) : (
        <p className="font-display font-bold text-3xl font-mono-nums leading-none">
          {value}
        </p>
      )}
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Category stat card
// ---------------------------------------------------------------------------

interface CategoryCardProps {
  config: CategoryConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  log: any[];
  loading: boolean;
  index: number;
}

function CategoryCard({ config, log, loading, index }: CategoryCardProps) {
  const { Icon, label, iconBg, iconColor, key } = config;
  const onSite = countActive(log, key);
  const today = countToday(log, key);
  const week = countThisWeek(log, key);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 + index * 0.07 }}
      className="stat-card rounded-xl p-4"
      data-ocid={`dashboard.category_card.${index + 1}`}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`rounded-md p-2 ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h3 className="font-display font-semibold text-sm leading-tight">
          {label}
        </h3>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
      ) : (
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Currently On-Site</span>
            <span
              className={`font-mono-nums font-bold ${onSite > 0 ? "text-accent" : "text-foreground"}`}
            >
              {onSite}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Total Visits Today</span>
            <span className="font-mono-nums font-semibold text-foreground">
              {today}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>This Week</span>
            <span className="font-mono-nums font-semibold text-foreground">
              {week}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Role breakdown row
// ---------------------------------------------------------------------------

function RoleBreakdownRow({
  label,
  count,
  roleClass,
  loading,
}: {
  label: string;
  count: number;
  roleClass: string;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <span className={`role-badge role-${roleClass}`}>{label}</span>
      {loading ? (
        <Skeleton className="h-4 w-8" />
      ) : (
        <span className="font-mono-nums font-semibold text-sm">{count}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Activity row
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ActivityRow({ entry, index }: { entry: any; index: number }) {
  return (
    <tr
      className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
      data-ocid={`dashboard.log.item.${index + 1}`}
    >
      <td className="px-4 py-3 font-mono-nums text-xs text-muted-foreground whitespace-nowrap">
        {formatTimestamp(entry.timestamp)}
      </td>
      <td className="px-4 py-3 font-medium text-sm min-w-0">
        <span className="truncate block max-w-[140px]">
          {String(entry.name ?? "—")}
        </span>
      </td>
      <td className="px-4 py-3 font-mono-nums text-muted-foreground text-xs">
        {String(entry.idNumber ?? entry.id_number ?? "—")}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${catClass(String(entry.category ?? ""))}`}
        >
          {catLabel(String(entry.category ?? "—"))}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className={statusClass(String(entry.status ?? ""))}>
          {statusLabel(String(entry.status ?? "—"))}
        </span>
      </td>
      <td className="px-4 py-3 text-muted-foreground text-xs">
        {String(entry.gatePoint ?? entry.gate_point ?? "—")}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export function Dashboard() {
  const { isAuthenticated, login, loginStatus } = useInternetIdentity();
  const { data: rawRole } = useMyRole();
  const { data: log = [], isLoading: logLoading } = useActivityLog();
  const { data: users = [], isLoading: usersLoading } = useListUsers();

  const role = rawRole ? String(rawRole).toLowerCase() : null;
  const isSuperAdmin = role === "super_admin" || role === "superadmin";
  const isAdmin = role === "admin";
  const isUser = !isSuperAdmin && !isAdmin;

  // Derived stats
  const totalOnSiteAll = countActive(log);
  const totalTodayAll = countToday(log);
  const totalWeekAll = countThisWeek(log);

  // User role breakdown from users list
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const superAdminCount = (users as any[]).filter((u) =>
    ["super_admin", "superadmin"].includes(String(u.role ?? "").toLowerCase()),
  ).length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminCount = (users as any[]).filter(
    (u) => String(u.role ?? "").toLowerCase() === "admin",
  ).length;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userCount = (users as any[]).filter(
    (u) => String(u.role ?? "").toLowerCase() === "user",
  ).length;

  // Recent entries - super admin/admin see all, user sees own
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortedLog = [...(log as any[])].sort((a, b) =>
    Number((b.timestamp ?? 0n) - (a.timestamp ?? 0n)),
  );
  const recentLog = sortedLog.slice(0, 5);

  // Role badge label + class
  const roleBadgeLabel = isSuperAdmin
    ? "Super Admin"
    : isAdmin
      ? "Admin"
      : "User";
  const roleBadgeClass = isSuperAdmin
    ? "role-badge role-super-admin"
    : isAdmin
      ? "role-badge role-admin"
      : "role-badge role-user";

  return (
    <div className="space-y-8 pb-8" data-ocid="dashboard.page">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">
            Gate Management{" "}
            <span className="text-muted-foreground font-normal">Dashboard</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Inventory Overview · Real-time gate activity
          </p>
        </div>
        {rawRole && (
          <span className={roleBadgeClass} data-ocid="dashboard.role_badge">
            {roleBadgeLabel}
          </span>
        )}
      </div>

      {/* Auth prompt */}
      {!isAuthenticated && (
        <div
          className="rounded-xl border border-primary/30 bg-primary/5 p-5 flex items-center justify-between gap-4"
          data-ocid="dashboard.auth_prompt"
        >
          <div>
            <p className="font-semibold text-sm">
              Sign in to manage gate entries
            </p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Internet Identity required for check-in / check-out operations
            </p>
          </div>
          <Button
            size="sm"
            className="gap-2 bg-primary/90 hover:bg-primary text-primary-foreground shrink-0"
            onClick={() => login()}
            disabled={loginStatus === "logging-in"}
            data-ocid="dashboard.signin.button"
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            {loginStatus === "logging-in" ? "Connecting…" : "Sign In"}
          </Button>
        </div>
      )}

      {/* Summary Stats (visible to admin + super admin) */}
      {(isSuperAdmin || isAdmin) && (
        <section data-ocid="dashboard.summary_stats.section">
          <h2 className="font-display font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              label="Currently On-Site"
              value={totalOnSiteAll}
              sub="Checked in, not yet out"
              Icon={Users}
              accentClass="text-accent"
              bgClass="bg-accent/15"
              loading={logLoading}
              ocid="dashboard.stat.active_visitors"
              delay={0}
            />
            <SummaryCard
              label="Check-ins Today"
              value={totalTodayAll}
              sub="All categories"
              Icon={UserCheck}
              accentClass="text-primary"
              bgClass="bg-primary/15"
              loading={logLoading}
              ocid="dashboard.stat.checkins_today"
              delay={0.07}
            />
            <SummaryCard
              label="Visitors This Week"
              value={totalWeekAll}
              sub="Mon – today"
              Icon={TrendingUp}
              accentClass="text-cyan-400"
              bgClass="bg-cyan-500/15"
              loading={logLoading}
              ocid="dashboard.stat.visitors_week"
              delay={0.14}
            />
            {isSuperAdmin && (
              <div
                className="stat-card rounded-xl p-5 flex flex-col gap-2"
                data-ocid="dashboard.stat.role_breakdown"
              >
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User Roles
                </p>
                <RoleBreakdownRow
                  label="Super Admin"
                  count={superAdminCount}
                  roleClass="super-admin"
                  loading={usersLoading}
                />
                <RoleBreakdownRow
                  label="Admin"
                  count={adminCount}
                  roleClass="admin"
                  loading={usersLoading}
                />
                <RoleBreakdownRow
                  label="User"
                  count={userCount}
                  roleClass="user"
                  loading={usersLoading}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* User: personal on-site summary */}
      {isUser && isAuthenticated && (
        <div
          className="rounded-xl border border-border bg-card p-4 flex items-center gap-4"
          data-ocid="dashboard.user.onsite_card"
        >
          <div className="rounded-full bg-accent/15 p-3">
            <Users className="w-5 h-5 text-accent" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Currently On-Site
            </p>
            {logLoading ? (
              <Skeleton
                className="h-8 w-16 mt-0.5"
                data-ocid="dashboard.onsite.loading_state"
              />
            ) : (
              <p className="font-display font-bold text-3xl font-mono-nums mt-0.5">
                {totalOnSiteAll}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Visitor Category Cards */}
      <section data-ocid="dashboard.categories.section">
        <h2 className="font-display font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">
          Visitor Check-In/Out Status Cards
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {CATEGORIES.map((cat, i) => (
            <CategoryCard
              key={cat.key}
              config={cat}
              log={log}
              loading={logLoading}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* Activity Log preview */}
      <section data-ocid="dashboard.activity_log.section">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-semibold text-base">
              Activity Log
            </h2>
            <p className="text-muted-foreground text-xs mt-0.5">
              {isSuperAdmin || isAdmin
                ? "Last 5 entries across all users"
                : "Your 5 most recent entries"}
            </p>
          </div>
          <Link
            to="/log"
            className="text-xs text-primary hover:text-primary/80 transition-colors"
            data-ocid="dashboard.view_all_log.link"
          >
            View all →
          </Link>
        </div>

        {logLoading ? (
          <div className="space-y-2" data-ocid="dashboard.log.loading_state">
            {[1, 2, 3, 4, 5].map((n) => (
              <Skeleton key={n} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : recentLog.length === 0 ? (
          <div
            className="rounded-xl border border-dashed border-border py-14 text-center"
            data-ocid="dashboard.log.empty_state"
          >
            <ClipboardListIcon className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-medium">
              No activity recorded yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Use Visitors to check in the first person
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">
                    Timestamp
                  </th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">
                    Name
                  </th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">
                    ID #
                  </th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">
                    Category
                  </th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">
                    Status
                  </th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs">
                    Gate
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentLog.map((entry, i) => (
                  <ActivityRow
                    key={String(entry.id ?? i)}
                    entry={entry}
                    index={i}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icon helpers
// ---------------------------------------------------------------------------

function ClipboardListIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      />
    </svg>
  );
}
