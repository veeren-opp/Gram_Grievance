import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

/**
 * Returns next sequential unique complaint ID in format CMP-2026-000001
 * Uses atomic MongoDB findOneAndUpdate with upsert
 */
export const getNextComplaintId = async () => {
  const currentYear = new Date().getFullYear();
  const counterId = `complaints_${currentYear}`;

  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  const paddedSeq = String(counter.seq).padStart(6, '0');
  return `CMP-${currentYear}-${paddedSeq}`;
};

export default Counter;
