const mongoose = require("mongoose");

const VolunteerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  email: String,
  name: String,
  phone: String,
  address: String,
  skills: [String],
  availability: {
    type: Map,
    of: {
      available: Boolean,
      startTime: String,
      endTime: String,
    },
  },
  activities: [
    {
      id: String,
      title: String,
      date: String,
      status: String,
      hours: Number,
    },
  ],
  totalHours: {
    type: Number,
    default: 0,
  },
  eventsAttended: {
    type: Number,
    default: 0,
  },
  certificatesEarned: {
    type: Number,
    default: 0,
  },
  idProofUrl: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Volunteer", VolunteerSchema);
