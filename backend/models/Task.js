const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, required: true },
  weekday: { type: Number },
  emergency: { type: Number, default: 0 },
  ymd: { type: String },
  completed: { type: Boolean, default: false }
});

module.exports = mongoose.model('Task', taskSchema);