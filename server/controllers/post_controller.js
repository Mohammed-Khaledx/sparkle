const Post = require("../models/post_model");
const User = require("../models/user_model");
const Notification = require("../models/notification_model");
const Follow = require("../models/follow_model")
const mongoose = require("mongoose");

const { io } = require("../index"); // Import the io instance
const { emitToUser } = require("../socket/socket");

const multer = require("multer");
const path = require("path");

// Configure multer for post images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/posts");
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "post-" + uniqueSuffix + path.extname(file.originalname));
  },
});
// multer uploading middleware
exports.postUpload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image")) {
      cb(null, true);
    } else {
      cb(new Error("Please upload only images."), false);
    }
  },
});

// Create a new post
exports.createPost = async (req, res) => {
  try {
    const { content } = req.body;
    const images = req.files ? req.files.map((file) => file.path) : [];

    const newPost = new Post({
      content,
      author: req.user.userId,
      images: images,
    });

    const post = await newPost.save();

    // Populate author details
    await post.populate("author", "name profilePicture");

    res.status(201).json(post);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error creating post", error: error.message });
  }
};

// Get all posts with pagination
exports.getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .select(
        "content author sparks comments createdAt sparkCount commentCount images"
      )
      .sort({ createdAt: -1 })
      .populate("author", "name profilePicture")
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching posts", error: error.message });
  }
};

// Spark (React) to a post
exports.sparkPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const isSparked = post.sparks.includes(userId);
    const updateOperation = isSparked
      ? {
          $pull: { sparks: userId },
          $inc: { sparkCount: -1 },
        }
      : {
          $addToSet: { sparks: userId },
          $inc: { sparkCount: 1 },
        };

    const updatedPost = await Post.findByIdAndUpdate(postId, updateOperation, {
      new: true,
    }).populate("sparks", "name profilePicture");

    // Handle notifications
    if (!isSparked) {
      const { name } = await User.findById(userId);
      emitToUser(
        post.author.toJSON(),
        "notification",
        name + " sparked your post",
        io
      );
    }

    // Create notification
    await Notification.create({
      recipient: post.author,
      sender: userId,
      type: isSparked ? "spark" : "spark",
      message: isSparked ? "unSparked successfully" : "Sparked successfully",
      target: postId,
      targetModel: "Post",
    });

    res.json({
      message: isSparked ? "unSparked successfully" : "Sparked successfully",
      sparkCount: updatedPost.sparkCount,
      sparks: updatedPost.sparks,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error updating spark", error: error.message });
  }
};

// Add a comment
exports.addComment = async (req, res) => {
  try {
    const { content } = req.body;
    const userId = req.user.userId;

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            user: userId,
            content,
            createdAt: new Date(),
          },
        },
        $inc: { commentCount: 1 },
      },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Create notification
    await Notification.create({
      recipient: updatedPost.author,
      sender: userId,
      type: "comment",
      message: "commented on your post",
      target: updatedPost._id,
      targetModel: "Post",
    });

    const { name } = await User.findById(userId);
    emitToUser(
      updatedPost.author.toJSON(),
      "notification",
      name + " commented on your post",
      io
    );

    res.json({
      message: "Comment added successfully",
      commentCount: updatedPost.commentCount,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error adding comment", error: error.message });
  }
};

// Get single post with full details
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "name profilePicture")
      .populate("sparks", "name profilePicture")
      .populate({
        path: "comments.user",
        select: "name profilePicture",
      });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json(post);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching post", error: error.message });
  }
};

// New function to get post counts
exports.getPostCounts = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).select(
      "sparkCount commentCount"
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.json({
      sparkCount: post.sparkCount,
      commentCount: post.commentCount,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching counts", error: error.message });
  }
};

// New function to get user post statistics
exports.getUserPostStats = async (req, res) => {
  try {
    const userId = req.params.userId;
    const stats = await Post.aggregate([
      {
        $match: {
          // Filter by author
          author: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          // Group by author
          _id: "$author", // Group by author instead of null
          totalPosts: { $sum: 1 }, // Count the number of posts
          totalSparks: { $sum: "$sparkCount" },
          totalComments: { $sum: "$commentCount" },
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id from result
          userId: "$_id", // Rename _id to userId
          totalPosts: 1,
          totalSparks: 1,
          totalComments: 1,
        },
      },
    ]);

    res.json(
      stats[0] || {
        userId: userId,
        totalPosts: 0,
        totalSparks: 0,
        totalComments: 0,
      }
    );
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching stats", error: error.message });
  }
};




exports.getFeedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit; // Skips previous pages

    // Get the list of followed user IDs
    
    const followedUsers = await Follow.find({ follower: req.user.userId }).select('following'); 
    const followedIds = followedUsers.map(f => f.following); 

    // Fetch posts from followed users with pagination
    const posts = await Post.find({ author: { $in: followedIds } }) 
      .sort({ createdAt: -1 })  // Newest posts first
      .skip(skip) 
      .limit(limit)  
      .populate('author', 'name profilePicture') // Include user details
      .populate({
        path: 'comments.user',
        select: 'name profilePicture'
      })

    return res.status(200).json({ success: true, posts });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
