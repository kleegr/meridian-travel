import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GHL_API = 'https://services.leadconnectorhq.com';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const invoiceId = searchParams.get('invoiceId');
  const results: Record<string, any> = { timestamp: new Date().toISOString() };

  try {
    const { data: rows } = await supabase.from('tokens').select('access_token, location_id').order('expires_at', { ascending: false }).limit(1);
    if (!rows?.length) { results.error = 'No tokens'; return NextResponse.json(results); }
    const token = rows[0].access_token;
    const locationId = rows[0].location_id;
    results.locationId = locationId;

    // Test send invoice
    if (action === 'send' && invoiceId) {
      // Try different payload formats for send
      const payloads = [
        { label: 'empty body', body: {} },
        { label: 'with userId', body: { userId: '' } },
        { label: 'with altId', body: { altId: locationId, altType: 'location' } },
      ];
      for (const p of payloads) {
        const res = await fetch(`${GHL_API}/invoices/${invoiceId}/send`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
          body: JSON.stringify(p.body),
        });
        const text = await res.text();
        results[`send_${p.label}`] = { status: res.status, body: text.substring(0, 500) };
        if (res.ok) break;
      }
      return NextResponse.json(results);
    }

    // Test record payment
    if (action === 'payment' && invoiceId) {
      const payloads = [
        { label: 'with amount+mode', body: { amount: 100, mode: 'cash', notes: 'test' } },
        { label: 'with altId', body: { altId: locationId, altType: 'location', amount: 100, mode: 'cash' } },
      ];
      for (const p of payloads) {
        const res = await fetch(`${GHL_API}/invoices/${invoiceId}/record-payment`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
          body: JSON.stringify(p.body),
        });
        const text = await res.text();
        results[`payment_${p.label}`] = { status: res.status, body: text.substring(0, 500) };
        if (res.ok) break;
      }
      return NextResponse.json(results);
    }

    // Default: list invoices and show their IDs for testing
    const listRes = await fetch(`${GHL_API}/invoices/?altId=${locationId}&altType=location&limit=5&offset=0`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    const listData = await listRes.json();
    results.invoices = (listData.invoices || []).map((inv: any) => ({
      _id: inv._id,
      name: inv.name,
      status: inv.status,
      total: inv.total,
      invoiceNumber: inv.invoiceNumber,
    }));
    results.hint = 'Use ?action=send&invoiceId=ID or ?action=payment&invoiceId=ID to test';

    return NextResponse.json(results);
  } catch (err: any) {
    results.error = err?.message;
    return NextResponse.json(results);
  }
}
