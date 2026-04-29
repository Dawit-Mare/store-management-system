// Replaces IC canister actor — exports the Dexie db instance
export { db } from "../db/database";

// Stub hook for backwards compatibility — not needed with local storage
export function useActor() {
  return { actor: null, isFetching: false };
}
