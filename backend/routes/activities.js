const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Activity = require("../models/Activity");
const Volunteer = require("../models/Volunteer");
const User = require("../models/User");
const sendEmail = require("../utils/emailService");

// ── PUBLIC routes (no auth required) ───────────────────────────────────────

// GET all activities publicly
router.get("/public/activities", async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 });
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET attendees for a specific activity (populated with username)
router.get("/public/activities/:id/attendees", async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id).populate(
      "attendees",
      "username email"
    );
    if (!activity) return res.status(404).json({ message: "Activity not found" });
    res.json(activity.attendees);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ── PROTECTED routes (auth required) ───────────────────────────────────────

// GET all activities
router.get("/", protect, async (req, res) => {
  const activities = await Activity.find();
  res.json(activities);
});

// GET recommended activities for logged-in volunteer
router.get("/recommendations", protect, async (req, res) => {
  const volunteer = await Volunteer.findOne({ user: req.user._id });
  if (!volunteer) {
    return res.status(404).json({ message: "Volunteer profile not found" });
  }
  const activities = await Activity.find({ skills: { $in: volunteer.skills } });
  res.json(activities);
});

// POST create activity (admin only)
router.post("/", protect, async (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Not authorized as an admin" });
  }
  const activity = await Activity.create(req.body);
  res.status(201).json(activity);
});

// POST sign up for activity
router.post("/:id/signup", protect, async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  if (!activity) {
    return res.status(404).json({ message: "Activity not found" });
  }

  if (activity.attendees.includes(req.user._id)) {
    return res.status(400).json({ message: "Already signed up" });
  }

  activity.attendees.push(req.user._id);
  await activity.save();

  const volunteer = await Volunteer.findOne({ user: req.user._id });
  if (volunteer) {
    volunteer.activities.push({
      id: activity._id,
      title: activity.title,
      date: activity.date,
      status: "upcoming",
      hours: activity.hours || 0,
    });
    await volunteer.save();
  }

  res.json({ message: "Successfully signed up" });
});

// POST mark activity as complete for a volunteer (admin only)
router.post("/:id/complete/:userId", protect, async (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Not authorized as an admin" });
  }

  const activity = await Activity.findById(req.params.id);
  if (!activity) {
    return res.status(404).json({ message: "Activity not found" });
  }

  const volunteer = await Volunteer.findOne({ user: req.params.userId });
  if (!volunteer) {
    return res.status(404).json({ message: "Volunteer profile not found" });
  }

  // Find the activity in the volunteer's log (id stored as ObjectId or string)
  const activityIndex = volunteer.activities.findIndex(
    (act) => act.id?.toString() === req.params.id.toString()
  );

  if (activityIndex === -1) {
    return res.status(400).json({ message: "Volunteer not signed up for this activity" });
  }

  if (volunteer.activities[activityIndex].status === "completed") {
    return res.status(400).json({ message: "Activity already completed for this volunteer" });
  }

  // Update volunteer stats
  volunteer.activities[activityIndex].status = "completed";
  volunteer.totalHours      += volunteer.activities[activityIndex].hours || 0;
  volunteer.eventsAttended  += 1;
  volunteer.certificatesEarned = (volunteer.certificatesEarned || 0) + 1;
  await volunteer.save();

  // Send certificate notification email (non-fatal if it fails)
  try {
    const userDoc = await User.findById(req.params.userId).select("email username");
    if (userDoc?.email) {
      await sendEmail({
        to: userDoc.email,
        subject: `🎓 Certificate of Completion – ${activity.title}`,
        html: `
          <div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:0 auto;background:#0b1326;color:#e2e8f0;border-radius:12px;overflow:hidden;">
            <div style="background:linear-gradient(135deg,#0d9488,#0f766e);padding:32px;text-align:center;">
              <h1 style="margin:0;font-size:28px;color:#fff;">🏅 InvictusPro</h1>
              <p style="margin:8px 0 0;color:#ccfbf1;font-size:14px;">Certificate of Completion</p>
            </div>
            <div style="padding:32px;">
              <p style="font-size:18px;color:#e2e8f0;">
                Hi <strong style="color:#2dd4bf;">${userDoc.username || userDoc.email}</strong>,
              </p>
              <p style="color:#94a3b8;line-height:1.6;">
                Congratulations! Your participation in the following volunteer activity has been officially marked as
                <strong style="color:#4ade80;">completed</strong> by our admin team.
              </p>
              <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:20px;margin:24px 0;">
                <h2 style="margin:0 0 12px;color:#2dd4bf;font-size:18px;">${activity.title}</h2>
                <p style="margin:4px 0;color:#94a3b8;font-size:14px;">📅 Date: <span style="color:#e2e8f0;">${activity.date}</span></p>
                <p style="margin:4px 0;color:#94a3b8;font-size:14px;">📍 Location: <span style="color:#e2e8f0;">${activity.location || "—"}</span></p>
                <p style="margin:4px 0;color:#94a3b8;font-size:14px;">⏱ Hours: <span style="color:#e2e8f0;">${activity.hours || 0} hrs</span></p>
              </div>
              <p style="color:#94a3b8;font-size:14px;line-height:1.6;">
                Log in to your volunteer dashboard to download your PDF certificate and track your progress.
              </p>
              <div style="text-align:center;margin-top:28px;">
                <a href="http://localhost:5173/volun"
                   style="display:inline-block;background:linear-gradient(135deg,#0d9488,#0f766e);color:#fff;text-decoration:none;padding:12px 28px;border-radius:9999px;font-weight:700;font-size:15px;">
                  View Dashboard
                </a>
              </div>
            </div>
            <div style="padding:16px 32px;border-top:1px solid #1e293b;text-align:center;">
              <p style="color:#475569;font-size:12px;margin:0;">© InvictusPro Community Hub · Thank you for making a difference.</p>
            </div>
          </div>
        `,
        text: `Congratulations ${userDoc.username || userDoc.email}! Your activity "${activity.title}" on ${activity.date} is complete. Hours: ${activity.hours || 0}. Download your certificate at http://localhost:5173/volun`,
      });
      console.log(`✅ Certificate email sent to ${userDoc.email}`);
    }
  } catch (emailErr) {
    console.error("Certificate email failed (non-fatal):", emailErr.message);
  }

  res.json({
    message: "Activity marked as completed. Certificate email sent to volunteer.",
    certificatesEarned: volunteer.certificatesEarned,
  });
});

module.exports = router;
