require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Task = require('./models/Task');
const User = require('./models/User');
const Reminder = require('./models/Reminder');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("Database connection error:", err));

// --- AUTHENTICATION MIDDLEWARE ---
// This acts as a bouncer. It checks if the request has a valid login ticket (token).
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

  if (!token) return res.status(401).json({ error: "Access denied. Please log in." });

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token." });
    req.user = decodedUser; // Attach the user info (like userId) to the request
    next();
  });
};

// --- USER ROUTES (Public) ---
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: "Username already taken" });

    // Encrypt password and save user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to register" });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Invalid username or password" });

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid username or password" });

    // Create a token that lasts for 7 days
    const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(200).json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Failed to log in" });
  }
});

// --- TASK ROUTES (Protected) ---
// Notice we added `authenticateToken` as the middle argument to these routes

app.get('/tasks', authenticateToken, async (req, res) => {
  try {
    // Only find tasks that belong to the logged-in user
    const tasks = await Task.find({ userId: req.user.userId }, { _id: 0, __v: 0 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

app.post('/tasks', authenticateToken, async (req, res) => {
  try {
    const newTasks = req.body; 
    
    // IMPORTANT: Only clear out the old tasks belonging to THIS specific user
    await Task.deleteMany({ userId: req.user.userId });
    
    if (newTasks && newTasks.length > 0) {
      // Attach the userId to every task before saving it to the database
      const tasksWithUser = newTasks.map(task => ({
        ...task,
        userId: req.user.userId
      }));
      await Task.insertMany(tasksWithUser);
    }
    
    res.status(200).json({ message: "Tasks saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save tasks" });
  }
});
// --- REMINDER ROUTES (Protected) ---
app.get('/reminders', authenticateToken, async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user.userId }, { _id: 0, __v: 0 });
    res.status(200).json(reminders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

app.post('/reminders', authenticateToken, async (req, res) => {
  try {
    const newReminders = req.body; 
    await Reminder.deleteMany({ userId: req.user.userId });
    
    if (newReminders && newReminders.length > 0) {
      const remindersWithUser = newReminders.map(r => ({ ...r, userId: req.user.userId }));
      await Reminder.insertMany(remindersWithUser);
    }
    res.status(200).json({ message: "Reminders saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save reminders" });
  }
});

const PORT = process.env.PORT || 2676;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server running on port ${PORT} at 127.0.0.1`);
});