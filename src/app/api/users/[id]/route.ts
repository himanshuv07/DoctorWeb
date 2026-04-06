// This file defines the API routes for handling user-related operations such as fetching, updating, and deleting users.

// APIs defined here:
// GET /api/users/:id  → get user by id (excluding password)
// PUT /api/users/:id  → update user by id (with validation and password hashing)
// DELETE /api/users/:id  → soft delete user by id (sets deletedAt)

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '../../../../models/User';
import sequelize from '../../../../lib/database';

const VALID_GENDERS = ['male', 'female'];
const VALID_ROLES = ['doctor', 'staff', 'admin'];

function validateUpdateBody(body: any): string[] {
  const errors: string[] = [];

  if (body.email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
    errors.push('Invalid email format.');
  if (body.phone !== undefined && !/^\d{10}$/.test(body.phone))
    errors.push('Phone must be 10 digits.');
  if (body.password !== undefined &&
    !/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(body.password))
    errors.push('Password must be min 8 chars with letters, numbers, and a special character.');
  if (body.gender !== undefined && !VALID_GENDERS.includes(body.gender))
    errors.push(`gender must be one of: ${VALID_GENDERS.join(', ')}.`);
  if (body.role !== undefined && !VALID_ROLES.includes(body.role))
    errors.push(`role must be one of: ${VALID_ROLES.join(', ')}.`);

  return errors;
}

// GET /api/users/1
export async function GET(_req: NextRequest, context: any) {
  try {
    const { id } = await context.params;

    await sequelize.sync();

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'deletedAt'] },
    });

    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    return NextResponse.json({ user }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/users/1
export async function PUT(req: NextRequest, context: any) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const errors = validateUpdateBody(body);
    if (errors.length > 0) return NextResponse.json({ errors }, { status: 422 });

    await sequelize.sync();

    const user = await User.findByPk(id);
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    }

    await user.update(body);

    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password', 'deletedAt'] },
    });

    return NextResponse.json(
      { message: 'User updated successfully.', user: updatedUser },
      { status: 200 }
    );

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/users/1 → soft delete (sets deletedAt)
export async function DELETE(_req: NextRequest, context: any) {
  try {
    const { id } = await context.params;

    await sequelize.sync();

    const user = await User.findByPk(id);
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    await user.destroy();

    return NextResponse.json({ message: 'User deleted successfully.' }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}