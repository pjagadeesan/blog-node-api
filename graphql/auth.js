const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');

module.exports = {
  createUser: async ({ userInput }, req) => {
    const { email, name, password } = userInput;
    const errors = [];
    if (!validator.isEmail(email)) {
      errors.push({ message: 'E-mail is invalid.' });
    }
    if (validator.isEmpty(password) || !validator.isLength(password, { min: 5 })) {
      errors.push({ message: 'Password too short!' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const existingUser = await User.findOne({ where: { email }, include: Post });
    if (existingUser) {
      const error = new Error('Email exists already!');
      throw error;
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({ email, password: hashedPassword, name });
    return newUser;
  },

  login: async ({ email, password }, req) => {
    const errors = [];
    const user = await User.findOne({ where: { email } });
    if (!user) {
      const error = new Error('Email does not exist');
      error.code = 401;
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

    return {
      token,
      userId: user.id,
    };
  },

  status: async (args, req) => {
    if (!req.isAuth) {
      const error = new Error('Not authenticaetd!');
      error.code = 401;
      throw error;
    }
    const user = await User.findByPk(req.userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      //error.data = errors.array();
      throw error;
    }
    return user.status;
  },

  updateStatus: async ({ status }, req) => {
    if (!req.isAuth) {
      const error = new Error('Not authenticaetd!');
      error.code = 401;
      throw error;
    }
    if (validator.isEmpty(status)) {
      const error = new Error('Invalid status!');
      error.statusCode = 422;
      //error.data = errors.array();
      throw error;
    }
    const user = await User.findByPk(req.userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      //error.data = errors.array();
      throw error;
    }
    user.status = status;
    await user.save();
    return true;
  },
};
