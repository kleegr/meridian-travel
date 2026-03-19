'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { calcFin, fmt, fmtDate, uid } from '@/lib/utils';
import type { Itinerary, AgencyProfile } from '@/lib/types';

interface Props {
  itin: Itinerary;
  agencyProfile: AgencyProfile;
  locationId?: string | null;
  ghlToken?: string | null;
}

interface GHLInvoice {
  _id: string;
  invoiceNumber: string;
  name: string;
  status: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  createdAt: string;
  dueDate: string;
  contactDetails?: { id?: string; name?: string; email?: string; phoneNo?: string };
  invoiceItems?: { name: string; amount: number; qty: number; description?: string }[];
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft: { bg: '#f0f4f8', color: '#475569' },
  sent: { bg: '#dbeafe', color: '#1e40af' },
  viewed: { bg: '#ede9fe', color: '#5b21b6' },
  paid: { bg: '#ecfdf5', color: '#065f46' },
  'partially-paid': { bg: '#fef3c7', color: '#92400e' },
  overdue: { bg: '#fef2f2', color: '#991b1b' },
  void: { bg: '#f3f4f6', color: '#6b7280' },
};

// GHL stores all amounts in CENTS. Convert to dollars for display.
function centsToDisplay(cents: number): string { return fmt(cents / 100); }
function dollarsToCents(dollars: number): number { return Math.round(dollars * 100); }

