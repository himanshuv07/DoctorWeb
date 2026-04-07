// This file sets up the Sequelize connection and initializes the database. It also includes a function to seed a default admin user if one doesn't already exist. 

import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';
import { seedAdminUser } from './adminSeed';

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

// ── initDatabase — call this once at server startup ──────────
export async function initDatabase(): Promise<void> {
  await sequelize.authenticate();   // 1. test DB connection is alive
  await sequelize.sync({ alter: true }); // 2. sync models → creates/updates tables
  await seedAdminUser();            // 3. create default admin if none exists
}

export default sequelize;