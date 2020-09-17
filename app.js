const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { graphqlHTTP } = require('express-graphql');
const cors = require('cors');

const sequelize = require('./util/database');

const User = require('./models/user');
const Post = require('./models/post');

const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
const auth = require('./middleware/auth');

const { clearImage } = require('./util/file');

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
//To enable Cross origin read sharing using 'cors' package
app.use(cors());
//configure body-parser for parsing JSON data for REST APIs
app.use(bodyParser.json()); //application/json
app.use(multer({ storage: fileStorage, fileFilter }).single('image'));
app.use('/images', express.static(path.join(__dirname, 'images')));

//To enable Cross origin read sharing
/*
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  //allow the client to set req headers
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
*/

app.use(auth);

//rest-end point for image upload
// multer stores the file path in req.file.path
app.put('/post-image', (req, res, next) => {
  if (!req.isAuth) {
    throw new Error('Not authenticated!');
  }
  if (!req.file) {
    return res.status(200).json({ message: 'No file provided!' });
  }
  //req.body.oldPath --> from edit post
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }
  return res.status(201).json({ message: 'File stored!', filePath: req.file.path });
});

/*
app.use('/auth', authRoutes);
app.use('/feed', feedRoutes);
*/

app.use(
  '/graphql',
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    formatError(err) {
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const message = err.message || 'An error occured.';
      const code = err.originalError.code;
      return { message, status: code, data };
    },
  })
);

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
