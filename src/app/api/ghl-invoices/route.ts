import { NextRequest, NextResponse } from 'next/server';

const GHL_API = 'https://services.leadconnectorhq.com';

// Get access token: try header first, then Supabase token store, then env var
async function getAccessToken(req: NextRequest, locationId: string | null): Promise<string> {
  // 1. Check Authorization header (from client passing SSO token)
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }

  // 2. Try to get from Supabase token store (the existing token.ts system)
  if (locationId) {
    try {
      const { getToken } = await import('@/lib/token');
      const tokenResult = await getToken(locationId);
      if (tokenResult && 'access_token' in tokenResult && tokenResult.access_token) {
        return tokenResult.access_token;
      }
    } catch (e) {
      // token.ts may not be available or Supabase not configured
      console.log('Could not get token from Supabase:', (e as any)?.message);
    }
  }

  // 3. Fallback to env var
  return process.env.GHL_ACCESS_TOKEN || '';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get('locationId');
  const contactId = searchParams.get('contactId');
  const invoiceId = searchParams.get('invoiceId');
  const token = await getAccessToken(req, locationId);

  if (!token) {
    return NextResponse.json({ 
      error: 'No GHL access token available. Ensure your app is installed in GHL and the OAuth token is stored in Supabase, or set GHL_ACCESS_TOKEN env var.',
      help: 'Go to Vercel > Settings > Environment Variables and add GHL_ACCESS_TOKEN with your GoHighLevel access token.'
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
      return NextResponse.json({ error: 'locationId is required' }, { status: 400 });
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
    const { action, invoiceId, ...invoiceData } = body;

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

    const res = await fetch(`${GHL_API}/invoices/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData),
    });
    const data = await res.json();
    return NextResponse.json(data);
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
    return NextResponse.json({ error: err?.message || 'Failed to update invoice' }, { status: 500 });
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
    return NextResponse.json({ error: err?.message || 'Failed to delete invoice' }, { status: 500 });
  }
}
