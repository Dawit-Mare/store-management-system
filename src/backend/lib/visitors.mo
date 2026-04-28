import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import CommonTypes "../types/common";
import Types "../types/visitors";

module {
  public type State = {
    checkIns : Map.Map<CommonTypes.EntryId, Types.CheckIn>;
    checkOuts : Map.Map<CommonTypes.EntryId, Types.CheckOut>;
    nextEntryId : { var value : Nat };
  };

  public func initState() : State {
    {
      checkIns = Map.empty<CommonTypes.EntryId, Types.CheckIn>();
      checkOuts = Map.empty<CommonTypes.EntryId, Types.CheckOut>();
      nextEntryId = { var value = 0 };
    };
  };

  public func checkIn(
    state : State,
    caller : CommonTypes.UserId,
    input : Types.CheckInInput,
  ) : CommonTypes.EntryId {
    let id = state.nextEntryId.value;
    state.nextEntryId.value += 1;
    let entry : Types.CheckIn = {
      id;
      visitorName = input.visitorName;
      category = input.category;
      notes = input.notes;
      checkInTime = Time.now();
      submittedBy = caller;
      isActive = true;
    };
    state.checkIns.add(id, entry);
    id;
  };

  public func checkOut(
    state : State,
    checkInId : CommonTypes.EntryId,
  ) : () {
    switch (state.checkIns.get(checkInId)) {
      case null { Runtime.trap("Check-in entry not found") };
      case (?_) {
        let co : Types.CheckOut = {
          checkInId;
          checkOutTime = Time.now();
        };
        state.checkOuts.add(checkInId, co);
      };
    };
  };

  func toEntryRecord(state : State, ci : Types.CheckIn) : Types.EntryRecord {
    {
      checkIn = ci;
      checkOut = state.checkOuts.get(ci.id);
    };
  };

  public func getAllEntries(state : State) : [Types.EntryRecord] {
    state.checkIns.values()
      .filter(func(ci : Types.CheckIn) : Bool { ci.isActive })
      .map<Types.CheckIn, Types.EntryRecord>(func(ci) { toEntryRecord(state, ci) })
      .toArray();
  };

  public func getEntriesByCategory(
    state : State,
    category : Types.VisitorCategory,
  ) : [Types.EntryRecord] {
    state.checkIns.values()
      .filter(func(ci : Types.CheckIn) : Bool {
        ci.isActive and ci.category == category
      })
      .map<Types.CheckIn, Types.EntryRecord>(func(ci) { toEntryRecord(state, ci) })
      .toArray();
  };

  public func getEntriesByDateRange(
    state : State,
    from : CommonTypes.Timestamp,
    to : CommonTypes.Timestamp,
  ) : [Types.EntryRecord] {
    state.checkIns.values()
      .filter(func(ci : Types.CheckIn) : Bool {
        ci.isActive and ci.checkInTime >= from and ci.checkInTime <= to
      })
      .map<Types.CheckIn, Types.EntryRecord>(func(ci) { toEntryRecord(state, ci) })
      .toArray();
  };

  public func softDeleteEntry(
    state : State,
    entryId : CommonTypes.EntryId,
  ) : () {
    switch (state.checkIns.get(entryId)) {
      case null { Runtime.trap("Check-in entry not found") };
      case (?ci) {
        state.checkIns.add(entryId, { ci with isActive = false });
      };
    };
  };

  public func editEntry(
    state : State,
    entryId : CommonTypes.EntryId,
    input : Types.CheckInInput,
  ) : () {
    switch (state.checkIns.get(entryId)) {
      case null { Runtime.trap("Check-in entry not found") };
      case (?ci) {
        state.checkIns.add(entryId, {
          ci with
          visitorName = input.visitorName;
          category = input.category;
          notes = input.notes;
        });
      };
    };
  };
};
