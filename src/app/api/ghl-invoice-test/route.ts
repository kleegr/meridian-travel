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

    // 1. List invoices
    const listRes = await fetch(`${GHL_API}/invoices/?altId=${locationId}&altType=location&limit=5&offset=0`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    const listData = await listRes.json();
    results.listInvoices = { status: listRes.status, count: listData.invoices?.length || 0 };

    // 2. Get a real contactId from existing invoices or search contacts
    let contactId = '';
    let contactName = '';
    let contactEmail = '';
    let contactPhone = '';
    if (listData.invoices?.length > 0 && listData.invoices[0].contactDetails?.id) {
      const cd = listData.invoices[0].contactDetails;
      contactId = cd.id;
      contactName = cd.name || 'Client';
      contactEmail = cd.email || '';
      contactPhone = cd.phoneNo || '';
      results.contactSource = 'from existing invoice';
    } else {
      // Search for any contact in this location
      const searchRes = await fetch(`${GHL_API}/contacts/?locationId=${locationId}&limit=1`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
      });
      const searchData = await searchRes.json();
      if (searchData.contacts?.length > 0) {
        const c = searchData.contacts[0];
        contactId = c.id;
        contactName = [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Client';
        contactEmail = c.email || '';
        contactPhone = c.phone || '';
        results.contactSource = 'from contacts search';
      }
    }
    results.contactId = contactId;
    results.contactName = contactName;

    if (!contactId) {
      results.error = 'No contacts found in this location. Create a contact in GHL first.';
      return NextResponse.json(results);
    }

    // 3. Generate invoice number
    const numRes = await fetch(`${GHL_API}/invoices/generate-invoice-number?altId=${locationId}&altType=location`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    const numData = await numRes.json();
    results.invoiceNumber = numData.invoiceNumber;

    // 4. Create invoice with REAL contactId
    const testPayload = {
      altId: locationId,
      altType: 'location',
      name: 'Test Invoice from Meridian Travel',
      title: 'INVOICE',
      currency: 'USD',
      invoiceNumber: numData.invoiceNumber || '999999',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      items: [
        {
          _id: `item_${Date.now()}_0`,
          name: 'Test Travel Package',
          description: 'Test invoice item',
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
        id: contactId,
        name: contactName,
        email: contactEmail,
        phoneNo: contactPhone,
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
      },
      businessDetails: {
        name: 'Kleegr Travel',
        address: {
          countryCode: 'US',
          addressLine1: '3 College Road',
          addressLine2: '',
          city: 'Monsey',
          state: 'NY',
          postalCode: '10952',
        },
        phoneNo: '+18457099909',
        website: '',
        logoUrl: '',
        customValues: [],
      },
      termsNotes: 'Test invoice from Meridian Travel CRM',
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
