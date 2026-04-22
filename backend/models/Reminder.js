// INPUT: reminder fields used by the reminder feature
// OUTPUT: MongoDB reminder model
// EFFECT: Stores persistent reminder records for each signed-in user
const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String },
  emergency: { type: Number, default: 5 },
  done: { type: Boolean, default: false },
  userId: { type: String, required: true },
  createdAt: { type: String },
  updatedAt: { type: String }
}, { strict: false });

module.exports = mongoose.model('Reminder', reminderSchema);
