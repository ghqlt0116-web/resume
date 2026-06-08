import { NextResponse } from "next/server";
import { getEventSettings, getCurrentRegistrationCount } from "@/lib/google-sheets";

// Revalidate every 60 seconds (or 0 for real-time)
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getEventSettings();

    const currentCount = await getCurrentRegistrationCount();

    if (!settings) {
      // Fallback data if Google Sheets is not configured or fails
      return NextResponse.json({
        success: true,
        data: {
          EventName: "SK브로드밴드 2026 하반기 프레스 데이",
          EventIntro: "SK브로드밴드의 새로운 비전과 혁신적인 서비스를 소개하는 자리에 기자 여러분을 초대합니다.\n바쁘시겠지만 부디 참석하시어 자리를 빛내주시기 바랍니다.",
          EventSchedule: "일시: 2026년 9월 10일 (목) 14:00 - 16:00\n장소: SK브로드밴드 본사 1층 수펙스홀",
          OpenTimeKST: "2026-01-01 09:00",
          CloseTimeKST: "2026-12-31 18:00",
          MaxCapacity: "100",
          CurrentCount: currentCount
        },
      });
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
