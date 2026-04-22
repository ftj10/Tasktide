// INPUT: user credential fields
// OUTPUT: MongoDB user model
// EFFECT: Stores authentication records for the planner login and registration features
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

module.exports = mongoose.model('User', userSchema);
