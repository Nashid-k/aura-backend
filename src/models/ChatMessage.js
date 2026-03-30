const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    actions: [
      {
        type: { type: String },
        label: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user-scoped queries
chatMessageSchema.index({ user: 1, createdAt: -1 });

// Auto-delete messages older than 30 days
chatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
