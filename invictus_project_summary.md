# Invictus Project Summary: End-to-End Overview

Invictus is a comprehensive MERN (MongoDB, Express, React, Node.js) stack platform designed to manage and streamline community-driven initiatives through volunteer coordination and donor engagement. Originally migrated from a Firebase-based architecture, it now features a custom-built backend for robust data persistence and secure authentication.

---

## 🏗️ Technical Architecture

### **Frontend**
- **Library/Framework**: React with Vite for high-performance development.
- **Styling**: Custom Vanilla CSS with a focus on clean, dashboard-centric UI.
- **Communication**: Axios-based API client ([api.js](file:///home/rishab-chavadar/Documents/Invictus/src/api.js)) with JWT interception.
- **Key Dependencies**: `lucide-react` (icons), `date-fns` (date formatting), `jspdf` (PDF generation).

### **Backend**
- **Runtime/Framework**: Node.js & Express.
- **Database**: MongoDB (Atlas/Local) with Mongoose Object Modeling.
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` for password hashing.
- **Environment**: Managed via `dotenv` for secure configuration.

---

## 🚀 Core Platform Features

### **1. Secure Authentication & User Roles**
- **Multi-Role Support**: Admin, Volunteer, and Donor roles with distinct dashboards.
- **JWT Protection**: Secure API endpoints using middleware ([auth.js](file:///home/rishab-chavadar/Documents/Invictus/backend/routes/auth.js)).
- **Profile Initialization**: Automatically creates role-specific profiles (Volunteer/Donor) upon registration.

### **2. Volunteer Management**
- **Dynamic Scheduling**: Weekly availability calendar where volunteers can set specific time slots (Start/End times).
- **Skill-Tagging System**: Multi-select skill system (Teaching, Medical Aid, IT Support, etc.) to match volunteers with relevant tasks.
- **Activity Tracking**: Logging of volunteer hours, event attendance, and completion status.
- **Performance Impact**: Cumulative stats for total hours contributed and events attended.
- **Document Management**: Capability to upload ID proofs (Aadhaar, PAN, etc.) for verification.
- **Certification**: Automated PDF generation for volunteer certificates upon activity completion using `jsPDF`.

### **3. Donor Engagement**
- **Flexible Donations**: Support for one-time contributions and monthly recurring giving.
- **Impact Tracking**: "Impact Score" calculation and donation history log.
- **Tax Compliance**: Automated PDF receipt generation designed for tax exemption under section 80G.
- **Automated Reminders**: Optional email notification system for monthly contributors.

### **4. Administrative Control**
- **Centralized Management**: Overview of all users (volunteers, donors, admins).
- **Activity Creation**: Admin ability to post new opportunities with specific skill requirements and volunteer counts.
- **System Analytics**: Real-time stats on total donations, active volunteers, and user growth.
- **Data Governance**: Ability to manage and delete user accounts to ensure platform integrity.

---

## 📊 Data Models (Mongoose)

| Model | Purpose | Key Fields |
| :--- | :--- | :--- |
| **User** | Core Authentication | email, username, password, role |
| **Volunteer** | Volunteer Profiles | skills, availability (Map), activities, totalHours, idProofUrl |
| **Donor** | Donor Profiles | totalDonated, donationCount, remindersEnabled |
| **Activity** | Event Management | title, description, date, location, needed (vols), skills |
| **Donation** | Financial Tracking | amount, category, date, status, donorName |

---

## 🛠️ API Surface (Partial List)

- **Auth**: `/api/auth/register`, `/api/auth/login`
- **Volunteers**: `/api/volunteers/profile` (GET/PUT), `/api/volunteers/all`
- **Donors**: `/api/donors/profile`, `/api/donors/all`
- **Activities**: `/api/activities` (GET/POST), `/api/activities/:id/signup`
- **Donations**: `/api/donations` (POST), `/api/donations/my-donations`, `/api/donations/all`
- **Users**: `/api/users/all`, `/api/users/:id` (DELETE)

---

## 📝 Roadmap & Current Progress (Extracted from TODO.md)

- [x] **MERN Migration**: Completed from Firebase.
- [x] **Volunteer Basics**: Scheduling, skill tags, and ID proof upload logic.
- [x] **Certificates**: Automated PDF generation implemented.
- [/] **Matching System**: Skill-based filtering is implemented in the frontend; auto-matching is on the roadmap.
- [ ] **Donation Expansion**: Adding more granular categories (food, clothes, medicine).
- [ ] **Communication**: Full email notification service implementation.
