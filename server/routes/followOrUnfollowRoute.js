const express = require('express');  // Changed from 'const app = require('express')'
const followRoute = express.Router(); // Changed from 'app.Router()'
const auth = require("../middlewares/auth");

const { 
  followUser, 
  unfollowUser, 
  getFollowersOrFollowing,
  getFollowStatus 
} = require("../controllers/follow_controller");

// Routes
followRoute.post("/:id/follow", auth, followUser);
followRoute.post("/:id/unfollow", auth, unfollowUser);
followRoute.get("/:id", auth, getFollowersOrFollowing);
followRoute.get("/:id/status", auth, getFollowStatus);

module.exports = followRoute;