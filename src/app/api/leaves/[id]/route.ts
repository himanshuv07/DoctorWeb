import { NextRequest, NextResponse } from "next/server";
import { Leave, User } from "@/models";
import { getUser } from "@/lib/getUser";

type Params = {
  params: Promise<{ id: string }>;
};

// 🔹 GET SINGLE LEAVE
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const user = getUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const leave = await Leave.findByPk(id, {
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
    });

    if (!leave) {
      return NextResponse.json(
        { success: false, message: "Leave not found" },
        { status: 404 }
      );
    }

    // ✅ Authorization (optional)
    // if (user.role !== "Admin" && leave.user_id !== user.id) {
    //   return NextResponse.json(
    //     { success: false, message: "Forbidden" },
    //     { status: 403 }
    //   );
    // }

    return NextResponse.json(
      {
        success: true,
        message: "Leave fetched successfully",
        data: leave,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch leave",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// 🔹 UPDATE LEAVE
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const user = getUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const leave = await Leave.findByPk(id);

    if (!leave) {
      return NextResponse.json(
        { success: false, message: "Leave not found" },
        { status: 404 }
      );
    }

    // ❗ Authorization (optional)
    // if (user.role !== "Admin" && leave.user_id !== user.id) {
    //   return NextResponse.json(
    //     { success: false, message: "Forbidden" },
    //     { status: 403 }
    //   );
    // }

    const { leave_startDate, leave_endDate, remark, status } = body;

    // 🔹 Date validation
    if (leave_startDate && leave_endDate) {
      if (new Date(leave_endDate) < new Date(leave_startDate)) {
        return NextResponse.json(
          {
            success: false,
            message: "End date cannot be before start date",
          },
          { status: 400 }
        );
      }
    }

    await leave.update({
      leave_startDate: leave_startDate ?? leave.leave_startDate,
      leave_endDate: leave_endDate ?? leave.leave_endDate,
      remark: remark ?? leave.remark,
      status: status ?? leave.status,

      updated_by: user.id,
    });

    const updatedLeave = await Leave.findByPk(id, {
      include: [
        { model: User, as: "doctor", attributes: ["id", "fname", "lname"] },
        { model: User, as: "creator", attributes: ["id", "fname", "lname"] },
        { model: User, as: "updater", attributes: ["id", "fname", "lname"] },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        message: "Leave updated successfully",
        data: updatedLeave,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update leave",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// 🔹 DELETE LEAVE
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const user = getUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    const leave = await Leave.findByPk(id);

    if (!leave) {
      return NextResponse.json(
        { success: false, message: "Leave not found" },
        { status: 404 }
      );
    }

    // ❗ Authorization (optional)
    // if (user.role !== "Admin" && leave.user_id !== user.id) {
    //   return NextResponse.json(
    //     { success: false, message: "Forbidden" },
    //     { status: 403 }
    //   );
    // }

    await leave.destroy();

    return NextResponse.json(
      {
        success: true,
        message: "Leave deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete leave",
        error: error.message,
      },
      { status: 500 }
    );
  }
}