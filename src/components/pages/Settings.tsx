'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import Pipelines from './Pipelines';
import FinancialSettings from './FinancialSettings';
import { uid } from '@/lib/utils';
import type { Pipeline, AgencyProfile, CustomField, ChecklistTemplate, FinancialConfig, PackageTemplate, FeatureFlags, DashWidget } from '@/lib/types';
import { DEFAULT_FEATURE_FLAGS } from '@/lib/types';

interface Props {
  bookingSources: string[]; setBookingSources: (v: string[]) => void;
  suppliers: string[]; setSuppliers: (v: string[]) => void;
  pipelines: Pipeline[]; setPipelines: (v: Pipeline[]) => void;
  activePipelineId: number; setActivePipelineId: (v: number) => void;
  agencyProfile: AgencyProfile; setAgencyProfile: (v: AgencyProfile) => void;
  customFields: CustomField[]; setCustomFields: (v: CustomField[]) => void;
  checklistTemplates: ChecklistTemplate[]; setChecklistTemplates: (v: ChecklistTemplate[]) => void;
  financialConfig: FinancialConfig; setFinancialConfig: (v: FinancialConfig) => void;
  packages: PackageTemplate[];
  featureFlags?: FeatureFlags; setFeatureFlags?: (v: FeatureFlags) => void;
  dashWidgets?: DashWidget[]; setDashWidgets?: (v: DashWidget[]) => void;
}

const SECTIONS = [
  { id: 'agency', label: 'Agency Profile', icon: 'user', desc: 'Company info' },
  { id: 'features', label: 'Feature Control', icon: 'settings', desc: 'Toggle features' },
  { id: 'dashboard', label: 'Dashboard', icon: 'grid', desc: 'Widget visibility' },
  { id: 'pipeline', label: 'Pipelines', icon: 'pipeline', desc: 'Workflow stages' },
  { id: 'financial', label: 'Financial Config', icon: 'dollar', desc: 'Pricing rules' },
  { id: 'checklist', label: 'Checklists', icon: 'checkSquare', desc: 'Task templates' },
  { id: 'sources', label: 'Sources', icon: 'globe', desc: 'Booking sources' },
  { id: 'suppliers', label: 'Suppliers', icon: 'star', desc: 'Service providers' },
];

const FEATURES = [
  { key: 'marketingEnabled', label: 'Marketing Studio', desc: 'Create branded ads and graphics', icon: 'star', cat: 'Navigation' },
  { key: 'automationsEnabled', label: 'Automations', desc: 'Auto-trigger actions on events', icon: 'bell', cat: 'Navigation' },
  { key: 'packagesEnabled', label: 'Packages', desc: 'Reusable trip templates', icon: 'globe', cat: 'Navigation' },
  { key: 'aiSuggestionsEnabled', label: 'AI Suggestions', desc: 'AI-powered recommendations in itinerary', icon: 'search', cat: 'Itinerary Tabs' },
  { key: 'mapViewEnabled', label: 'Map View', desc: 'Interactive map on itineraries', icon: 'map', cat: 'Itinerary Tabs' },
  { key: 'shareableTripPageEnabled', label: 'Client Itinerary', desc: 'Shareable client trip page', icon: 'print', cat: 'Itinerary Tabs' },
  { key: 'destinationInfoEnabled', label: 'Destination Info', desc: 'Destination details tab in itinerary', icon: 'globe', cat: 'Itinerary Tabs' },
  { key: 'blastRadiusEnabled', label: 'Blast Radius', desc: 'Impact analysis for changes', icon: 'bell', cat: 'Itinerary Tabs' },
  { key: 'financialsTabEnabled', label: 'Financials Tab', desc: 'Revenue/cost/profit in itinerary', icon: 'dollar', cat: 'Itinerary Tabs' },
  { key: 'showStatsBar', label: 'Stats Bar', desc: 'Revenue/profit bar on itinerary header', icon: 'trend', cat: 'Itinerary Display' },
];

