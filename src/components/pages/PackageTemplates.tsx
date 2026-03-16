'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { uid } from '@/lib/utils';
import type { PackageTemplate } from '@/lib/types';

interface Props {
  packages: PackageTemplate[];
  setPackages: (p: PackageTemplate[]) => void;
  onCreateFromPackage: (pkg: PackageTemplate, mode: 'exact' | 'customize') => void;
  openCreate?: boolean;
  onOpenCreateConsumed?: () => void;
}

const TRIP_TYPES = ['Honeymoon', 'Family', 'Adventure', 'Luxury', 'Budget', 'Business', 'Group', 'Couples', 'Solo', 'Religious', 'Cruise', 'Safari', 'Ski', 'Beach', 'City Break'];

export default function PackageTemplates({ packages, setPackages, onCreateFromPackage, openCreate, onOpenCreateConsumed }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingPkg, setEditingPkg] = useState<PackageTemplate | null>(null);
  const [form, setForm] = useState({ name: '', description: '', destinations: '', duration: '7', tripType: 'Luxury', price: '', priceLabel: '', notes: '' });
  const [checklistItems, setChecklistItems] = useState<string[]>(['Confirm client details', 'Book flights', 'Book hotels', 'Arrange transfers', 'Send itinerary to client']);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [selectedPkg, setSelectedPkg] = useState<PackageTemplate | null>(null);
  const [showCreateConfirm, setShowCreateConfirm] = useState<PackageTemplate | null>(null);
  const [editingCheckIdx, setEditingCheckIdx] = useState<number | null>(null);
  const [editingCheckText, setEditingCheckText] = useState('');

  // Handle external trigger to open create form (from "New Package" dropdown)
  useEffect(() => {
    if (openCreate) {
      resetForm();
      setEditingPkg(null);
      setShowCreate(true);
      onOpenCreateConsumed?.();
    }
  }, [openCreate, onOpenCreateConsumed]);

  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';

  const resetForm = () => {
    setForm({ name: '', description: '', destinations: '', duration: '7', tripType: 'Luxury', price: '', priceLabel: '', notes: '' });
    setChecklistItems(['Confirm client details', 'Book flights', 'Book hotels', 'Arrange transfers', 'Send itinerary to client']);
    setNewCheckItem('');
    setEditingCheckIdx(null);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const pkg: PackageTemplate = {
      id: editingPkg ? editingPkg.id : uid(),
      name: form.name.trim(),
      description: form.description,
      destinations: form.destinations.split(',').map((d) => d.trim()).filter(Boolean),
      duration: parseInt(form.duration) || 7,
      tripType: form.tripType,
      tags: [form.tripType],
      flights: editingPkg?.flights || [], hotels: editingPkg?.hotels || [], transport: editingPkg?.transport || [],
      attractions: editingPkg?.attractions || [], insurance: editingPkg?.insurance || [],
      carRentals: editingPkg?.carRentals || [], davening: editingPkg?.davening || [], mikvah: editingPkg?.mikvah || [],
      checklist: checklistItems.filter(Boolean),
      notes: form.notes,
      price: parseFloat(form.price) || 0,
      priceLabel: form.priceLabel || (form.price ? `From $${parseFloat(form.price).toLocaleString()} per person` : ''),
      created: editingPkg?.created || new Date().toISOString().split('T')[0],
    };
    if (editingPkg) {
      setPackages(packages.map((p) => p.id === editingPkg.id ? pkg : p));
    } else {
      setPackages([...packages, pkg]);
    }
    resetForm(); setShowCreate(false); setEditingPkg(null);
  };

  const startEdit = (pkg: PackageTemplate) => {
    setForm({ name: pkg.name, description: pkg.description, destinations: pkg.destinations.join(', '), duration: String(pkg.duration), tripType: pkg.tripType, price: pkg.price ? String(pkg.price) : '', priceLabel: pkg.priceLabel || '', notes: pkg.notes });
    setChecklistItems(pkg.checklist.length > 0 ? [...pkg.checklist] : ['']);
    setEditingPkg(pkg); setShowCreate(true); setSelectedPkg(null);
  };

  const deletePkg = (id: number) => { if (confirm('Delete this package template?')) { setPackages(packages.filter((p) => p.id !== id)); if (selectedPkg?.id === id) setSelectedPkg(null); } };

  const addCheckItem = () => { if (!newCheckItem.trim()) return; setChecklistItems([...checklistItems, newCheckItem.trim()]); setNewCheckItem(''); };
  const removeCheckItem = (idx: number) => setChecklistItems(checklistItems.filter((_, i) => i !== idx));

  const startEditCheckItem = (idx: number, text: string) => { setEditingCheckIdx(idx); setEditingCheckText(text); };
  const saveEditCheckItem = () => {
    if (editingCheckIdx === null) return;
    setChecklistItems(checklistItems.map((item, i) => i === editingCheckIdx ? (editingCheckText.trim() || item) : item));
    setEditingCheckIdx(null); setEditingCheckText('');
  };

  // Confirmation dialog for creating from package
  if (showCreateConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowCreateConfirm(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-bold mb-2" style={{ color: GHL.text }}>Create from "{showCreateConfirm.name}"</h3>
          <p className="text-sm mb-5" style={{ color: GHL.muted }}>How would you like to create this itinerary?</p>
          <div className="space-y-3">
            <button onClick={() => { onCreateFromPackage(showCreateConfirm, 'exact'); setShowCreateConfirm(null); }} className="w-full p-4 rounded-xl border text-left hover:shadow-md transition-all" style={{ borderColor: GHL.border }}>
              <p className="font-bold text-sm" style={{ color: GHL.text }}>Use Exact Package</p>
              <p className="text-xs mt-0.5" style={{ color: GHL.muted }}>Create itinerary with all package details as-is. You can edit after.</p>
            </button>
            <button onClick={() => { onCreateFromPackage(showCreateConfirm, 'customize'); setShowCreateConfirm(null); }} className="w-full p-4 rounded-xl border text-left hover:shadow-md transition-all" style={{ borderColor: GHL.accent, background: '#f0f5ff' }}>
              <p className="font-bold text-sm" style={{ color: GHL.accent }}>Customize for Client</p>
              <p className="text-xs mt-0.5" style={{ color: GHL.muted }}>Start with package as base, opens in edit mode to adjust for this customer.</p>
            </button>
          </div>
          <button onClick={() => setShowCreateConfirm(null)} className="w-full mt-3 py-2.5 text-sm font-medium rounded-lg" style={{ color: GHL.muted }}>Cancel</button>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-2">
              <button onClick={() => startEdit(selectedPkg)} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border hover:bg-gray-50" style={{ borderColor: GHL.border, color: GHL.accent }}><Icon n="edit" c="w-4 h-4" /> Edit</button>
              <button onClick={() => deletePkg(selectedPkg.id)} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border hover:bg-red-50" style={{ borderColor: GHL.border, color: '#ef4444' }}><Icon n="trash" c="w-4 h-4" /> Delete</button>
              <button onClick={() => setShowCreateConfirm(selectedPkg)} className="inline-flex items-center gap-2 text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90" style={{ background: GHL.accent }}><Icon n="plus" c="w-4 h-4" /> Create Itinerary</button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            {[['Destinations', selectedPkg.destinations.join(', ') || 'Not set'], ['Duration', `${selectedPkg.duration} nights`], ['Trip Type', selectedPkg.tripType], ['Price', selectedPkg.priceLabel || 'Not set'], ['Created', selectedPkg.created]].map(([k, v]) => (<div key={k}><p className="text-xs" style={{ color: GHL.muted }}>{k}</p><p className="font-semibold" style={{ color: GHL.text }}>{v}</p></div>))}
          </div>
          {selectedPkg.notes && <div className="mt-4 p-3 rounded-lg" style={{ background: '#fefce8', border: '1px solid #fde68a' }}><p className="text-xs font-bold" style={{ color: '#d97706' }}>Notes</p><p className="text-sm mt-0.5" style={{ color: '#92400e' }}>{selectedPkg.notes}</p></div>}
          {selectedPkg.checklist.length > 0 && <div className="mt-4 pt-4 border-t" style={{ borderColor: GHL.border }}><p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Default Checklist ({selectedPkg.checklist.length} items)</p><div className="space-y-1">{selectedPkg.checklist.map((item, i) => (<div key={i} className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg group" style={{ background: GHL.bg, color: GHL.text }}><span className="w-5 h-5 rounded border flex items-center justify-center text-[9px] font-bold" style={{ borderColor: GHL.border, color: GHL.muted }}>{i + 1}</span><span className="flex-1">{item}</span><button onClick={() => startEdit(selectedPkg)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-blue-50 transition-opacity" style={{ color: GHL.accent }} title="Edit checklist"><Icon n="edit" c="w-3 h-3" /></button></div>))}</div></div>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold" style={{ color: GHL.text }}>Packages & Templates</h2><p className="text-sm" style={{ color: GHL.muted }}>Reusable itinerary templates for your most popular trips</p></div>
        <button onClick={() => { resetForm(); setEditingPkg(null); setShowCreate(true); }} className="inline-flex items-center gap-2 text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90" style={{ background: GHL.accent }}><Icon n="plus" c="w-4 h-4" /> New Package</button>
      </div>

      {/* Create / Edit form */}
      {showCreate && (
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
          <h3 className="font-semibold mb-4" style={{ color: GHL.text }}>{editingPkg ? 'Edit Package' : 'Create Package Template'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className={lc} style={{ color: GHL.muted }}>Package Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Italy Honeymoon 10 Nights" className={ic} style={{ borderColor: GHL.border }} /></div>
            <div className="col-span-2"><label className={lc} style={{ color: GHL.muted }}>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe what's included..." className={ic + ' resize-none'} rows={2} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Destinations (comma separated)</label><input value={form.destinations} onChange={(e) => setForm({ ...form, destinations: e.target.value })} placeholder="Rome, Florence, Amalfi" className={ic} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Duration (Nights)</label><input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className={ic} style={{ borderColor: GHL.border }} /></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Trip Type</label><select value={form.tripType} onChange={(e) => setForm({ ...form, tripType: e.target.value })} className={ic} style={{ borderColor: GHL.border }}>{TRIP_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div><label className={lc} style={{ color: GHL.muted }}>Starting Price ($)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="5000" className={ic} style={{ borderColor: GHL.border }} /></div>
            <div className="col-span-2"><label className={lc} style={{ color: GHL.muted }}>Price Label</label><input value={form.priceLabel} onChange={(e) => setForm({ ...form, priceLabel: e.target.value })} placeholder="From $5,000 per person" className={ic} style={{ borderColor: GHL.border }} /></div>
            <div className="col-span-2"><label className={lc} style={{ color: GHL.muted }}>Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes about this package..." className={ic + ' resize-none'} rows={2} style={{ borderColor: GHL.border }} /></div>
          </div>

          {/* Checklist builder — with inline edit */}
          <div className="mt-5 pt-5 border-t" style={{ borderColor: GHL.border }}>
            <p className={lc} style={{ color: GHL.muted }}>Package Checklist</p>
            <p className="text-xs mb-3" style={{ color: GHL.muted }}>These items will be added to every itinerary created from this package</p>
            <div className="space-y-1.5 mb-3">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 py-1.5 px-3 rounded-lg" style={{ background: editingCheckIdx === idx ? '#f0f5ff' : GHL.bg }}>
                  <span className="text-xs font-bold w-5 text-center" style={{ color: GHL.muted }}>{idx + 1}</span>
                  {editingCheckIdx === idx ? (
                    <input value={editingCheckText} onChange={(e) => setEditingCheckText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEditCheckItem(); if (e.key === 'Escape') setEditingCheckIdx(null); }} onBlur={saveEditCheckItem} autoFocus className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-200" style={{ borderColor: GHL.accent }} />
                  ) : (
                    <span className="flex-1 text-sm" style={{ color: GHL.text }}>{item}</span>
                  )}
                  {editingCheckIdx !== idx && <button onClick={() => startEditCheckItem(idx, item)} className="p-0.5 rounded hover:bg-blue-50" style={{ color: GHL.muted }} title="Edit item"><Icon n="edit" c="w-3 h-3" /></button>}
                  <button onClick={() => removeCheckItem(idx)} className="p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500" title="Remove item"><Icon n="trash" c="w-3 h-3" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newCheckItem} onChange={(e) => setNewCheckItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCheckItem()} placeholder="Add checklist item..." className={ic + ' flex-1'} style={{ borderColor: GHL.border }} />
              <button onClick={addCheckItem} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add</button>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button onClick={() => { setShowCreate(false); setEditingPkg(null); resetForm(); }} className="px-4 py-2.5 text-sm" style={{ color: GHL.muted }}>Cancel</button>
            <button onClick={handleSave} className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>{editingPkg ? 'Save Changes' : 'Create Package'}</button>
          </div>
        </div>
      )}

      {/* Package Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all" style={{ borderColor: GHL.border }}>
            <div className="h-32 flex items-center justify-center cursor-pointer" style={{ background: 'linear-gradient(135deg, #093168, #1a5298)' }} onClick={() => setSelectedPkg(pkg)}>
              <div className="text-center text-white">
                <p className="text-2xl font-bold">{pkg.destinations[0] || pkg.name}</p>
                <p className="text-xs opacity-60 mt-1">{pkg.duration} Nights \u00b7 {pkg.tripType}</p>
              </div>
            </div>
            <div className="p-4">
              <div className="cursor-pointer" onClick={() => setSelectedPkg(pkg)}>
                <h3 className="font-bold text-sm mb-1" style={{ color: GHL.text }}>{pkg.name}</h3>
                <p className="text-xs mb-2 line-clamp-2" style={{ color: GHL.muted }}>{pkg.description || 'No description'}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">{pkg.tags.map((t) => <span key={t} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: GHL.accentLight, color: GHL.accent }}>{t}</span>)}</div>
                <div className="flex gap-1">
                  <button onClick={(e) => { e.stopPropagation(); startEdit(pkg); }} className="p-1.5 rounded hover:bg-blue-50" style={{ color: GHL.accent }} title="Edit package"><Icon n="edit" c="w-3.5 h-3.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); setShowCreateConfirm(pkg); }} className="p-1.5 rounded hover:bg-green-50" style={{ color: GHL.success }} title="Create itinerary"><Icon n="plus" c="w-3.5 h-3.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); deletePkg(pkg.id); }} className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500" title="Delete package"><Icon n="trash" c="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {pkg.priceLabel && <p className="text-xs font-semibold mt-2" style={{ color: GHL.success }}>{pkg.priceLabel}</p>}
              {pkg.checklist.length > 0 && <p className="text-[10px] mt-1" style={{ color: GHL.muted }}>{pkg.checklist.length} checklist items</p>}
            </div>
          </div>
        ))}
        {packages.length === 0 && !showCreate && (
          <div className="col-span-full bg-white rounded-xl border p-12 text-center" style={{ borderColor: GHL.border }}>
            <Icon n="globe" c="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-semibold" style={{ color: GHL.text }}>No packages yet</p>
            <p className="text-sm mt-1" style={{ color: GHL.muted }}>Create reusable templates for your most popular trips</p>
            <button onClick={() => { resetForm(); setShowCreate(true); }} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg text-white" style={{ background: GHL.accent }}><Icon n="plus" c="w-4 h-4" /> Create First Package</button>
          </div>
        )}
      </div>
    </div>
  );
}
