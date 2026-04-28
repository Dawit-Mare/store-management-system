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
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Download, Pencil, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { EntryRecord, VisitorCategory } from "../backend.d";
import {
  useActivityLog,
  useDeleteEntry,
  useEditEntry,
  useMyRole,
} from "../hooks/useQueries";

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  Guest: "Guest",
  Employer: "Employer",
  Soldier: "Soldier",
  TemporaryEmployee: "Temporary Employee",
  SpecialGuest: "Special Guest",
};

const CATEGORY_FILTER_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "Guest", label: "Guest" },
  { value: "Employer", label: "Employer" },
  { value: "Soldier", label: "Soldier" },
  { value: "TemporaryEmployee", label: "Temporary Employee" },
  { value: "SpecialGuest", label: "Special Guest" },
];

const CATEGORY_BADGE_STYLES: Record<string, string> = {
  Guest: "border-chart-3/40 text-chart-3 bg-chart-3/10",
  Employer: "border-chart-1/40 text-chart-1 bg-chart-1/10",
  Soldier: "border-destructive/40 text-destructive bg-destructive/10",
  TemporaryEmployee: "border-chart-4/40 text-chart-4 bg-chart-4/10",
  SpecialGuest: "border-chart-5/40 text-chart-5 bg-chart-5/10",
};

