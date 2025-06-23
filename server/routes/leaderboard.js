const express = require('express');
const User = require('../models/User');
const Submission = require('../models/Submission');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get global leaderboard
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, timeframe = 'all' } = req.query;

    let dateFilter = {};
    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { 'solvedProblems.solvedAt': { $gte: weekAgo } };
    } else if (timeframe === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { 'solvedProblems.solvedAt': { $gte: monthAgo } };
    }

    const leaderboard = await User.aggregate([
      { $match: { isActive: true, ...dateFilter } },
      {
        $addFields: {
          solvedCount: { $size: '$solvedProblems' }
        }
      },
      {
        $project: {
          username: 1,
          firstName: 1,
          lastName: 1,
          points: 1,
          rank: 1,
          solvedCount: 1,
          achievements: 1,
          lastLogin: 1
        }
      },
      { $sort: { points: -1, solvedCount: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);

    const total = await User.countDocuments({ isActive: true });

    // Add user's position if authenticated
    let userPosition = null;
    if (req.user) {
      const userRank = await User.aggregate([
        { $match: { isActive: true, ...dateFilter } },
        { $sort: { points: -1, 'solvedProblems': -1 } },
        { $group: { _id: null, users: { $push: '$_id' } } }
      ]);

      if (userRank.length > 0) {
        const position = userRank[0].users.findIndex(id => id.toString() === req.user._id.toString());
        userPosition = position + 1;
      }
    }

    res.json({
      leaderboard,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      userPosition,
      timeframe
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error while fetching leaderboard.' });
  }
});

// Get category-specific leaderboard
router.get('/category/:category', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { category } = req.params;

    const leaderboard = await User.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'problems',
          localField: 'solvedProblems.problemId',
          foreignField: '_id',
          as: 'problemDetails'
        }
      },
      {
        $addFields: {
          categoryProblems: {
            $filter: {
              input: '$problemDetails',
              cond: { $eq: ['$$this.category', category] }
            }
          }
        }
      },
      {
        $addFields: {
          categoryPoints: {
            $sum: '$categoryProblems.points'
          },
          categorySolved: {
            $size: '$categoryProblems'
          }
        }
      },
      {
        $match: {
          categorySolved: { $gt: 0 }
        }
      },
      {
        $project: {
          username: 1,
          firstName: 1,
          lastName: 1,
          categoryPoints: 1,
          categorySolved: 1,
          rank: 1,
          lastLogin: 1
        }
      },
      { $sort: { categoryPoints: -1, categorySolved: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);

    const total = await User.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'problems',
          localField: 'solvedProblems.problemId',
          foreignField: '_id',
          as: 'problemDetails'
        }
      },
      {
        $addFields: {
          categoryProblems: {
            $filter: {
              input: '$problemDetails',
              cond: { $eq: ['$$this.category', category] }
            }
          }
        }
      },
      {
        $match: {
          $expr: { $gt: [{ $size: '$categoryProblems' }, 0] }
        }
      },
      { $count: 'total' }
    ]);

    const totalCount = total.length > 0 ? total[0].total : 0;

    res.json({
      leaderboard,
      category,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      total: totalCount
    });
  } catch (error) {
    console.error('Category leaderboard error:', error);
    res.status(500).json({ error: 'Server error while fetching category leaderboard.' });
  }
});

// Get difficulty-specific leaderboard
router.get('/difficulty/:difficulty', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { difficulty } = req.params;

    const leaderboard = await User.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'problems',
          localField: 'solvedProblems.problemId',
          foreignField: '_id',
          as: 'problemDetails'
        }
      },
      {
        $addFields: {
          difficultyProblems: {
            $filter: {
              input: '$problemDetails',
              cond: { $eq: ['$$this.difficulty', difficulty] }
            }
          }
        }
      },
      {
        $addFields: {
          difficultyPoints: {
            $sum: '$difficultyProblems.points'
          },
          difficultySolved: {
            $size: '$difficultyProblems'
          }
        }
      },
      {
        $match: {
          difficultySolved: { $gt: 0 }
        }
      },
      {
        $project: {
          username: 1,
          firstName: 1,
          lastName: 1,
          difficultyPoints: 1,
          difficultySolved: 1,
          rank: 1,
          lastLogin: 1
        }
      },
      { $sort: { difficultyPoints: -1, difficultySolved: -1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);

    const total = await User.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'problems',
          localField: 'solvedProblems.problemId',
          foreignField: '_id',
          as: 'problemDetails'
        }
      },
      {
        $addFields: {
          difficultyProblems: {
            $filter: {
              input: '$problemDetails',
              cond: { $eq: ['$$this.difficulty', difficulty] }
            }
          }
        }
      },
      {
        $match: {
          $expr: { $gt: [{ $size: '$difficultyProblems' }, 0] }
        }
      },
      { $count: 'total' }
    ]);

    const totalCount = total.length > 0 ? total[0].total : 0;

    res.json({
      leaderboard,
      difficulty,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      total: totalCount
    });
  } catch (error) {
    console.error('Difficulty leaderboard error:', error);
    res.status(500).json({ error: 'Server error while fetching difficulty leaderboard.' });
  }
});

