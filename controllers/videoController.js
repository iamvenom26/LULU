const Course = require("../model/courses");
const Video = require("../model/video");
const path = require("path");
const fs = require("fs");

// 🔹 Get a single video by ID
exports.getVideoById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("videos");
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.render("courseDetail", { course });
  } catch (error) {
    console.error("Error fetching course details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🔹 Render upload page
exports.renderUploadPage = (req, res) => {
  res.render("upload");
};

// 🔹 Watch a video (Stream Video)
exports.watchVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = await Video.findById(videoId);

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    const videoPath = path.join(
      __dirname,
      "..",
      "public",
      "uploads",
      "videos",
      path.basename(video.videoUrl)
    );

    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: "Video file not found" });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (!range) {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "video/mp4",
      });
      return fs.createReadStream(videoPath).pipe(res);
    }

    const CHUNK_SIZE = 10 ** 6; // 1MB per chunk
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, fileSize - 1);
    const contentLength = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
    });

    fs.createReadStream(videoPath, { start, end }).pipe(res);
  } catch (error) {
    console.error("Error streaming video:", error);
    res.status(500).json({ error: "Error watching video" });
  }
};

// 🔹 Upload multiple videos & Create Course
exports.uploadVideos = async (req, res) => {
  try {
    const { title, authorName, price, description, category } = req.body;

    if (!title || !authorName || !price || !description || !category) {
      return res.status(400).json({ error: "All fields are required." });
    }

    if (!["Frontend", "Backend", "Server Management"].includes(category)) {
      return res.status(400).json({ error: "Invalid category." });
    }

    if (!req.files || (!req.files.videos && !req.files.coverProfile)) {
      return res.status(400).json({ error: "No files uploaded." });
    }

    let coverProfilePath = "";
    if (req.files.coverProfile) {
      coverProfilePath = "/uploads/covers/" + req.files.coverProfile[0].filename;
    }

    const videoDocs = [];
    if (req.files.videos) {
      for (const file of req.files.videos) {
        const video = new Video({ title, videoUrl: "/uploads/videos/" + file.filename });
        await video.save();
        videoDocs.push(video._id);
      }
    }

    const newCourse = new Course({
      title,
      authorName,
      price,
      description,
      category,
      coverProfile: coverProfilePath,
      videos: videoDocs,
    });

    await newCourse.save();
    res.status(201).json({ message: "Course created successfully", course: newCourse });
  } catch (error) {
    console.error("Error uploading videos:", error);
    res.status(500).json({ error: "Error uploading videos" });
  }
};

// 🔹 Render Edit Page
exports.renderEditPage = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.render("editCourse", { course });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// 🔹 Edit Course Details
exports.editCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { title, authorName, price, description, category } = req.body;

    const course = await Course.findByIdAndUpdate(courseId, { title, authorName, price, description, category }, { new: true });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.status(200).json({ message: "Course updated successfully", course });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ error: "Error updating course" });
  }
};

// 🔹 Delete Course & Videos
exports.deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId).populate("videos");

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    for (const video of course.videos) {
      const videoPath = path.join(__dirname, "..", "public", "uploads", "videos", path.basename(video.videoUrl));

      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }

      await Video.findByIdAndDelete(video._id);
    }

    await Course.findByIdAndDelete(courseId);
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: "Error deleting course" });
  }
};
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.render("courseList", { courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).send("Internal Server Error");
  }
};
