'use client';

import { useState, useEffect, useRef } from 'react';
import ItineraryDetail from './ItineraryDetail';
import InvoicesTab from './InvoicesTab';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { fmtDate } from '@/lib/utils';
import type { Itinerary, AgencyProfile, Pipeline, ChecklistTemplate, FeatureFlags } from '@/lib/types';

interface Props {
  itin: Itinerary; onBack: () => void; onUpdate: (u: Itinerary) => void; onDelete?: () => void;
  agencyProfile: AgencyProfile; pipelines?: Pipeline[]; checklistTemplates?: ChecklistTemplate[];
  agents?: string[]; featureFlags?: FeatureFlags; locationId?: string | null; ghlToken?: string | null;
}

const COMPACT = `
.itin-compact .space-y-5>*+*{margin-top:10px!important}
.itin-compact .space-y-4>*+*{margin-top:8px!important}
.itin-compact .px-6.py-5{padding:10px 16px!important}
.itin-compact h2.text-xl{font-size:15px!important;line-height:1.2!important}
.itin-compact .grid.border-t>div{padding:5px 8px!important}
.itin-compact .grid.border-t .text-\\[10px\\]{font-size:7px!important}
.itin-compact .grid.border-t .font-bold.text-sm{font-size:11px!important}
.itin-compact .flex.gap-0.overflow-x-auto{padding:1px 4px!important}
.itin-compact .flex.gap-0.overflow-x-auto button{padding:4px 9px!important;font-size:10px!important}
.itin-compact .rounded-xl.border.p-6.shadow-sm{padding:12px!important}
.itin-compact .rounded-xl.border.p-5.shadow-sm{padding:10px!important}
.itin-compact .text-sm.font-bold.uppercase.tracking-wider{font-size:10px!important;margin-bottom:8px!important}
.itin-compact .grid.grid-cols-2.md\\:grid-cols-4.gap-4{gap:6px!important}
.itin-compact .grid.grid-cols-2.md\\:grid-cols-4.gap-4 .text-\\[10px\\]{font-size:8px!important}
.itin-compact .grid.grid-cols-2.md\\:grid-cols-4.gap-4 .font-semibold{font-size:12px!important}
.itin-compact .grid.grid-cols-1.lg\\:grid-cols-3.gap-5{gap:8px!important}
.itin-compact .lg\\:col-span-2.space-y-4>*+*{margin-top:6px!important}
.itin-compact .space-y-3>div>.grid.grid-cols-1.md\\:grid-cols-2{gap:4px!important}
.itin-compact .space-y-3>div>.grid.grid-cols-1.md\\:grid-cols-2 input{padding:4px 8px!important;font-size:11px!important}
.itin-compact .space-y-3>div label{font-size:9px!important}
.itin-compact .space-y-3 .text-sm.font-bold{font-size:10px!important}
.itin-compact .bg-gradient-to-r.from-amber-50{padding:6px 10px!important;margin-bottom:4px!important}
.itin-compact .bg-gradient-to-r.from-amber-50 .text-lg{font-size:12px!important}
.itin-compact .bg-gradient-to-r.from-amber-50 .text-sm{font-size:10px!important}
.itin-compact .bg-gradient-to-r.from-amber-50 .text-xs{font-size:9px!important}
.itin-compact .bg-gradient-to-r.from-amber-50 .w-10{width:28px!important;height:28px!important}
.itin-compact .bg-gradient-to-br{padding:10px!important}
.itin-compact .bg-gradient-to-br .text-sm{font-size:10px!important}
.itin-compact .bg-gradient-to-br .text-lg{font-size:13px!important}
.itin-compact .space-y-1\\.5>div{padding:4px 8px!important}
.itin-compact .space-y-1\\.5>div .text-sm{font-size:11px!important}
`;

