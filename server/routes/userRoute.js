const express = require("express");
const user_route = express.Router();

// import the function from the controller
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  upload,
  updateProfilePicture,
  deleteUser,
} = require("../controllers/user_controle");
const {
  register,
  login,
  getCurrentUser,
  getLoggedUserFollowing,
} = require("../controllers/auth_controller");
const auth = require("../middlewares/auth");
const authAdmin = require("../middlewares/authAdmin");

// just the admin role can access
user_route.get("/", auth, getAllUsers);
user_route.delete("/:id", auth, authAdmin, deleteUser);

// access my profile
user_route.get("/me", auth, getCurrentUser);
user_route.get("/following", auth, getLoggedUserFollowing);

// this can be accessed with out auth
user_route.get("/:id", getUserById);

// this should be protected by auth
user_route.patch("/:id", auth, updateUser);

user_route.post("/register", upload.single("profilePicture"), register);
user_route.post("/login", login);

// profile picture upload
// router.post("/", upload.single("profilePicture"), createUser); // POST for user creation
user_route.put(
  "/profile/picture",
  auth,
  upload.single("profilePicture"),
  updateProfilePicture
); // PUT for update

// testing upload
user_route.post("/upload", upload.single("profilePicture"), (req, res) => {
  console.log("File:", req.file);
  console.log("Body:", req.body);
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  res.json({ file: req.file });
});

module.exports = user_route;
