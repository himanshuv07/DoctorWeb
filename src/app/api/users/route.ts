// GET /api/users
// GET /api/users?role=doctor
// GET /api/users?count=doctor  (or count=staff, count=admin, count=all)

import { NextRequest, NextResponse } from 'next/server';
import User from '../../../models/User';
import sequelize from '../../../lib/database';

const VALID_ROLES = ['doctor', 'staff', 'admin'];

export async function GET(req: NextRequest) {
    try {
        await sequelize.sync();

        const { searchParams } = new URL(req.url);
        const role = searchParams.get('role');
        const count = searchParams.get('count');

        // ?count=doctor or ?count=all → return counts
        if (count) {
            if (count === 'all') {
                // Return count for every role at once
                const counts = await Promise.all(
                    VALID_ROLES.map(async (r) => ({
                        role: r,
                        total: await User.count({ where: { role: r } }),
                    }))
                );
                return NextResponse.json({ counts }, { status: 200 });
            }

            if (VALID_ROLES.includes(count)) {
                const total = await User.count({ where: { role: count } });
                return NextResponse.json({ role: count, total }, { status: 200 });
            }

            return NextResponse.json({ error: 'Invalid count role.' }, { status: 400 });
        }

        // ?role=doctor → filter by role
        const queryOptions: any = {
            attributes: { exclude: ['password', 'deletedAt'] },
            order: [['createdAt', 'DESC']],
        };

        if (role && VALID_ROLES.includes(role)) {
            queryOptions.where = { role };
        }

        const users = await User.findAll(queryOptions);
        return NextResponse.json({ total: users.length, users }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}