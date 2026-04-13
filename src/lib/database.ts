// This file sets up the Sequelize connection and initializes the database. It also includes a function to seed a default admin user if one doesn't already exist. 

import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DB_NAME!,
  process.env.DB_USER!,
  process.env.DB_PASSWORD!,
  {
    host   : process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
  }
);

export async function initDatabase(): Promise<void> {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });
}

export default sequelize;