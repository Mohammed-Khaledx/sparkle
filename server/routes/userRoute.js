const express = require("express");
const user_route = express.Router();

// import the function from the controller
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require("../controllers/user_controle");
const { register, login , getCurrentUser } = require("../controllers/auth_controller");
const auth = require("../middlewares/auth")
const authAdmin = require("../middlewares/authAdmin")

// just the admin role can access
user_route.get("/",auth, authAdmin, getAllUsers);
user_route.delete("/:id",auth, authAdmin, deleteUser);




// access my profile
user_route.get("/me" ,auth, getCurrentUser)


// this can be accessed with out auth 
user_route.get("/:id" , getUserById)



// this should be protected by auth
user_route.patch("/:id", auth ,updateUser);




user_route.post("/register", register);
user_route.post("/login", login);


module.exports = user_route;
