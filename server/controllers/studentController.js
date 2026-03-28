const User = require('../models/User');
const Bookmark = require('../models/Bookmark');
const Notification = require('../models/Notification');

function allowedSemestersForYear(year) {
  if (year === 1) return [1, 2];
  if (year === 2) return [3, 4];
  if (year === 3) return [5, 6];
  return [];
}

async function updateStudentProfile(req, res) {
  try {
    const { department, year, semester } = req.body || {};
    const student = await User.findOne({ _id: req.user.userId, role: 'student' });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const hasProfile = Boolean(student.department && student.year && student.semester);
    if (!hasProfile && (!department || !year || !semester)) {
      return res
        .status(400)
        .json({ message: 'department, year, semester are required for first setup' });
    }
    if (hasProfile && semester === undefined) {
      return res.status(400).json({ message: 'semester is required' });
    }
    if (hasProfile && (department !== undefined || year !== undefined)) {
      return res.status(400).json({ message: 'department and year cannot be changed' });
    }

    const yearNum = hasProfile ? Number(student.year) : Number(year);
    const semesterNum = Number(semester);
    if (![1, 2, 3].includes(yearNum)) {
      return res.status(400).json({ message: 'year must be 1, 2, or 3' });
    }
    if (![1, 2, 3, 4, 5, 6].includes(semesterNum)) {
      return res.status(400).json({ message: 'semester must be 1, 2, 3, 4, 5, or 6' });
    }
    if (!allowedSemestersForYear(yearNum).includes(semesterNum)) {
      return res
        .status(400)
        .json({ message: `semester ${semesterNum} does not belong to year ${yearNum}` });
    }

    const updateDoc = hasProfile
      ? { semester: semesterNum }
      : {
          department: String(department).trim(),
          year: yearNum,
          semester: semesterNum,
        };

    const updated = await User.findByIdAndUpdate(req.user.userId, updateDoc, {
      new: true,
    }).select('-password');

    if (!updated) return res.status(404).json({ message: 'Student not found' });
    return res.json({ message: 'Profile updated', user: updated });
  } catch (err) {
    console.error('updateStudentProfile error:', err);
    return res.status(500).json({ message: 'Server error while updating profile' });
  }
}

async function deleteStudentAccount(req, res) {
  try {
    const student = await User.findOne({ _id: req.user.userId, role: 'student' }).select('_id');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    await Promise.all([
      Bookmark.deleteMany({ userId: student._id }),
      Notification.deleteMany({ userId: student._id }),
      User.deleteOne({ _id: student._id }),
    ]);

    res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
    return res.json({ message: 'Student account deleted' });
  } catch (err) {
    console.error('deleteStudentAccount error:', err);
    return res.status(500).json({ message: 'Server error while deleting account' });
  }
}

module.exports = { updateStudentProfile, deleteStudentAccount };
