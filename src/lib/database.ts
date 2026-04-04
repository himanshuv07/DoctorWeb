// This file sets up the connection to the MySQL database using Sequelize. It reads the database
// configuration from environment variables and initializes a Sequelize instance. On every server
// start, it automatically seeds a default admin user if none exists.

import { Sequelize } from 'sequelize';
import bcrypt from 'bcryptjs';

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

// ── Default admin credentials (override via .env) ────────────
const DEFAULT_ADMIN = {
  fname    : process.env.ADMIN_FNAME    ?? 'Admin',
  lname    : process.env.ADMIN_LNAME    ?? 'Vishwakarma',
  email    : process.env.ADMIN_EMAIL    ?? 'admin@gmail.com',
  password : process.env.ADMIN_PASSWORD ?? 'Admin@123',
  phone    : process.env.ADMIN_PHONE    ?? '7275223319',
  gender   : 'male'  as const,
  role     : 'admin' as const,
  isActive : true,
};

function validatePassword(password: string): boolean {
  return /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(password);
}

// ── Seed helper ──────────────────────────────────────────────
async function seedAdminUser(): Promise<void> {
  try {
    // Lazy import prevents circular dependency (User model imports sequelize)
    const User = (await import('../models/User')).default;

    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) {
      console.log('[Seed] Admin already exists — skipping.');
      return;
    }

    if (!validatePassword(DEFAULT_ADMIN.password)) {
      console.error(
        '[Seed] SEED_ADMIN_PASSWORD does not meet the password policy ' +
        '(min 8 chars, letter + number + special character). ' +
        'Update it in your .env file.'
      );
      return;
    }

    const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN.password, 10);
    await User.create({ ...DEFAULT_ADMIN, password: hashedPassword });
    console.log(`[Seed] Default admin created → ${DEFAULT_ADMIN.email}`);

  } catch (err: any) {
    console.error('[Seed] Failed to seed admin user:', err.message);
  }
}

// ── initDatabase — call this once at server startup ──────────
export async function initDatabase(): Promise<void> {
  await sequelize.authenticate();   // 1. test DB connection is alive
  await sequelize.sync({ alter: true }); // 2. sync models → creates/updates tables
  await seedAdminUser();            // 3. create default admin if none exists
}

export default sequelize;