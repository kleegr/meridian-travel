import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GHL_API = 'https://services.leadconnectorhq.com';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let locationId = searchParams.get('locationId');

  // Get token
  let token = '';
  if (locationId) {
    try {
      const { data: rows } = await supabase.from('tokens').select('access_token').eq('location_id', locationId).limit(1);
      if (rows?.[0]?.access_token) token = rows[0].access_token;
    } catch {}
  }
  if (!token) {
    try {
      const { data: rows } = await supabase.from('tokens').select('access_token, location_id').order('expires_at', { ascending: false }).limit(1);
      if (rows?.[0]) { token = rows[0].access_token; if (!locationId) locationId = rows[0].location_id; }
    } catch {}
  }
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });
  if (!locationId) return NextResponse.json({ error: 'No locationId' }, { status: 400 });

  try {
    // Get location/business details from GHL
    const res = await fetch(`${GHL_API}/locations/${locationId}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: `GHL ${res.status}`, details: data }, { status: res.status });

    // Extract relevant business info
    const loc = data.location || data;
    return NextResponse.json({
      success: true,
      business: {
        name: loc.name || loc.businessName || '',
        email: loc.email || '',
        phone: loc.phone || '',
        address: loc.address || '',
        city: loc.city || '',
        state: loc.state || '',
        postalCode: loc.postalCode || loc.zipCode || '',
        country: loc.country || 'US',
        website: loc.website || '',
        logoUrl: loc.logoUrl || loc.business?.logoUrl || '',
        timezone: loc.timezone || '',
        currency: loc.currency || 'USD',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}
