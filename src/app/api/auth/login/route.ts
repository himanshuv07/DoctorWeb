import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../../../models/User';
import sequelize from '../../../../lib/database';

export async function POST(req: NextRequest) {
    try {
        await sequelize.sync();

        const { email, password } = await req.json();

        // 1. check if user exists
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. check if password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: 'Wrong password' }, { status: 401 });
        }

        console.log("SECRET:", process.env.JWT_SECRET);

        // 3. create a token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET!,
            { expiresIn: '1d' }
        );

        // 4. send token in cookie
        const response = NextResponse.json({ message: 'Login successful' });
        response.cookies.set('token', token, {
            httpOnly: true,
            maxAge: 60 * 60 * 24, // 1 day
        });

        return response;

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}