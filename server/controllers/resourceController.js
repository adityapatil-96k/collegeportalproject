const crypto = require('crypto');
const {
  Resource,
  RESOURCE_TYPES,
  RESOURCE_YEARS,
  RESOURCE_SEMESTERS,
} = require('../models/Resource');
const { cloudinary } = require('../config/cloudinary');
const Notification = require('../models/Notification');
const User = require('../models/User');

function envTrim(key) {
  const v = process.env[key];
  if (v == null) return '';
  return String(v).replace(/\r/g, '').trim();
}

function slug(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function pickAllowed(obj, keys) {
  const out = {};
  for (const k of keys) {
    if (obj[k] !== undefined) out[k] = obj[k];
  }
  return out;
}

function allowedSemestersForYear(year) {
  if (year === 1) return [1, 2];
  if (year === 2) return [3, 4];
  if (year === 3) return [5, 6];
  return [];
}

async function getStudentAccess(req) {
  if (req.user.role !== 'student') return null;
  const student = await User.findById(req.user.userId).select(
    'department year semester role'
  );
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

function extractCloudPublicIdFromUrl(fileUrl) {
  try {
    const u = new URL(fileUrl);
    const marker = '/upload/';
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return '';

    let tail = u.pathname.slice(idx + marker.length);
    // Remove version chunk if present (e.g., v1700000000/)
    tail = tail.replace(/^v\d+\//, '');
    // Remove file extension
    tail = tail.replace(/\.[^/.]+$/, '');
    return decodeURIComponent(tail);
  } catch {
    return '';
  }
}

/**
 * POST /resources/upload
 * Body (multipart/form-data):
 * - title, description(optional), department, year, subject, type, file(PDF)
 */
async function uploadResource(req, res) {
  try {
    const userId = req.user.userId;

    const {
      title,
      description,
      department,
      year: yearRaw,
      semester: semesterRaw,
      subject,
      type,
    } = req.body || {};

    if (!req.file) {
      return res.status(400).json({ message: 'PDF file is required' });
    }

    const year = Number(yearRaw);
    const semester = Number(semesterRaw);
    const cleanTitle = String(title || '').trim();
    const cleanDesc = String(description || '').trim();
    const cleanDept = String(department || '').trim();
    const cleanSubject = String(subject || '').trim();
    const cleanType = String(type || '').trim();

    if (
      !cleanTitle ||
      !cleanDept ||
      !cleanSubject ||
      !cleanType ||
      !yearRaw ||
      !semesterRaw
    ) {
      return res.status(400).json({
        message: 'title, department, year, semester, subject, and type are required',
      });
    }
    if (!RESOURCE_YEARS.includes(year)) {
      return res.status(400).json({ message: 'year must be 1, 2, or 3' });
    }
    if (!RESOURCE_TYPES.includes(cleanType)) {
      return res.status(400).json({ message: `Invalid type: ${cleanType}` });
    }
    if (!RESOURCE_SEMESTERS.includes(semester)) {
      return res.status(400).json({ message: 'semester must be 1 to 6' });
    }
    if (!allowedSemestersForYear(year).includes(semester)) {
      return res
        .status(400)
        .json({ message: `semester ${semester} does not belong to year ${year}` });
    }

    const cloudinaryFolder = envTrim('CLOUDINARY_FOLDER') || 'college-resources';

    // Upload PDFs as raw files; public_id makes it unique.
    const departmentSlug = slug(cleanDept) || 'department';
    const subjectSlug = slug(cleanSubject) || 'subject';
    const typeSlug = slug(cleanType) || 'type';

    const uniqueId = `${Date.now()}-${crypto.randomUUID()}`;
    const publicId = `res-${departmentSlug}-${year}-${typeSlug}-${subjectSlug}-${uniqueId}`;

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          folder: cloudinaryFolder,
          public_id: publicId,
        },
        (err, result) => {
          if (err) return reject(err);
          return resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    if (!uploadResult || !uploadResult.secure_url) {
      return res.status(500).json({ message: 'Cloudinary upload failed' });
    }

    const doc = await Resource.create({
      title: cleanTitle,
      description: cleanDesc,
      subject: cleanSubject,
      department: cleanDept,
      year,
      semester,
      type: cleanType,
      fileUrl: uploadResult.secure_url,
      cloudPublicId: uploadResult.public_id || `${cloudinaryFolder}/${publicId}`,
      cloudResourceType: uploadResult.resource_type || 'raw',
      uploadedBy: userId,
    });

    const populated = await Resource.findById(doc._id)
      .populate('uploadedBy', 'name email')
      .select('-__v -password');

    const targetStudents = await User.find({
      role: 'student',
      department: cleanDept,
      year,
      semester,
    }).select('_id');
    if (targetStudents.length > 0) {
      const notifications = targetStudents.map((s) => ({
        userId: s._id,
        message: `New ${cleanType} uploaded in ${cleanDept} Year ${year} Sem ${semester}: ${cleanTitle}`,
        resourceId: doc._id,
      }));
      await Notification.insertMany(notifications);
    } else {
      await Notification.create({
        userId: null,
        targetDepartment: cleanDept,
        targetYear: year,
        targetSemester: semester,
        message: `New ${cleanType} uploaded in ${cleanDept} Year ${year} Sem ${semester}: ${cleanTitle}`,
        resourceId: doc._id,
      });
    }

    return res.status(201).json({ message: 'Upload successful', resource: populated });
  } catch (err) {
    console.error('uploadResource error:', err);
    return res.status(500).json({ message: 'Server error during upload' });
  }
}

/**
 * GET /resources?department=&year=&type=
 * Teachers can view all resources; students can also view in this phase.
 */
async function listResources(req, res) {
  try {
    const {
      department,
      year,
      semester,
      type,
      subject,
      sort = 'latest',
      countOnly,
      page = '1',
      limit = '50',
    } = req.query || {};

    const filter = { fileUrl: { $exists: true, $ne: '' } };
    const studentAccess = await getStudentAccess(req);
    if (studentAccess) {
      filter.department = studentAccess.department;
      filter.year = studentAccess.year;
      filter.semester = studentAccess.semester;
    }
    if (department) filter.department = String(department).trim();
    if (year !== undefined && year !== '') {
      const y = Number(year);
      if (!RESOURCE_YEARS.includes(y)) {
        return res.status(400).json({ message: 'year must be 1, 2, or 3' });
      }
      filter.year = y;
    }
    if (type) {
      const t = String(type).trim();
      if (!RESOURCE_TYPES.includes(t)) {
        return res.status(400).json({ message: `Invalid type: ${t}` });
      }
      filter.type = t;
    }
    if (semester !== undefined && semester !== '') {
      const s = Number(semester);
      if (!RESOURCE_SEMESTERS.includes(s)) {
        return res.status(400).json({ message: 'semester must be 1 to 6' });
      }
      filter.semester = s;
    }
    if (studentAccess) {
      filter.department = studentAccess.department;
      filter.year = studentAccess.year;
      filter.semester = studentAccess.semester;
    }
    if (subject) {
      filter.subject = String(subject).trim();
    }

    if (String(countOnly).toLowerCase() === 'true') {
      const count = await Resource.countDocuments(filter);
      return res.json({ count });
    }

    // Sorting
    let sortSpec = { createdAt: -1 };
    const sortKey = String(sort).toLowerCase();
    if (sortKey === 'oldest') sortSpec = { createdAt: 1 };
    if (sortKey === 'az') sortSpec = { title: 1 };
    if (sortKey === 'za') sortSpec = { title: -1 };

    // Pagination
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .populate('uploadedBy', 'name email')
        .sort(sortSpec)
        .skip(skip)
        .limit(limitNum),
      Resource.countDocuments(filter),
    ]);

    return res.json({
      resources,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / limitNum)),
    });
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error('listResources error:', err);
    return res.status(500).json({ message: 'Server error while fetching resources' });
  }
}

