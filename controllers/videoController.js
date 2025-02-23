const Course = require("../model/courses");
const Video = require("../model/video"); // Ensure Video model is imported
const path = require("path");
const fs = require("fs");

// 🔹 Get all Courses (with Videos)
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("videos");

    res.render("frontend", { courses: courses || [] }); // Ensure no null errors
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).send("Error fetching courses");
  }
};

// 🔹 Get a single video by ID
exports.getVideoById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("videos");
    if (!course) {
        return res.status(404).send("Course not found");
    }
    res.render("courseDetail", { course });
} catch (error) {
    console.error("Error fetching course details:", error);
    res.status(500).send("Internal Server Error");
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
      return res.status(404).send("Video not found");
    }

    // Construct full video file path
    const videoPath = path.join(__dirname, "..", "public", "uploads", "videos", path.basename(video.videoUrl));
    console.log("Trying to access video file at:", videoPath);

    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).send("Video file not found");
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (!range) {
      return res.status(400).send("Request range header missing");
    }

    // Parse range header
    const CHUNK_SIZE = 10 ** 6; // 1MB per chunk
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, fileSize - 1);
    const contentLength = end - start + 1;

    // Set streaming headers
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4",
      "Content-Disposition": "inline", // Prevent downloads
      "X-Content-Type-Options": "nosniff", // Prevent MIME-type sniffing
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
    });

    // Stream the video chunk
    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);
  } catch (error) {
    console.error("Error streaming video:", error);
    res.status(500).send("Error watching video");
  }
};
// 🔹 Upload multiple videos & Create Course
exports.uploadVideos = async (req, res) => {
  try {
    const { title, authorName, price, description, category } = req.body;

    if (!title || !authorName || !price || !description || !category) {
      return res.status(400).send("All fields, including category, are required.");
    }

    if (!["Frontend", "Backend", "Server Management"].includes(category)) {
      return res.status(400).send("Invalid category.");
    }

    if (!req.files || (!req.files.videos && !req.files.coverProfile)) {
      return res.status(400).send("No files uploaded. Please upload a video or cover image.");
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
      category, // 🔹 Store category in DB
      coverProfile: coverProfilePath,
      videos: videoDocs,
    });

    await newCourse.save();

    res.redirect("/videos/all");
  } catch (error) {
    console.error("Error uploading videos:", error);
    res.status(500).send("Error uploading videos");
  }
};

// 🔹 Edit Course Details
exports.editVideo = async (req, res) => {
  try {
    const { title, authorName, price, description } = req.body;
    const courseId = req.params.id;

    if (!title || !authorName || !price || !description) {
      return res.status(400).send("All fields are required.");
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { title, authorName, price, description },
      { new: true }
    );

    if (!updatedCourse) {
      return res.status(404).send("Course not found");
    }

    res.redirect(`/videos/all`);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).send("Error updating course");
  }
};

// 🔹 Delete Video & Course
exports.deleteVideo = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId).populate("videos");

    if (!course) {
      return res.status(404).send("Course not found");
    }

    for (const video of course.videos) {
      const videoPath = path.join(__dirname, "..", "public", "uploads", "videos", path.basename(video.videoUrl));
      if (fs.existsSync(videoPath)) {
        fs.unlinkSync(videoPath);
      }
      await Video.findByIdAndDelete(video._id);
    }

    await Course.findByIdAndDelete(courseId);

    res.redirect("/videos/all");
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).send("Error deleting course");
  }
};
