import { NextResponse } from "next/server";
import { appendRegistration, getEventSettings, getCurrentRegistrationCount } from "@/lib/google-sheets";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { media, name, phone, email } = body;

    if (!media || !name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const settings = await getEventSettings();
    if (settings && settings.MaxCapacity) {
      const maxCapacity = parseInt(settings.MaxCapacity, 10);
      if (!isNaN(maxCapacity)) {
        const currentCount = await getCurrentRegistrationCount();
        if (currentCount >= maxCapacity) {
          return NextResponse.json(
            { success: false, error: "full" },
            { status: 403 }
          );
        }
      }
    }

    // Generate KST Timestamp
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const timestamp = kstDate.toISOString().replace("T", " ").substring(0, 19);

    try {
      await appendRegistration([timestamp, media, name, phone, email]);
    } catch (e: any) {
      // If missing Google Sheets config, we just mock success
      if (e.message.includes("Missing Google Sheet ID") || e.message.includes("Missing Google Service Account credentials")) {
        console.warn("Google Sheets not configured. Mocking successful submission.");
        console.log("Submitted Data:", [timestamp, media, name, phone, email]);
      } else {
        throw e;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit registration" },
      { status: 500 }
    );
  }
}
