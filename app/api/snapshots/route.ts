import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const REMOTE_API = "http://203.115.101.58:3000/api/snapshots";

export async function GET(request: NextRequest) {
  const startTime = request.nextUrl.searchParams.get("startTime");
  const endTime = request.nextUrl.searchParams.get("endTime");

  const remoteUrl = new URL(REMOTE_API);
  if (startTime) remoteUrl.searchParams.set("startTime", startTime);
  if (endTime) remoteUrl.searchParams.set("endTime", endTime);

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
        { message: errorText || "Failed to fetch snapshots" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, {
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
            : "Failed to fetch snapshots",
      },
      { status: 502 }
    );
  }
}
