import { NextRequest, NextResponse } from "next/server";
import { Service, Duration } from "@/models";

export async function GET() {
    try {
        const services = await Service.findAll({
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
        const body = await req.json();
        const { name, price, durationId, createdBy, updatedBy } = body;

        if (!name || durationId === undefined || price === undefined || !createdBy) {
            return NextResponse.json(
                {
                    success: false,
                    message: "name, price, durationId and createdBy are required",
                },
                { status: 400 }
            );
        }

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
            createdBy,
            updatedBy: updatedBy ?? null,
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