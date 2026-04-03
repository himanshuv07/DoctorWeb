// This file defines an API route for seeding the database with initial user data. It includes validation for the incoming request body, checks for duplicate users, hashes the password using bcrypt, and creates a new user in the database. The response includes either a success message with the created user (excluding sensitive fields) or an error message if something goes wrong.

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '../../../models/User';
import sequelize from '../../../lib/database';

// ── Validators ──────────────────────────────────────────────
const VALID_GENDERS = ['male', 'female'] as const;
const VALID_ROLES   = ['doctor', 'staff', 'admin'] as const;

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string) {
  // 10-digit number (adjust regex to your country format)
  return /^\d{10}$/.test(phone);
}

function validatePassword(password: string) {
  // Min 8 chars, at least 1 letter, 1 number, 1 special char
  return /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(password);
}

function validateBody(body: any): string[] {
  const errors: string[] = [];

  // Required fields
  if (!body.fname?.trim())               errors.push('fname is required.');
  if (!body.lname?.trim())               errors.push('lname is required.');
  if (!body.email?.trim())               errors.push('email is required.');
  if (!body.password?.trim())            errors.push('password is required.');
  if (!body.phone?.trim())               errors.push('phone is required.');
  if (!body.gender)                      errors.push('gender is required.');
  if (!body.role)                        errors.push('role is required.');

  // Format checks
  if (body.email    && !validateEmail(body.email))
    errors.push('email must be a valid email address.');

  if (body.phone    && !validatePhone(body.phone))
    errors.push('phone must be a 10-digit number.');

  if (body.password && !validatePassword(body.password))
    errors.push('password must be at least 8 characters and include letters, numbers, and one special character.');

  if (body.gender   && !VALID_GENDERS.includes(body.gender))
    errors.push(`gender must be one of: ${VALID_GENDERS.join(', ')}.`);

  if (body.role     && !VALID_ROLES.includes(body.role))
    errors.push(`role must be one of: ${VALID_ROLES.join(', ')}.`);

  return errors;
}

// ── Route Handler ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate
    const errors = validateBody(body);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 422 });
    }

    const { email, password, fname, lname, phone, gender, role, address, isActive } = body;

    await sequelize.sync({ alter: true });

    // 2. Duplicate check
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'User with this email already exists.' }, { status: 409 });
    }

    // 3. Hash & create
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      fname,
      lname,
      phone,
      email,
      password: hashedPassword,
      gender,
      role,
      address,
      isActive: isActive ?? true,
    });

    const createdUser = await User.findOne({
      where: { email },
      attributes: { exclude: ['password', 'deletedAt'] },
    });

    return NextResponse.json(
      { message: 'User created successfully.', user: createdUser },
      { status: 201 }
    );

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}