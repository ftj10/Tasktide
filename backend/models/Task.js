// INPUT: task fields used by planner pages and dialogs
// OUTPUT: MongoDB task model
// EFFECT: Stores temporary and permanent task records for each signed-in user
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  type: { type: String, required: true, default: "TEMPORARY" },
  date: { type: String },
  weekday: { type: Number },
  beginDate: { type: String },
  recurrence: {
    frequency: { type: String },
    interval: { type: Number },
    weekdays: [{ type: Number }],
    monthDays: [{ type: Number }],
    until: { type: String, default: null },
  },
  occurrenceOverrides: {
    type: Map,
    of: new mongoose.Schema({
      title: { type: String },
      emergency: { type: Number },
      location: { type: String },
      mapProvider: { type: String },
      startTime: { type: String },
      endTime: { type: String },
      description: { type: String },
      completedAt: { type: Date, default: null },
      deleted: { type: Boolean, default: undefined },
    }, { _id: false }),
    default: {},
  },
  completedAt: { type: Date, default: null },
  done: { type: Boolean, default: undefined },
  emergency: { type: Number, default: 5 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  location: { type: String, default: "" },
  mapProvider: { type: String, default: "google" },
  startTime: { type: String, default: "" },
  endTime: { type: String, default: "" },
  description: { type: String, default: "" }
}, { timestamps: true });

taskSchema.index({ userId: 1, id: 1 }, { unique: true });
taskSchema.index({ userId: 1, completedAt: 1 });

module.exports = mongoose.model('Task', taskSchema);
