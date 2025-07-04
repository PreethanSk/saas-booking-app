#  Franchise SaaS Booking Platform

A full-stack SaaS platform built for **service-based franchises** — like salons, gyms, tutors, and spas — to manage branches, bookings, staff, inventory, payments, and WhatsApp customer communication, all from a centralized dashboard.

---

##  Features

###  Core Modules
- **Multi-Branch Management** — Create and manage branches and assign franchise managers
- **Booking System** — Staff-wise bookings, calendar views, rescheduling, status tracking
- **Staff Management** — Onboard staff, assign roles, manage schedules
- **Customer CRM** — Store customer data and history
- **Inventory (Optional)** — Track per-branch product usage and alerts
- **WhatsApp Integration** — Send reminders, confirmations, and cancellations
-   Customers can book services, manage bookings, and receive updates via a WhatsApp Bo
- **Payment Integration** — Razorpay for online payments + manual entries
- **Dashboard & Reports** — Revenue analytics, staff performance, customer retention

---

## ⚙️ Tech Stack

| Layer       | Tech Used                           |
|-------------|-------------------------------------|
| Frontend    | [Next.js](https://nextjs.org/) + TailwindCSS + ShadCN |
| Backend     | Node.js + Express + Prisma ORM      |
| Database    | PostgreSQL                          |
| Caching     | Redis                               |
| Auth        | Clerk/Auth.js + RBAC Middleware     |
| DevOps      | Docker + Railway/Fly.io + GitHub Actions |
| Messaging   | WhatsApp Cloud API                  |
| Payments    | Razorpay                            |
| Docs        | Notion (WIP)                        |

---

## 📁 Project Structure

/backend
/prisma → DB schema (PostgreSQL)
/src
/routes → API routes for admin, manager, staff
/controllers → Business logic for each feature
/middlewares → RBAC, auth, error handlers
/utils → Validation (Zod), helpers
/frontend (WIP)
/app → Next.js + Tailwind + ShadCN components


---

## 🔐 Authentication & Roles

- **Super Admin** – Full access (org owner)
- **Franchise Manager** – Controls branch-level ops
- **Staff** – Booking-related actions only
- **Customer** – Public-facing booking only

---

## 📌 Roadmap

### ✅ MVP Phase (in progress)
- [x] Super Admin + Manager Auth
- [x] Branch & Manager Management
- [x] Staff Onboarding
- [ ] Product CRUD
- [ ] Booking System
- [ ] Customer APIs
- [ ] Public Booking
- [ ] WhatsApp & Razorpay Integration

### 🧩 Planned V2 Features
- Staff Payroll & Attendance
- Google Calendar Sync
- Custom Domain Support
- Open API Access
- AI WhatsApp Bot

---

## 📦 Setup Instructions

```bash
# Clone repo
git clone https://github.com/PreethanSk/saas-booking-app

# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend (WIP)
cd ../frontend
npm install
npm run dev
