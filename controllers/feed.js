const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');

const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const limit = 2;
  const offset = (currentPage - 1) * limit;
  try {
    const totalItems = await Post.count();
    const posts = await Post.findAll({ limit, offset, include: User });
    const resPosts = posts.map(post => {
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        creator: post.user.name,
      };
    });
    res.status(200).json({
      message: 'Fetched posts successfuly',
      posts: resPosts,
      totalItems,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findByPk(postId, { include: User });
    if (!post) {
      const error = new Error('Post not found');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      message: 'Post fetched',
      post,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
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
  try {
    const post = await req.user.createPost({
      title,
      content,
      imageUrl,
    });
    res.status(201).json({
      message: 'Post created successfully!',
      post,
      creator: req.user.name,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.updatePost = async (req, res, next) => {
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
  try {
    const post = await Post.findByPk(postId);
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
    const updatedPost = await post.save();
    res.status(200).json({
      message: 'Post updated successfully!',
      post: updatedPost,
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.deletePost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findByPk(postId);
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
    const deleted = await post.destroy();
    res.status(200).json({
      message: 'Post deleted successfully!',
    });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

// For removing old image on update post with new image
const clearImage = filePath => {
  filePath = path.join(__dirname, '..', filePath);
  fs.unlink(filePath, err => console.log(err));
};
