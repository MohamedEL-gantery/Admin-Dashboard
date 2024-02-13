const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const expressAsync = require('express-async-handler');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const createSendToken = require('../utils/createToken');
const sendEmail = require('../utils/sendEmail');

exports.signup = expressAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  const resetCode = newUser.createVerifySignUpCode();
  await newUser.save({ validateBeforeSave: false });

  const date = new Date();
  const dateString = date.toLocaleTimeString('en-EG');
  const message = `Hello ${newUser.name},\n Glad to have you. \n We received a request to sign up on E-Shop in ${dateString}. \n ${resetCode} \n Please confirm this code to complete the sign up.\n Once confirmed, you'll be able to log in with your new account. \n E-Shop Team`;
  try {
    sendEmail({
      email: newUser.email,
      subject: 'Your verification code (valid for 10 min)',
      message,
    });
    const signToken = (id) => {
      return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_SECRET_EXPIRES_IN,
      });
    };
    const token = signToken(newUser._id);
    res.status(201).json({
      status: 'success',
      message: 'Verification Code sent to Email',
      token,
    });
  } catch (err) {
    newUser.signupResetCode = undefined;
    newUser.signupResetExpires = undefined;
    newUser.signupResetVerified = undefined;
    await newUser.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});

exports.verifySignup = expressAsync(async (req, res, next) => {
  let user = await User.findById(req.user.id);

  if (!user) {
    return next(
      new AppError('The User Belonging To This Token Does No Longer Exist', 401)
    );
  }

  const resetCode = req.body.resetCode;
  const hashedResetCode = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');

  user = await User.findOne({
    signupResetCode: hashedResetCode,
    signupResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    await User.findByIdAndDelete(req.user.id);
    return next(new AppError('Reset Code Is Invalid Or Expired', 400));
  }

  user.signupResetCode = undefined;
  user.signupResetExpires = undefined;
  user.signupResetVerified = true;

  await user.save({ validateBeforeSave: false });

  createSendToken(user, 201, req, res);
});

exports.login = expressAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Email and Password Are Required', 401));
  }

  const user = await User.findOne({ email: email });

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email OR Password', 401));
  }

  if (user.signupResetVerified !== true) {
    return next(new AppError('This User Does Not Longer Exist', 401));
  }

  if (user.active !== true || user.role !== 'user') {
    return next(
      new AppError(
        'Your Account Not Support Again Please Send Email To Admin ',
        401
      )
    );
  }

  const date = new Date();
  const dateString = date.toLocaleTimeString('en-EG');
  const message = `Hi ${user.name},\n You Have Loged In ${dateString}. \n E-Shop Team`;

  try {
    sendEmail({
      email: user.email,
      subject: "Welcome To E-Shop We 're Glad To Have You",
      message,
    });

    createSendToken(user, 200, req, res);
  } catch (err) {
    return next(
      new AppError('There Was An Error Sending The Email. Try Again Later!'),
      500
    );
  }
});

exports.loginAdmin = expressAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Email and Password Are Required', 401));
  }

  const user = await User.findOne({ email: email });

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect Email OR Password', 401));
  }

  if (user.active !== true || user.role !== 'admin') {
    return next(
      new AppError('You Do Not Have Permission To Perform This Action', 401)
    );
  }

  const date = new Date();
  const dateString = date.toLocaleTimeString('en-EG');
  const message = `Hi Admin ,\n You Have Loged In ${dateString}. \n E-Shop Team`;

  try {
    sendEmail({
      email: user.email,
      subject: 'E-Shop',
      message,
    });

    createSendToken(user, 200, req, res);
  } catch (err) {
    return next(
      new AppError('There Was An Error Sending The Email. Try Again Later!'),
      500
    );
  }
});

exports.protected = expressAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You Are Not Logged In! Please Log In To Get Access.', 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('The User Belonging To This Token Does No Longer Exist', 401)
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'User Belong To This Token Recently Changed Password! Please Log In Again',
        401
      )
    );
  }

  req.user = currentUser;
  next();
});

exports.forgetPassword = expressAsync(async (req, res, next) => {
  const email = req.body.email;
  const user = await User.findOne({ email: email });
  if (!user) {
    return next(
      new AppError(`There Is No User With Email ${req.body.email}`, 404)
    );
  }

  const resetCode = user.createResetCode();
  await user.save({ validateBeforeSave: false });

  const date = new Date();
  const dateString = date.toLocaleTimeString('en-EG');
  const message = `Hi ${user.name},\n We received a request to reset the password on your E-shop Account in ${dateString}. \n ${resetCode} \n Enter this code to complete the reset. \n Thanks for helping us keep your account secure.\n The E-shop Team`;
  try {
    sendEmail({
      email: user.email,
      subject: 'Your password reset code (valid for 10 min)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'code send Successfully To Email',
    });
  } catch (err) {
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResetVerified = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There was an error sending the email. Try again later!',
        500
      )
    );
  }
});

exports.verifyResetCode = expressAsync(async (req, res, next) => {
  const resetCode = req.body.resetCode;
  const hashedResetCode = crypto
    .createHash('sha256')
    .update(resetCode)
    .digest('hex');

  const user = await User.findOne({
    passwordResetCode: hashedResetCode,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Reset Code Is Invalid Or Expired', 400));
  }

  user.passwordResetVerified = true;
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, req, res);
});

exports.resetPassword = expressAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(
      new AppError(`There is No User Found With Id ${req.user.id}`, 404)
    );
  }

  if (!user.passwordResetVerified) {
    return next(new AppError('Reset Code Not Verified', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetCode = undefined;
  user.passwordResetExpires = undefined;
  user.passwordResetVerified = undefined;

  await user.save();

  createSendToken(user, 200, req, res);
});

exports.updatePassword = expressAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(
      new AppError(`There is No User Found With Id ${req.user.id}`, 404)
    );
  }
  const currentPassword = req.body.currentPassword;
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError(' Your Current Password Is Wrong', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, req, res);
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You Do Not Have Permission To Perform This Action', 403)
      );
    }
    next();
  };
};

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};
