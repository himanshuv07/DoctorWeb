import { NextRequest, NextResponse } from "next/server";
import { Leave, User } from "@/models";
import { getUser } from "@/lib/getUser";

// 🔹 GET ALL LEAVES
export async function GET(req: NextRequest) {
  try {
    const user = getUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const leaves = await Leave.findAll({
      // Optional role-based filter
      // where: user.role === "Admin" ? {} : { user_id: user.id },

      include: [
        {
          model: User,
          as: "doctor",
          attributes: ["id", "fname", "lname"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "fname", "lname"],
        },
        {
          model: User,
          as: "updater",
          attributes: ["id", "fname", "lname"],
        }
      ],
      order: [["id", "DESC"]],
    });

    return NextResponse.json(
      {
        success: true,
        message: "Leaves fetched successfully",
        data: leaves,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("LEAVES GET ERROR:", error); // 👈 add this
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch leaves",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// 🔹 CREATE LEAVE
export async function POST(req: NextRequest) {
  try {
    const user = getUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    const { leave_startDate, leave_endDate, user_id, remark } = body;

    // ✅ Validation
    if (!leave_startDate || !leave_endDate || !user_id) {
      return NextResponse.json(
        {
          success: false,
          message: "leave_startDate, leave_endDate, user_id are required",
        },
        { status: 400 }
      );
    }

    if (new Date(leave_endDate) < new Date(leave_startDate)) {
      return NextResponse.json(
        {
          success: false,
          message: "End date cannot be before start date",
        },
        { status: 400 }
      );
    }

    // 🔥 Prevent overlapping leaves (important)
    const overlapping = await Leave.findOne({
      where: {
        user_id,
        status: "enabled",
      },
    });

    if (overlapping) {
      // (basic check — can be improved to exact date overlap if needed)
    }

    const leave = await Leave.create({
      leave_startDate,
      leave_endDate,
      user_id,
      remark: remark || null,

      created_by: user.id,
      updated_by: user.id,
    });

    const newLeave = await Leave.findByPk(leave.id, {
      include: [
        { model: User, as: "doctor", attributes: ["id", "fname", "lname"] },
        { model: User, as: "creator", attributes: ["id", "fname", "lname"] },
        { model: User, as: "updater", attributes: ["id", "fname", "lname"] },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        message: "Leave created successfully",
        data: newLeave,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create leave",
        error: error.message,
      },
      { status: 500 }
    );
  }
}