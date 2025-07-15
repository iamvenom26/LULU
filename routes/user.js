const { Router } = require('express');
const userController = require('../controllers/user');
const { renderWatchHistory}= require('../controllers/videoController');
const multer = require('multer');
const path = require('path');
const router = Router();

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.resolve('./public/uploads/profiles/')); // Changed path for profile photos
    },
    filename: function (req, file, cb) {
        const filename = `${Date.now()}-${file.originalname}`;
        cb(null, filename);
    },
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Not an image! Please upload an image.'), false);
        }
    }
});
router.get('/history', userController.renderWatchHistory);

router.get('/signin', userController.renderSignInPage);
router.post('/signin', userController.handleSignIn);
router.post('/signup', userController.handleSignUp);
router.get('/logout', userController.handleLogout);
router.get('/frontend', userController.renderFrontendPage);
router.get('/backend', userController.renderBackendPage);
router.get('/server', userController.renderServerPage);
router.get('/server', userController.renderAddVideo);

// Add profile photo upload route
router.post('/upload-profile-photo', upload.single('profilePhoto'), userController.handleProfilePhotoUpload);

module.exports = router;
