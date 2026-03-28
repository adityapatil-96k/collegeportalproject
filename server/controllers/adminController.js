const User = require('../models/User');

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * GET /api/admin/approve/:id — mark teacher as approved (intended for admin email link).
 */
async function approveTeacher(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).send(htmlResponse('Not found', 'No user exists with this ID.', false));
    }

    if (user.role !== 'teacher') {
      return res.status(400).send(htmlResponse('Invalid action', 'This user is not a teacher.', false));
    }

    if (user.isApproved) {
      return res.send(
        htmlResponse('Already approved', `${escapeHtml(user.name)} is already approved.`, true)
      );
    }

    user.isApproved = true;
    await user.save();

    return res.send(
      htmlResponse(
        'Approved',
        `${escapeHtml(user.name)} (${escapeHtml(user.email)}) can now log in.`,
        true
      )
    );
  } catch (err) {
    console.error(err);
    return res.status(500).send(htmlResponse('Error', 'Something went wrong.', false));
  }
}

/**
 * GET /api/admin/reject/:id — remove pending teacher account.
 */
async function rejectTeacher(req, res) {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).send(htmlResponse('Not found', 'No user exists with this ID.', false));
    }

    if (user.role !== 'teacher') {
      return res.status(400).send(htmlResponse('Invalid action', 'This user is not a teacher.', false));
    }

    const name = user.name;
    const email = user.email;
    await User.findByIdAndDelete(id);

    return res.send(
      htmlResponse(
        'Rejected',
        `Registration for ${escapeHtml(name)} (${escapeHtml(email)}) has been rejected and removed.`,
        true
      )
    );
  } catch (err) {
    console.error(err);
    return res.status(500).send(htmlResponse('Error', 'Something went wrong.', false));
  }
}

function htmlResponse(title, message, ok) {
  const color = ok ? '#198754' : '#dc3545';
  const safeTitle = escapeHtml(title);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${safeTitle}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 32rem; margin: 3rem auto; padding: 0 1rem; color: #1a1a1a; }
    h1 { color: ${color}; font-size: 1.5rem; }
    p { line-height: 1.6; }
    a { color: #0d6efd; }
  </style>
</head>
<body>
  <h1>${safeTitle}</h1>
  <p>${message}</p>
  <p><a href="/login.html">Go to login</a></p>
</body>
</html>`;
}

module.exports = { approveTeacher, rejectTeacher };
