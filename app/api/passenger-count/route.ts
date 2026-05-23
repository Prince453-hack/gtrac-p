import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PASSENGER_COUNT_API =
  "https://f858-49-205-176-68.ngrok-free.app/api/passenger-count";

export async function GET(request: NextRequest) {
  const startTime = request.nextUrl.searchParams.get("startTime");
  const endTime = request.nextUrl.searchParams.get("endTime");

  if (!startTime || !endTime) {
    return NextResponse.json(
      { message: "startTime and endTime are required" },
      { status: 400 },
    );
  }

  const remoteUrl = new URL(PASSENGER_COUNT_API);
  remoteUrl.searchParams.set("startTime", startTime);
  remoteUrl.searchParams.set("endTime", endTime);

  try {
    const response = await fetch(remoteUrl.toString(), {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();

      return NextResponse.json(
        {
          message: errorText || "Failed to fetch passenger count data",
        },
        { status: response.status },
      );
    }

    const payload = await response.json();

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch passenger count data",
      },
      { status: 502 },
    );
  }
}
