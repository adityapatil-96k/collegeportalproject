const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const {
  uploadResource,
  listResources,
  searchResources,
  trendingResources,
  listMyResources,
  updateResource,
  deleteResource,
  viewResource,
  trackDownload,
} = require('../controllers/resourceController');
const {
  createBookmark,
  listBookmarks,
  deleteBookmark,
} = require('../controllers/bookmarkController');
const {
  listNotifications,
  markNotificationRead,
} = require('../controllers/notificationController');

function pdfFileFilter(req, file, cb) {
  const isPdf =
    file.mimetype === 'application/pdf' ||
    (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'));
  if (!isPdf) {
    return cb(new Error('Only PDF files are allowed'), false);
  }
  return cb(null, true);
}

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: pdfFileFilter,
});

const router = express.Router();

router.post(
  '/resources/upload',
  authenticate,
  requireRole('teacher'),
  upload.single('file'),
  (req, res, next) => {
    // Multer stores file errors in req by throwing; handle gracefully.
    next();
  },
  async (req, res) => {
    try {
      await uploadResource(req, res);
    } catch (e) {
      res.status(500).json({ message: 'Upload failed' });
    }
  }
);

router.get('/resources', authenticate, async (req, res, next) => {
  try {
    await listResources(req, res, next);
  } catch (e) {
    next(e);
  }
});

router.get('/resources/search', authenticate, requireRole('student', 'teacher'), searchResources);
router.get('/resources/trending', authenticate, requireRole('student', 'teacher'), trendingResources);

// View PDF inline (teacher/student can view)
router.get(
  '/resources/:id/view',
  authenticate,
  requireRole('student', 'teacher'),
  viewResource
);
router.post('/resources/:id/download', authenticate, requireRole('student', 'teacher'), trackDownload);

router.get('/resources/my', authenticate, requireRole('teacher'), listMyResources);

router.post('/bookmarks', authenticate, requireRole('student'), createBookmark);
router.get('/bookmarks', authenticate, requireRole('student'), listBookmarks);
router.delete('/bookmarks/:id', authenticate, requireRole('student'), deleteBookmark);

router.get('/notifications', authenticate, requireRole('student'), listNotifications);
router.put('/notifications/read/:id', authenticate, requireRole('student'), markNotificationRead);

router.put('/resources/:id', authenticate, requireRole('teacher'), updateResource);
router.delete('/resources/:id', authenticate, requireRole('teacher'), deleteResource);

// Basic error handler for multer errors (PDF/type/size).
router.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ message: err.message || 'Upload error' });
  }
  next();
});

module.exports = router;
