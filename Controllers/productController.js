const expressAsync = require('express-async-handler');
const Product = require('../models/productModel');
const client = require('../utils/redis');
const uploadMedia = require('../utils/uploadMedia');
const ApiFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');

exports.createProduct = expressAsync(async (req, res, next) => {
  if (req.user.role === 'admin') {
    const uploadRes = await uploadMedia(req.file.path);
    const { name, price, color, quantity, description, category, stock } =
      req.body;

    // await client.connect();

    // await client.del('products');

    // await client.disconnect();

    if (uploadRes) {
      const product = await Product.create({
        name,
        price,
        description,
        quantity,
        color,
        media: uploadRes.secure_url,
        category,
        stock,
      });
      res.status(201).json({
        status: 'success',
        data: product,
      });
    }
  } else if (req.user.role === 'manger') {
    if (!req.body.user) req.body.user = req.user.id;

    const uploadRes = await uploadMedia(req.file.path);
    const { name, price, color, quantity, description, category, user } =
      req.body;

    // await client.connect();

    // await client.del('products');

    // await client.disconnect();

    if (uploadRes) {
      const product = await Product.create({
        name,
        price,
        description,
        quantity,
        color,
        media: uploadRes.secure_url,
        category,
        user,
        stock,
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

  // await client.set('products', JSON.stringify(products));
  // await client.disconnect();

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
    return next(new AppError(`NO Product Found With Id ${req.params.id}`, 404));
  }

  // await client.set(`product-${req.params.id}`, JSON.stringify(product));
  // await client.disconnect();

  res.status(200).json({
    status: 'success',
    data: product,
  });
});

exports.updateOneProduct = expressAsync(async (req, res, next) => {
  let product;
  product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError(`NO Product Found With Id ${req.params.id}`, 404));
  }

  if (req.user.role !== 'admin' && req.user.id != product.user) {
    return next(
      new AppError(
        'You Do Not Have Permission To Perform This Action Only Manger of This Product And Admin',
        403
      )
    );
  }

  const uploadRes = await uploadMedia(req.file.path);
  const { name, price, color, quantity, description, category } = req.body;

  product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      name,
      price,
      description,
      quantity,
      color,
      media: uploadRes.secure_url,
      category,
      stock,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  // await client.connect();

  // await client.del([`product-${req.params.id}`, 'products']);

  // await client.disconnect();

  res.status(200).json({
    status: 'success',
    data: product,
  });
});

exports.deleteOneProduct = expressAsync(async (req, res, next) => {
  let product;

  product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError(`NO Product Found With Id ${req.params.id}`, 404));
  }

  if (req.user.role !== 'admin' && req.user.id != product.user) {
    return next(
      new AppError(
        'You Do Not Have Permission To Perform This Action Only Manger of This Product And Admin',
        403
      )
    );
  }

  product = await Product.findByIdAndDelete(req.params.id);

  // await client.connect();

  // await client.del([`product-${req.params.id}`, 'products']);

  // await client.disconnect();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});
