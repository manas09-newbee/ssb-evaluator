const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

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
      sparse: true, // Allows standard local accounts to skip this unique index rule
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
    subscriptionExpiresAt: {
      type: Date,
      default: null
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

// Hash local credentials before saving to MongoDB
// Promises-based definition required for Mongoose v9+ compatibility
userSchema.pre("save", async function() {
  console.log(`[User Pre-Save] isNew: ${this.isNew}, isModified('password'): ${this.isModified("password")}`);
  
  // Safe validation: Only run bcrypt if password field is actually present in the document
  if (this.password && (this.isNew || this.isModified("password"))) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    console.log("[User Pre-Save] Password successfully hashed.");
  }
});

// Method to verify local password credentials
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);