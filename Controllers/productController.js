const expressAsync = require('express-async-handler');
const Product = require('../models/productModel');
const uploadMedia = require('../utils/uploadMedia');
const ApiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const User = require('../models/userModel');

exports.createProduct = expressAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.role === 'admin') {
    const uploadRes = await uploadMedia(req.file.path);
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
  } else if (user.role === 'manger') {
    const uploadRes = await uploadMedia(req.file.path);
    const { name, price, color, quantity, description, category, user } =
      req.body;
    if (uploadRes) {
      const product = await Product.create({
        name,
        price,
        description,
        quantity,
        color,
        media: uploadRes.url,
        category,
        user,
      });
      res.status(201).json({
        status: 'success',
        data: product,
      });
    }
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
  let product;
  product = await Product.findById(req.params.id);

  if (req.user.id !== product.user.id) {
    return next(
      new AppError(
        'You Do Not Have Permission To Perform This Action Only Manger of This Product And Admin',
        403
      )
    );
  }

  if (!product) {
    return next(new AppError(`NO Product Found With Id ${req.params.id}`));
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: product,
  });
});

exports.deleteOneProduct = expressAsync(async (req, res, next) => {
  let product;

  product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError(`NO Product Found With Id ${req.params.id}`));
  }

  if (req.user.id !== product.user.id) {
    return next(
      new AppError(
        'You Do Not Have Permission To Perform This Action Only Manger of This Product And Admin',
        403
      )
    );
  }

  product = await Product.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
