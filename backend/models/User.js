// INPUT: user credential fields
// OUTPUT: MongoDB user model
// EFFECT: Stores authentication records for the planner login and registration features
const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  endpoint: { type: String, required: true },
  expirationTime: { type: Number, default: null },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  userAgent: { type: String, default: "" },
  timezone: { type: String, default: "UTC" },
  locale: { type: String, default: "en" },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() },
  notificationHistory: {
    type: [
      new mongoose.Schema({
        id: { type: String, required: true },
        firedAt: { type: String, required: true },
      }, { _id: false }),
    ],
    default: [],
  },
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER', required: true },
  pushSubscriptions: {
    type: [pushSubscriptionSchema],
    default: [],
  },
});

module.exports = mongoose.model('User', userSchema);
