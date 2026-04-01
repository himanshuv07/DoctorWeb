// import { NextResponse } from 'next/server';
// import bcrypt from 'bcryptjs';
// import User from '../../../models/User';
// import sequelize from '../../../lib/database';

// export async function GET() {
//   try {
//     await sequelize.sync({ alter: true });

//     // create a test user
//     const hashedPassword = await bcrypt.hash('password123', 10);

//     await User.create({
//       email: 'admin@test.com',
//       password: hashedPassword,
//     });

//     return NextResponse.json({ message: 'User created! email: admin@test.com, pass: password123' });
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '../../../models/User';
import sequelize from '../../../lib/database';

export async function GET() {
  try {
    await sequelize.sync({ alter: true });

    // check if user already exists
    const existing = await User.findOne({ where: { email: 'himanshu@test.com' } });
    if (existing) {
      return NextResponse.json({ message: 'User already exists!' });
    }

    const hashedPassword = await bcrypt.hash('himanshu123', 10);
    await User.create({
      email: 'himanshu@test.com',
      password: hashedPassword,
    });

    return NextResponse.json({ message: 'User created! email: himanshu@test.com, pass: himanshu123' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}