const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  date: String,
  location: String,
  needed: Number,
  hours: Number,
  skills: [String],
  attendees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Activity", ActivitySchema);
