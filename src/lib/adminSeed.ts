import bcrypt from 'bcryptjs';

const DEFAULT_ADMIN = {
  fname    : process.env.ADMIN_FNAME    ?? 'Admin',
  lname    : process.env.ADMIN_LNAME    ?? 'User',
  email    : process.env.ADMIN_EMAIL    ?? 'admin@gmail.com',
  password : process.env.ADMIN_PASSWORD ?? 'Admin@123',
  phone    : process.env.ADMIN_PHONE    ?? '9999999999',
  gender   : 'male'  as const,
  role     : 'admin' as const,
  isActive : true,
};

function validatePassword(password: string): boolean {
  return /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(password);
}

export async function seedAdminUser(): Promise<void> {
  try {
    const User = (await import('../models/User')).default;

    const existingAdmin = await User.findOne({ where: { role: 'admin' } });
    if (existingAdmin) {
      console.log('[Seed] Admin already exists — skipping.', `(${existingAdmin.email})`);
      return;
    }

    if (!validatePassword(DEFAULT_ADMIN.password)) {
      console.error(
        '[Seed] ADMIN_PASSWORD does not meet password policy ' +
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