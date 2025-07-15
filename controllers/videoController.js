const Course = require("../model/courses");
const Video = require("../model/video");
const User = require("../model/user"); 
const path = require("path");
const fs = require("fs");

/////////////////////////////////////////////////
exports.getVideoById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate("videos");
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    res.render("courseDetail", { course ,user: req.user});
  } catch (error) {
    console.error("Error fetching course details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

////////////////////////////////////////////////////////
exports.renderUploadPage = (req, res) => {
  res.render('upload');
};

/////////////////////////////////////////////////////////
exports.watchVideo = async (req, res) => {
  try {
    const videoId = req.params.id;
    const video = await Video.findById(videoId);
    
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }
    
    
    if (req.user) {
      const user = await User.findById(req.user._id);
      
      const index = user.watchHistory.findIndex(
        entry => entry.video.toString() === video._id.toString()
      );
      if (index > -1) {
      
        user.watchHistory[index].watchedAt = new Date();
      } else {
        
        user.watchHistory.push({ video: video._id, watchedAt: new Date() });
      }
      await user.save();
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
/////////////////////////////////////////////////////////
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
    res.redirect(`/`);
  } catch (error) {
    console.error("Error uploading videos:", error);
    res.status(500).json({ error: "Error uploading videos" });
  }
};

//////////////////////////////////////////////////
exports.renderEditPage = async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await Course.findById(courseId).populate("videos"); 
    
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    console.log("Course Videos:", course.videos); 

    res.render("editCourse", { course });
  } catch (error) {
    console.error("Error rendering edit page:", error);
    res.status(500).send("Internal Server Error");
  }
};

//////////////////////////////////
exports.addVideos = async (req, res) => {
  try {
    const courseId = req.params.id;
    

    if (!courseId) {
      return res.status(400).json({ error: "Invalid Course ID." });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    
    if (!req.files || !req.files.videos || req.files.videos.length === 0) {
      return res.status(400).json({ error: "No videos uploaded." });
    }

    

    // 🔹 Save Video Documents
    const videoDocs = await Promise.all(
      req.files.videos.map(async (file) => {
        const video = new Video({
          title: file.originalname,
          videoUrl: `/uploads/videos/${file.filename}`,
          course: courseId
        });
        await video.save();
        return video._id; // Store only ObjectId
      })
    );

    // 🔹 Add Video IDs to Course
    course.videos.push(...videoDocs);
    await course.save();

    res.redirect(`/videos/edit/${courseId}`);
  } catch (error) {
    console.error("Error in addVideos:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


//////////////////////////////////////////////////////////////
exports.editCourse = async (req, res) => {
  try {
    

    const { title, authorName, price, description, category } = req.body;
    const courseId = req.params.id;

   
    const updatedData = { title, authorName, price, description, category };

    
    if (req.files && req.files.length > 0) {
      const courseCoverFile = req.files.find(file => file.fieldname === "coverProfile");
      if (courseCoverFile) {
        updatedData.coverProfile = `/uploads/covers/${courseCoverFile.filename}`;
       
      } else {
        console.log("No new course cover uploaded");
      }
    }

    
    const updatedCourse = await Course.findByIdAndUpdate(courseId, updatedData, { new: true });
    if (!updatedCourse) {
      console.error("Course not found!");
      return res.status(404).json({ error: "Course not found" });
    }

  

    console.log("Course updated successfully:", updatedCourse);
    res.redirect(`/videos/edit/${courseId}`);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ error: "Error updating course" });
  }
};


/////////////////////////////////////////////////////////////////

  exports.updateVideoDetails = async (req, res) => {
  try {
    
    const courseId = req.body.courseId;
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        if (file.fieldname.startsWith("videoCover-")) {
          const videoId = file.fieldname.split("-")[1];
          if (videoId) {
            await Video.findByIdAndUpdate(videoId, {
              coverProfile: `/uploads/videoCovers/${file.filename}`
            });
            console.log(`Updated cover for video ${videoId}`);
          }
        }
      }
    }

    // Process individual video title updates (fields like "videoTitle-<videoId>")
    Object.keys(req.body).forEach(async (key) => {
      if (key.startsWith("videoTitle-")) {
        const videoId = key.split("-")[1];
        const newTitle = req.body[key].trim();
        if (videoId && newTitle) {
          await Video.findByIdAndUpdate(videoId, { title: newTitle });
         
        }
      }
    });
    
    res.redirect(`/videos/edit/${courseId}`);
  } catch (error) {
    console.error("Error updating video details:", error);
    res.status(500).json({ error: "Error updating video details" });
  }
};
////////////////////////////////////////////////////////////////
exports.deleteVideo = async (req, res) => {
  try {
    
    const { id, videoId } = req.params;  
    const courseId = req.body.courseId || req.query.courseId; // Read courseId from body/query

    if (!courseId) {
      return res.status(400).json({ error: "Course ID is missing." });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Remove video file
    const videoPath = path.join(__dirname, "..", "public", video.videoUrl);
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    // Delete video from DB
    await Video.findByIdAndDelete(videoId);

    // Remove video reference from course
    await Course.findByIdAndUpdate(courseId, { $pull: { videos: videoId } });

   
    res.redirect(`/videos/edit/${courseId}`); 
  } catch (error) {
    console.error("Error deleting video:", error);
    res.status(500).json({ error: "Error deleting video" });
  }
};



/////////////////////////////////////////////////////////////
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
    res.redirect("/videos/all");
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: "Error deleting course" });
  }
};
///////////////////////////////////////////////////////////////////
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.render("courseList", { courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).send("Internal Server Error");
  }
};
//////////////////////////////////////////////
