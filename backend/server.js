// INPUT: HTTP requests for auth, tasks, reminders, and help questions
// OUTPUT: Express application plus startup helpers
// EFFECT: Exposes the backend API used by the weekly planner features and persists data through MongoDB models
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

// Keep-Alive Endpoint for Render Free Tier
app.get('/ping', (req, res) => {
  console.log('Keep-alive ping received at:', new Date().toISOString());
  res.status(200).send('hi,afausbeweufhqweuofbajksbfweq');
});

// INPUT: userId
// OUTPUT: cleanup completion
// EFFECT: Removes temporary tasks older than 30 days for the signed-in user
function cleanupTasksForUser(userId) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  return Task.deleteMany({
    userId,
    type: 'TEMPORARY',
    date: { $lt: cutoffDate.toISOString().slice(0, 10) }
  });
}

// INPUT: userId
// OUTPUT: cleanup completion
// EFFECT: Removes completed reminders older than 30 days for the signed-in user
function cleanupRemindersForUser(userId) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30);

  return Reminder.deleteMany({
    userId,
    done: true,
    updatedAt: { $lt: cutoffDate.toISOString() }
  });
}

// INPUT: bearer token request header
// OUTPUT: decoded user on req.user or an auth error response
// EFFECT: Protects planner routes so each request is tied to a signed-in user
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

// INPUT: username and password
// OUTPUT: registration success or validation failure
// EFFECT: Creates a new account for the planner authentication feature
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

// INPUT: username and password
// OUTPUT: JWT token plus username for the frontend session
// EFFECT: Starts an authenticated planner session for an existing user
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

// INPUT: authenticated user id
// OUTPUT: saved task records for that user
// EFFECT: Loads the current planner task state
app.get('/tasks', authenticateToken, async (req, res) => {
  try {
    await cleanupTasksForUser(req.user.userId);
    const tasks = await Task.find({ userId: req.user.userId }, { _id: 0, __v: 0 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// INPUT: authenticated user id plus a new task
// OUTPUT: create confirmation
// EFFECT: Persists one task record for the signed-in user
app.post('/tasks', authenticateToken, async (req, res) => {
  try {
    await cleanupTasksForUser(req.user.userId);
    await Task.create({
      ...req.body,
      userId: req.user.userId
    });

    res.status(201).json({ message: "Created" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save" });
  }
});

// INPUT: authenticated user id, task id, and replacement task payload
// OUTPUT: update confirmation or not-found error
// EFFECT: Updates one persisted task record for the signed-in user
app.put('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    await cleanupTasksForUser(req.user.userId);
    const updatedTask = await Task.findOneAndUpdate(
      { id: req.params.id, userId: req.user.userId },
      { ...req.body, userId: req.user.userId },
      { returnDocument: 'after' }
    );

    if (!updatedTask) return res.status(404).json({ error: "Task not found" });

    res.status(200).json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update" });
  }
});

// INPUT: authenticated user id and task id
// OUTPUT: delete confirmation or not-found error
// EFFECT: Deletes one persisted task record for the signed-in user
app.delete('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({ id: req.params.id, userId: req.user.userId });

    if (!deletedTask) return res.status(404).json({ error: "Task not found" });

    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

// INPUT: authenticated user id
// OUTPUT: saved reminder records for that user
// EFFECT: Loads the reminder list for the signed-in planner session
app.get('/reminders', authenticateToken, async (req, res) => {
  try {
    await cleanupRemindersForUser(req.user.userId);
    const reminders = await Reminder.find({ userId: req.user.userId }, { _id: 0, __v: 0 });
    res.status(200).json(reminders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// INPUT: authenticated user id plus a new reminder
// OUTPUT: create confirmation
// EFFECT: Persists one reminder record for the signed-in user
app.post('/reminders', authenticateToken, async (req, res) => {
  try {
    await cleanupRemindersForUser(req.user.userId);
    await Reminder.create({ ...req.body, userId: req.user.userId });
    res.status(201).json({ message: "Created" });
  } catch (err) {
    res.status(500).json({ error: "Failed to save" });
  }
});

// INPUT: authenticated user id, reminder id, and replacement reminder payload
// OUTPUT: update confirmation or not-found error
// EFFECT: Updates one persisted reminder record for the signed-in user
app.put('/reminders/:id', authenticateToken, async (req, res) => {
  try {
    await cleanupRemindersForUser(req.user.userId);
    const updatedReminder = await Reminder.findOneAndUpdate(
      { id: req.params.id, userId: req.user.userId },
      { ...req.body, userId: req.user.userId },
      { returnDocument: 'after' }
    );

    if (!updatedReminder) return res.status(404).json({ error: "Reminder not found" });

    res.status(200).json({ message: "Updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update" });
  }
});

// INPUT: authenticated user id and reminder id
// OUTPUT: delete confirmation or not-found error
// EFFECT: Deletes one persisted reminder record for the signed-in user
app.delete('/reminders/:id', authenticateToken, async (req, res) => {
  try {
    const deletedReminder = await Reminder.findOneAndDelete({ id: req.params.id, userId: req.user.userId });

    if (!deletedReminder) return res.status(404).json({ error: "Reminder not found" });

    res.status(200).json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

// INPUT: authenticated help-board request
// OUTPUT: public help questions ordered by recency
// EFFECT: Supplies the shared help center with cross-user questions
app.get('/help-questions', authenticateToken, async (req, res) => {
  try {
    const questions = await HelpQuestion.find({}, { _id: 0, __v: 0 }).sort({ createdAt: -1 });
    res.status(200).json(questions);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch" });
  }
});

// INPUT: authenticated username plus help question payload
// OUTPUT: save confirmation or validation error
// EFFECT: Adds a new public question to the shared help board
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

// INPUT: environment database connection string
// OUTPUT: Mongoose connection promise
// EFFECT: Connects the backend API to the configured MongoDB instance
function connectDatabase() {
  return mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB Atlas"))
    .catch(err => console.error("Database connection error:", err));
}

// INPUT: configured port
// OUTPUT: active HTTP server instance
// EFFECT: Starts the planner API process for local or deployed use
function startServer() {
  return app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

if (require.main === module) {
  connectDatabase().then(() => {
    startServer();
  });
}

module.exports = { app, authenticateToken, connectDatabase, startServer };
