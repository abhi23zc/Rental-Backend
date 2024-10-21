import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv'

dotenv.config();
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /.+\@.+\..+/,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }]
});

userSchema.methods.generateJwtToken = function () {
  return jwt.sign(
    { userId: this._id, email: this.email, role: this.role, username :this.username },
    process.env.JWT_SECRET,
    { expiresIn: '10d' }
  );
};


userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});


userSchema.methods.comparePassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    return null
  }
};


export const User = mongoose.model('User', userSchema);
