const express = require('express');
const User = require('../models/User');
const Problem = require('../models/Problem');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all students assigned to the teacher
router.get('/students', auth, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    let query = { role: 'student' };
    
    // If teacher, only show their students
    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    }
    
    // Add search functionality
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query)
      .select('-password')
      .populate('assignedProblems.problemId', 'title difficulty category')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Add assignment statistics for each student
    const studentsWithStats = students.map(student => {
      const studentObj = student.toObject();
      const totalAssigned = student.assignedProblems.length;
      const completed = student.assignedProblems.filter(ap => ap.isCompleted).length;
      
      studentObj.assignmentStats = {
        totalAssigned,
        completed,
        pending: totalAssigned - completed,
        completionRate: totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0
      };
      
      return studentObj;
    });

    res.json({
      students: studentsWithStats,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Students fetch error:', error);
    res.status(500).json({ error: 'Server error while fetching students.' });
  }
});

// Assign a problem to a student
router.post('/assign-problem', auth, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { studentId, problemId, dueDate, notes } = req.body;

    if (!studentId || !problemId) {
      return res.status(400).json({ error: 'Student ID and Problem ID are required.' });
    }

    // Verify student exists and is assigned to this teacher
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found.' });
    }

    if (req.user.role === 'teacher' && student.teacher?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only assign problems to your students.' });
    }

    // Verify problem exists
    const problem = await Problem.findById(problemId);
    if (!problem || !problem.isActive) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    // Check if problem is already assigned to this student
    const existingAssignment = student.assignedProblems.find(
      ap => ap.problemId.toString() === problemId
    );

    if (existingAssignment) {
      return res.status(400).json({ error: 'Problem is already assigned to this student.' });
    }

    // Add assignment to student
    student.assignedProblems.push({
      problemId,
      assignedBy: req.user._id,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || ''
    });

    await student.save();

    res.status(201).json({
      message: 'Problem assigned successfully.',
      assignment: {
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        problemId: problem._id,
        problemTitle: problem.title,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || ''
      }
    });
  } catch (error) {
    console.error('Problem assignment error:', error);
    res.status(500).json({ error: 'Server error while assigning problem.' });
  }
});

// Assign a problem to multiple students
router.post('/assign-problem-bulk', auth, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { studentIds, problemId, dueDate, notes } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !problemId) {
      return res.status(400).json({ error: 'Student IDs array and Problem ID are required.' });
    }

    // Verify problem exists
    const problem = await Problem.findById(problemId);
    if (!problem || !problem.isActive) {
      return res.status(404).json({ error: 'Problem not found.' });
    }

    const results = [];
    const errors = [];

    for (const studentId of studentIds) {
      try {
        // Verify student exists and is assigned to this teacher
        const student = await User.findById(studentId);
        if (!student || student.role !== 'student') {
          errors.push({ studentId, error: 'Student not found.' });
          continue;
        }

        if (req.user.role === 'teacher' && student.teacher?.toString() !== req.user._id.toString()) {
          errors.push({ studentId, error: 'Student not assigned to you.' });
          continue;
        }

        // Check if problem is already assigned
        const existingAssignment = student.assignedProblems.find(
          ap => ap.problemId.toString() === problemId
        );

        if (existingAssignment) {
          errors.push({ studentId, error: 'Problem already assigned.' });
          continue;
        }

        // Add assignment
        student.assignedProblems.push({
          problemId,
          assignedBy: req.user._id,
          dueDate: dueDate ? new Date(dueDate) : null,
          notes: notes || ''
        });

        await student.save();

        results.push({
          studentId: student._id,
          studentName: `${student.firstName} ${student.lastName}`,
          success: true
        });
      } catch (error) {
        errors.push({ studentId, error: error.message });
      }
    }

    res.json({
      message: `Assigned problem to ${results.length} students.`,
      results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Bulk assignment error:', error);
    res.status(500).json({ error: 'Server error while assigning problems.' });
  }
});

