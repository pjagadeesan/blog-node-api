const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

exports.signUp = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    //error.data = errors.array();
    throw error;
  }
  const { email, name, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({ email, password: hashedPassword, name });
    res.status(201).json({
      message: 'User created successfully!',
      userId: newUser.id,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const error = new Error('Email does not exist');
      error.statusCode = 401;
      //error.data = errors.array();
      throw error;
    }
    const doMatch = await bcrypt.compare(password, user.password);
    if (!doMatch) {
      const error = new Error('Incorrect password');
      error.statusCode = 401;
      //error.data = errors.array();
      throw error;
    }
    //generate JWT -JSON web token
    const token = jwt.sign(
      {
        email: user.email,
        userId: user.id,
      },
      'mysupersecret',
      { expiresIn: '1h' }
    );
    res.status(200).json({
      token,
      userId: user.id,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      //error.data = errors.array();
      throw error;
    }
    res.status(200).json({
      status: user.status,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updateStatus = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    //error.data = errors.array();
    throw error;
  }
  const newStatus = req.body.status;
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      //error.data = errors.array();
      throw error;
    }
    user.status = newStatus;
    await user.save();
    res.status(200).json({
      message: 'User status updated successfully!',
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
