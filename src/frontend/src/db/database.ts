import Dexie, { type Table } from "dexie";

// ─── Enums ────────────────────────────────────────────────────────────────────

export type AppRole = "SuperAdmin" | "Admin" | "User";

export type VisitorCategory =
  | "Guest"
  | "Employer"
  | "Soldier"
  | "TemporaryEmployee"
  | "SpecialGuest";

// ─── Table schemas ────────────────────────────────────────────────────────────

export interface UserRecord {
  id?: number;
  username: string;
  passwordHash: string;
  role: AppRole;
  isActive: boolean;
  createdAt: number; // timestamp ms
}

export interface VisitorRecord {
  id?: number;
  name: string;
  category: VisitorCategory;
  purpose: string;
  checkInTime: number; // timestamp ms
  checkOutTime: number | null;
  isOnSite: boolean;
  notes: string;
  createdBy: string; // username
}

export interface ActivityEntry {
  id?: number;
  visitorId: number;
  visitorName: string;
  category: VisitorCategory;
  purpose: string;
  checkInTime: number;
  checkOutTime: number | null;
  duration: number | null; // ms
  checkedInBy: string;
  notes: string;
  isDeleted: boolean;
}

// ─── Database class ───────────────────────────────────────────────────────────

class GateManagementDB extends Dexie {
  users!: Table<UserRecord, number>;
  visitors!: Table<VisitorRecord, number>;
  activityLog!: Table<ActivityEntry, number>;

  constructor() {
    super("GateManagementDB");

    this.version(1).stores({
      users: "++id, username, role, isActive, createdAt",
      visitors: "++id, name, category, isOnSite, checkInTime, createdBy",
      activityLog:
        "++id, visitorId, category, checkInTime, checkedInBy, isDeleted",
    });
  }
}

export const db = new GateManagementDB();
