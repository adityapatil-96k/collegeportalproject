const Bookmark = require('../models/Bookmark');
const { Resource } = require('../models/Resource');
const User = require('../models/User');

async function getStudentAccess(userId) {
  const student = await User.findById(userId).select('department year semester role');
  if (!student || student.role !== 'student') {
    const err = new Error('Student access only');
    err.status = 403;
    throw err;
  }
  if (!student.department || !student.year || !student.semester) {
    const err = new Error('Complete your department, year, and semester profile first');
    err.status = 400;
    throw err;
  }
  return {
    department: String(student.department).trim(),
    year: Number(student.year),
    semester: Number(student.semester),
  };
}

// async function createBookmark(req, res) {
//   try {
//     const { resourceId } = req.body || {};
//     if (!resourceId) return res.status(400).json({ message: 'resourceId is required' });

//     const studentAccess = await getStudentAccess(req.user.userId);
//     const exists = await Resource.findById(resourceId).select(
//       '_id department year semester'
//     );
//     if (!exists) return res.status(404).json({ message: 'Resource not found' });
//     if (
//       exists.department !== studentAccess.department ||
//       Number(exists.year) !== studentAccess.year ||
//       Number(exists.semester) !== studentAccess.semester
//     ) {
//       return res.status(403).json({ message: 'Access denied for this resource' });
//     }

//     const bookmark = await Bookmark.findOneAndUpdate(
//       { userId: req.user.userId, resourceId },
//       { $setOnInsert: { userId: req.user.userId, resourceId } },
//       { new: true, upsert: true }
//     ).populate('resourceId');

//     return res.status(201).json({ message: 'Bookmarked', bookmark });
//   } catch (err) {
//     if (err && err.status) {
//       return res.status(err.status).json({ message: err.message });
//     }
//     console.error('createBookmark error:', err);
//     return res.status(500).json({ message: 'Server error while bookmarking' });
//   }
// }

// async function listBookmarks(req, res) {
//   try {
//     const studentAccess = await getStudentAccess(req.user.userId);
//     const bookmarks = await Bookmark.find({ userId: req.user.userId })
//       .populate({
//         path: 'resourceId',
//         match: {
//           department: studentAccess.department,
//           year: studentAccess.year,
//           semester: studentAccess.semester,
//         },
//         populate: { path: 'uploadedBy', select: 'name email' },
//       })
//       .sort({ createdAt: -1 });
//     return res.json({ bookmarks: bookmarks.filter((b) => b.resourceId) });
//   } catch (err) {
//     if (err && err.status) {
//       return res.status(err.status).json({ message: err.message });
//     }
//     console.error('listBookmarks error:', err);
//     return res.status(500).json({ message: 'Server error while fetching bookmarks' });
//   }
// }

// async function deleteBookmark(req, res) {
//   try {
//     const { id } = req.params;
//     const deleted = await Bookmark.findOneAndDelete({
//       _id: id,
//       userId: req.user.userId,
//     });
//     if (!deleted) return res.status(404).json({ message: 'Bookmark not found' });
//     return res.json({ message: 'Bookmark removed' });
//   } catch (err) {
//     console.error('deleteBookmark error:', err);
//     return res.status(500).json({ message: 'Server error while deleting bookmark' });
//   }
// }

// module.exports = { createBookmark, listBookmarks, deleteBookmark };
