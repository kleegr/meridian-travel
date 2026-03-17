'use client';

import { useState, useRef } from 'react';
import axios from 'axios';
import { Icon } from '@/components/ui';
import { GHL, STAGE_COLOR_PRESETS } from '@/lib/constants';
import { uid } from '@/lib/utils';
import FinancialSettings from './FinancialSettings';
import type { AgencyProfile, CustomField, Pipeline, ChecklistTemplate, StageColor, FinancialConfig, PackageTemplate } from '@/lib/types';

interface SettingsProps {
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
  ['Agency Profile', 'Company name, logo, contact details', 'globe'],
  ['Financial Settings', 'Pricing mode, markups & display', 'dollar'],
  ['Pipelines & Stages', 'Board columns, stage colors & workflow', 'kanban'],
  ['Checklist Templates', 'Create named checklists to use in itineraries', 'check'],
  ['Custom Fields', 'Add extra fields to any module', 'edit'],
  ['Booking Sources', 'GDS, OTA, direct channels', 'plane'],
  ['Supplier Directory', 'Preferred suppliers list', 'hotel'],
];

export default function Settings(props: SettingsProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');
  const [newPipelineName, setNewPipelineName] = useState('');
  const [showNewPipeline, setShowNewPipeline] = useState(false);
  const [newStage, setNewStage] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [colorPickerStage, setColorPickerStage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [editingTplId, setEditingTplId] = useState<number | null>(null);
  const [newTplName, setNewTplName] = useState('');
  const [newTplItem, setNewTplItem] = useState('');
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [editingItemText, setEditingItemText] = useState('');

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

  // Import a package checklist as a new template
  const importPackageChecklist = (pkg: PackageTemplate) => {
    const nt: ChecklistTemplate = { id: uid(), name: `${pkg.name} Checklist`, items: [...pkg.checklist] };
    props.setChecklistTemplates([...props.checklistTemplates, nt]);
    setEditingTplId(nt.id);
  };

  if (activeSection) {
    return (
      <div className="space-y-5">
        <button onClick={() => { setActiveSection(null); setNewItem(''); setEditingTplId(null); setColorPickerStage(null); setEditingItemIdx(null); }} className="inline-flex items-center gap-2 text-sm hover:opacity-80" style={{ color: GHL.muted }}><Icon n="back" c="w-4 h-4" /> Back to Settings</button>

        {activeSection === 'Agency Profile' && <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}><h3 className="font-semibold mb-1 text-lg" style={{ color: GHL.text }}>Agency Profile</h3><p className="text-sm mb-6" style={{ color: GHL.muted }}>Appears on all itineraries and PDFs</p><div className="mb-6"><label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Company Logo</label><div className="flex items-center gap-4"><div className="w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-300" style={{ borderColor: props.agencyProfile.logo ? GHL.accent : GHL.border, background: props.agencyProfile.logo ? 'white' : GHL.bg }} onClick={() => fileRef.current?.click()}>{props.agencyProfile.logo ? <img src={props.agencyProfile.logo} alt="" className="w-full h-full object-contain p-2" /> : <div className="text-center"><Icon n="plus" c="w-6 h-6 mx-auto" /><p className="text-[9px] mt-1" style={{ color: GHL.muted }}>Upload</p></div>}</div><div><button onClick={() => fileRef.current?.click()} className="text-sm font-medium px-4 py-2 rounded-lg border hover:bg-gray-50" style={{ borderColor: GHL.border, color: GHL.accent }}>{props.agencyProfile.logo ? 'Change' : 'Upload'}</button>{props.agencyProfile.logo && <button onClick={() => props.setAgencyProfile({ ...props.agencyProfile, logo: '' })} className="text-sm ml-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-600">Remove</button>}<p className="text-[10px] mt-1.5" style={{ color: GHL.muted }}>PNG, JPG, SVG. Max 2MB.</p></div><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /></div></div><div className="grid grid-cols-2 gap-4">{[['name', 'Agency Name'], ['email', 'Email'], ['phone', 'Phone'], ['address', 'Address']].map(([k, l]) => (<div key={k}><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GHL.muted }}>{l}</label><input value={(props.agencyProfile as any)[k]} onChange={(e) => props.setAgencyProfile({ ...props.agencyProfile, [k]: e.target.value })} className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: GHL.border }} /></div>))}</div></div>}

        {activeSection === 'Financial Settings' && <FinancialSettings config={props.financialConfig} onChange={props.setFinancialConfig} />}

        {activeSection === 'Pipelines & Stages' && <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
          <div className="flex items-center justify-between mb-4"><div><h3 className="font-semibold text-lg" style={{ color: GHL.text }}>Pipelines &amp; Stages</h3><p className="text-sm" style={{ color: GHL.muted }}>Drag to reorder. Click the color dot to change stage color.</p></div><button onClick={() => setShowNewPipeline(true)} className="inline-flex items-center gap-2 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90" style={{ background: GHL.accent }}><Icon n="plus" c="w-4 h-4" /> New Pipeline</button></div>
          {showNewPipeline && <div className="flex gap-3 mb-4 p-3 rounded-lg" style={{ background: GHL.bg }}><input value={newPipelineName} onChange={(e) => setNewPipelineName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPipeline()} placeholder="Pipeline name..." className="flex-1 px-3 py-2 border rounded-lg text-sm" style={{ borderColor: GHL.border }} /><button onClick={addPipeline} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Create</button><button onClick={() => setShowNewPipeline(false)} className="px-3 py-2 text-sm" style={{ color: GHL.muted }}>Cancel</button></div>}
          <div className="flex gap-2 flex-wrap mb-4">{props.pipelines.map((p) => (<button key={p.id} onClick={() => props.setActivePipelineId(p.id)} className="px-4 py-2 rounded-lg text-sm font-medium" style={props.activePipelineId === p.id ? { background: GHL.accent, color: 'white' } : { background: GHL.bg, color: GHL.muted, border: `1px solid ${GHL.border}` }}>{p.name} ({p.stages.length})</button>))}</div>
          {activePipeline && <div>
            <div className="flex items-center justify-between mb-3"><p className="text-sm font-semibold" style={{ color: GHL.text }}>{activePipeline.name} — Stages</p>{props.pipelines.length > 1 && <button onClick={() => deletePipeline(activePipeline.id)} className="text-xs text-red-400 hover:text-red-600">Delete Pipeline</button>}</div>
            <div className="space-y-2">{activePipeline.stages.map((stage, idx) => { const sc = getStageColor(stage); const isPickerOpen = colorPickerStage === stage; return (<div key={idx}><div draggable onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDragEnd={handleDragEnd} className="flex items-center gap-3 p-3 rounded-lg border cursor-grab" style={{ borderColor: GHL.border, opacity: dragIdx === idx ? 0.5 : 1 }}><span style={{ color: GHL.muted }}><Icon n="grip" c="w-4 h-4" /></span><button onClick={() => setColorPickerStage(isPickerOpen ? null : stage)} className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border-2 transition-all hover:scale-110" style={{ background: sc.bg, borderColor: sc.color, color: sc.color }} title="Change color">{idx + 1}</button><span className="flex-1 font-medium text-sm" style={{ color: GHL.text }}>{stage}</span><span className="text-[9px] font-semibold px-2 py-0.5 rounded" style={{ background: sc.bg, color: sc.color }}>{stage}</span><button onClick={() => deleteStage(idx)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-3.5 h-3.5" /></button></div>{isPickerOpen && <div className="ml-12 mt-1 mb-2 p-3 rounded-lg border" style={{ borderColor: GHL.border, background: '#fafbfc' }}><p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Pick color for &quot;{stage}&quot;</p><div className="flex flex-wrap gap-2">{STAGE_COLOR_PRESETS.map((preset) => (<button key={preset.label} onClick={() => setStageColor(stage, preset)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:scale-105" style={{ background: preset.bg, borderColor: preset.color + '40', color: preset.color }}><span className="w-3 h-3 rounded-full" style={{ background: preset.dot }} />{preset.label}</button>))}</div></div>}</div>); })}</div>
            <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: GHL.border }}><input value={newStage} onChange={(e) => setNewStage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addStage()} placeholder="Add stage..." className="flex-1 px-3 py-2.5 border rounded-lg text-sm" style={{ borderColor: GHL.border }} /><button onClick={addStage} className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add</button></div>
          </div>}
        </div>}

        {/* CHECKLIST TEMPLATES — with package import and edit button on each item */}
        {activeSection === 'Checklist Templates' && <div className="space-y-5">
          {/* Import from Packages */}
          {props.packages && props.packages.length > 0 && (
            <div className="bg-white rounded-xl border p-5 shadow-sm" style={{ borderColor: GHL.border }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Import from Packages</p>
              <p className="text-xs mb-3" style={{ color: GHL.muted }}>Add a package&apos;s checklist as a reusable template</p>
              <div className="flex flex-wrap gap-2">
                {props.packages.filter((pkg) => pkg.checklist.length > 0).map((pkg) => (
                  <button key={pkg.id} onClick={() => importPackageChecklist(pkg)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border hover:shadow-sm transition-all" style={{ borderColor: GHL.border, color: GHL.text, background: 'white' }}>
                    <span className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#10b981' }}>{pkg.checklist.length}</span>
                    {pkg.name}
                    <Icon n="plus" c="w-3 h-3" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}><div className="flex items-center justify-between mb-4"><div><h3 className="font-semibold text-lg" style={{ color: GHL.text }}>Checklist Templates</h3><p className="text-sm" style={{ color: GHL.muted }}>Create and edit checklists. Click a template to expand and edit its items.</p></div></div><div className="space-y-2 mb-4">{props.checklistTemplates.map((tpl) => (<div key={tpl.id} className="rounded-lg border overflow-hidden" style={{ borderColor: editingTplId === tpl.id ? GHL.accent : GHL.border }}><div className="flex items-center justify-between px-4 py-3 cursor-pointer" style={{ background: editingTplId === tpl.id ? '#f0f5ff' : GHL.bg }} onClick={() => { setEditingTplId(editingTplId === tpl.id ? null : tpl.id); setEditingItemIdx(null); }}><div className="flex items-center gap-3"><span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: GHL.accent }}>{tpl.items.length}</span><div><p className="font-semibold text-sm" style={{ color: GHL.text }}>{tpl.name}</p><p className="text-[10px]" style={{ color: GHL.muted }}>{tpl.items.length} items</p></div></div><div className="flex items-center gap-2"><button onClick={(e) => { e.stopPropagation(); setEditingTplId(tpl.id); setEditingItemIdx(null); }} className="p-1 rounded hover:bg-blue-50" style={{ color: GHL.accent }} title="Edit template"><Icon n="edit" c="w-3.5 h-3.5" /></button><button onClick={(e) => { e.stopPropagation(); deleteTemplate(tpl.id); }} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500" title="Delete template"><Icon n="trash" c="w-3.5 h-3.5" /></button><Icon n={editingTplId === tpl.id ? 'chevronDown' : 'chevronRight'} c="w-4 h-4" /></div></div>
          {editingTplId === tpl.id && <div className="px-4 py-4 border-t" style={{ borderColor: GHL.border }}>
            <div className="mb-4"><label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Template Name</label><input value={tpl.name} onChange={(e) => renameTpl(tpl.id, e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: GHL.border }} /></div>
            <div className="space-y-1.5 mb-3">{tpl.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 py-1.5 px-3 rounded-lg" style={{ background: editingItemIdx === idx ? '#f0f5ff' : GHL.bg }}>
                <span className="text-xs font-bold w-5 text-center" style={{ color: GHL.muted }}>{idx + 1}</span>
                {editingItemIdx === idx ? (
                  <input value={editingItemText} onChange={(e) => setEditingItemText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveEditItem(); if (e.key === 'Escape') setEditingItemIdx(null); }} onBlur={saveEditItem} autoFocus className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-200" style={{ borderColor: GHL.accent }} />
                ) : (
                  <span className="flex-1 text-sm" style={{ color: GHL.text }}>{item}</span>
                )}
                {editingItemIdx !== idx && <button onClick={() => startEditItem(idx, item)} className="p-0.5 rounded hover:bg-blue-50" style={{ color: GHL.muted }} title="Edit item"><Icon n="edit" c="w-3 h-3" /></button>}
                <button onClick={() => removeTplItem(idx)} className="p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500" title="Remove item"><Icon n="trash" c="w-3 h-3" /></button>
              </div>
            ))}{tpl.items.length === 0 && <p className="text-xs text-center py-3" style={{ color: GHL.muted }}>No items yet. Add your first checklist item below.</p>}</div>
            <div className="flex gap-2"><input value={newTplItem} onChange={(e) => setNewTplItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTplItem()} placeholder="Add checklist item..." className="flex-1 px-3 py-2 border rounded-lg text-sm" style={{ borderColor: GHL.border }} /><button onClick={addTplItem} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add</button></div>
          </div>}
        </div>))}</div><div className="flex gap-2 pt-4 border-t" style={{ borderColor: GHL.border }}><input value={newTplName} onChange={(e) => setNewTplName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTemplate()} placeholder="New template name..." className="flex-1 px-3 py-2.5 border rounded-lg text-sm" style={{ borderColor: GHL.border }} /><button onClick={addTemplate} className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Create Template</button></div></div></div>}

        {['Booking Sources', 'Supplier Directory'].includes(activeSection) && (() => { const list = activeSection === 'Booking Sources' ? props.bookingSources : props.suppliers; const setList = activeSection === 'Booking Sources' ? props.setBookingSources : props.setSuppliers; return (<div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}><h3 className="font-semibold mb-4 text-lg" style={{ color: GHL.text }}>{activeSection}</h3><div className="space-y-2 mb-4">{list.map((item, idx) => (<div key={idx} className="flex items-center justify-between p-3 rounded-lg" style={{ background: GHL.bg }}><span className="text-sm" style={{ color: GHL.text }}>{item}</span><button onClick={() => removeFromList(list, setList, idx)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-3.5 h-3.5" /></button></div>))}</div><div className="flex gap-2"><input value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addToList(list, setList)} placeholder="Add new..." className="flex-1 px-3 py-2.5 border rounded-lg text-sm" style={{ borderColor: GHL.border }} /><button onClick={() => addToList(list, setList)} className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add</button></div></div>); })()}

        {activeSection === 'Custom Fields' && <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}><h3 className="font-semibold mb-4 text-lg" style={{ color: GHL.text }}>Custom Fields</h3><div className="space-y-2 mb-4">{props.customFields.map((f) => (<div key={f.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: GHL.bg }}><div><span className="text-sm font-medium" style={{ color: GHL.text }}>{f.name}</span><span className="text-xs ml-2" style={{ color: GHL.muted }}>{f.module} · {f.type}</span></div><button onClick={() => props.setCustomFields(props.customFields.filter((x) => x.id !== f.id))} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-3.5 h-3.5" /></button></div>))}</div><div className="flex gap-2"><input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Field name..." className="flex-1 px-3 py-2.5 border rounded-lg text-sm" style={{ borderColor: GHL.border }} /><select id="cf-module" className="px-3 py-2.5 border rounded-lg text-sm bg-white" style={{ borderColor: GHL.border }}><option>Itinerary</option><option>Flight</option><option>Hotel</option></select><select id="cf-type" className="px-3 py-2.5 border rounded-lg text-sm bg-white" style={{ borderColor: GHL.border }}><option>Text</option><option>Number</option><option>Date</option><option>Dropdown</option></select><button onClick={() => { if (!newItem.trim()) return; const mod = (document.getElementById('cf-module') as HTMLSelectElement).value; const tp = (document.getElementById('cf-type') as HTMLSelectElement).value; props.setCustomFields([...props.customFields, { id: uid(), name: newItem.trim(), module: mod, type: tp }]); setNewItem(''); }} className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add</button></div></div>}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div><h2 className="text-2xl font-bold mb-1" style={{ color: GHL.text }}>Settings</h2><p className="text-sm" style={{ color: GHL.muted }}>Configure your workspace</p></div>
      {SECTIONS.map(([t, d, ic]) => (
        <div key={t} onClick={() => setActiveSection(t)} className="bg-white rounded-xl border p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer" style={{ borderColor: GHL.border }}>
          <div className="flex items-center gap-3"><span style={{ color: GHL.accent }}><Icon n={ic} c="w-5 h-5" /></span><div><p className="font-semibold" style={{ color: GHL.text }}>{t}</p><p className="text-sm mt-0.5" style={{ color: GHL.muted }}>{d}</p></div></div>
          <Icon n="chevronRight" c="w-5 h-5" />
        </div>
      ))}
    </div>
  );
}
