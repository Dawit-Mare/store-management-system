import { AppRole, type UserInfo } from "@/backend.d";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAssignRole,
  useDeactivateUser,
  useListUsers,
  useMyRole,
  useReactivateUser,
  useRevokeRole,
} from "@/hooks/useQueries";
import { Lock, ShieldAlert, ShieldCheck, User, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_ADMINS = 3;
const MAX_USERS = 4;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function truncatePrincipal(p: { toString(): string } | string): string {
  const s = typeof p === "string" ? p : p.toString();
  if (s.length <= 22) return s;
  return `${s.slice(0, 12)}…${s.slice(-8)}`;
}

function toAppRole(raw: string | null | undefined): AppRole | null {
  if (!raw) return null;
  if (raw === AppRole.SuperAdmin || raw === "SuperAdmin")
    return AppRole.SuperAdmin;
  if (raw === AppRole.Admin || raw === "Admin") return AppRole.Admin;
  if (raw === AppRole.User || raw === "User") return AppRole.User;
  return null;
}

// ---------------------------------------------------------------------------
// RoleBadge
// ---------------------------------------------------------------------------
function RoleBadge({ role }: { role: AppRole }) {
  const cls =
    role === AppRole.SuperAdmin
      ? "role-badge role-super-admin"
      : role === AppRole.Admin
        ? "role-badge role-admin"
        : "role-badge role-user";
  const icon =
    role === AppRole.SuperAdmin ? (
      <ShieldAlert className="w-3 h-3 mr-1 inline" aria-hidden="true" />
    ) : role === AppRole.Admin ? (
      <ShieldCheck className="w-3 h-3 mr-1 inline" aria-hidden="true" />
    ) : (
      <User className="w-3 h-3 mr-1 inline" aria-hidden="true" />
    );
  const label =
    role === AppRole.SuperAdmin
      ? "Super Admin"
      : role === AppRole.Admin
        ? "Admin"
        : "User";
  return (
    <span className={cls}>
      {icon}
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------
function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge variant="outline" className="border-accent text-accent text-xs">
      Active
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="border-destructive text-destructive text-xs"
    >
      Inactive
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// CapacityCounter
// ---------------------------------------------------------------------------
function CapacityCounter({
  label,
  current,
  max,
  color,
}: {
  label: string;
  current: number;
  max: number;
  color: "amber" | "green";
}) {
  const full = current >= max;
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
        full
          ? "border-destructive/40 bg-destructive/5"
          : color === "amber"
            ? "border-primary/30 bg-primary/5"
            : "border-accent/30 bg-accent/5"
      }`}
    >
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span
        className={`font-mono-nums text-sm font-bold ${
          full
            ? "text-destructive"
            : color === "amber"
              ? "text-primary"
              : "text-accent"
        }`}
      >
        {current}/{max}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UserRow
// ---------------------------------------------------------------------------
function UserRow({
  user,
  index,
  isSuperAdmin,
  isAdmin,
  adminCount,
  userCount,
  onAssignRole,
  onRevokeRole,
  onDeactivate,
  onReactivate,
  activeOp,
}: {
  user: UserInfo;
  index: number;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  adminCount: number;
  userCount: number;
  onAssignRole: (uid: string, role: AppRole) => void;
  onRevokeRole: (uid: string) => void;
  onDeactivate: (uid: string) => void;
  onReactivate: (uid: string) => void;
  activeOp: string | null;
}) {
  const uid = user.principal.toString();
  const isTargetSuperAdmin = user.role === AppRole.SuperAdmin;
  const busy = activeOp === uid;

  const canAssignAdmin = adminCount < MAX_ADMINS || user.role === AppRole.Admin;
  const canAssignUser = userCount < MAX_USERS || user.role === AppRole.User;

  return (
    <tr
      className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
      data-ocid={`users.item.${index}`}
    >
      {/* Principal */}
      <td className="px-4 py-3 min-w-0">
        <span
          className="font-mono-nums text-xs text-muted-foreground truncate block max-w-[180px]"
          title={uid}
        >
          {truncatePrincipal(uid)}
        </span>
      </td>

      {/* Role */}
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge isActive={user.isActive} />
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        {isTargetSuperAdmin ? (
          <span className="text-xs text-muted-foreground italic">—</span>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Super Admin: inline role assignment */}
            {isSuperAdmin && (
              <>
                <Select
                  value={user.role}
                  onValueChange={(v) => onAssignRole(uid, v as AppRole)}
                  disabled={busy}
                >
                  <SelectTrigger
                    className="h-7 text-xs w-28 bg-muted border-border"
                    data-ocid={`users.role_select.${index}`}
                    aria-label="Assign role"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value={AppRole.Admin}
                      disabled={!canAssignAdmin}
                    >
                      Admin
                      {!canAssignAdmin && user.role !== AppRole.Admin
                        ? " (full)"
                        : ""}
                    </SelectItem>
                    <SelectItem value={AppRole.User} disabled={!canAssignUser}>
                      User
                      {!canAssignUser && user.role !== AppRole.User
                        ? " (full)"
                        : ""}
                    </SelectItem>
                  </SelectContent>
                </Select>

                {user.role === AppRole.Admin && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onRevokeRole(uid)}
                    disabled={busy}
                    data-ocid={`users.revoke_button.${index}`}
                    aria-label="Revoke Admin role"
                  >
                    Revoke
                  </Button>
                )}
              </>
            )}

            {/* Activate/Deactivate: Super Admin on anyone, Admin on User only */}
            {(isSuperAdmin || (isAdmin && user.role === AppRole.User)) &&
              (user.isActive ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDeactivate(uid)}
                  disabled={busy}
                  data-ocid={`users.deactivate_button.${index}`}
                >
                  Deactivate
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs border-accent text-accent hover:bg-accent/10"
                  onClick={() => onReactivate(uid)}
                  disabled={busy}
                  data-ocid={`users.reactivate_button.${index}`}
                >
                  Reactivate
                </Button>
              ))}
          </div>
        )}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export function UsersPage() {
  const { data: myRoleRaw, isLoading: roleLoading } = useMyRole();
  const { data: rawUsers = [], isLoading: usersLoading } = useListUsers();
  const assignRole = useAssignRole();
  const revokeRole = useRevokeRole();
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();
  const [activeOp, setActiveOp] = useState<string | null>(null);

  const myRole = toAppRole(myRoleRaw as string | null | undefined);
  const isSuperAdmin = myRole === AppRole.SuperAdmin;
  const isAdmin = myRole === AppRole.Admin;
  const canAccess = isSuperAdmin || isAdmin;

  // Cast to properly-typed list
  const users = rawUsers as UserInfo[];

  // Capacity counts (excluding super admin)
  const adminCount = users.filter((u) => u.role === AppRole.Admin).length;
  const userCount = users.filter((u) => u.role === AppRole.User).length;

  // ─── Handlers ────────────────────────────────────────────────────────────
  function handleAssignRole(uid: string, role: AppRole) {
    setActiveOp(uid);
    assignRole.mutate(
      { userId: uid, role },
      {
        onSuccess: () => toast.success("Role updated successfully"),
        onError: () => toast.error("Failed to update role"),
        onSettled: () => setActiveOp(null),
      },
    );
  }

  function handleRevokeRole(uid: string) {
    setActiveOp(uid);
    revokeRole.mutate(uid, {
      onSuccess: () => toast.success("Admin role revoked"),
      onError: () => toast.error("Failed to revoke role"),
      onSettled: () => setActiveOp(null),
    });
  }

  function handleDeactivate(uid: string) {
    setActiveOp(uid);
    deactivateUser.mutate(uid, {
      onSuccess: () => toast.success("User deactivated"),
      onError: () => toast.error("Failed to deactivate user"),
      onSettled: () => setActiveOp(null),
    });
  }

  function handleReactivate(uid: string) {
    setActiveOp(uid);
    reactivateUser.mutate(uid, {
      onSuccess: () => toast.success("User reactivated"),
      onError: () => toast.error("Failed to reactivate user"),
      onSettled: () => setActiveOp(null),
    });
  }

  // ─── Loading skeleton ─────────────────────────────────────────────────────
  if (roleLoading) {
    return (
      <div className="p-6 space-y-4" data-ocid="users.loading_state">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  // ─── Access restricted ────────────────────────────────────────────────────
  if (!canAccess) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4"
        data-ocid="users.error_state"
      >
        <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/5 flex flex-col items-center gap-4 max-w-md w-full text-center">
          <Lock
            className="w-12 h-12 text-destructive opacity-70"
            aria-hidden="true"
          />
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Access Restricted
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You need{" "}
              <span className="role-badge role-super-admin">Super Admin</span>{" "}
              or <span className="role-badge role-admin">Admin</span> privileges
              to manage users. Contact your Super Admin to request elevated
              access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main UI ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6" data-ocid="users.page">
      {/* Header + capacity counters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Users className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground text-sm">
              {isSuperAdmin
                ? "Super Admin — full role and account control"
                : "Admin — manage user account status"}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-2 flex-wrap"
          data-ocid="users.capacity_panel"
        >
          <CapacityCounter
            label="Admins"
            current={adminCount}
            max={MAX_ADMINS}
            color="green"
          />
          <CapacityCounter
            label="Users"
            current={userCount}
            max={MAX_USERS}
            color="amber"
          />
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {usersLoading ? (
          <div className="p-6 space-y-3" data-ocid="users.table_loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3 text-center"
            data-ocid="users.empty_state"
          >
            <Users
              className="w-10 h-10 text-muted-foreground opacity-40"
              aria-hidden="true"
            />
            <p className="text-muted-foreground text-sm">
              No users registered yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-ocid="users.table">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">
                    Principal ID
                  </th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">
                    Role
                  </th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">
                    Status
                  </th>
                  <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <UserRow
                    key={user.principal.toString()}
                    user={user}
                    index={i + 1}
                    isSuperAdmin={isSuperAdmin}
                    isAdmin={isAdmin}
                    adminCount={adminCount}
                    userCount={userCount}
                    onAssignRole={handleAssignRole}
                    onRevokeRole={handleRevokeRole}
                    onDeactivate={handleDeactivate}
                    onReactivate={handleReactivate}
                    activeOp={activeOp}
                  />
                ))}
              </tbody>
            </table>
            <div className="border-t border-border bg-muted/10 px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {users.length} user{users.length !== 1 ? "s" : ""} registered
              </span>
              {isSuperAdmin && (
                <span className="italic">
                  Role changes take effect on the user's next session refresh.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground items-center">
        <span className="font-semibold">Legend:</span>
        <span className="role-badge role-super-admin">
          <ShieldAlert className="w-3 h-3 mr-1 inline" aria-hidden="true" />
          Super Admin
        </span>
        <span className="role-badge role-admin">
          <ShieldCheck className="w-3 h-3 mr-1 inline" aria-hidden="true" />
          Admin
        </span>
        <span className="role-badge role-user">
          <User className="w-3 h-3 mr-1 inline" aria-hidden="true" />
          User
        </span>
      </div>
    </div>
  );
}
