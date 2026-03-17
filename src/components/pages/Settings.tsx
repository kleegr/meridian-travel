'use client';

import { useState, useRef } from 'react';
import axios from 'axios';
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
  packages?: PackageTemplate[];
  locationId?: string | null;
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

const activePipeline = props.pipelines.find((p) => p.id === props.activePipelineId);
const addToList = (list: string[], setList: (v: string[]) => void) => { if (!newItem.trim()) return; setList([...list, newItem.trim()]); setNewItem(''); };
const removeFromList = (list: string[], setList: (v: string[]) => void, idx: number) => { setList(list.filter((_, i) => i !== idx)); };
const addPipeline = () => { if (!newPipelineName.trim()) return; const np: Pipeline = { id: uid(), name: newPipelineName.trim(), stages: ['New', 'In Progress', 'Done'], stageColors: [] }; props.setPipelines([...props.pipelines, np]); props.setActivePipelineId(np.id); setNewPipelineName(''); setShowNewPipeline(false); };
const deletePipeline = (id: number) => { const np = props.pipelines.filter((p) => p.id !== id); props.setPipelines(np); if (props.activePipelineId === id && np.length > 0) props.setActivePipelineId(np[0].id); };
const addStage = () => { if (!newStage.trim() || !activePipeline) return; props.setPipelines(props.pipelines.map((p) => p.id === activePipeline.id ? { ...p, stages: [...p.stages, newStage.trim()] } : p)); setNewStage(''); };
const deleteStage = (idx: number) => { if (!activePipeline) return; const stage = activePipeline.stages[idx]; props.setPipelines(props.pipelines.map((p) => p.id === activePipeline.id ? { ...p, stages: p.stages.filter((_, i) => i !== idx), stageColors: (p.stageColors || []).filter((sc) => sc.stage !== stage) } : p)); };
const handleDragStart = (idx: number) => setDragIdx(idx);
const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); if (dragIdx === null || dragIdx === idx || !activePipeline) return; const stages = [...activePipeline.stages]; const [moved] = stages.splice(dragIdx, 1); stages.splice(idx, 0, moved); props.setPipelines(props.pipelines.map((p) => p.id === activePipeline.id ? { ...p, stages } : p)); setDragIdx(idx); };
const handleDragEnd = () => setDragIdx(null);
const [uploading, setUploading] = useState(false);
const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { alert('Max 2MB'); return; }

  if (props.locationId) {
    // Upload to GHL media library
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('locationId', props.locationId);
      const res = await axios.post('/api/upload', formData);
      if (res.data?.success && res.data?.url) {
        props.setAgencyProfile({ ...props.agencyProfile, logo: res.data.url });
      } else {
        alert('Upload failed');
      }
    } catch (err: any) {
      console.error('Logo upload error:', err);
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  } else {
    // Fallback: base64 for local/no SSO
    const r = new FileReader();
    r.onload = () => { props.setAgencyProfile({ ...props.agencyProfile, logo: r.result as string }); };
    r.readAsDataURL(file);
  }
};
const getStageColor = (stage: string): { color: string; bg: string; dot: string } => { const sc = activePipeline?.stageColors?.find((s) => s.stage === stage); if (sc) return { color: sc.color, bg: sc.bg, dot: sc.color }; const preset = STAGE_COLOR_PRESETS.find((p) => p.label === 'Gray'); return preset || STAGE_COLOR_PRESETS[0]; };
const setStageColor = (stage: string, preset: typeof STAGE_COLOR_PRESETS[0]) => { if (!activePipeline) return; const existing = (activePipeline.stageColors || []).filter((s) => s.stage !== stage); const newColors: StageColor[] = [...existing, { stage, color: preset.color, bg: preset.bg }]; props.setPipelines(props.pipelines.map((p) => p.id === activePipeline.id ? { ...p, stageColors: newColors } : p)); setColorPickerStage(null); };
const addTemplate = () => { if (!newTplName.trim()) return; const nt: ChecklistTemplate = { id: uid(), name: newTplName.trim(), items: [] }; props.setChecklistTemplates([...props.checklistTemplates, nt]); setEditingTplId(nt.id); setNewTplName(''); };
const deleteTemplate = (id: number) => { props.setChecklistTemplates(props.checklistTemplates.filter((t) => t.id !== id)); if (editingTplId === id) setEditingTplId(null); };
const renameTpl = (id: number, name: string) => { props.setChecklistTemplates(props.checklistTemplates.map((t) => t.id === id ? { ...t, name } : t)); };
const addTplItem = () => { if (!newTplItem.trim() || !editingTplId) return; props.setChecklistTemplates(props.checklistTemplates.map((t) => t.id === editingTplId ? { ...t, items: [...t.items, newTplItem.trim()] } : t)); setNewTplItem(''); };
const removeTplItem = (idx: number) => { if (!editingTplId) return; props.setChecklistTemplates(props.checklistTemplates.map((t) => t.id === editingTplId ? { ...t, items: t.items.filter((_, i) => i !== idx) } : t)); };
const startEditItem = (idx: number, text: string) => { setEditingItemIdx(idx); setEditingItemText(text); };
const saveEditItem = () => { if (editingItemIdx === null || !editingTplId) return; props.setChecklistTemplates(props.checklistTemplates.map((t) => t.id === editingTplId ? { ...t, items: t.items.map((item, i) => i === editingItemIdx ? editingItemText.trim() || item : item) } : t)); setEditingItemIdx(null); setEditingItemText(''); };

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

        {sec === 'pipeline' && (<div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}><h3 className="font-bold mb-4" style={{ color: GHL.text }}>Pipelines</h3><Pipelines pipelines={props.pipelines} setPipelines={props.setPipelines} activePipelineId={props.activePipelineId} setActivePipelineId={props.setActivePipelineId} /></div>)}
        {sec === 'financial' && (<div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}><h3 className="font-bold mb-4" style={{ color: GHL.text }}>Financial Configuration</h3><FinancialSettings config={props.financialConfig} setConfig={props.setFinancialConfig} /></div>)}

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