// Get user's ranking details
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('username firstName lastName points rank solvedProblems achievements lastLogin')
      .populate('solvedProblems.problemId', 'title difficulty category points');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Calculate global position
    const globalPosition = await User.countDocuments({
      points: { $gt: user.points }
    }) + 1;

    // Calculate category rankings
    const categoryStats = {};
    user.solvedProblems.forEach(solved => {
      if (solved.problemId) {
        const category = solved.problemId.category;
        if (!categoryStats[category]) {
          categoryStats[category] = { solved: 0, points: 0 };
        }
        categoryStats[category].solved++;
        categoryStats[category].points += solved.problemId.points;
      }
    });

    // Get recent activity
    const recentSubmissions = await Submission.find({ userId: user._id })
      .populate('problemId', 'title difficulty')
      .sort({ submittedAt: -1 })
      .limit(5);

    res.json({
      user: {
        ...user.toJSON(),
        globalPosition,
        categoryStats,
        recentActivity: recentSubmissions.map(sub => ({
          problemTitle: sub.problemId.title,
          result: sub.result,
          submittedAt: sub.submittedAt
        }))
      }
    });
  } catch (error) {
    console.error('User ranking error:', error);
    res.status(500).json({ error: 'Server error while fetching user ranking.' });
  }
});

// Get top performers by language
router.get('/language/:language', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { language } = req.params;

    const leaderboard = await Submission.aggregate([
      { $match: { language, result: 'accepted' } },
      {
        $group: {
          _id: '$userId',
          totalAccepted: { $sum: 1 },
          averageExecutionTime: { $avg: '$executionTime' },
          totalExecutionTime: { $sum: '$executionTime' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails'
        }
      },
      { $unwind: '$userDetails' },
      { $match: { 'userDetails.isActive': true } },
      {
        $project: {
          username: '$userDetails.username',
          firstName: '$userDetails.firstName',
          lastName: '$userDetails.lastName',
          totalAccepted: 1,
          averageExecutionTime: 1,
          totalExecutionTime: 1
        }
      },
      { $sort: { totalAccepted: -1, averageExecutionTime: 1 } },
      { $skip: (parseInt(page) - 1) * parseInt(limit) },
      { $limit: parseInt(limit) }
    ]);

    const total = await Submission.aggregate([
      { $match: { language, result: 'accepted' } },
      { $group: { _id: '$userId' } },
      { $count: 'total' }
    ]);

    const totalCount = total.length > 0 ? total[0].total : 0;

    res.json({
      leaderboard,
      language,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: parseInt(page),
      total: totalCount
    });
  } catch (error) {
    console.error('Language leaderboard error:', error);
    res.status(500).json({ error: 'Server error while fetching language leaderboard.' });
  }
});

// Get leaderboard statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalPoints: { $sum: '$points' },
          averagePoints: { $avg: '$points' },
          byRank: {
            $push: '$rank'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        totalUsers: 0,
        totalPoints: 0,
        averagePoints: 0,
        byRank: {}
      });
    }

    const stat = stats[0];
    
    // Process rank breakdown
    const byRank = {};
    stat.byRank.forEach(rank => {
      byRank[rank] = (byRank[rank] || 0) + 1;
    });

    res.json({
      totalUsers: stat.totalUsers,
      totalPoints: stat.totalPoints,
      averagePoints: Math.round(stat.averagePoints),
      byRank
    });
  } catch (error) {
    console.error('Leaderboard stats error:', error);
    res.status(500).json({ error: 'Server error while fetching leaderboard statistics.' });
  }
});

module.exports = router; 