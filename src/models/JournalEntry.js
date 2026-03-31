const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    detectedActions: [
      {
        type: { type: String, enum: ['completed', 'progress'] },
        habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit' },
        title: String,
        value: Number,
      },
    ],
  },
  { timestamps: true }
);

// Ensure one entry per day per user
journalEntrySchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('JournalEntry', journalEntrySchema);
