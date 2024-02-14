const User = require('../models/userModel');
const expressAsync = require('express-async-handler');
const ApiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.createUser = expressAsync(async (req, res, next) => {
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    role: req.body.role,
    signupResetVerified: true,
  });

  res.status(201).json({
    status: 'success',
    data: user,
  });
});

exports.getAllUser = expressAsync(async (req, res, next) => {
  const documentsCounts = await User.countDocuments();

  const features = new ApiFeatures(
    User.find({ role: { $ne: 'admin' } }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate(documentsCounts);

  const { query, paginationResult } = features;

  const users = await query;

  res.status(200).json({
    status: 'success',
    result: users.length,
    paginationResult,
    data: users,
  });
});

exports.getOne = expressAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError(`No User Found With This ID :${req.params.id} `));
  }

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

exports.updateMe = expressAsync(async (req, res, next) => {
  if (req.body.password || req.body.password) {
    return next(
      new AppError(
        'This Route IS Not For Password Updates. Please Use /updateMyPassword.',
        400
      )
    );
  }

  const filteredBody = filterObj(
    req.body,
    'name',
    'email',
    'age',
    'gender',
    'birthDay',
    'phoneNumber'
  );

  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    return next(new AppError(`No User Found With This ID :${req.user.id} `));
  }

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

exports.updateOne = expressAsync(async (req, res, next) => {
  if (req.body.password || req.body.password) {
    return next(
      new AppError(
        'This Route IS Not For Password Updates. Please Use /updateMyPassword.',
        400
      )
    );
  }

  const user = await User.findByIdAndUpdate(req.user.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    return next(new AppError(`No User Found With This ID :${req.params.id} `));
  }

  res.status(200).json({
    status: 'success',
    data: user,
  });
});

exports.deleteMe = expressAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.deleteOne = expressAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError(`No User Found With This ID :${req.params.id} `));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
