import mongoose from 'mongoose';

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
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
