const path = require('path');
const fs = require('fs');

// For removing old image on update post with new image
const clearImage = filePath => {
  console.log(filePath);
  console.log(__dirname);
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};

exports.clearImage = clearImage;
