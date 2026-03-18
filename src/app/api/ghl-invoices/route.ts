import { NextRequest, NextResponse } from 'next/server';

const GHL_API = 'https://services.leadconnectorhq.com';

async function getAccessToken(req: NextRequest, locationId: string | null): Promise<{ token: string; method: string }> {
  // 1. Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 20) {
    return { token: authHeader.replace('Bearer ', ''), method: 'header' };
  }

  // 2. Supabase token store
  if (locationId) {
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();
      
      const { data: rows, error } = await supabase
        .from('tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('location_id', locationId)
        .limit(1);
      
      if (error) {
        console.error('Supabase query error:', error.message);
      } else if (rows && rows.length > 0 && rows[0].access_token) {
        console.log(`Found token for location ${locationId} (expires: ${rows[0].expires_at})`);
        return { token: rows[0].access_token, method: 'supabase' };
      } else {
        console.log(`No token found in Supabase for location: ${locationId}`);
      }
    } catch (e: any) {
      console.error('Supabase token fetch error:', e?.message);
    }
  }

  // 3. Env var fallback
  const envToken = process.env.GHL_ACCESS_TOKEN || '';
  if (envToken) return { token: envToken, method: 'env' };

  return { token: '', method: 'none' };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get('locationId');
  const contactId = searchParams.get('contactId');
  const invoiceId = searchParams.get('invoiceId');
  
  const { token, method } = await getAccessToken(req, locationId);
  console.log(`Invoice GET: locationId=${locationId}, token method=${method}, has token=${!!token}`);

  if (!token) {
    return NextResponse.json({ 
      error: 'No GHL access token available.',
      locationId: locationId || 'not provided',
      tokenMethod: method,
      help: 'Ensure the app is installed in GHL and the OAuth token is stored in the Supabase tokens table. Or set GHL_ACCESS_TOKEN env var in Vercel.'
    }, { status: 401 });
  }

  try {
    if (invoiceId) {
      const res = await fetch(`${GHL_API}/invoices/${invoiceId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
      });
      return NextResponse.json(await res.json());
    }

    if (!locationId) {
      return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
    }

    let url = `${GHL_API}/invoices/?altId=${locationId}&altType=location&limit=50`;
    if (contactId) url += `&contactId=${contactId}`;
    
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    const data = await res.json();
    console.log(`Invoice list response: status=${res.status}, invoices=${(data.invoices || []).length}`);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Invoice GET error:', err?.message);
    return NextResponse.json({ error: err?.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const locationId = body.altId || body.locationId || null;
  const { token, method } = await getAccessToken(req, locationId);
  console.log(`Invoice POST: locationId=${locationId}, action=${body.action || 'create'}, token method=${method}`);
  
  if (!token) {
    return NextResponse.json({ error: 'No GHL access token available.', tokenMethod: method }, { status: 401 });
  }

  try {
    const { action, invoiceId, locationId: _lid, ...invoiceData } = body;

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
    console.log('Creating invoice with data:', JSON.stringify(invoiceData).substring(0, 200));
    const res = await fetch(`${GHL_API}/invoices/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    });
    const data = await res.json();
    console.log(`Create invoice response: status=${res.status}`, JSON.stringify(data).substring(0, 200));
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Invoice POST error:', err?.message);
    return NextResponse.json({ error: err?.message || 'Failed to create invoice' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { invoiceId, ...updateData } = body;
  const { token } = await getAccessToken(req, updateData.altId || null);
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
  const { token } = await getAccessToken(req, null);
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
