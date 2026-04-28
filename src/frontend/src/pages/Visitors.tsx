import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Briefcase,
  LogIn,
  LogOut,
  Plus,
  Search,
  Shield,
  Star,
  Trash2,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type CheckInData,
  useActivityLog,
  useDeleteEntry,
  useMyRole,
  useSubmitCheckIn,
  useSubmitCheckOut,
} from "../hooks/useQueries";

// ---------------------------------------------------------------------------
// Category config — color-coded badges
// ---------------------------------------------------------------------------
type Category = CheckInData["category"];

const CATEGORY_CONFIG: Record<
  Category,
  { label: string; Icon: React.ElementType; badgeClass: string }
> = {
  guest: {
    label: "Guest",
    Icon: User,
    badgeClass:
      "border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20",
  },
  employer: {
    label: "Employer",
    Icon: Briefcase,
    badgeClass:
      "border-violet-500/40 bg-violet-500/10 text-violet-400 hover:bg-violet-500/20",
  },
  soldier: {
    label: "Soldier",
    Icon: Shield,
    badgeClass:
      "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20",
  },
  temporary_employee: {
    label: "Temporary Employee",
    Icon: UserCheck,
    badgeClass:
      "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20",
  },
  special_guest: {
    label: "Special Guest",
    Icon: Star,
    badgeClass: "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20",
  },
};

const CATEGORIES = Object.entries(CATEGORY_CONFIG).map(([value, cfg]) => ({
  value: value as Category,
  ...cfg,
}));

const GATE_POINTS = [
  "Main Entry",
  "Entry Gate 1",
  "Entry Gate 2",
  "Side Entry",
  "Emergency Exit",
];

