const express = require('express');
const { approveTeacher, rejectTeacher } = require('../controllers/adminController');

const router = express.Router();

router.get('/approve/:id', approveTeacher);
router.get('/reject/:id', rejectTeacher);

module.exports = router;
