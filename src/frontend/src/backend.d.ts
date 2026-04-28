import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type UserId = Principal;
export type Timestamp = bigint;
export type EntryId = bigint;
export interface CheckOut {
    checkInId: EntryId;
    checkOutTime: Timestamp;
}
export interface CheckIn {
    id: EntryId;
    submittedBy: UserId;
    checkInTime: Timestamp;
    isActive: boolean;
    visitorName: string;
    notes: string;
    category: VisitorCategory;
}
export interface CheckInInput {
    visitorName: string;
    notes: string;
    category: VisitorCategory;
}
export interface EntryRecord {
    checkIn: CheckIn;
    checkOut?: CheckOut;
}
export interface UserInfo {
    principal: UserId;
    role: AppRole;
    isActive: boolean;
}
export enum AppRole {
    User = "User",
    SuperAdmin = "SuperAdmin",
    Admin = "Admin"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VisitorCategory {
    Guest = "Guest",
    TemporaryEmployee = "TemporaryEmployee",
    Soldier = "Soldier",
    Employer = "Employer",
    SpecialGuest = "SpecialGuest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignRole(target: UserId, role: AppRole): Promise<void>;
    deactivateUser(target: UserId): Promise<void>;
    deleteEntry(entryId: EntryId): Promise<void>;
    editEntry(entryId: EntryId, input: CheckInInput): Promise<void>;
    getActivityLog(): Promise<Array<EntryRecord>>;
    getActivityLogByCategory(category: VisitorCategory): Promise<Array<EntryRecord>>;
    getActivityLogByDateRange(from: Timestamp, to: Timestamp): Promise<Array<EntryRecord>>;
    getCallerUserRole(): Promise<UserRole>;
    getMyRole(): Promise<AppRole | null>;
    isCallerAdmin(): Promise<boolean>;
    listUsers(): Promise<Array<UserInfo>>;
    reactivateUser(target: UserId): Promise<void>;
    revokeRole(target: UserId): Promise<void>;
    submitCheckIn(input: CheckInInput): Promise<EntryId>;
    submitCheckOut(checkInId: EntryId): Promise<void>;
}
