const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Volunteer = require("../models/Volunteer");
const Donor = require("../models/Donor");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

router.post("/register", async (req, res) => {
  const { email, username, password, role } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const user = await User.create({
    email,
    username,
    password,
    role,
  });

  if (user) {
    // Create profiles based on role
    if (role === "Volunteer") {
      await Volunteer.create({
        user: user._id,
        email: user.email,
        name: user.username,
        availability: {
          monday: { available: false, startTime: "09:00", endTime: "17:00" },
          tuesday: { available: false, startTime: "09:00", endTime: "17:00" },
          wednesday: { available: false, startTime: "09:00", endTime: "17:00" },
          thursday: { available: false, startTime: "09:00", endTime: "17:00" },
          friday: { available: false, startTime: "09:00", endTime: "17:00" },
          saturday: { available: false, startTime: "09:00", endTime: "17:00" },
          sunday: { available: false, startTime: "09:00", endTime: "17:00" },
        },
      });
    } else if (role === "Donors") {
      await Donor.create({
        user: user._id,
        email: user.email,
        name: user.username,
      });
    }

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
});

module.exports = router;
