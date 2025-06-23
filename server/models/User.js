const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  points: {
    type: Number,
    default: 0
  },
  rank: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
    default: 'Beginner'
  },
  solvedProblems: [{
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    },
    solvedAt: {
      type: Date,
      default: Date.now
    },
    language: String,
    executionTime: Number,
    memoryUsed: Number
  }],
  assignedProblems: [{
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    dueDate: Date,
    isCompleted: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    notes: String
  }],
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  achievements: [{
    name: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'javascript'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate rank based on points
userSchema.methods.calculateRank = function() {
  if (this.points >= 1000) return 'Expert';
  if (this.points >= 500) return 'Advanced';
  if (this.points >= 100) return 'Intermediate';
  return 'Beginner';
};

// Get user stats
userSchema.methods.getStats = function() {
  return {
    totalProblems: this.solvedProblems.length,
    points: this.points,
    rank: this.rank,
    achievements: this.achievements.length
  };
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema); 