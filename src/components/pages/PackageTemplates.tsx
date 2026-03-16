'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { uid, fmtDate } from '@/lib/utils';
import type { PackageTemplate, Itinerary } from '@/lib/types';

interface Props {
  packages: PackageTemplate[];
  setPackages: (p: PackageTemplate[]) => void;
  onCreateFromPackage: (pkg: PackageTemplate) => void;
}

const TRIP_TYPES = ['Honeymoon', 'Family', 'Adventure', 'Luxury', 'Budget', 'Business', 'Group', 'Couples', 'Solo', 'Religious', 'Cruise', 'Safari', 'Ski', 'Beach', 'City Break'];

export default function PackageTemplates({ packages, setPackages, onCreateFromPackage }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', destinations: '', duration: '7', tripType: 'Luxury', price: '', priceLabel: '' });
  const [selectedPkg, setSelectedPkg] = useState<PackageTemplate | null>(null);

  const handleCreate = () => {
    if (!form.name.trim()) return;
    const pkg: PackageTemplate = {
      id: uid(),
      name: form.name.trim(),
      description: form.description,
      destinations: form.destinations.split(',').map((d) => d.trim()).filter(Boolean),
      duration: parseInt(form.duration) || 7,
      tripType: form.tripType,
      tags: [form.tripType],
      flights: [], hotels: [], transport: [], attractions: [], insurance: [], carRentals: [], davening: [], mikvah: [],
      checklist: ['Confirm client details', 'Book flights', 'Book hotels', 'Arrange transfers', 'Send itinerary to client'],
      notes: '',
      price: parseFloat(form.price) || 0,
      priceLabel: form.priceLabel || `From $${form.price || '0'} per person`,
      created: new Date().toISOString().split('T')[0],
    };
    setPackages([...packages, pkg]);
    setForm({ name: '', description: '', destinations: '', duration: '7', tripType: 'Luxury', price: '', priceLabel: '' });
    setShowCreate(false);
  };

  const deletePkg = (id: number) => { if (confirm('Delete this package?')) setPackages(packages.filter((p) => p.id !== id)); };

  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';

  if (selectedPkg) {
    return (
      <div className="space-y-5">
        <button onClick={() => setSelectedPkg(null)} className="inline-flex items-center gap-2 text-sm" style={{ color: GHL.muted }}><Icon n="back" c="w-4 h-4" /> Back to Packages</button>
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold" style={{ color: GHL.text }}>{selectedPkg.name}</h3>
              <p className="text-sm mt-1" style={{ color: GHL.muted }}>{selectedPkg.description}</p>
            </div>
            <button onClick={() => onCreateFromPackage(selectedPkg)} className="inline-flex items-center gap-2 text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90" style={{ background: GHL.accent }}><Icon n="plus" c="w-4 h-4" /> Create Itinerary from Package</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-xs" style={{ color: GHL.muted }}>Destinations</p><p className="font-semibold" style={{ color: GHL.text }}>{selectedPkg.destinations.join(', ') || 'Not set'}</p></div>
            <div><p className="text-xs" style={{ color: GHL.muted }}>Duration</p><p className="font-semibold" style={{ color: GHL.text }}>{selectedPkg.duration} nights</p></div>
            <div><p className="text-xs" style={{ color: GHL.muted }}>Trip Type</p><p className="font-semibold" style={{ color: GHL.text }}>{selectedPkg.tripType}</p></div>
            <div><p className="text-xs" style={{ color: GHL.muted }}>Price</p><p className="font-semibold" style={{ color: GHL.text }}>{selectedPkg.priceLabel || 'Not set'}</p></div>
          </div>
          {selectedPkg.checklist.length > 0 && <div className="mt-4 pt-4 border-t" style={{ borderColor: GHL.border }}><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Default Checklist</p><div className="space-y-1">{selectedPkg.checklist.map((item, i) => (<div key={i} className="flex items-center gap-2 text-sm py-1" style={{ color: GHL.text }}><span className="w-4 h-4 rounded border flex items-center justify-center text-[8px] font-bold" style={{ borderColor: GHL.border, color: GHL.muted }}>{i + 1}</span>{item}</div>))}</div></div>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold" style={{ color: GHL.text }}>Packages & Templates</h2><p className="text-sm" style={{ color: GHL.muted }}>Reusable itinerary templates for your most popular trips</p></div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90" style={{ background: GHL.accent }}><Icon n="plus" c="w-4 h-4" /> New Package</button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
          <h3 className="font-semibold mb-4" style={{ color: GHL.text }}>Create Package Template</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className={lc} style={{ color: GHL.muted }}>Package Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Italy Honeymoon 10 Nights" className={ic} style={{ borderColor: GHL.border }} /></div>
            <div className="col-span-2"><label className={lc} style={{ color: GHL.muted }}>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what's included in this package..." className={ic + ' resize-none'} rows={2} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Destinations</label><input value={form.destinations} onChange={(e) => setForm({ ...form, destinations: e.target.value })} placeholder="Rome, Florence, Amalfi" className={ic} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Duration (Nights)</label><input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className={ic} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Trip Type</label><select value={form.tripType} onChange={(e) => setForm({ ...form, tripType: e.target.value })} className={ic} style={{ borderColor: GHL.border }}>{TRIP_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Starting Price ($)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="5000" className={ic} style={{ borderColor: GHL.border }} /></div>
          </div>
          <div className="flex justify-end gap-3 mt-4"><button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm" style={{ color: GHL.muted }}>Cancel</button><button onClick={handleCreate} className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Create Package</button></div>
        </div>
      )}

      {/* Package Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer" style={{ borderColor: GHL.border }} onClick={() => setSelectedPkg(pkg)}>
            <div className="h-32 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #093168, #1a5298)' }}>
              <div className="text-center text-white">
                <p className="text-2xl font-bold">{pkg.destinations[0] || pkg.name}</p>
                <p className="text-xs opacity-60 mt-1">{pkg.duration} Nights · {pkg.tripType}</p>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-sm mb-1" style={{ color: GHL.text }}>{pkg.name}</h3>
              <p className="text-xs mb-2 line-clamp-2" style={{ color: GHL.muted }}>{pkg.description || 'No description'}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">{pkg.tags.map((t) => <span key={t} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: GHL.accentLight, color: GHL.accent }}>{t}</span>)}</div>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); onCreateFromPackage(pkg); }} className="p-1.5 rounded hover:bg-blue-50" style={{ color: GHL.accent }} title="Create itinerary from this package"><Icon n="plus" c="w-3.5 h-3.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); deletePkg(pkg.id); }} className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500" title="Delete package"><Icon n="trash" c="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {pkg.priceLabel && <p className="text-xs font-semibold mt-2" style={{ color: GHL.success }}>{pkg.priceLabel}</p>}
            </div>
          </div>
        ))}
        {packages.length === 0 && !showCreate && (
          <div className="col-span-full bg-white rounded-xl border p-12 text-center" style={{ borderColor: GHL.border }}>
            <Icon n="globe" c="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-semibold" style={{ color: GHL.text }}>No packages yet</p>
            <p className="text-sm mt-1" style={{ color: GHL.muted }}>Create reusable templates for your most popular trips</p>
            <button onClick={() => setShowCreate(true)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg text-white" style={{ background: GHL.accent }}><Icon n="plus" c="w-4 h-4" /> Create First Package</button>
          </div>
        )}
      </div>
    </div>
  );
}
