import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type AppRole,
  type VisitorCategory,
  checkIn,
  checkOut,
  deactivateUser,
  deleteEntry,
  deleteVisitor,
  getAllEntries,
  getOnSiteVisitors,
  getUsers,
  reactivateUser,
  updateEntry,
  updateUserRole,
} from "../db";
import { useAuth } from "./useAuth";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CheckInData = {
  name: string;
  category: VisitorCategory;
  purpose: string;
  gatePoint: string;
  notes?: string;
};

// ─── Role ─────────────────────────────────────────────────────────────────────

export function useMyRole() {
  const { currentUser } = useAuth();
  return useQuery({
    queryKey: ["myRole", currentUser?.id],
    queryFn: () => currentUser?.role ?? null,
    enabled: true,
  });
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export function useActivityLog() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["activityLog"],
    queryFn: getAllEntries,
    enabled: isAuthenticated,
    refetchInterval: 15_000,
  });
}

export function useOnSiteVisitors() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["onSiteVisitors"],
    queryFn: getOnSiteVisitors,
    enabled: isAuthenticated,
    refetchInterval: 10_000,
  });
}

// ─── Check In / Out ───────────────────────────────────────────────────────────

export function useSubmitCheckIn() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CheckInData) =>
      checkIn({
        name: data.name,
        category: data.category,
        purpose: data.purpose,
        notes: data.notes ?? "",
        createdBy: currentUser?.username ?? "unknown",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
      queryClient.invalidateQueries({ queryKey: ["onSiteVisitors"] });
    },
  });
}

export function useSubmitCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (visitorId: number) => checkOut(visitorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
      queryClient.invalidateQueries({ queryKey: ["onSiteVisitors"] });
    },
  });
}

// ─── Entry management ─────────────────────────────────────────────────────────

export function useEditEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      entryId: number;
      updates: {
        visitorName?: string;
        category?: VisitorCategory;
        notes?: string;
        purpose?: string;
      };
    }) => updateEntry(data.entryId, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
      queryClient.invalidateQueries({ queryKey: ["onSiteVisitors"] });
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: number) => deleteEntry(entryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
    },
  });
}

export function useDeleteVisitor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (visitorId: number) => deleteVisitor(visitorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
      queryClient.invalidateQueries({ queryKey: ["onSiteVisitors"] });
    },
  });
}

// ─── User management ──────────────────────────────────────────────────────────

export function useListUsers() {
  const { currentUser } = useAuth();
  const canAccess =
    currentUser?.role === "SuperAdmin" || currentUser?.role === "Admin";
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled: canAccess,
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { userId: number; role: AppRole }) =>
      updateUserRole(data.userId, data.role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useRevokeRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => updateUserRole(userId, "User"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useReactivateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => reactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
