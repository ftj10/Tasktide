const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, required: true },
  userId: { type: String, required: true },
  location: { type: String, default: "" },
  mapProvider: { type: String, default: "google" },
}, { strict: false });

module.exports = mongoose.model('Task', taskSchema);