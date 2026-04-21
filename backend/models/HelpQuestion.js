const mongoose = require('mongoose');

const helpQuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  username: { type: String, required: true },
  question: { type: String, required: true },
  createdAt: { type: String, required: true },
}, { strict: false });

module.exports = mongoose.model('HelpQuestion', helpQuestionSchema);
