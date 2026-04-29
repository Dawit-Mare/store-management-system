import { type UserRecord, db } from "./database";

// ─── Password hashing (Web Crypto API) ───────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${password}gate_mgmt_salt_v1`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}

// ─── Session management ───────────────────────────────────────────────────────

const SESSION_KEY = "gate_mgmt_user";

export type SessionUser = Omit<UserRecord, "passwordHash"> & { id: number };

export function getCurrentUser(): SessionUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: SessionUser): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function clearCurrentUser(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── Authentication ───────────────────────────────────────────────────────────

export async function login(
  username: string,
  password: string,
): Promise<SessionUser | null> {
  const user = await db.users
    .where("username")
    .equalsIgnoreCase(username)
    .first();
  if (!user || !user.id) return null;
  if (!user.isActive) return null;
  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  const { passwordHash: _ph, ...sessionData } = user;
  const sessionUser: SessionUser = { ...sessionData, id: user.id };
  setCurrentUser(sessionUser);
  return sessionUser;
}

export function logout(): void {
  clearCurrentUser();
}

// ─── Seed super admin ─────────────────────────────────────────────────────────

export async function initializeSuperAdmin(): Promise<void> {
  const count = await db.users.count();
  if (count > 0) return;

  const hash = await hashPassword("admin123");
  await db.users.add({
    username: "superadmin",
    passwordHash: hash,
    role: "SuperAdmin",
    isActive: true,
    createdAt: Date.now(),
  });
}
