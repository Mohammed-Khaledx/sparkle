const app = require('express')
const followRoute = app.Router();
const auth = require("../middlewares/auth");

const { followUser, unfollowUser, getFollowersOrFollowing ,getFollowStatus } = require("../controllers/follow_controller");


followRoute.post("/:id/follow", auth, followUser); // Follow a user
followRoute.post("/:id/unfollow", auth, unfollowUser); // Unfollow a user
followRoute.get("/:id", auth, getFollowersOrFollowing); // Get followers/following (query param `type`)
followRoute.get("/:id/status", auth, getFollowStatus); // Check follow status

module.exports = followRoute