import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const login = body?.login || process.env.NEXT_PUBLIC_FUEL_API_LOGIN;
    const password = body?.password || process.env.NEXT_PUBLIC_FUEL_API_PASSWORD;

    const response = await fetch("http://fuel.centralcommandroom.in/auth/login?jwt=1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ login, password }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { message: errorText || "Auth failure" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Auth proxy failed",
      },
      { status: 502 }
    );
  }
}