const PAGE_SIZE = 20;
const ADMIN_ROLES = ["admin", "super_admin"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nsToMs(ns: bigint): number {
  return Number(ns / 1_000_000n);
}

function formatTimestamp(ns: bigint | undefined): string {
  if (!ns) return "—";
  const d = new Date(nsToMs(ns));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function formatDuration(checkInNs: bigint, checkOutNs: bigint): string {
  const diffMs = nsToMs(checkOutNs) - nsToMs(checkInNs);
  if (diffMs < 0) return "—";
  const totalSec = Math.floor(diffMs / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function entryCategoryKey(entry: EntryRecord): string {
  const cat = entry.checkIn.category;
  return typeof cat === "object" ? (Object.keys(cat)[0] ?? "") : String(cat);
}

function entryIsActive(entry: EntryRecord): boolean {
  return entry.checkIn.isActive && !entry.checkOut;
}

function dateFromInput(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function entryMatchesDateRange(
  entry: EntryRecord,
  from: Date | null,
  to: Date | null,
): boolean {
  if (!from && !to) return true;
  const ts = new Date(nsToMs(entry.checkIn.checkInTime));
  if (from && ts < from) return false;
  if (to) {
    const toEnd = new Date(to);
    toEnd.setHours(23, 59, 59, 999);
    if (ts > toEnd) return false;
  }
  return true;
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  entry: EntryRecord;
  open: boolean;
  onClose: () => void;
}

function EditModal({ entry, open, onClose }: EditModalProps) {
  const { mutateAsync: editEntry, isPending } = useEditEntry();
  const [name, setName] = useState(entry.checkIn.visitorName);
  const [category, setCategory] = useState(entryCategoryKey(entry));
  const [notes, setNotes] = useState(entry.checkIn.notes);

  const handleSave = async () => {
    try {
      await editEntry({
        entryId: String(entry.checkIn.id),
        updates: {
          visitorName: name,
          category: { [category]: null } as unknown as VisitorCategory,
          notes,
        },
      });
      toast.success("Entry updated");
      onClose();
    } catch {
      toast.error("Update failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="bg-card border-border max-w-md"
        data-ocid="log.edit.dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Edit Entry</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Visitor Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-input border-border"
              data-ocid="log.edit.name.input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                id="edit-category"
                className="bg-input border-border"
                data-ocid="log.edit.category.select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_FILTER_OPTIONS.filter((o) => o.value !== "all").map(
                  (o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-input border-border resize-none"
              rows={3}
              data-ocid="log.edit.notes.textarea"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={onClose}
            data-ocid="log.edit.cancel_button"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || !name.trim()}
            data-ocid="log.edit.save_button"
          >
            {isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ActivityLog() {
  const { data: log = [], isLoading } = useActivityLog();
  const { data: myRole } = useMyRole();
  const { mutateAsync: deleteEntry, isPending: deleting } = useDeleteEntry();

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [editTarget, setEditTarget] = useState<EntryRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EntryRecord | null>(null);

  const isAdmin = myRole != null && ADMIN_ROLES.includes(String(myRole));

  const fromDateObj = dateFromInput(fromDate);
  const toDateObj = dateFromInput(toDate);

  const filtered = (log as EntryRecord[])
    .filter((entry) => {
      const nameMatch =
        !search ||
        entry.checkIn.visitorName.toLowerCase().includes(search.toLowerCase());
      const catKey = entryCategoryKey(entry);
      const catMatch = filterCategory === "all" || catKey === filterCategory;
      const dateMatch = entryMatchesDateRange(entry, fromDateObj, toDateObj);
      return nameMatch && catMatch && dateMatch;
    })
    .sort((a, b) => Number(b.checkIn.checkInTime - a.checkIn.checkInTime));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageEntries = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEntry(String(deleteTarget.checkIn.id));
      toast.success("Entry deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

  const exportCSV = () => {
    const rows = [
      [
        "Check-in Time",
        "Check-out Time",
        "Visitor Name",
        "Category",
        "Duration",
        "Status",
        "Submitted By",
      ],
      ...filtered.map((e) => {
        const catKey = entryCategoryKey(e);
        const isActive = entryIsActive(e);
        const duration = e.checkOut
          ? formatDuration(e.checkIn.checkInTime, e.checkOut.checkOutTime)
          : "—";
        return [
          formatTimestamp(e.checkIn.checkInTime),
          e.checkOut ? formatTimestamp(e.checkOut.checkOutTime) : "—",
          e.checkIn.visitorName,
          CATEGORY_LABELS[catKey] ?? catKey,
          duration,
          isActive ? "Checked In" : "Checked Out",
          e.checkIn.submittedBy.toText?.() ?? String(e.checkIn.submittedBy),
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      }),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gate-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5" data-ocid="log.page">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Activity Log
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Full audit trail of all gate entries and exits
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shrink-0"
          onClick={exportCSV}
          data-ocid="log.export.button"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by visitor name…"
              className="pl-9 bg-input border-border"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              data-ocid="log.search.search_input"
            />
          </div>
          {/* Category */}
          <Select
            value={filterCategory}
            onValueChange={(v) => {
              setFilterCategory(v);
              setPage(1);
            }}
          >
            <SelectTrigger
              className="w-48 bg-input border-border"
              data-ocid="log.category_filter.select"
            >
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_FILTER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date range */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium w-12 shrink-0">
            From
          </span>
          <Input
            type="date"
            className="w-40 bg-input border-border text-sm"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            data-ocid="log.date_from.input"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            className="w-40 bg-input border-border text-sm"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            data-ocid="log.date_to.input"
          />
          {(fromDate || toDate) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground text-xs h-8 px-2"
              onClick={() => {
                setFromDate("");
                setToDate("");
                setPage(1);
              }}
              data-ocid="log.date_clear.button"
            >
              Clear dates
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2" data-ocid="log.table.loading_state">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <Skeleton key={n} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-lg border border-dashed border-border py-20 text-center"
          data-ocid="log.table.empty_state"
        >
          <AlertTriangle
            className="w-8 h-8 text-muted-foreground mx-auto mb-3"
            aria-hidden="true"
          />
          <p className="text-sm font-semibold">No entries found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Try adjusting your search filters
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                      Visitor Name
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                      Check-in Time
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                      Check-out Time
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                      Submitted By
                    </th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageEntries.map((entry, i) => {
                    const catKey = entryCategoryKey(entry);
                    const active = entryIsActive(entry);
                    const duration = entry.checkOut
                      ? formatDuration(
                          entry.checkIn.checkInTime,
                          entry.checkOut.checkOutTime,
                        )
                      : "—";
                    const submittedBy =
                      entry.checkIn.submittedBy.toText?.() ??
                      String(entry.checkIn.submittedBy);
                    const shortPrincipal = `${submittedBy.slice(0, 5)}…${submittedBy.slice(-3)}`;
                    const rowIdx = (safePage - 1) * PAGE_SIZE + i + 1;

                    return (
                      <tr
                        key={String(entry.checkIn.id)}
                        className={`border-b border-border/40 last:border-0 transition-colors ${
                          active
                            ? "bg-accent/5 hover:bg-accent/10"
                            : "hover:bg-muted/15"
                        }`}
                        data-ocid={`log.table.item.${rowIdx}`}
                      >
                        {/* Status indicator */}
                        <td className="px-4 py-3">
                          {active ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/15 text-accent border border-accent/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse inline-block" />
                              Checked In
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted/40 text-muted-foreground border border-border">
                              Checked Out
                            </span>
                          )}
                        </td>

                        {/* Visitor name */}
                        <td className="px-4 py-3 font-medium text-foreground">
                          <span
                            className="truncate max-w-[160px] block"
                            title={entry.checkIn.visitorName}
                          >
                            {entry.checkIn.visitorName}
                          </span>
                          {entry.checkIn.notes && (
                            <span
                              className="text-xs text-muted-foreground truncate max-w-[160px] block mt-0.5"
                              title={entry.checkIn.notes}
                            >
                              {entry.checkIn.notes}
                            </span>
                          )}
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={`text-xs border capitalize ${CATEGORY_BADGE_STYLES[catKey] ?? "border-border text-muted-foreground"}`}
                          >
                            {CATEGORY_LABELS[catKey] ?? catKey}
                          </Badge>
                        </td>

                        {/* Check-in time */}
                        <td className="px-4 py-3 font-mono-nums text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimestamp(entry.checkIn.checkInTime)}
                        </td>

                        {/* Check-out time */}
                        <td className="px-4 py-3 font-mono-nums text-xs text-muted-foreground whitespace-nowrap">
                          {entry.checkOut ? (
                            formatTimestamp(entry.checkOut.checkOutTime)
                          ) : (
                            <span className="text-accent/70 text-xs">
                              Still on-site
                            </span>
                          )}
                        </td>

                        {/* Duration */}
                        <td className="px-4 py-3 font-mono-nums text-xs text-muted-foreground">
                          {duration}
                        </td>

                        {/* Submitted by */}
                        <td className="px-4 py-3 font-mono-nums text-xs text-muted-foreground">
                          <span title={submittedBy}>{shortPrincipal}</span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {isAdmin && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-7 h-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => setEditTarget(entry)}
                                  aria-label="Edit entry"
                                  data-ocid={`log.edit_button.${rowIdx}`}
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="w-7 h-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => setDeleteTarget(entry)}
                                  disabled={deleting}
                                  aria-label="Delete entry"
                                  data-ocid={`log.delete_button.${rowIdx}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer: count + pagination */}
            <div className="border-t border-border bg-muted/10 px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
              <span className="text-xs text-muted-foreground">
                Showing{" "}
                <span className="text-foreground font-medium">
                  {(safePage - 1) * PAGE_SIZE + 1}–
                  {Math.min(safePage * PAGE_SIZE, filtered.length)}
                </span>{" "}
                of{" "}
                <span className="text-foreground font-medium">
                  {filtered.length}
                </span>{" "}
                entries
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    data-ocid="log.pagination_prev"
                  >
                    Prev
                  </Button>
                  <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                    {safePage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2.5 text-xs"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    data-ocid="log.pagination_next"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Edit modal */}
      {editTarget && (
        <EditModal
          entry={editTarget}
          open
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent
          className="bg-card border-border"
          data-ocid="log.delete.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete the entry for{" "}
              <span className="text-foreground font-medium">
                {deleteTarget?.checkIn.visitorName}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="log.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              data-ocid="log.delete.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
