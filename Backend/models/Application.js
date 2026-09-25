const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StudentProfile',
      required: [true, 'Student reference is required'],
    },
    drive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Drive',
      required: [true, 'Drive reference is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected', 'Removed'],
        message: '{VALUE} is not a valid application status',
      },
      default: 'Applied',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    // Audit-safe administrative removal fields (Phase 7G)
    isRemoved: {
      type: Boolean,
      default: false,
    },
    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    removedAt: {
      type: Date,
    },
    removalReason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index: ensures a student can only apply once to a given drive.
// Retaining the record when status='Removed' permanently blocks student re-application.
applicationSchema.index({ student: 1, drive: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
