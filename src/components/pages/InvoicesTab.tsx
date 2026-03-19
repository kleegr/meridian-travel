'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { calcFin, fmt, fmtDate, uid } from '@/lib/utils';
import type { Itinerary, AgencyProfile } from '@/lib/types';

interface Props { itin: Itinerary; agencyProfile: AgencyProfile; locationId?: string | null; ghlToken?: string | null; }
interface GHLInvoice { _id: string; invoiceNumber: string; name: string; status: string; total: number; amountPaid: number; amountDue: number; currency: string; createdAt: string; issueDate?: string; dueDate: string; businessDetails?: any; contactDetails?: { id?: string; name?: string; email?: string; phoneNo?: string }; invoiceItems?: { name: string; amount: number; qty: number; description?: string }[]; }
const SC: Record<string, { bg: string; color: string }> = { draft: { bg: '#f0f4f8', color: '#475569' }, sent: { bg: '#dbeafe', color: '#1e40af' }, viewed: { bg: '#ede9fe', color: '#5b21b6' }, paid: { bg: '#ecfdf5', color: '#065f46' }, 'partially-paid': { bg: '#fef3c7', color: '#92400e' }, overdue: { bg: '#fef2f2', color: '#991b1b' }, void: { bg: '#f3f4f6', color: '#6b7280' } };
function c2d(cents: number): string { return fmt(cents / 100); }
function d2c(dollars: number): number { return Math.round(dollars * 100); }

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
  const [previewInvoice, setPreviewInvoice] = useState<GHLInvoice | null>(null);
  const [sending, setSending] = useState(false);

  const fin = calcFin(itin);
  const tripDesc = `${(itin.destinations?.length > 1) ? itin.destinations.join(', ') : itin.destination} | ${fmtDate(itin.startDate)} - ${fmtDate(itin.endDate)} | ${itin.passengers} pax`;
  const [invoiceName, setInvoiceName] = useState(`${itin.title} - Invoice`);
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0]; });
  const [items, setItems] = useState<{ name: string; description: string; amount: number; qty: number }[]>([{ name: 'Travel Package - ' + itin.title, description: tripDesc, amount: fin.totalSell, qty: 1 }]);

  const totalInvoiced = invoices.reduce((s, inv) => s + (inv.total || 0), 0) / 100;
  const totalPaid = invoices.reduce((s, inv) => s + (inv.amountPaid || 0), 0) / 100;
  const totalDue = invoices.reduce((s, inv) => s + (inv.amountDue || 0), 0) / 100;
  const remainingToBill = fin.totalSell - totalInvoiced;
  const itemsTotal = items.reduce((s, item) => s + (item.amount * item.qty), 0);

  const hdr = (): Record<string, string> => { const h: Record<string, string> = { 'Content-Type': 'application/json' }; if (ghlToken) h['Authorization'] = `Bearer ${ghlToken}`; return h; };

  const fetchInvoices = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = locationId ? `?locationId=${locationId}` : '';
      const res = await fetch(`/api/ghl-invoices${params}`, { headers: ghlToken ? { Authorization: `Bearer ${ghlToken}` } : {} });
      const data = await res.json();
      if (data.error) setError(data.error);
      else if (data.invoices) {
        const t = itin.title.toLowerCase();
        const related = (data.invoices || []).filter((inv: any) => (inv.name || '').toLowerCase().includes(t));
        setInvoices(related.length > 0 ? related : data.invoices?.slice(0, 20) || []);
      }
    } catch { setError('Could not load invoices'); }
    setLoading(false);
  }, [locationId, ghlToken, itin.title]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const openCreateForm = () => {
    const r = Math.max(0, fin.totalSell - totalInvoiced);
    setItems([{ name: 'Travel Package - ' + itin.title, description: tripDesc, amount: r, qty: 1 }]);
    setInvoiceName(`${itin.title} - Invoice${invoices.length > 0 ? ` #${invoices.length + 1}` : ''}`);
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setShowCreate(true); setError(''); setDebugInfo(null);
  };
  const addItem = () => setItems([...items, { name: '', description: '', amount: 0, qty: 1 }]);
  const removeItem = (i: number) => setItems(items.filter((_, j) => j !== i));
  const updateItem = (i: number, k: string, v: any) => setItems(items.map((item, j) => j === i ? { ...item, [k]: v } : item));

  const handleCreate = async () => {
    if (totalInvoiced > 0 && itemsTotal > remainingToBill && remainingToBill >= 0 && !confirm(`Billing $${itemsTotal.toLocaleString()} exceeds remaining $${Math.max(0, remainingToBill).toLocaleString()}. Continue?`)) return;
    setCreating(true); setError(''); setDebugInfo(null);
    try {
      const res = await fetch('/api/ghl-invoices', { method: 'POST', headers: hdr(),
        body: JSON.stringify({ altId: locationId, locationId, name: invoiceName, issueDate: invoiceDate, dueDate, currency: 'USD',
          invoiceItems: items.map(item => ({ name: item.name, description: item.description, amount: d2c(item.amount), qty: item.qty })),
          businessDetails: { name: agencyProfile.name || 'Travel Agency', phone: agencyProfile.phone, address: agencyProfile.address, logoUrl: agencyProfile.logo },
          contactName: itin.client, contactEmail: (itin.clientEmails || [])[0] || '', contactPhone: (itin.clientPhones || [])[0] || '',
        }),
      });
      const data = await res.json();
      if (res.ok && (data._id || data.status === 'draft')) { setShowCreate(false); fetchInvoices(); }
      else {
        const msg = data.error || data.message || '';
        if (msg.includes('Contact not found')) { setError(msg); }
        else { setError('Failed: ' + msg); }
        if (data.details) setDebugInfo(data.details);
      }
    } catch (err: any) { setError(err?.message || 'Error creating invoice'); }
    setCreating(false);
  };

  const openPreview = (inv: GHLInvoice) => setPreviewInvoice(inv);
  const confirmSend = async () => {
    if (!previewInvoice) return;
    setSending(true); setError('');
    try {
      const res = await fetch('/api/ghl-invoices', { method: 'POST', headers: hdr(), body: JSON.stringify({ action: 'send', invoiceId: previewInvoice._id }) });
      const data = await res.json();
      if (res.ok) { setPreviewInvoice(null); fetchInvoices(); }
      else setError(data.error || 'Send failed');
    } catch (err: any) { setError(err?.message || 'Send error'); }
    setSending(false);
  };
  const handleDelete = async (id: string) => { if (!confirm('Delete this invoice?')) return; try { await fetch('/api/ghl-invoices', { method: 'DELETE', headers: hdr(), body: JSON.stringify({ invoiceId: id }) }); fetchInvoices(); } catch {} };
  const handlePay = async (invoiceId: string) => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) return;
    setRecording(true); setError('');
    try {
      const res = await fetch('/api/ghl-invoices', { method: 'POST', headers: hdr(), body: JSON.stringify({ action: 'record-payment', invoiceId, amount: d2c(parseFloat(paymentAmount)), mode: paymentMethod, notes: paymentNote }) });
      const data = await res.json();
      if (res.ok) { setShowPayment(null); setPaymentAmount(''); setPaymentNote(''); fetchInvoices(); }
      else setError(data.error || 'Payment failed');
    } catch (err: any) { setError(err?.message || 'Payment error'); }
    setRecording(false);
  };

  const ic = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-[9px] font-bold uppercase tracking-wider mb-1';

  return (
    <div className="space-y-4">
      {/* Combined Financial + Invoice Summary */}
      <div className="bg-white rounded-xl border shadow-sm p-5" style={{ borderColor: GHL.border }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: GHL.text }}>Financial Overview</h3>
          <div className="flex gap-2">
            <button onClick={fetchInvoices} className="p-1.5 rounded-lg border hover:bg-gray-50" style={{ borderColor: GHL.border, color: GHL.muted }} title="Refresh"><Icon n="globe" c="w-3 h-3" /></button>
            <button onClick={openCreateForm} className="inline-flex items-center gap-1.5 text-white rounded-lg px-3 py-1.5 text-xs font-semibold" style={{ background: GHL.accent }}><Icon n="plus" c="w-3 h-3" />New Invoice</button>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-4 pb-4 border-b" style={{ borderColor: GHL.border + '60' }}>
          <div><p className="text-[8px] font-bold uppercase" style={{ color: GHL.muted }}>Revenue</p><p className="text-lg font-bold" style={{ color: GHL.text }}>{fmt(fin.totalSell)}</p></div>
          <div><p className="text-[8px] font-bold uppercase" style={{ color: GHL.muted }}>Cost</p><p className="text-lg font-bold" style={{ color: GHL.muted }}>{fmt(fin.totalCost)}</p></div>
          <div><p className="text-[8px] font-bold uppercase" style={{ color: GHL.success }}>Profit</p><p className="text-lg font-bold" style={{ color: GHL.success }}>{fmt(fin.profit)}</p></div>
          <div><p className="text-[8px] font-bold uppercase" style={{ color: GHL.warning }}>Margin</p><p className="text-lg font-bold" style={{ color: GHL.text }}>{fin.margin}%</p></div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div><p className="text-[8px] font-bold uppercase" style={{ color: GHL.muted }}>Invoiced</p><p className="text-base font-bold" style={{ color: '#1e40af' }}>{fmt(totalInvoiced)}</p></div>
          <div><p className="text-[8px] font-bold uppercase" style={{ color: GHL.muted }}>Paid</p><p className="text-base font-bold" style={{ color: GHL.success }}>{fmt(totalPaid)}</p></div>
          <div><p className="text-[8px] font-bold uppercase" style={{ color: GHL.muted }}>Outstanding</p><p className="text-base font-bold" style={{ color: totalDue > 0 ? '#dc2626' : GHL.success }}>{fmt(totalDue)}</p></div>
          <div><p className="text-[8px] font-bold uppercase" style={{ color: GHL.muted }}>Unbilled</p><p className="text-base font-bold" style={{ color: remainingToBill > 0 ? GHL.warning : GHL.success }}>{fmt(Math.max(0, remainingToBill))}</p></div>
        </div>
      </div>

      {error && <div className="rounded-lg border p-3" style={{ borderColor: '#fca5a5', background: '#fef2f2' }}><p className="text-xs" style={{ color: '#991b1b' }}>{error}</p></div>}
      {debugInfo && <details className="rounded-lg border p-3" style={{ borderColor: '#fde68a', background: '#fffbeb' }}><summary className="text-[10px] font-bold cursor-pointer" style={{ color: '#92400e' }}>Debug Details</summary><pre className="text-[9px] whitespace-pre-wrap overflow-auto max-h-32 mt-2" style={{ color: '#92400e' }}>{JSON.stringify(debugInfo, null, 2)}</pre></details>}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
          <h4 className="font-bold text-sm mb-4" style={{ color: GHL.text }}>Create Invoice</h4>
          {totalInvoiced > 0 && itemsTotal > remainingToBill && <div className="rounded-lg p-2.5 mb-3 text-xs" style={{ background: '#fffbeb', color: '#92400e' }}>{'\u26a0'} Billing exceeds remaining ({fmt(remainingToBill)} unbilled of {fmt(fin.totalSell)})</div>}
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div className="col-span-2"><label className={lc} style={{ color: GHL.muted }}>Invoice Name</label><input value={invoiceName} onChange={e => setInvoiceName(e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Invoice Date</label><input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Due Date</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
          </div>
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2"><label className={lc} style={{ color: GHL.muted }}>Line Items</label><button onClick={addItem} className="text-[9px] font-semibold px-2 py-0.5 rounded hover:bg-blue-50" style={{ color: GHL.accent }}>+ Add Item</button></div>
            {items.map((item, i) => (
              <div key={i} className="rounded-lg border p-3 mb-2" style={{ borderColor: GHL.border, background: GHL.bg + '40' }}>
                <div className="grid grid-cols-12 gap-2 mb-2">
                  <div className="col-span-6"><label className="text-[8px] font-medium" style={{ color: GHL.muted }}>Item Name</label><input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} className={ic + ' text-xs'} style={{ borderColor: GHL.border }} /></div>
                  <div className="col-span-3"><label className="text-[8px] font-medium" style={{ color: GHL.muted }}>Amount ($)</label><input type="number" value={item.amount} onChange={e => updateItem(i, 'amount', parseFloat(e.target.value) || 0)} className={ic + ' text-right font-semibold'} style={{ borderColor: GHL.border }} /></div>
                  <div className="col-span-2"><label className="text-[8px] font-medium" style={{ color: GHL.muted }}>Quantity</label><input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', parseInt(e.target.value) || 1)} className={ic + ' text-center'} style={{ borderColor: GHL.border }} /></div>
                  <div className="col-span-1 flex items-end pb-0.5">{items.length > 1 && <button onClick={() => removeItem(i)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400"><Icon n="trash" c="w-3 h-3" /></button>}</div>
                </div>
                <div><label className="text-[8px] font-medium" style={{ color: GHL.muted }}>Description</label><input value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Trip details..." className={ic + ' text-xs'} style={{ borderColor: GHL.border }} /></div>
              </div>
            ))}
            <div className="flex justify-end pt-2 border-t" style={{ borderColor: GHL.border }}><span className="text-xs" style={{ color: GHL.muted }}>Total:</span><span className="text-lg font-bold ml-2" style={{ color: GHL.text }}>{fmt(itemsTotal)}</span></div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-xs rounded-lg" style={{ color: GHL.muted }}>Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: GHL.accent, opacity: creating ? 0.5 : 1 }}>{creating ? 'Creating...' : 'Create Invoice'}</button>
          </div>
        </div>
      )}

      {/* Invoice list */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}>
        <div className="px-4 py-2.5" style={{ background: GHL.bg }}><p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>Invoice History</p></div>
        {loading ? (
          <div className="flex items-center justify-center py-6"><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GHL.accent }} /></div>
        ) : invoices.length > 0 ? (
          <div className="divide-y" style={{ borderColor: GHL.border + '60' }}>
            {invoices.map(inv => {
              const sc = SC[inv.status] || SC.draft;
              return (
                <div key={inv._id} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50/30 cursor-pointer transition-colors" onClick={() => openPreview(inv)}>
                  <div className="w-14 text-xs font-mono" style={{ color: GHL.accent }}>{inv.invoiceNumber}</div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{ color: GHL.text }}>{inv.name}</p><p className="text-[10px]" style={{ color: GHL.muted }}>{inv.issueDate ? fmtDate(inv.issueDate) : inv.createdAt ? fmtDate(inv.createdAt.split('T')[0]) : ''}{inv.contactDetails?.name ? ` \u2022 ${inv.contactDetails.name}` : ''}</p></div>
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: sc.bg, color: sc.color }}>{inv.status}</span>
                  <div className="text-right w-20"><p className="text-sm font-bold" style={{ color: GHL.text }}>{c2d(inv.total || 0)}</p>{(inv.amountPaid || 0) > 0 && <p className="text-[9px]" style={{ color: GHL.success }}>Paid {c2d(inv.amountPaid)}</p>}</div>
                  <div className="flex gap-1 w-24 justify-end" onClick={e => e.stopPropagation()}>
                    {(inv.amountDue || 0) > 0 && <button onClick={() => { setShowPayment(inv._id); setPaymentAmount(String((inv.amountDue || 0) / 100)); }} className="text-[9px] font-semibold px-1.5 py-0.5 rounded hover:bg-green-50" style={{ color: GHL.success }}>Payment</button>}
                    {inv.status === 'draft' && <button onClick={() => handleDelete(inv._id)} className="text-[9px] px-1.5 py-0.5 rounded hover:bg-red-50 text-gray-400">Delete</button>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6"><p className="text-xs" style={{ color: GHL.muted }}>No invoices yet. Click "New Invoice" to create one.</p></div>
        )}
      </div>

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setPreviewInvoice(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4 border-b" style={{ borderColor: GHL.border }}>
              <div className="flex items-center justify-between mb-3">
                <div><p className="text-2xl font-bold tracking-tight" style={{ color: GHL.text }}>INVOICE</p><p className="text-xs font-mono mt-0.5" style={{ color: GHL.muted }}>INV-{previewInvoice.invoiceNumber}</p></div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full capitalize" style={{ ...(SC[previewInvoice.status] || SC.draft) }}>{previewInvoice.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div><p className="text-[9px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>From</p><p className="font-semibold" style={{ color: GHL.text }}>{previewInvoice.businessDetails?.name || agencyProfile.name}</p><p style={{ color: GHL.muted }}>{agencyProfile.phone}</p><p style={{ color: GHL.muted }}>{agencyProfile.email}</p></div>
                <div><p className="text-[9px] font-bold uppercase mb-1" style={{ color: GHL.muted }}>Bill To</p><p className="font-semibold" style={{ color: GHL.text }}>{previewInvoice.contactDetails?.name || itin.client}</p><p style={{ color: GHL.muted }}>{previewInvoice.contactDetails?.email}</p><p style={{ color: GHL.muted }}>{previewInvoice.contactDetails?.phoneNo}</p></div>
              </div>
              <div className="flex gap-6 mt-3 text-xs">
                <span style={{ color: GHL.muted }}>Invoice Date: <span className="font-medium" style={{ color: GHL.text }}>{previewInvoice.issueDate ? fmtDate(previewInvoice.issueDate) : previewInvoice.createdAt ? fmtDate(previewInvoice.createdAt.split('T')[0]) : 'Today'}</span></span>
                <span style={{ color: GHL.muted }}>Due Date: <span className="font-medium" style={{ color: GHL.text }}>{previewInvoice.dueDate ? fmtDate(previewInvoice.dueDate.split('T')[0]) : '-'}</span></span>
              </div>
            </div>
            <div className="px-6 py-4">
              <table className="w-full text-xs"><thead><tr className="border-b" style={{ borderColor: GHL.border }}><th className="text-left py-2 text-[9px] font-bold uppercase" style={{ color: GHL.muted }}>Item</th><th className="text-center py-2 text-[9px] font-bold uppercase w-12" style={{ color: GHL.muted }}>Qty</th><th className="text-right py-2 text-[9px] font-bold uppercase w-20" style={{ color: GHL.muted }}>Price</th><th className="text-right py-2 text-[9px] font-bold uppercase w-20" style={{ color: GHL.muted }}>Total</th></tr></thead>
              <tbody>{(previewInvoice.invoiceItems || []).map((item, i) => (<tr key={i} className="border-b last:border-0" style={{ borderColor: GHL.border + '40' }}><td className="py-2.5"><p className="font-medium" style={{ color: GHL.text }}>{item.name}</p>{item.description && <p className="text-[10px]" style={{ color: GHL.muted }}>{item.description}</p>}</td><td className="py-2.5 text-center" style={{ color: GHL.text }}>{item.qty || 1}</td><td className="py-2.5 text-right" style={{ color: GHL.text }}>{c2d(item.amount)}</td><td className="py-2.5 text-right font-semibold" style={{ color: GHL.text }}>{c2d(item.amount * (item.qty || 1))}</td></tr>))}</tbody></table>
            </div>
            <div className="px-6 pb-4">
              <div className="border-t pt-3 space-y-1" style={{ borderColor: GHL.border }}>
                <div className="flex justify-between text-xs"><span style={{ color: GHL.muted }}>Subtotal</span><span className="font-medium">{c2d(previewInvoice.total || 0)}</span></div>
                {(previewInvoice.amountPaid || 0) > 0 && <div className="flex justify-between text-xs"><span style={{ color: GHL.success }}>Paid</span><span style={{ color: GHL.success }}>-{c2d(previewInvoice.amountPaid)}</span></div>}
                <div className="flex justify-between text-sm font-bold pt-1 border-t" style={{ borderColor: GHL.border }}><span>Amount Due</span><span style={{ color: (previewInvoice.amountDue || 0) > 0 ? '#dc2626' : GHL.success }}>{c2d(previewInvoice.amountDue || 0)}</span></div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-2">
              {previewInvoice.status === 'draft' && <button onClick={confirmSend} disabled={sending} className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl flex items-center justify-center gap-2" style={{ background: GHL.accent, opacity: sending ? 0.5 : 1 }}>{sending ? 'Sending...' : <><Icon n="plane" c="w-4 h-4" /> Send Invoice with Payment Link</>}</button>}
              {(previewInvoice.amountDue || 0) > 0 && previewInvoice.status !== 'draft' && <button onClick={() => { setShowPayment(previewInvoice._id); setPaymentAmount(String((previewInvoice.amountDue || 0) / 100)); setPreviewInvoice(null); }} className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl" style={{ background: GHL.success }}>Record Payment</button>}
              {previewInvoice.status === 'draft' && <button onClick={() => { handleDelete(previewInvoice._id); setPreviewInvoice(null); }} className="px-4 py-2.5 text-sm rounded-xl border hover:bg-red-50" style={{ borderColor: GHL.border, color: '#dc2626' }}>Delete</button>}
              <button onClick={() => setPreviewInvoice(null)} className="px-4 py-2.5 text-sm rounded-xl border" style={{ borderColor: GHL.border, color: GHL.muted }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowPayment(null)}>
          <div className="bg-white rounded-xl border p-6 w-full max-w-sm shadow-2xl" style={{ borderColor: GHL.border }} onClick={e => e.stopPropagation()}>
            <h4 className="font-bold text-sm mb-4" style={{ color: GHL.text }}>Record Payment</h4>
            <div className="space-y-3">
              <div><label className={lc} style={{ color: GHL.muted }}>Payment Amount ($)</label><input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className={ic + ' text-lg font-bold'} style={{ borderColor: GHL.border }} /></div>
              <div><label className={lc} style={{ color: GHL.muted }}>Payment Method</label><select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className={ic} style={{ borderColor: GHL.border }}><option value="cash">Cash</option><option value="card">Credit Card</option><option value="bank_transfer">Bank Transfer</option><option value="check">Check</option><option value="other">Other</option></select></div>
              <div><label className={lc} style={{ color: GHL.muted }}>Note / Reference</label><input value={paymentNote} onChange={e => setPaymentNote(e.target.value)} placeholder="Payment reference..." className={ic} style={{ borderColor: GHL.border }} /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowPayment(null)} className="px-3 py-1.5 text-xs rounded-lg" style={{ color: GHL.muted }}>Cancel</button>
              <button onClick={() => handlePay(showPayment)} disabled={recording} className="px-4 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ background: GHL.success, opacity: recording ? 0.5 : 1 }}>{recording ? 'Recording...' : 'Record Payment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
