const mongoose = require('mongoose');

const dB = (url) => {
  mongoose
    .connect(url)
    .then(() => {
      console.log('DB Connected Successfully');
    })
    .catch((err) => {
      console.log(err);
    });
};

module.exports = dB;
