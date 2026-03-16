/* eslint-disable */
import { NextResponse } from "next/server";
import { getLocationUsers } from "../../../lib/ghl";
import { getToken } from "../../../lib/token";

// GET /api/users?locationId=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }

    // Get the stored token for this location
    const tokenRecord = await getToken(locationId);
    if (!tokenRecord || "success" in tokenRecord) {
      return NextResponse.json({ error: "No valid token for this location" }, { status: 401 });
    }

    // Fetch users from GHL
    const result = await getLocationUsers({
      access_token: tokenRecord.access_token,
      locationId,
    });

    if (!result.success) {
      return NextResponse.json({ error: "Failed to fetch users", details: result.data }, { status: result.status });
    }

    // Extract user names for the agents list
    const users = result.data?.users || [];
    const agents = users
      .filter((u: any) => !u.deleted)
      .map((u: any) => ({
        id: u.id,
        name: u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim(),
        email: u.email,
        phone: u.phone,
        role: u.roles?.role || "user",
      }));

    return NextResponse.json({ success: true, agents });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
