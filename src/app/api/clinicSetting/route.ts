import { NextRequest, NextResponse } from "next/server";
import models from "@/models";
import { getUser } from "@/lib/getUser";

const Clinics = models.Clinics;

export async function GET(req: NextRequest) {
  try {
    const user = getUser(req);

    if (!user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 👑 Admin → global OR user-based (your choice)
    const clinic = await Clinics.findOne({
      where: user.role === "Admin" ? {} : { createdBy: user.id },
    });

    if (!clinic) {
      return NextResponse.json([], { status: 200 });
    }

    const data = clinic.toJSON() as any;

    // ✅ Transform SMTP
    data.smtp = {
      username: data.smtpUsername,
      password: data.smtpPassword,
      host: data.smtpHost,
      port: data.smtpPort,
      tls: data.smtpTls,
    };

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUser(req);

    if (!user || user.role !== "Admin") {
      return NextResponse.json(
        { message: "Access denied. Admins only." },
        { status: 403 }
      );
    }

    const body = await req.json();

    const {
      clinicName,
      logo,
      startDay,
      leaveDays,
      timezone,
      smtp = {},
    } = body;

    const { username, password, host, port, tls } = smtp;

    // ❗ Only one setting (like your old logic)
    const existing = await Clinics.findOne();

    if (existing) {
      return NextResponse.json(
        { message: "Clinic already exists. Use update." },
        { status: 400 }
      );
    }

    const clinic = await Clinics.create({
      clinicName,
      logo,
      startDay,
      leaveDays, // ✅ no stringify needed
      timezone,

      smtpUsername: username,
      smtpPassword: password,
      smtpHost: host,
      smtpPort: port,
      smtpTls: tls,

      createdBy: user.id,
      updatedBy: user.id,
    });

    return NextResponse.json(
      {
        message: "Clinic created successfully",
        data: clinic,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getUser(req);

    if (!user || user.role !== "Admin") {
      return NextResponse.json(
        { message: "Access denied. Admins only." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const {
      clinicName,
      logo,
      startDay,
      leaveDays,
      timezone,
      smtp = {},
    } = body;

    const { username, password, host, port, tls } = smtp;

    const clinic = await Clinics.findByPk(id);

    if (!clinic) {
      return NextResponse.json(
        { message: "Clinic not found" },
        { status: 404 }
      );
    }

    await clinic.update({
      clinicName,
      logo,
      startDay,
      leaveDays,
      timezone,

      smtpUsername: username,
      smtpPassword: password,
      smtpHost: host,
      smtpPort: port,
      smtpTls: tls,

      updatedBy: user.id,
    });

    return NextResponse.json(
      { message: "Clinic updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

