import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";
import UserTypes "../types/users";
import UserLib "../lib/users";

mixin (
  accessControlState : AccessControl.AccessControlState,
  userState : UserLib.State,
) {
  // Bootstrap the caller as SuperAdmin if they are the first admin in AccessControl
  // and have no app-level role yet. Called on login to trigger role reflection.
  func bootstrapSuperAdminIfNeeded(caller : Principal) {
    if (
      AccessControl.isAdmin(accessControlState, caller) and
      UserLib.getAppRole(userState, caller) == null
    ) {
      userState.userRoles.add(caller, #SuperAdmin);
      userState.userActive.add(caller, true);
    };
  };

  // Super Admin only: assign a role to a user
  public shared ({ caller }) func assignRole(
    target : CommonTypes.UserId,
    role : UserTypes.AppRole,
  ) : async () {
    bootstrapSuperAdminIfNeeded(caller);
    UserLib.assignRole(userState, accessControlState, caller, target, role);
    // Mirror into the AccessControl lib so hasPermission() works for the target
    switch (role) {
      case (#Admin) {
        AccessControl.assignRole(accessControlState, caller, target, #admin);
      };
      case (#User) {
        AccessControl.assignRole(accessControlState, caller, target, #user);
      };
      case (#SuperAdmin) {
        Runtime.trap("Cannot assign SuperAdmin role");
      };
    };
  };

  // Super Admin only: revoke a role from a user
  public shared ({ caller }) func revokeRole(
    target : CommonTypes.UserId
  ) : async () {
    bootstrapSuperAdminIfNeeded(caller);
    UserLib.revokeRole(userState, accessControlState, caller, target);
    // Also demote to guest in the AccessControl lib
    AccessControl.assignRole(accessControlState, caller, target, #guest);
  };

  // Super Admin or Admin: deactivate a user account
  public shared ({ caller }) func deactivateUser(
    target : CommonTypes.UserId
  ) : async () {
    bootstrapSuperAdminIfNeeded(caller);
    UserLib.deactivateUser(userState, accessControlState, caller, target);
  };

  // Super Admin only: reactivate a user account
  public shared ({ caller }) func reactivateUser(
    target : CommonTypes.UserId
  ) : async () {
    bootstrapSuperAdminIfNeeded(caller);
    UserLib.reactivateUser(userState, accessControlState, caller, target);
  };

  // Admin+ only: list all users with their roles
  public query ({ caller }) func listUsers() : async [UserTypes.UserInfo] {
    if (not UserLib.isAdminOrAbove(userState, caller)) {
      Runtime.trap("Unauthorized: Only Admin or SuperAdmin can list users");
    };
    UserLib.listUsers(userState, accessControlState);
  };

  // Any logged-in user: get their own role
  // Also triggers SuperAdmin bootstrap for the first authenticated admin.
  public shared ({ caller }) func getMyRole() : async ?UserTypes.AppRole {
    if (caller.isAnonymous()) {
      return null;
    };
    bootstrapSuperAdminIfNeeded(caller);
    UserLib.getAppRole(userState, caller);
  };
};
