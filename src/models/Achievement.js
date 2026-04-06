const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'streak_7',
        'streak_21',
        'streak_30',
        'streak_66',
        'streak_100',
        'streak_365',
        'perfect_week',
        'category_master',
        'early_starter',
        'comeback_kid',
        'first_habit',
        'five_habits',
        'ten_habits',
        'ai_curated_title',
        'micro_win',
      ],
    },
    habitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
    },
    habitTitle: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance, but no unique constraint to allow multiple micro-wins
achievementSchema.index({ user: 1, type: 1, habitId: 1 });

module.exports = mongoose.model('Achievement', achievementSchema);
