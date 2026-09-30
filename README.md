# GramSetu — Digital Gram Panchayat Grievance Portal

**Official Civic Grievance Redressal Portal for XYZ Gram Panchayat, Buldhana District, Maharashtra**

A full-stack, production-grade civic management portal designed for rural local self-government (Panchayati Raj). Built with a clear separation between **Citizen Portal** and **Administration Portal**, backed by a real **Node.js/Express REST API**, **MongoDB Atlas (Mongoose)** for persistent data storage, and **Cloudinary** for photographic evidence CDN delivery.

---

## 🏛️ System Overview

- **Designated Jurisdiction:**
  - **State:** Maharashtra
  - **District:** Buldhana
  - **Gram Panchayat:** XYZ Gram Panchayat
  *(Fixed jurisdiction — no complex taluka/ward ambiguity)*
- **Architecture Pattern:** Client-Server REST Architecture (Separated Citizen & Officer Frontends → Express API → MongoDB Atlas + Cloudinary)
- **Zero Mock / Zero Fake Data:** All grievance statistics, registered users, and complaint statuses are dynamically queried and updated in MongoDB Atlas.

---

## 🏗️ System Architecture

```text
              ┌──────────────────────────┐
              │      Citizen Portal      │
              │   (HTML5 / CSS3 / JS)    │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │    Express / Node.js     │
              │       REST API           │
              └───┬──────────────────┬───┘
                  │                  │
                  ▼                  ▼
          ┌───────────────┐  ┌───────────────┐
          │ MongoDB Atlas │  │  Cloudinary   │
          │  (Mongoose)   │  │ (Image CDN)   │
          └───────┬───────┘  └───────┬───────┘
                  ▲                  ▲
                  │                  │
              ┌───┴──────────────────┴───┐
              │  Panchayat Admin Console │
              │   (HTML5 / CSS3 / JS)    │
              └──────────────────────────┘
```

---

## ⚡ Technology Stack

### Frontend:
- **Languages:** HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Design System:** Custom Indian Civic & Gram Panchayat Design Theme (Zero-pill metadata discipline, WCAG AA contrast, responsive mobile/desktop layouts)
- **Icons & Emblems:** Standard Unicode & SVG Civic iconography

### Backend:
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js (v4.21+)
- **Database Engine:** MongoDB Atlas via **Mongoose** (v8+)
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) + `bcryptjs` for password hashing (10 salt rounds)
- **Media Uploads:** `multer` (in-memory buffer parsing) + `cloudinary` v2 SDK streaming
- **Security & Hardening:**
  - `helmet` security headers
  - `cors` cross-origin resource sharing
  - `express-rate-limit` (brute-force defense on auth endpoints)
  - Strict input & file MIME validation (JPG, JPEG, PNG, WEBP $\le$ 5 MB)

---

## 📂 Project Structure

```text
gramsetu/
├── citizen/                   # Citizen Resident Portal
│   ├── index.html             # Citizen Portal Home & Information
│   ├── register.html          # Citizen Registration (Fixed Panchayat Location)
│   ├── login.html             # Citizen Login (Mobile / Email + Password)
│   ├── dashboard.html         # Citizen Dashboard (Live MongoDB stats)
│   ├── submit-complaint.html  # Grievance Lodging + Cloudinary Photo Upload
│   ├── complaints.html        # My Complaints Ledger (Filtered by status)
│   ├── complaint-details.html # Grievance Dossier & Admin Remark Viewer
│   ├── profile.html           # Citizen Resident Profile
│   ├── css/
│   │   └── style.css          # Civic Green & Saffron responsive stylesheet
│   └── js/
│       ├── api.js             # Centralized fetch wrapper & error handler
│       ├── auth.js            # JWT token & session state manager
│       └── app.js             # Citizen pages controller & DOM binder
│
├── admin/                     # Panchayat Administration Portal
│   ├── index.html             # Admin Official Login (GramSetu@2026 key)
│   ├── dashboard.html         # Admin Metric Dashboard (Aggregated from MongoDB)
│   ├── complaints.html        # All Grievances Registry with Search & Filters
│   ├── complaint-details.html # Official Review, Status Changer & Remark Editor
│   ├── profile.html           # Administrative Profile & Security Details
│   ├── css/
│   │   └── style.css          # Administrative Control Console stylesheet
│   └── js/
│       ├── api.js             # Admin API client with Bearer Authorization
│       ├── auth.js            # Admin JWT token manager
│       └── app.js             # Admin console controller & status patcher
│
├── backend/                   # Node.js / Express Server
│   ├── config/
│   │   ├── db.js              # Mongoose connection & readiness tracker
│   │   └── cloudinary.js      # Cloudinary v2 SDK configuration & uploader
│   ├── models/
│   │   ├── User.js            # User Schema (Citizen & Admin, fixed location)
│   │   ├── Complaint.js       # Complaint Schema (Status, category, photo URL)
│   │   └── Counter.js         # Atomic Sequential ID generator (CMP-2026-XXXXXX)
│   ├── controllers/
│   │   ├── authController.js  # Registration, Login, and Admin verification
│   │   ├── citizenController.js # Citizen profile, stats, and complaint queries
│   │   ├── complaintController.js # Grievance submission with Cloudinary
│   │   └── adminController.js # Admin dashboard metrics & status PATCH
│   ├── routes/
│   │   ├── authRoutes.js      # POST /api/auth/register, /login, /admin-login
│   │   ├── citizenRoutes.js   # GET /api/citizen/profile, /dashboard, /complaints
│   │   ├── complaintRoutes.js # POST /api/complaints, GET /api/complaints/:id
│   │   └── adminRoutes.js     # GET /api/admin/dashboard, PATCH /complaints/:id
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT verification & role validation (citizen/admin)
│   │   └── uploadMiddleware.js # Multer memory upload with 5MB & image check
│   ├── services/
│   │   ├── cloudinaryService.js # Cloudinary buffer stream service
│   │   └── complaintService.js  # Sequential complaint generator service
│   ├── scripts/
│   │   └── seed.js            # Optional sample demonstration seed script
│   └── server.js              # Express application assembly
│
├── server.ts                  # Development & production server entry point
├── .env.example               # Template for environment variables
├── .gitignore                 # Excludes secrets, node_modules, logs
├── package.json               # Dependencies & execution scripts
└── README.md                  # Complete documentation
```

