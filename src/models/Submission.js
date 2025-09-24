const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  answer: { type: String, required: true },
  reviewed: { type: Boolean, default: false },
  mark: { type: Number, min: 0, max: 100, default: null }
}, { timestamps: { createdAt: 'submittedAt', updatedAt: 'updatedAt' } });

submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true }); 

module.exports = mongoose.model('Submission', submissionSchema);