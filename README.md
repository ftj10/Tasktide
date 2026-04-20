# 📅 Advanced Weekly To-Do Application

A full-stack task management and scheduling application designed to organize daily, weekly, and monthly routines. It features secure user authentication, interactive calendar views, location-based map routing, and intelligent browser notifications.

---

## 🚀 Features

### 🔐 Secure Authentication
- User registration and login
- Password hashing using **bcrypt**
- Stateless authentication via **JSON Web Tokens (JWT)**

### 📆 Dynamic Calendar Views
- **Today View**
  - Tasks grouped into *All-Day* and *Scheduled*
  - Sorted by emergency priority and start time
- **Week View**
  - Toggle between:
    - List view
    - Time-slot grid (powered by FullCalendar)
- **Month View**
  - High-level overview of task distribution

### 🧠 Smart Task Scheduling
- Supports:
  - **Temporary tasks** (one-time)
  - **Permanent tasks** (recurring)
- Optional start and end times

### 🗺️ Map Integration
- Assign locations to tasks
- Open routes using:
  - Google Maps
  - Apple Maps
  - Baidu Maps

### 🔔 Browser Notifications
- Daily reminders:
  - 10:00 AM
  - 9:00 PM
- Automatic alerts:
  - 15 minutes before scheduled tasks

### ⚡ Priority Management
- Emergency level scale: **1–5**
- Dynamic color-coding for visual urgency

---

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Material UI (MUI)
- FullCalendar
- Day.js
- React Router DOM

### Backend
- Node.js
- Express.js
- MongoDB Atlas (via Mongoose)
- JSON Web Tokens (JWT)
- bcryptjs

---

## ⚙️ Installation & Setup

### ✅ Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas connection string (or local MongoDB)

---

### 🔧 Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend folder:

```env
PORT=2676
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_secure_random_secret_string
```

Start the backend server:

```bash
npm start
# or
node server.js
```

### 🎨 Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the frontend folder:

```env
VITE_API_URL=[http://127.0.0.1:2676](http://127.0.0.1:2676)
```

Start the development server:

```bash
npm run dev
```

---

## 🗄️ Database Schema

### 👤 User Model
| Field | Type | Description |
| :--- | :--- | :--- |
| username | String | Unique, required |
| password | String | Hashed, required |

### ✅ Task Model
| Field | Type | Description |
| :--- | :--- | :--- |
| id | String | Frontend UUID |
| userId | ObjectId | Reference to User |
| title | String | Task title |
| type | String | "TEMPORARY" or "PERMANENT" |
| date | String | Format: YYYY-MM-DD |
| weekday | Number | 1–7 |
| startTime | String | Format: HH:mm |
| endTime | String | Format: HH:mm |
| emergency | Number | Priority level (1–5) |
| location | String | Task location |
| mapProvider | String | "google", "apple", "baidu" |
| description | String | Task description |
| done | Boolean | Completion status |

### 🔔 Reminder Model
| Field | Type | Description |
| :--- | :--- | :--- |
| id | String | Reminder ID |
| userId | ObjectId | Reference to User |
| title | String | Reminder title |
| emergency | Number | Priority level |
| done | Boolean | Completion status |

---

## 📌 Notes

- Ensure your backend is running before starting the frontend.
- Use strong values for `JWT_SECRET` in production.
- MongoDB Atlas is recommended for cloud deployment.