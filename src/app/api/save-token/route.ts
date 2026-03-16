/* eslint-disable */
import axios from "axios";
import { NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { getLocationAccessToken } from "../../../lib/token";

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const {
      appId,
      access_token,
      refresh_token,
      userType,
      companyId,
      locationId,
      userId,
    } = data;

    const isAgency = companyId && appId && access_token && userType === "Company";

    if (isAgency) {
      const url = `https://services.leadconnectorhq.com/oauth/installedLocations?companyId=${encodeURIComponent(companyId)}&appId=${encodeURIComponent(appId)}&limit=500&isInstalled=true`;

      const resp = await axios.get(url, {
        headers: {
          Accept: "application/json",
          Version: "2021-07-28",
          Authorization: `Bearer ${access_token}`,
        },
      });

      const locations = resp.data?.locations || resp.data?.installedLocations || resp.data || [];
      const locArray = Array.isArray(locations) ? locations : [locations];
      const results: any[] = [];

      for (const loc of locArray) {
        const locId = loc?.id || loc?.locationId || loc?.location_id || loc?._id;
        if (!locId) continue;

        const tokenRes: any = await getLocationAccessToken(locId, {
          access_token,
          company_id: companyId,
        } as any);

        if (!tokenRes || !tokenRes.success) {
          results.push({ locationId: locId, success: false, error: tokenRes?.data || "failed to fetch" });
          continue;
        }

        const locAccessToken = tokenRes.data?.access_token;
        const locRefreshToken = tokenRes.data?.refresh_token;
        const expiresIn = tokenRes.data?.expires_in;
        const expiresAt = expiresIn
          ? new Date(Date.now() + expiresIn * 1000).toISOString()
          : new Date(Date.now() + 23 * 3600 * 1000).toISOString();

        const uType = locationId !== "" && locationId !== null ? "Location" : "Company";

        // Upsert: try update first, then insert
        const { data: existing } = await supabase
          .from("tokens")
          .select("id")
          .eq("location_id", locId)
          .eq("app_id", appId)
          .single();

        let tokenRecord;
        if (existing) {
          const { data: updated, error } = await supabase
            .from("tokens")
            .update({
              access_token: locAccessToken,
              refresh_token: locRefreshToken,
              user_type: uType,
              company_id: companyId,
              user_id: userId,
              expires_at: expiresAt,
            })
            .eq("id", existing.id)
            .select()
            .single();
          tokenRecord = updated;
          if (error) console.error("Update error:", error);
        } else {
          const { data: inserted, error } = await supabase
            .from("tokens")
            .insert({
              location_id: locId,
              app_id: appId,
              access_token: locAccessToken,
              refresh_token: locRefreshToken,
              user_type: uType,
              company_id: companyId,
              user_id: userId,
              expires_at: expiresAt,
            })
            .select()
            .single();
          tokenRecord = inserted;
          if (error) console.error("Insert error:", error);
        }

        results.push({ locationId: locId, success: true, data: tokenRecord });
      }

      return NextResponse.json({ success: true, results });
    }

    // Fallback: single location token save
    if (!locationId || !access_token) {
      return NextResponse.json(
        { error: "Missing required fields: locationId or access_token" },
        { status: 400 }
      );
    }

    const expiresAt = new Date(Date.now() + 23 * 3600 * 1000).toISOString();

    const { data: existing } = await supabase
      .from("tokens")
      .select("id")
      .eq("location_id", locationId)
      .eq("app_id", appId || "")
      .single();

    let tokenRecord;
    if (existing) {
      const { data: updated } = await supabase
        .from("tokens")
        .update({
          access_token,
          refresh_token,
          user_type: userType,
          company_id: companyId,
          user_id: userId,
          expires_at: expiresAt,
        })
        .eq("id", existing.id)
        .select()
        .single();
      tokenRecord = updated;
    } else {
      const { data: inserted } = await supabase
        .from("tokens")
        .insert({
          location_id: locationId,
          app_id: appId || "",
          access_token,
          refresh_token,
          user_type: userType,
          company_id: companyId,
          user_id: userId,
          expires_at: expiresAt,
        })
        .select()
        .single();
      tokenRecord = inserted;
    }

    if (!tokenRecord) {
      throw new Error("Failed to save token record");
    }

    return NextResponse.json({
      success: true,
      message: "Token saved successfully",
      data: tokenRecord,
    });
  } catch (error: any) {
    console.error("Error saving token:", error);
    return NextResponse.json(
      { error: "Failed to save token", details: error.message },
      { status: 500 }
    );
  }
}
