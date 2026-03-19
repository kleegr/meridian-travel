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

async function findContact(token: string, locationId: string, contactId?: string, contactName?: string): Promise<string> {
  if (contactId) return contactId;
  if (!contactName) return '';
  try {
    const res = await fetch(`${GHL_API}/contacts/?locationId=${locationId}&query=${encodeURIComponent(contactName)}&limit=1`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    const data = await res.json();
    return data.contacts?.[0]?.id || '';
  } catch { return ''; }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get('locationId') || '';
  const contactId = searchParams.get('contactId') || '';
  const contactName = searchParams.get('contactName') || '';
  const token = await getToken(locationId);
  if (!token) return NextResponse.json({ error: 'No access token. Please reconnect your account.' }, { status: 401 });

  try {
    const realContactId = await findContact(token, locationId, contactId, contactName);
    if (!realContactId) return NextResponse.json({ error: 'Contact not found', conversations: [], messages: [] });

    // Get conversations for this contact
    const convRes = await fetch(`${GHL_API}/conversations/search?contactId=${realContactId}&locationId=${locationId}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
    });
    const convData = await convRes.json();
    if (!convRes.ok) return NextResponse.json({ error: `Conversation search failed (${convRes.status})`, details: convData, contactId: realContactId });

    const conversations = convData.conversations || [];
    let messages: any[] = [];
    if (conversations.length > 0) {
      const convId = conversations[0].id;
      const msgRes = await fetch(`${GHL_API}/conversations/${convId}/messages?limit=50`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Accept': 'application/json' },
      });
      const msgData = await msgRes.json();
      messages = msgData.messages?.message || msgData.messages || [];
      // Sort messages oldest first
      if (Array.isArray(messages)) {
        messages.sort((a: any, b: any) => new Date(a.dateAdded || 0).getTime() - new Date(b.dateAdded || 0).getTime());
      }
    }

    return NextResponse.json({ success: true, contactId: realContactId, conversations, messages });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to load conversations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { locationId, contactId, contactName, message, type } = body;
  const token = await getToken(locationId);
  if (!token) return NextResponse.json({ error: 'No access token' }, { status: 401 });

  try {
    const realContactId = await findContact(token, locationId || '', contactId, contactName);
    if (!realContactId) return NextResponse.json({ error: 'Contact not found. Ensure this client exists as a contact.' }, { status: 404 });

    const msgType = type || 'SMS';
    const res = await fetch(`${GHL_API}/conversations/messages`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Version': '2021-07-28', 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: msgType, contactId: realContactId, message }),
    });
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
    if (!res.ok) {
      const errMsg = data?.message || data?.error || 'Send failed';
      let userMsg = `Message send failed (${res.status})`;
      if (res.status === 422 && typeof errMsg === 'string') {
        if (errMsg.includes('phone')) userMsg = 'Contact does not have a valid phone number for SMS.';
        else if (errMsg.includes('email')) userMsg = 'Contact does not have a valid email address.';
        else userMsg = `Cannot send message: ${errMsg}`;
      }
      return NextResponse.json({ error: userMsg, details: data }, { status: res.status });
    }
    return NextResponse.json({ success: true, ...data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Send failed' }, { status: 500 });
  }
}
