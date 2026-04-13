// This file defines API routes for managing duration by ID.
// Includes:
// GET /api/duration/:id
// PUT /api/duration/:id
// DELETE /api/duration/:id

import { NextRequest, NextResponse } from "next/server";
import sequelize from "@/lib/database";
import models from "@/models";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const MINIMUM_DURATION = Number(process.env.MINIMUM_DURATION);

// ── Validators ───────────────────────────────────────────────
function validateDuration(value: any): string[] {
    const errors: string[] = [];

    const numericValue = Number(value);

    if (isNaN(numericValue)) {
        errors.push(`Invalid input: ${value}`);
    }

    if (numericValue < MINIMUM_DURATION) {
        errors.push(`Minimum duration is ${MINIMUM_DURATION} min`);
    }

    if (numericValue % 5 !== 0) {
        errors.push("Duration must be multiple of 5");
    }

    return errors;
}

// ── GET /api/duration/:id ────────────────────────────────────
export async function GET(_req: NextRequest, context: any) {
    try {
        const { id } = await context.params;
        await sequelize.sync();

        const duration = await models.Duration.findByPk(id);

        if (!duration) {
            return NextResponse.json(
                { error: "Duration not found." },
                { status: 404 }
            );
        }

        return NextResponse.json({ duration }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ── PUT /api/duration/:id ────────────────────────────────────
export async function PUT(req: NextRequest, context: any) {
    try {
        const { id } = await context.params;
        const body = await req.json();
        const { value } = body;

        const duration = await models.Duration.findByPk(id);

        if (!duration) {
            return NextResponse.json(
                { error: "Duration not found" },
                { status: 404 }
            );
        }

        // ✅ Auth
        const cookieStore = await cookies();
        const token = cookieStore.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
        const userId = decoded.id;

        const numericValue = Number(value);

        // ✅ VALIDATION
        if (isNaN(numericValue)) {
            return NextResponse.json(
                { errors: ["Invalid input"] },
                { status: 422 }
            );
        }

        if (numericValue < MINIMUM_DURATION) {
            return NextResponse.json(
                { errors: [`Minimum duration is ${MINIMUM_DURATION} min`] },
                { status: 422 }
            );
        }

        if (numericValue % 5 !== 0) {
            return NextResponse.json(
                { errors: ["Duration must be in multiple of 5"] },
                { status: 422 }
            );
        }

        // ✅ CHECK DUPLICATE (VERY IMPORTANT)
        const duplicate = await models.Duration.findOne({
            where: {
                value: numericValue,
                id: { [require("sequelize").Op.ne]: duration.id },
            },
        });

        if (duplicate) {
            return NextResponse.json(
                { errors: ["This duration already exists."] },
                { status: 409 }
            );
        }

        // ✅ UPDATE ONLY AFTER VALIDATION
        await duration.update({
            value: numericValue,
            updatedBy: userId,
        });

        return NextResponse.json(
            {
                success: true,
                message: "Updated successfully",
                data: duration,
            },
            { status: 200 }
        );

    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "Something went wrong" },
            { status: 500 }
        );
    }
}

    // ── DELETE /api/duration/:id ─────────────────────────────────
    export async function DELETE(_req: NextRequest, context: any) {
        try {
            const { id } = await context.params;
            await sequelize.sync();

            const duration = await models.Duration.findByPk(id);

            if (!duration) {
                return NextResponse.json(
                    { error: "Duration not found." },
                    { status: 404 }
                );
            }

            await duration.destroy();

            return NextResponse.json(
                { message: "Duration deleted successfully." },
                { status: 200 }
            );
        } catch (error: any) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
    }