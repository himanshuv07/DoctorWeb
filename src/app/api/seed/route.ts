import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '../../../models/User';
import sequelize from '../../../lib/database';

export async function GET() {
  try {
    await sequelize.sync({ alter: true });

    const existing = await User.findOne({ where: { email: 'admin@test.com' } });
    if (existing) {
      return NextResponse.json({ message: 'User already exists!' });
    }

    const hashedPassword = await bcrypt.hash('admin@123', 10);

    // await User.create({
    //   email: 'himanshu@test.com',
    //   password: hashedPassword,
    // });

    await User.create({
      fname: 'Admin',
      lname: 'Test',
      phone: '1234567890',
      email: 'admin@test.com',
      password: hashedPassword,
      gender: 'male',
      role: 'admin',
      address: 'Chennai',
      isActive: true,
    });

    const createdUser = await User.findOne({ where: { email: 'admin@test.com' } });

    return NextResponse.json({
      message: 'User created!',
      user: createdUser,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}