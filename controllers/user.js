const User = require('../model/user');

exports.renderSignInPage = (req, res) => {
  res.render('login');
};

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

exports.renderFrontendPage = (req, res) => {
  res.render('frontend', { user: req.user });
};

exports.renderBackendPage = (req, res) => {
  res.render('backend', { user: req.user });
};

exports.renderServerPage = (req, res) => {
  res.render('server', { user: req.user });
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