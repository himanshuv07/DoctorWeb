// GET /api/services/:id
// PUT /api/services/:id
// DELETE /api/services/:id

import { NextRequest, NextResponse } from "next/server";
import sequelize from "@/lib/database";
import models from "@/models";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// ── Validators ─────────────────────────────
function validateService(body: any): string[] {
  const errors: string[] = [];

  if (body.name !== undefined && !body.name.trim()) {
    errors.push("Service name cannot be empty");
  }

  return errors;
}

// ── GET one service ────────────────────────
export async function GET(_req: NextRequest, context: any) {
  try {
    const { id } = await context.params;

    await sequelize.sync();

    const service = await models.Service.findByPk(id, {
      include: [
        {
          model: models.Duration,
          attributes: ["id", "value"],
        },
      ],
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ service }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── UPDATE service ─────────────────────────
export async function PUT(req: NextRequest, context: any) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const errors = validateService(body);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 422 });
    }

    const service = await models.Service.findByPk(id);

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    // ✅ Auth
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = decoded.id;

    await service.update({
      name: body.name ?? service.name,
      durationId: body.durationId ?? service.durationId,
      updatedBy: userId,
    });

    return NextResponse.json(
      { message: "Service updated successfully", service },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── DELETE service ─────────────────────────
export async function DELETE(_req: NextRequest, context: any) {
  try {
    const { id } = await context.params;

    await sequelize.sync();

    const service = await models.Service.findByPk(id);

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    await service.destroy();

    return NextResponse.json(
      { message: "Service deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}