---

## 🗄️ Database Models (Mongoose)

### 1. `User` Schema
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto | Primary Key |
| `fullName` | String | Required, Trim | Resident full legal name |
| `mobile` | String | Required, Unique, 10-digit | Indian mobile number (`^[6-9]\d{9}$`) |
| `email` | String | Optional, Sparse Unique | Resident email address |
| `passwordHash` | String | Required | Salted bcrypt hash (10 rounds) |
| `role` | String | Enum: `['citizen', 'admin']` | Account permission level |
| `state` | String | Default: `'Maharashtra'` | Fixed jurisdiction |
| `district` | String | Default: `'Buldhana'` | Fixed jurisdiction |
| `gramPanchayat`| String | Default: `'XYZ Gram Panchayat'` | Fixed jurisdiction |
| `createdAt` / `updatedAt` | Date | Timestamps | Auto-generated |

### 2. `Complaint` Schema
| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `_id` | ObjectId | Auto | Primary Key |
| `complaintId` | String | Required, Unique, Indexed | Sequential ID (e.g. `CMP-2026-000001`) |
| `citizenId` | ObjectId | Ref: `'User'`, Required | Linked resident creator |
| `title` | String | Required, Max 150 chars | Summary of grievance |
| `category` | String | Required, Enum | Roads, Street Lights, Water Supply, Sanitation, Drainage, Waste Management, Electricity, Public Infrastructure, Other |
| `location` | String | Required | Exact Landmark / Location in village |
| `description` | String | Required | In-depth description of civic issue |
| `photoUrl` | String | Optional | Cloudinary HTTPS secure URL |
| `photoPublicId`| String | Optional | Cloudinary asset public ID |
| `state` | String | `'Maharashtra'` | Fixed Panchayat state |
| `district` | String | `'Buldhana'` | Fixed Panchayat district |
| `gramPanchayat`| String | `'XYZ Gram Panchayat'`| Fixed Panchayat name |
| `status` | String | Enum, Indexed | `Submitted` $\rightarrow$ `Under Review` $\rightarrow$ `In Progress` $\rightarrow$ `Resolved` $\rightarrow$ `Rejected` |
| `adminRemark` | String | Optional, Trim | Official response logged by Panchayat |
| `resolvedAt` | Date | Optional | Timestamp when status marked `Resolved` |

---

## 🔌 API Routes Specification

### 1. Authentication (`/api/auth`)
- `POST /api/auth/register` — Citizen registration with bcrypt hash & JWT issuance.
- `POST /api/auth/login` — Citizen login via Mobile or Email + Password.
- `POST /api/auth/admin-login` — Official Admin login (Checks `ADMIN_PASSWORD`).

### 2. Citizen Desk (`/api/citizen`)
*(Requires Bearer JWT with `role: citizen`)*
- `GET /api/citizen/profile` — Retrieves logged-in resident profile & grievance counts.
- `GET /api/citizen/dashboard` — Aggregated MongoDB statistics (Total, Submitted, In Progress, Resolved) and recent 5 grievances.
- `GET /api/citizen/complaints` — Returns all grievances filed by the authenticated resident.

### 3. Grievances (`/api/complaints`)
- `POST /api/complaints` — File grievance with `multipart/form-data` (Multer $\rightarrow$ Cloudinary $\rightarrow$ MongoDB).
- `GET /api/complaints/:id` — View details of a specific grievance (Authorized for owner or admin).

