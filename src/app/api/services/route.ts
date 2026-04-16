import { NextRequest, NextResponse } from "next/server";
import { Service, Duration } from "@/models";
import { getUser } from "@/lib/getUser";

// type Params = {
//     params: Promise<{ id: string }>;
// };

export async function GET(req: NextRequest) {
    try {
        const user = getUser(req);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const services = await Service.findAll({

            // ✅ ROLE-BASED FILTER
            // where: user.role === "Admin" ? {} : { createdBy: user.id },

            include: [
                {
                    model: Duration,
                    as: "duration",
                    attributes: ["id", "value"],
                },
            ],
            order: [["id", "DESC"]],
        });

        return NextResponse.json(
            {
                success: true,
                message: "Services fetched successfully",
                data: services,
            },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch services",
                error: error.message,
            },
            { status: 500 }
        );
    }
}

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

    const { name, price, durationId } = body;

    // ❌ REMOVE createdBy from validation
    if (!name || durationId === undefined || price === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: "name, price, durationId are required",
        },
        { status: 400 }
      );
    }

    // ✅ FIXED
    const duration = await Duration.findByPk(durationId);

    if (!duration) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected duration does not exist",
        },
        { status: 404 }
      );
    }

    const existingService = await Service.findOne({
      where: { name },
    });

    if (existingService) {
      return NextResponse.json(
        {
          success: false,
          message: "Service name already exists",
        },
        { status: 409 }
      );
    }

    const service = await Service.create({
      name,
      price,
      durationId,

      // ✅ FIXED (NO FRONTEND CONTROL)
      createdBy: user.id,
      updatedBy: user.id,
    });

    const newService = await Service.findByPk(service.id, {
      include: [
        {
          model: Duration,
          as: "duration",
          attributes: ["id", "value"],
        },
      ],
    });

    return NextResponse.json(
      {
        success: true,
        message: "Service created successfully",
        data: newService,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create service",
        error: error.message,
      },
      { status: 500 }
    );
  }
}