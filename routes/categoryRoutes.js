const express = require('express');
const authController = require('../Controllers/authController');
const categoryController = require('../Controllers/categoryController');

const router = express.Router();

router.use(authController.protected);

router
  .route('/')
  .post(authController.restrictTo('admin'), categoryController.CreateCategory)
  .get(
    authController.restrictTo('admin', 'user'),
    categoryController.getAllCategory
  );

router
  .route('/:id')
  .get(
    authController.restrictTo('admin', 'user'),
    categoryController.getOneCategory
  )
  .patch(
    authController.restrictTo('admin'),
    categoryController.updateOneCategory
  )
  .delete(
    authController.restrictTo('admin'),
    categoryController.deleteOneCategory
  );

module.exports = router;
