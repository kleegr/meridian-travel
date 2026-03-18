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
  contactDetails?: { name?: string; email?: string };
  invoiceItems?: { name: string; amount: number; qty: number }[];
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

export default function InvoicesTab({ itin, agencyProfile, locationId, ghlToken }: Props) {
  const [invoices, setInvoices] = useState<GHLInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  const fin = calcFin(itin);
  const [invoiceName, setInvoiceName] = useState(`${itin.title} - Invoice`);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [items, setItems] = useState<{ name: string; amount: number; qty: number }[]>([
    { name: 'Travel Package - ' + itin.title, amount: fin.totalSell, qty: 1 },
  ]);
  const [notes, setNotes] = useState(`Itinerary: ${itin.title}\nDestination: ${(itin.destinations?.length > 1) ? itin.destinations.join(', ') : itin.destination}\nDates: ${fmtDate(itin.startDate)} - ${fmtDate(itin.endDate)}\nPassengers: ${itin.passengers}`);

  const fetchInvoices = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const headers: Record<string, string> = {};
      if (ghlToken) headers['Authorization'] = `Bearer ${ghlToken}`;
      // locationId is optional - server will fallback to any available location
      const params = locationId ? `?locationId=${locationId}` : '';
      const res = await fetch(`/api/ghl-invoices${params}`, { headers });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.invoices) {
        const itinTitle = itin.title.toLowerCase();
        const itinInvoices = (data.invoices || []).filter((inv: any) => {
          const name = (inv.name || '').toLowerCase();
          return name.includes(itinTitle);
        });
        setInvoices(itinInvoices.length > 0 ? itinInvoices : data.invoices?.slice(0, 10) || []);
      } else {
        // Some response but no invoices array - might be empty or different format
        setInvoices([]);
      }
    } catch (err: any) {
      setError('Could not load invoices: ' + (err?.message || 'Network error'));
    }
    setLoading(false);
  }, [locationId, ghlToken, itin.title]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const addItem = () => setItems([...items, { name: '', amount: 0, qty: 1 }]);
  const removeItem = (i: number) => setItems(items.filter((_, j) => j !== i));
  const updateItem = (i: number, key: string, val: any) => setItems(items.map((item, j) => j === i ? { ...item, [key]: val } : item));
  const totalAmount = items.reduce((s, item) => s + (item.amount * item.qty), 0);

  const handleCreateInvoice = async () => {
    setCreating(true); setError('');
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (ghlToken) headers['Authorization'] = `Bearer ${ghlToken}`;

      const invoiceBody: any = {
        altType: 'location',
        name: invoiceName,
        dueDate: dueDate,
        invoiceItems: items.map(item => ({
          name: item.name,
          amount: Math.round(item.amount * 100),
          qty: item.qty,
          description: '',
        })),
        businessDetails: {
          name: agencyProfile.name || 'Kleegr Travel',
          email: agencyProfile.email,
          phone: agencyProfile.phone,
          address: agencyProfile.address,
        },
        currency: 'USD',
        termsNotes: notes,
      };

      // Add locationId if available
      if (locationId) {
        invoiceBody.altId = locationId;
        invoiceBody.locationId = locationId;
      }

      const res = await fetch('/api/ghl-invoices', {
        method: 'POST',
        headers,
        body: JSON.stringify(invoiceBody),
      });
      const data = await res.json();
      
      if (res.ok && (data.invoice || data._id || data.id)) {
        setShowCreate(false);
        fetchInvoices();
      } else {
        const errMsg = data.error || data.message || data.msg || JSON.stringify(data).substring(0, 200);
        setError('Invoice creation failed: ' + errMsg);
      }
    } catch (err: any) {
      setError('Network error: ' + (err?.message || 'Unknown'));
    }
    setCreating(false);
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (ghlToken) headers['Authorization'] = `Bearer ${ghlToken}`;
      await fetch('/api/ghl-invoices', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'send', invoiceId }),
      });
      fetchInvoices();
    } catch {}
  };

  const ic = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-[10px] font-bold uppercase tracking-wider mb-1';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold" style={{ color: GHL.text }}>Invoices & Payments</h3>
          <p className="text-xs" style={{ color: GHL.muted }}>Create and manage GHL invoices for this itinerary</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchInvoices} className="p-2 rounded-lg border hover:bg-gray-50" style={{ borderColor: GHL.border, color: GHL.muted }} title="Refresh">
            <Icon n="globe" c="w-4 h-4" />
          </button>
          <button onClick={() => { setShowCreate(!showCreate); setError(''); }} className="inline-flex items-center gap-2 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 shadow-sm" style={{ background: GHL.accent }}>
            <Icon n="plus" c="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      {/* Financial summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total Sell', value: fmt(fin.totalSell), color: GHL.text, bg: 'white' },
          { label: 'Total Cost', value: fmt(fin.totalCost), color: GHL.muted, bg: 'white' },
          { label: 'Profit', value: fmt(fin.profit), color: GHL.success, bg: '#f0fdf4' },
          { label: 'Balance Due', value: fmt(fin.balance), color: fin.balance > 0 ? GHL.warning : GHL.success, bg: fin.balance > 0 ? '#fffbeb' : '#f0fdf4' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border p-4" style={{ borderColor: GHL.border, background: s.bg }}>
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: GHL.muted }}>{s.label}</p>
            <p className="text-lg font-bold mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {error && <div className="rounded-xl border p-4" style={{ borderColor: '#fca5a5', background: '#fef2f2' }}><p className="text-sm" style={{ color: '#991b1b' }}>{error}</p></div>}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
          <h4 className="font-bold mb-4" style={{ color: GHL.text }}>Create Invoice</h4>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="col-span-2">
              <label className={lc} style={{ color: GHL.muted }}>Invoice Name</label>
              <input value={invoiceName} onChange={e => setInvoiceName(e.target.value)} className={ic} style={{ borderColor: GHL.border }} />
            </div>
            <div>
              <label className={lc} style={{ color: GHL.muted }}>Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={ic} style={{ borderColor: GHL.border }} />
            </div>
            <div>
              <label className={lc} style={{ color: GHL.muted }}>Currency</label>
              <input value="USD" disabled className={ic + ' bg-gray-50'} style={{ borderColor: GHL.border }} />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className={lc} style={{ color: GHL.muted }}>Line Items</label>
              <button onClick={addItem} className="text-[10px] font-semibold px-2 py-1 rounded hover:bg-blue-50" style={{ color: GHL.accent }}>+ Add Item</button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={item.name} onChange={e => updateItem(i, 'name', e.target.value)} placeholder="Description" className={ic + ' flex-1'} style={{ borderColor: GHL.border }} />
                  <input type="number" value={item.amount} onChange={e => updateItem(i, 'amount', parseFloat(e.target.value) || 0)} className={ic + ' w-28 text-right'} style={{ borderColor: GHL.border }} />
                  <input type="number" value={item.qty} onChange={e => updateItem(i, 'qty', parseInt(e.target.value) || 1)} className={ic + ' w-16 text-center'} style={{ borderColor: GHL.border }} />
                  {items.length > 1 && <button onClick={() => removeItem(i)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400"><Icon n="x" c="w-3 h-3" /></button>}
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-3 pt-3 border-t" style={{ borderColor: GHL.border }}>
              <div className="text-right">
                <p className="text-xs" style={{ color: GHL.muted }}>Total</p>
                <p className="text-xl font-bold" style={{ color: GHL.text }}>{fmt(totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className={lc} style={{ color: GHL.muted }}>Notes / Terms</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className={ic + ' resize-none'} style={{ borderColor: GHL.border }} />
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm rounded-lg" style={{ color: GHL.muted }}>Cancel</button>
            <button onClick={handleCreateInvoice} disabled={creating} className="px-5 py-2 text-sm font-semibold text-white rounded-lg hover:opacity-90" style={{ background: GHL.accent, opacity: creating ? 0.5 : 1 }}>
              {creating ? 'Creating...' : 'Create Invoice'}
            </button>
          </div>
        </div>
      )}

      {/* Invoice list */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}>
        <div className="px-5 py-3" style={{ background: GHL.bg }}>
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>Invoice History</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GHL.accent }} />
            <span className="ml-2 text-sm" style={{ color: GHL.muted }}>Loading invoices...</span>
          </div>
        ) : invoices.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: GHL.bg }}>
                {['Invoice #', 'Name', 'Status', 'Amount', 'Paid', 'Due', 'Date', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: GHL.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: GHL.border + '80' }}>
              {invoices.map(inv => {
                const sc = STATUS_COLORS[inv.status] || STATUS_COLORS.draft;
                return (
                  <tr key={inv._id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: GHL.accent }}>{inv.invoiceNumber || '-'}</td>
                    <td className="px-4 py-3 font-medium" style={{ color: GHL.text }}>{inv.name || '-'}</td>
                    <td className="px-4 py-3"><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize" style={{ background: sc.bg, color: sc.color }}>{inv.status}</span></td>
                    <td className="px-4 py-3 font-semibold" style={{ color: GHL.text }}>{fmt((inv.total || 0) / 100)}</td>
                    <td className="px-4 py-3" style={{ color: GHL.success }}>{fmt((inv.amountPaid || 0) / 100)}</td>
                    <td className="px-4 py-3 font-semibold" style={{ color: (inv.amountDue || 0) > 0 ? GHL.warning : GHL.success }}>{fmt((inv.amountDue || 0) / 100)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: GHL.muted }}>{inv.createdAt ? fmtDate(inv.createdAt.split('T')[0]) : '-'}</td>
                    <td className="px-4 py-3">
                      {inv.status === 'draft' && <button onClick={() => handleSendInvoice(inv._id)} className="text-[10px] font-semibold px-2 py-1 rounded hover:bg-blue-50" style={{ color: GHL.accent }}>Send</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8">
            <Icon n="dollar" c="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium" style={{ color: GHL.text }}>No invoices yet</p>
            <p className="text-xs mt-1" style={{ color: GHL.muted }}>Create your first invoice for this itinerary</p>
          </div>
        )}
      </div>
    </div>
  );
}
