// app/api/timetable/[id]/route.ts
// GET /api/timetable/[id]  → Single doctor details (name, specialities, weekly schedule)
// PUT /api/timetable/[id]  → Update doctor's weekly timetable

import { NextRequest, NextResponse } from "next/server";
import models from "@/models";

// ── Types ─────────────────────────────────────────────────────

interface DayPayload {
    isAvailable: boolean;
    startTime?: string | null; // "HH:MM" or "HH:MM:SS"
    endTime?: string | null;
}

interface TimetableBody {
    monday?: DayPayload;
    tuesday?: DayPayload;
    wednesday?: DayPayload;
    thursday?: DayPayload;
    friday?: DayPayload;
    saturday?: DayPayload;
    sunday?: DayPayload;
    updatedBy?: number;
}

// ── Validators ────────────────────────────────────────────────

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

function validateTime(value: string | null | undefined, label: string): string | null {
    if (!value) return null; // optional — only validate if provided
    if (!TIME_REGEX.test(value)) return `${label} must be in HH:MM or HH:MM:SS format.`;
    return null;
}

function validateBody(body: TimetableBody): string[] {
    const errors: string[] = [];
    const days = [
        { key: "monday", label: "Monday" },
        { key: "tuesday", label: "Tuesday" },
        { key: "wednesday", label: "Wednesday" },
        { key: "thursday", label: "Thursday" },
        { key: "friday", label: "Friday" },
        { key: "saturday", label: "Saturday" },
        { key: "sunday", label: "Sunday" },
    ] as const;

    for (const { key, label } of days) {
        const day = body[key];
        if (!day) continue; // day not sent → skip

        if (day.isAvailable) {
            // If marked available, start & end are required
            if (!day.startTime) errors.push(`${label}: startTime is required when isAvailable is true.`);
            if (!day.endTime) errors.push(`${label}: endTime is required when isAvailable is true.`);

            const startErr = validateTime(day.startTime, `${label} startTime`);
            const endErr = validateTime(day.endTime, `${label} endTime`);
            if (startErr) errors.push(startErr);
            if (endErr) errors.push(endErr);

            // Ensure start < end
            if (day.startTime && day.endTime && !startErr && !endErr) {
                const start = day.startTime.replace(/:/g, "");
                const end = day.endTime.replace(/:/g, "");
                if (start >= end) {
                    errors.push(`${label}: startTime must be before endTime.`);
                }
            }
        }
    }

    return errors;
}

// ── Helpers ───────────────────────────────────────────────────

