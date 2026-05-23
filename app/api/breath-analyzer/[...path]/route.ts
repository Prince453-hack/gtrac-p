import { NextRequest } from "next/server";

const EXTERNAL_BASE = process.env.NEXT_PUBLIC_BREATH_ANALYZER_API || "http://103.91.90.235:3002/api";

async function proxyRequest(req: Request, params: { path?: string[] }) {
  const path = params.path ? params.path.join("/") : "";

  // Reconstruct search params from the incoming request URL
  const incomingUrl = new URL(req.url);
  const search = incomingUrl.search;

  const targetUrl = `${EXTERNAL_BASE}/${path}${search}`;

  const headers: Record<string, string> = {};
  // Forward only select headers from the client
  const incomingHeaders = new Headers(req.headers);
  if (incomingHeaders.get("authorization")) {
    headers["authorization"] = incomingHeaders.get("authorization") as string;
  }
  if (incomingHeaders.get("content-type")) {
    headers["content-type"] = incomingHeaders.get("content-type") as string;
  }

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
    // body only for methods that can have one
    body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body,
    // keep credentials off
  };

  const res = await fetch(targetUrl, fetchOptions);

  // Build response headers while removing hop-by-hop headers
  const responseHeaders = new Headers(res.headers);
  responseHeaders.delete("transfer-encoding");
  responseHeaders.delete("content-encoding");

  const buf = await res.arrayBuffer();
  return new Response(buf, {
    status: res.status,
    headers: responseHeaders,
  });
}

export async function GET(req: Request, { params }: { params: { path?: string[] } }) {
  return proxyRequest(req, params);
}

export async function POST(req: Request, { params }: { params: { path?: string[] } }) {
  return proxyRequest(req, params);
}

export async function PUT(req: Request, { params }: { params: { path?: string[] } }) {
  return proxyRequest(req, params);
}

export async function DELETE(req: Request, { params }: { params: { path?: string[] } }) {
  return proxyRequest(req, params);
}

export async function PATCH(req: Request, { params }: { params: { path?: string[] } }) {
  return proxyRequest(req, params);
}
