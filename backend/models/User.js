import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    resetToken:       { type: String, default: null },
    resetTokenExpiry: { type: Date,   default: null },
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
