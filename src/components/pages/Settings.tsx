'use client';

import { useState, useRef } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { uid } from '@/lib/utils';
import type { AgencyProfile, CustomField, Pipeline, ChecklistTemplate } from '@/lib/types';

interface SettingsProps {
  bookingSources: string[]; setBookingSources: (v: string[]) => void;
  suppliers: string[]; setSuppliers: (v: string[]) => void;
  pipelines: Pipeline[]; setPipelines: (v: Pipeline[]) => void;
  activePipelineId: number; setActivePipelineId: (v: number) => void;
  agencyProfile: AgencyProfile; setAgencyProfile: (v: AgencyProfile) => void;
  customFields: CustomField[]; setCustomFields: (v: CustomField[]) => void;
  checklistTemplates: ChecklistTemplate[]; setChecklistTemplates: (v: ChecklistTemplate[]) => void;
}

const SECTIONS = [
  ['Agency Profile', 'Company name, logo, contact details', 'globe'],
  ['Pipelines & Stages', 'Board columns and workflow stages', 'kanban'],
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
  const fileRef = useRef<HTMLInputElement>(null);
  // Checklist template editing
  const [editingTplId, setEditingTplId] = useState<number | null>(null);
  const [newTplName, setNewTplName] = useState('');
  const [newTplItem, setNewTplItem] = useState('');

  const activePipeline = props.pipelines.find((p) => p.id === props.activePipelineId);
  const addToList = (list: string[], setList: (v: string[]) => void) => { if (!newItem.trim()) return; setList([...list, newItem.trim()]); setNewItem(''); };
  const removeFromList = (list: string[], setList: (v: string[]) => void, idx: number) => { setList(list.filter((_, i) => i !== idx)); };
  const addPipeline = () => { if (!newPipelineName.trim()) return; const np: Pipeline = { id: uid(), name: newPipelineName.trim(), stages: ['New', 'In Progress', 'Done'] }; props.setPipelines([...props.pipelines, np]); props.setActivePipelineId(np.id); setNewPipelineName(''); setShowNewPipeline(false); };
  const deletePipeline = (id: number) => { const np = props.pipelines.filter((p) => p.id !== id); props.setPipelines(np); if (props.activePipelineId === id && np.length > 0) props.setActivePipelineId(np[0].id); };
  const addStage = () => { if (!newStage.trim() || !activePipeline) return; props.setPipelines(props.pipelines.map((p) => p.id === activePipeline.id ? { ...p, stages: [...p.stages, newStage.trim()] } : p)); setNewStage(''); };
  const deleteStage = (idx: number) => { if (!activePipeline) return; props.setPipelines(props.pipelines.map((p) => p.id === activePipeline.id ? { ...p, stages: p.stages.filter((_, i) => i !== idx) } : p)); };
  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); if (dragIdx === null || dragIdx === idx || !activePipeline) return; const stages = [...activePipeline.stages]; const [moved] = stages.splice(dragIdx, 1); stages.splice(idx, 0, moved); props.setPipelines(props.pipelines.map((p) => p.id === activePipeline.id ? { ...p, stages } : p)); setDragIdx(idx); };
  const handleDragEnd = () => setDragIdx(null);
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 2 * 1024 * 1024) { alert('Max 2MB'); return; } const r = new FileReader(); r.onload = () => { props.setAgencyProfile({ ...props.agencyProfile, logo: r.result as string }); }; r.readAsDataURL(file); };

  // Checklist template helpers
  const editingTpl = editingTplId ? props.checklistTemplates.find((t) => t.id === editingTplId) : null;
  const addTemplate = () => { if (!newTplName.trim()) return; const nt: ChecklistTemplate = { id: uid(), name: newTplName.trim(), items: [] }; props.setChecklistTemplates([...props.checklistTemplates, nt]); setEditingTplId(nt.id); setNewTplName(''); };
  const deleteTemplate = (id: number) => { props.setChecklistTemplates(props.checklistTemplates.filter((t) => t.id !== id)); if (editingTplId === id) setEditingTplId(null); };
  const renameTpl = (id: number, name: string) => { props.setChecklistTemplates(props.checklistTemplates.map((t) => t.id === id ? { ...t, name } : t)); };
  const addTplItem = () => { if (!newTplItem.trim() || !editingTplId) return; props.setChecklistTemplates(props.checklistTemplates.map((t) => t.id === editingTplId ? { ...t, items: [...t.items, newTplItem.trim()] } : t)); setNewTplItem(''); };
  const removeTplItem = (idx: number) => { if (!editingTplId) return; props.setChecklistTemplates(props.checklistTemplates.map((t) => t.id === editingTplId ? { ...t, items: t.items.filter((_, i) => i !== idx) } : t)); };

  if (activeSection) {
    return (
      <div className="space-y-5">
        <button onClick={() => { setActiveSection(null); setNewItem(''); setEditingTplId(null); }} className="inline-flex items-center gap-2 text-sm hover:opacity-80" style={{ color: GHL.muted }}><Icon n="back" c="w-4 h-4" /> Back to Settings</button>

        {activeSection === 'Agency Profile' && <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}><h3 className="font-semibold mb-1 text-lg" style={{ color: GHL.text }}>Agency Profile</h3><p className="text-sm mb-6" style={{ color: GHL.muted }}>Appears on all itineraries and PDFs</p><div className="mb-6"><label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: GHL.muted }}>Company Logo</label><div className="flex items-center gap-4"><div className="w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-300" style={{ borderColor: props.agencyProfile.logo ? GHL.accent : GHL.border, background: props.agencyProfile.logo ? 'white' : GHL.bg }} onClick={() => fileRef.current?.click()}>{props.agencyProfile.logo ? <img src={props.agencyProfile.logo} alt="" className="w-full h-full object-contain p-2" /> : <div className="text-center"><Icon n="plus" c="w-6 h-6 mx-auto" /><p className="text-[9px] mt-1" style={{ color: GHL.muted }}>Upload</p></div>}</div><div><button onClick={() => fileRef.current?.click()} className="text-sm font-medium px-4 py-2 rounded-lg border hover:bg-gray-50" style={{ borderColor: GHL.border, color: GHL.accent }}>{props.agencyProfile.logo ? 'Change' : 'Upload'}</button>{props.agencyProfile.logo && <button onClick={() => props.setAgencyProfile({ ...props.agencyProfile, logo: '' })} className="text-sm ml-2 px-3 py-2 rounded-lg text-red-400 hover:text-red-600">Remove</button>}<p className="text-[10px] mt-1.5" style={{ color: GHL.muted }}>PNG, JPG, SVG. Max 2MB.</p></div><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /></div></div><div className="grid grid-cols-2 gap-4">{[['name', 'Agency Name'], ['email', 'Email'], ['phone', 'Phone'], ['address', 'Address']].map(([k, l]) => (<div key={k}><label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: GHL.muted }}>{l}</label><input value={(props.agencyProfile as any)[k]} onChange={(e) => props.setAgencyProfile({ ...props.agencyProfile, [k]: e.target.value })} className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: GHL.border }} /></div>))}</div></div>}

        {activeSection === 'Pipelines & Stages' && <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}><div className="flex items-center justify-between mb-4"><div><h3 className="font-semibold text-lg" style={{ color: GHL.text }}>Pipelines &amp; Stages</h3><p className="text-sm" style={{ color: GHL.muted }}>Active pipeline stages become board columns</p></div><button onClick={() => setShowNewPipeline(true)} className="inline-flex items-center gap-2 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90" style={{ background: GHL.accent }}><Icon n="plus" c="w-4 h-4" /> New Pipeline</button></div>{showNewPipeline && <div className="flex gap-3 mb-4 p-3 rounded-lg" style={{ background: GHL.bg }}><input value={newPipelineName} onChange={(e) => setNewPipelineName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addPipeline()} placeholder="Pipeline name..." className="flex-1 px-3 py-2 border rounded-lg text-sm" style={{ borderColor: GHL.border }} /><button onClick={addPipeline} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Create</button><button onClick={() => setShowNewPipeline(false)} className="px-3 py-2 text-sm" style={{ color: GHL.muted }}>Cancel</button></div>}<div className="flex gap-2 flex-wrap mb-4">{props.pipelines.map((p) => (<button key={p.id} onClick={() => props.setActivePipelineId(p.id)} className="px-4 py-2 rounded-lg text-sm font-medium" style={props.activePipelineId === p.id ? { background: GHL.accent, color: 'white' } : { background: GHL.bg, color: GHL.muted, border: `1px solid ${GHL.border}` }}>{p.name} ({p.stages.length})</button>))}</div>{activePipeline && <div><div className="flex items-center justify-between mb-3"><p className="text-sm font-semibold" style={{ color: GHL.text }}>{activePipeline.name} — Stages</p>{props.pipelines.length > 1 && <button onClick={() => deletePipeline(activePipeline.id)} className="text-xs text-red-400 hover:text-red-600">Delete Pipeline</button>}</div><div className="space-y-2">{activePipeline.stages.map((stage, idx) => (<div key={idx} draggable onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDragEnd={handleDragEnd} className="flex items-center gap-3 p-3 rounded-lg border cursor-grab" style={{ borderColor: GHL.border, opacity: dragIdx === idx ? 0.5 : 1 }}><span style={{ color: GHL.muted }}><Icon n="grip" c="w-4 h-4" /></span><span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: GHL.accent }}>{idx + 1}</span><span className="flex-1 font-medium text-sm" style={{ color: GHL.text }}>{stage}</span><button onClick={() => deleteStage(idx)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-3.5 h-3.5" /></button></div>))}</div><div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: GHL.border }}><input value={newStage} onChange={(e) => setNewStage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addStage()} placeholder="Add stage..." className="flex-1 px-3 py-2.5 border rounded-lg text-sm" style={{ borderColor: GHL.border }} /><button onClick={addStage} className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add</button></div></div>}</div>}

        {/* ===== CHECKLIST TEMPLATES ===== */}
        {activeSection === 'Checklist Templates' && (
          <div className="space-y-5">
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
              <div className="flex items-center justify-between mb-4">
                <div><h3 className="font-semibold text-lg" style={{ color: GHL.text }}>Checklist Templates</h3><p className="text-sm" style={{ color: GHL.muted }}>Create named checklists. When creating an itinerary, select which template to use.</p></div>
              </div>

              {/* Template list */}
              <div className="space-y-2 mb-4">
                {props.checklistTemplates.map((tpl) => (
                  <div key={tpl.id} className="rounded-lg border overflow-hidden" style={{ borderColor: editingTplId === tpl.id ? GHL.accent : GHL.border }}>
                    <div className="flex items-center justify-between px-4 py-3 cursor-pointer" style={{ background: editingTplId === tpl.id ? '#f0f5ff' : GHL.bg }} onClick={() => setEditingTplId(editingTplId === tpl.id ? null : tpl.id)}>
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ background: GHL.accent }}>{tpl.items.length}</span>
                        <div>
                          <p className="font-semibold text-sm" style={{ color: GHL.text }}>{tpl.name}</p>
                          <p className="text-[10px]" style={{ color: GHL.muted }}>{tpl.items.length} items</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); deleteTemplate(tpl.id); }} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-3.5 h-3.5" /></button>
                        <Icon n={editingTplId === tpl.id ? 'chevronDown' : 'chevronRight'} c="w-4 h-4" />
                      </div>
                    </div>
                    {editingTplId === tpl.id && (
                      <div className="px-4 py-4 border-t" style={{ borderColor: GHL.border }}>
                        {/* Rename */}
                        <div className="mb-4">
                          <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Template Name</label>
                          <input value={tpl.name} onChange={(e) => renameTpl(tpl.id, e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: GHL.border }} />
                        </div>
                        {/* Items */}
                        <div className="space-y-1.5 mb-3">
                          {tpl.items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 py-1.5 px-3 rounded-lg" style={{ background: GHL.bg }}>
                              <span className="text-xs font-bold w-5 text-center" style={{ color: GHL.muted }}>{idx + 1}</span>
                              <span className="flex-1 text-sm" style={{ color: GHL.text }}>{item}</span>
                              <button onClick={() => removeTplItem(idx)} className="p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-3 h-3" /></button>
                            </div>
                          ))}
                          {tpl.items.length === 0 && <p className="text-xs text-center py-3" style={{ color: GHL.muted }}>No items yet. Add some below.</p>}
                        </div>
                        <div className="flex gap-2">
                          <input value={newTplItem} onChange={(e) => setNewTplItem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTplItem()} placeholder="Add checklist item..." className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: GHL.border }} />
                          <button onClick={addTplItem} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Create new template */}
              <div className="flex gap-2 pt-4 border-t" style={{ borderColor: GHL.border }}>
                <input value={newTplName} onChange={(e) => setNewTplName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTemplate()} placeholder="New template name..." className="flex-1 px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: GHL.border }} />
                <button onClick={addTemplate} className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Create Template</button>
              </div>
            </div>
          </div>
        )}

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
