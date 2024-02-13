const expressAsync = require('express-async-handler');
const Product = require('../models/productModel');
const uploadImage = require('../utils/uploadImages');
const ApiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const Category = require('../models/categoryModel');

exports.createProduct = expressAsync(async (req, res, next) => {
  const uploadRes = await uploadImage(req.file.path);
  const { name, price, color, quantity, description, category } = req.body;
  if (uploadRes) {
    const product = await Product.create({
      name,
      price,
      description,
      quantity,
      color,
      media: uploadRes.url,
      category,
    });
    res.status(201).json({
      status: 'success',
      data: product,
    });
  }
});

exports.getAllProduct = expressAsync(async (req, res, next) => {
  const documentsCounts = await Product.countDocuments();

  const features = new ApiFeatures(Product.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate(documentsCounts);

  const { query, paginationResult } = features;

  const products = await query;

  res.status(200).json({
    status: 'success',
    result: products.length,
    paginationResult,
    data: products,
  });
});

exports.getOneProduct = expressAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError(`NO Product Found With Id ${req.params.id}`));
  }

  res.status(200).json({
    status: 'success',
    data: product,
  });
});

exports.updateOneProduct = expressAsync(async (req, res, next) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return next(new AppError(`NO Product Found With Id ${req.params.id}`));
  }

  res.status(200).json({
    status: 'success',
    data: product,
  });
});

exports.deleteOneProduct = expressAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new AppError(`NO Product Found With Id ${req.params.id}`));
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getProductByCategory = expressAsync(async (req, res, next) => {
  const categoryName = req.params.categoryName;
  console.log(categoryName);

  const category = await Category.findOne({ name: categoryName });
  if (!category) {
    return next(new AppError(`NO Category Found With Id ${req.params.id}`));
  }
  console.log(category);

  const products = await Product.find({ category: category._id });

  res.status(200).json({
    status: 'success',
    result: products.length,
    data: products,
  });
});
