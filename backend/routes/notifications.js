const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Donor = require("../models/Donor");
const sendEmail = require("../utils/emailService");

router.post("/remind-donors", protect, async (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Not authorized as an admin" });
  }

  try {
    const donors = await Donor.find({ remindersEnabled: true });
    
    const results = [];
    for (const donor of donors) {
      try {
        await sendEmail({
          to: donor.email,
          subject: "Invictus: Monthly Donation Reminder",
          text: `Hi ${donor.name},\n\nThis is a friendly reminder for your monthly contribution to Invictus. Your support makes a huge difference!\n\nBest,\nInvictus Team`,
          html: `<p>Hi ${donor.name},</p><p>This is a friendly reminder for your monthly contribution to <strong>Invictus</strong>. Your support makes a huge difference!</p><p>Best,<br>Invictus Team</p>`,
        });
        results.push({ email: donor.email, status: "sent" });
      } catch (err) {
        results.push({ email: donor.email, status: "failed", error: err.message });
      }
    }

    res.json({ message: "Reminders processed", results });
  } catch (error) {
    res.status(500).json({ message: "Error processing reminders", error: error.message });
  }
});

module.exports = router;
