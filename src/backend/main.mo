import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Types
  public type Product = {
    name : Text;
    sku : Text;
    category : Text;
    price : Nat;
    stock : Nat;
  };

  public type Order = {
    productId : Nat;
    quantity : Nat;
    totalPrice : Nat;
    timestamp : Time.Time;
  };

  var nextProductId = 0;
  var nextOrderId = 0;

  // Data stores
  let products = Map.empty<Nat, Product>();
  let categories = Set.empty<Text>();
  let orders = Map.empty<Nat, Order>();

  // Products - Staff only for write operations
  public shared ({ caller }) func addProduct(name : Text, sku : Text, category : Text, price : Nat, stock : Nat) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only staff can add products");
    };

    let product : Product = {
      name;
      sku;
      category;
      price;
      stock;
    };

    products.add(nextProductId, product);
    categories.add(category);
    nextProductId += 1;
    nextProductId - 1;
  };

  // Public read access - no authorization needed
  public query func getProduct(id : Nat) : async Product {
    switch (products.get(id)) {
      case (?product) { product };
      case (null) { Runtime.trap("Product not found") };
    };
  };

  // Public read access - no authorization needed
  public query func getAllProducts() : async [Product] {
    products.values().toArray();
  };

  // Orders - Staff only for write operations
  public shared ({ caller }) func createOrder(productId : Nat, quantity : Nat) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only staff can create orders");
    };

    let product = switch (products.get(productId)) {
      case (?p) { p };
      case (null) { Runtime.trap("Product not found") };
    };

    if (product.stock < quantity) {
      Runtime.trap("Insufficient stock");
    };

    products.add(
      productId,
      {
        product with
        stock = product.stock - quantity
      },
    );

    let order : Order = {
      productId;
      quantity;
      totalPrice = product.price * quantity;
      timestamp = Time.now();
    };

    orders.add(nextOrderId, order);
    nextOrderId += 1;
    nextOrderId - 1;
  };

  // Public read access - no authorization needed
  public query func getOrder(id : Nat) : async Order {
    switch (orders.get(id)) {
      case (?order) { order };
      case (null) { Runtime.trap("Order not found") };
    };
  };

  // Public read access - no authorization needed
  public query func getAllOrders() : async [Order] {
    orders.values().toArray();
  };

  // Public read access - no authorization needed
  public query func getCategories() : async [Text] {
    categories.toArray();
  };

  // Public read access - no authorization needed
  public query func getProductsByCategory(category : Text) : async [Product] {
    products.values().toArray().filter(func(p) { p.category == category });
  };
};
