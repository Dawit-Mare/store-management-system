import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import VisitorLib "lib/visitors";
import UserLib "lib/users";
import VisitorsMixin "mixins/visitors-api";
import UsersMixin "mixins/users-api";



actor {
  // Authorization state (built-in auth extension)
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Visitor check-in/check-out state
  let visitorState = VisitorLib.initState();

  // User role management state
  let userState = UserLib.initState();

  // Include domain mixins
  include VisitorsMixin(accessControlState, visitorState, userState);
  include UsersMixin(accessControlState, userState);
};
