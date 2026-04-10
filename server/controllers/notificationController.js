const Notification = require('../models/Notification');
const User = require('../models/User');

// async function listNotifications(req, res) {
//   try {
//     const me = await User.findById(req.user.userId).select('department year semester');
//     const filter = {
//       $or: [{ userId: req.user.userId }],
//     };

//     if (me?.department && me?.year && me?.semester) {
//       filter.$or.push({
//         userId: null,
//         targetDepartment: me.department,
//         targetYear: me.year,
//         targetSemester: me.semester,
//       });
//     }

//     const notifications = await Notification.find(filter)
//       .populate('resourceId', 'title subject department year semester type')
//       .sort({ createdAt: -1 })
//       .limit(100);

//     const unreadCount = notifications.reduce((sum, n) => sum + (n.isRead ? 0 : 1), 0);
//     return res.json({ notifications, unreadCount });
//   } catch (err) {
//     console.error('listNotifications error:', err);
//     return res.status(500).json({ message: 'Server error while fetching notifications' });
//   }
// }

// async function markNotificationRead(req, res) {
//   try {
//     const { id } = req.params;
//     const notification = await Notification.findById(id);
//     if (!notification) return res.status(404).json({ message: 'Notification not found' });

//     if (notification.userId && notification.userId.toString() !== req.user.userId) {
//       return res.status(403).json({ message: 'Not allowed' });
//     }

//     const updated = await Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
//     return res.json({ message: 'Marked as read', notification: updated });
//   } catch (err) {
//     console.error('markNotificationRead error:', err);
//     return res.status(500).json({ message: 'Server error while updating notification' });
//   }
// }

// module.exports = { listNotifications, markNotificationRead };
