const mongoose = require('mongoose');

// This schema matches the Task type from your frontend
const taskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, required: true }, // e.g., 'daily', 'weekly'
  weekday: { type: Number },
  emergency: { type: Boolean, default: false },
  ymd: { type: String }, // e.g., '2023-10-25'
  completed: { type: Boolean, default: false }
});

module.exports = mongoose.model('Task', taskSchema);