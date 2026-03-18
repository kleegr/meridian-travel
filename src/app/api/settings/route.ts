/* eslint-disable */
import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";

// GET /api/settings?locationId=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const locationId = searchParams.get("locationId");

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("location_id", locationId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found (not an error, just empty)
      console.error("Error fetching settings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return settings or defaults
    return NextResponse.json({
      success: true,
      settings: data || null,
    });
  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/settings — Create or update settings for a location
// Body: { locationId, ...settingsFields }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { locationId, ...settingsData } = body;

    if (!locationId) {
      return NextResponse.json({ error: "Missing locationId" }, { status: 400 });
    }

    // Build the update/insert object from provided fields
    const record: Record<string, any> = {};
    if (settingsData.agencyProfile !== undefined) record.agency_profile = settingsData.agencyProfile;
    if (settingsData.pipelines !== undefined) record.pipelines = settingsData.pipelines;
    if (settingsData.activePipelineId !== undefined) record.active_pipeline_id = settingsData.activePipelineId;
    if (settingsData.featureFlags !== undefined) record.feature_flags = settingsData.featureFlags;
    if (settingsData.bookingSources !== undefined) record.booking_sources = settingsData.bookingSources;
    if (settingsData.suppliers !== undefined) record.suppliers = settingsData.suppliers;
    if (settingsData.customFields !== undefined) record.custom_fields = settingsData.customFields;
    if (settingsData.checklistTemplates !== undefined) record.checklist_templates = settingsData.checklistTemplates;
    if (settingsData.financialConfig !== undefined) record.financial_config = settingsData.financialConfig;
    if (settingsData.automationRules !== undefined) record.automation_rules = settingsData.automationRules;
    if (settingsData.dashWidgets !== undefined) record.dash_widgets = settingsData.dashWidgets;
    if (settingsData.packages !== undefined) record.packages = settingsData.packages;

    // Check if settings exist for this location
    const { data: existing, error: existingError } = await supabase
      .from("settings")
      .select("id")
      .eq("location_id", locationId)
      .single();

    // PGRST116 = no rows found (not an error, just empty)
    if (existingError && existingError.code !== "PGRST116") {
      throw existingError;
    }

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from("settings")
        .update(record)
        .eq("id", existing.id)
        .select()
        .single();
      if (error) {
        console.error("Update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    } else {
      const { data, error } = await supabase
        .from("settings")
        .insert({ location_id: locationId, ...record })
        .select()
        .single();
      if (error) {
        console.error("Insert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      result = data;
    }

    return NextResponse.json({ success: true, settings: result });
  } catch (error: any) {
    console.error("Error saving settings:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
