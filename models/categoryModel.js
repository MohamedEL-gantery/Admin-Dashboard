const mongoose = require('mongoose');
const validator = require('validator');
const slugify = require('slugify');

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please Enter Your Name'],
      validate: [validator.isAlpha, 'Name Must Only Contain Characters'],
      minlength: [3, 'Name Must Have More OR Equal then 3 Characters'],
      maxlength: [50, 'Name Must Have Less OR Equal then 50 Characters'],
      unique: true,
    },
    slug: String,
  },
  {
    timestamps: true,
  }
);

categorySchema.pre('save', function (next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = slugify(this.name, { lower: true });
  }

  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
