import { NextRequest, NextResponse } from "next/server";
import models from "@/models";
import { getUser } from "@/lib/getUser";

// ── PUT /api/clinicSetting/[id] ────────────────────────────────────
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let user;
    try {
      user = getUser(req);
    } catch {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    // ✅ Next.js 15: params is a Promise, must be awaited
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 });
    }

    const clinic = await models.ClinicsSetting.findByPk(id);
    if (!clinic) {
      return NextResponse.json({ success: false, message: "Clinic not found" }, { status: 404 });
    }

    const body = await req.json();

    // ✅ Explicit field mapping — no ...spread so no unexpected fields leak in
    await clinic.update({
      clinicName:   body.clinicName,
      logo:         body.logo         ?? null,
      startDay:     body.startDay,
      leaveDays:    body.leaveDays    ?? [],
      timezone:     body.timezone     ?? "Asia/Kolkata",
      smtpUsername: body.smtpUsername ?? null,
      smtpPassword: body.smtpPassword ?? null,
      smtpHost:     body.smtpHost     ?? null,
      smtpPort:     body.smtpPort     ? Number(body.smtpPort) : null,
      smtpTls:      body.smtpTls      ?? false,
      updatedBy:    user.id,
    });

    return NextResponse.json(
      { success: true, message: "Clinic updated successfully", data: clinic.toJSON() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("CLINIC PUT ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update clinic", error: error.message },
      { status: 500 }
    );
  }
}