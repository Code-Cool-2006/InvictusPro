const mongoose = require("mongoose");

const DonationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  donorName: String,
  amount: {
    type: Number,
    required: function() { return this.category === "money"; }
  },
  category: {
    type: String,
    enum: ["money", "food", "clothes", "medicine", "services", "others"],
    default: "money"
  },
  description: String,
  quantity: Number,
  unit: String,
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    default: "completed",
  },
});

module.exports = mongoose.model("Donation", DonationSchema);
