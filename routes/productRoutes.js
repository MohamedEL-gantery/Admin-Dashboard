const express = require('express');
const authController = require('../Controllers/authController');
const productController = require('../Controllers/productController');
// const cacheProduct = require('../middlewares/cacheProduct');
const upload = require('../middlewares/multer');

const router = express.Router();

router.route('/').get(productController.getAllProduct);

router.use(authController.protected);

router
  .route('/')
  .post(
    authController.restrictTo('admin', 'manger'),
    upload.single('media'),
    productController.createProduct
  );

router
  .route('/:id')
  .get(productController.getOneProduct)
  .patch(
    authController.restrictTo('admin', 'manger'),
    upload.single('media'),
    productController.updateOneProduct
  )
  .delete(
    authController.restrictTo('admin', 'manger'),
    productController.deleteOneProduct
  );

module.exports = router;
