# College Portal — Authentication (Phase 1)

Email/password auth with JWT, httpOnly cookies, and teacher approval via admin email links (Resend API). No admin UI.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [MongoDB](https://www.mongodb.com/) running locally or a connection string (MongoDB Atlas)

## Step-by-step setup

1. **Clone or open this folder**  
   `college-portal`

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment file**  
   Copy `.env.example` to `.env` and fill in values (see below).

4. **Start MongoDB**  
   Ensure `MONGODB_URI` is reachable (e.g. `mongodb://127.0.0.1:27017/college_portal`).

5. **Run the server**

   ```bash
   npm run dev
   ```

   Or production-style: `npm start`

6. **Open the app**  
   In a browser: `http://localhost:5000` (or your `PORT`).  
   Use **Register / Login** on `auth.html`.

## Student Dashboard (React client)

This repo now includes a React student UI in `client/`.

### Run it

1. Make sure the backend is running:

```bash
cd c:\Users\Aditya\projects\college-portal
npm run dev
```

2. In a new terminal, start the React client:

```bash
cd c:\Users\Aditya\projects\college-portal\client
npm install
npm run dev
```

3. Open the React app (Vite default):
`http://localhost:5173`

### Notes

- The React client expects a student JWT token in `localStorage` under `token` (same as the existing HTML auth page stores).
- Login as **student** using `http://localhost:5000/auth.html`, then open the React student dashboard at `http://localhost:5173`.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random string for signing JWTs |
| `PORT` | Server port (default 5000) |
| `APP_BASE_URL` | Public URL of this app (no trailing slash) — used in approval emails (`BASE_URL` also supported) |
| `ADMIN_EMAIL` | Inbox that receives “new teacher” emails |
| `RESEND_API_KEY` | Resend API key used for transactional email sending |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Cloudinary credentials |
| `CLOUDINARY_FOLDER` | Folder for uploads in Cloudinary (default: `college-resources`) |

## API summary

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register (body: `name`, `email`, `password`, `role`) |
| POST | `/login` | Login; sets httpOnly cookie + returns JSON `token` |
| POST | `/logout` | Clears auth cookie |
| GET | `/api/admin/approve/:id` | Approve teacher (link in email) |
| GET | `/api/admin/reject/:id` | Reject teacher (deletes account) |
| GET | `/student-dashboard` | JWT + role `student` |
| GET | `/teacher-dashboard` | JWT + role `teacher` + `isApproved` |
| POST | `/resources/upload` | Upload a teacher PDF resource (multipart/form-data) |
| GET | `/resources` | Fetch resources (filters: `department`, `year`, `type`) |
| GET | `/resources/my` | Fetch only your uploads |
| PUT | `/resources/:id` | Edit your own resource metadata |
| DELETE | `/resources/:id` | Delete your own resource |

Send `Authorization: Bearer <token>` or rely on the `token` cookie (same-origin).

## Project layout

```
server/
  config/db.js
  config/cloudinary.js
  models/User.js
  models/Resource.js
  controllers/authController.js
  controllers/adminController.js
  controllers/dashboardController.js
  controllers/resourceController.js
  middleware/authMiddleware.js
  middleware/roleMiddleware.js
  routes/authRoutes.js
  routes/adminRoutes.js
  routes/userRoutes.js
  routes/resourceRoutes.js
  services/email.service.js
  utils/jwt.js
  index.js
public/
  auth.html, index.html, *-dashboard.html
  css/style.css
  js/api.js
  js/teacherResources.js
```

## Resend email setup (teacher approval emails)

The approval email is sent **to `ADMIN_EMAIL`**, not to the teacher. Check that inbox and **Spam**.

If mail never arrives, run:

```bash
npm run test-email
```

- Ensure `RESEND_API_KEY` is set in your environment.
- Verify `ADMIN_EMAIL` is a valid recipient.

## Security note

Approve/reject URLs are plain GET links for admin convenience. For production, consider a random one-time token or an authenticated admin area instead of public IDs only.

## Cloudinary (teacher resource PDFs)

- Resources are uploaded using Cloudinary SDK with `resource_type: "raw"`.
- Files are stored in the Cloudinary folder given by `CLOUDINARY_FOLDER` (default: `college-resources`).
