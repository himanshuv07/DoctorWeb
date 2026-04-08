import { NextResponse } from "next/server";
import { Duration } from "@/models";

// ✅ GET all durations
export async function GET() {
  const durations = await Duration.findAll({
    order: [["value", "ASC"]],
  });

  return NextResponse.json(durations);
}

// ✅ CREATE duration
export async function POST(req: Request) {
  const body = await req.json();

  const duration = await Duration.create({
    value: body.value,
    createdBy: 1, // replace with logged-in user id
  });

  return NextResponse.json(duration);
}

// ✅ UPDATE duration
export async function PUT(req: Request) {
  const body = await req.json();

  const duration = await Duration.findByPk(body.id);

  if (!duration) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await duration.update({
    value: body.value,
    updatedBy: 1,
  });

  return NextResponse.json(duration);
}

// ✅ DELETE duration
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const duration = await Duration.findByPk(id as string);

  if (!duration) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await duration.destroy();

  return NextResponse.json({ message: "Deleted successfully" });
}