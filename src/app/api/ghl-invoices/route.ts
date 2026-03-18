import { NextRequest, NextResponse } from 'next/server';

// GHL Invoice API proxy
// Docs: https://marketplace.gohighlevel.com/docs/ghl/invoices/invoice-api
const GHL_API = 'https://services.leadconnectorhq.com';

// Get OAuth token - in production this comes from SSO
// For now we support both SSO token passed from client and env var fallback
function getToken(req: NextRequest): string {
  const authHeader = req.headers.get('authorization');
  if (authHeader) return authHeader.replace('Bearer ', '');
  return process.env.GHL_ACCESS_TOKEN || '';
}

// LIST invoices for a location (optionally filtered by contactId)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get('locationId');
  const contactId = searchParams.get('contactId');
  const invoiceId = searchParams.get('invoiceId');
  const token = getToken(req);

  if (!token) {
    return NextResponse.json({ error: 'No GHL access token. Configure GHL_ACCESS_TOKEN or pass via SSO.' }, { status: 401 });
  }

  try {
    // Get single invoice
    if (invoiceId) {
      const res = await fetch(`${GHL_API}/invoices/${invoiceId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    // List invoices for location
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

// CREATE invoice
export async function POST(req: NextRequest) {
  const token = getToken(req);
  if (!token) {
    return NextResponse.json({ error: 'No GHL access token' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, invoiceId, ...invoiceData } = body;

    // Send invoice
    if (action === 'send' && invoiceId) {
      const res = await fetch(`${GHL_API}/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    // Record manual payment
    if (action === 'record-payment' && invoiceId) {
      const res = await fetch(`${GHL_API}/invoices/${invoiceId}/record-payment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData),
      });
      const data = await res.json();
      return NextResponse.json(data);
    }

    // Create new invoice
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

// UPDATE invoice
export async function PUT(req: NextRequest) {
  const token = getToken(req);
  if (!token) {
    return NextResponse.json({ error: 'No GHL access token' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { invoiceId, ...updateData } = body;
    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 });
    }

    const res = await fetch(`${GHL_API}/invoices/${invoiceId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update invoice' }, { status: 500 });
  }
}

// DELETE invoice
export async function DELETE(req: NextRequest) {
  const token = getToken(req);
  if (!token) {
    return NextResponse.json({ error: 'No GHL access token' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { invoiceId } = body;
    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 });
    }

    const res = await fetch(`${GHL_API}/invoices/${invoiceId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete invoice' }, { status: 500 });
  }
}
