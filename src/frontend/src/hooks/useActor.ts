import { useActor as _useActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";

/**
 * Returns { actor, isFetching } for the gate-management backend canister.
 * Actor is null while the identity / config is still loading.
 */
export function useActor() {
  return _useActor((canisterId, uploadFile, downloadFile, options) =>
    createActor(canisterId, uploadFile, downloadFile, options),
  );
}
