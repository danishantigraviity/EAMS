# EAMS — Enterprise Asset Management System

A full-stack MERN application for managing physical assets, digital assets, software licenses, employees, departments, maintenance requests, and analytics for medium-to-large organizations.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Tailwind CSS, Redux Toolkit, React Router v6, Framer Motion, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (15min access + 7d refresh), bcrypt (12 rounds), RBAC |
| Storage | Cloudinary |
| Email | Nodemailer (SMTP / Gmail / SendGrid) |
| Scheduler | node-cron |
| Security | Helmet, express-rate-limit, express-validator, mongo-sanitize, xss-clean |

---

## Quick Start

### 1. Clone and install dependencies

```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

### 2. Configure environment variables

```bash
# Copy example env
cp server/.env.example server/.env
# Fill in all values in server/.env
```

### 3. Start development servers

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd server
npm run dev

# Terminal 2 — Frontend (http://localhost:3000)
cd client
npm run dev
```

---

## User Roles

| Role | Access |
|---|---|
| `super_admin` | Full system access |
| `hr_team` | Employee management, allocation reports |
| `it_team` | Asset management, license management |
| `sbi_team` | Banking asset access |
| `insurance_team` | Insurance documents |
| `business_associate` | Business files |
| `employee` | Personal dashboard, own assets, requests |

---

## Environment Variables

See `server/.env.example` for all required variables.

Key variables:
- `MONGODB_URI` — MongoDB Atlas connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — JWT signing secrets (min 32 chars)
- `CLOUDINARY_*` — Cloudinary credentials for file storage
- `SMTP_*` — Email server configuration
- `LLM_API_KEY` — Anthropic API key for AI chat assistant
- `FRONTEND_URL` — Frontend URL for CORS whitelist

---

## Features

- ✅ JWT Authentication with refresh token rotation
- ✅ Role-Based Access Control (7 roles)
- ✅ Physical Asset Management with QR codes
- ✅ Digital Asset Management with Cloudinary
- ✅ Software License Management with seat tracking
- ✅ Employee & Department Management
- ✅ Maintenance Request Tracking
- ✅ Admin Dashboard with Recharts analytics
- ✅ Employee Self-Service Portal
- ✅ AI Chat Assistant
- ✅ Global Search (assets, employees, licenses)
- ✅ OCR Invoice Scanner (Tesseract.js)
- ✅ Automated email notifications (Nodemailer)
- ✅ Daily cron jobs for expiry alerts
- ✅ Export to Excel, CSV, PDF
- ✅ Dark/Light mode
- ✅ Fully responsive (mobile + desktop)
- ✅ QR Scanner with camera

---

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/verify-otp`
- `POST /api/auth/reset-password`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Assets
- `GET /api/assets` — List with filters & pagination
- `POST /api/assets` — Create (with image upload)
- `PUT /api/assets/:id` — Update
- `DELETE /api/assets/:id` — Soft delete (retire)
- `POST /api/assets/:id/assign` — Assign to employee
- `POST /api/assets/:id/unassign` — Return asset
- `GET /api/assets/:id/history` — Full history timeline
- `GET /api/assets/expiring-warranty` — Warranty alerts

### Licenses, Employees, Departments, Maintenance
- Full CRUD on each resource
- See `/server/routes/` for complete route listings

### Dashboard & Reports
- `GET /api/dashboard/stats` — Aggregated KPIs
- `GET /api/reports/assets|maintenance|licenses`

### AI
- `POST /api/ai/chat` — AI chat proxy
- `POST /api/ai/ocr` — Invoice OCR extraction

---

## Deployment

### Backend (Render)
1. Connect GitHub repo
2. Build command: `cd server && npm install`
3. Start command: `node server.js`
4. Add all environment variables

### Frontend (Vercel)
1. Connect GitHub repo
2. Root directory: `client`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add `VITE_API_URL=https://your-backend.onrender.com/api`

### Database (MongoDB Atlas)
1. Create a free cluster
2. Add IP whitelist (0.0.0.0/0 for Render)
3. Get connection string → `MONGODB_URI`
