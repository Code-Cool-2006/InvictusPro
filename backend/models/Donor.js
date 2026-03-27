const mongoose = require("mongoose");

const DonorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  email: String,
  name: String,
  phone: String,
  panCard: String,
  status: {
    type: String,
    enum: ["active", "lapsed", "high-value", "one-time"],
    default: "active"
  },
  donations: [
    {
      id: String,
      amount: Number,
      category: String,
      date: String,
      status: String,
    },
  ],
  totalDonated: {
    type: Number,
    default: 0,
  },
  donationCount: {
    type: Number,
    default: 0,
  },
  remindersEnabled: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Donor", DonorSchema);
