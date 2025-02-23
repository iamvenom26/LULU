const express = require("express");
const videoController = require("../controllers/videoController");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// 🔹 Ensure Upload Directories Exist
const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// 🔹 Multer Storage Configuration (Videos & Cover Profile)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const dir = isImage ? "public/uploads/covers" : "public/uploads/videos";
    ensureDirExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// 🔹 Multer Upload Configuration (File Type & Limits)
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedVideos = [".mp4", ".mkv", ".avi"];
      
      if (file.mimetype.startsWith("image/")) {
        return cb(null, true); // Allow images (cover profile)
      }
  
      if (!allowedVideos.includes(ext)) {
        return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only MP4, MKV, and AVI videos are allowed!"));
      }
  
      cb(null, true);
    },
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  });
  
// 🔹 Video Routes
router.get("/all", videoController.getAllCourses); // Fetch all videos
router.get("/upload", videoController.renderUploadPage); // Render upload page

// Upload Route (Handles Cover Image & Videos)
router.post(
  "/upload",
  upload.fields([
    { name: "coverProfile", maxCount: 1 },
    { name: "videos", maxCount: 5 },
  ]),
  (req, res, next) => {
    if (!req.files || (!req.files.coverProfile && !req.files.videos)) {
      return res.status(400).send("Please upload at least one file!");
    }
    next();
  },
  videoController.uploadVideos
);

router.get("/watch/:id", videoController.watchVideo); // Watch a video
router.get("/:id", videoController.getVideoById); // Get video by ID
router.post("/edit/:id", videoController.editVideo); // Edit video details
router.post("/delete/:id", videoController.deleteVideo); // Delete video

module.exports = router;
