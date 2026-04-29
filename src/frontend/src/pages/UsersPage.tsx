import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  useAssignRole,
  useDeactivateUser,
  useListUsers,
  useReactivateUser,
  useRevokeRole,
} from "@/hooks/useQueries";
import { useQueryClient } from "@tanstack/react-query";
import {
  Lock,
  Plus,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { createUser, hashPassword } from "../db";
import type { AppRole, UserInfo } from "../types";

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_ADMINS = 3;
const MAX_USERS = 4;

// ─── RoleBadge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: AppRole }) {
  const cls =
    role === "SuperAdmin"
      ? "role-badge role-super-admin"
      : role === "Admin"
        ? "role-badge role-admin"
        : "role-badge role-user";
  const icon =
    role === "SuperAdmin" ? (
      <ShieldAlert className="w-3 h-3 mr-1 inline" aria-hidden="true" />
    ) : role === "Admin" ? (
      <ShieldCheck className="w-3 h-3 mr-1 inline" aria-hidden="true" />
    ) : (
      <User className="w-3 h-3 mr-1 inline" aria-hidden="true" />
    );
  const label =
    role === "SuperAdmin" ? "Super Admin" : role === "Admin" ? "Admin" : "User";
  return (
    <span className={cls}>
      {icon}
      {label}
    </span>
  );
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────
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

// ─── CapacityCounter ──────────────────────────────────────────────────────────
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

// ─── Add User Dialog ──────────────────────────────────────────────────────────
function AddUserDialog({
  open,
  onClose,
  adminCount,
  userCount,
  isSuperAdmin,
}: {
  open: boolean;
  onClose: () => void;
  adminCount: number;
  userCount: number;
  isSuperAdmin: boolean;
}) {
  const queryClient = useQueryClient();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // Admins can only create Users; SuperAdmin can choose Admin or User
  const [role, setRole] = useState<"Admin" | "User">("User");
  const [isPending, setIsPending] = useState(false);

  const canAddAdmin = adminCount < MAX_ADMINS;
  const canAddUser = userCount < MAX_USERS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Username and password are required");
      return;
    }
    if (role === "Admin" && !canAddAdmin) {
      toast.error(`Admin limit reached (max ${MAX_ADMINS})`);
      return;
    }
    if (role === "User" && !canAddUser) {
      toast.error(`User limit reached (max ${MAX_USERS})`);
      return;
    }
    setIsPending(true);
    try {
      const hash = await hashPassword(password);
      await createUser({ username: username.trim(), passwordHash: hash, role });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(`${role} account created for ${username}`);
      setUsername("");
      setPassword("");
      setRole("User");
      onClose();
    } catch {
      toast.error("Failed to create user. Username may already exist.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-sm"
        data-ocid="users.add.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Add New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-username">Username</Label>
            <Input
              id="new-username"
              placeholder="e.g. john.doe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              data-ocid="users.add.username.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-ocid="users.add.password.input"
            />
          </div>
          {isSuperAdmin && (
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as "Admin" | "User")}
              >
                <SelectTrigger data-ocid="users.add.role.select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin" disabled={!canAddAdmin}>
                    Admin{!canAddAdmin ? " (full)" : ""}
                  </SelectItem>
                  <SelectItem value="User" disabled={!canAddUser}>
                    User{!canAddUser ? " (full)" : ""}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {!isSuperAdmin && (
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
              As Admin, you can only create <strong>User</strong> accounts.
            </p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              data-ocid="users.add.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || (!isSuperAdmin && !canAddUser)}
              data-ocid="users.add.submit_button"
            >
              {isPending ? "Creating…" : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── UserRow ──────────────────────────────────────────────────────────────────
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
  onAssignRole: (uid: number, role: AppRole) => void;
  onRevokeRole: (uid: number) => void;
  onDeactivate: (uid: number) => void;
  onReactivate: (uid: number) => void;
  activeOp: number | null;
}) {
  const isTargetSuperAdmin = user.role === "SuperAdmin";
  const busy = activeOp === user.id;
  const canAssignAdmin = adminCount < MAX_ADMINS || user.role === "Admin";
  const canAssignUser = userCount < MAX_USERS || user.role === "User";

  return (
    <tr
      className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
      data-ocid={`users.item.${index}`}
    >
      <td className="px-4 py-3 min-w-0">
        <span className="font-mono-nums text-sm text-foreground font-medium">
          {user.username}
        </span>
        <span className="text-xs text-muted-foreground block mt-0.5">
          ID #{user.id}
        </span>
      </td>
      <td className="px-4 py-3">
        <RoleBadge role={user.role} />
      </td>
      <td className="px-4 py-3">
        <StatusBadge isActive={user.isActive} />
      </td>
      <td className="px-4 py-3">
        {isTargetSuperAdmin ? (
          <span className="text-xs text-muted-foreground italic">
            Protected — cannot be modified
          </span>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            {isSuperAdmin && (
              <>
                <Select
                  value={user.role}
                  onValueChange={(v) => onAssignRole(user.id, v as AppRole)}
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
                    <SelectItem value="Admin" disabled={!canAssignAdmin}>
                      Admin
                      {!canAssignAdmin && user.role !== "Admin"
                        ? " (full)"
                        : ""}
                    </SelectItem>
                    <SelectItem value="User" disabled={!canAssignUser}>
                      User
                      {!canAssignUser && user.role !== "User" ? " (full)" : ""}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {user.role === "Admin" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onRevokeRole(user.id)}
                    disabled={busy}
                    data-ocid={`users.revoke_button.${index}`}
                  >
                    Revoke
                  </Button>
                )}
              </>
            )}
            {(isSuperAdmin || (isAdmin && user.role === "User")) &&
              (user.isActive ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDeactivate(user.id)}
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
                  onClick={() => onReactivate(user.id)}
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export function UsersPage() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const { data: rawUsers = [], isLoading: usersLoading } = useListUsers();
  const assignRole = useAssignRole();
  const revokeRole = useRevokeRole();
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();
  const [activeOp, setActiveOp] = useState<number | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);

  const myRole = currentUser?.role as AppRole | null;
  const isSuperAdmin = myRole === "SuperAdmin";
  const isAdmin = myRole === "Admin";
  const canAccess = isSuperAdmin || isAdmin;

  const users = rawUsers as UserInfo[];
  const adminCount = users.filter((u) => u.role === "Admin").length;
  const userCount = users.filter((u) => u.role === "User").length;

  function handleAssignRole(uid: number, role: AppRole) {
    setActiveOp(uid);
    assignRole.mutate(
      { userId: uid, role },
      {
        onSuccess: () => toast.success("Role updated"),
        onError: () => toast.error("Failed to update role"),
        onSettled: () => setActiveOp(null),
      },
    );
  }

  function handleRevokeRole(uid: number) {
    setActiveOp(uid);
    revokeRole.mutate(uid, {
      onSuccess: () => toast.success("Admin role revoked"),
      onError: () => toast.error("Failed to revoke role"),
      onSettled: () => setActiveOp(null),
    });
  }

  function handleDeactivate(uid: number) {
    setActiveOp(uid);
    deactivateUser.mutate(uid, {
      onSuccess: () => toast.success("User deactivated"),
      onError: () => toast.error("Failed to deactivate user"),
      onSettled: () => setActiveOp(null),
    });
  }

  function handleReactivate(uid: number) {
    setActiveOp(uid);
    reactivateUser.mutate(uid, {
      onSuccess: () => toast.success("User reactivated"),
      onError: () => toast.error("Failed to reactivate user"),
      onSettled: () => setActiveOp(null),
    });
  }

  if (authLoading) {
    return (
      <div className="p-6 space-y-4" data-ocid="users.loading_state">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

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
              to manage users.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-ocid="users.page">
      {/* Header */}
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
                : "Admin — create User accounts and manage user status"}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-3 flex-wrap"
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
          {/* Both SuperAdmin and Admin can add users */}
          {canAccess && (
            <Button
              size="sm"
              className="gap-2 bg-primary/90 hover:bg-primary text-primary-foreground"
              onClick={() => setShowAddUser(true)}
              disabled={!isSuperAdmin && userCount >= MAX_USERS}
              data-ocid="users.add.open_modal_button"
            >
              <Plus className="w-4 h-4" />
              Add User
            </Button>
          )}
        </div>
      </div>

      {/* Users Table */}
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
                  {["Username", "Role", "Status", "Actions"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <UserRow
                    key={user.id}
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
                  Role changes take effect immediately.
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

      <AddUserDialog
        open={showAddUser}
        onClose={() => setShowAddUser(false)}
        adminCount={adminCount}
        userCount={userCount}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
