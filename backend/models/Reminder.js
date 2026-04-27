// INPUT: reminder fields used by the reminder feature
// OUTPUT: MongoDB reminder model
// EFFECT: Stores persistent reminder records for each signed-in user
const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, default: "" },
  emergency: { type: Number, default: 5 },
  done: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
});

reminderSchema.index({ userId: 1, id: 1 }, { unique: true });

module.exports = mongoose.model('Reminder', reminderSchema);
