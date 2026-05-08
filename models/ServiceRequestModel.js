const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  // Client Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    maxlength: [20, 'Phone number cannot exceed 20 characters']
  },
  company: {
    type: String,
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },

  // Service Details
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: {
      values: ['Web Development', 'Mobile Development', 'AI & Automation', 'UI/UX Design', 'DevOps', 'Other'],
      message: 'Please select a valid service type'
    }
  },
  projectTitle: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [100, 'Project title cannot exceed 100 characters']
  },
  projectDescription: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    minlength: [50, 'Project description must be at least 50 characters'],
    maxlength: [2000, 'Project description cannot exceed 2000 characters']
  },

  // Project Requirements
  budget: {
    type: String,
    enum: {
      values: ['Under $5,000', '$5,000 - $10,000', '$10,000 - $25,000', '$25,000 - $50,000', '$50,000 - $100,000', 'Over $100,000', 'To be discussed'],
      message: 'Please select a valid budget range'
    }
  },
  timeline: {
    type: String,
    enum: {
      values: ['ASAP', '1-2 weeks', '2-4 weeks', '1-3 months', '3-6 months', '6+ months', 'To be discussed'],
      message: 'Please select a valid timeline'
    }
  },
  priority: {
    type: String,
    enum: {
      values: ['Low', 'Medium', 'High', 'Urgent'],
      message: 'Please select a valid priority level'
    },
    default: 'Medium'
  },

  // Technical Requirements
  technicalRequirements: {
    type: String,
    trim: true,
    maxlength: [1000, 'Technical requirements cannot exceed 1000 characters']
  },
  preferredTechnologies: {
    type: String,
    trim: true,
    maxlength: [500, 'Preferred technologies cannot exceed 500 characters']
  },

  // Additional Information
  additionalNotes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Additional notes cannot exceed 1000 characters']
  },

  // File Attachments (if needed in future)
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Status and Tracking
  status: {
    type: String,
    enum: {
      values: ['new', 'reviewing', 'contacted', 'quoted', 'in_progress', 'completed', 'cancelled'],
      message: 'Please select a valid status'
    },
    default: 'new'
  },

  // Admin Response
  adminNotes: {
    type: String,
    trim: true,
    maxlength: [2000, 'Admin notes cannot exceed 2000 characters']
  },
  quotedPrice: {
    type: Number,
    min: [0, 'Quoted price cannot be negative']
  },
  estimatedTimeline: {
    type: String,
    trim: true,
    maxlength: [100, 'Estimated timeline cannot exceed 100 characters']
  },

  // Communication
  preferredContactMethod: {
    type: String,
    enum: {
      values: ['email', 'phone', 'both'],
      message: 'Please select a valid contact method'
    },
    default: 'email'
  },

  // Metadata
  source: {
    type: String,
    enum: {
      values: ['website', 'referral', 'social_media', 'direct', 'other'],
      message: 'Please select a valid source'
    },
    default: 'website'
  },

  // Timestamps
  submittedAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },

  // Follow-up tracking
  nextFollowUp: {
    type: Date
  },
  followUpCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
serviceRequestSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Index for better search performance
serviceRequestSchema.index({ email: 1 });
serviceRequestSchema.index({ status: 1 });
serviceRequestSchema.index({ serviceType: 1 });
serviceRequestSchema.index({ submittedAt: -1 });
serviceRequestSchema.index({ priority: 1 });

// Virtual for full name
serviceRequestSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON
serviceRequestSchema.set('toJSON', { virtuals: true });
serviceRequestSchema.set('toObject', { virtuals: true });

// Pre-save middleware to update lastUpdated
serviceRequestSchema.pre('save', function () {
  this.lastUpdated = new Date();
});

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
