import { NextRequest, NextResponse } from "next/server";
import models from "@/models";
import { getUser } from "@/lib/getUser";

// ── GET /api/clinicSetting ─────────────────────────────
export async function GET(req: NextRequest) {
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

    const clinic = await models.ClinicsSetting.findOne({
      attributes: [
        "id", "clinicName", "logo", "startDay", "leaveDays", "timezone",
        "smtpUsername", "smtpPassword", "smtpHost", "smtpPort", "smtpTls",
        "createdAt", "updatedAt",
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!clinic) {
      return NextResponse.json(
        { success: true, message: "No clinic settings found", data: null },
        { status: 200 }
      );
    }

    // ✅ Plain flat object — no nesting, matches ClinicType on frontend
    return NextResponse.json(
      { success: true, message: "Clinic settings fetched successfully", data: clinic.toJSON() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("CLINIC GET ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch clinic settings", error: error.message },
      { status: 500 }
    );
  }
}

// ── POST /api/clinicSetting ─────────────────────────────────────────
// Kept for Postman / API use only. Frontend always uses PUT after first create.
export async function POST(req: NextRequest) {
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

    const body = await req.json();

    const clinic = await models.ClinicsSetting.create({
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
      createdBy:    user.id,
      updatedBy:    user.id,
    });

    return NextResponse.json(
      { success: true, message: "Clinic created successfully", data: clinic.toJSON() },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("CLINIC POST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create clinic", error: error.message },
      { status: 500 }
    );
  }
}