async function searchResources(req, res) {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ resources: [] });

    const studentAccess = await getStudentAccess(req);
    const regex = new RegExp(q, 'i');
    const findFilter = {
      fileUrl: { $exists: true, $ne: '' },
      $or: [{ title: regex }, { subject: regex }],
    };
    if (studentAccess) {
      findFilter.department = studentAccess.department;
      findFilter.year = studentAccess.year;
      findFilter.semester = studentAccess.semester;
    }
    const resources = await Resource.find(findFilter)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({ resources });
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error('searchResources error:', err);
    return res.status(500).json({ message: 'Server error while searching resources' });
  }
}

async function trendingResources(req, res) {
  try {
    const sortBy = String(req.query.sortBy || 'downloads').toLowerCase();
    const metric = sortBy === 'views' ? 'views' : 'downloads';
    const studentAccess = await getStudentAccess(req);
    const filter = { fileUrl: { $exists: true, $ne: '' } };
    if (studentAccess) {
      filter.department = studentAccess.department;
      filter.year = studentAccess.year;
      filter.semester = studentAccess.semester;
    }
    const resources = await Resource.find(filter)
      .populate('uploadedBy', 'name email')
      .sort({ [metric]: -1, views: -1, createdAt: -1 })
      .limit(20);
    return res.json({ resources, metric });
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error('trendingResources error:', err);
    return res.status(500).json({ message: 'Server error while fetching trending resources' });
  }
}

