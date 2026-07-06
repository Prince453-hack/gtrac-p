import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const vehicleID = request.nextUrl.searchParams.get("vehicleID");
  const timeBegin = request.nextUrl.searchParams.get("timeBegin");
  const timeEnd = request.nextUrl.searchParams.get("timeEnd");
  const authHeader = request.headers.get("Authorization");

  const remoteUrl = new URL("http://fuel.centralcommandroom.in/ls/api/v1/reports/fuellevel");
  if (vehicleID) remoteUrl.searchParams.set("vehicleID", vehicleID);
  if (timeBegin) remoteUrl.searchParams.set("timeBegin", timeBegin);
  if (timeEnd) remoteUrl.searchParams.set("timeEnd", timeEnd);

  const headers: Record<string, string> = {};
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  try {
    const response = await fetch(remoteUrl.toString(), {
      method: "GET",
      cache: "no-store",
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { message: errorText || "Failed to fetch fuel level" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Fuel level proxy failed",
      },
      { status: 502 }
    );
  }
}
