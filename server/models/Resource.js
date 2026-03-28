const mongoose = require('mongoose');

const RESOURCE_TYPES = [
  'Syllabus',
  'Lab Manual',
  'Textbook',
  'Assignment',
  'PYQ',
  'Microproject',
];

const RESOURCE_YEARS = [1, 2, 3];
const RESOURCE_SEMESTERS = [1, 2, 3, 4, 5, 6];

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: false, trim: true, default: '' },
    subject: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    year: { type: Number, required: true, enum: RESOURCE_YEARS },
    semester: { type: Number, required: true, enum: RESOURCE_SEMESTERS },
    type: { type: String, required: true, enum: RESOURCE_TYPES },
    fileUrl: { type: String, required: true, trim: true },
    cloudPublicId: { type: String, trim: true, default: '' },
    cloudResourceType: { type: String, trim: true, default: 'raw' },
    views: { type: Number, default: 0, min: 0 },
    downloads: { type: Number, default: 0, min: 0 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = {
  Resource: mongoose.model('Resource', resourceSchema),
  RESOURCE_TYPES,
  RESOURCE_YEARS,
  RESOURCE_SEMESTERS,
};
