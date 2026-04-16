import mongoose from 'mongoose';

const frequencySchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ['daily', 'weekdays', 'weekly-target'],
      default: 'daily',
    },
    daysOfWeek: {
      type: [Number],
      default: [],
    },
    targetCount: {
      type: Number,
      default: 7,
      min: 1,
      max: 7,
    },
  },
  { _id: false }
);

const habitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    icon: {
      type: String,
      default: 'bolt',
    },
    color: {
      type: String,
      default: '#F97316',
    },
    category: {
      type: String,
      default: 'Personal',
    },
    kind: {
      type: String,
      enum: ['build', 'quit'],
      default: 'build',
    },
    reminder: {
      type: String,
      default: '',
    },
    archived: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: '',
    },
    targetMetric: {
      type: String,
      default: '',
      trim: true,
    },
    targetValue: {
      type: Number,
      default: 0,
    },
    frequency: {
      type: frequencySchema,
      default: () => ({ mode: 'daily', targetCount: 7, daysOfWeek: [] }),
    },
    vacationMode: {
      active: { type: Boolean, default: false },
      until: { type: Date, default: null },
    },
    autoScaling: {
      enabled: { type: Boolean, default: true },
      continuousDaysThreshold: { type: Number, default: 14 },
      suggestedIncrease: { type: Boolean, default: false },
      evolution: {
        type: { type: String, enum: ['level-up', 'recovery', 'none'], default: 'none' },
        reason: { type: String, default: '' },
        suggestedTarget: { type: Number, default: 0 },
        status: { type: String, enum: ['pending', 'accepted', 'dismissed'], default: 'pending' }
      }
    },
    stackWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Habit',
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Habit', habitSchema);
