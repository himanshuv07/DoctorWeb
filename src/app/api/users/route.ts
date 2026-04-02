// This route handles fetching all users or filtering by role. You can test it by visiting:
// http://localhost:3000/api/users
// http://localhost:3000/api/users?role=doctor
// http://localhost:3000/api/users?count=doctors

import { NextRequest, NextResponse } from 'next/server';
import User from '../../../models/User';
import sequelize from '../../../lib/database';

const enumRoles = ['doctor', 'staff', 'admin'];

export async function GET(req: NextRequest) {
    try {
        await sequelize.sync();

        const { searchParams } = new URL(req.url);
        const role = searchParams.get('role');
        const count = searchParams.get('count');

        if (count === 'doctors') {
            const doctorsCount = await User.count({ where: { role: 'doctor' } });
            return NextResponse.json({ count: doctorsCount });
        }

        if (count === 'admin') {
            const adminCount = await User.count({ where: { role: 'admin' } });
            return NextResponse.json({ count: adminCount });
        }

        if (count === 'staff') {
            const staffCount = await User.count({ where: { role: 'staff' } });
            return NextResponse.json({ count: staffCount });
        }

        const queryOptions: any = {
            order: [['createdAt', 'DESC']],
        };

        if (role && enumRoles.includes(role)) {
            queryOptions.where = { role };
        }

        const users = await User.findAll(queryOptions);
        return NextResponse.json({ success: true, users });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}