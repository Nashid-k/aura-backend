import mongoose from 'mongoose';

const identitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
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
  { timestamps: true }
);

export default mongoose.model('Identity', identitySchema);
