import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GHL_API = 'https://services.leadconnectorhq.com';

function objectId(): string {
  const ts = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const rnd = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return ts + rnd;
}

async function getAccessToken(req: NextRequest, locationId: string | null): Promise<string> {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ') && authHeader.length > 20) return authHeader.replace('Bearer ', '');
  if (locationId) {
    try { const { data: rows } = await supabase.from('tokens').select('access_token').eq('location_id', locationId).limit(1); if (rows?.[0]?.access_token) return rows[0].access_token; } catch {}
  }
  try { const { data: rows } = await supabase.from('tokens').select('access_token').order('expires_at', { ascending: false }).limit(1); if (rows?.[0]?.access_token) return rows[0].access_token; } catch {}
  return process.env.GHL_ACCESS_TOKEN || '';
}

async function getLocationId(req: NextRequest, body?: any): Promise<string> {
  const fromUrl = new URL(req.url).searchParams.get('locationId');
  if (fromUrl) return fromUrl;
  if (body?.altId) return body.altId;
  if (body?.locationId) return body.locationId;
  try { const { data: rows } = await supabase.from('tokens').select('location_id').limit(1); if (rows?.[0]?.location_id) return rows[0].location_id; } catch {}
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

async function findContactId(token: string, locationId: string, name?: string, email?: string, phone?: string): Promise<{id: string; name: string; email: string; phoneNo: string}> {
  if (email) {
    try { const res = await fetch(`${GHL_API}/contacts/?locationId=${locationId}&query=${encodeURIComponent(email)}&limit=1`, { headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' } }); const data = await res.json(); if (data.contacts?.length > 0) { const c = data.contacts[0]; return { id: c.id, name: [c.firstName, c.lastName].filter(Boolean).join(' ') || name || '', email: c.email || email, phoneNo: c.phone || phone || '' }; } } catch {}
  }
  if (name) {
    try { const res = await fetch(`${GHL_API}/contacts/?locationId=${locationId}&query=${encodeURIComponent(name)}&limit=1`, { headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' } }); const data = await res.json(); if (data.contacts?.length > 0) { const c = data.contacts[0]; return { id: c.id, name: [c.firstName, c.lastName].filter(Boolean).join(' ') || name, email: c.email || email || '', phoneNo: c.phone || phone || '' }; } } catch {}
  }
  try { const res = await fetch(`${GHL_API}/contacts/?locationId=${locationId}&limit=1`, { headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' } }); const data = await res.json(); if (data.contacts?.length > 0) { const c = data.contacts[0]; return { id: c.id, name: [c.firstName, c.lastName].filter(Boolean).join(' '), email: c.email || '', phoneNo: c.phone || '' }; } } catch {}
  return { id: '', name: name || '', email: email || '', phoneNo: phone || '' };
}

// Check if location has a payment processor configured
async function checkPaymentProcessor(token: string, locationId: string): Promise<{configured: boolean; error?: string}> {
  try {
    // Try to get invoice settings which indicate payment config
    const res = await fetch(`${GHL_API}/invoices/settings?altId=${locationId}&altType=location`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      // If we can read settings, processor is likely configured
      return { configured: true };
    }
    return { configured: false, error: 'Could not verify payment processor configuration' };
  } catch {
    return { configured: false, error: 'Payment settings check failed' };
  }
}

export async function GET(req: NextRequest) {
  const locationId = await getLocationId(req);
  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get('contactId');
  const invoiceId = searchParams.get('invoiceId');
  const token = await getAccessToken(req, locationId);
  if (!token) return NextResponse.json({ error: 'No access token found. Please reconnect your account.' }, { status: 401 });
  try {
    if (invoiceId) {
      const res = await fetch(`${GHL_API}/invoices/${invoiceId}`, { headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' } });
      return NextResponse.json(await res.json());
    }
    if (!locationId) return NextResponse.json({ error: 'Location ID required' }, { status: 400 });
    let url = `${GHL_API}/invoices/?altId=${locationId}&altType=location&limit=50&offset=0`;
    if (contactId) url += `&contactId=${contactId}`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' } });
    return NextResponse.json(await res.json());
  } catch (err: any) { return NextResponse.json({ error: err?.message || 'Failed to load invoices' }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const locationId = body.altId || body.locationId || await getLocationId(req, body);
  const token = await getAccessToken(req, locationId);
  if (!token) return NextResponse.json({ error: 'No access token found. Please reconnect your account.' }, { status: 401 });

  try {
    const { action, invoiceId } = body;

    // SEND INVOICE
    if (action === 'send' && invoiceId) {
      // First update the invoice to liveMode
      const updateRes = await fetch(`${GHL_API}/invoices/${invoiceId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({ liveMode: true }),
      });
      const updateText = await updateRes.text();
      console.log(`[invoices] liveMode update: ${updateRes.status}`);

      // Send the invoice
      const res = await fetch(`${GHL_API}/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
        body: JSON.stringify({ altId: locationId, altType: 'location' }),
      });
      const text = await res.text();
      console.log(`[invoices] send: ${res.status} ${text.substring(0, 300)}`);
      let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }

      if (!res.ok) {
        // Provide specific, actionable error messages
        const status = res.status;
        const errMsg = data?.message || data?.error?.[0] || data?.error || '';
        let userMessage = `Send failed (${status})`;

        if (status === 422) {
          if (typeof errMsg === 'string' && errMsg.toLowerCase().includes('payment')) {
            userMessage = 'No payment processor configured. Go to Payments > Integrations in your account and connect Stripe or another payment provider, then try again.';
          } else if (typeof errMsg === 'string' && errMsg.toLowerCase().includes('email')) {
            userMessage = 'The contact does not have a valid email address. Update the contact\'s email and try again.';
          } else {
            userMessage = `Could not send invoice. Error: ${typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)}. This may be because no payment processor is configured — check Payments > Integrations.`;
          }
        } else if (status === 400) {
          userMessage = `Invalid request: ${typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)}`;
        } else if (status === 401) {
          userMessage = 'Authentication failed. Your access token may have expired. Please reconnect your account.';
        }

        return NextResponse.json({ error: userMessage, details: data, status }, { status });
      }
      return NextResponse.json({ success: true, ...data });
    }

    // RECORD PAYMENT
    if (action === 'record-payment' && invoiceId) {
      const { action: _a, invoiceId: _i, locationId: _l, altId: _alt, ...payData } = body;
      const res = await fetch(`${GHL_API}/invoices/${invoiceId}/record-payment`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
        body: JSON.stringify(payData),
      });
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
      if (!res.ok) {
        const errMsg = data?.message || data?.error || 'Unknown error';
        return NextResponse.json({ error: `Payment recording failed: ${typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)}`, details: data }, { status: res.status });
      }
      return NextResponse.json({ success: true, ...data });
    }

    // CREATE INVOICE
    const invoiceNumber = await generateInvoiceNumber(token, locationId);
    const issueDate = body.issueDate || new Date().toISOString().split('T')[0];
    const contact = await findContactId(token, locationId, body.contactName, body.contactEmail, body.contactPhone);
    if (!contact.id) return NextResponse.json({ error: 'Contact not found. Please ensure this client exists as a contact, or create a new contact first.' }, { status: 400 });

    const items = (body.invoiceItems || body.items || []).map((item: any) => ({
      _id: objectId(),
      name: item.name || 'Item',
      description: item.description || '',
      currency: body.currency || 'USD',
      amount: item.amount || 0,
      qty: item.qty || 1,
      taxes: [],
    }));
    const total = items.reduce((s: number, item: any) => s + (item.amount * item.qty), 0);

    const addressStr = body.businessDetails?.address || '';
    const businessAddress = typeof addressStr === 'string' ? { countryCode: 'US', addressLine1: addressStr, addressLine2: '', city: '', state: '', postalCode: '' } : addressStr;

    const ghlPayload = {
      altId: locationId,
      altType: 'location',
      name: body.name || 'Invoice',
      title: 'INVOICE',
      currency: body.currency || 'USD',
      invoiceNumber: String(invoiceNumber),
      issueDate: issueDate,
      dueDate: body.dueDate || issueDate,
      items,
      total,
      amountDue: total,
      liveMode: true,
      contactDetails: {
        id: contact.id, name: contact.name, email: contact.email, phoneNo: contact.phoneNo,
        companyName: '', address: { countryCode: 'US', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '' },
        additionalEmails: [], customFields: [],
      },
      businessDetails: {
        name: body.businessDetails?.name || '',
        address: businessAddress,
        phoneNo: body.businessDetails?.phone || body.businessDetails?.phoneNo || '',
        website: '', logoUrl: body.businessDetails?.logoUrl || '', customValues: [],
      },
      discount: { type: 'fixed', value: 0 },
      termsNotes: body.termsNotes || '',
      totalSummary: { subTotal: total, discount: 0 },
    };

    const res = await fetch(`${GHL_API}/invoices/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify(ghlPayload),
    });
    const responseText = await res.text();
    let data; try { data = JSON.parse(responseText); } catch { data = { raw: responseText }; }
    if (!res.ok) {
      const errMsg = data?.message || data?.error?.[0] || 'Creation failed';
      return NextResponse.json({ error: `Invoice creation failed: ${typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)}`, details: data, contactUsed: contact }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err: any) { return NextResponse.json({ error: err?.message || 'An unexpected error occurred' }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  const body = await req.json(); const { invoiceId, ...updateData } = body;
  const token = await getAccessToken(req, updateData.altId || null);
  if (!token) return NextResponse.json({ error: 'No access token' }, { status: 401 });
  if (!invoiceId) return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
  const res = await fetch(`${GHL_API}/invoices/${invoiceId}`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' }, body: JSON.stringify(updateData) });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) return NextResponse.json({ error: `Update failed: ${data?.message || res.status}`, details: data }, { status: res.status });
  return NextResponse.json({ success: true, ...data });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json(); const token = await getAccessToken(req, null);
  if (!token) return NextResponse.json({ error: 'No access token' }, { status: 401 });
  if (!body.invoiceId) return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
  const res = await fetch(`${GHL_API}/invoices/${body.invoiceId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' } });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) return NextResponse.json({ error: `Delete failed: ${data?.message || res.status}` }, { status: res.status });
  return NextResponse.json({ success: true, ...data });
}
