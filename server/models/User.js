const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address"
      ]
    },
    password: {
      type: String,
      // Conditionally required: Only enforced for traditional manual email/password signups
      required: function() {
        return this.authProvider === "local";
      },
      minlength: [8, "Password must be at least 8 characters long"],
      select: false 
    },
    authProvider: {
      type: String,
      enum: {
        values: ["local", "google"],
        message: "{VALUE} is not a valid auth provider"
      },
      default: "local"
    },
    googleId: {
      type: String,
      default: null,
      sparse: true, // Crucial: allows standard email accounts to bypass the uniqueness constraint
      unique: true
    },
    role: {
      type: String,
      enum: ["candidate", "admin"],
      default: "candidate"
    },
    activePiq: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PIQ",
      default: null 
    },
    subscription: {
      type: String,
      enum: ["free", "pro", "premium"],
      default: "free"
    },
    isActive: {
      type: Boolean,
      default: true 
    },
    lastLogin: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);