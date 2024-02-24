const express = require('express');
const authController = require('../Controllers/authController');
const productController = require('../Controllers/productController');
const cacheProduct = require('../middlewares/cacheProduct');
const upload = require('../middlewares/multer');

const router = express.Router();

router.use(authController.protected);

router
  .route('/')
  .post(
    authController.restrictTo('admin', 'manger'),
    upload.single('media'),
    productController.createProduct
  )
  .get(cacheProduct, productController.getAllProduct);

router
  .route('/:id')
  .get(cacheProduct, productController.getOneProduct)
  .patch(
    authController.restrictTo('admin', 'manger'),
    productController.updateOneProduct
  )
  .delete(
    authController.restrictTo('admin', 'manger'),
    productController.deleteOneProduct
  );

module.exports = router;
