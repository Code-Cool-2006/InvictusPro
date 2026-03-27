const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Donation = require("../models/Donation");
const Donor = require("../models/Donor");

router.get("/my-donations", protect, async (req, res) => {
  const donations = await Donation.find({ donorId: req.user._id }).sort("-date");
  res.json(donations);
});

router.post("/", protect, async (req, res) => {
  const { amount, category, description, quantity, unit } = req.body;
  const donation = await Donation.create({
    donorId: req.user._id,
    donorName: req.user.username,
    amount: category === "money" ? amount : undefined,
    category,
    description,
    quantity,
    unit,
  });

  if (donation) {
    const donor = await Donor.findOne({ user: req.user._id });
    if (donor) {
      if (category === "money") {
        donor.totalDonated += amount;
      }
      donor.donationCount += 1;
      donor.donations.push({
        id: donation._id,
        amount: donation.amount,
        category: donation.category,
        date: donation.date,
        status: donation.status,
      });
      await donor.save();
    }
    res.status(201).json(donation);
  } else {
    res.status(400).json({ message: "Invalid donation data" });
  }
});

router.get("/all", protect, async (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Not authorized as an admin" });
  }
  const donations = await Donation.find().sort("-date");
  res.json(donations);
});

module.exports = router;
