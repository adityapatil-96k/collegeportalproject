const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();
const outDir = path.join(root, 'table_exports');
const htmlDir = path.join(outDir, '.html');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const tables = [
  {
    number: '1.1',
    title: 'Comparison of Existing Systems',
    headers: ['System/Approach', 'Strength', 'Limitation', 'Gap Addressed by Project'],
    rows: [
      ['WhatsApp sharing', 'Fast distribution', 'No structure, hard search', 'Central categorized resource library'],
      ['Email attachments', 'Direct delivery', 'Version duplication, inbox clutter', 'Single canonical uploaded resource'],
      ['Google Drive folders', 'Cloud access', 'Weak role control, inconsistent naming', 'Role-based access + filters'],
      ['Printed notes/manual sharing', 'Offline access', 'Limited copies, hard updates', 'Always-available digital PDFs'],
    ],
  },
  {
    number: '3.1',
    title: 'Functional Requirements of the System',
    headers: ['ID', 'Requirement', 'Description'],
    rows: [
      ['FR-01', 'User Registration/Login', 'Student and teacher can register/login with JWT-based authentication.'],
      ['FR-02', 'Teacher Approval Workflow', 'Teacher accounts stay pending until admin approves via email link.'],
      ['FR-03', 'Resource Upload', 'Approved teachers upload PDF resources with metadata (dept/year/semester/type).'],
      ['FR-04', 'Resource Browsing', 'Students/teachers browse resources using department/year/semester/type filters.'],
      ['FR-05', 'Resource Search', 'Users search resources by title/subject keywords.'],
      ['FR-06', 'Bookmarks', 'Students add/remove bookmarks and view bookmarked resources.'],
      ['FR-07', 'Notifications', 'Students receive and mark notifications as read.'],
      ['FR-08', 'Profile Management', 'Students set profile and update year/semester with valid semester mapping.'],
      ['FR-09', 'Access Control', 'APIs enforce role-based authorization for student/teacher-only actions.'],
      ['FR-10', 'Resource Analytics', 'System tracks views and downloads for resources.'],
    ],
  },
  {
    number: '3.2',
    title: 'Non-Functional Requirements of the System',
    headers: ['Category', 'Requirement', 'Current Implementation'],
    rows: [
      ['Security', 'Protected APIs and role authorization', 'JWT auth middleware + role middleware on routes.'],
      ['Availability', 'Cloud deployment for continuous access', 'Frontend on Vercel, backend on Render.'],
      ['Scalability', 'Handle growing resources/users', 'MongoDB Atlas + Cloudinary offloaded file storage.'],
      ['Performance', 'Responsive browsing/search', 'Indexed Mongo queries + pagination/filter support.'],
      ['Usability', 'Mobile-friendly modern UI', 'React + Tailwind style patterns with dashboard flows.'],
      ['Maintainability', 'Modular backend architecture', 'Controllers, routes, models, services separation.'],
      ['Reliability', 'Deterministic teacher approval flow', 'Registration fails if admin approval email is not sent.'],
    ],
  },
  {
    number: '4.1',
    title: 'User Roles and Permissions',
    headers: ['Role', 'Permissions', 'Restricted Actions'],
    rows: [
      ['Student', 'Login, browse/search resources, view/download, bookmark, notifications, profile update, delete account', 'Cannot upload/edit/delete teacher resources'],
      ['Teacher (Approved)', 'Login, upload resources, view own uploads, update/delete own resources, browse/search resources', 'Cannot access student-only bookmarks/notifications APIs'],
      ['Teacher (Pending)', 'Can register, cannot access teacher dashboard until approval', 'Cannot upload or manage resources'],
      ['Admin (Email-based)', 'Approve/reject teacher registration via secure links', 'No dedicated admin dashboard in current phase'],
    ],
  },
  {
    number: '5.1',
    title: 'Database Schema – Users Collection',
    headers: ['Field', 'Type', 'Constraints/Default'],
    rows: [
      ['name', 'String', 'required, trim'],
      ['email', 'String', 'required, unique, lowercase, trim'],
      ['password', 'String', 'required, minlength: 6'],
      ['role', 'String', 'required, enum: student|teacher'],
      ['isApproved', 'Boolean', 'required'],
      ['department', 'String', 'default: ""'],
      ['year', 'Number', 'min:1, max:3, default:null'],
      ['semester', 'Number', 'min:1, max:6, default:null'],
      ['created_at', 'Date', 'auto timestamp'],
    ],
  },
  {
    number: '5.2',
    title: 'Database Schema – Resources Collection',
    headers: ['Field', 'Type', 'Constraints/Default'],
    rows: [
      ['title', 'String', 'required, trim'],
      ['description', 'String', 'default: ""'],
      ['subject', 'String', 'required'],
      ['department', 'String', 'required'],
      ['year', 'Number', 'required, enum: 1|2|3'],
      ['semester', 'Number', 'required, enum: 1..6'],
      ['type', 'String', 'required, enum: Syllabus/Lab Manual/Textbook/Assignment/PYQ/Microproject'],
      ['fileUrl', 'String', 'required'],
      ['cloudPublicId', 'String', 'default: ""'],
      ['cloudResourceType', 'String', 'default: raw'],
      ['views', 'Number', 'default: 0'],
      ['downloads', 'Number', 'default: 0'],
      ['uploadedBy', 'ObjectId(User)', 'required'],
    ],
  },
  {
    number: '5.3',
    title: 'Database Schema – Notifications Collection',
    headers: ['Field', 'Type', 'Constraints/Default'],
    rows: [
      ['userId', 'ObjectId(User)', 'default: null'],
      ['message', 'String', 'required'],
      ['resourceId', 'ObjectId(Resource)', 'required'],
      ['targetDepartment', 'String', 'default: ""'],
      ['targetYear', 'Number', 'default: null'],
      ['targetSemester', 'Number', 'default: null'],
      ['isRead', 'Boolean', 'default: false'],
      ['createdAt', 'Date', 'auto timestamp'],
    ],
  },
  {
    number: '5.4',
    title: 'Database Schema – Bookmarks Collection',
    headers: ['Field', 'Type', 'Constraints/Default'],
    rows: [
      ['userId', 'ObjectId(User)', 'required'],
      ['resourceId', 'ObjectId(Resource)', 'required'],
      ['createdAt', 'Date', 'auto timestamp'],
      ['Index', 'Compound', 'unique(userId, resourceId)'],
    ],
  },
  {
    number: '6.1',
    title: 'API Endpoints for Authentication',
    headers: ['Method', 'Endpoint', 'Purpose'],
    rows: [
      ['POST', '/register', 'Register student/teacher account'],
      ['POST', '/login', 'Authenticate user and issue JWT'],
      ['POST', '/logout', 'Clear auth cookie/session'],
      ['GET', '/api/admin/approve/:id', 'Approve pending teacher'],
      ['GET', '/api/admin/reject/:id', 'Reject/remove pending teacher'],
      ['GET', '/student-dashboard', 'Validate authenticated student session'],
      ['GET', '/teacher-dashboard', 'Validate approved teacher session'],
    ],
  },
  {
    number: '6.2',
    title: 'API Endpoints for Resource Management',
    headers: ['Method', 'Endpoint', 'Purpose'],
    rows: [
      ['POST', '/resources/upload', 'Upload teacher PDF resource'],
      ['GET', '/resources', 'List resources with filters'],
      ['GET', '/resources/search', 'Search resources by keyword'],
      ['GET', '/resources/trending', 'Get trending resources (views/downloads)'],
      ['GET', '/resources/:id/view', 'View resource PDF inline'],
      ['POST', '/resources/:id/download', 'Track resource download'],
      ['GET', '/resources/my', 'Get teacher own uploads'],
      ['PUT', '/resources/:id', 'Update resource metadata'],
      ['DELETE', '/resources/:id', 'Delete uploaded resource'],
    ],
  },
  {
    number: '6.3',
    title: 'API Endpoints for Notifications',
    headers: ['Method', 'Endpoint', 'Purpose'],
    rows: [
      ['GET', '/notifications', 'Fetch student notifications + unread count'],
      ['PUT', '/notifications/read/:id', 'Mark notification as read'],
      ['POST', '/bookmarks', 'Create bookmark (student)'],
      ['GET', '/bookmarks', 'List student bookmarks'],
      ['DELETE', '/bookmarks/:id', 'Remove bookmark'],
    ],
  },
  {
    number: '7.1',
    title: 'Resource Categories and Descriptions',
    headers: ['Category', 'Description'],
    rows: [
      ['Syllabus', 'Official course structure and unit-wise coverage.'],
      ['Lab Manual', 'Practical experiments and lab instructions.'],
      ['Textbook', 'Reference books and core reading materials.'],
      ['Assignment', 'Problem sheets and assignment documents.'],
      ['PYQ', 'Previous year question papers for exam practice.'],
      ['Microproject', 'Mini project guides and supporting documents.'],
    ],
  },
  {
    number: '8.1',
    title: 'Technologies Used in the System',
    headers: ['Layer', 'Technology', 'Usage'],
    rows: [
      ['Frontend', 'React + Vite', 'SPA UI and routing'],
      ['Frontend UI', 'Tailwind CSS + Framer Motion + Lucide', 'Styling, animations, icons'],
      ['Backend', 'Node.js + Express', 'REST API and business logic'],
      ['Database', 'MongoDB Atlas + Mongoose', 'Persistent data storage and ODM'],
      ['File Storage', 'Cloudinary', 'PDF upload and retrieval'],
      ['Email', 'Resend API', 'Teacher approval emails to admin'],
      ['Deployment', 'Vercel + Render', 'Frontend and backend hosting'],
      ['Auth/Security', 'JWT + bcryptjs + cookie-parser + cors', 'Authentication and request security'],
    ],
  },
  {
    number: '9.1',
    title: 'Testing Scenarios and Results',
    headers: ['Test Scenario', 'Expected Result', 'Observed Result', 'Status'],
    rows: [
      ['Student registration with valid data', 'Account created and login possible', 'Passes with success response', 'PASS'],
      ['Teacher registration when approval email succeeds', 'Teacher created as pending and admin gets email', 'Implemented and validated through API flow', 'PASS'],
      ['Teacher registration when email sending fails', 'Registration blocked, no false success', 'Returns 503 and rolls back teacher user', 'PASS'],
      ['PDF upload with non-PDF file', 'Validation error', 'Returns 400 "Only PDF files are allowed"', 'PASS'],
      ['Student profile update year-semester mapping', 'Only valid sems for selected year', 'Backend validates mapping (1-2, 3-4, 5-6)', 'PASS'],
      ['Role access to teacher-only routes by student', 'Access denied', 'Returns 403 via role middleware', 'PASS'],
      ['Notification read update', 'Notification marked read', 'PUT endpoint updates read state', 'PASS'],
      ['Client quality checks', 'No lint/build errors', 'Latest lint and build completed successfully', 'PASS'],
    ],
  },
];

