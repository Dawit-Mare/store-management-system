import Common "common";

module {
  public type VisitorCategory = {
    #Guest;
    #Employer;
    #Soldier;
    #TemporaryEmployee;
    #SpecialGuest;
  };

  public type CheckIn = {
    id : Common.EntryId;
    visitorName : Text;
    category : VisitorCategory;
    checkInTime : Common.Timestamp;
    notes : Text;
    submittedBy : Common.UserId;
    isActive : Bool; // false = soft-deleted (admin only)
  };

  public type CheckOut = {
    checkInId : Common.EntryId;
    checkOutTime : Common.Timestamp;
  };

  // Combined view for activity log display
  public type EntryRecord = {
    checkIn : CheckIn;
    checkOut : ?CheckOut;
  };

  // Input type for creating a check-in
  public type CheckInInput = {
    visitorName : Text;
    category : VisitorCategory;
    notes : Text;
  };
};
