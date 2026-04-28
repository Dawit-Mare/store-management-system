import Map "mo:core/Map";
import Set "mo:core/Set";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  // Old types defined inline (from .old/src/backend/main.mo)
  type OldUserProfile = { name : Text };
  type OldProduct = {
    name : Text;
    sku : Text;
    category : Text;
    price : Nat;
    stock : Nat;
  };
  type OldOrder = {
    productId : Nat;
    quantity : Nat;
    totalPrice : Nat;
    timestamp : Int;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
    products : Map.Map<Nat, OldProduct>;
    categories : Set.Set<Text>;
    orders : Map.Map<Nat, OldOrder>;
    var nextProductId : Nat;
    var nextOrderId : Nat;
  };

  // New actor has no fields from the old actor — all old data is intentionally discarded
  // as this is a full rebuild replacing Store Management with Gate Management.
  type NewActor = {};

  public func run(_old : OldActor) : NewActor {
    {};
  };
};
