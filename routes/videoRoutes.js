const express = require("express");
const videoController = require("../controllers/videoController");

const multer = require("multer");
const fs = require("fs");
const path = require("path");

const { isAdmin } = require("../middleware/auth"); // Middleware for admin access
const router = express.Router();

// 🔹 Multer Storage Configuration (Videos & Cover Profile)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dir = "";
    if (file.fieldname.startsWith("videoCover-")) {
      // Save video covers in their own folder
      dir = "public/uploads/videoCovers";
    } else if (file.mimetype.startsWith("image/")) {
      // Otherwise, use this folder for other images (e.g., course covers)
      dir = "public/uploads/covers";
    } else {
      // And for videos
      dir = "public/uploads/videos";
    }
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});


// 🔹 Multer Upload Configuration (File Type & Limits)
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();

    if (file.mimetype.startsWith("image/")) {
      return cb(null, true); // Allow images (cover profile)
    }

    if (![".mp4", ".mkv", ".avi"].includes(ext)) {
      return cb(new Error("Only MP4, MKV, and AVI videos are allowed!"));
    }
    cb(null, true);
  },
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
});

// 🔹 Route Definitions

// Get all courses (Admin only)
router.get("/all", isAdmin, videoController.getAllCourses);

// Upload Page
router.get("/upload", isAdmin, videoController.renderUploadPage);

// Upload Videos & Create Course
router.post(
  "/upload",
  isAdmin,
  upload.fields([
    { name: "coverProfile", maxCount: 1 },
    { name: "videos", maxCount: 5 },
  ]),
  videoController.uploadVideos
);
router.post(
  "/edit/:id/add-videos",
  isAdmin,upload.fields([
    { name: "videos", maxCount: 5 },]),
  videoController.addVideos
);
// Watch a Video
router.get("/watch/:id", videoController.watchVideo);

// Get Course Details
router.get("/:id", videoController.getVideoById);
//
// Edit Course Page
router.get("/edit/:id", isAdmin, videoController.renderEditPage);

// Edit Course Details
router.post(
  "/edit/:id",
  isAdmin,
  upload.any(), // Allows all file fields
  videoController.editCourse
);

// 🔹 Missing Routes Added
router.post(
  "/edit/:id/update-video/:videoId",
  isAdmin,

    upload.any(), 
  // Process all file fields (this will handle dynamic fields like "videoCover-<videoId>")
  videoController.updateVideoDetails
);
// Add Videos to Existing Course


// Delete a Single Video from Course
router.post("/edit/:id/delete-video/:videoId", isAdmin, videoController.deleteVideo);

// Delete Entire Course
router.post("/delete/:id", isAdmin, videoController.deleteCourse);

module.exports = router;