export default function InvoicesTab({ itin, agencyProfile, locationId, ghlToken }: Props) {
  const [invoices, setInvoices] = useState<GHLInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNote, setPaymentNote] = useState('');
  const [recording, setRecording] = useState(false);
  const [viewInvoice, setViewInvoice] = useState<GHLInvoice | null>(null);

  const fin = calcFin(itin);
  const tripDesc = `${(itin.destinations?.length > 1) ? itin.destinations.join(', ') : itin.destination} | ${fmtDate(itin.startDate)} - ${fmtDate(itin.endDate)} | ${itin.passengers} pax`;

  const [invoiceName, setInvoiceName] = useState(`${itin.title} - Invoice`);
  const [dueDate, setDueDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0]; });
  const [items, setItems] = useState<{ name: string; description: string; amount: number; qty: number }[]>([
    { name: 'Travel Package - ' + itin.title, description: tripDesc, amount: fin.totalSell, qty: 1 },
  ]);

  // Amounts from GHL are in cents
  const totalInvoiced = invoices.reduce((s, inv) => s + (inv.total || 0), 0) / 100;
  const totalPaid = invoices.reduce((s, inv) => s + (inv.amountPaid || 0), 0) / 100;
  const totalDue = invoices.reduce((s, inv) => s + (inv.amountDue || 0), 0) / 100;
  const remainingToBill = fin.totalSell - totalInvoiced;
  const itemsTotal = items.reduce((s, item) => s + (item.amount * item.qty), 0);

  const fetchInvoices = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const headers: Record<string, string> = {};
      if (ghlToken) headers['Authorization'] = `Bearer ${ghlToken}`;
      const params = locationId ? `?locationId=${locationId}` : '';
      const res = await fetch(`/api/ghl-invoices${params}`, { headers });
      const data = await res.json();
      if (data.error) setError(data.error);
      else if (data.invoices) {
        const itinTitle = itin.title.toLowerCase();
        const related = (data.invoices || []).filter((inv: any) => (inv.name || '').toLowerCase().includes(itinTitle));
        setInvoices(related.length > 0 ? related : data.invoices?.slice(0, 20) || []);
      }
    } catch { setError('Could not load invoices'); }
    setLoading(false);
  }, [locationId, ghlToken, itin.title]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const openCreateForm = () => {
    const remaining = Math.max(0, fin.totalSell - totalInvoiced);
    setItems([{ name: 'Travel Package - ' + itin.title, description: tripDesc, amount: remaining, qty: 1 }]);
    setInvoiceName(`${itin.title} - Invoice${invoices.length > 0 ? ` #${invoices.length + 1}` : ''}`);
    setShowCreate(true); setError(''); setDebugInfo(null);
  };

  const addItem = () => setItems([...items, { name: '', description: '', amount: 0, qty: 1 }]);
  const removeItem = (i: number) => setItems(items.filter((_, j) => j !== i));
  const updateItem = (i: number, key: string, val: any) => setItems(items.map((item, j) => j === i ? { ...item, [key]: val } : item));

  const handleCreateInvoice = async () => {
    if (totalInvoiced > 0 && itemsTotal > remainingToBill && remainingToBill >= 0) {
      if (!confirm(`Warning: Billing $${itemsTotal.toLocaleString()} exceeds remaining $${Math.max(0, remainingToBill).toLocaleString()}. Already invoiced: ${fmt(totalInvoiced)}. Continue?`)) return;
    }
    setCreating(true); setError(''); setDebugInfo(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (ghlToken) headers['Authorization'] = `Bearer ${ghlToken}`;
      const res = await fetch('/api/ghl-invoices', {
        method: 'POST', headers,
        body: JSON.stringify({
          altId: locationId || undefined, locationId: locationId || undefined,
          name: invoiceName, dueDate, currency: 'USD',
          // Send amounts in CENTS to the API (API will pass directly to GHL)
          invoiceItems: items.map(item => ({ name: item.name, description: item.description, amount: dollarsToCents(item.amount), qty: item.qty })),
          businessDetails: { name: agencyProfile.name || 'Kleegr Travel', phone: agencyProfile.phone, address: agencyProfile.address },
          contactName: itin.client, contactEmail: (itin.clientEmails || [])[0] || '', contactPhone: (itin.clientPhones || [])[0] || '',
        }),
      });
      const data = await res.json();
      if (res.ok && (data._id || data.status === 'draft')) { setShowCreate(false); fetchInvoices(); }
      else { setError('Failed: ' + (data.error || data.message || JSON.stringify(data.details?.error || data).substring(0, 300))); if (data.details) setDebugInfo(data.details); }
    } catch (err: any) { setError(err?.message || 'Network error'); }
    setCreating(false);
  };

  const handleSend = async (id: string) => {
    try {
      const h: Record<string, string> = { 'Content-Type': 'application/json' };
      if (ghlToken) h['Authorization'] = `Bearer ${ghlToken}`;
      await fetch('/api/ghl-invoices', { method: 'POST', headers: h, body: JSON.stringify({ action: 'send', invoiceId: id }) });
      fetchInvoices();
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice? This cannot be undone.')) return;
    try {
      const h: Record<string, string> = { 'Content-Type': 'application/json' };
      if (ghlToken) h['Authorization'] = `Bearer ${ghlToken}`;
      await fetch('/api/ghl-invoices', { method: 'DELETE', headers: h, body: JSON.stringify({ invoiceId: id }) });
      fetchInvoices();
    } catch {}
  };

  const handleRecordPayment = async (invoiceId: string) => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return;
    setRecording(true); setError('');
    try {
      const h: Record<string, string> = { 'Content-Type': 'application/json' };
      if (ghlToken) h['Authorization'] = `Bearer ${ghlToken}`;
      const res = await fetch('/api/ghl-invoices', {
        method: 'POST', headers: h,
        body: JSON.stringify({ action: 'record-payment', invoiceId, amount: dollarsToCents(parseFloat(paymentAmount)), mode: paymentMethod, notes: paymentNote }),
      });
      const data = await res.json();
      if (res.ok) { setShowPayment(null); setPaymentAmount(''); setPaymentNote(''); fetchInvoices(); }
      else { setError('Payment failed: ' + (data.error || data.message || JSON.stringify(data))); }
    } catch (err: any) { setError(err?.message || 'Payment error'); }
    setRecording(false);
  };

  const ic = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-[9px] font-bold uppercase tracking-wider mb-1';

  return (
    <div className="space-y-4">
      {/* Balance overview */}
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'Trip Total', value: fmt(fin.totalSell), color: GHL.text, bg: 'white' },
          { label: 'Invoiced', value: fmt(totalInvoiced), color: '#1e40af', bg: '#eff6ff' },
          { label: 'Paid', value: fmt(totalPaid), color: GHL.success, bg: '#f0fdf4' },
          { label: 'Outstanding', value: fmt(totalDue), color: totalDue > 0 ? '#dc2626' : GHL.success, bg: totalDue > 0 ? '#fef2f2' : '#f0fdf4' },
          { label: 'Unbilled', value: fmt(Math.max(0, remainingToBill)), color: remainingToBill > 0 ? GHL.warning : GHL.success, bg: remainingToBill > 0 ? '#fffbeb' : '#f0fdf4' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-3" style={{ borderColor: GHL.border, background: s.bg }}>
            <p className="text-[8px] font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>{s.label}</p>
            <p className="text-base font-bold mt-0.5" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: GHL.text }}>Invoices</h3>
        <div className="flex gap-2">
          <button onClick={fetchInvoices} className="p-1.5 rounded-lg border hover:bg-gray-50" style={{ borderColor: GHL.border, color: GHL.muted }}><Icon n="globe" c="w-3.5 h-3.5" /></button>
          <button onClick={openCreateForm} className="inline-flex items-center gap-1.5 text-white rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: GHL.accent }}><Icon n="plus" c="w-3 h-3" />New Invoice</button>
        </div>
      </div>

      {error && <div className="rounded-lg border p-3" style={{ borderColor: '#fca5a5', background: '#fef2f2' }}><p className="text-xs" style={{ color: '#991b1b' }}>{error}</p></div>}
      {debugInfo && <details className="rounded-lg border p-3" style={{ borderColor: '#fde68a', background: '#fffbeb' }}><summary className="text-[10px] font-bold cursor-pointer" style={{ color: '#92400e' }}>Debug</summary><pre className="text-[9px] whitespace-pre-wrap overflow-auto max-h-32 mt-2" style={{ color: '#92400e' }}>{JSON.stringify(debugInfo, null, 2)}</pre></details>}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
          <h4 className="font-bold text-sm mb-4" style={{ color: GHL.text }}>Create Invoice</h4>
          {totalInvoiced > 0 && itemsTotal > remainingToBill && <div className="rounded-lg p-2.5 mb-3 text-xs" style={{ background: '#fffbeb', color: '#92400e' }}>⚠ Billing exceeds remaining ({fmt(remainingToBill)} unbilled of {fmt(fin.totalSell)})</div>}
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="col-span-2"><label className={lc} style={{ color: GHL.muted }}>Name</label><input value={invoiceName} onChange={e => setInvoiceName(e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Due Date</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
          </div>
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2"><label className={lc} style={{ color: GHL.muted }}>Line Items</label><button onClick={addItem} className="text-[9px] font-semibold px-2 py-0.5 rounded hover:bg-blue-50" style={{ color: GHL.accent }}>+ Add</button></div>
            {items.map((item, i) => (
              <div key={i} className="rounded-lg border p-3 mb-2" style={{ borderColor: GHL.border, background: GHL.bg + '40' }}>
                <div className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-6"><label className="text-[8px] font-medium" style={{ color: GHL.muted }}>Item</label><input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} className={ic + ' text-xs'} style={{ borderColor: GHL.border }} /></div>
                  <div className="col-span-3"><label className="text-[8px] font-medium" style={{ color: GHL.muted }}>Amount ($)</label><input type="number" value={item.amount} onChange={e => updateItem(i, 'amount', parseFloat(e.target.value) || 0)} className={ic + ' text-right font-semibold'} style={{ borderColor: GHL.border }} /></div>
                  <div className="col-span-2"><label className="text-[8px] font-medium" style={{ color: GHL.muted }}>Qty</label><input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', parseInt(e.target.value) || 1)} className={ic + ' text-center'} style={{ borderColor: GHL.border }} /></div>
                  <div className="col-span-1 flex items-end pb-0.5">{items.length > 1 && <button onClick={() => removeItem(i)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400"><Icon n="trash" c="w-3 h-3" /></button>}</div>
                </div>
                <div><label className="text-[8px] font-medium" style={{ color: GHL.muted }}>Description</label><input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Trip details..." className={ic + ' text-xs'} style={{ borderColor: GHL.border }} /></div>
              </div>
            ))}
            <div className="flex justify-end pt-2 border-t" style={{ borderColor: GHL.border }}><span className="text-xs" style={{ color: GHL.muted }}>Total:</span><span className="text-lg font-bold ml-2" style={{ color: GHL.text }}>{fmt(itemsTotal)}</span></div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-xs rounded-lg" style={{ color: GHL.muted }}>Cancel</button>
            <button onClick={handleCreateInvoice} disabled={creating} className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: GHL.accent, opacity: creating ? 0.5 : 1 }}>{creating ? 'Creating...' : 'Create Invoice'}</button>
          </div>
        </div>
      )}

      {/* Invoice list */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}>
        {loading ? (
          <div className="flex items-center justify-center py-6"><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GHL.accent }} /></div>
        ) : invoices.length > 0 ? (
          <div className="divide-y" style={{ borderColor: GHL.border + '60' }}>
            {invoices.map(inv => {
              const sc = STATUS_COLORS[inv.status] || STATUS_COLORS.draft;
              return (
                <div key={inv._id} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50/30 cursor-pointer transition-colors" onClick={() => setViewInvoice(viewInvoice?._id === inv._id ? null : inv)}>
                  <div className="w-16 text-xs font-mono" style={{ color: GHL.accent }}>{inv.invoiceNumber || '-'}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: GHL.text }}>{inv.name}</p>
                    <p className="text-[10px]" style={{ color: GHL.muted }}>{inv.createdAt ? fmtDate(inv.createdAt.split('T')[0]) : ''}{inv.contactDetails?.name ? ` • ${inv.contactDetails.name}` : ''}</p>
                  </div>
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: sc.bg, color: sc.color }}>{inv.status}</span>
                  <div className="text-right w-24">
                    <p className="text-sm font-bold" style={{ color: GHL.text }}>{centsToDisplay(inv.total || 0)}</p>
                    {(inv.amountPaid || 0) > 0 && <p className="text-[10px]" style={{ color: GHL.success }}>Paid: {centsToDisplay(inv.amountPaid || 0)}</p>}
                  </div>
                  <div className="flex gap-1 w-32 justify-end" onClick={e => e.stopPropagation()}>
                    {inv.status === 'draft' && <button onClick={() => handleSend(inv._id)} className="text-[9px] font-semibold px-2 py-1 rounded hover:bg-blue-50" style={{ color: GHL.accent }}>Send</button>}
                    {(inv.amountDue || 0) > 0 && <button onClick={() => { setShowPayment(inv._id); setPaymentAmount(String((inv.amountDue || 0) / 100)); }} className="text-[9px] font-semibold px-2 py-1 rounded hover:bg-green-50" style={{ color: GHL.success }}>Pay</button>}
                    {inv.status === 'draft' && <button onClick={() => handleDelete(inv._id)} className="text-[9px] font-semibold px-2 py-1 rounded hover:bg-red-50 text-gray-400">Del</button>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6"><p className="text-xs" style={{ color: GHL.muted }}>No invoices yet</p></div>
        )}
      </div>

      {/* Invoice detail view */}
      {viewInvoice && (
        <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold" style={{ color: GHL.text }}>{viewInvoice.name}</h4>
              <p className="text-xs" style={{ color: GHL.muted }}>INV-{viewInvoice.invoiceNumber} • {viewInvoice.createdAt ? fmtDate(viewInvoice.createdAt.split('T')[0]) : ''}</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full capitalize" style={{ ...(STATUS_COLORS[viewInvoice.status] || STATUS_COLORS.draft) }}>{viewInvoice.status}</span>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div><p className="text-[9px] font-bold uppercase" style={{ color: GHL.muted }}>Total</p><p className="text-lg font-bold" style={{ color: GHL.text }}>{centsToDisplay(viewInvoice.total || 0)}</p></div>
            <div><p className="text-[9px] font-bold uppercase" style={{ color: GHL.muted }}>Paid</p><p className="text-lg font-bold" style={{ color: GHL.success }}>{centsToDisplay(viewInvoice.amountPaid || 0)}</p></div>
            <div><p className="text-[9px] font-bold uppercase" style={{ color: GHL.muted }}>Due</p><p className="text-lg font-bold" style={{ color: (viewInvoice.amountDue || 0) > 0 ? '#dc2626' : GHL.success }}>{centsToDisplay(viewInvoice.amountDue || 0)}</p></div>
          </div>
          {viewInvoice.contactDetails && (
            <div className="mb-4 p-3 rounded-lg" style={{ background: GHL.bg }}>
              <p className="text-[9px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Billed To</p>
              <p className="text-sm font-medium" style={{ color: GHL.text }}>{viewInvoice.contactDetails.name}</p>
              {viewInvoice.contactDetails.email && <p className="text-xs" style={{ color: GHL.muted }}>{viewInvoice.contactDetails.email}</p>}
              {viewInvoice.contactDetails.phoneNo && <p className="text-xs" style={{ color: GHL.muted }}>{viewInvoice.contactDetails.phoneNo}</p>}
            </div>
          )}
          {viewInvoice.invoiceItems && viewInvoice.invoiceItems.length > 0 && (
            <div className="mb-4">
              <p className="text-[9px] font-bold uppercase mb-2" style={{ color: GHL.muted }}>Items</p>
              {viewInvoice.invoiceItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: GHL.border + '60' }}>
                  <div><p className="text-sm" style={{ color: GHL.text }}>{item.name}</p>{item.description && <p className="text-[10px]" style={{ color: GHL.muted }}>{item.description}</p>}</div>
                  <div className="text-right"><p className="text-sm font-semibold" style={{ color: GHL.text }}>{centsToDisplay(item.amount * (item.qty || 1))}</p>{item.qty > 1 && <p className="text-[10px]" style={{ color: GHL.muted }}>{item.qty} × {centsToDisplay(item.amount)}</p>}</div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            {viewInvoice.status === 'draft' && <button onClick={() => handleSend(viewInvoice._id)} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white" style={{ background: GHL.accent }}>Send Invoice</button>}
            {(viewInvoice.amountDue || 0) > 0 && <button onClick={() => { setShowPayment(viewInvoice._id); setPaymentAmount(String((viewInvoice.amountDue || 0) / 100)); }} className="px-3 py-1.5 text-xs font-semibold rounded-lg text-white" style={{ background: GHL.success }}>Record Payment</button>}
            <button onClick={() => setViewInvoice(null)} className="px-3 py-1.5 text-xs rounded-lg ml-auto" style={{ color: GHL.muted }}>Close</button>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowPayment(null)}>
          <div className="bg-white rounded-xl border p-6 w-full max-w-sm shadow-2xl" style={{ borderColor: GHL.border }} onClick={e => e.stopPropagation()}>
            <h4 className="font-bold text-sm mb-4" style={{ color: GHL.text }}>Record Payment</h4>
            <div className="space-y-3">
              <div><label className={lc} style={{ color: GHL.muted }}>Amount ($)</label><input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className={ic + ' text-lg font-bold'} style={{ borderColor: GHL.border }} /></div>
              <div><label className={lc} style={{ color: GHL.muted }}>Method</label><select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option value="cash">Cash</option><option value="card">Credit Card</option><option value="bank_transfer">Bank Transfer</option><option value="check">Check</option><option value="other">Other</option></select></div>
              <div><label className={lc} style={{ color: GHL.muted }}>Note</label><input value={paymentNote} onChange={e => setPaymentNote(e.target.value)} placeholder="Reference..." className={ic} style={{ borderColor: GHL.border }} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowPayment(null)} className="px-3 py-1.5 text-xs rounded-lg" style={{ color: GHL.muted }}>Cancel</button>
              <button onClick={() => handleRecordPayment(showPayment)} disabled={recording} className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: GHL.success, opacity: recording ? 0.5 : 1 }}>{recording ? 'Recording...' : 'Record Payment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
