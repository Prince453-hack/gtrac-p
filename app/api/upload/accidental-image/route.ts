import { NextRequest, NextResponse } from "next/server";
import { readFile, readdir, rm, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const isVercel = Boolean(process.env.VERCEL);
const uploadRoot = process.env.ACCIDENTAL_IMAGE_UPLOAD_DIR
  ? process.env.ACCIDENTAL_IMAGE_UPLOAD_DIR
  : isVercel
    ? join("/tmp", "gtrac-uploads")
    : join(process.cwd(), "public", "uploads");

const getVehicleDir = (vehicleId: string) =>
  join(uploadRoot, "vehicles", vehicleId);

const getTimestampDir = (vehicleId: string, timestamp: string) =>
  join(getVehicleDir(vehicleId), timestamp);

const getImageDownloadUrl = (
  vehicleId: string,
  timestamp: string,
  fileName: string,
) =>
  `/api/upload/accidental-image?vehicleId=${encodeURIComponent(vehicleId)}&timestamp=${encodeURIComponent(timestamp)}&fileName=${encodeURIComponent(fileName)}&download=1`;

const getMimeType = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "bmp":
      return "image/bmp";
    case "svg":
      return "image/svg+xml";
    case "avif":
      return "image/avif";
    default:
      return "application/octet-stream";
  }
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vehicleId = searchParams.get("vehicleId");
    const timestamp = searchParams.get("timestamp");
    const fileName = searchParams.get("fileName");
    const download = searchParams.get("download") === "1";

    if (!vehicleId) {
      return NextResponse.json(
        { error: "vehicleId parameter is required" },
        { status: 400 }
      );
    }

    // Look for the latest image for this vehicle
    const vehicleDir = getVehicleDir(vehicleId);

    if (download) {
      if (!timestamp || !fileName) {
        return NextResponse.json(
          { error: "timestamp and fileName parameters are required" },
          { status: 400 }
        );
      }

      const filePath = join(getTimestampDir(vehicleId, timestamp), fileName);

      if (!existsSync(filePath)) {
        return NextResponse.json(
          { error: "Image not found" },
          { status: 404 }
        );
      }

      const fileBuffer = await readFile(filePath);

      // convert Node Buffer to Uint8Array to satisfy NextResponse BodyInit typing
      const uint8 = new Uint8Array(fileBuffer);

      return new NextResponse(uint8, {
        status: 200,
        headers: {
          "Content-Type": getMimeType(fileName),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    if (!existsSync(vehicleDir)) {
      return NextResponse.json(
        { imageUrl: null },
        { status: 200 }
      );
    }

    try {
      // Get all timestamp folders for this vehicle
      const timestampFolders = await readdir(vehicleDir);
      
      if (timestampFolders.length === 0) {
        return NextResponse.json(
          { imageUrl: null },
          { status: 200 }
        );
      }

      // Sort by timestamp (descending) to get the latest
      const sortedFolders = timestampFolders.sort().reverse();
      const latestTimestamp = sortedFolders[0];
      const imageDir = join(vehicleDir, latestTimestamp);

      // Get the first image file in the latest timestamp folder
      const imageFiles = await readdir(imageDir);
      
      if (imageFiles.length === 0) {
        return NextResponse.json(
          { imageUrl: null },
          { status: 200 }
        );
      }

      const latestImageFile = imageFiles[0];
      const imageUrl = getImageDownloadUrl(vehicleId, latestTimestamp, latestImageFile);

      return NextResponse.json(
        { imageUrl },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error reading vehicle directory:", error);
      return NextResponse.json(
        { imageUrl: null },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error fetching image:", error);
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const vehicleId = formData.get("vehicleId") as string;
    const vehicleNumber = formData.get("vehicleNumber") as string;
    const timestamp = formData.get("timestamp") as string;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file is an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Create folder structure: /uploads/vehicles/{vehicleId}/{timestamp}/
    const uploadDir = getTimestampDir(vehicleId, timestamp);

    // Create directories if they don't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate filename
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${vehicleNumber}-${Date.now()}.${ext}`;
    const filePath = join(uploadDir, fileName);

    // Convert file to buffer and write
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the public URL path
    const publicPath = getImageDownloadUrl(vehicleId, timestamp, fileName);

    return NextResponse.json(
      {
        success: true,
        filePath: publicPath,
        url: publicPath,
        fileName: fileName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image", details: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vehicleId = searchParams.get("vehicleId");

    if (!vehicleId) {
      return NextResponse.json(
        { error: "vehicleId parameter is required" },
        { status: 400 }
      );
    }

    const vehicleDir = getVehicleDir(vehicleId);

    if (!existsSync(vehicleDir)) {
      return NextResponse.json(
        { success: true, deleted: false },
        { status: 200 }
      );
    }

    await rm(vehicleDir, { recursive: true, force: true });

    return NextResponse.json(
      { success: true, deleted: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Image delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
