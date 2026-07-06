import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const REMOTE_API = "http://203.115.101.58:3000/api/snapshots/latest";

export async function GET() {
  try {
    const response = await fetch(REMOTE_API, {
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
