const express = require('express');
const Submission = require('../models/Submission');
const { auth } = require('../middleware/auth');
const Problem = require('../models/Problem');
const { executeCode } = require('../utils/codeExecutor');

const router = express.Router();

// Get user's submissions with filtering and pagination
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      problemId,
      language,
      result,
      sortBy = 'submittedAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { userId: req.user._id };

    // Apply filters
    if (problemId) query.problemId = problemId;
    if (language) query.language = language;
    if (result) query.result = result;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const submissions = await Submission.find(query)
      .populate('problemId', 'title difficulty category')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Submission.countDocuments(query);

    res.json({
      submissions: submissions.map(sub => sub.getSummary()),
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Submissions fetch error:', error);
    res.status(500).json({ error: 'Server error while fetching submissions.' });
  }
});

// Get specific submission
router.get('/:id', auth, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('problemId', 'title difficulty category')
      .populate('userId', 'username firstName lastName');

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    // Check if user owns this submission or is admin
    if (submission.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ submission });
  } catch (error) {
    console.error('Submission fetch error:', error);
    res.status(500).json({ error: 'Server error while fetching submission.' });
  }
});

// Get submission statistics for user
router.get('/stats/user', auth, async (req, res) => {
  try {
    const stats = await Submission.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: null,
          totalSubmissions: { $sum: 1 },
          acceptedSubmissions: { $sum: { $cond: [{ $eq: ['$result', 'accepted'] }, 1, 0] } },
          averageExecutionTime: { $avg: '$executionTime' },
          averageMemoryUsed: { $avg: '$memoryUsed' },
          byLanguage: {
            $push: {
              language: '$language',
              result: '$result'
            }
          },
          byResult: {
            $push: '$result'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        totalSubmissions: 0,
        acceptedSubmissions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        averageMemoryUsed: 0,
        byLanguage: {},
        byResult: {}
      });
    }

    const stat = stats[0];
    const successRate = stat.totalSubmissions > 0 
      ? Math.round((stat.acceptedSubmissions / stat.totalSubmissions) * 100) 
      : 0;

    // Process language breakdown
    const byLanguage = {};
    stat.byLanguage.forEach(item => {
      if (!byLanguage[item.language]) {
        byLanguage[item.language] = { total: 0, accepted: 0 };
      }
      byLanguage[item.language].total++;
      if (item.result === 'accepted') {
        byLanguage[item.language].accepted++;
      }
    });

    // Process result breakdown
    const byResult = {};
    stat.byResult.forEach(result => {
      byResult[result] = (byResult[result] || 0) + 1;
    });

    res.json({
      totalSubmissions: stat.totalSubmissions,
      acceptedSubmissions: stat.acceptedSubmissions,
      successRate,
      averageExecutionTime: Math.round(stat.averageExecutionTime),
      averageMemoryUsed: Math.round(stat.averageMemoryUsed),
      byLanguage,
      byResult
    });
  } catch (error) {
    console.error('Submission stats error:', error);
    res.status(500).json({ error: 'Server error while fetching submission statistics.' });
  }
});

// Get recent submissions for dashboard
router.get('/recent/dashboard', auth, async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const recentSubmissions = await Submission.find({ userId: req.user._id })
      .populate('problemId', 'title difficulty category')
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit));

    res.json({
      recentSubmissions: recentSubmissions.map(sub => ({
        id: sub._id,
        problemTitle: sub.problemId.title,
        problemDifficulty: sub.problemId.difficulty,
        language: sub.language,
        result: sub.result,
        submittedAt: sub.submittedAt,
        executionTime: sub.executionTime
      }))
    });
  } catch (error) {
    console.error('Recent submissions error:', error);
    res.status(500).json({ error: 'Server error while fetching recent submissions.' });
  }
});

// Get submissions for a specific problem
router.get('/problem/:problemId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const submissions = await Submission.find({
      userId: req.user._id,
      problemId: req.params.problemId
    })
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Submission.countDocuments({
      userId: req.user._id,
      problemId: req.params.problemId
    });

    res.json({
      submissions: submissions.map(sub => sub.getSummary()),
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Problem submissions error:', error);
    res.status(500).json({ error: 'Server error while fetching problem submissions.' });
  }
});

// Admin: Get all submissions (admin only)
router.get('/admin/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin only.' });
    }

    const {
      page = 1,
      limit = 20,
      userId,
      problemId,
      result,
      language
    } = req.query;

    const query = {};

    // Apply filters
    if (userId) query.userId = userId;
    if (problemId) query.problemId = problemId;
    if (result) query.result = result;
    if (language) query.language = language;

    const submissions = await Submission.find(query)
      .populate('userId', 'username email')
      .populate('problemId', 'title difficulty')
      .sort({ submittedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Submission.countDocuments(query);

    res.json({
      submissions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Admin submissions error:', error);
    res.status(500).json({ error: 'Server error while fetching admin submissions.' });
  }
});

// Get submission analytics
router.get('/analytics/overview', auth, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const analytics = await Submission.aggregate([
      {
        $match: {
          userId: req.user._id,
          submittedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' }
          },
          submissions: { $sum: 1 },
          accepted: { $sum: { $cond: [{ $eq: ['$result', 'accepted'] }, 1, 0] } },
          averageTime: { $avg: '$executionTime' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({ analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Server error while fetching analytics.' });
  }
});

// Test submission endpoint (does not save submission)
router.post('/test', auth, async (req, res) => {
  const { problemId, code, language } = req.body;
  try {
    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    // Prepare submission object for executor
    const submission = { code, language };
    // Use problem's timeLimit if present, else default
    const execProblem = {
      testCases: problem.testCases,
      timeLimit: problem.timeLimit || 1000
    };

    const execResult = await executeCode(submission, execProblem);
    const testCaseResults = execResult.testResults.map(tc => ({
      input: tc.input,
      expected: tc.expectedOutput,
      output: tc.actualOutput,
      passed: tc.isPassed,
      error: tc.errorMessage || undefined
    }));
    const allPassed = testCaseResults.every(tc => tc.passed);
    res.json({ allPassed, testCaseResults });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run sample input/output (does not save submission)
router.post('/run-sample', auth, async (req, res) => {
  const { problemId, code, language, customInput } = req.body;
  try {
    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const sampleTestCase = {
      input: (customInput !== undefined && customInput !== null && customInput !== '') ? customInput : problem.sampleInput,
      expectedOutput: problem.sampleOutput
    };
    const execProblem = {
      testCases: [sampleTestCase],
      timeLimit: problem.timeLimit || 1000
    };
    const submission = { code, language };
    const execResult = await executeCode(submission, execProblem);
    const tc = execResult.testResults && execResult.testResults[0];
    if (!tc) {
      return res.status(500).json({ error: 'No output returned from code execution.' });
    }
    res.json({
      input: tc.input,
      expected: tc.expectedOutput,
      output: tc.actualOutput,
      passed: tc.isPassed,
      error: tc.errorMessage || undefined
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 