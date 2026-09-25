const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    rollNumber: {
      type: String,
      required: [true, 'Please provide a roll number'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    branch: {
      type: String,
      required: [true, 'Please provide your branch/department'],
      trim: true,
    },
    cgpa: {
      type: Number,
      required: [true, 'Please provide your current CGPA'],
      min: [0, 'CGPA cannot be less than 0'],
      max: [10, 'CGPA cannot be greater than 10'],
    },
    tenthPercentage: {
      type: Number,
      min: [0, 'Percentage cannot be less than 0'],
      max: [100, 'Percentage cannot be greater than 100'],
    },
    twelfthPercentage: {
      type: Number,
      min: [0, 'Percentage cannot be less than 0'],
      max: [100, 'Percentage cannot be greater than 100'],
    },
    activeBacklogs: {
      type: Number,
      default: 0,
      min: [0, 'Backlogs cannot be negative'],
    },
    skills: {
      type: [String],
      default: [],
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
