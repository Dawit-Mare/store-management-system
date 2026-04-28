import Common "common";

module {
  // Extended roles beyond the built-in authorization lib roles
  // We map: superAdmin -> #admin (first user), admin -> #admin, user -> #user
  // App-level role stored separately for granular control
  public type AppRole = {
    #SuperAdmin;
    #Admin;
    #User;
  };

  public type UserInfo = {
    principal : Common.UserId;
    role : AppRole;
    isActive : Bool;
  };
};
