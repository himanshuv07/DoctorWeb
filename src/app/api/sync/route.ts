import { NextResponse } from 'next/server';
import { sequelize } from '../../../models';

export async function GET() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    return NextResponse.json({ message: 'Tables created!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}