// In-app conversation panel
function ConversationPanel({ itin, locationId, onClose }: { itin: Itinerary; locationId?: string | null; onClose: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [contactId, setContactId] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (locationId) params.set('locationId', locationId);
        if ((itin as any).contactId) params.set('contactId', (itin as any).contactId);
        else params.set('contactName', itin.client);
        const res = await fetch(`/api/ghl-conversations?${params}`);
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages || []);
          setContactId(data.contactId || '');
        } else {
          setError(data.error || 'Could not load conversations');
        }
      } catch { setError('Failed to load'); }
      setLoading(false);
    };
    load();
  }, [itin.client, locationId]);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  const handleSend = async () => {
    if (!newMsg.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/ghl-conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId, contactId, contactName: itin.client, message: newMsg, type: 'SMS' }),
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, { body: newMsg, direction: 'outbound', dateAdded: new Date().toISOString(), type: 'SMS' }]);
        setNewMsg('');
      } else { setError(data.error || 'Send failed'); }
    } catch { setError('Send failed'); }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-end z-50" onClick={onClose}>
      <div className="bg-white h-full w-full max-w-md shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: GHL.border, background: GHL.accent }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">{(itin.client || '?').charAt(0).toUpperCase()}</div>
            <div><p className="text-sm font-semibold text-white">{itin.client}</p><p className="text-[10px] text-white/70">{itin.clientPhones?.[0] || itin.clientEmails?.[0] || 'No contact info'}</p></div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 text-white"><Icon n="x" c="w-4 h-4" /></button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#f8fafc' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GHL.accent }} /></div>
          ) : error ? (
            <div className="text-center py-8"><p className="text-xs" style={{ color: GHL.muted }}>{error}</p><p className="text-[10px] mt-1" style={{ color: GHL.muted }}>Make sure this client exists as a contact.</p></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8"><p className="text-xs font-medium" style={{ color: GHL.text }}>No messages yet</p><p className="text-[10px] mt-1" style={{ color: GHL.muted }}>Send the first message to {itin.client}</p></div>
          ) : (
            messages.map((msg: any, i: number) => {
              const isOutbound = msg.direction === 'outbound' || msg.direction === 'outgoing';
              return (
                <div key={i} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${isOutbound ? 'rounded-br-md' : 'rounded-bl-md'}`} style={{ background: isOutbound ? GHL.accent : 'white', color: isOutbound ? 'white' : GHL.text, border: isOutbound ? 'none' : `1px solid ${GHL.border}` }}>
                    <p className="text-xs whitespace-pre-wrap">{msg.body || msg.message || msg.text || ''}</p>
                    <p className={`text-[9px] mt-1 ${isOutbound ? 'text-white/60' : ''}`} style={!isOutbound ? { color: GHL.muted } : {}}>{msg.dateAdded ? new Date(msg.dateAdded).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''} {msg.type === 'Email' ? ' via Email' : ''}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Send message */}
        <div className="border-t p-3 flex gap-2" style={{ borderColor: GHL.border }}>
          <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Type a message..." className="flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: GHL.border }} />
          <button onClick={handleSend} disabled={sending || !newMsg.trim()} className="px-3 py-2 rounded-xl text-white text-sm font-semibold" style={{ background: GHL.accent, opacity: sending || !newMsg.trim() ? 0.5 : 1 }}>
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ItineraryDetailWrapper(props: Props) {
  const [overrideTab, setOverrideTab] = useState<'none' | 'invoices'>('none');
  const [showConversations, setShowConversations] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const inject = () => {
      const c = ref.current; if (!c) return;
      let tabBar: Element | null = null;
      c.querySelectorAll('.bg-white.rounded-xl.border.shadow-sm').forEach(el => {
        const inner = el.querySelector('.flex.gap-0.overflow-x-auto');
        if (inner) tabBar = inner;
      });
      if (!tabBar) return;

      tabBar.querySelectorAll('button').forEach(btn => {
        if ((btn.textContent?.trim() || '') === 'Financials') (btn as HTMLElement).style.display = 'none';
      });

      if (tabBar.querySelector('[data-invoice-tab]')) {
        const ex = tabBar.querySelector('[data-invoice-tab]') as HTMLElement;
        ex.style.color = overrideTab === 'invoices' ? GHL.accent : GHL.muted;
        ex.style.background = overrideTab === 'invoices' ? GHL.accentLight : 'transparent';
        ex.style.fontWeight = overrideTab === 'invoices' ? '600' : '500';
      } else {
        const btn = document.createElement('button');
        btn.setAttribute('data-invoice-tab', 'true');
        btn.className = 'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap mx-0.5';
        btn.style.color = overrideTab === 'invoices' ? GHL.accent : GHL.muted;
        btn.style.background = overrideTab === 'invoices' ? GHL.accentLight : 'transparent';
        btn.style.fontWeight = overrideTab === 'invoices' ? '600' : '500';
        btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg><span>Invoices</span>';
        btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); setOverrideTab(p => p === 'invoices' ? 'none' : 'invoices'); };
        tabBar.appendChild(btn);
      }

      // Inject Conversations button - opens in-app panel, NOT external GHL link
      const headerBtns = c.querySelector('.flex.items-center.gap-1\\.5');
      if (headerBtns && !headerBtns.querySelector('[data-convo-btn]')) {
        const convoBtn = document.createElement('button');
        convoBtn.setAttribute('data-convo-btn', 'true');
        convoBtn.className = 'p-2 rounded-lg border hover:bg-blue-50 transition-colors';
        convoBtn.style.borderColor = GHL.border;
        convoBtn.style.color = GHL.accent;
        convoBtn.title = 'Conversations';
        convoBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
        convoBtn.onclick = () => setShowConversations(true);
        headerBtns.insertBefore(convoBtn, headerBtns.firstChild);
      }
    };
    const t = setTimeout(inject, 100);
    const obs = new MutationObserver(() => setTimeout(inject, 50));
    obs.observe(ref.current, { childList: true, subtree: true });
    return () => { clearTimeout(t); obs.disconnect(); };
  }, [overrideTab]);

  useEffect(() => {
    if (!ref.current || overrideTab === 'none') return;
    const h = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t.closest('button') && !t.closest('[data-invoice-tab]') && t.closest('.flex.gap-0.overflow-x-auto')) setOverrideTab('none');
    };
    ref.current.addEventListener('click', h, true);
    return () => ref.current?.removeEventListener('click', h, true);
  }, [overrideTab]);

  useEffect(() => {
    if (!ref.current) return;
    const m = ref.current.querySelector('.space-y-5');
    if (!m) return;
    Array.from(m.children).forEach((c, i) => { if (i >= 2) (c as HTMLElement).style.display = overrideTab === 'invoices' ? 'none' : ''; });
  }, [overrideTab]);

  return (
    <div ref={ref} className="itin-compact">
      <style>{COMPACT}</style>
      <ItineraryDetail {...props as any} />
      {overrideTab === 'invoices' && <div className="mt-3"><InvoicesTab itin={props.itin} agencyProfile={props.agencyProfile} locationId={props.locationId} ghlToken={props.ghlToken} /></div>}
      {showConversations && <ConversationPanel itin={props.itin} locationId={props.locationId} onClose={() => setShowConversations(false)} />}
    </div>
  );
}
