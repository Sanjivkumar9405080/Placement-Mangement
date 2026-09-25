const mongoose = require('mongoose');

const companyProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true,
    },
    companyName: {
      type: String,
      required: [true, 'Please provide the company name'],
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    hrName: {
      type: String,
      trim: true,
    },
    hrEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    hrPhone: {
      type: String,
      trim: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CompanyProfile', companyProfileSchema);
