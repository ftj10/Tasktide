const mongoose = require('mongoose');

// By adding { strict: false }, we tell Mongoose to accept all fields 
// your React app sends, even if they aren't explicitly listed here!
const taskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, required: true }
}, { strict: false }); 

module.exports = mongoose.model('Task', taskSchema);