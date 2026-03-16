/* eslint-disable */
import { NextResponse } from "next/server";
import { getLocationTags, addContactTags, removeContactTags } from "../../../lib/ghl";
import { getToken } from "../../../lib/token";

// GET /api/tags?locationId=xxx — Get all tags for a location
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }

    const tokenRecord = await getToken(locationId);
    if (!tokenRecord || "success" in tokenRecord) {
      return NextResponse.json({ error: "No valid token" }, { status: 401 });
    }

    const result = await getLocationTags({
      access_token: tokenRecord.access_token,
      locationId,
    });

    if (!result.success) {
      return NextResponse.json({ error: "Failed to fetch tags", details: result.data }, { status: result.status });
    }

    const tags = (Array.isArray(result.data) ? result.data : []).map((t: any) => ({
      id: t.id,
      name: t.name,
    }));

    return NextResponse.json({ success: true, tags });
  } catch (error: any) {
    console.error("Tags fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/tags — Add tags to a contact
// Body: { locationId, contactId, tags: string[] }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { locationId, contactId, tags } = body;

    if (!locationId || !contactId || !tags?.length) {
      return NextResponse.json({ error: "Missing locationId, contactId, or tags" }, { status: 400 });
    }

    const tokenRecord = await getToken(locationId);
    if (!tokenRecord || "success" in tokenRecord) {
      return NextResponse.json({ error: "No valid token" }, { status: 401 });
    }

    const result = await addContactTags(
      { access_token: tokenRecord.access_token, locationId },
      contactId,
      tags
    );

    if (!result.success) {
      return NextResponse.json({ error: "Failed to add tags", details: result.data }, { status: result.status });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error("Tags add error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/tags — Remove tags from a contact
// Body: { locationId, contactId, tags: string[] }
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { locationId, contactId, tags } = body;

    if (!locationId || !contactId || !tags?.length) {
      return NextResponse.json({ error: "Missing locationId, contactId, or tags" }, { status: 400 });
    }

    const tokenRecord = await getToken(locationId);
    if (!tokenRecord || "success" in tokenRecord) {
      return NextResponse.json({ error: "No valid token" }, { status: 401 });
    }

    const result = await removeContactTags(
      { access_token: tokenRecord.access_token, locationId },
      contactId,
      tags
    );

    if (!result.success) {
      return NextResponse.json({ error: "Failed to remove tags", details: result.data }, { status: result.status });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error("Tags remove error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