### 4. Panchayat Administration (`/api/admin`)
*(Requires Bearer JWT with `role: admin`)*
- `GET /api/admin/dashboard` — Complete MongoDB metrics across all 5 statuses and recent 10 grievances.
- `GET /api/admin/complaints` — Search and filter all grievances across the Gram Panchayat.
- `GET /api/admin/complaints/:id` — View complaint dossier with citizen contact info.
- `PATCH /api/admin/complaints/:id` — Update grievance status and append official administrative remarks.

### 5. Health & Diagnostics (`/api/health`)
- `GET /api/health` — Checks live MongoDB readiness and Cloudinary credentials.

---

## ⚙️ Environment Variables Configuration

Create a `.env` file in the project root:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# MongoDB Atlas Database Connection URI
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/gramsetu?retryWrites=true&w=majority

# JWT Token Secret
JWT_SECRET=your_jwt_secret_key_2026

# Master Panchayat Admin Password
ADMIN_PASSWORD=GramSetu@2026

# Cloudinary CDN Image Credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Frontends (for production CORS / deployment)
CITIZEN_URL=http://localhost:3000/citizen/index.html
ADMIN_URL=http://localhost:3000/admin/index.html
```

---

## 🛠️ Step-by-Step Setup Guide

### 1. MongoDB Atlas Configuration
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in or create a free M0 cluster.
2. Under **Database Access**, create a user (e.g. `gramsetu_admin`) with Read and Write permissions.
3. Under **Network Access**, click **Add IP Address** and select **Allow Access from Anywhere** (`0.0.0.0/0`) for development.
4. Click **Connect** $\rightarrow$ **Drivers (Node.js)**, copy the connection string:
   ```text
   mongodb+srv://gramsetu_admin:<password>@cluster0.abcde.mongodb.net/gramsetu?retryWrites=true&w=majority
   ```
5. Paste it as `MONGODB_URI` in `.env`.

### 2. Cloudinary Configuration
1. Go to [Cloudinary](https://cloudinary.com/) and register a free account.
2. In the Cloudinary Dashboard, copy your:
   - **Cloud Name** (`CLOUDINARY_CLOUD_NAME`)
   - **API Key** (`CLOUDINARY_API_KEY`)
   - **API Secret** (`CLOUDINARY_API_SECRET`)
3. Paste these values into `.env`.

### 3. Local Installation & Startup
```bash
# 1. Install dependencies
npm install

# 2. (Optional) Seed Sample Demo Grievances for College Presentation
npm run seed

# 3. Start the Full-Stack Server
npm run dev
```

Visit the application in your browser:
- **Portal Gateway & Diagnostics:** [http://localhost:3000](http://localhost:3000)
- **Citizen Portal:** [http://localhost:3000/citizen/index.html](http://localhost:3000/citizen/index.html)
- **Admin Console:** [http://localhost:3000/admin/index.html](http://localhost:3000/admin/index.html)
- **System Health Endpoint:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 🎓 College Demonstration Walkthrough Flow

1. **Start Backend & Check Diagnostic:**
   - Open [http://localhost:3000](http://localhost:3000). Verify that the MongoDB and Cloudinary badges show active status.
2. **Citizen Registration:**
   - Navigate to `/citizen/register.html`.
   - Enter name (e.g. `Rameshwar Patil`), mobile (`9876543210`), and password (`password123`).
   - Notice the fixed Panchayat location: `Maharashtra`, `Buldhana`, `XYZ Gram Panchayat`.
   - Click **Complete Registration**. You will be authenticated and redirected to `/citizen/dashboard.html`.
3. **Submit Grievance with Photo:**
   - Click **Submit Complaint**.
   - Select Category: `Roads`.
   - Landmark: `Near Z.P. School, East Ward`.
   - Attach photo evidence from your computer or camera.
   - Click **Submit**. Observe the sequential ID modal: `CMP-2026-000001`.
4. **Officer Review in Admin Console:**
   - Open `/admin/index.html`.
   - Enter Officer Name: `Sarpanch / Gram Sevak`.
   - Enter Secret Key: `GramSetu@2026`.
   - On the Admin Dashboard, observe that Total Grievances and Submitted count incremented in real time.
   - Click on the complaint. View citizen details and click the Cloudinary photo to inspect full resolution.
   - Change Status to `In Progress`, enter official remark: `Inspection team dispatched. Repair gravel ordered.`
   - Click **Save Changes to MongoDB**.
5. **Verify Persistence from Citizen Portal:**
   - Return to the Citizen Portal (`/citizen/complaints.html`).
   - Open `CMP-2026-000001`.
   - See the updated status (`In Progress`) and the official remark from the Panchayat administration.
6. **Ultimate Real-Database Test:**
   - Clear browser `localStorage` completely.
   - Log back in with the mobile number and password.
   - Observe that the citizen account and all grievance history persist in MongoDB Atlas!

---

## 🚀 Cloud Deployment Architecture

- **Citizen Frontend:** Hosted on Vercel / Render Static / Cloud Storage
- **Admin Frontend:** Hosted on Vercel / Cloud Storage
- **Backend API:** Hosted on Render / Railway / Cloud Run
- **Database:** MongoDB Atlas
- **Storage:** Cloudinary CDN
