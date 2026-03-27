const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const volunteerRoutes = require("./routes/volunteers");
const donorRoutes = require("./routes/donors");
const activityRoutes = require("./routes/activities");
const donationRoutes = require("./routes/donations");
const userRoutes = require("./routes/users");
const notificationRoutes = require("./routes/notifications");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/invictus")
  .then(() => console.log("MongoDB connected successfully to:", process.env.MONGO_URI ? "Atlas/Remote" : "Local"))
  .catch((err) => {
    console.error("MongoDB connection error details:");
    console.error(err.message);
    if (err.name === 'MongooseServerSelectionError') {
      console.error("TIP: Check your IP whitelist in MongoDB Atlas or ensure you have internet access.");
    }
  });

app.use("/api/auth", authRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
