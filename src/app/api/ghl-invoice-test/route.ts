import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GHL_API = 'https://services.leadconnectorhq.com';

export async function GET(req: NextRequest) {
  const results: Record<string, any> = { timestamp: new Date().toISOString() };

  // 1. Get token from Supabase
  try {
    const { data: rows, error } = await supabase.from('tokens').select('access_token, location_id').order('expires_at', { ascending: false }).limit(1);
    if (error) { results.tokenError = error.message; return NextResponse.json(results); }
    if (!rows || rows.length === 0) { results.tokenError = 'No tokens in Supabase'; return NextResponse.json(results); }
    const token = rows[0].access_token;
    const locationId = rows[0].location_id;
    results.locationId = locationId;
    results.tokenPrefix = token.substring(0, 20) + '...';

    // 2. Test: List invoices (GET)
    const listRes = await fetch(`${GHL_API}/invoices/?altId=${locationId}&altType=location&limit=5`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    const listText = await listRes.text();
    results.listInvoices = { status: listRes.status, body: listText.substring(0, 1000) };

    // 3. Test: Generate invoice number
    const numRes = await fetch(`${GHL_API}/invoices/generate-invoice-number?altId=${locationId}&altType=location`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    const numText = await numRes.text();
    results.generateNumber = { status: numRes.status, body: numText.substring(0, 500) };

    // 4. Test: Create a minimal invoice
    const testPayload = {
      altId: locationId,
      altType: 'location',
      name: 'Test Invoice',
      title: 'INVOICE',
      currency: 'USD',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      invoiceItems: [
        {
          _id: 'test_item_1',
          name: 'Test Item',
          currency: 'USD',
          amount: 10000,
          qty: 1,
          taxes: [],
        }
      ],
      total: 10000,
      amountDue: 10000,
      discount: { type: 'fixed', value: 0 },
      totalSummary: { subTotal: 10000, discount: 0 },
      businessDetails: {
        name: 'Test Business',
        address: '123 Test St',
        phoneNo: '+1234567890',
        website: '',
        logoUrl: '',
        customValues: [],
      },
      termsNotes: 'Test invoice',
    };

    results.createPayload = testPayload;

    const createRes = await fetch(`${GHL_API}/invoices/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });
    const createText = await createRes.text();
    results.createInvoice = { status: createRes.status, body: createText.substring(0, 1000) };

    return NextResponse.json(results);
  } catch (err: any) {
    results.error = err?.message || 'Unknown error';
    return NextResponse.json(results);
  }
}
