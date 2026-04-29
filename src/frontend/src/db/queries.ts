import {
  type ActivityEntry,
  type AppRole,
  type VisitorCategory,
  type VisitorRecord,
  db,
} from "./database";

// ─── Visitor queries ───────────────────────────────────────────────────────────

export async function checkIn(data: {
  name: string;
  category: VisitorCategory;
  purpose: string;
  notes: string;
  createdBy: string;
}): Promise<number> {
  const now = Date.now();

  // Add visitor record
  const visitorId = await db.visitors.add({
    name: data.name,
    category: data.category,
    purpose: data.purpose,
    checkInTime: now,
    checkOutTime: null,
    isOnSite: true,
    notes: data.notes,
    createdBy: data.createdBy,
  });

  // Add activity log entry
  await db.activityLog.add({
    visitorId: visitorId as number,
    visitorName: data.name,
    category: data.category,
    purpose: data.purpose,
    checkInTime: now,
    checkOutTime: null,
    duration: null,
    checkedInBy: data.createdBy,
    notes: data.notes,
    isDeleted: false,
  });

  return visitorId as number;
}

export async function checkOut(visitorId: number): Promise<void> {
  const now = Date.now();
  const visitor = await db.visitors.get(visitorId);
  if (!visitor) throw new Error("Visitor not found");

  const duration = now - visitor.checkInTime;

  await db.visitors.update(visitorId, {
    checkOutTime: now,
    isOnSite: false,
  });

  // Update matching activity log entry
  const entry = await db.activityLog
    .where("visitorId")
    .equals(visitorId)
    .and((e) => e.checkOutTime === null && !e.isDeleted)
    .first();

  if (entry?.id != null) {
    await db.activityLog.update(entry.id, {
      checkOutTime: now,
      duration,
    });
  }
}

export async function getOnSiteVisitors(): Promise<VisitorRecord[]> {
  return db.visitors.where("isOnSite").equals(1).toArray();
}

export async function getVisitorById(
  id: number,
): Promise<VisitorRecord | undefined> {
  return db.visitors.get(id);
}

export async function updateVisitor(
  id: number,
  data: Partial<VisitorRecord>,
): Promise<void> {
  await db.visitors.update(id, data);
}

export async function deleteVisitor(id: number): Promise<void> {
  await db.visitors.update(id, { isOnSite: false });
  await db.activityLog
    .where("visitorId")
    .equals(id)
    .modify({ isDeleted: true });
}

// ─── Activity log queries ──────────────────────────────────────────────────────

export async function getAllEntries(): Promise<ActivityEntry[]> {
  return db.activityLog.where("isDeleted").equals(0).toArray();
}

export async function getEntriesByCategory(
  category: VisitorCategory,
): Promise<ActivityEntry[]> {
  return db.activityLog
    .where("category")
    .equals(category)
    .and((e) => !e.isDeleted)
    .toArray();
}

export async function getEntriesByDateRange(
  from: number,
  to: number,
): Promise<ActivityEntry[]> {
  return db.activityLog
    .where("checkInTime")
    .between(from, to, true, true)
    .and((e) => !e.isDeleted)
    .toArray();
}

export async function searchEntries(query: string): Promise<ActivityEntry[]> {
  const q = query.toLowerCase();
  return db.activityLog
    .where("isDeleted")
    .equals(0)
    .and((e) => e.visitorName.toLowerCase().includes(q))
    .toArray();
}

export async function getEntryById(
  id: number,
): Promise<ActivityEntry | undefined> {
  return db.activityLog.get(id);
}

export async function updateEntry(
  id: number,
  data: Partial<ActivityEntry>,
): Promise<void> {
  await db.activityLog.update(id, data);
  // Sync visitor name if changed
  const entry = await db.activityLog.get(id);
  if (entry && data.visitorName) {
    await db.visitors.update(entry.visitorId, { name: data.visitorName });
  }
}

export async function deleteEntry(id: number): Promise<void> {
  await db.activityLog.update(id, { isDeleted: true });
}

export function exportToCSV(entries: ActivityEntry[]): void {
  const CATEGORY_LABELS: Record<string, string> = {
    Guest: "Guest",
    Employer: "Employer",
    Soldier: "Soldier",
    TemporaryEmployee: "Temporary Employee",
    SpecialGuest: "Special Guest",
  };

  function fmt(ts: number | null): string {
    if (!ts) return "—";
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  }

  function fmtDuration(ms: number | null): string {
    if (!ms || ms < 0) return "—";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  const rows = [
    [
      "Check-in Time",
      "Check-out Time",
      "Visitor Name",
      "Category",
      "Purpose",
      "Duration",
      "Status",
      "Checked In By",
      "Notes",
    ],
    ...entries.map((e) => [
      fmt(e.checkInTime),
      fmt(e.checkOutTime),
      e.visitorName,
      CATEGORY_LABELS[e.category] ?? e.category,
      e.purpose,
      fmtDuration(e.duration),
      e.checkOutTime ? "Checked Out" : "Checked In",
      e.checkedInBy,
      e.notes,
    ]),
  ];

  const csv = rows
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `gate-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── User queries ─────────────────────────────────────────────────────────────

export interface LocalUser {
  id: number;
  username: string;
  role: AppRole;
  isActive: boolean;
  createdAt: number;
}

export async function getUsers(): Promise<LocalUser[]> {
  const users = await db.users.toArray();
  return users.map(({ passwordHash: _ph, id, ...u }) => ({
    id: id as number,
    ...u,
  }));
}

export async function getUserByUsername(
  username: string,
): Promise<LocalUser | undefined> {
  const user = await db.users
    .where("username")
    .equalsIgnoreCase(username)
    .first();
  if (!user) return undefined;
  const { passwordHash: _ph, ...rest } = user;
  return { ...rest, id: user.id as number };
}

export async function createUser(data: {
  username: string;
  passwordHash: string;
  role: AppRole;
}): Promise<number> {
  return db.users.add({
    ...data,
    isActive: true,
    createdAt: Date.now(),
  }) as Promise<number>;
}

export async function updateUserRole(id: number, role: AppRole): Promise<void> {
  await db.users.update(id, { role });
}

export async function deactivateUser(id: number): Promise<void> {
  await db.users.update(id, { isActive: false });
}

export async function reactivateUser(id: number): Promise<void> {
  await db.users.update(id, { isActive: true });
}

export async function getUserCounts(): Promise<{
  admins: number;
  users: number;
}> {
  const all = await db.users.toArray();
  return {
    admins: all.filter((u) => u.role === "Admin").length,
    users: all.filter((u) => u.role === "User").length,
  };
}
