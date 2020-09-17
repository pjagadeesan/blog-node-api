const validator = require('validator');
const path = require('path');
const fs = require('fs');

const User = require('../models/user');
const Post = require('../models/post');
const { clearImage } = require('../util/file');

module.exports = {
  //creates post for the logged in user
  createPost: async ({ postInput }, req) => {
    if (!req.isAuth) {
      const error = new Error('Not authenticaetd!');
      error.code = 401;
      throw error;
    }
    const { title, content, imageUrl } = postInput;
    const errors = [];
    if (validator.isEmpty(title)) {
      errors.push({ message: 'Please enter a title!' });
    }
    if (validator.isEmpty(content)) {
      errors.push({ message: 'Content is invalid' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const user = await User.findByPk(req.userId);
    if (!user) {
      const error = new Error('Invalid user');
      error.data = errors;
      error.code = 401;
      throw error;
    }

    const post = await user.createPost({
      title,
      content,
      imageUrl,
    });

    return {
      ...post.dataValues,
      updatedAt: post.updatedAt.toISOString(),
      createdAt: post.createdAt.toISOString(),
      creator: user.name,
    };
  },

  updatePost: async ({ id, postInput }, req) => {
    if (!req.isAuth) {
      const error = new Error('Not authenticaetd!');
      error.code = 401;
      throw error;
    }
    const { title, content, imageUrl } = postInput;
    const errors = [];
    if (validator.isEmpty(title)) {
      errors.push({ message: 'Please enter a title!' });
    }
    if (validator.isEmpty(content)) {
      errors.push({ message: 'Content is invalid' });
    }
    if (errors.length > 0) {
      const error = new Error('Invalid input');
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const post = await Post.findByPk(id);
    if (!post) {
      const error = new Error('Post not found!');
      error.code = 404;
      throw error;
    }

    //only the post owner can update the post
    if (post.userId !== req.userId) {
      const error = new Error('Not Authorized');
      error.statusCode = 403;
      throw error;
    }
    post.title = title;
    post.content = content;
    if (imageUrl !== 'undefined') {
      post.imageUrl = imageUrl;
    }
    const updatedPost = await post.save();
    return {
      ...updatedPost.dataValues,
      updatedAt: updatedPost.updatedAt.toISOString(),
      createdAt: updatedPost.createdAt.toISOString(),
      creator: req.user.name,
    };
  },

  deletePost: async ({ id }, req) => {
    if (!req.isAuth) {
      const error = new Error('Not authenticaetd!');
      error.code = 401;
      throw error;
    }
    const post = await Post.findByPk(id);
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
    return true;
  },

  // return all the post with pagination
  posts: async ({ page }, req) => {
    if (!req.isAuth) {
      const error = new Error('Not authenticaetd!');
      error.code = 401;
      throw error;
    }
    if (!page) page = 1;
    const limit = 2;
    const offset = (page - 1) * limit;

    const totalPosts = await Post.count();
    const posts = await Post.findAll({
      limit,
      offset,
      include: User,
      order: [['createdAt', 'DESC']],
    });
    const resPosts = posts.map(post => {
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt.toISOString(),
        creator: post.user.name,
      };
    });
    return {
      posts: resPosts,
      totalPosts,
    };
  },

  post: async ({ id }, req) => {
    if (!req.isAuth) {
      const error = new Error('Not authenticaetd!');
      error.code = 401;
      throw error;
    }
    const post = await Post.findByPk(id, { include: User });
    if (!post) {
      const error = new Error('Post not found');
      error.code = 404;
      throw error;
    }
    return {
      ...post.dataValues,
      updatedAt: post.updatedAt.toISOString(),
      createdAt: post.createdAt.toISOString(),
      creator: post.user.name,
    };
  },
};
