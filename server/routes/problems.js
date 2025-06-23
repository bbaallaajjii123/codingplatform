const express = require('express');
const Problem = require('../models/Problem');
const Submission = require('../models/Submission');
const User = require('../models/User');
const { auth, optionalAuth, requireRole } = require('../middleware/auth');
const { executeCode } = require('../utils/codeExecutor');

const router = express.Router();

// Get all problems with filtering and pagination
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      difficulty,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { isActive: true };

    // Apply filters
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const problems = await Problem.find(query)
      .select('-testCases -solution')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Problem.countDocuments(query);

    // Add user-specific data if authenticated
    if (req.user) {
      const user = await User.findById(req.user._id);
      const solvedProblemIds = user.solvedProblems.map(sp => sp.problemId.toString());
      
      problems.forEach(problem => {
        problem = problem.toObject();
        problem.isSolved = solvedProblemIds.includes(problem._id.toString());
      });
    }

    res.json({
      problems,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNext: page * limit < total,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Problems fetch error:', error);
    res.status(500).json({ error: 'Server error while fetching problems.' });
  }
});

// Get specific problem by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .populate('createdBy', 'username firstName lastName');

    if (!problem) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    if (!problem.isActive) {
      return res.status(404).json({ error: 'Problem is not available.' });
    }

    // Remove hidden test cases and solution for non-admin users
    const problemData = problem.toObject();
    if (!req.user || req.user.role !== 'admin') {
      problemData.testCases = problemData.testCases.filter(tc => !tc.isHidden);
      delete problemData.solution;
    }

    // Add user-specific data if authenticated
    if (req.user) {
      const user = await User.findById(req.user._id);
      const solvedProblem = user.solvedProblems.find(sp => 
        sp.problemId.toString() === req.params.id
      );
      
      problemData.isSolved = !!solvedProblem;
      if (solvedProblem) {
        problemData.solvedAt = solvedProblem.solvedAt;
        problemData.solvedLanguage = solvedProblem.language;
      }
    }

    res.json({ problem: problemData });
  } catch (error) {
    console.error('Problem fetch error:', error);
    res.status(500).json({ error: 'Server error while fetching problem.' });
  }
});

// Submit solution for a problem
router.post('/:id/submit', auth, async (req, res) => {
  try {
    const { code, language } = req.body;
    const problemId = req.params.id;

    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required.' });
    }

    // Validate language
    const validLanguages = ['javascript', 'python', 'java', 'cpp', 'c', 'csharp', 'php', 'ruby', 'go', 'rust'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({ error: 'Invalid programming language.' });
    }

    // Get problem
    const problem = await Problem.findById(problemId);
    if (!problem || !problem.isActive) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    // Create submission
    const submission = new Submission({
      userId: req.user._id,
      problemId,
      code,
      language,
      status: 'pending'
    });

    await submission.save();

    // Execute code asynchronously
    executeCode(submission, problem)
      .then(async (result) => {
        submission.status = 'completed';
        submission.result = result.result;
        submission.testResults = result.testResults;
        submission.executionTime = result.executionTime;
        submission.memoryUsed = result.memoryUsed;
        submission.errorMessage = result.errorMessage;
        submission.completedAt = new Date();
        submission.score = submission.calculateScore();

        await submission.save();

        // Update problem statistics
        problem.submissions.total++;
        if (result.result === 'accepted') {
          problem.submissions.successful++;
        }
        problem.successRate = problem.calculateSuccessRate();
        await problem.save();

        // Update user if first successful submission
        if (result.result === 'accepted') {
          const user = await User.findById(req.user._id);
          const alreadySolved = user.solvedProblems.some(sp => 
            sp.problemId.toString() === problemId
          );

          if (!alreadySolved) {
            user.points += problem.points;
            user.rank = user.calculateRank();
            user.solvedProblems.push({
              problemId,
              solvedAt: new Date(),
              language,
              executionTime: result.executionTime,
              memoryUsed: result.memoryUsed
            });

            // Add achievement for first solve
            if (user.solvedProblems.length === 1) {
              user.achievements.push({
                name: 'First Victory',
                description: 'Solved your first problem!'
              });
            }

            await user.save();
          }
        }
      })
      .catch(async (error) => {
        console.error('Code execution error:', error);
        submission.status = 'failed';
        submission.result = 'runtime_error';
        submission.errorMessage = error.message;
        submission.completedAt = new Date();
        await submission.save();
      });

    res.json({
      message: 'Submission received. Processing...',
      submissionId: submission._id
    });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ error: 'Server error while submitting solution.' });
  }
});

