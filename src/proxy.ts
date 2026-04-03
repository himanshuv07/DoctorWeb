import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/seed',
];

export function proxy(req: NextRequest) {
  console.log("PROXY RUNNING:", req.nextUrl.pathname);

  const { pathname } = req.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Only protect /api routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Get token
  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized. Please login.' },
      { status: 401 }
    );
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    return NextResponse.next();
  } catch {
    return NextResponse.json(
      { error: 'Invalid or expired token.' },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: '/api/:path*',
};