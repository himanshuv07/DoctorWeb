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
    errors.push("Duration must be in multiple of 5");
  }

  return errors;
}

// ── GET /api/duration ────────────────────────────────────────
export async function GET() {
  try {
    await sequelize.sync();

    const durations = await models.Duration.findAll({
      order: [["value", "ASC"]],
    });

    return NextResponse.json({ durations }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── POST /api/duration ───────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // ✅ Get token from cookie
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // ✅ Decode token
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const userId = decoded.id; // ✅ REAL USER ID

    const body = await req.json();
    const { value } = body;

    const errors = validateDuration(value);
    if (errors.length > 0) {
      return NextResponse.json({ errors }, { status: 422 });
    }

    const numericValue = Number(value);

    const [duration, created] = await models.Duration.findOrCreate({
      where: { value: numericValue },
      defaults: {
        createdBy: userId,
        updatedBy: null,
      },
    });

    if (!created) {
      return NextResponse.json(
        { error: "This duration already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "Duration created successfully.", duration },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Invalid token" },
      { status: 401 }
    );
  }
}