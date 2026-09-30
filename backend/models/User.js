import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full Name is required'],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    role: {
      type: String,
      enum: ['citizen', 'admin'],
      default: 'citizen',
    },
    designation: {
      type: String,
      trim: true,
      default: 'Citizen Resident',
    },
    state: {
      type: String,
      default: 'Maharashtra',
      immutable: true,
    },
    district: {
      type: String,
      default: 'Buldhana',
      immutable: true,
    },
    gramPanchayat: {
      type: String,
      default: 'XYZ Gram Panchayat',
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

// Optional unique index on email for users who provide an email address
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: 'string' } },
  }
);

// Compare candidate password with stored bcrypt hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash || !candidatePassword) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Safe serialization removing sensitive hash
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
