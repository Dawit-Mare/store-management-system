import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import AccessControl "mo:caffeineai-authorization/access-control";
import CommonTypes "../types/common";
import VisitorTypes "../types/visitors";
import UserLib "../lib/users";
import VisitorLib "../lib/visitors";

mixin (
  accessControlState : AccessControl.AccessControlState,
  visitorState : VisitorLib.State,
  userState : UserLib.State,
) {
  // Any logged-in user can submit a check-in
  public shared ({ caller }) func submitCheckIn(
    input : VisitorTypes.CheckInInput
  ) : async CommonTypes.EntryId {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can submit check-ins");
    };
    VisitorLib.checkIn(visitorState, caller, input);
  };

  // Any logged-in user can submit a check-out
  public shared ({ caller }) func submitCheckOut(
    checkInId : CommonTypes.EntryId
  ) : async () {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only registered users can submit check-outs");
    };
    VisitorLib.checkOut(visitorState, checkInId);
  };

  // All users (including logged-in) can view the full activity log
  public query ({ caller }) func getActivityLog() : async [VisitorTypes.EntryRecord] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    VisitorLib.getAllEntries(visitorState);
  };

  // Filter by visitor category
  public query ({ caller }) func getActivityLogByCategory(
    category : VisitorTypes.VisitorCategory
  ) : async [VisitorTypes.EntryRecord] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    VisitorLib.getEntriesByCategory(visitorState, category);
  };

  // Filter by date range
  public query ({ caller }) func getActivityLogByDateRange(
    from : CommonTypes.Timestamp,
    to : CommonTypes.Timestamp,
  ) : async [VisitorTypes.EntryRecord] {
    if (caller.isAnonymous()) {
      Runtime.trap("Unauthorized: Must be logged in");
    };
    VisitorLib.getEntriesByDateRange(visitorState, from, to);
  };

  // Admin+ only: edit an entry
  public shared ({ caller }) func editEntry(
    entryId : CommonTypes.EntryId,
    input : VisitorTypes.CheckInInput,
  ) : async () {
    if (not UserLib.isAdminOrAbove(userState, caller)) {
      Runtime.trap("Unauthorized: Only Admin or SuperAdmin can edit entries");
    };
    VisitorLib.editEntry(visitorState, entryId, input);
  };

  // Admin+ only: delete (soft) an entry
  public shared ({ caller }) func deleteEntry(
    entryId : CommonTypes.EntryId
  ) : async () {
    if (not UserLib.isAdminOrAbove(userState, caller)) {
      Runtime.trap("Unauthorized: Only Admin or SuperAdmin can delete entries");
    };
    VisitorLib.softDeleteEntry(visitorState, entryId);
  };
};
