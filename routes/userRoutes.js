const express = require('express');
const authController = require('../Controllers/authController');
const userController = require('../Controllers/userController');

const router = express.Router();

router.use(authController.protected);

router.route('/getMe').get(userController.getMe, userController.getOne);

router.route('/updateMe').patch(userController.updateMe);

router.route('/deleteMe').delete(userController.deleteMe);

router.use(authController.restrictTo('admin'));

router.route('/').get(userController.getAllUser);

router
  .route('/:id')
  .get(userController.getOne)
  .patch(userController.updateOne)
  .delete(userController.deleteOne);

module.exports = router;
