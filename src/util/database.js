const Sequelize = require('sequelize');

const sequelize = new Sequelize('users', 'root', 'password', {
  host: 'localhost',
  dialect: 'mysql',
});