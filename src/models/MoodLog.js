const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    mood: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    energy: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    note: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

moodLogSchema.index({ user: 1, date: -1 }, { unique: true });

module.exports = mongoose.model('MoodLog', moodLogSchema);
