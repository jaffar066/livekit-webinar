import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fName: {
      type: String,
      trim: true,
    },
    lName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      minlength: 6,
    },

    phoneNumber: {
      type: String,
      trim: true,
    },

    // ✅ OAuth fields
    googleId: {
      type: String,
    },

    name: String, // full name from Google

    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);