const multer = require('multer');
const fs = require('fs');
const AppError = require('../utils/appError');

if (!fs.existsSync('./media')) {
  fs.mkdirSync('./media');
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './media');
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, '.') + file.originalname);
  },
});

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        'File type not supported. Only images and videos are allowed.'
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: multerFilter,
});

module.exports = upload;
