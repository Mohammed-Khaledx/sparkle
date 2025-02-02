const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const {
  createPost,
  getAllPosts,
  sparkPost,
  addComment,
  getPostById,
  getPostCounts,
  getUserPostStats
} = require('../controllers/post_controller');

router.post('/', auth, createPost);
router.get('/', auth, getAllPosts);

// to get a post or view it you might not be sign in
router.get('/:id', auth, getPostById);
router.put('/spark/:id', auth, sparkPost);
router.post('/comment/:id', auth, addComment);

// Add new routes for counts
router.get('/:id/counts', auth, getPostCounts);
// very helpfull route for dashboard
router.get('/user/:userId/stats', auth, getUserPostStats);

module.exports = router;