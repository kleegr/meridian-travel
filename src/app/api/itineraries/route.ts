/* eslint-disable */
import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

// GET /api/itineraries?locationId=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("itineraries")
      .select("*")
      .eq("location_id", locationId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching itineraries:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return the itinerary data (JSONB) as an array
    const itineraries = (data || []).map((row: any) => row.data);

    return NextResponse.json({ success: true, itineraries });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/itineraries — Create or update an itinerary
// Body: { locationId, itinerary } or { locationId, itineraries } for bulk save
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { locationId, itinerary, itineraries } = body;

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }

    // Bulk save (full sync from client)
    if (itineraries && Array.isArray(itineraries)) {
      const results = [];

      for (const itin of itineraries) {
        const result = await upsertItinerary(locationId, itin);
        results.push(result);
      }

      return NextResponse.json({ success: true, count: results.length });
    }

    // Single itinerary upsert
    if (!itinerary || !itinerary.id) {
      return NextResponse.json({ error: "Missing itinerary or itinerary.id" }, { status: 400 });
    }

    const result = await upsertItinerary(locationId, itinerary);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error saving itinerary:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/itineraries — Delete an itinerary
// Body: { locationId, itineraryId }
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { locationId, itineraryId } = body;

    if (!locationId || !itineraryId) {
      return NextResponse.json({ error: "Missing locationId or itineraryId" }, { status: 400 });
    }

    const { error } = await supabase
      .from("itineraries")
      .delete()
      .eq("location_id", locationId)
      .eq("itinerary_id", itineraryId);

    if (error) {
      console.error("Error deleting itinerary:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function upsertItinerary(locationId: string, itinerary: any) {
  const { data: existing } = await supabase
    .from("itineraries")
    .select("id")
    .eq("location_id", locationId)
    .eq("itinerary_id", itinerary.id)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from("itineraries")
      .update({ data: itinerary })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) console.error("Update error:", error);
    return data;
  } else {
    const { data, error } = await supabase
      .from("itineraries")
      .insert({
        location_id: locationId,
        itinerary_id: itinerary.id,
        data: itinerary,
      })
      .select()
      .single();
    if (error) console.error("Insert error:", error);
    return data;
  }
}
