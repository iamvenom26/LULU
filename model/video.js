const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    videoUrl: { type: String, required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" } // Each video belongs to a Course
});

const Video = mongoose.model("Video", videoSchema);
module.exports = Video;
