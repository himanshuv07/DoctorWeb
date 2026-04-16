import { NextRequest, NextResponse } from "next/server";
import models from "@/models";
import { getUser } from "@/lib/getUser";

const MINIMUM_DURATION = Number(process.env.MINIMUM_DURATION) || 5;

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
export async function GET(req: NextRequest) {
  try {
    const user = getUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const durations = await models.Duration.findAll({
      // ✅ Admin → all, others → own
      // where: user.role === "Admin" ? {} : { createdBy: user.id },

      attributes: ["id", "value", "createdAt", "updatedAt"],
      order: [["value", "ASC"]],
    });

    return NextResponse.json(
      {
        success: true,
        message: "Durations fetched successfully",
        data: durations,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch durations",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// ── POST /api/duration ───────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const user = getUser(req);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

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
        createdBy: user.id, // ✅ from middleware
        updatedBy: user.id,
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
      { message: "Failed to create duration", error: error.message },
      { status: 500 }
    );
  }
}