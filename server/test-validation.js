require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");

const runTest = async () => {
  await connectDB();

  try {
    console.log("\n--- TEST 1: Manual Signup (Should FAIL without password) ---");
    const manualUser = new User({
      name: "Manual Candidate",
      email: "manual@test.com",
      authProvider: "local"
    });
    await manualUser.validate();
    console.log("❌ Test Failed: Manual user validated without a password!");
  } catch (error) {
    console.log("✅ Test Passed: Validation correctly rejected manual user without a password.");
    console.log("Validation Message:", error.errors?.password?.message);
  }

  try {
    console.log("\n--- TEST 2: Google Signup (Should SUCCEED without password) ---");
    const googleUser = new User({
      name: "Google Candidate",
      email: "google@test.com",
      authProvider: "google",
      googleId: "google-oauth-id-123"
    });
    await googleUser.validate();
    console.log("✅ Test Passed: Google OAuth user successfully validated without requiring a password.");
  } catch (error) {
    console.log("❌ Test Failed: Google user rejected without a password!", error.message);
  }

  await mongoose.disconnect();
  console.log("\nDatabase disconnected safely.");
};

runTest();