import mongoose from 'mongoose';

const userIntelligenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
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

export default mongoose.model('UserIntelligence', userIntelligenceSchema);
