/* eslint-disable */
import axios from "axios";
import qs from "qs";
import { supabase } from "./supabase";
import { searchContacts } from "../lib/ghl";

interface GHLAuth {
  access_token: string;
  refresh_token: string;
  locationId?: string;
  company_id?: string;
}

interface RefreshKeys {
  client_id: string;
  client_secret: string;
}

interface RefreshData {
  refresh_token?: string;
}

export interface TokenRecord {
  id: string;
  location_id: string;
  app_id: string;
  access_token: string;
  refresh_token: string | null;
  user_type: string | null;
  company_id: string | null;
  user_id: string | null;
  expires_at: string | null;
}

export const getRefreshAgencyToken = async (data: RefreshData, keys: RefreshKeys) => {
  const options = {
    method: "POST",
    url: "https://services.leadconnectorhq.com/oauth/token",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    data: qs.stringify({
      client_id: keys?.client_id,
      client_secret: keys?.client_secret,
      grant_type: "refresh_token",
      refresh_token: data?.refresh_token,
    }),
  };

  const result = await axios
    .request(options)
    .then(function (response) {
      return { success: true, status: 200, data: response.data };
    })
    .catch(function (error) {
      return { success: false, status: 400, data: error };
    });

  return result;
};

export const getLocationAccessToken = async (locationId: string, ghl: GHLAuth) => {
  const encodedParams = new URLSearchParams();
  if (!ghl?.company_id) {
    throw new Error("Missing company_id in GHLAuth");
  }
  encodedParams.set("companyId", ghl.company_id);
  encodedParams.set("locationId", locationId);

  const options = {
    method: "POST",
    url: "https://services.leadconnectorhq.com/oauth/locationToken",
    headers: {
      Version: "2021-07-28",
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Bearer ${ghl?.access_token}`,
    },
    data: encodedParams,
  };

  const token = await axios
    .request(options)
    .then(function (response) {
      return { status: 200, success: true, data: response.data };
    })
    .catch(function (error) {
      console.error(error.response ? error.response.data : error.message);
      return {
        success: false,
        status: error.response ? error.response.status : 500,
        data: error.response ? error.response.data : error.message,
      };
    });

  return token;
};

// Get token for a location from Supabase, validate it, refresh if needed
export const getToken = async (locationId: string, appId?: string): Promise<TokenRecord | null | { success: false; message: string }> => {
  const client_id = process.env.GHL_CLIENT_ID || "";
  const client_secret = process.env.GHL_CLIENT_SECRET || "";

  // Fetch token from Supabase
  let query = supabase.from("tokens").select("*").eq("location_id", locationId);
  if (appId) query = query.eq("app_id", appId);

  const { data: rows, error } = await query.limit(1);
  if (error || !rows || rows.length === 0) return null;

  const tokenRecord = rows[0] as TokenRecord;

  // Validate token by trying a search
  const search_contacts = await searchContacts({
    locationId,
    access_token: tokenRecord.access_token,
  });

  if (search_contacts.success) {
    return tokenRecord;
  }

  console.log("Location token invalid — attempting refresh...");

  const refreshResult = await getRefreshAgencyToken(
    { refresh_token: tokenRecord.refresh_token || undefined },
    { client_id, client_secret }
  );

  if (!refreshResult.success) {
    console.error("Failed to refresh location token:", refreshResult.data);
    return { success: false, message: "Invalid Refresh Token" };
  }

  // Update token in Supabase
  const newExpiry = new Date(Date.now() + refreshResult.data.expires_in * 1000).toISOString();
  const { data: updated, error: updateErr } = await supabase
    .from("tokens")
    .update({
      access_token: refreshResult.data.access_token,
      refresh_token: refreshResult.data.refresh_token,
      expires_at: newExpiry,
    })
    .eq("id", tokenRecord.id)
    .select()
    .single();

  if (updateErr) {
    console.error("Failed to update token in DB:", updateErr);
    return null;
  }

  return updated as TokenRecord;
};
