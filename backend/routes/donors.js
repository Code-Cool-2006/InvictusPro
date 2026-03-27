const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Donor = require("../models/Donor");

router.get("/profile", protect, async (req, res) => {
  const donor = await Donor.findOne({ user: req.user._id });
  if (donor) {
    res.json(donor);
  } else {
    res.status(404).json({ message: "Donor not found" });
  }
});

router.put("/profile", protect, async (req, res) => {
  const donor = await Donor.findOne({ user: req.user._id });
  if (donor) {
    Object.assign(donor, req.body);
    const updatedDonor = await donor.save();
    res.json(updatedDonor);
  } else {
    res.status(404).json({ message: "Donor not found" });
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