/**
 * GET /resources/my
 */
async function listMyResources(req, res) {
  try {
    const resources = await Resource.find({
      uploadedBy: req.user.userId,
      fileUrl: { $exists: true, $ne: '' },
    })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });
    return res.json({ resources });
  } catch (err) {
    console.error('listMyResources error:', err);
    return res.status(500).json({ message: 'Server error while fetching your uploads' });
  }
}

/**
 * PUT /resources/:id (only owner)
 */
async function updateResource(req, res) {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    if (resource.uploadedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only edit your own uploads' });
    }

    const updates = pickAllowed(req.body || {}, [
      'title',
      'description',
      'department',
      'year',
      'semester',
      'subject',
      'type',
    ]);

    if (updates.type !== undefined && !RESOURCE_TYPES.includes(String(updates.type).trim())) {
      return res.status(400).json({ message: `Invalid type: ${updates.type}` });
    }
    if (updates.year !== undefined) {
      const y = Number(updates.year);
      if (!RESOURCE_YEARS.includes(y)) {
        return res.status(400).json({ message: 'year must be 1, 2, or 3' });
      }
      updates.year = y;
    }
    if (updates.semester !== undefined) {
      const s = Number(updates.semester);
      if (!RESOURCE_SEMESTERS.includes(s)) {
        return res.status(400).json({ message: 'semester must be 1 to 6' });
      }
      updates.semester = s;
    }
    const targetYear = updates.year !== undefined ? updates.year : resource.year;
    const targetSemester =
      updates.semester !== undefined ? updates.semester : resource.semester;
    if (!allowedSemestersForYear(targetYear).includes(targetSemester)) {
      return res
        .status(400)
        .json({ message: `semester ${targetSemester} does not belong to year ${targetYear}` });
    }

    if (updates.title !== undefined) updates.title = String(updates.title).trim();
    if (updates.description !== undefined) updates.description = String(updates.description).trim();
    if (updates.department !== undefined) updates.department = String(updates.department).trim();
    if (updates.semester !== undefined) updates.semester = Number(updates.semester);
    if (updates.subject !== undefined) updates.subject = String(updates.subject).trim();
    if (updates.type !== undefined) updates.type = String(updates.type).trim();

    const saved = await Resource.findByIdAndUpdate(id, updates, { new: true });
    const populated = await Resource.findById(saved._id).populate('uploadedBy', 'name email');

    return res.json({ message: 'Resource updated', resource: populated });
  } catch (err) {
    console.error('updateResource error:', err);
    return res.status(500).json({ message: 'Server error while updating resource' });
  }
}

