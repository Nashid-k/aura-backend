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
    pushSubscriptions: {
      type: [Object],
      default: [],
    },
    preferences: {
      persona: { 
        type: String, 
        enum: ['maya', 'stoic', 'visionary', 'scientist'], 
        default: 'maya' 
      },
      theme: { type: String, default: 'deep-space' }
    },
    keystoneHabitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Habit' },
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
    identity: {
      archetype: { type: String, default: 'The Initiate' },
      description: { type: String, default: 'A seeker stepping onto the path of intentional living.' },
      level: { type: Number, default: 1 },
      sigilParams: {
        lines: { type: String, default: 'fluid', enum: ['fluid', 'angular', 'mixed'] },
        complexity: { type: Number, default: 3, min: 1, max: 12 },
        auraColor: { type: String, default: '#FDBA74' },
        symmetry: { type: Number, default: 4, min: 3, max: 12 },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
