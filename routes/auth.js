const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.put(
  '/signup',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Please enter a valid email')
      .custom(value => {
        return User.findOne({ where: { email: value } }).then(user => {
          if (user) {
            return Promise.reject('Email already exist');
          }
        });
      })
      .normalizeEmail(),
    body('name', 'Please enter your name').trim().isString(),
    body(
      'password',
      'Please enter a password with only text and numbers and atleast 5 characters long'
    )
      .trim()
      .isAlphanumeric()
      .isLength({ min: 5 }),
  ],
  authController.signUp
);

router.post('/login', authController.login);

router.get('/status', isAuth, authController.getStatus);

router.put(
  '/status',
  isAuth,
  [body('status', 'Please enter user status').trim().not().isEmpty()],
  authController.updateStatus
);

module.exports = router;
