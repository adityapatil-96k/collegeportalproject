const mongoose = require('mongoose');

// const notificationSchema = new mongoose.Schema(
//   {
//     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
//     message: { type: String, required: true, trim: true },
//     resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
//     targetDepartment: { type: String, trim: true, default: '' },
//     targetYear: { type: Number, default: null },
//     targetSemester: { type: Number, default: null },
//     isRead: { type: Boolean, default: false },
//   },
//   { timestamps: { createdAt: true, updatedAt: false } }
// );

// module.exports = mongoose.model('Notification', notificationSchema);
