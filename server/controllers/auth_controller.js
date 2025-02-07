const User = require("../models/user_model");
const jwt = require("jsonwebtoken");
console.log('Secret Key:', process.env.JWT_SECRET); // Ensure it is not undefined
// Generate JWT Token
const generateToken = (userId ,isAdmin) => {
  try {
    
    return jwt.sign({ userId , isAdmin}, process.env.JWT_SECRET, {
      expiresIn: "30d",// 30 daysfor testing purpose
    });
  } catch (error) {
    console.error('Token generation error:', error);

    throw new Error('Token generation failed');

  }
};

// Register User
exports.register = async (req, res) => {
  try {
    const { name, email, password ,isAdmin} = req.body;

    // Check if user already exists
    let existingUser = await User.findOne({
      $or: [{ email }, { name }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email or username",
      });
    }

    // Create new user
    const user = new User({
      profilePicture: { url: "" },
      name,
      email,
      password,
      isAdmin,
    });

    // saving the path of the image file
    if (req.file) {
      user.profilePicture = { url: req.file.path }; // Store the file path
      console.log('File path:', req.file.path);
    }

    await user.save();



    // Generate token
    const token = generateToken(user._id , user.isAdmin);

    res.status(201).json({
      message: "User registered successfully",
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error registering user",
      error: error.message,
    });
  }
};



// Login User
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate token
    const token = generateToken(user._id , user.isAdmin);

    res.json({
      message: "Login successful",
      user,
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error logging in",
      error: error.message,
    });
  }
};


// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
      // extract id from te auth middelware which mean token
      const user = await User.findById(req.user.userId).select('-password');
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      res.json(user);
  } catch (error) {
      res.status(500).json({ message: 'Error getting user', error: error.message });
  }
};
