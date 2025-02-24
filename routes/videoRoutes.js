const express = require("express");
const videoController = require("../controllers/videoController");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// 🔹 Multer Storage Configuration (Videos & Cover Profile)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isImage = file.mimetype.startsWith("image/");
    const dir = isImage ? "public/uploads/covers" : "public/uploads/videos";

    // Ensure directory exists
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

// 🔹 Video Routes
router.get("/all", videoController.getAllCourses); // Fetch all videos
router.get("/upload", videoController.renderUploadPage); // Render upload page
router.post(
  "/upload",
  upload.fields([
    { name: "coverProfile", maxCount: 1 },
    { name: "videos", maxCount: 5 },
  ]),
  videoController.uploadVideos
);
router.get("/watch/:id", videoController.watchVideo); // Watch a video
router.get("/:id", videoController.getVideoById); // Get video by ID
router.post("/edit/:id", videoController.editVideo); // Edit video details
router.post("/delete/:id", videoController.deleteVideo); // Delete video

module.exports = router;
