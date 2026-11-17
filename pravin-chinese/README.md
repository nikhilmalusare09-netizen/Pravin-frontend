# PRAVIN CHINESE – Restaurant Ordering & Management System 🥢

A full-stack, responsive Indo-Chinese restaurant ordering and kitchen POS management platform built with the **MERN Stack** (MongoDB, Express.js, React, Node.js), **Tailwind CSS**, and **Socket.IO** for live real-time kitchen tracking.

---

## 🌟 Key Highlights

- **Customer Dashboard (No Login Needed):**
  - Modern, responsive Indo-Chinese themed homepage (Dark Red, Orange, Cream/White).
  - **Step 1:** Food Type filter cards (Pure Veg 🟢, Non-Veg 🔴, Egg 🟡).
  - **Step 2:** Interactive category tabs (*Starters, Gravies & Dries, Chopsuey, Rice, Rice With Gravy, Noodles, Noodles With Gravy, Soup, Extra*).
  - **Step 3:** Over 130 authentic dishes with images, prices in INR (₹), spice levels, veg/non-veg indicators, real-time stock status, and search.
  - **Step 4:** Shopping cart with instant subtotal and 5% GST tax calculation.
  - **Step 5:** Restaurant table selection with live table indicators (*Green = Available, Red = Occupied*) and concurrency conflict prevention.
  - **Step 6:** Order placement generating sequential Order Numbers (e.g. `PC-2026-0001`) and cryptographically secure unguessable tracking tokens.

- **Order Tracking System (Public & Secure):**
  - Real-time visual timeline (*Order Placed → Pending Approval → Approved → Preparing → Ready → Served → Completed*).
  - WebSocket updates using Socket.IO without page refreshing.
  - High-security verification: SHA-256 hashed tracking token protects order data from brute-force guessing.
  - Printable official tax invoice / bill with restaurant GSTIN.

- **Admin POS Dashboard:**
  - Professional sidebar navigation: Dashboard, Orders, Menu Management, Categories, Table Management, Billing, Reports, Settings, Logout.
  - Live acoustic sound bell chime and visual toast alerts for incoming orders.
  - Real-time order workflow actions: *Approve, Reject (auto-releases table), Start Preparing, Mark Ready, Mark Served, Complete*.
  - Full Menu CRUD with Cloudinary and local fallback image uploads, price edits, and instant stock toggles.
  - Running table sessions: supports multiple orders on one table accumulating into a single running bill.
  - Billing & Settlements: Cash, UPI, and Card recording with paid status.
  - Analytical Reports: Daily revenue trends, popular dishes, and payment mode distributions.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router DOM, Axios, Lucide React, Socket.IO Client, Canvas Confetti |
| **Backend** | Node.js, Express.js, Socket.IO, Multer, Cloudinary, JWT, bcryptjs, crypto |
| **Database** | MongoDB & Mongoose (supports MongoDB Atlas & Local MongoDB) |
| **Deployment** | Frontend on Vercel, Backend on Render, Database on MongoDB Atlas |

---

## 📂 Project Structure

```text
pravin-chinese/
├── backend/
│   ├── config/             # MongoDB connection configuration
│   ├── controllers/        # Express request controllers (auth, dish, order, etc.)
│   ├── middleware/         # JWT auth, upload (Multer/Cloudinary), errorHandler
│   ├── models/             # Mongoose schemas (Admin, Dish, Category, Table, Order, etc.)
│   ├── routes/             # REST API routes
│   ├── socket/             # Socket.IO connection & event emitters
│   ├── utils/              # Seed scripts, token hashing, sequential ID generator
│   ├── uploads/            # Local image upload storage
│   ├── server.js           # Server entry point & Socket initialization
│   ├── .env.example        # Environment variables template
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Footer, FoodCard, FoodTypeBadge, Modal, etc.
│   │   ├── context/        # AuthContext, CartContext
│   │   ├── hooks/          # useSoundAlert (Web Audio API chime)
│   │   ├── layouts/        # CustomerLayout, AdminLayout
│   │   ├── pages/
│   │   │   ├── customer/   # Home, Menu, Cart, TableSelect, OrderSuccess, OrderTracking
│   │   │   └── admin/      # Login, Dashboard, Orders, MenuManagement, Billing, Reports...
│   │   ├── services/       # Axios API client, Socket.io client
│   │   ├── App.jsx         # Routing configuration
│   │   ├── main.jsx        # Root application mount
│   │   └── index.css       # Tailwind base & custom printable styling
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .env.example
│   └── package.json
│
└── package.json            # Monorepo scripts
```

