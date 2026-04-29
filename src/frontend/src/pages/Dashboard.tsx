import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import {
  Briefcase,
  Shield,
  Star,
  TrendingUp,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import type { VisitorRecord } from "../db/database";
import { useAuth } from "../hooks/useAuth";
import {
  useActivityLog,
  useListUsers,
  useMyRole,
  useOnSiteVisitors,
} from "../hooks/useQueries";
import type { ActivityEntry, VisitorCategory } from "../types";

// ─── Config ───────────────────────────────────────────────────────────────────

interface CategoryConfig {
  key: VisitorCategory;
  label: string;
  Icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: "Guest",
    label: "Guest",
    Icon: User,
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
  },
  {
    key: "Employer",
    label: "Employer",
    Icon: Briefcase,
    iconBg: "bg-cyan-500/15",
    iconColor: "text-cyan-400",
  },
  {
    key: "Soldier",
    label: "Soldier",
    Icon: Shield,
    iconBg: "bg-accent/15",
    iconColor: "text-accent",
  },
  {
    key: "TemporaryEmployee",
    label: "Temp Employee",
    Icon: UserCheck,
    iconBg: "bg-primary/15",
    iconColor: "text-primary",
  },
  {
    key: "SpecialGuest",
    label: "Special Guest",
    Icon: Star,
    iconBg: "bg-purple-500/15",
    iconColor: "text-purple-400",
  },
];

const CAT_PILL: Record<string, string> = {
  Guest: "bg-blue-500/15 text-blue-300 border border-blue-500/20",
  Employer: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/20",
  Soldier: "bg-accent/15 text-accent border border-accent/20",
  TemporaryEmployee: "bg-primary/15 text-primary border border-primary/20",
  SpecialGuest: "bg-purple-500/15 text-purple-300 border border-purple-500/20",
};

