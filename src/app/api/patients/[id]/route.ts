import { NextRequest, NextResponse } from "next/server";
import { Op } from "sequelize";
import models from "@/models";

const Patient = models.Patient;
const User = models.User;

type Params = {
    params: Promise<{ id: string }>;
};

export async function GET(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const patient = await Patient.findByPk(id, {
            include: [
                {
                    model: User,
                    as: "creater",
                    attributes: ["id", "fname", "lname", "email"],
                },
                {
                    model: User,
                    as: "updater",
                    attributes: ["id", "fname", "lname", "email"],
                },
            ],
        });

        if (!patient) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Patient not found",
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                message: "Patient fetched successfully",
                data: patient,
            },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch patient",
                error: error.message,
            },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await req.json();

        const {
            fname,
            lname,
            phone,
            email,
            gender,
            country,
            address1,
            address2,
            city,
            state,
            zipCode,
            updatedBy,
        } = body;

        const patient = await Patient.findByPk(id);

        if (!patient) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Patient not found",
                },
                { status: 404 }
            );
        }

        if (email) {
            const existingPatient = await Patient.findOne({
                where: {
                    email,
                    id: {
                        [Op.ne]: Number(id),
                    },
                },
            });

            if (existingPatient) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "Another patient with this email already exists",
                    },
                    { status: 409 }
                );
            }
        }

        await patient.update({
            fname: fname ?? patient.fname,
            lname: lname ?? patient.lname,
            phone: phone ?? patient.phone,
            email: email ?? patient.email,
            gender: gender ?? patient.gender,
            country: country ?? patient.country,
            address1: address1 ?? patient.address1,
            address2: address2 ?? patient.address2,
            city: city ?? patient.city,
            state: state ?? patient.state,
            zipCode: zipCode ?? patient.zipCode,
            updatedBy: updatedBy ?? patient.updatedBy,
        });

        const updatedPatient = await Patient.findByPk(id, {
            include: [
                {
                    model: User,
                    as: "creater",
                    attributes: ["id", "fname", "lname", "email"],
                },
                {
                    model: User,
                    as: "updater",
                    attributes: ["id", "fname", "lname", "email"],
                },
            ],
        });

        return NextResponse.json(
            {
                success: true,
                message: "Patient updated successfully",
                data: updatedPatient,
            },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                message: "Failed to update patient",
                error: error.message,
            },
            { status: 500 }
        );
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const patient = await Patient.findByPk(id);

        if (!patient) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Patient not found",
                },
                { status: 404 }
            );
        }

        await patient.destroy();

        return NextResponse.json(
            {
                success: true,
                message: "Patient deleted successfully",
            },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                message: "Failed to delete patient",
                error: error.message,
            },
            { status: 500 }
        );
    }
}