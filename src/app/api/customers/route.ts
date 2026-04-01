import { NextRequest, NextResponse } from 'next/server';
import { Customer, sequelize } from '../../../models';

export async function GET() {
  await sequelize.sync();
  const customers = await Customer.findAll();
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  await sequelize.sync();
  const { name, email } = await req.json();
  const customer = await Customer.create({ name, email });
  return NextResponse.json(customer, { status: 201 });
}