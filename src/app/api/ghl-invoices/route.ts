import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GHL_API = 'https://services.leadconnectorhq.com';

async function getAccessToken(req: NextRequest, locationId: string | null): Promise<string> {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 20) return authHeader.replace('Bearer ', '');
  if (locationId) {
    try {
      const { data: rows } = await supabase.from('tokens').select('access_token').eq('location_id', locationId).limit(1);
      if (rows?.[0]?.access_token) return rows[0].access_token;
    } catch {}
  }
  try {
    const { data: rows } = await supabase.from('tokens').select('access_token').order('expires_at', { ascending: false }).limit(1);
    if (rows?.[0]?.access_token) return rows[0].access_token;
  } catch {}
  return process.env.GHL_ACCESS_TOKEN || '';
}

async function getLocationId(req: NextRequest, body?: any): Promise<string> {
  const fromUrl = new URL(req.url).searchParams.get('locationId');
  if (fromUrl) return fromUrl;
  if (body?.altId) return body.altId;
  if (body?.locationId) return body.locationId;
  try {
    const { data: rows } = await supabase.from('tokens').select('location_id').limit(1);
    if (rows?.[0]?.location_id) return rows[0].location_id;
  } catch {}
  return '';
}

async function generateInvoiceNumber(token: string, locationId: string): Promise<string> {
  try {
    const res = await fetch(`${GHL_API}/invoices/generate-invoice-number?altId=${locationId}&altType=location`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    const data = await res.json();
    return data.invoiceNumber || String(Date.now()).slice(-6);
  } catch { return String(Date.now()).slice(-6); }
}

export async function GET(req: NextRequest) {
  const locationId = await getLocationId(req);
  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get('contactId');
  const invoiceId = searchParams.get('invoiceId');
  const token = await getAccessToken(req, locationId);
  if (!token) return NextResponse.json({ error: 'No GHL access token found.' }, { status: 401 });

  try {
    if (invoiceId) {
      const res = await fetch(`${GHL_API}/invoices/${invoiceId}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
      });
      return NextResponse.json(await res.json());
    }
    if (!locationId) return NextResponse.json({ error: 'locationId is required' }, { status: 400 });

    // GHL requires offset parameter
    let url = `${GHL_API}/invoices/?altId=${locationId}&altType=location&limit=50&offset=0`;
    if (contactId) url += `&contactId=${contactId}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    return NextResponse.json(await res.json());
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const locationId = body.altId || body.locationId || await getLocationId(req, body);
  const token = await getAccessToken(req, locationId);
  if (!token) return NextResponse.json({ error: 'No GHL access token' }, { status: 401 });

  try {
    const { action, invoiceId } = body;

    if (action === 'send' && invoiceId) {
      const res = await fetch(`${GHL_API}/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      return NextResponse.json(await res.json());
    }

    if (action === 'record-payment' && invoiceId) {
      const { action: _a, invoiceId: _i, locationId: _l, ...payData } = body;
      const res = await fetch(`${GHL_API}/invoices/${invoiceId}/record-payment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
        body: JSON.stringify(payData),
      });
      return NextResponse.json(await res.json());
    }

    // CREATE INVOICE - GHL exact schema
    const invoiceNumber = await generateInvoiceNumber(token, locationId);
    const today = new Date().toISOString().split('T')[0];

    // GHL uses "items" NOT "invoiceItems"
    const items = (body.invoiceItems || body.items || []).map((item: any, i: number) => ({
      _id: `item_${Date.now()}_${i}`,
      name: item.name || 'Item',
      description: item.description || '',
      currency: body.currency || 'USD',
      amount: item.amount || 0,
      qty: item.qty || 1,
      taxes: [],
    }));

    const total = items.reduce((s: number, item: any) => s + (item.amount * item.qty), 0);

    // businessDetails.address must be an OBJECT not a string
    const addressStr = body.businessDetails?.address || '';
    const businessAddress = typeof addressStr === 'string' ? {
      countryCode: 'US',
      addressLine1: addressStr || '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
    } : addressStr;

    // contactDetails is REQUIRED
    const contactDetails = body.contactDetails || {
      id: body.contactId || '',
      name: body.contactName || '',
      email: body.contactEmail || '',
      phoneNo: body.contactPhone || '',
      companyName: '',
      address: {
        countryCode: 'US',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
      },
      additionalEmails: [],
      customFields: [],
    };

    const ghlPayload = {
      altId: locationId,
      altType: 'location',
      name: body.name || 'Invoice',
      title: 'INVOICE',
      currency: body.currency || 'USD',
      invoiceNumber: String(invoiceNumber),
      issueDate: today,
      dueDate: body.dueDate || today,
      // GHL expects "items" not "invoiceItems"
      items: items,
      total: total,
      amountDue: total,
      contactDetails: contactDetails,
      businessDetails: {
        name: body.businessDetails?.name || '',
        address: businessAddress,
        phoneNo: body.businessDetails?.phone || body.businessDetails?.phoneNo || '',
        website: body.businessDetails?.website || '',
        logoUrl: body.businessDetails?.logoUrl || '',
        customValues: [],
      },
      discount: { type: 'fixed', value: 0 },
      termsNotes: body.termsNotes || '',
      totalSummary: { subTotal: total, discount: 0 },
    };

    console.log('[ghl-invoices] Creating:', JSON.stringify(ghlPayload).substring(0, 1000));

    const res = await fetch(`${GHL_API}/invoices/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify(ghlPayload),
    });

    const responseText = await res.text();
    console.log('[ghl-invoices] Response:', res.status, responseText.substring(0, 500));

    let data;
    try { data = JSON.parse(responseText); } catch { data = { raw: responseText }; }

    if (!res.ok) {
      return NextResponse.json({ error: `GHL API ${res.status}`, details: data, sentPayload: ghlPayload }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { invoiceId, ...updateData } = body;
  const token = await getAccessToken(req, updateData.altId || null);
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });
  if (!invoiceId) return NextResponse.json({ error: 'invoiceId required' }, { status: 400 });
  const res = await fetch(`${GHL_API}/invoices/${invoiceId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  return NextResponse.json(await res.json());
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const token = await getAccessToken(req, null);
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });
  if (!body.invoiceId) return NextResponse.json({ error: 'invoiceId required' }, { status: 400 });
  const res = await fetch(`${GHL_API}/invoices/${body.invoiceId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
  });
  return NextResponse.json(await res.json());
}