function renderHtml(table) {
  const headerCells = table.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join('');
  const bodyRows = table.rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td>${escapeHtml(cell)}</td>`)
          .join('')}</tr>`
    )
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Table ${escapeHtml(table.number)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      font-family: "Segoe UI", Arial, sans-serif;
      background: #f5f7fb;
      color: #0f172a;
    }
    .card {
      background: #ffffff;
      border: 1px solid #dbe1ea;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
      overflow: hidden;
      width: 1600px;
    }
    .title {
      padding: 16px 20px;
      background: #0f172a;
      color: #ffffff;
      font-size: 24px;
      font-weight: 700;
      line-height: 1.3;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 16px;
    }
    th, td {
      border: 1px solid #e2e8f0;
      padding: 10px 12px;
      vertical-align: top;
      text-align: left;
      line-height: 1.35;
    }
    th {
      background: #eaf1ff;
      color: #0b3ea8;
      font-weight: 700;
    }
    tr:nth-child(even) td { background: #fafcff; }
  </style>
</head>
<body>
  <div class="card">
    <div class="title">Table ${escapeHtml(table.number)} — ${escapeHtml(table.title)}</div>
    <table>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}</tbody>
    </table>
  </div>
</body>
</html>`;
}

function run() {
  ensureDir(outDir);
  ensureDir(htmlDir);

  const exported = [];
  for (const table of tables) {
    const slug = `table_${table.number.replace('.', '_')}`;
    const htmlPath = path.join(htmlDir, `${slug}.html`);
    const pngPath = path.join(outDir, `${slug}.png`);
    fs.writeFileSync(htmlPath, renderHtml(table), 'utf8');

    const fileUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;
    const cmd = `npx -y playwright screenshot --full-page "${fileUrl}" "${pngPath}"`;
    execSync(cmd, { stdio: 'pipe' });

    exported.push({
      file: path.basename(pngPath),
      label: `Table ${table.number} ${table.title}`,
    });
  }

  const indexPath = path.join(outDir, 'index.txt');
  fs.writeFileSync(
    indexPath,
    exported.map((x) => `${x.file} => ${x.label}`).join('\n') + '\n',
    'utf8'
  );

  console.log(`Exported ${exported.length} table images to ${outDir}`);
  for (const item of exported) {
    console.log(`${item.file} - ${item.label}`);
  }
}

run();
