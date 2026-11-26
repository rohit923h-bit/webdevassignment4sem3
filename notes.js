
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const router = express.Router();

const Note = mongoose.models.Note || mongoose.model("Note", new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" }
}, { timestamps: true }));

// Authentication middleware
const protect = (req, res, next) => {
    try {
        const header = req.headers.authorization;

        if (!header || !header.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = header.split(" ")[1];
        req.user = jwt.verify(token, process.env.JWT_SECRET);

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Get all notes
router.get("/", protect, async (req, res) => {
    try {
        const notes = await Note.find({ owner: req.user.id });
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create note
router.post("/", protect, async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: "Title and content required" });
        }

        const note = await Note.create({
            title,
            content,
            owner: req.user.id
        });

        req.app.get("emitter").emit("noteCreated", note);

        res.status(201).json({
            message: "Note created successfully",
            note
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update note
router.put("/:id", protect, async (req, res) => {
    try {
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, owner: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }

        res.json({ message: "Note updated successfully", note });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete note
router.delete("/:id", protect, async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({
            _id: req.params.id,
            owner: req.user.id
        });

        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }

        res.json({ message: "Note deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
