const mongoose = require("mongoose");

const familyMemberSchema = new mongoose.Schema({
  relation: { type: String, required: true },
  alive: { type: Boolean, default: true },
  education: { type: String, default: "" },
  occupation: { type: String, default: "" },
  incomePerMonth: { type: Number, default: 0 }
}, { _id: false });

const academicRecordSchema = new mongoose.Schema({
  institution: { type: String, required: false, trim: true },
  boardOrUniversity: { type: String, required: false, trim: true },
  percentageOrCgpa: { type: Number, required: false, default: null },
  yearOfPassing: { type: Number, required: false, default: null },
  mediumOfInstruction: { type: String, default: "" },
  achievements: { type: [String], default: [] }
}, { _id: false });

const sportRecordSchema = new mongoose.Schema({
  games: { type: String, required: true, trim: true },
  level: { type: String, default: "" },
  achievements: { type: String, default: "" }
}, { _id: false });

const ssbHistorySchema = new mongoose.Schema({
  entry: { type: String, required: true },
  boardAndPlace: { type: String, required: true },
  batchNumber: { type: String, default: "" },
  chestNumber: { type: String, default: "" },
  dateOfReporting: { type: Date },
  result: { type: String, default: "" }
}, { _id: false });

const piqSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: false, default: null },
    age: { type: Number, required: false, default: null },
    gender: { type: String, required: false, default: "Not Provided" },
    maritalStatus: { type: String, default: "Single" },
    nationality: { type: String, default: "Indian" },
    address: {
      present: { type: String, required: true, trim: true },
      permanent: { type: String, required: true, trim: true }
    },
    contact: {
      phone: { type: String, trim: true, default: null },
      email: { type: String, lowercase: true, trim: true, default: null }
    },
    family: {
      father: {
        alive: { type: Boolean, default: true },
        education: { type: String, default: "" },
        occupation: { type: String, default: "" },
        incomePerMonth: { type: Number, default: null }
      },
      mother: {
        alive: { type: Boolean, default: true },
        education: { type: String, default: "" },
        occupation: { type: String, default: "" },
        incomePerMonth: { type: Number, default: null }
      },
      siblings: [familyMemberSchema],
      totalMonthlyIncome: { type: Number, default: null }
    },
    education: {
      class10: academicRecordSchema,
      class12: academicRecordSchema,
      graduation: academicRecordSchema,
      postGraduation: academicRecordSchema
    },
    employment: {
      currentStatus: { type: String, default: "Preparing" },
      company: { type: String, default: "" },
      experienceMonths: { type: Number, default: 0 }
    },
    sports: [sportRecordSchema],
    ncc: {
      wing: { type: String, default: "None" },
      certificate: { type: String, default: "None" },
      campExperience: { type: String, default: "" }
    },
    responsibilities: {
      school: { type: [String], default: [] },
      college: { type: [String], default: [] },
      home: { type: [String], default: [] }
    },
    hobbies: {
      hobbiesList: { type: [String], default: [] },
      interests: { type: [String], default: [] },
      readingPreferences: { type: [String], default: [] },
      creativeActivities: { type: [String], default: [] }
    },
    previousAttempts: {
      ssbAttemptsCount: { type: Number, default: 0 },
      recommendedCount: { type: Number, default: 0 },
      historyList: [ssbHistorySchema]
    },
    miscellaneous: {
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      careerGoals: { type: String, default: "" }
    },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index for rapid user history retrieval
piqSchema.index({ user: 1, status: 1 });

module.exports = mongoose.models.PIQ || mongoose.model("PIQ", piqSchema);