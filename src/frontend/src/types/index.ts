// Local type definitions that replace IC-generated backend.d.ts types
// Used by pages that previously imported from backend.d.ts

export type AppRole = "SuperAdmin" | "Admin" | "User";

export type VisitorCategory =
  | "Guest"
  | "Employer"
  | "Soldier"
  | "TemporaryEmployee"
  | "SpecialGuest";

// UserInfo matches the LocalUser from db/queries.ts
export interface UserInfo {
  id: number;
  username: string;
  role: AppRole;
  isActive: boolean;
  createdAt: number;
}

// ActivityEntry from db/queries.ts (used by ActivityLog page)
export interface ActivityEntry {
  id: number;
  visitorId: number;
  visitorName: string;
  category: VisitorCategory;
  purpose: string;
  checkInTime: number; // timestamp ms
  checkOutTime: number | null;
  duration: number | null; // ms
  checkedInBy: string;
  notes: string;
  isDeleted: boolean;
}

// Legacy EntryRecord shape used by ActivityLog page
// Maps to ActivityEntry for IndexedDB implementation
export type EntryRecord = ActivityEntry;

// AppRole constant map for backwards-compat lookups
export const AppRoleValues = {
  User: "User" as const,
  SuperAdmin: "SuperAdmin" as const,
  Admin: "Admin" as const,
};
