const express = require("express");
const router = express.Router();
const path = require("path");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const Volunteer = require("../models/Volunteer");

// GET profile
router.get("/profile", protect, async (req, res) => {
  const volunteer = await Volunteer.findOne({ user: req.user._id });
  if (volunteer) {
    res.json(volunteer);
  } else {
    res.status(404).json({ message: "Volunteer not found" });
  }
});

// PUT profile
router.put("/profile", protect, async (req, res) => {
  const volunteer = await Volunteer.findOne({ user: req.user._id });
  if (volunteer) {
    Object.assign(volunteer, req.body);
    const updatedVolunteer = await volunteer.save();
    res.json(updatedVolunteer);
  } else {
    res.status(404).json({ message: "Volunteer not found" });
  }
});

// POST upload ID proof
router.post(
  "/upload-id",
  protect,
  (req, res, next) => {
    upload.single("idProof")(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    try {
      const volunteer = await Volunteer.findOne({ user: req.user._id });
      if (!volunteer) {
        return res.status(404).json({ message: "Volunteer not found" });
      }

      // Build a URL the frontend can fetch from
      const fileUrl = `/uploads/${req.file.filename}`;
      volunteer.idProofUrl = fileUrl;
      await volunteer.save();

      res.json({ idProofUrl: fileUrl });
    } catch (err) {
      console.error("File upload error:", err);
      res.status(500).json({ message: "Server error during upload." });
    }
  }
);

// GET all volunteers (admin only)
router.get("/all", protect, async (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Not authorized as an admin" });
  }
  const volunteers = await Volunteer.find();
  res.json(volunteers);
});

// GET a single volunteer profile by user ID (admin only)
router.get("/by-user/:userId", protect, async (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Not authorized as an admin" });
  }
  try {
    const volunteer = await Volunteer.findOne({ user: req.params.userId });
    if (!volunteer) {
      return res.status(404).json({ message: "No volunteer profile found for this user." });
    }
    res.json(volunteer);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