// Remove problem assignment from a student
router.delete('/unassign-problem/:studentId/:problemId', auth, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { studentId, problemId } = req.params;

    // Verify student exists and is assigned to this teacher
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found.' });
    }

    if (req.user.role === 'teacher' && student.teacher?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only unassign problems from your students.' });
    }

    // Find and remove the assignment
    const assignmentIndex = student.assignedProblems.findIndex(
      ap => ap.problemId.toString() === problemId
    );

    if (assignmentIndex === -1) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    student.assignedProblems.splice(assignmentIndex, 1);
    await student.save();

    res.json({ message: 'Problem assignment removed successfully.' });
  } catch (error) {
    console.error('Unassign problem error:', error);
    res.status(500).json({ error: 'Server error while removing assignment.' });
  }
});

// Get assignments for a specific student
router.get('/student/:studentId/assignments', auth, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { status } = req.query; // 'all', 'pending', 'completed'

    // Verify student exists and is assigned to this teacher
    const student = await User.findById(studentId)
      .populate('assignedProblems.problemId', 'title difficulty category points')
      .populate('assignedProblems.assignedBy', 'firstName lastName');

    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found.' });
    }

    if (req.user.role === 'teacher' && student.teacher?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    let assignments = student.assignedProblems;

    // Filter by status if provided
    if (status && status !== 'all') {
      assignments = assignments.filter(assignment => {
        if (status === 'completed') return assignment.isCompleted;
        if (status === 'pending') return !assignment.isCompleted;
        return true;
      });
    }

    // Sort by due date (pending first, then by due date)
    assignments.sort((a, b) => {
      if (a.isCompleted && !b.isCompleted) return 1;
      if (!a.isCompleted && b.isCompleted) return -1;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return new Date(b.assignedAt) - new Date(a.assignedAt);
    });

    res.json({
      student: {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        username: student.username
      },
      assignments,
      stats: {
        total: student.assignedProblems.length,
        completed: student.assignedProblems.filter(ap => ap.isCompleted).length,
        pending: student.assignedProblems.filter(ap => !ap.isCompleted).length
      }
    });
  } catch (error) {
    console.error('Student assignments error:', error);
    res.status(500).json({ error: 'Server error while fetching student assignments.' });
  }
});

// Mark assignment as completed (for students)
router.put('/assignment/:problemId/complete', auth, requireRole(['student']), async (req, res) => {
  try {
    const { problemId } = req.params;

    const user = await User.findById(req.user._id);
    const assignment = user.assignedProblems.find(
      ap => ap.problemId.toString() === problemId
    );

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    if (assignment.isCompleted) {
      return res.status(400).json({ error: 'Assignment is already marked as completed.' });
    }

    // Check if problem is actually solved
    const isSolved = user.solvedProblems.some(
      sp => sp.problemId.toString() === problemId
    );

    if (!isSolved) {
      return res.status(400).json({ error: 'You must solve the problem before marking it as completed.' });
    }

    assignment.isCompleted = true;
    assignment.completedAt = new Date();
    await user.save();

    res.json({ message: 'Assignment marked as completed.' });
  } catch (error) {
    console.error('Mark assignment complete error:', error);
    res.status(500).json({ error: 'Server error while marking assignment complete.' });
  }
});

// Get teacher dashboard statistics
router.get('/dashboard-stats', auth, requireRole(['teacher', 'admin']), async (req, res) => {
  try {
    let studentQuery = { role: 'student' };
    
    // If teacher, only count their students
    if (req.user.role === 'teacher') {
      studentQuery.teacher = req.user._id;
    }

    const totalStudents = await User.countDocuments(studentQuery);
    
    // Get assignment statistics
    const students = await User.find(studentQuery).populate('assignedProblems.problemId');
    
    let totalAssignments = 0;
    let completedAssignments = 0;
    let overdueAssignments = 0;

    students.forEach(student => {
      totalAssignments += student.assignedProblems.length;
      student.assignedProblems.forEach(assignment => {
        if (assignment.isCompleted) {
          completedAssignments++;
        } else if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
          overdueAssignments++;
        }
      });
    });

    const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;

    res.json({
      totalStudents,
      totalAssignments,
      completedAssignments,
      pendingAssignments: totalAssignments - completedAssignments,
      overdueAssignments,
      completionRate
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error while fetching dashboard statistics.' });
  }
});

module.exports = router; 