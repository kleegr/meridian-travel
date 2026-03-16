/* eslint-disable */
import { NextResponse } from "next/server";
import { searchContacts, upsertContact, setupCustomFields, updateContact } from "../../../lib/ghl";
import { getToken } from "../../../lib/token";

// GET /api/contacts?locationId=xxx&q=searchterm
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");
    const query = searchParams.get("q") || "";

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }

    const tokenRecord = await getToken(locationId);
    if (!tokenRecord || "success" in tokenRecord) {
      return NextResponse.json({ error: "No valid token" }, { status: 401 });
    }

    const result = await searchContacts(
      { access_token: tokenRecord.access_token, locationId },
      query || undefined
    );

    if (!result.success) {
      return NextResponse.json({ error: "Search failed", details: result.data }, { status: result.status });
    }

    // Normalize contact data for the frontend
    const contacts = (Array.isArray(result.data) ? result.data : []).map((c: any) => ({
      id: c.id,
      name: c.contactName || c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim(),
      firstName: c.firstName || "",
      lastName: c.lastName || "",
      email: c.email || "",
      phone: c.phone || "",
      address: c.address1 || "",
      city: c.city || "",
      state: c.state || "",
      country: c.country || "",
      tags: c.tags || [],
    }));

    return NextResponse.json({ success: true, contacts });
  } catch (error: any) {
    console.error("Contact search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/contacts — Upsert contact + save itinerary info as custom fields + additional emails/phones
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      locationId, firstName, lastName, email, phone, tags,
      // Itinerary fields for custom fields
      tripName, destinations, startDate, endDate, status, agent, passengers, tripType, notes, isVip,
      // Additional emails/phones (beyond the primary)
      additionalEmails, additionalPhones,
      // Address
      address1, city, state, country,
    } = body;

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }

    const tokenRecord = await getToken(locationId);
    if (!tokenRecord || "success" in tokenRecord) {
      return NextResponse.json({ error: "No valid token" }, { status: 401 });
    }

    const ghl = { access_token: tokenRecord.access_token, locationId };

    // 1. Upsert the contact (creates or finds existing)
    const upsertResult = await upsertContact(ghl, {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      tags,
    });

    if (!upsertResult.success) {
      return NextResponse.json({ error: "Upsert failed", details: upsertResult.data }, { status: upsertResult.status });
    }

    const contact = upsertResult.data;
    const contactId = contact?.id;

    if (!contactId) {
      return NextResponse.json({ success: true, contact });
    }

    // 2. Setup custom fields in "Kleegr Travels" folder and get field IDs with values
    const customFieldDefs = [
      { key: "Trip Name", field_value: tripName || "" },
      { key: "Destinations", field_value: destinations || "" },
      { key: "Departure Date", field_value: startDate || "" },
      { key: "Return Date", field_value: endDate || "" },
      { key: "Trip Status", field_value: status || "" },
      { key: "Assigned Agent", field_value: agent || "" },
      { key: "Passengers", field_value: String(passengers || "") },
      { key: "Trip Type", field_value: tripType || "" },
      { key: "VIP Client", field_value: isVip ? "Yes" : "No" },
      { key: "Trip Notes", field_value: notes || "" },
    ].filter((f) => f.field_value);

    let customFields: any[] = [];
    try {
      customFields = await setupCustomFields(locationId, customFieldDefs, tokenRecord.access_token);
    } catch (e: any) {
      console.error("Custom fields setup error:", e.message);
    }

    // 3. Update contact with custom fields + additional emails/phones + address
    const updateData: any = { contactId };

    if (customFields.length > 0) {
      updateData.customFields = customFields;
    }
    if (additionalEmails?.length > 0) {
      updateData.additionalEmails = additionalEmails;
    }
    if (additionalPhones?.length > 0) {
      updateData.additionalPhones = additionalPhones;
    }
    if (address1) updateData.address1 = address1;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (country) updateData.country = country;

    if (Object.keys(updateData).length > 1) {
      try {
        await updateContact(ghl, updateData);
      } catch (e: any) {
        console.error("Contact update error:", e.message);
      }
    }

    return NextResponse.json({ success: true, contact });
  } catch (error: any) {
    console.error("Contact upsert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
