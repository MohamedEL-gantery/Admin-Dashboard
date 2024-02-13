const express = require('express');
const authController = require('../Controllers/authController');
const productController = require('../Controllers/productController');
const upload = require('../middlewares/multer');

const router = express.Router();

router.use(authController.protected);

router
  .route('/')
  .post(
    authController.restrictTo('admin'),
    upload.single('media'),
    productController.createProduct
  )
  .get(
    authController.restrictTo('admin', 'user'),
    productController.getAllProduct
  );

router
  .route('/:id')
  .get(
    authController.restrictTo('admin', 'user'),
    productController.getOneProduct
  )
  .patch(authController.restrictTo('admin'), productController.updateOneProduct)
  .delete(
    authController.restrictTo('admin'),
    productController.deleteOneProduct
  );

module.exports = router;
