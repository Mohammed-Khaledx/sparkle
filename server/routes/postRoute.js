const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const {
  postUpload,
  createPost,
  getAllPosts,
  getFeedPosts, // Add this
  sparkPost,
  addComment,
  getPostById,
  getPostCounts,
  getUserPostStats,
} = require("../controllers/post_controller");

//get the home page posts 
router.get("/feed", auth, getFeedPosts);

router.post("/", auth, postUpload.array("images", 5), createPost);
router.get("/", auth, getAllPosts);

// to get a post or view it you might not be sign in
router.get("/:id", auth, getPostById);
router.put("/spark/:id", auth, sparkPost);
router.post("/comment/:id", auth, addComment);

// Add new routes for counts
router.get("/:id/counts", auth, getPostCounts);
// very helpfull route for dashboard
router.get("/user/:userId/stats", auth, getUserPostStats);

module.exports = router;
