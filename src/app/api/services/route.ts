// GET /api/services
// POST /api/services

import { NextRequest, NextResponse } from "next/server";
import sequelize from "@/lib/database";
import models from "@/models";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// ── Validators ─────────────────────────────
function validateService(body: any): string[] {
  const errors: string[] = [];

  if (!body.name?.trim()) errors.push("Service name is required");

  return errors;
}

// ── GET all services ───────────────────────
export async function GET() {
  try {
    await sequelize.sync();

    const services = await models.Service.findAll({
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: models.Duration,
          attributes: ["id", "value"],
        },
      ],
    });

    return NextResponse.json({ services }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── CREATE service ─────────────────────────
export async function POST(req: NextRequest) {
  try {
    // ✅ Auth
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.id;

    const body = await req.json();

    const errors = validateService(body);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 422 });
    }

    const service = await models.Service.create({
      name: body.name,
      durationId: body.durationId, // FK
      createdBy: userId,
      updatedBy: null,
    });

    return NextResponse.json(
      { message: "Service created successfully", service },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}