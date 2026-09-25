const mongoose = require('mongoose');

const driveSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CompanyProfile',
      required: [true, 'Company reference is required'],
    },
    // SECTION 1: Job Information
    jobTitle: {
      type: String,
      required: [true, 'Please provide the job title/role'],
      trim: true,
    },
    jobRole: {
      type: String,
      default: '',
      trim: true,
    },
    department: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },

    // SECTION 2: Responsibilities
    responsibilities: {
      type: [String],
      default: [],
    },

    // SECTION 3: Skills Matrix
    requiredSkills: {
      type: [String],
      default: [],
    },
    preferredSkills: {
      type: [String],
      default: [],
    },

    // SECTION 4: Academic & Education Criteria
    minimumCGPA: {
      type: Number,
      default: 0,
      min: [0, 'Minimum CGPA cannot be negative'],
      max: [10, 'Minimum CGPA cannot exceed 10'],
    },
    maxBacklogs: {
      type: Number,
      default: 0,
      min: [0, 'Max backlogs cannot be negative'],
    },
    minimumTenthPercentage: {
      type: Number,
      default: 0,
      min: [0, '10th percentage cannot be negative'],
      max: [100, '10th percentage cannot exceed 100'],
    },
    minimumTwelfthPercentage: {
      type: Number,
      default: 0,
      min: [0, '12th percentage cannot be negative'],
      max: [100, '12th percentage cannot exceed 100'],
    },
    allowedBranches: {
      type: [String],
      default: [],
    },
    eligibleDegrees: {
      type: [String],
      default: [],
    },
    eligibleSpecializations: {
      type: [String],
      default: [],
    },

    // SECTION 5: Experience & Arrangement
    experienceType: {
      type: String,
      enum: {
        values: ['freshers', 'experienced', 'both'],
        message: '{VALUE} is not a valid experience requirement',
      },
      default: 'freshers',
    },
    minimumExperience: {
      type: Number,
      default: 0,
      min: [0, 'Minimum experience cannot be negative'],
    },
    employmentType: {
      type: String,
      enum: {
        values: ['Full Time', 'Internship', 'Internship + Full Time', 'Contract'],
        message: '{VALUE} is not a valid employment type',
      },
      default: 'Full Time',
    },
    workMode: {
      type: String,
      enum: {
        values: ['On-site', 'Hybrid', 'Remote'],
        message: '{VALUE} is not a valid work mode',
      },
      default: 'On-site',
    },
    workLocation: {
      type: String,
      default: '',
      trim: true,
    },

    // SECTION 6: Compensation & Bond
    packageLPA: {
      type: Number,
      required: [true, 'Please provide the compensation package in LPA'],
      min: [0, 'Package LPA cannot be negative'],
    },
    minimumCTC: {
      type: Number,
      default: 0,
      min: [0, 'Minimum CTC cannot be negative'],
    },
    maximumCTC: {
      type: Number,
      default: 0,
      min: [0, 'Maximum CTC cannot be negative'],
    },
    stipend: {
      type: Number,
      default: 0,
      min: [0, 'Stipend cannot be negative'],
    },
    bondRequired: {
      type: Boolean,
      default: false,
    },
    bondDuration: {
      type: Number,
      default: 0,
      min: [0, 'Bond duration cannot be negative'],
    },
    bondDetails: {
      type: String,
      default: '',
      trim: true,
    },

    // SECTION 7: Selection Process & Additional Requirements
    recruitmentRounds: {
      type: [String],
      default: [],
    },
    additionalRequirements: {
      type: [String],
      default: [],
    },

    // Lifecycle Dates & Status
    driveDate: {
      type: Date,
    },
    applicationDeadline: {
      type: Date,
    },
    status: {
      type: String,
      enum: {
        values: ['upcoming', 'active', 'completed'],
        message: '{VALUE} is not a valid drive status',
      },
      default: 'upcoming',
    },

    // Administrative Approval
    approvalStatus: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: '{VALUE} is not a valid approval status',
      },
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Drive', driveSchema);
