// This file defines API routes for managing customers. It includes a GET route to retrieve all customers from the database and a POST route to create a new customer. The routes use Sequelize to interact with the database and return JSON responses with the appropriate status codes.

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