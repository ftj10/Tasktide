const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, required: true },
  userId: { type: String, required: true }
}, { strict: false }); 

module.exports = mongoose.model('Task', taskSchema);