---

## 🚀 Quick Setup & Installation

### 1. Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local daemon or free MongoDB Atlas cluster)

### 2. Configure Backend Environment
Navigate to `backend/` and copy `.env.example` to `.env`:
```bash
cd backend
cp .env.example .env
```
Sample `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/pravin-chinese
JWT_SECRET=pravin_chinese_secret_jwt_key_2026_super_secure
ADMIN_EMAIL=admin@pravinchinese.com
ADMIN_PASSWORD=admin123
TAX_RATE=0.05

# Optional Cloudinary (leaves local upload as fallback if unset)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### 3. Install Dependencies & Seed Menu Data
Run from `backend/`:
```bash
npm install
npm run seed
```
> The seed script automatically creates:
> - **130 authentic dishes** across all 9 categories with prices in INR.
> - **Default Admin account:** `admin@pravinchinese.com` / `admin123`.
> - **10 dining tables** (Table 1 through Table 10).

### 4. Start the Backend Server
```bash
npm run dev
# Server runs at http://localhost:5000
```

### 5. Start the Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
# Frontend runs at http://localhost:5173
```

Open `http://localhost:5173` in your browser to start dining or managing the restaurant.

---

## 🔐 Admin Credentials

- **URL:** `http://localhost:5173/admin/login`
- **Email:** `admin@pravinchinese.com`
- **Password:** `admin123`
*(A quick auto-fill button is also provided on the login page for convenience)*

---

## 📡 REST API Overview

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Admin login, returns JWT token |
| `GET` | `/api/auth/me` | Admin | Get logged in admin profile |
| `GET` | `/api/dishes` | Public | List dishes with category, foodType, and search filters |
| `POST` | `/api/dishes` | Admin | Create dish with multipart image or URL |
| `PUT` | `/api/dishes/:id` | Admin | Update dish price, stock, or details |
| `DELETE` | `/api/dishes/:id` | Admin | Delete dish |
| `GET` | `/api/tables` | Public | View dining tables and availability |
| `POST` | `/api/tables/:id/release` | Admin | Release table (checks unpaid bills and active orders) |
| `POST` | `/api/orders` | Public | Place order, calculates total on backend, creates token |
| `POST` | `/api/orders/track` | Public | Secure order tracking with token verification |
| `PATCH` | `/api/orders/:id/status` | Admin | Transition status: PENDING → APPROVED → PREPARING... |
| `GET` | `/api/billing/:orderId` | Public/Admin | Detailed bill with GST invoice |
| `POST` | `/api/billing/:orderId/payment` | Admin | Record Cash, UPI, or Card payment |
| `GET` | `/api/reports/dashboard` | Admin | Live KPI cards and 7-day revenue trend chart |
| `GET` | `/api/reports/sales` | Admin | Aggregated sales timeline and popular dish analytics |

---

## 🌐 Production Deployment Guide

### Backend on Render
1. Push the code repository to GitHub.
2. In Render, create a new **Web Service**.
3. Set **Root Directory** to `backend`.
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Under Environment Variables, set:
   - `MONGODB_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: Random secure string.
   - `NODE_ENV`: `production`
   - `ADMIN_EMAIL` & `ADMIN_PASSWORD`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Frontend on Vercel
1. In Vercel, import the repository.
2. Set **Root Directory** to `frontend`.
3. Framework Preset: **Vite**.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables:
   - `VITE_API_URL`: `https://your-render-backend.onrender.com/api`
   - `VITE_SOCKET_URL`: `https://your-render-backend.onrender.com`

---

## 📜 License
Developed for **PRAVIN CHINESE RESTAURANT**. All rights reserved.
