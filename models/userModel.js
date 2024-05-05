const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
// eslint-disable-next-line import/no-extraneous-dependencies, node/no-extraneous-require
const bcrypt = require('bcrypt');
// name, email,photo,password,passwordConfirm

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User name is required']
  },
  email: {
    type: String,
    unique: [true, 'The email provided is already in use'],
    required: [true, 'The email is required'],
    lowercase: true,
    validate: [validator.isEmail, 'You must enter a valid email']
  },
  photo: {
    type: String,
    default: `default.jpg`
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    minlength: 8,
    select: false
  },

  passwordConfirm: {
    type: String,
    required: [true, 'please confirm your password'],
    validate: function(el) {
      return el === this.password;
    },
    message: 'Password are not same'
  },
  passwordChangeAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  }
});
// this is the time frame of getting the data and saving the data
userSchema.pre('save', async function(next) {
  // Only run if the password is modified
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  // Deleted the confirm password field
  this.passwordConfirm = undefined;
  next();
});

// it is to check weather the password has been
// modified or not
userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangeAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function(next) {
  // this finds to the current query
  this.find({ active: { $ne: false } });
  next();
});

// read in deatil in lecture 130 from your course
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// this is the method related to check if the user has actually changed their password
// by default it will return false
userSchema.methods.changedPasswordAfter = async function(JWTTimesstamp) {
  if (this.passwordChangeAt) {
    const changedTimestamp = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10
    );
    return JWTTimesstamp < changedTimestamp;
  }

  // false means NOT changed
  return false;
};
// now after doing this just call the function in auth controller

userSchema.methods.createPasswordResetToken = function() {
  // so this will create a cryptographic
  // hexadecimal reset token and send it to the
  // users email
  const resetToken = crypto.randomBytes(32).toString('hex');

  // so this is a less secure token
  // as it is only need to create a reset password token
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  // eslint-disable-next-line no-console
  // console.log({ resetToken }, this.passwordResetToken);

  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
