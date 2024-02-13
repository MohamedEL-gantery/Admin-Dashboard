const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please Enter Your Name'],
      minlength: [3, 'Name Must Have More OR Equal then 3 Characters'],
      trim: true,
      validate: [validator.isAlpha, 'Name Must Only Contain Characters'],
    },
    slug: String,
    email: {
      type: String,
      required: [true, 'Please Enter Your Email'],
      validate: [validator.isEmail, 'Enter A Valid Email'],
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please Enter Your Password'],
      validate: [
        validator.isStrongPassword,
        'Enter A Strong Password With minLength: 8,  minlowercase letter:1 ,minlowercase letter:1 min number:1, min symbol:1',
      ],
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        validator: function (val) {
          return val === this.password;
        },
        message: 'Password Are not the same',
      },
    },
    phoneNumber: {
      type: String,
      validate: {
        validator: function (val) {
          return validator.isMobilePhone(val, 'ar-EG');
        },
        message: 'Invalid phoneNumber for Egypt',
      },
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      message: 'Gender must be Male or Female',
    },
    age: {
      type: Number,
      validate: {
        validator: function (val) {
          return validator.isInt(String(val));
        },
        message: 'Enter a valid age',
      },
    },
    birthDay: {
      type: Date,
      validate: [validator.isDate, 'Enter A Valid Date'],
    },
    active: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'manger'],
      default: 'user',
    },
    passwordChangedAt: Date,
    passwordResetExpires: Date,
    passwordResetCode: String,
    passwordResetVerified: Boolean,
    signupResetExpires: Date,
    signupResetCode: String,
    signupResetVerified: Boolean,
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now();
  next();
});

userSchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = slugify(this.name, { lower: true });
  }

  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const timePasswordChanged = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp < timePasswordChanged;
  }
  return false;
};

userSchema.methods.createVerifySignUpCode = function () {
  const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

  this.signupResetCode = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');

  this.signupResetExpires = Date.now() + 10 * 60 * 1000;
  this.signupResetVerified = false;
  return resetCode;
};

userSchema.methods.createResetCode = function () {
  const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

  this.passwordResetCode = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  this.passwordResetVerified = false;
  return resetCode;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
