# Advanced Weekly To-Do Application

A full-stack task management and scheduling application designed to organize daily, weekly, and monthly routines. It features secure user authentication, interactive calendar views, location-based map routing, and intelligent browser notifications.

## 🚀 Features

* **Secure Authentication:** User registration and login utilizing bcrypt password hashing and JSON Web Tokens (JWT) for secure session management.
* **Dynamic Calendar Views:** * **Today:** Grouped tasks by "All-Day" and "Scheduled" blocks, sorted by emergency priority and chronological start times.
  * **Week:** Toggle between a continuous list view and a visual time-slot grid using FullCalendar.
  * **Month:** High-level overview of task distribution.
* **Smart Task Scheduling:** Support for Temporary (one-time) and Permanent (recurring) tasks with optional start and end times.
* **Map Integration:** Assign locations to tasks and launch direct routing via Google Maps, Apple Maps, or Baidu Maps based on user preference.
* **Browser Notifications:** * Daily routine reminders at 10:00 AM and 9:00 PM.
  * Precision alerts triggered exactly 15 minutes before a scheduled task's start time.
* **Priority Management:** 1-5 emergency level scaling, visualized with dynamic color-coding.

---

## 🛠️ Tech Stack

**Frontend**
* React 18
* TypeScript
* Vite
* Material UI (MUI) for responsive component design
* FullCalendar for complex grid/time slot rendering
* Day.js for lightweight time and date manipulation
* React Router DOM for client-side routing

**Backend**
* Node.js
* Express.js
* MongoDB Atlas (via Mongoose)
* JSON Web Tokens (JWT) for stateless authentication
* bcryptjs for cryptographic password hashing

---

## ⚙️ Installation & Setup

### Prerequisites
* Node.js (v16 or higher)
* A MongoDB Atlas connection string (or local MongoDB instance)

### 1. Backend Configuration
Navigate to the backend directory, install dependencies, and configure your environment variables.

```bash
cd backend
npm install