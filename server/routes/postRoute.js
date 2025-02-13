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
  getPostComments,
  getUserPosts,
  generatePostContent,
  addAdvice,
  getAdvices,
} = require("../controllers/post_controller");

//get the home page posts
router.get("/feed", auth, getFeedPosts);

router.post("/", auth, postUpload.array("images", 5), createPost);
router.get("/", auth, getAllPosts);

// AI generating
router.get("/generate", auth, generatePostContent);
router.post("/:id/advice", auth, addAdvice);
router.get('/:id/advices', auth, getAdvices);
router.get("/:id", auth, getPostById);
router.put("/spark/:id", auth, sparkPost);
router.post("/comment/:id", auth, addComment);
router.get("/:id/comments", auth, getPostComments);
// Add new routes for counts
router.get("/:id/counts", auth, getPostCounts);
// very helpfull route for dashboard
router.get("/user/:userId/stats", auth, getUserPostStats);

router.get("/user/:userId", auth, getUserPosts);

module.exports = router;
