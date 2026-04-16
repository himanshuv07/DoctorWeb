import { NextRequest, NextResponse } from "next/server";
import { Patient, User } from "@/models";
import { getUser } from "@/lib/getUser";

// type Params = {
//     params: Promise<{ id: string }>;
// };

// ================== GET ==================
export async function GET(req: NextRequest) {
    try {
        const user = getUser(req);

        if (!user) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const patients = await Patient.findAll({

            // ✅ ROLE-BASED FILTER
            // where: user.role === "Admin" ? {} : { createdBy: user.id },

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
            order: [["id", "DESC"]],
        });

        return NextResponse.json(
            {
                success: true,
                message: "Patients fetched successfully",
                data: patients,
            },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch patients",
                error: error.message,
            },
            { status: 500 }
        );
    }
}

// ================== POST ==================
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
        } = body;

        if (
            !fname ||
            !lname ||
            !phone ||
            !email ||
            !gender ||
            !country ||
            !address1 ||
            !city ||
            !state ||
            !zipCode
        ) {
            return NextResponse.json(
                {
                    success: false,
                    message: "All required fields must be provided",
                },
                { status: 400 }
            );
        }

        const existingPatient = await Patient.findOne({
            where: { email },
        });

        if (existingPatient) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Patient with this email already exists",
                },
                { status: 409 }
            );
        }

        const patient = await Patient.create({
            fname,
            lname,
            phone,
            email,
            gender,
            country,
            address1,
            address2: address2 || null,
            city,
            state,
            zipCode,
            createdBy: user.id, // ✅ dynamic user
            updatedBy: user.id,
        });

        const newPatient = await Patient.findByPk(patient.id, {
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
                message: "Patient created successfully",
                data: newPatient,
            },
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                message: "Failed to create patient",
                error: error.message,
            },
            { status: 500 }
        );
    }
}