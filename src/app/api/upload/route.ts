/* eslint-disable */
import { NextResponse } from "next/server";
import { uploadFileToMediaLibrary } from "../../../lib/ghl";
import { getToken } from "../../../lib/token";

// POST /api/upload — Upload a file to GHL media library
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const locationId = formData.get("locationId") as string | null;

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const tokenRecord = await getToken(locationId);
    if (!tokenRecord || "success" in tokenRecord) {
      return NextResponse.json({ error: "No valid token" }, { status: 401 });
    }

    const ghl = { access_token: tokenRecord.access_token, locationId };

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadFileToMediaLibrary(
      ghl,
      "",
      buffer,
      file.name,
      file.type
    );

    if (!result.success) {
      return NextResponse.json({ error: "Upload failed", details: result.data }, { status: result.status });
    }

    return NextResponse.json({
      success: true,
      fileId: result.data?.fileId || null,
      url: result.data?.url || null,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
