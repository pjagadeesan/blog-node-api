const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signUp = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    //error.data = errors.array();
    throw error;
  }
  const { email, name, password } = req.body;
  bcrypt
    .hash(password, 12)
    .then(hashedPassword => {
      return User.create({ email, password: hashedPassword, name });
    })
    .then(newUser => {
      res.status(201).json({
        message: 'User created successfully!',
        userId: newUser.id,
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.login = (req, res, next) => {
  const { email, password } = req.body;
  let loadedUser;
  User.findOne({ where: { email } })
    .then(user => {
      if (!user) {
        const error = new Error('Email does not exist');
        error.statusCode = 401;
        //error.data = errors.array();
        throw error;
      }
      loadedUser = user;
      return bcrypt.compare(password, loadedUser.password);
    })
    .then(doMatch => {
      if (!doMatch) {
        const error = new Error('Incorrect password');
        error.statusCode = 401;
        //error.data = errors.array();
        throw error;
      }
      //generate JWT -JSON web token
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser.id,
        },
        'mysupersecret',
        { expiresIn: '1h' }
      );
      res.status(200).json({
        token,
        userId: loadedUser.id,
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getStatus = (req, res, next) => {
  User.findByPk(req.userId)
    .then(user => {
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        //error.data = errors.array();
        throw error;
      }
      res.status(200).json({
        status: user.status,
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updateStatus = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    //error.data = errors.array();
    throw error;
  }
  const newStatus = req.body.status;
  User.findByPk(req.userId)
    .then(user => {
      if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        //error.data = errors.array();
        throw error;
      }
      user.status = newStatus;
      return user.save();
    })
    .then(result => {
      res.status(200).json({
        message: 'User status updated successfully!',
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};
