const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    authorName: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    coverProfile: { type: String, required: true }, // Cover Image
    category: { 
        type: String, 
        enum: ["Frontend", "Backend", "Server Management"], 
        required: true 
    }, // Category Field
    videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "Video" }] // Reference to videos
});

const Course = mongoose.model("Course", courseSchema);
module.exports = Course;