/**
 * DELETE /resources/:id (only owner)
 */
async function deleteResource(req, res) {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id);
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    if (resource.uploadedBy.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'You can only delete your own uploads' });
    }

    const cloudPublicId =
      String(resource.cloudPublicId || '').trim() ||
      extractCloudPublicIdFromUrl(resource.fileUrl);
    const cloudResourceType = String(resource.cloudResourceType || 'raw').trim() || 'raw';

    if (cloudPublicId) {
      const destroyResult = await cloudinary.uploader.destroy(cloudPublicId, {
        resource_type: cloudResourceType,
        invalidate: true,
      });

      // Keep DB and cloud operations in sync; fail delete if cloud destroy fails unexpectedly.
      if (
        destroyResult &&
        destroyResult.result &&
        destroyResult.result !== 'ok' &&
        destroyResult.result !== 'not found'
      ) {
        return res.status(502).json({
          message: 'Failed to delete file from cloud storage. Try again.',
        });
      }
    }

    await Resource.findByIdAndDelete(id);
    return res.json({ message: 'Resource deleted' });
  } catch (err) {
    console.error('deleteResource error:', err);
    return res.status(500).json({ message: 'Server error while deleting resource' });
  }
}

/**
 * GET /resources/:id/view
 * Streams the PDF to the browser with Content-Disposition: inline.
 * This avoids browser-triggered "download" behavior where possible.
 */
async function viewResource(req, res) {
  try {
    const { id } = req.params;
    const resource = await Resource.findById(id).select(
      'fileUrl title department year semester'
    );
    if (!resource) return res.status(404).json({ message: 'Resource not found' });

    if (!resource.fileUrl) {
      return res.status(500).json({ message: 'Resource has no fileUrl' });
    }

    const studentAccess = await getStudentAccess(req);
    if (
      studentAccess &&
      (resource.department !== studentAccess.department ||
        Number(resource.year) !== studentAccess.year ||
        Number(resource.semester) !== studentAccess.semester)
    ) {
      return res.status(403).json({ message: 'Access denied for this resource' });
    }

    await Resource.updateOne({ _id: id }, { $inc: { views: 1 } });

    const upstream = await fetch(resource.fileUrl);
    if (!upstream.ok) {
      return res.status(502).json({ message: 'Failed to fetch file from storage' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    // Ask browser to show inline instead of forcing download.
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${String(resource.title || 'resource').replace(/"/g, '')}.pdf"`
    );

    // In Node 18+ fetch, response.body can be a WebStream (not Node stream),
    // so we convert to Buffer for reliability.
    const ab = await upstream.arrayBuffer();
    const buf = Buffer.from(ab);
    return res.end(buf);
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error('viewResource error:', err);
    return res.status(500).json({ message: 'Server error while viewing resource' });
  }
}

async function trackDownload(req, res) {
  try {
    const { id } = req.params;
    const studentAccess = await getStudentAccess(req);
    const resource = await Resource.findById(id).select(
      'fileUrl department year semester'
    );
    if (!resource) return res.status(404).json({ message: 'Resource not found' });
    if (
      studentAccess &&
      (resource.department !== studentAccess.department ||
        Number(resource.year) !== studentAccess.year ||
        Number(resource.semester) !== studentAccess.semester)
    ) {
      return res.status(403).json({ message: 'Access denied for this resource' });
    }
    await Resource.updateOne({ _id: id }, { $inc: { downloads: 1 } });
    return res.json({ message: 'Download tracked', fileUrl: resource.fileUrl });
  } catch (err) {
    if (err && err.status) {
      return res.status(err.status).json({ message: err.message });
    }
    console.error('trackDownload error:', err);
    return res.status(500).json({ message: 'Server error while tracking download' });
  }
}

module.exports = {
  uploadResource,
  listResources,
  searchResources,
  trendingResources,
  listMyResources,
  updateResource,
  deleteResource,
  viewResource,
  trackDownload,
};
