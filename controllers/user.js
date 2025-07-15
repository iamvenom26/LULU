const User = require('../model/user');
const Course = require("../model/courses");
exports.renderSignInPage = (req, res) => {
  res.render('login');
};
////////////////////////////////////
exports.renderWatchHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('watchHistory.video').exec();
    const watchHistory = Array.isArray(user.watchHistory) ? user.watchHistory : [];
    res.render("history", { watchHistory, user });
  } catch (error) {
    console.error("Error fetching watch history:", error);
    res.status(500).send("Internal Server Error");
  }
};


//////////////////////////////////////////////
exports.handleSignIn = async (req, res) => {
  const { email, password } = req.body;
  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);
    
    res.cookie('token', token).redirect('/');
  } catch (error) {
    res.render('login', { error: 'Incorrect Email or Password' });
  }
};

exports.handleSignUp = async (req, res) => {
  const { FullName, email, password } = req.body;
  try {
    await User.create({ FullName, email, password });
    res.redirect('/user/signin');
  } catch (error) {
    res.render('login', { error: 'User registration failed. Try again!' });
  }
};

exports.handleLogout = (req, res) => {
  res.clearCookie('token').redirect('/');
};


exports.renderFrontendPage = async (req, res) => {
  try {
      const courses = await Course.find().populate("videos"); // Fetch courses with videos
      res.render("frontend", { courses }); // Pass courses to EJS template
  } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).send("Internal Server Error");
  }
};


exports.renderBackendPage = async(req, res) => {
  try {
    const courses = await Course.find().populate("videos"); // Fetch courses with videos
    res.render("backend", { courses }); // Pass courses to EJS template
} catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).send("Internal Server Error");
}
};

exports.renderServerPage = async(req, res) => {
  try {
    const courses = await Course.find().populate("videos"); // Fetch courses with videos
    res.render("server", { courses }); // Pass courses to EJS template
} catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).send("Internal Server Error");
}
};

exports.renderAddVideo = (req, res) => {
  res.render('server', { user: req.user });
};

exports.handleProfilePhotoUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the relative path for storing in database
    const profileImagePath = `/uploads/profiles/${req.file.filename}`;
    
    // Update user's profile image in database
    await User.findByIdAndUpdate(req.user._id, {
      profileImage: profileImagePath
    });

    res.json({ 
      success: true, 
      message: 'Profile photo updated successfully',
      imageUrl: profileImagePath 
    });
  } catch (error) {
    console.error('Profile photo upload error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile photo' 
    });
  }
};
