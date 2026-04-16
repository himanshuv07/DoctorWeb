import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/seed',
];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // ✅ Only protect /api routes
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized. Please login.' },
      { status: 401 }
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: number;
      email: string;
      role: string;
    };

    // ✅ Inject user into headers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', String(decoded.id));
    requestHeaders.set('x-user-email', decoded.email);
    requestHeaders.set('x-user-role', decoded.role);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

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