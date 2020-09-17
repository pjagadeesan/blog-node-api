const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const Post = require('../models/post');

const authResolver = require('./auth');
const feedResolver = require('./feed');

module.exports = {
  createUser: (args, req) => {
    return authResolver.createUser(args, req);
  },

  login: (args, req) => {
    return authResolver.login(args, req);
  },

  status: (args, req) => {
    return authResolver.status(args, req);
  },

  updateStatus: (args, req) => {
    return authResolver.updateStatus(args, req);
  },

  createPost: (args, req) => {
    return feedResolver.createPost(args, req);
  },

  updatePost: (args, req) => {
    return feedResolver.updatePost(args, req);
  },

  deletePost: (args, req) => {
    return feedResolver.deletePost(args, req);
  },

  posts: (args, req) => {
    return feedResolver.posts(args, req);
  },

  post: (args, req) => {
    return feedResolver.post(args, req);
  },
};
