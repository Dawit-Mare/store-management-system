export { db } from "./database";
export type {
  AppRole,
  VisitorCategory,
  UserRecord,
  VisitorRecord,
  ActivityEntry,
} from "./database";

export {
  hashPassword,
  verifyPassword,
  login,
  logout,
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  initializeSuperAdmin,
  type SessionUser,
} from "./auth";

export {
  checkIn,
  checkOut,
  getOnSiteVisitors,
  getVisitorById,
  updateVisitor,
  deleteVisitor,
  getAllEntries,
  getEntriesByCategory,
  getEntriesByDateRange,
  searchEntries,
  getEntryById,
  updateEntry,
  deleteEntry,
  exportToCSV,
  getUsers,
  getUserByUsername,
  createUser,
  updateUserRole,
  deactivateUser,
  reactivateUser,
  getUserCounts,
  type LocalUser,
} from "./queries";
