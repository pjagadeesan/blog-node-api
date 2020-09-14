const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');

const sequelize = require('./util/database');
const feedRoutes = require('./routes/feed');
const authRoutes = require('./routes/auth');

const User = require('./models/user');
const Post = require('./models/post');

const app = express();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + '-' + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  console.log(file);
  if (
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/jpg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
//configure body-parser for parsing JSON data for REST APIs
app.use(bodyParser.json()); //application/json
app.use(multer({ storage: fileStorage, fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

//To enable Cross origin read sharing

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  //allow the client to set req headers
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use('/auth', authRoutes);
app.use('/feed', feedRoutes);

app.use((error, req, res, next) => {
  console.log(error);
  res.status(error.statusCode).json({ message: error.message });
});

//Defining Post and User relations
Post.belongsTo(User, { constraints: true, onDelete: 'CASCADE' });
User.hasMany(Post);

sequelize
  //.sync({ force: true })
  .sync()
  .then(result => {
    app.listen(8080);
  })
  .catch(err => {
    console.log(err);
  });
