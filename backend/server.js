require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const Task = require('./models/Task');
const User = require('./models/User');
const Reminder = require('./models/Reminder');
const HelpQuestion = require('./models/HelpQuestion');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("Database connection error:", err));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decodedUser) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = decodedUser; 
    next();
  });
};

app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: "Username taken" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const newUser = new User({ username, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "Registered" });
  } catch (err) {
    res.status(500).json({ error: "Failed to register" });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(200).json({ token, username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Failed to log in" });
  }
});

app.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.userId }, { _id: 0, __v: 0 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

app.post('/tasks', authenticateToken, async (req, res) => {
  try {
    const newTasks = req.body; 
    await Task.deleteMany({ userId: req.user.userId });
    
    if (newTasks && newTasks.length > 0) {
      const tasksWithUser = newTasks.map(task => ({
        ...task,
        userId: req.user.userId
      }));
      await Task.insertMany(tasksWithUser);
    }
    
    res.status(200).json({ message: "Saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save" });
  }
});

app.get('/reminders', authenticateToken, async (req, res) => {
  try {
    const reminders = await Reminder.find({ userId: req.user.userId }, { _id: 0, __v: 0 });
    res.status(200).json(reminders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch" });
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
    res.status(200).json({ message: "Saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save" });
  }
});

app.get('/help-questions', authenticateToken, async (req, res) => {
  try {
    const questions = await HelpQuestion.find({}, { _id: 0, __v: 0 }).sort({ createdAt: -1 });
    res.status(200).json(questions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

app.post('/help-questions', authenticateToken, async (req, res) => {
  try {
    const { id, question, createdAt } = req.body;
    if (!question || !String(question).trim()) {
      return res.status(400).json({ error: "Question is required" });
    }

    const newQuestion = new HelpQuestion({
      id,
      username: req.user.username,
      question: String(question).trim(),
      createdAt,
    });

    await newQuestion.save();
    res.status(201).json({ message: "Saved" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save" });
  }
});

const PORT = process.env.PORT || 2676;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
