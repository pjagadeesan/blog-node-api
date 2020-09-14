const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
  const currentPage = req.query.page;
  const limit = 2;
  const offset = (currentPage - 1) * limit;
  let totalItems;
  Post.count()
    .then(count => {
      totalItems = count;
      return Post.findAll({ limit, offset, include: User });
    })
    .then(posts => {
      res.status(200).json({
        message: 'Fetched posts successfuly',
        posts,
        totalItems,
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findByPk(postId, { include: User })
    .then(post => {
      if (!post) {
        const error = new Error('Post not found');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({
        message: 'Post fetched',
        post,
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.createPost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    throw error;
  }
  if (!req.file) {
    const error = new Error('No image provided');
    error.statusCode = 422;
    throw error;
  }
  const imageUrl = req.file.path;
  const title = req.body.title;
  const content = req.body.content;

  // create post in db
  /*Post.create({
    title,
    content,
    imageUrl,
    creator: 'Priya',
  })*/
  req.user
    .createPost({
      title,
      content,
      imageUrl,
    })
    .then(result => {
      res.status(201).json({
        message: 'Post created successfully!',
        post: result,
        creator: req.user.name,
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.updatePost = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error('Validation failed, entered data is incorrect');
    error.statusCode = 422;
    throw error;
  }
  const postId = req.params.postId;
  const { title, content } = req.body;
  //if no new file was added
  let imageUrl = req.body.image;
  //if a new was picked
  if (req.file) {
    imageUrl = req.file.path;
  }
  if (imageUrl === undefined) {
    const error = new Error('No file picked');
    error.statusCode = 422;
    throw error;
  }

  Post.findByPk(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Post not found');
        error.statusCode = 404;
        throw error;
      }
      //only the post owner can update the post
      if (post.userId !== req.userId) {
        const error = new Error('Not Authorized');
        error.statusCode = 403;
        throw error;
      }
      // if the user uploaded a new image remove the old one
      if (imageUrl !== post.imageUrl) {
        clearImage(post.imageUrl);
      }
      post.title = title;
      post.content = content;
      post.imageUrl = imageUrl;
      return post.save();
      //return post;
    })
    .then(result => {
      res.status(200).json({
        message: 'Post updated successfully!',
        post: result,
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

exports.deletePost = (req, res, next) => {
  const postId = req.params.postId;
  console.log('deleting post:' + postId);
  Post.findByPk(postId)
    .then(post => {
      if (!post) {
        const error = new Error('Post not found');
        error.statusCode = 404;
        throw error;
      }
      //only the post owner can delete the post
      if (post.userId !== req.userId) {
        console.log('cannot delete post:' + req.userId);
        const error = new Error('Not Authorized');
        error.statusCode = 403;
        throw error;
      }
      clearImage(post.imageUrl);
      return post.destroy();
    })
    .then(result => {
      res.status(200).json({
        message: 'Post deleted successfully!',
      });
    })
    .catch(err => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    });
};

// For removing old image on update post with new image
const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};
