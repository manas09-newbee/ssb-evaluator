const mongoose = require("mongoose");

// Require the models to compile and register schemas on application startup
const User = require("../models/User");
const PIQ = require("../models/PIQ");
const Interview = require("../models/Interview");
const PPDTReport = require("../models/PPDTReport");
const OIRAttempt = require("../models/OIRAttempt"); // Initialize OIR tracking collection

const connectDB = async () => {
  try {
    console.log("Connecting to MongoDB...");

    // Connect using your existing MONGODB_URI environment variable
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ MongoDB Connected");

    // Clean up any old corrupted Google ID indexes before rebuilding constraints
    try {
      await User.collection.dropIndex("googleId_1");
      console.log("✅ Cleaned up old duplicate Google index successfully.");
    } catch (e) {
      // Ignore if index doesn't exist yet
    }

    // Force-sync indexes. This is highly recommended on Atlas Free Tiers
    // to build the TTL and sparse unique indexes before traffic starts.
    await Promise.all([
      User.createIndexes(),
      PIQ.createIndexes(),
      Interview.createIndexes(),
      PPDTReport.createIndexes(),
      OIRAttempt.createIndexes() // Establish TTL configuration dynamically on startup
    ]);

    console.log("✅ Database Indexes Synchronized (TTL, Unique Sparse OAuth)");
  } catch (err) {
    console.error("❌ MongoDB Connection or Indexing Failed");
    console.error(err);
    process.exit(1);
  }
};

module.exports = connectDB;