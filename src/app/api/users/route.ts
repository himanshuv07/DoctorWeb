// This file defines API routes for managing users. It includes GET, PUT, and DELETE routes for retrieving, updating, and soft-deleting a user by their ID.

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import User from '../../../models/User';
import sequelize from '../../../lib/database';

// ── Constants ────────────────────────────────────────────────
const VALID_GENDERS = ['male', 'female', 'other'] as const;
const VALID_ROLES   = ['doctor', 'staff', 'admin'] as const;

// ── Validators ───────────────────────────────────────────────
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone: string) {
  return /^\d{10}$/.test(phone);
}

function validatePassword(password: string) {
  return /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(password);
}

function validateBody(body: any): string[] {
  const errors: string[] = [];

  if (!body.fname?.trim())    errors.push('fname is required.');
  if (!body.lname?.trim())    errors.push('lname is required.');
  if (!body.email?.trim())    errors.push('email is required.');
  if (!body.password?.trim()) errors.push('password is required.');
  if (!body.phone?.trim())    errors.push('phone is required.');
  if (!body.gender)           errors.push('gender is required.');
  if (!body.role)             errors.push('role is required.');

  if (body.email && !validateEmail(body.email))
    errors.push('email must be a valid email address.');

  if (body.phone && !validatePhone(body.phone))
    errors.push('phone must be a 10-digit number.');

  if (body.password && !validatePassword(body.password))
    errors.push('password must be at least 8 characters and include letters, numbers, and one special character.');

  if (body.gender && !VALID_GENDERS.includes(body.gender))
    errors.push(`gender must be one of: ${VALID_GENDERS.join(', ')}.`);

  if (body.role && !VALID_ROLES.includes(body.role))
    errors.push(`role must be one of: ${VALID_ROLES.join(', ')}.`);

  return errors;
}

// ── GET /api/users ───────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    await sequelize.sync();

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const count = searchParams.get('count');

    // ?count=doctor or ?count=all → return counts
    if (count) {
      if (count === 'all') {
        const counts = await Promise.all(
          VALID_ROLES.map(async (r) => ({
            role: r,
            total: await User.count({ where: { role: r } }),
          }))
        );
        return NextResponse.json({ counts }, { status: 200 });
      }

      if (VALID_ROLES.includes(count as any)) {
        const total = await User.count({ where: { role: count } });
        return NextResponse.json({ role: count, total }, { status: 200 });
      }

      return NextResponse.json({ error: 'Invalid count role.' }, { status: 400 });
    }

    // ?role=doctor → filter
    const queryOptions: any = {
      attributes: { exclude: ['password', 'deletedAt'] },
      order: [['createdAt', 'DESC']],
    };

    if (role && VALID_ROLES.includes(role as any)) {
      queryOptions.where = { role };
    }

    const users = await User.findAll(queryOptions);
    return NextResponse.json({ total: users.length, users }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── POST /api/users ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate
    const errors = validateBody(body);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 422 });
    }

    const { email, password, fname, lname, phone, gender, role, address, isActive } = body;

    // 2. Duplicate check
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'User with this email already exists.' },
        { status: 409 }
      );
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