// INPUT: shared help-question fields
// OUTPUT: MongoDB help-question model
// EFFECT: Stores public help-board submissions visible to authenticated users
const mongoose = require('mongoose');

const helpQuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  username: { type: String, required: true },
  question: { type: String, required: true },
  createdAt: { type: String, required: true },
}, { strict: false });

helpQuestionSchema.index({ id: 1 }, { unique: true });

module.exports = mongoose.model('HelpQuestion', helpQuestionSchema);
