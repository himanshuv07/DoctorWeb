import { NextRequest, NextResponse } from "next/server";
import { Service, Duration } from "@/models";
import { getUser } from "@/lib/getUser";

type Params = {
    params: Promise<{ id: string }>;
};

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

    const service = await Service.findByPk(id, {
      include: [
        {
          model: Duration,
          as: "duration",
          attributes: ["id", "value"],
        },
      ],
    });

    if (!service) {
      return NextResponse.json(
        { success: false, message: "Service not found" },
        { status: 404 }
      );
    }

    // ✅ Authorization
    // if (user.role !== "Admin" && service.createdBy !== user.id) {
    //   return NextResponse.json(
    //     { success: false, message: "Forbidden" },
    //     { status: 403 }
    //   );
    // }

    return NextResponse.json(
      {
        success: true,
        message: "Service fetched successfully",
        data: service,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch service",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

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

    const service = await Service.findByPk(id);

    if (!service) {
      return NextResponse.json(
        { success: false, message: "Service not found" },
        { status: 404 }
      );
    }

    // ✅ Authorization
    // if (user.role !== "Admin" && service.createdBy !== user.id) {
    //   return NextResponse.json(
    //     { success: false, message: "Forbidden" },
    //     { status: 403 }
    //   );
    // }

    const { name, price, durationId } = body;

    if (durationId) {
      const duration = await Duration.findByPk(durationId);

      if (!duration) {
        return NextResponse.json(
          { success: false, message: "Selected duration does not exist" },
          { status: 404 }
        );
      }
    }

    if (name) {
      const existingService = await Service.findOne({
        where: { name },
      });

      if (existingService && existingService.id !== service.id) {
        return NextResponse.json(
          { success: false, message: "Service name already exists" },
          { status: 409 }
        );
      }
    }

    if (price !== undefined && Number(price) < 0) {
      return NextResponse.json(
        { success: false, message: "Price must be >= 0" },
        { status: 400 }
      );
    }

    await service.update({
      name: name ?? service.name,
      price: price ?? service.price,
      durationId: durationId ?? service.durationId,

      // ✅ FIX
      updatedBy: user.id,
    });

    const updatedService = await Service.findByPk(service.id, {
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
        message: "Service updated successfully",
        data: updatedService,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update service",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

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

    const service = await Service.findByPk(id);

    if (!service) {
      return NextResponse.json(
        { success: false, message: "Service not found" },
        { status: 404 }
      );
    }

    // ✅ Authorization
    // if (user.role !== "Admin" && service.createdBy !== user.id) {
    //   return NextResponse.json(
    //     { success: false, message: "Forbidden" },
    //     { status: 403 }
    //   );
    // }

    await service.destroy();

    return NextResponse.json(
      {
        success: true,
        message: "Service deleted successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete service",
        error: error.message,
      },
      { status: 500 }
    );
  }
}