const CATEGORY_LABELS: Record<string, string> = {
  Guest: "Guest",
  Employer: "Employer",
  Soldier: "Soldier",
  TemporaryEmployee: "Temp Employee",
  SpecialGuest: "Special Guest",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function weekStartStr(): string {
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, "0")}-${String(mon.getDate()).padStart(2, "0")}`;
}

function dateStr(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTimestamp(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function countOnSiteVisitors(
  visitors: VisitorRecord[],
  cat?: VisitorCategory,
): number {
  return visitors.filter((v) => v.isOnSite && (cat ? v.category === cat : true))
    .length;
}

function countToday(log: ActivityEntry[], cat?: VisitorCategory): number {
  const today = todayStr();
  return log.filter(
    (e) =>
      !e.isDeleted &&
      dateStr(e.checkInTime) === today &&
      (cat ? e.category === cat : true),
  ).length;
}

function countThisWeek(log: ActivityEntry[], cat?: VisitorCategory): number {
  const ws = weekStartStr();
  return log.filter(
    (e) =>
      !e.isDeleted &&
      dateStr(e.checkInTime) >= ws &&
      (cat ? e.category === cat : true),
  ).length;
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────

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

// ─── CategoryCard ─────────────────────────────────────────────────────────────

function CategoryCard({
  config,
  log,
  onSiteVisitors,
  loading,
  index,
}: {
  config: CategoryConfig;
  log: ActivityEntry[];
  onSiteVisitors: VisitorRecord[];
  loading: boolean;
  index: number;
}) {
  const { Icon, label, iconBg, iconColor, key } = config;
  const onSite = countOnSiteVisitors(onSiteVisitors, key);
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
            <span>On-Site</span>
            <span
              className={`font-mono-nums font-bold ${onSite > 0 ? "text-accent" : "text-foreground"}`}
            >
              {onSite}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Today</span>
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

// ─── RoleBreakdownRow ─────────────────────────────────────────────────────────

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

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function Dashboard() {
  const { currentUser } = useAuth();
  const { data: rawRole } = useMyRole();
  const { data: rawLog = [], isLoading: logLoading } = useActivityLog();
  const { data: rawOnSite = [], isLoading: onSiteLoading } =
    useOnSiteVisitors();
  const { data: rawUsers = [], isLoading: usersLoading } = useListUsers();

  const log = rawLog as ActivityEntry[];
  const onSiteVisitors = rawOnSite as VisitorRecord[];
  const role = rawRole as string | null;

  const isSuperAdmin = role === "SuperAdmin";
  const isAdmin = role === "Admin";
  const isUser = !isSuperAdmin && !isAdmin;

  // On-site count from dedicated hook (IndexedDB filtered query)
  const totalOnSite = onSiteVisitors.length;

  // Today's and weekly check-ins from full activity log
  const totalTodayAll = countToday(log);
  const totalWeekAll = countThisWeek(log);

  // User's personal stats: entries they checked in
  const myUsername = currentUser?.username ?? "";
  const myLog = log.filter((e) => e.checkedInBy === myUsername);
  const myOnSiteVisitors = onSiteVisitors.filter(
    (v) => v.createdBy === myUsername,
  );
  const myOnSite = myOnSiteVisitors.length;
  const myToday = countToday(myLog);

  // Role breakdown (SuperAdmin only)
  const users = rawUsers as Array<{ role: string }>;
  const superAdminCount = users.filter((u) => u.role === "SuperAdmin").length;
  const adminCount = users.filter((u) => u.role === "Admin").length;
  const userCount = users.filter((u) => u.role === "User").length;

  // Recent activity: last 5 events by most recent check-in time
  const recentLog = [...log]
    .sort((a, b) => b.checkInTime - a.checkInTime)
    .slice(0, 5);

  const roleBadgeClass = isSuperAdmin
    ? "role-badge role-super-admin"
    : isAdmin
      ? "role-badge role-admin"
      : "role-badge role-user";
  const roleBadgeLabel = isSuperAdmin
    ? "Super Admin"
    : isAdmin
      ? "Admin"
      : "User";

  const isDataLoading = logLoading || onSiteLoading;

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
        <div className="flex items-center gap-3">
          {role && (
            <span className={roleBadgeClass} data-ocid="dashboard.role_badge">
              {roleBadgeLabel}
            </span>
          )}
          {currentUser && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              {currentUser.username}
            </span>
          )}
        </div>
      </div>

      {/* Admin/SuperAdmin: Summary Stats */}
      {(isSuperAdmin || isAdmin) && (
        <section data-ocid="dashboard.summary_stats.section">
          <h2 className="font-display font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              label="Currently On-Site"
              value={totalOnSite}
              sub="Checked in, not yet out"
              Icon={Users}
              accentClass="text-accent"
              bgClass="bg-accent/15"
              loading={isDataLoading}
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
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.21 }}
                className="stat-card rounded-xl p-5 flex flex-col gap-2"
                data-ocid="dashboard.stat.role_breakdown"
              >
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
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
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* User role: personal summary */}
      {isUser && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-2 gap-4"
          data-ocid="dashboard.user.personal_stats"
        >
          <div
            className="stat-card rounded-xl p-5 flex flex-col gap-3"
            data-ocid="dashboard.user.onsite_card"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                My On-Site Visitors
              </p>
              <div className="rounded-lg p-2 bg-accent/15">
                <Users className="w-4 h-4 text-accent" aria-hidden="true" />
              </div>
            </div>
            {isDataLoading ? (
              <Skeleton
                className="h-9 w-20"
                data-ocid="dashboard.onsite.loading_state"
              />
            ) : (
              <p className="font-display font-bold text-3xl font-mono-nums leading-none">
                {myOnSite}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Checked in by you, still on-site
            </p>
          </div>
          <div
            className="stat-card rounded-xl p-5 flex flex-col gap-3"
            data-ocid="dashboard.user.today_card"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                My Check-ins Today
              </p>
              <div className="rounded-lg p-2 bg-primary/15">
                <UserCheck
                  className="w-4 h-4 text-primary"
                  aria-hidden="true"
                />
              </div>
            </div>
            {logLoading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <p className="font-display font-bold text-3xl font-mono-nums leading-none">
                {myToday}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Your entries for today
            </p>
          </div>
        </motion.div>
      )}

      {/* Category Breakdown Cards */}
      <section data-ocid="dashboard.categories.section">
        <h2 className="font-display font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">
          Visitor Category Breakdown
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {CATEGORIES.map((cat, i) => (
            <CategoryCard
              key={cat.key}
              config={cat}
              log={log}
              onSiteVisitors={onSiteVisitors}
              loading={isDataLoading}
              index={i}
            />
          ))}
        </div>
      </section>

      {/* Activity Log Preview */}
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
            <Users className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
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
                  {["Time", "Name", "Category", "Status", "By"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentLog.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/20 transition-colors"
                    data-ocid={`dashboard.log.item.${i + 1}`}
                  >
                    <td className="px-4 py-3 font-mono-nums text-xs text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(entry.checkInTime)}
                    </td>
                    <td className="px-4 py-3 font-medium text-sm min-w-0">
                      <span className="truncate block max-w-[140px]">
                        {entry.visitorName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${CAT_PILL[entry.category] ?? "bg-muted/30 text-muted-foreground"}`}
                      >
                        {CATEGORY_LABELS[entry.category] ?? entry.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {!entry.checkOutTime ? (
                        <span className="bg-accent/15 text-accent border border-accent/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          Checked In
                        </span>
                      ) : (
                        <span className="bg-primary/15 text-primary border border-primary/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          Checked Out
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {entry.checkedInBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
