import { NextResponse } from "next/server";
import { getEventSettings, getCurrentRegistrationCount } from "@/lib/google-sheets";

// Revalidate every 15 seconds to prevent Google Sheets API Rate Limit (429 Error)
export const revalidate = 15;

export async function GET() {
  try {
    const settings = await getEventSettings();
    const currentCount = await getCurrentRegistrationCount();

    if (!settings) {
      return NextResponse.json(
        { success: false, error: "Failed to load settings from Google Sheets" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { ...settings, CurrentCount: currentCount } });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch event settings" },
      { status: 500 }
    );
  }
}