export default function Settings(props: Props) {
  const [sec, setSec] = useState('agency');
  const [flags, setFlags] = useState<FeatureFlags>(props.featureFlags || DEFAULT_FEATURE_FLAGS);
  const [editTplId, setEditTplId] = useState<number | null>(null);
  const [editTplName, setEditTplName] = useState('');
  const [editTplItems, setEditTplItems] = useState<string[]>([]);

  const updateFlag = (key: string, val: boolean) => { const next = { ...flags, [key]: val }; setFlags(next); props.setFeatureFlags?.(next); };
  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';

  const startEditTpl = (tpl: ChecklistTemplate) => { setEditTplId(tpl.id); setEditTplName(tpl.name); setEditTplItems([...tpl.items]); };
  const saveTpl = () => { if (!editTplId) return; props.setChecklistTemplates(props.checklistTemplates.map(t => t.id === editTplId ? { ...t, name: editTplName, items: editTplItems.filter(Boolean) } : t)); setEditTplId(null); };
  const addTpl = () => { const id = uid(); const tpl: ChecklistTemplate = { id, name: 'New Template', items: ['Task 1'] }; props.setChecklistTemplates([...props.checklistTemplates, tpl]); startEditTpl(tpl); };
  const delTpl = (id: number) => { if (!confirm('Delete this template?')) return; props.setChecklistTemplates(props.checklistTemplates.filter(t => t.id !== id)); if (editTplId === id) setEditTplId(null); };

  return (
    <div className="space-y-0">
      <div className="mb-5"><h2 className="text-2xl font-bold" style={{ color: GHL.text }}>Settings</h2><p className="text-sm mt-0.5" style={{ color: GHL.muted }}>Manage your agency and preferences</p></div>
      <div className="flex gap-5" style={{ minHeight: 480 }}>
        <div className="w-[200px] flex-shrink-0">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}>
            {SECTIONS.map((s, i) => (
              <button key={s.id} onClick={() => setSec(s.id)} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors" style={{ background: sec === s.id ? GHL.accentLight : 'white', borderBottom: i < SECTIONS.length - 1 ? `1px solid ${GHL.border}` : 'none' }}>
                <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: sec === s.id ? GHL.accent : GHL.bg, color: sec === s.id ? 'white' : GHL.muted }}><Icon n={s.icon} c="w-3.5 h-3.5" /></span>
                <div className="min-w-0"><p className="text-[11px] font-semibold truncate" style={{ color: sec === s.id ? GHL.accent : GHL.text }}>{s.label}</p></div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {sec === 'agency' && (
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
              <h3 className="font-bold mb-4" style={{ color: GHL.text }}>Agency Profile</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className={lc} style={{ color: GHL.muted }}>Agency Name</label><input value={props.agencyProfile.name} onChange={e => props.setAgencyProfile({ ...props.agencyProfile, name: e.target.value })} className={ic} style={{ borderColor: GHL.border }} /></div>
                <div><label className={lc} style={{ color: GHL.muted }}>Email</label><input value={props.agencyProfile.email} onChange={e => props.setAgencyProfile({ ...props.agencyProfile, email: e.target.value })} className={ic} style={{ borderColor: GHL.border }} /></div>
                <div><label className={lc} style={{ color: GHL.muted }}>Phone</label><input value={props.agencyProfile.phone} onChange={e => props.setAgencyProfile({ ...props.agencyProfile, phone: e.target.value })} className={ic} style={{ borderColor: GHL.border }} /></div>
                <div className="col-span-2"><label className={lc} style={{ color: GHL.muted }}>Address</label><input value={props.agencyProfile.address} onChange={e => props.setAgencyProfile({ ...props.agencyProfile, address: e.target.value })} className={ic} style={{ borderColor: GHL.border }} /></div>
              </div>
            </div>
          )}

          {sec === 'features' && (
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
              <h3 className="font-bold mb-1" style={{ color: GHL.text }}>Feature Control</h3>
              <p className="text-xs mb-5" style={{ color: GHL.muted }}>Toggle features on/off. Disabled features are hidden from navigation and itinerary tabs.</p>
              {['Navigation', 'Itinerary Tabs', 'Itinerary Display'].map(cat => {
                const items = FEATURES.filter(f => f.cat === cat);
                if (!items.length) return null;
                return (<div key={cat} className="mb-5 last:mb-0"><p className="text-[10px] font-bold uppercase tracking-wider mb-2 px-1" style={{ color: GHL.muted }}>{cat}</p><div className="space-y-1.5">{items.map(feat => { const on = (flags as any)[feat.key] ?? true; return (<div key={feat.key} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: on ? GHL.accent + '30' : GHL.border, background: on ? GHL.accentLight + '30' : 'white' }}><span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: on ? GHL.accent : GHL.bg, color: on ? 'white' : GHL.muted }}><Icon n={feat.icon} c="w-4 h-4" /></span><div className="flex-1 min-w-0"><p className="text-sm font-semibold" style={{ color: GHL.text }}>{feat.label}</p><p className="text-[10px]" style={{ color: GHL.muted }}>{feat.desc}</p></div><button onClick={() => updateFlag(feat.key, !on)} className="w-11 h-6 rounded-full transition-colors flex-shrink-0 relative" style={{ background: on ? GHL.accent : '#d1d5db' }}><div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all" style={{ left: on ? 20 : 2 }} /></button></div>); })}</div></div>);
              })}
            </div>
          )}

          {sec === 'dashboard' && (
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
              <h3 className="font-bold mb-1" style={{ color: GHL.text }}>Dashboard Widgets</h3>
              <p className="text-xs mb-5" style={{ color: GHL.muted }}>Control which widgets appear on your dashboard</p>
              <div className="space-y-1.5">
                {(props.dashWidgets || []).map(w => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-xl border" style={{ borderColor: w.enabled ? GHL.accent + '30' : GHL.border, background: w.enabled ? GHL.accentLight + '30' : 'white' }}>
                    <span className="text-sm font-medium" style={{ color: GHL.text }}>{w.label}</span>
                    <button onClick={() => props.setDashWidgets?.((props.dashWidgets || []).map(x => x.id === w.id ? { ...x, enabled: !x.enabled } : x))} className="w-11 h-6 rounded-full transition-colors flex-shrink-0 relative" style={{ background: w.enabled ? GHL.accent : '#d1d5db' }}><div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all" style={{ left: w.enabled ? 20 : 2 }} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sec === 'pipeline' && (<div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}><h3 className="font-bold mb-4" style={{ color: GHL.text }}>Pipelines</h3><Pipelines pipelines={props.pipelines} onUpdate={props.setPipelines} /></div>)}
          {sec === 'financial' && (<div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}><h3 className="font-bold mb-4" style={{ color: GHL.text }}>Financial Configuration</h3><FinancialSettings config={props.financialConfig} onChange={props.setFinancialConfig} /></div>)}

          {sec === 'checklist' && (
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold" style={{ color: GHL.text }}>Checklist Templates</h3>
                <button onClick={addTpl} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: GHL.accent }}>+ Add Template</button>
              </div>
              {editTplId ? (
                <div className="rounded-xl border p-4" style={{ borderColor: GHL.accent, background: GHL.accentLight + '30' }}>
                  <input value={editTplName} onChange={e => setEditTplName(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm font-semibold mb-3 focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: GHL.border }} placeholder="Template name" />
                  <div className="space-y-1.5 mb-3">
                    {editTplItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input value={item} onChange={e => { const n = [...editTplItems]; n[i] = e.target.value; setEditTplItems(n); }} className="flex-1 px-2.5 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-200" style={{ borderColor: GHL.border }} placeholder="Task description" />
                        <button onClick={() => setEditTplItems(editTplItems.filter((_, j) => j !== i))} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400"><Icon n="x" c="w-3 h-3" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditTplItems([...editTplItems, ''])} className="text-[10px] font-semibold px-2 py-1 rounded hover:bg-blue-50" style={{ color: GHL.accent }}>+ Add Item</button>
                    <div className="flex-1" />
                    <button onClick={() => setEditTplId(null)} className="text-xs px-3 py-1.5 rounded-lg" style={{ color: GHL.muted }}>Cancel</button>
                    <button onClick={saveTpl} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: GHL.accent }}>Save</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {props.checklistTemplates.map(tpl => (
                    <div key={tpl.id} className="flex items-center gap-3 p-3 rounded-xl border group hover:shadow-sm transition-all" style={{ borderColor: GHL.border }}>
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: GHL.accentLight, color: GHL.accent }}><Icon n="checkSquare" c="w-4 h-4" /></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold" style={{ color: GHL.text }}>{tpl.name}</p>
                        <p className="text-[10px]" style={{ color: GHL.muted }}>{tpl.items.length} items</p>
                      </div>
                      <button onClick={() => startEditTpl(tpl)} className="p-1.5 rounded hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: GHL.accent }}><Icon n="edit" c="w-3.5 h-3.5" /></button>
                      <button onClick={() => delTpl(tpl.id)} className="p-1.5 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400"><Icon n="trash" c="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  {props.checklistTemplates.length === 0 && <p className="text-sm text-center py-4" style={{ color: GHL.muted }}>No templates yet</p>}
                </div>
              )}
            </div>
          )}

          {sec === 'sources' && (<div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}><h3 className="font-bold mb-4" style={{ color: GHL.text }}>Booking Sources</h3><div className="flex flex-wrap gap-2">{props.bookingSources.map((s, i) => (<div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: GHL.border, background: GHL.bg }}><span className="text-sm" style={{ color: GHL.text }}>{s}</span><button onClick={() => props.setBookingSources(props.bookingSources.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400"><Icon n="x" c="w-3 h-3" /></button></div>))}<button onClick={() => { const v = prompt('New source:'); if (v) props.setBookingSources([...props.bookingSources, v]); }} className="px-3 py-2 rounded-lg border-2 border-dashed text-xs font-medium" style={{ borderColor: GHL.border, color: GHL.accent }}>+ Add</button></div></div>)}
          {sec === 'suppliers' && (<div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}><h3 className="font-bold mb-4" style={{ color: GHL.text }}>Suppliers</h3><div className="flex flex-wrap gap-2">{props.suppliers.map((s, i) => (<div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: GHL.border, background: GHL.bg }}><span className="text-sm" style={{ color: GHL.text }}>{s}</span><button onClick={() => props.setSuppliers(props.suppliers.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400"><Icon n="x" c="w-3 h-3" /></button></div>))}<button onClick={() => { const v = prompt('New supplier:'); if (v) props.setSuppliers([...props.suppliers, v]); }} className="px-3 py-2 rounded-lg border-2 border-dashed text-xs font-medium" style={{ borderColor: GHL.border, color: GHL.accent }}>+ Add</button></div></div>)}
        </div>
      </div>
    </div>
  );
}