// Get submission status
router.get('/:id/submission/:submissionId', auth, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.submissionId)
      .populate('problemId', 'title');

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    if (submission.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.json({ submission: submission.getSummary() });
  } catch (error) {
    console.error('Submission status error:', error);
    res.status(500).json({ error: 'Server error while fetching submission status.' });
  }
});

// Admin: Create new problem
router.post('/', auth, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      category,
      tags,
      points,
      timeLimit,
      memoryLimit,
      testCases,
      sampleInput,
      sampleOutput,
      constraints,
      hints
    } = req.body;

    // Validation
    if (!title || !description || !difficulty || !category || !points || !testCases) {
      return res.status(400).json({ error: 'Required fields are missing.' });
    }

    if (testCases.length === 0) {
      return res.status(400).json({ error: 'At least one test case is required.' });
    }

    const problem = new Problem({
      title,
      description,
      difficulty,
      category,
      tags: tags || [],
      points,
      timeLimit: timeLimit || 1000,
      memoryLimit: memoryLimit || 128,
      testCases,
      sampleInput,
      sampleOutput,
      constraints: constraints || '',
      hints: hints || [],
      createdBy: req.user._id
    });

    await problem.save();

    res.status(201).json({
      message: 'Problem created successfully.',
      problem: {
        id: problem._id,
        title: problem.title,
        difficulty: problem.difficulty,
        category: problem.category
      }
    });
  } catch (error) {
    console.error('Problem creation error:', error);
    res.status(500).json({ error: 'Server error while creating problem.' });
  }
});

// Admin: Update problem
router.put('/:id', auth, requireRole(['admin', 'teacher']), async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    // Only allow updates if user is admin or the creator
    if (req.user.role !== 'admin' && problem.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const updatedProblem = await Problem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Problem updated successfully.',
      problem: updatedProblem
    });
  } catch (error) {
    console.error('Problem update error:', error);
    res.status(500).json({ error: 'Server error while updating problem.' });
  }
});

// Admin: Delete problem
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    
    if (!problem) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    // Soft delete by setting isActive to false
    problem.isActive = false;
    await problem.save();

    res.json({ message: 'Problem deleted successfully.' });
  } catch (error) {
    console.error('Problem deletion error:', error);
    res.status(500).json({ error: 'Server error while deleting problem.' });
  }
});

// Get problem categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Problem.distinct('category', { isActive: true });
    res.json({ categories });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Server error while fetching categories.' });
  }
});

// Get problem statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await Problem.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProblems: { $sum: 1 },
          totalSubmissions: { $sum: '$submissions.total' },
          totalSuccessful: { $sum: '$submissions.successful' },
          averageSuccessRate: { $avg: '$successRate' },
          byDifficulty: {
            $push: {
              difficulty: '$difficulty',
              count: 1
            }
          },
          byCategory: {
            $push: {
              category: '$category',
              count: 1
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        totalProblems: 0,
        totalSubmissions: 0,
        totalSuccessful: 0,
        averageSuccessRate: 0,
        byDifficulty: {},
        byCategory: {}
      });
    }

    const stat = stats[0];
    
    // Process difficulty breakdown
    const byDifficulty = {};
    stat.byDifficulty.forEach(item => {
      byDifficulty[item.difficulty] = (byDifficulty[item.difficulty] || 0) + item.count;
    });

    // Process category breakdown
    const byCategory = {};
    stat.byCategory.forEach(item => {
      byCategory[item.category] = (byCategory[item.category] || 0) + item.count;
    });

    res.json({
      totalProblems: stat.totalProblems,
      totalSubmissions: stat.totalSubmissions,
      totalSuccessful: stat.totalSuccessful,
      averageSuccessRate: Math.round(stat.averageSuccessRate),
      byDifficulty,
      byCategory
    });
  } catch (error) {
    console.error('Stats overview error:', error);
    res.status(500).json({ error: 'Server error while fetching statistics.' });
  }
});

module.exports = router; 