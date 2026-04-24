// app/api/timetable/route.ts
// GET /api/timetable → List all doctors with their specialities and weekly schedule

import { NextRequest, NextResponse } from "next/server";
import models from "@/models";

// ── Helpers ──────────────────────────────────────────────────

/**
 * Formats a day entry from DoctorDetails into a display string.
 * Returns "HH:MM AM – HH:MM AM" if available, or "Not sitting".
 */
function formatDaySlot(
  isAvailable: boolean | null | undefined,
  start: string | null | undefined,
  end: string | null | undefined
): string {
  if (!isAvailable || !start || !end) return "Not sitting";
  return `${formatTime(start)} – ${formatTime(end)}`;
}

/**
 * Converts "HH:MM:SS" (DB TIME format) → "HH:MM AM/PM"
 */
function formatTime(time: string): string {
  if (!time) return "--";
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr, 10);
  const minute = minuteStr || "00";
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${minute} ${period}`;
}

// ── GET /api/timetable ────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const doctors = await models.User.findAll({
      where: { role: "doctor" },
      attributes: ["id", "fname", "lname"],
      include: [
        {
          model: models.Service,
          as: "Services",
          attributes: ["id", "name"],
          through: { attributes: [] }, // exclude junction table fields
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
      order: [["createdAt", "DESC"]],
    });

    // ── Shape response ──
    const timetable = doctors.map((doctor: any) => {
      const d = doctor.DoctorDetails;

      return {
        id: doctor.id,
        doctorName: `${doctor.fname} ${doctor.lname}`,
        specialities: (doctor.Services || []).map((s: any) => s.name),
        schedule: {
          monday: formatDaySlot(d?.isMon, d?.monStarttime, d?.monEndtime),
          tuesday: formatDaySlot(d?.isTues, d?.tuesStarttime, d?.tuesEndtime),
          wednesday: formatDaySlot(d?.isWed, d?.wedStarttime, d?.wedEndtime),
          thursday: formatDaySlot(d?.isThurs, d?.thursStarttime, d?.thursEndtime),
          friday: formatDaySlot(d?.isFri, d?.friStarttime, d?.friEndtime),
          saturday: formatDaySlot(d?.isSat, d?.satStarttime, d?.satEndtime),
          sunday: formatDaySlot(d?.isSun, d?.sunStarttime, d?.sunEndtime),
        },
      };
    });

    return NextResponse.json({ timetable }, { status: 200 });
  } catch (error: any) {
    console.error("[GET /api/timetable] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}