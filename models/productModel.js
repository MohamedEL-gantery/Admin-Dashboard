const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please Enter Your Name'],
      minlength: [3, 'Name Must Have More OR Equal then 3 Characters'],
      maxlength: [50, 'Name Must Have Less OR Equal then 50 Characters'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please Enter Price for Product'],
      validate: {
        validator: function (val) {
          return validator.isInt(String(val));
        },
        message: 'Enter a valid Price',
      },
    },
    slug: String,
    description: {
      type: String,
      required: [true, 'Please Enter Your description'],
      validate: [
        validator.isAlpha,
        'Name Must Only Contain Characters And Number',
      ],
      minlength: [10, 'Name Must Have More OR Equal then 100 Characters'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Please Enter Quantity for Product'],
      validate: {
        validator: function (val) {
          return validator.isInt(String(val));
        },
        message: 'Enter a valid Quantity',
      },
    },
    color: {
      type: String,
      required: [true, 'Please Enter Your Color'],
      validate: [validator.isAlpha, 'Color Must Only Contain Characters'],
    },
    media: {
      type: String,
      // required: [true, 'Please Enter Media '],
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'Please Enter A Category ID'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['in stock', 'out of stock'],
      delete: 'in stock',
    },
  },
  {
    timestamps: true,
  }
);

productSchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = slugify(this.name, { lower: true });
  }

  next();
});

productSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'category',
    select: 'name -_id',
  });
  next();
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
