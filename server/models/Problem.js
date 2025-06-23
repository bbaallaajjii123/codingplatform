const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: {
    type: String,
    required: true
  },
  expectedOutput: {
    type: String,
    required: true
  },
  isHidden: {
    type: Boolean,
    default: false
  },
  description: String
});

const problemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Expert'],
    required: true
  },
  category: {
    type: String,
    enum: [
      'Algorithms',
      'Data Structures',
      'Dynamic Programming',
      'Graph Theory',
      'String Manipulation',
      'Mathematics',
      'Sorting',
      'Searching',
      'Recursion',
      'Bit Manipulation',
      'Arrays',
      'Linked Lists',
      'Trees',
      'Stacks',
      'Queues',
      'Heaps',
      'Hash Tables',
      'Greedy',
      'Backtracking',
      'Divide and Conquer'
    ],
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  points: {
    type: Number,
    required: true,
    min: 1
  },
  timeLimit: {
    type: Number,
    default: 1000, // milliseconds
    min: 100
  },
  memoryLimit: {
    type: Number,
    default: 128, // MB
    min: 16
  },
  testCases: [testCaseSchema],
  sampleInput: {
    type: String,
    required: true
  },
  sampleOutput: {
    type: String,
    required: true
  },
  constraints: {
    type: String,
    default: ''
  },
  hints: [{
    type: String,
    trim: true
  }],
  solution: {
    type: String,
    default: ''
  },
  discussion: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  submissions: {
    total: {
      type: Number,
      default: 0
    },
    successful: {
      type: Number,
      default: 0
    }
  },
  successRate: {
    type: Number,
    default: 0
  },
  averageTime: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  difficultyScore: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for efficient queries
problemSchema.index({ category: 1, difficulty: 1 });
problemSchema.index({ tags: 1 });
problemSchema.index({ isActive: 1 });

// Calculate success rate
problemSchema.methods.calculateSuccessRate = function() {
  if (this.submissions.total === 0) return 0;
  return Math.round((this.submissions.successful / this.submissions.total) * 100);
};

// Update difficulty score based on success rate and average time
problemSchema.methods.updateDifficultyScore = function() {
  const successRate = this.calculateSuccessRate();
  const timeFactor = Math.max(0, 100 - this.averageTime / 100);
  this.difficultyScore = Math.round((successRate + timeFactor) / 2);
};

// Get problem statistics
problemSchema.methods.getStats = function() {
  return {
    totalSubmissions: this.submissions.total,
    successfulSubmissions: this.submissions.successful,
    successRate: this.calculateSuccessRate(),
    averageTime: this.averageTime,
    difficultyScore: this.difficultyScore
  };
};

// Virtual for difficulty level based on score
problemSchema.virtual('calculatedDifficulty').get(function() {
  if (this.difficultyScore >= 80) return 'Easy';
  if (this.difficultyScore >= 60) return 'Medium';
  if (this.difficultyScore >= 40) return 'Hard';
  return 'Expert';
});

// Ensure virtual fields are serialized
problemSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Problem', problemSchema); 