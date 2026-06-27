const mongoose = require("mongoose");

// Require the models to compile and register schemas on application startup
const User = require("../models/User");
const PIQ = require("../models/PIQ");
const Interview = require("../models/Interview");
const PPDTReport = require("../models/PPDTReport");

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");

    // Connect using your existing MONGODB_URI environment variable
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ MongoDB Connected");

    // Force-sync indexes. This is highly recommended on Atlas Free Tiers
    // to build the TTL and sparse unique indexes before traffic starts.
    await Promise.all([
      User.createIndexes(),
      PIQ.createIndexes(),
      Interview.createIndexes(),
      PPDTReport.createIndexes()
    ]);

    console.log("✅ Database Indexes Synchronized (TTL, Unique Sparse OAuth)");
  } catch (err) {
    console.error("❌ MongoDB Connection or Indexing Failed");
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;