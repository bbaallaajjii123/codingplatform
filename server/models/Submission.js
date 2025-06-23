const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  testCaseIndex: {
    type: Number,
    required: true
  },
  input: String,
  expectedOutput: String,
  actualOutput: String,
  isPassed: {
    type: Boolean,
    required: true
  },
  executionTime: {
    type: Number,
    default: 0
  },
  memoryUsed: {
    type: Number,
    default: 0
  },
  errorMessage: String
});

const submissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    enum: ['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'php', 'ruby', 'go', 'rust'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed', 'timeout', 'memory_exceeded'],
    default: 'pending'
  },
  result: {
    type: String,
    enum: ['pending', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error'],
    default: 'pending'
  },
  testResults: [testResultSchema],
  executionTime: {
    type: Number,
    default: 0
  },
  memoryUsed: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: 0
  },
  errorMessage: String,
  compilationError: String,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  isFirstSubmission: {
    type: Boolean,
    default: false
  },
  executionDetails: {
    containerId: String,
    logs: String,
    exitCode: Number
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
submissionSchema.index({ userId: 1, problemId: 1 });
submissionSchema.index({ status: 1 });
submissionSchema.index({ submittedAt: -1 });
submissionSchema.index({ result: 1 });

// Calculate score based on test results
submissionSchema.methods.calculateScore = function() {
  if (this.testResults.length === 0) return 0;
  
  const passedTests = this.testResults.filter(test => test.isPassed).length;
  const totalTests = this.testResults.length;
  
  return Math.round((passedTests / totalTests) * 100);
};

// Get submission summary
submissionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    status: this.status,
    result: this.result,
    score: this.score,
    executionTime: this.executionTime,
    memoryUsed: this.memoryUsed,
    language: this.language,
    submittedAt: this.submittedAt,
    passedTests: this.testResults.filter(test => test.isPassed).length,
    totalTests: this.testResults.length
  };
};

// Check if submission is successful
submissionSchema.methods.isSuccessful = function() {
  return this.result === 'accepted';
};

// Get execution statistics
submissionSchema.methods.getExecutionStats = function() {
  const passedTests = this.testResults.filter(test => test.isPassed);
  const failedTests = this.testResults.filter(test => !test.isPassed);
  
  return {
    totalTests: this.testResults.length,
    passedTests: passedTests.length,
    failedTests: failedTests.length,
    averageExecutionTime: passedTests.length > 0 
      ? passedTests.reduce((sum, test) => sum + test.executionTime, 0) / passedTests.length 
      : 0,
    averageMemoryUsed: passedTests.length > 0
      ? passedTests.reduce((sum, test) => sum + test.memoryUsed, 0) / passedTests.length
      : 0
  };
};

// Virtual for time taken
submissionSchema.virtual('timeTaken').get(function() {
  if (!this.completedAt) return null;
  return this.completedAt - this.submittedAt;
});

// Ensure virtual fields are serialized
submissionSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model('Submission', submissionSchema); 