const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('node_blog', 'root', 'nodejs20', {
  dialect: 'mysql',
  host: 'localhost',
  storage: './session.mysql',
});

module.exports = sequelize;
