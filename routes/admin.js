const express = require('express');
const multer = require('multer');
const Video = require('../model/videos'); // Ensure correct path

const router = express.Router();

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// Video Upload Route (Admin)
router.post('/admin/upload', upload.single('video'), async (req, res) => {
    try {
        const video = new Video({
            title: req.body.title,
            authorName: req.body.authorName,
            price: req.body.price,
            description: req.body.description,
            publishDate: req.body.publishDate || Date.now(),
            videoUrl: `/uploads/${req.file.filename}`
        });
        await video.save();
        res.status(201).json({ message: 'Video Uploaded Successfully!', video });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;