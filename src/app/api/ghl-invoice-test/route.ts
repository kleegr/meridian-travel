import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GHL_API = 'https://services.leadconnectorhq.com';

export async function GET(req: NextRequest) {
  const results: Record<string, any> = { timestamp: new Date().toISOString() };

  try {
    const { data: rows, error } = await supabase.from('tokens').select('access_token, location_id').order('expires_at', { ascending: false }).limit(1);
    if (error || !rows?.length) { results.tokenError = error?.message || 'No tokens'; return NextResponse.json(results); }
    const token = rows[0].access_token;
    const locationId = rows[0].location_id;
    results.locationId = locationId;
    results.tokenPrefix = token.substring(0, 20) + '...';

    // 1. List invoices with offset=0 (required!)
    const listRes = await fetch(`${GHL_API}/invoices/?altId=${locationId}&altType=location&limit=5&offset=0`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    results.listInvoices = { status: listRes.status, body: (await listRes.text()).substring(0, 1000) };

    // 2. Generate invoice number
    const numRes = await fetch(`${GHL_API}/invoices/generate-invoice-number?altId=${locationId}&altType=location`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    const numData = await numRes.json();
    results.generateNumber = { status: numRes.status, invoiceNumber: numData.invoiceNumber };

    // 3. Create invoice with CORRECT schema:
    //    - "items" not "invoiceItems"
    //    - businessDetails.address must be OBJECT not string
    //    - contactDetails is REQUIRED
    const testPayload = {
      altId: locationId,
      altType: 'location',
      name: 'Test Invoice',
      title: 'INVOICE',
      currency: 'USD',
      invoiceNumber: numData.invoiceNumber || '999999',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      items: [
        {
          _id: 'test_item_1',
          name: 'Test Travel Package',
          description: 'Test item',
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
      contactDetails: {
        id: '',
        name: 'Test Client',
        email: 'test@example.com',
        phoneNo: '+1234567890',
        companyName: '',
        address: {
          countryCode: 'US',
          addressLine1: '123 Test St',
          addressLine2: '',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
        },
        additionalEmails: [],
        customFields: [],
      },
      businessDetails: {
        name: 'Kleegr Travel',
        address: {
          countryCode: 'US',
          addressLine1: '456 Business Ave',
          addressLine2: '',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
        },
        phoneNo: '+18005551234',
        website: '',
        logoUrl: '',
        customValues: [],
      },
      termsNotes: 'Test invoice from Meridian Travel',
    };

    results.createPayload = testPayload;

    const createRes = await fetch(`${GHL_API}/invoices/`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    });
    const createText = await createRes.text();
    results.createInvoice = { status: createRes.status, body: createText.substring(0, 1500) };

    return NextResponse.json(results);
  } catch (err: any) {
    results.error = err?.message || 'Unknown error';
    return NextResponse.json(results);
  }
}
