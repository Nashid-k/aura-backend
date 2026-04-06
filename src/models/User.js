const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    notificationOptIn: {
      type: Boolean,
      default: false,
    },
    aiNudgeCache: {
      text: { type: String, default: '' },
      date: { type: String, default: '' },
    },
    tomorrowRisks: {
      date: { type: String, default: '' },
      shieldNudge: { type: String, default: '' },
      risks: [
        {
          habitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit' },
          title: String,
          reason: String,
        },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
