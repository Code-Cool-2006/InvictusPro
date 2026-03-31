# Invictus

Invictus is a comprehensive MERN (MongoDB, Express, React, Node.js) stack platform designed to manage and streamline community-driven initiatives through volunteer coordination and donor engagement.

## 🚀 Core Platform Features

### **1. Secure Authentication & User Roles**
- **Multi-Role Support**: Admin, Volunteer, and Donor roles with distinct dashboards.
- **JWT Protection**: Secure API endpoints using middleware.
- **Profile Initialization**: Automatically creates role-specific profiles.

### **2. Volunteer Management**
- **Dynamic Scheduling**: Weekly availability calendar where volunteers can set specific time slots.
- **Skill-Tagging System**: Multi-select skill system to match volunteers with relevant tasks.
- **Activity Tracking**: Logging of volunteer hours, event attendance, and completion status.
- **Performance Impact**: Cumulative stats for total hours contributed and events attended.
- **Document Management**: Capability to upload ID proofs for verification.
- **Certification**: Automated PDF generation for volunteer certificates upon activity completion.

### **3. Donor Engagement**
- **Flexible Donations**: Support for one-time contributions and monthly recurring giving.
- **Impact Tracking**: "Impact Score" calculation and donation history log.
- **Tax Compliance**: Automated PDF receipt generation designed for tax exemption.
- **Automated Reminders**: Optional email notification system for monthly contributors.

### **4. Administrative Control**
- **Centralized Management**: Overview of all users (volunteers, donors, admins).
- **Activity Creation**: Admin ability to post new opportunities with specific skill requirements and volunteer counts.
- **System Analytics**: Real-time stats on total donations, active volunteers, and user growth.
- **Data Governance**: Ability to manage and delete user accounts to ensure platform integrity.

## 🏗️ Technical Architecture

- **Frontend**: React with Vite, Custom Vanilla CSS, Axios
- **Backend**: Node.js & Express
- **Database**: MongoDB (Atlas/Local) with Mongoose Object Modeling
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs`