// ---------------------------------------------------------------------------
// Check-In Form Dialog
// ---------------------------------------------------------------------------
function CheckInDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { mutateAsync, isPending } = useSubmitCheckIn();
  const [form, setForm] = useState<Partial<CheckInData>>({});

  const set = (field: keyof CheckInData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.idNumber || !form.category || !form.gatePoint) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      await mutateAsync(form as CheckInData);
      toast.success(`${form.name} checked in successfully`);
      setForm({});
      onClose();
    } catch {
      toast.error("Check-in failed. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-md"
        data-ocid="checkin.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-accent/15 flex items-center justify-center">
              <LogIn className="w-4 h-4 text-accent" aria-hidden="true" />
            </div>
            New Visitor Check-In
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="ci-name">Full Name *</Label>
              <Input
                id="ci-name"
                placeholder="e.g. Ahmed Hassan"
                value={form.name ?? ""}
                onChange={(e) => set("name", e.target.value)}
                data-ocid="checkin.name.input"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ci-id">ID Number *</Label>
              <Input
                id="ci-id"
                placeholder="e.g. 1220004"
                value={form.idNumber ?? ""}
                onChange={(e) => set("idNumber", e.target.value)}
                data-ocid="checkin.id_number.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select
                value={form.category ?? ""}
                onValueChange={(v) => set("category", v)}
              >
                <SelectTrigger data-ocid="checkin.category.select">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      <span className="flex items-center gap-2">
                        <c.Icon className="w-3.5 h-3.5" aria-hidden="true" />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Gate / Entry Point *</Label>
            <Select
              value={form.gatePoint ?? ""}
              onValueChange={(v) => set("gatePoint", v)}
            >
              <SelectTrigger data-ocid="checkin.gate_point.select">
                <SelectValue placeholder="Select gate" />
              </SelectTrigger>
              <SelectContent>
                {GATE_POINTS.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ci-notes">
              Notes{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (optional)
              </span>
            </Label>
            <Textarea
              id="ci-notes"
              placeholder="Purpose of visit, escort needed, remarks…"
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              className="resize-none"
              data-ocid="checkin.notes.textarea"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
              data-ocid="checkin.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={isPending}
              data-ocid="checkin.submit_button"
            >
              <LogIn className="w-4 h-4 mr-2" aria-hidden="true" />
              {isPending ? "Checking in…" : "Check In"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Delete Confirm Dialog
// ---------------------------------------------------------------------------
function DeleteConfirmDialog({
  entryId,
  visitorName,
  onClose,
}: {
  entryId: string | null;
  visitorName: string;
  onClose: () => void;
}) {
  const { mutateAsync: deleteEntry, isPending } = useDeleteEntry();

  const handleConfirm = async () => {
    if (!entryId) return;
    try {
      await deleteEntry(entryId);
      toast.success(`Entry for ${visitorName} deleted`);
      onClose();
    } catch {
      toast.error("Delete failed. Please try again.");
    }
  };

  return (
    <AlertDialog open={!!entryId} onOpenChange={(v) => !v && onClose()}>
      <AlertDialogContent
        className="bg-card border-border"
        data-ocid="checkin.delete.dialog"
      >
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove the check-in record for{" "}
            <span className="font-semibold text-foreground">{visitorName}</span>
            . This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onClose}
            data-ocid="checkin.delete.cancel_button"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            data-ocid="checkin.delete.confirm_button"
          >
            {isPending ? "Deleting…" : "Delete Entry"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Category Badge
// ---------------------------------------------------------------------------
function CategoryBadge({ raw }: { raw: string }) {
  const key = raw.toLowerCase().replace(/\s+/g, "_") as Category;
  const cfg = CATEGORY_CONFIG[key];
  if (!cfg) {
    return (
      <Badge variant="outline" className="text-xs">
        {raw}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className={`text-xs gap-1 ${cfg.badgeClass}`}>
      <cfg.Icon className="w-3 h-3" aria-hidden="true" />
      {cfg.label}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Main Visitors Page
// ---------------------------------------------------------------------------
export function Visitors() {
  const { isAuthenticated } = useInternetIdentity();
  const { data: role } = useMyRole();
  const { data: log = [], isLoading } = useActivityLog();
  const { mutateAsync: checkOut, isPending: checkingOut } = useSubmitCheckOut();

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const isAdmin =
    role === "admin" || role === "super_admin" || role === "superAdmin";

  // Filter to only currently active (checked in) entries
  const onSite = (log as Record<string, unknown>[]).filter(
    (e) => String(e.status ?? "").toLowerCase() === "checked_in",
  );

  const filtered = onSite.filter((e) => {
    const nameStr = String(e.name ?? "").toLowerCase();
    const idStr = String(e.idNumber ?? e.id_number ?? "");
    const matchesSearch =
      !search ||
      nameStr.includes(search.toLowerCase()) ||
      idStr.includes(search);
    const catNorm = String(e.category ?? "")
      .toLowerCase()
      .replace(/\s+/g, "_");
    const matchesCat = filterCategory === "all" || catNorm === filterCategory;
    return matchesSearch && matchesCat;
  });

  const handleCheckOut = async (entryId: string, name: string) => {
    try {
      await checkOut(entryId);
      toast.success(`${name} checked out successfully`);
    } catch {
      toast.error("Check-out failed. Please try again.");
    }
  };

  return (
    <div className="space-y-6" data-ocid="visitors.page">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-accent" aria-hidden="true" />
            Visitors On-Site
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoading ? (
              "Loading…"
            ) : (
              <>
                <span className="text-accent font-semibold">
                  {onSite.length}
                </span>{" "}
                {onSite.length === 1 ? "visitor" : "visitors"} currently on-site
              </>
            )}
          </p>
        </div>
        {isAuthenticated && (
          <Button
            className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground shrink-0"
            onClick={() => setShowCheckIn(true)}
            data-ocid="visitors.checkin.open_modal_button"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Check In Visitor
          </Button>
        )}
      </div>

      {/* Category summary strips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {CATEGORIES.map((cat) => {
          const count = onSite.filter(
            (e) =>
              String(e.category ?? "")
                .toLowerCase()
                .replace(/\s+/g, "_") === cat.value,
          ).length;
          return (
            <button
              key={cat.value}
              onClick={() =>
                setFilterCategory((prev) =>
                  prev === cat.value ? "all" : cat.value,
                )
              }
              type="button"
              className={`stat-card rounded-lg px-3 py-2.5 text-left transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                filterCategory === cat.value
                  ? "ring-1 ring-accent/50"
                  : "hover:border-border/80"
              }`}
              data-ocid={`visitors.category_filter.${cat.value}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <cat.Icon
                  className="w-3.5 h-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="text-xs text-muted-foreground truncate">
                  {cat.label}
                </span>
              </div>
              <span className="text-xl font-bold font-display">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            placeholder="Search by name or ID…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-ocid="visitors.search.search_input"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger
            className="w-48"
            data-ocid="visitors.category_filter.select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Visitor table */}
      {isLoading ? (
        <div className="space-y-2" data-ocid="visitors.list.loading_state">
          {[1, 2, 3, 4, 5].map((n) => (
            <Skeleton key={n} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-lg border border-dashed border-border py-16 text-center"
          data-ocid="visitors.list.empty_state"
        >
          <div className="w-14 h-14 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-3">
            <Users
              className="w-7 h-7 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <p className="font-semibold text-sm">No visitors on-site</p>
          <p className="text-muted-foreground text-xs mt-1 max-w-xs mx-auto">
            {search || filterCategory !== "all"
              ? "No results match your filters. Try clearing the search or changing the category."
              : "Check in the first visitor to get started."}
          </p>
          {isAuthenticated && !search && filterCategory === "all" && (
            <Button
              size="sm"
              className="mt-4 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={() => setShowCheckIn(true)}
              data-ocid="visitors.empty_state.button"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Check In Visitor
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">
                  Visitor
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide hidden sm:table-cell">
                  ID #
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide hidden md:table-cell">
                  Gate
                </th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide hidden lg:table-cell">
                  Notes
                </th>
                <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry, i) => {
                const entryId = String(entry.id ?? "");
                const name = String(entry.name ?? "—");
                const idNumber = String(
                  entry.idNumber ?? entry.id_number ?? "—",
                );
                const category = String(entry.category ?? "");
                const gatePoint = String(
                  entry.gatePoint ?? entry.gate_point ?? "—",
                );
                const notes = String(entry.notes ?? "");

                return (
                  <tr
                    key={entryId || i}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/15 transition-colors"
                    data-ocid={`visitors.list.item.${i + 1}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium leading-tight">{name}</div>
                      <div className="text-xs text-muted-foreground sm:hidden mt-0.5 font-mono-nums">
                        {idNumber}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono-nums text-muted-foreground hidden sm:table-cell">
                      {idNumber}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge raw={category} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell">
                      {gatePoint}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-xs hidden lg:table-cell">
                      <span className="line-clamp-1">{notes || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {isAuthenticated && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-xs border-border hover:border-accent hover:text-accent transition-colors"
                            onClick={() => handleCheckOut(entryId, name)}
                            disabled={checkingOut}
                            data-ocid={`visitors.checkout.button.${i + 1}`}
                          >
                            <LogOut
                              className="w-3.5 h-3.5"
                              aria-hidden="true"
                            />
                            Check Out
                          </Button>
                        )}
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-8 h-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() =>
                              setDeleteTarget({ id: entryId, name })
                            }
                            aria-label={`Delete entry for ${name}`}
                            data-ocid={`visitors.delete.button.${i + 1}`}
                          >
                            <Trash2
                              className="w-3.5 h-3.5"
                              aria-hidden="true"
                            />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialogs */}
      <CheckInDialog open={showCheckIn} onClose={() => setShowCheckIn(false)} />
      <DeleteConfirmDialog
        entryId={deleteTarget?.id ?? null}
        visitorName={deleteTarget?.name ?? ""}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
