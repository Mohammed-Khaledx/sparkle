// here i should get a node table from the model and the model should requre the mongoose
// so i could use mongo function while get and post

// const mongoose = require("mongoose");

const User = require("../models/user_model");
const Follow = require("../models/follow_model");


// CREATE
let createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    const newUser = user.save(user);
    res.status(201).json(newUser);
    console.log("user created OK!");
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// READ
let getAllUsers = async (req, res) => {
  console.log("get Notes by controller throw routes finally in indexjs");
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// not needed
// let getUserByName = async (req, res) => {
//   try {
//     let name = req.params.name;
//     const wantedUser = await User.findOne({ name: req.params.name });
//     if (!wantedUser) {
//       return res.status(404).json({
//         status: "error",
//         message: "User not found",
//       });
//     }
//     res.status(200).json(wantedUser);
//   } catch (error) {
//     res.status(500).json(error.message);
//   }
// };

let getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Fetch follow data and return the count of follwers and following
    const followersCount = await Follow.countDocuments({ following: id });
    const followingCount = await Follow.countDocuments({ follower: id });


    res.status(200).json({
      user,
      followersCount,
      followingCount,
    });
  } catch (error) {
    res.status(500).json(error.message);
  }
};

// UPDATE
let updateUser = async (req, res) => {
  // req has the data of the logged in user from auth middelware

  const { userId } = req.user; // Extract user ID from auth middleware
  if (req.params.id !== userId) {
    return res
      .status(403)
      .json({ message: "You can only update your own profile" });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, // Allow updating multiple fields
      { new: true }
    ).select("-password");
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE
let deleteUser = async (req, res) => {
  try {
    const isDeleted = await User.findByIdAndDelete(req.params.id);
    if (!isDeleted) {
      return res.status(404).json("user not found");
    }
    res.json({ message: "user deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
