import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type SummaryCategoryPayload = {
  title: string;
  count: number;
  vehicleCount: number;
  coverageLabel: string;
  uniqueVehicleCount: number;
  topAlertTypes: { name: string; count: number }[];
  topVehicles: { vehicleNumber: string; count: number }[];
  recentAlerts: {
    vehicleNumber: string;
    alertType: string;
    message: string;
    time: string;
  }[];
};

type OverviewSummaryPayload = {
  generatedAt: string;
  reportName: string;
  dateRange: string;
  totals: {
    totalVehicles: number;
    fuelEnabledVehicles: number;
    lockEnabledVehicles: number;
    dashcamEnabledVehicles: number;
    activeCategories: number;
    totalOpenAlerts: number;
  };
  categories: SummaryCategoryPayload[];
};

const openRouterEndpoint = "https://openrouter.ai/api/v1/chat/completions";

const percentOf = (value: number, total: number) => {
  if (!total || total <= 0) {
    return "0.0";
  }

  return ((value / total) * 100).toFixed(1);
};

const buildVehicleExposure = (categories: SummaryCategoryPayload[]) => {
  const vehicleExposure = new Map<string, number>();

  for (const category of categories) {
    for (const vehicle of category.topVehicles || []) {
      if (!vehicle?.vehicleNumber) {
        continue;
      }

      const currentCount = vehicleExposure.get(vehicle.vehicleNumber) || 0;
      vehicleExposure.set(
        vehicle.vehicleNumber,
        currentCount + (vehicle.count || 0),
      );
    }
  }

  return Array.from(vehicleExposure.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([vehicleNumber, count]) => `${vehicleNumber} (${count})`)
    .join(", ");
};

const buildCategorySnapshot = (payload: OverviewSummaryPayload) => {
  const totalAlerts = payload?.totals?.totalOpenAlerts || 0;

  return payload.categories
    .filter((category) => category.count > 0)
    .sort((a, b) => b.count - a.count)
    .map((category) => {
      const topAlertTypes = (category.topAlertTypes || [])
        .slice(0, 3)
        .map((item) => `${item.name} (${item.count})`)
        .join(", ");

      const topVehicles = (category.topVehicles || [])
        .slice(0, 3)
        .map((item) => `${item.vehicleNumber} (${item.count})`)
        .join(", ");

      return [
        `Category: ${category.title}`,
        `Alerts: ${category.count} (${percentOf(category.count, totalAlerts)}% of total)`,
        `Unique vehicles: ${category.uniqueVehicleCount}`,
        `Coverage: ${category.coverageLabel}`,
        `Top alert types: ${topAlertTypes || "Not available in payload"}`,
        `Top vehicles: ${topVehicles || "Not available in payload"}`,
      ].join("\n");
    })
    .join("\n\n");
};

const sanitizeSummaryOutput = (rawSummary: string) => {
  return rawSummary
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const buildPrompt = (payload: OverviewSummaryPayload) => {
  const vehicleExposure = buildVehicleExposure(payload.categories);
  const categorySnapshot = buildCategorySnapshot(payload);

  return [
    "Generate a detailed fleet operations summary from the provided fleet alert dashboard data.",
    "Output rules (must follow):",
    "1. Return plain text only.",
    "2. Do not use Markdown formatting. Avoid heading markers such as #, ##, ### and avoid Markdown tables.",
    "3. Keep the tone suitable for fleet operations managers.",
    "4. Keep the report factual and derived only from payload values.",
    "5. Target one page, never exceed two pages.",
    "Section order and exact titles:",
    "1. Executive Summary",
    "2. Detailed Alert Breakdown",
    "3. Most Affected Vehicles",
    "4. Operational Priorities",
    "Detail requirements:",
    "1. Include total vehicles, total open alerts, active categories, fuel-enabled vehicles, lock-enabled vehicles, and dashcam-enabled vehicles.",
    "2. For each category with alerts > 0, include alert count, share of total alerts, unique vehicles involved, top alert types, top vehicles, and one notable pattern.",
    "3. Mention zero-alert categories only when it improves the operational picture.",
    "4. If any value is missing, write: Not available in payload.",
    "5. In Most Affected Vehicles, include at least 5 vehicles with supporting data points.",
    "6. End with exactly 5 immediate priorities driven by alert volume and risk.",
    "Precomputed context:",
    `Top vehicle exposure from category highlights: ${vehicleExposure || "Not available in payload"}`,
    "Category snapshot:",
    categorySnapshot || "No active alert categories found.",
    "Dashboard payload:",
    JSON.stringify(payload, null, 2),
  ].join("\n");
};

export async function POST(request: NextRequest) {
  try {
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;

    // free model example
    const openRouterModel =
      process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat";

    if (!openRouterApiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not configured." },
        { status: 500 },
      );
    }

    const payload = (await request.json()) as OverviewSummaryPayload;

    if (!payload?.categories || !Array.isArray(payload.categories)) {
      return NextResponse.json(
        { error: "Invalid summary payload." },
        { status: 400 },
      );
    }

    const aiResponse = await fetch(openRouterEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterApiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Fleet Dashboard AI Summary",
      },
      body: JSON.stringify({
        model: openRouterModel,
        temperature: 0.2,
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content:
              "You are a senior fleet operations analyst. Produce detailed, decision-ready operational summaries using dashboard data only. Output plain text only, without Markdown syntax.",
          },
          {
            role: "user",
            content: buildPrompt(payload),
          },
        ],
      }),
      cache: "no-store",
    });

    const data = await aiResponse.json();

    if (!aiResponse.ok) {
      const errorMessage =
        data?.error?.message || "OpenRouter failed to generate summary.";

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    const summary = sanitizeSummaryOutput(
      data?.choices?.[0]?.message?.content?.trim() || "",
    );

    if (!summary) {
      return NextResponse.json(
        { error: "OpenRouter returned an empty summary." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        summary,
        model: openRouterModel,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      },
    );
  } catch (error: any) {
    console.error("Overview AI summary error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to generate overview summary." },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
