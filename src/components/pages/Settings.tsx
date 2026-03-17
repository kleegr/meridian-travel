'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui';
import { GHL, AGENTS } from '@/lib/constants';
import Pipelines from './Pipelines';
import FinancialSettings from './FinancialSettings';
import type { Pipeline, AgencyProfile, CustomField, ChecklistTemplate, FinancialConfig, PackageTemplate, FeatureFlags } from '@/lib/types';
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
}

const SETTINGS_SECTIONS = [
  { id: 'agency', label: 'Agency Profile', icon: 'user', desc: 'Company info and branding' },
  { id: 'features', label: 'Feature Control', icon: 'settings', desc: 'Turn features on/off' },
  { id: 'pipeline', label: 'Pipeline & Stages', icon: 'pipeline', desc: 'Booking workflow stages' },
  { id: 'financial', label: 'Financial Config', icon: 'dollar', desc: 'Pricing and markup rules' },
  { id: 'checklist', label: 'Checklist Templates', icon: 'checkSquare', desc: 'Reusable task templates' },
  { id: 'sources', label: 'Booking Sources', icon: 'globe', desc: 'GDS, direct, and more' },
  { id: 'suppliers', label: 'Suppliers', icon: 'star', desc: 'Airlines, hotels, etc.' },
];

const FEATURE_LIST = [
  { key: 'marketingEnabled', label: 'Marketing Studio', desc: 'Create branded ads and graphics for packages', icon: 'star', category: 'Tools' },
  { key: 'automationsEnabled', label: 'Automations', desc: 'Auto-trigger actions based on events', icon: 'bell', category: 'Tools' },
  { key: 'aiSuggestionsEnabled', label: 'AI Suggestions', desc: 'Get AI-powered activity and destination recommendations', icon: 'search', category: 'Itinerary Tabs' },
  { key: 'mapViewEnabled', label: 'Map View', desc: 'Show itinerary locations on an interactive map', icon: 'map', category: 'Itinerary Tabs' },
  { key: 'shareableTripPageEnabled', label: 'Client Itinerary', desc: 'Shareable trip page for clients to view their itinerary', icon: 'globe', category: 'Itinerary Tabs' },
  { key: 'packagesEnabled', label: 'Packages', desc: 'Reusable package templates for common trips', icon: 'globe', category: 'Navigation' },
];

