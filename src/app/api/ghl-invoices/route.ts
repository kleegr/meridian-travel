import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GHL_API = 'https://services.leadconnectorhq.com';

// Get access token - tries multiple sources
async function getAccessToken(req: NextRequest, locationId: string | null): Promise<string> {
  // 1. Check Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 20) {
    return authHeader.replace('Bearer ', '');
  }

  // 2. Direct Supabase lookup (simpler than importing token.ts which has heavy deps)
  if (locationId) {
    try {
      const { data: rows, error } = await supabase
        .from('tokens')
        .select('access_token')
        .eq('location_id', locationId)
        .limit(1);
      
      if (!error && rows && rows.length > 0 && rows[0].access_token) {
        console.log(`[ghl-invoices] Got token from Supabase for location ${locationId}`);
        return rows[0].access_token;
      } else {
        console.log(`[ghl-invoices] No token in Supabase for location ${locationId}`, error?.message);
      }
    } catch (e: any) {
      console.log('[ghl-invoices] Supabase lookup error:', e?.message);
    }
  }

  // 3. Try ANY token from Supabase (if locationId not provided)
  if (!locationId) {
    try {
      const { data: rows } = await supabase
        .from('tokens')
        .select('access_token, location_id')
        .order('expires_at', { ascending: false })
        .limit(1);
      
      if (rows && rows.length > 0 && rows[0].access_token) {
        console.log(`[ghl-invoices] Using token from location ${rows[0].location_id} (no locationId provided)`);
        return rows[0].access_token;
      }
    } catch (e: any) {
      console.log('[ghl-invoices] Supabase fallback error:', e?.message);
    }
  }

  // 4. Fallback to env var
  if (process.env.GHL_ACCESS_TOKEN) {
    console.log('[ghl-invoices] Using GHL_ACCESS_TOKEN env var');
    return process.env.GHL_ACCESS_TOKEN;
  }

  return '';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get('locationId');
  const contactId = searchParams.get('contactId');
  const invoiceId = searchParams.get('invoiceId');
  const token = await getAccessToken(req, locationId);

  if (!token) {
    return NextResponse.json({ 
      error: 'No GHL access token found. The app needs to be installed in GHL with OAuth tokens stored in Supabase.',
      debug: { locationId, hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL, hasEnvToken: !!process.env.GHL_ACCESS_TOKEN }
    }, { status: 401 });
  }

  try {
    if (invoiceId) {
      const res = await fetch(`${GHL_API}/invoices/${invoiceId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    if (!locationId) {
      // Try to get locationId from tokens table
      const { data: rows } = await supabase.from('tokens').select('location_id').limit(1);
      const fallbackLoc = rows?.[0]?.location_id;
      if (!fallbackLoc) return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
      
      let url = `${GHL_API}/invoices/?altId=${fallbackLoc}&altType=location&limit=50`;
      if (contactId) url += `&contactId=${contactId}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
      });
      return NextResponse.json(await res.json());
    }

    let url = `${GHL_API}/invoices/?altId=${locationId}&altType=location&limit=50`;
    if (contactId) url += `&contactId=${contactId}`;
    
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const locationId = body.altId || body.locationId || null;
  const token = await getAccessToken(req, locationId);
  
  if (!token) {
    return NextResponse.json({ error: 'No GHL access token available.' }, { status: 401 });
  }

  try {
    const { action, invoiceId, locationId: _loc, ...invoiceData } = body;

    if (action === 'send' && invoiceId) {
      const res = await fetch(`${GHL_API}/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return NextResponse.json(await res.json());
    }

    if (action === 'record-payment' && invoiceId) {
      const res = await fetch(`${GHL_API}/invoices/${invoiceId}/record-payment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });
      return NextResponse.json(await res.json());
    }

    // Create invoice
    console.log('[ghl-invoices] Creating invoice:', JSON.stringify(invoiceData).substring(0, 500));
    const res = await fetch(`${GHL_API}/invoices/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    });
    const data = await res.json();
    console.log('[ghl-invoices] Create response:', res.status, JSON.stringify(data).substring(0, 500));
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create invoice' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { invoiceId, ...updateData } = body;
  const token = await getAccessToken(req, updateData.altId || null);
  if (!token) return NextResponse.json({ error: 'No GHL access token' }, { status: 401 });
  if (!invoiceId) return NextResponse.json({ error: 'invoiceId required' }, { status: 400 });

  try {
    const res = await fetch(`${GHL_API}/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    return NextResponse.json(await res.json());
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const token = await getAccessToken(req, null);
  if (!token) return NextResponse.json({ error: 'No GHL access token' }, { status: 401 });
  if (!body.invoiceId) return NextResponse.json({ error: 'invoiceId required' }, { status: 400 });

  try {
    const res = await fetch(`${GHL_API}/invoices/${body.invoiceId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    return NextResponse.json(await res.json());
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
