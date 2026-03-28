const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['student', 'teacher'],
      required: true,
    },
    isApproved: {
      type: Boolean,
      required: true,
    },
    department: {
      type: String,
      trim: true,
      default: '',
    },
    year: {
      type: Number,
      min: 1,
      max: 3,
      default: null,
    },
    semester: {
      type: Number,
      min: 1,
      max: 6,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

module.exports = mongoose.model('User', userSchema);
