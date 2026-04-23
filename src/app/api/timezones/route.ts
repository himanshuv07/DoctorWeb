import { NextResponse } from "next/server";

export async function GET() {
  try {
    const timezones = [
      { value: "Asia/Kolkata", label: "(GMT+5:30) Chennai, Kolkata, Mumbai, New Delhi" },
      { value: "America/New_York", label: "(GMT-5:00) Eastern Time (US & Canada)" },
      { value: "America/Chicago", label: "(GMT-6:00) Central Time (US & Canada)" },
      { value: "America/Denver", label: "(GMT-7:00) Mountain Time (US & Canada)" },
      { value: "America/Los_Angeles", label: "(GMT-8:00) Pacific Time (US & Canada)" },
      { value: "Europe/London", label: "(GMT+0:00) London, Edinburgh, Dublin" },
      { value: "Europe/Paris", label: "(GMT+1:00) Paris, Berlin, Rome, Madrid" },
      { value: "Asia/Dubai", label: "(GMT+4:00) Abu Dhabi, Muscat" },
      { value: "Asia/Singapore", label: "(GMT+8:00) Singapore, Kuala Lumpur" },
      { value: "Asia/Tokyo", label: "(GMT+9:00) Tokyo, Osaka, Sapporo" },
      { value: "Australia/Sydney", label: "(GMT+10:00) Sydney, Melbourne" }
    ];

    return NextResponse.json({
      success: true,
      data: timezones,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch timezones" },
      { status: 500 }
    );
  }
}