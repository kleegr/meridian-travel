import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const GHL_API = 'https://services.leadconnectorhq.com';

async function getToken(locationId: string | null): Promise<string> {
  if (locationId) {
    try { const { data } = await supabase.from('tokens').select('access_token').eq('location_id', locationId).limit(1); if (data?.[0]?.access_token) return data[0].access_token; } catch {}
  }
  try { const { data } = await supabase.from('tokens').select('access_token').order('expires_at', { ascending: false }).limit(1); if (data?.[0]?.access_token) return data[0].access_token; } catch {}
  return '';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get('locationId') || '';
  const contactId = searchParams.get('contactId') || '';
  const contactName = searchParams.get('contactName') || '';
  const token = await getToken(locationId);
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });

  try {
    // If we have a contactId, get conversations for that contact
    let realContactId = contactId;

    // If no contactId, search for the contact by name
    if (!realContactId && contactName) {
      const searchRes = await fetch(`${GHL_API}/contacts/?locationId=${locationId}&query=${encodeURIComponent(contactName)}&limit=1`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
      });
      const searchData = await searchRes.json();
      if (searchData.contacts?.length > 0) {
        realContactId = searchData.contacts[0].id;
      }
    }

    if (!realContactId) {
      return NextResponse.json({ error: 'Contact not found', conversations: [] });
    }

    // Get conversations for this contact
    const convRes = await fetch(`${GHL_API}/conversations/search?contactId=${realContactId}&locationId=${locationId}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    const convData = await convRes.json();

    if (!convRes.ok) {
      return NextResponse.json({ error: `API ${convRes.status}`, details: convData, contactId: realContactId });
    }

    // Get messages for the first/most recent conversation
    const conversations = convData.conversations || [];
    let messages: any[] = [];
    if (conversations.length > 0) {
      const convId = conversations[0].id;
      const msgRes = await fetch(`${GHL_API}/conversations/${convId}/messages?limit=30`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
      });
      const msgData = await msgRes.json();
      messages = msgData.messages?.message || msgData.messages || [];
    }

    return NextResponse.json({
      success: true,
      contactId: realContactId,
      conversations,
      messages,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}

// Send a message
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { locationId, contactId, contactName, message, type } = body;
  const token = await getToken(locationId);
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 });

  try {
    let realContactId = contactId;
    if (!realContactId && contactName) {
      const searchRes = await fetch(`${GHL_API}/contacts/?locationId=${locationId}&query=${encodeURIComponent(contactName)}&limit=1`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
      });
      const data = await searchRes.json();
      if (data.contacts?.length > 0) realContactId = data.contacts[0].id;
    }
    if (!realContactId) return NextResponse.json({ error: 'Contact not found' }, { status: 404 });

    // Send message via GHL
    const res = await fetch(`${GHL_API}/conversations/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: type || 'SMS',
        contactId: realContactId,
        message: message,
      }),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: `Send failed (${res.status})`, details: data }, { status: res.status });
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
