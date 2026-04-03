// This file sets up the connection to the MySQL database using Sequelize. It reads the database configuration from environment variables and initializes a Sequelize instance, which is then exported for use in other parts of the application.

import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASSWORD!,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);

export default sequelize;