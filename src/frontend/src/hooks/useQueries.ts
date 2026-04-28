import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useActor } from "./useActor";

// ---------------------------------------------------------------------------
// Role & Auth
// ---------------------------------------------------------------------------

export function useMyRole() {
  const { actor, isFetching } = useActor();
  return useQuery<string | null>({
    queryKey: ["myRole"],
    queryFn: async () => {
      if (!actor) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (actor as any).getMyRole();
      return result ?? null;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLogin() {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).login();
    },
  });
}

export function useCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCallerProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: Record<string, unknown>) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Activity Log
// ---------------------------------------------------------------------------

export function useActivityLog() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["activityLog"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getActivityLog();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 15_000,
  });
}

export function useActivityLogByCategory(category: string) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["activityLog", "category", category],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getActivityLogByCategory(category);
    },
    enabled: !!actor && !isFetching && !!category,
  });
}

export function useActivityLogByDateRange(from: bigint, to: bigint) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["activityLog", "range", String(from), String(to)],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).getActivityLogByDateRange(from, to);
    },
    enabled: !!actor && !isFetching,
  });
}

// ---------------------------------------------------------------------------
// Check In / Out
// ---------------------------------------------------------------------------

export type CheckInData = {
  name: string;
  idNumber: string;
  category:
    | "guest"
    | "employer"
    | "soldier"
    | "temporary_employee"
    | "special_guest";
  gatePoint: string;
  notes?: string;
};

export function useSubmitCheckIn() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CheckInData) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).submitCheckIn(
        data.name,
        data.idNumber,
        data.category,
        data.gatePoint,
        data.notes ?? "",
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
    },
  });
}

export function useSubmitCheckOut() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).submitCheckOut(entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
    },
  });
}

// ---------------------------------------------------------------------------
// Entry Management (edit / delete)
// ---------------------------------------------------------------------------

export function useEditEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      entryId: string;
      updates: Record<string, unknown>;
    }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).editEntry(data.entryId, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
    },
  });
}

export function useDeleteEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entryId: string) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).deleteEntry(entryId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activityLog"] });
    },
  });
}

// ---------------------------------------------------------------------------
// User Management (admin / super-admin)
// ---------------------------------------------------------------------------

export function useListUsers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      if (!actor) return [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).listUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAssignRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { userId: string; role: string }) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).assignRole(data.userId, data.role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useRevokeRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).revokeRole(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeactivateUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).deactivateUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useReactivateUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      if (!actor) throw new Error("Not connected");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (actor as any).reactivateUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