function formatTime(time: string | null | undefined): string {
    if (!time) return "--:--";
    const [hourStr, minuteStr] = time.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = minuteStr || "00";
    const period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${period}`;
}

// ── GET /api/timetable/[id] ───────────────────────────────────
export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const doctorId = parseInt(params.id, 10);
        if (isNaN(doctorId)) {
            return NextResponse.json({ error: "Invalid doctor ID." }, { status: 400 });
        }

        const doctor = await models.User.findOne({
            where: { id: doctorId, role: "doctor" },
            attributes: ["id", "fname", "lname"],
            include: [
                {
                    model: models.Service,
                    as: "Services",
                    attributes: ["id", "name"],
                    through: { attributes: [] },
                },
                {
                    model: models.DoctorDetails,
                    as: "DoctorDetails",
                    attributes: [
                        "id",
                        "isMon", "monStarttime", "monEndtime",
                        "isTues", "tuesStarttime", "tuesEndtime",
                        "isWed", "wedStarttime", "wedEndtime",
                        "isThurs", "thursStarttime", "thursEndtime",
                        "isFri", "friStarttime", "friEndtime",
                        "isSat", "satStarttime", "satEndtime",
                        "isSun", "sunStarttime", "sunEndtime",
                    ],
                },
            ],
        });

        if (!doctor) {
            return NextResponse.json(
                { error: "Doctor not found." },
                { status: 404 }
            );
        }

        const d = (doctor as any).DoctorDetails;

        const response = {
            id: doctor.id,
            doctorName: `${doctor.fname} ${doctor.lname}`,
            specialities: ((doctor as any).Services || []).map((s: any) => ({
                id: s.id,
                name: s.name,
            })),
            schedule: {
                monday: {
                    isAvailable: d?.isMon ?? false,
                    startTime: d?.monStarttime ?? null,
                    endTime: d?.monEndtime ?? null,
                    display: d?.isMon
                        ? `${formatTime(d.monStarttime)} – ${formatTime(d.monEndtime)}`
                        : "Not sitting",
                },
                tuesday: {
                    isAvailable: d?.isTues ?? false,
                    startTime: d?.tuesStarttime ?? null,
                    endTime: d?.tuesEndtime ?? null,
                    display: d?.isTues
                        ? `${formatTime(d.tuesStarttime)} – ${formatTime(d.tuesEndtime)}`
                        : "Not sitting",
                },
                wednesday: {
                    isAvailable: d?.isWed ?? false,
                    startTime: d?.wedStarttime ?? null,
                    endTime: d?.wedEndtime ?? null,
                    display: d?.isWed
                        ? `${formatTime(d.wedStarttime)} – ${formatTime(d.wedEndtime)}`
                        : "Not sitting",
                },
                thursday: {
                    isAvailable: d?.isThurs ?? false,
                    startTime: d?.thursStarttime ?? null,
                    endTime: d?.thursEndtime ?? null,
                    display: d?.isThurs
                        ? `${formatTime(d.thursStarttime)} – ${formatTime(d.thursEndtime)}`
                        : "Not sitting",
                },
                friday: {
                    isAvailable: d?.isFri ?? false,
                    startTime: d?.friStarttime ?? null,
                    endTime: d?.friEndtime ?? null,
                    display: d?.isFri
                        ? `${formatTime(d.friStarttime)} – ${formatTime(d.friEndtime)}`
                        : "Not sitting",
                },
                saturday: {
                    isAvailable: d?.isSat ?? false,
                    startTime: d?.satStarttime ?? null,
                    endTime: d?.satEndtime ?? null,
                    display: d?.isSat
                        ? `${formatTime(d.satStarttime)} – ${formatTime(d.satEndtime)}`
                        : "Not sitting",
                },
                sunday: {
                    isAvailable: d?.isSun ?? false,
                    startTime: d?.sunStarttime ?? null,
                    endTime: d?.sunEndtime ?? null,
                    display: d?.isSun
                        ? `${formatTime(d.sunStarttime)} – ${formatTime(d.sunEndtime)}`
                        : "Not sitting",
                },
            },
        };

        return NextResponse.json({ doctor: response }, { status: 200 });
    } catch (error: any) {

        console.error(`[GET /api/timetable/[id]] Error:`, error); // ✅ FIX

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// ── PUT /api/timetable/[id] ───────────────────────────────────
export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params; // ✅ FIX

        const doctorId = parseInt(id, 10);

        if (Number.isNaN(doctorId)) {
            return NextResponse.json(
                { error: "Invalid doctor ID." },
                { status: 400 }
            );
        }
        // ── Confirm doctor exists ──
        const doctor = await models.User.findOne({
            where: { id: doctorId, role: "doctor" },
            attributes: ["id", "fname", "lname"],
        });

        if (!doctor) {
            return NextResponse.json({ error: "Doctor not found." }, { status: 404 });
        }

        // ── Parse & validate body ──
        const body: TimetableBody = await req.json();
        const errors = validateBody(body);
        if (errors.length > 0) {
            return NextResponse.json({ errors }, { status: 422 });
        }

        // ── Build DoctorDetails payload ──
        const payload: Record<string, any> = {
            userId: doctorId,
            updatedBy: body.updatedBy ?? null,
        };

        const dayMap = [
            {
                key: "monday",
                isField: "isMon",
                startField: "monStarttime",
                endField: "monEndtime",
            },
            {
                key: "tuesday",
                isField: "isTues",
                startField: "tuesStarttime",
                endField: "tuesEndtime",
            },
            {
                key: "wednesday",
                isField: "isWed",
                startField: "wedStarttime",
                endField: "wedEndtime",
            },
            {
                key: "thursday",
                isField: "isThurs",
                startField: "thursStarttime",
                endField: "thursEndtime",
            },
            {
                key: "friday",
                isField: "isFri",
                startField: "friStarttime",
                endField: "friEndtime",
            },
            {
                key: "saturday",
                isField: "isSat",
                startField: "satStarttime",
                endField: "satEndtime",
            },
            {
                key: "sunday",
                isField: "isSun",
                startField: "sunStarttime",
                endField: "sunEndtime",
            },
        ] as const;

        for (const { key, isField, startField, endField } of dayMap) {
            const day = body[key];
            if (day === undefined) continue; // not sent → don't overwrite

            payload[isField] = day.isAvailable ?? false;
            // If not available, clear the times
            payload[startField] = day.isAvailable ? (day.startTime ?? null) : null;
            payload[endField] = day.isAvailable ? (day.endTime ?? null) : null;
        }

        // ── Upsert DoctorDetails ──
        // If the record exists → update; if not → create (with createdBy)
        const existing = await models.DoctorDetails.findOne({
            where: { userId: doctorId },
        });

        let doctorDetails;

        if (existing) {
            await existing.update(payload);
            doctorDetails = existing;
        } else {
            // First time creating — createdBy is required by your schema
            doctorDetails = await models.DoctorDetails.create({
                ...payload,
                createdBy: body.updatedBy ?? doctorId, // fallback to doctorId if no actor provided
            });
        }

        return NextResponse.json(
            {
                message: "Timetable updated successfully.",
                doctorDetails,
            },
            { status: 200 }
        );
    } catch (error: any) {
        // console.error(`[PUT /api/timetable/${params.id}] Error:`, error);
        console.error(`[PUT /api/timetable/[id]] Error:`, error); // ✅ FIX
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}