export default function Settings(props: Props) {
  const [activeSection, setActiveSection] = useState('agency');
  const [flags, setFlags] = useState<FeatureFlags>(props.featureFlags || DEFAULT_FEATURE_FLAGS);

  const updateFlag = (key: string, val: boolean) => {
    const next = { ...flags, [key]: val };
    setFlags(next);
    props.setFeatureFlags?.(next);
  };

  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-0">
      <div className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: GHL.text }}>Settings</h2>
        <p className="text-sm mt-0.5" style={{ color: GHL.muted }}>Manage your agency, features, and preferences</p>
      </div>

      <div className="flex gap-6" style={{ minHeight: 500 }}>
        {/* Left sidebar navigation */}
        <div className="w-[220px] flex-shrink-0">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: GHL.border }}>
            {SETTINGS_SECTIONS.map((s, i) => (
              <button key={s.id} onClick={() => setActiveSection(s.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors" style={{ background: activeSection === s.id ? GHL.accentLight : 'white', borderBottom: i < SETTINGS_SECTIONS.length - 1 ? `1px solid ${GHL.border}` : 'none' }}>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: activeSection === s.id ? GHL.accent : GHL.bg, color: activeSection === s.id ? 'white' : GHL.muted }}><Icon n={s.icon} c="w-4 h-4" /></span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: activeSection === s.id ? GHL.accent : GHL.text }}>{s.label}</p>
                  <p className="text-[9px] truncate" style={{ color: GHL.muted }}>{s.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right content area */}
        <div className="flex-1 min-w-0">
          {/* Agency Profile */}
          {activeSection === 'agency' && (
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: GHL.text }}>Agency Profile</h3>
              <p className="text-sm mb-6" style={{ color: GHL.muted }}>Your company information appears on client documents and itineraries</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><label className={lc} style={{ color: GHL.muted }}>Agency Name</label><input value={props.agencyProfile.name} onChange={e => props.setAgencyProfile({ ...props.agencyProfile, name: e.target.value })} className={ic} style={{ borderColor: GHL.border }} /></div>
                <div><label className={lc} style={{ color: GHL.muted }}>Email</label><input value={props.agencyProfile.email} onChange={e => props.setAgencyProfile({ ...props.agencyProfile, email: e.target.value })} className={ic} style={{ borderColor: GHL.border }} /></div>
                <div><label className={lc} style={{ color: GHL.muted }}>Phone</label><input value={props.agencyProfile.phone} onChange={e => props.setAgencyProfile({ ...props.agencyProfile, phone: e.target.value })} className={ic} style={{ borderColor: GHL.border }} /></div>
                <div className="col-span-2"><label className={lc} style={{ color: GHL.muted }}>Address</label><input value={props.agencyProfile.address} onChange={e => props.setAgencyProfile({ ...props.agencyProfile, address: e.target.value })} className={ic} style={{ borderColor: GHL.border }} /></div>
              </div>
            </div>
          )}

          {/* Feature Control Center */}
          {activeSection === 'features' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
                <h3 className="text-lg font-bold mb-1" style={{ color: GHL.text }}>Feature Control Center</h3>
                <p className="text-sm mb-6" style={{ color: GHL.muted }}>Turn features on or off to customize your workspace. Disabled features are hidden from the interface.</p>
                {['Tools', 'Itinerary Tabs', 'Navigation'].map(category => {
                  const items = FEATURE_LIST.filter(f => f.category === category);
                  if (items.length === 0) return null;
                  return (
                    <div key={category} className="mb-6 last:mb-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider mb-3 px-1" style={{ color: GHL.muted }}>{category}</p>
                      <div className="space-y-2">
                        {items.map(feat => {
                          const enabled = (flags as any)[feat.key] ?? true;
                          return (
                            <div key={feat.key} className="flex items-center gap-4 p-4 rounded-xl border transition-all" style={{ borderColor: enabled ? GHL.accent + '40' : GHL.border, background: enabled ? GHL.accentLight + '40' : 'white' }}>
                              <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: enabled ? GHL.accent : GHL.bg, color: enabled ? 'white' : GHL.muted }}><Icon n={feat.icon} c="w-5 h-5" /></span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold" style={{ color: GHL.text }}>{feat.label}</p>
                                <p className="text-xs" style={{ color: GHL.muted }}>{feat.desc}</p>
                              </div>
                              <button onClick={() => updateFlag(feat.key, !enabled)} className="w-11 h-6 rounded-full transition-colors flex-shrink-0 relative" style={{ background: enabled ? GHL.accent : '#d1d5db' }}>
                                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all" style={{ left: enabled ? 20 : 2 }} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Additional itinerary tab controls */}
              <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
                <h3 className="text-sm font-bold mb-1" style={{ color: GHL.text }}>Itinerary Detail Tabs</h3>
                <p className="text-xs mb-4" style={{ color: GHL.muted }}>Control which tabs appear when viewing an itinerary</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'overview', label: 'Overview', always: true },
                    { key: 'passengers', label: 'Passengers', always: true },
                    { key: 'bookings', label: 'Bookings', always: true },
                    { key: 'destinations', label: 'Destination Info' },
                    { key: 'suggestions', label: 'AI Suggestions' },
                    { key: 'checklist', label: 'Checklist', always: true },
                    { key: 'financials', label: 'Financials' },
                    { key: 'blast', label: 'Blast Radius' },
                    { key: 'print', label: 'Client Itinerary' },
                    { key: 'map', label: 'Map' },
                  ].map(tab => (
                    <div key={tab.key} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: GHL.bg }}>
                      <div className="w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0" style={tab.always ? { background: GHL.accent, borderColor: GHL.accent } : { borderColor: '#d1d5db' }}>
                        {tab.always && <Icon n="check" c="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="text-xs" style={{ color: GHL.text }}>{tab.label}</span>
                      {tab.always && <span className="text-[8px] ml-auto" style={{ color: GHL.muted }}>Always on</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pipeline */}
          {activeSection === 'pipeline' && (
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: GHL.text }}>Pipeline & Stages</h3>
              <p className="text-sm mb-6" style={{ color: GHL.muted }}>Define the workflow stages for your itineraries</p>
              <Pipelines pipelines={props.pipelines} setPipelines={props.setPipelines} activePipelineId={props.activePipelineId} setActivePipelineId={props.setActivePipelineId} />
            </div>
          )}

          {/* Financial */}
          {activeSection === 'financial' && (
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: GHL.text }}>Financial Configuration</h3>
              <p className="text-sm mb-6" style={{ color: GHL.muted }}>Set up pricing modes, markups, and commission rules</p>
              <FinancialSettings config={props.financialConfig} setConfig={props.setFinancialConfig} />
            </div>
          )}

          {/* Checklist Templates */}
          {activeSection === 'checklist' && (
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: GHL.text }}>Checklist Templates</h3>
              <p className="text-sm mb-6" style={{ color: GHL.muted }}>Create reusable checklist templates for different trip types</p>
              <div className="space-y-3">
                {props.checklistTemplates.map(tpl => (
                  <div key={tpl.id} className="rounded-xl border p-4" style={{ borderColor: GHL.border }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-sm" style={{ color: GHL.text }}>{tpl.name}</p>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: GHL.bg, color: GHL.muted }}>{tpl.items.length} items</span>
                    </div>
                    <div className="space-y-1">{tpl.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs" style={{ color: GHL.muted }}>
                        <div className="w-3 h-3 rounded border" style={{ borderColor: GHL.border }} />
                        <span>{item}</span>
                      </div>
                    ))}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booking Sources */}
          {activeSection === 'sources' && (
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: GHL.text }}>Booking Sources</h3>
              <p className="text-sm mb-6" style={{ color: GHL.muted }}>Define where your bookings come from</p>
              <div className="flex flex-wrap gap-2">
                {props.bookingSources.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: GHL.border, background: GHL.bg }}>
                    <span className="text-sm" style={{ color: GHL.text }}>{s}</span>
                    <button onClick={() => props.setBookingSources(props.bookingSources.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400"><Icon n="x" c="w-3 h-3" /></button>
                  </div>
                ))}
                <button onClick={() => { const v = prompt('New booking source:'); if (v) props.setBookingSources([...props.bookingSources, v]); }} className="px-3 py-2 rounded-lg border-2 border-dashed text-xs font-medium" style={{ borderColor: GHL.border, color: GHL.accent }}>+ Add Source</button>
              </div>
            </div>
          )}

          {/* Suppliers */}
          {activeSection === 'suppliers' && (
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
              <h3 className="text-lg font-bold mb-1" style={{ color: GHL.text }}>Suppliers</h3>
              <p className="text-sm mb-6" style={{ color: GHL.muted }}>Airlines, hotels, and service providers you work with</p>
              <div className="flex flex-wrap gap-2">
                {props.suppliers.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border" style={{ borderColor: GHL.border, background: GHL.bg }}>
                    <span className="text-sm" style={{ color: GHL.text }}>{s}</span>
                    <button onClick={() => props.setSuppliers(props.suppliers.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400"><Icon n="x" c="w-3 h-3" /></button>
                  </div>
                ))}
                <button onClick={() => { const v = prompt('New supplier:'); if (v) props.setSuppliers([...props.suppliers, v]); }} className="px-3 py-2 rounded-lg border-2 border-dashed text-xs font-medium" style={{ borderColor: GHL.border, color: GHL.accent }}>+ Add Supplier</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
