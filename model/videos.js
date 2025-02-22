const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    authorName: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    publishDate: { type: Date, default: Date.now },
    videoUrl: { type: String, required: true }
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;