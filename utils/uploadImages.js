const cloudinary = require('./cloudinary');
const fs = require('fs');

const uploadImage = async (imagePath) => {
  if (imagePath) {
    const uploadRes = await cloudinary.uploader.upload(imagePath, {
      folder: 'samples',
      use_filename: true,
    });
    if (uploadRes) {
      fs.unlinkSync(imagePath);
      return uploadRes;
    }
  }
  return false;
};

module.exports = uploadImage;
