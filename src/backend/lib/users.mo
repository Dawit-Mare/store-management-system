import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";
import Types "../types/users";

module {
  public type State = {
    userRoles : Map.Map<CommonTypes.UserId, Types.AppRole>;
    userActive : Map.Map<CommonTypes.UserId, Bool>;
  };

  public func initState() : State {
    {
      userRoles = Map.empty<CommonTypes.UserId, Types.AppRole>();
      userActive = Map.empty<CommonTypes.UserId, Bool>();
    };
  };

  public func isSuperAdmin(
    state : State,
    principal : CommonTypes.UserId,
  ) : Bool {
    switch (state.userRoles.get(principal)) {
      case (? #SuperAdmin) { true };
      case _ { false };
    };
  };

  public func isAdminOrAbove(
    state : State,
    principal : CommonTypes.UserId,
  ) : Bool {
    switch (state.userRoles.get(principal)) {
      case (? #SuperAdmin) { true };
      case (? #Admin) { true };
      case _ { false };
    };
  };

  public func getAppRole(
    state : State,
    principal : CommonTypes.UserId,
  ) : ?Types.AppRole {
    state.userRoles.get(principal);
  };

  public func assignRole(
    state : State,
    _accessControlState : AccessControl.AccessControlState,
    caller : CommonTypes.UserId,
    target : CommonTypes.UserId,
    role : Types.AppRole,
  ) : () {
    if (not isSuperAdmin(state, caller)) {
      Runtime.trap("Unauthorized: Only SuperAdmin can assign roles");
    };
    // SuperAdmin role cannot be assigned via this function — it is set at bootstrap
    switch (role) {
      case (#SuperAdmin) { Runtime.trap("Cannot assign SuperAdmin role") };
      case _ {};
    };
    state.userRoles.add(target, role);
    // Ensure user is active when a role is assigned
    state.userActive.add(target, true);
    // Mirror role into AccessControl lib so hasPermission() works
    // Admin and User both map to #user in the auth lib (SuperAdmin maps to #admin)
    // We rely on app-level role checks for finer RBAC, not the lib's role
  };

  public func revokeRole(
    state : State,
    _accessControlState : AccessControl.AccessControlState,
    caller : CommonTypes.UserId,
    target : CommonTypes.UserId,
  ) : () {
    if (not isSuperAdmin(state, caller)) {
      Runtime.trap("Unauthorized: Only SuperAdmin can revoke roles");
    };
    state.userRoles.remove(target);
  };

  public func deactivateUser(
    state : State,
    _accessControlState : AccessControl.AccessControlState,
    caller : CommonTypes.UserId,
    target : CommonTypes.UserId,
  ) : () {
    if (not isAdminOrAbove(state, caller)) {
      Runtime.trap("Unauthorized: Only Admin or SuperAdmin can deactivate users");
    };
    state.userActive.add(target, false);
  };

  public func reactivateUser(
    state : State,
    _accessControlState : AccessControl.AccessControlState,
    caller : CommonTypes.UserId,
    target : CommonTypes.UserId,
  ) : () {
    if (not isSuperAdmin(state, caller)) {
      Runtime.trap("Unauthorized: Only SuperAdmin can reactivate users");
    };
    state.userActive.add(target, true);
  };

  public func listUsers(
    state : State,
    _accessControlState : AccessControl.AccessControlState,
  ) : [Types.UserInfo] {
    state.userRoles.entries()
      .map<(CommonTypes.UserId, Types.AppRole), Types.UserInfo>(
        func((p, role)) {
          let isActive = switch (state.userActive.get(p)) {
            case (?v) v;
            case null true;
          };
          { principal = p; role; isActive };
        }
      ).toArray();
  };
};
