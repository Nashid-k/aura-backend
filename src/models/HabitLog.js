const mongoose = require('mongoose');

const habitLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    habit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    skipped: {
      type: Boolean,
      default: false,
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    value: {
      type: Number,
      default: 1,
    },
    progress: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

habitLogSchema.index({ user: 1, habit: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('HabitLog', habitLogSchema);
