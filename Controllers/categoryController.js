const expressAsync = require('express-async-handler');
const Category = require('../models/categoryModel');
const ApiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');

exports.CreateCategory = expressAsync(async (req, res, next) => {
  const NewCategory = await Category.create(req.body);
  res.status(201).json({
    status: 'success',
    data: NewCategory,
  });
});

exports.getAllCategory = expressAsync(async (req, res, next) => {
  const documentsCounts = await Category.countDocuments();

  const features = new ApiFeatures(Category.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate(documentsCounts);

  const { query, paginationResult } = features;

  const categories = await query;

  res.status(200).json({
    status: 'success',
    result: categories.length,
    paginationResult,
    data: categories,
  });
});

exports.getOneCategory = expressAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new AppError(`NO Category Found With Id ${req.params.id}`));
  }

  res.status(200).json({
    status: 'success',
    data: category,
  });
});

exports.updateOneCategory = expressAsync(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!category) {
    return next(new AppError(`NO Category Found With Id ${req.params.id}`));
  }

  res.status(200).json({
    status: 'success',
    data: category,
  });
});

exports.deleteOneCategory = expressAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);

  if (!category) {
    return next(new AppError(`NO Category Found With Id ${req.params.id}`));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
