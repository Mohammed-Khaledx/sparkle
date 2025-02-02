const Follow = require("../models/follow_model");
const User = require("../models/user_model");
const Notification = require("../models/notification_model");

const { io } = require("../index"); // Import the io instance
const { emitToUser } = require("../socket/socket");

// const server = http.createServer(app); // Attach HTTP server

// const io = socketIo(server)

exports.followUser = async (req, res) => {
  try {
    const { id: followId } = req.params; // User to follow
    const userId = req.user.userId; // Current logged-in user

    if (userId === followId) {
      return res.status(400).json({ message: "You cannot follow yourself." });
    }

    // Check if already followed
    const existingFollow = await Follow.findOne({
      follower: userId,
      following: followId,
    });
    if (existingFollow) {
      return res.status(400).json({ message: "You already follow this user." });
    }

    // Create follow relationship
    await Follow.create({ follower: userId, following: followId });

    const user = await User.findById(userId);

    // Create a notification
    await Notification.create({
      recipient: followId,
      sender: userId,
      type: "follow",
      message: "started following you.",
      target: null,
      targetModel: null,
    });

    // Send notification in real-time if recipient is online
    // As active users is {userid : user-socketid} and carry all currently connected

    emitToUser(
      followId,
      "notification",
      user.name + " started following you",
      io
    );

    res.status(200).json({ message: "Followed successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const { id: unfollowId } = req.params; // User to unfollow
    const userId = req.user.userId; // Current logged-in user

    if (userId === unfollowId) {
      return res.status(400).json({ message: "You cannot unfollow yourself." });
    }

    // Check if relationship exists
    const existingFollow = await Follow.findOne({
      follower: userId,
      following: unfollowId,
    });
    if (!existingFollow) {
      return res.status(400).json({ message: "You do not follow this user." });
    }

    // Remove follow relationship
    await Follow.deleteOne({ follower: userId, following: unfollowId });
    res.status(200).json({ message: "Unfollowed successfully." });
  } catch (error) {
    res.status(500).json({ message: "Server error." });
  }
};

exports.getFollowersOrFollowing = async (req, res) => {
  try {
    const { id: userId } = req.params; // User ID to query
    const { type } = req.query; // 'followers' or 'following'

    let relationships;
    if (type === "followers") {
      relationships = await Follow.find({ following: userId }).populate(
        "follower",
        "name email"
      );
    } else if (type === "following") {
      relationships = await Follow.find({ follower: userId }).populate(
        "following",
        "name email"
      );
    } else {
      return res.status(400).json({ message: "Invalid type parameter." });
    }

    res.status(200).json({ data: relationships });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getFollowStatus = async (req, res) => {
  try {
    const { id } = req.params; // Target user
    const currentUserId = req.user.id; // From the auth middleware

    const isFollowing = await Follow.exists({
      follower: currentUserId,
      following: id,
    });

    res.status(200).json({ isFollowing: !!isFollowing });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
