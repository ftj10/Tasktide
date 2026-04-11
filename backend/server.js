require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Task = require('./models/Task');

const app = express();

// Middleware
app.use(cors()); // Allows your React frontend to talk to this server
app.use(express.json()); // Allows the server to read incoming JSON data

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ Database connection error:", err));

// Route 1: Load Tasks (GET /tasks)
app.get('/tasks', async (req, res) => {
  try {
    // Find all tasks, exclude the internal MongoDB '_id' and '__v' fields
    const tasks = await Task.find({}, { _id: 0, __v: 0 });
    res.status(200).json(tasks);
  } catch (err) {
    console.error("Error loading tasks:", err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Route 2: Save Tasks (POST /tasks)
// Because your frontend sends the entire list of tasks every time you save,
// we will clear the old database and replace it with the new list.
app.post('/tasks', async (req, res) => {
  try {
    const newTasks = req.body; 
    
    // Clear out the old tasks
    await Task.deleteMany({});
    
    // Insert the new list if it's not empty
    if (newTasks && newTasks.length > 0) {
      await Task.insertMany(newTasks);
    }
    
    res.status(200).json({ message: "Tasks saved successfully" });
  } catch (err) {
    console.error("Error saving tasks:", err);
    res.status(500).json({ error: "Failed to save tasks" });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});