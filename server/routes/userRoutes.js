const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole, requireApprovedTeacher } = require('../middleware/roleMiddleware');
const { studentDashboard, teacherDashboard } = require('../controllers/dashboardController');
const {
  updateStudentProfile,
  deleteStudentAccount,
} = require('../controllers/studentController');

const router = express.Router();

router.get('/student-dashboard', authenticate, requireRole('student'), studentDashboard);
router.get('/teacher-dashboard', authenticate, requireApprovedTeacher, teacherDashboard);
router.put('/student-profile', authenticate, requireRole('student'), updateStudentProfile);
router.delete('/student-account', authenticate, requireRole('student'), deleteStudentAccount);

module.exports = router;
