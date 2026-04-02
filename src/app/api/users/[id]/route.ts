// This route handles fetching a single user by ID. You can test it by visiting:
// http://localhost:3000/api/users/4  // replace 4 with the actual user ID you want to fetch

import { NextRequest, NextResponse } from 'next/server';
import User from '../../../../models/User';
import sequelize from '../../../../lib/database';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ success: false, message: 'User ID is missing' }, { status: 400 });
  }

  try {
    await sequelize.sync();

    const user = await User.findByPk(id);

    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}