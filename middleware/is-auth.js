const jwt = require('jsonwebtoken');

const User = require('../models/user');

module.exports = async (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
    const error = new Error('Not authorized');
    error.statusCode = 401;
    throw error;
  }
  //sample token from client:  Bearer sdfs454543sdfdf
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'mysupersecret');
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error('Not authorized');
    error.statusCode = 401;
    throw error;
  }
  req.userId = decodedToken.userId;
  try {
    const user = await User.findByPk(req.userId);
    req.user = user;
    next();
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
      next(err);
    }
  }
};
