const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Donor = require("../models/Donor");

router.get("/profile", protect, async (req, res) => {
  try {
    // Auto-create profile if it doesn't exist
    let donor = await Donor.findOneAndUpdate(
      { user: req.user._id },
      { $setOnInsert: { user: req.user._id, email: req.user.email } },
      { new: true, upsert: true }
    );
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/profile", protect, async (req, res) => {
  try {
    const donor = await Donor.findOneAndUpdate(
      { user: req.user._id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/all", protect, async (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Not authorized as an admin" });
  }
  const donors = await Donor.find();
  res.json(donors);
});

module.exports = router;
