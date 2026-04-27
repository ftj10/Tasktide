// INPUT: shared help-question fields
// OUTPUT: MongoDB help-question model
// EFFECT: Stores help-board submissions owned by users and reviewable by admins
const mongoose = require('mongoose');

const helpQuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  question: { type: String, required: true },
  createdAt: { type: String, required: true, default: () => new Date().toISOString() },
});

helpQuestionSchema.index({ id: 1 }, { unique: true });

module.exports = mongoose.model('HelpQuestion', helpQuestionSchema);
