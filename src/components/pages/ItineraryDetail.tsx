'use client';

import { useState } from 'react';
import { Icon, StatusBadge, Accordion, FormModal, SmartFormModal, MiniTable } from '@/components/ui';
import PrintView from './PrintView';
import PassengersTab from './PassengersTab';
import ItineraryMapView from './ItineraryMapView';
import DestinationInfoSection from './DestinationInfoSection';
import FlightGroupView from './FlightGroupView';
import { GHL, AGENTS, STATUSES } from '@/lib/constants';
import { calcFin, fmt, fmtDate, fmtDateTime12, nights, uid } from '@/lib/utils';
import { generateSmartChecklist } from '@/lib/smart-checklist';
import { FLIGHT_FIELDS, HOTEL_FIELDS, TRANSPORT_FIELDS, ATTRACTION_FIELDS, INSURANCE_FIELDS, CAR_RENTAL_FIELDS, PASSENGER_FIELDS, DAVENING_FIELDS, MIKVAH_FIELDS, ITINERARY_FIELDS } from '@/components/forms/field-configs';
import type { Itinerary, Row, AgencyProfile, FormField, Pipeline, ChecklistTemplate, CheckNote } from '@/lib/types';

interface Props { itin: Itinerary; onBack: () => void; onUpdate: (u: Itinerary) => void; onDelete?: () => void; agencyProfile: AgencyProfile; pipelines?: Pipeline[]; checklistTemplates?: ChecklistTemplate[]; }
function toFD(item: any): Record&lt;string, string&gt; { const d: Record&lt;string, string&gt; = {}; Object.entries(item).forEach(([k, v]) => { if (v != null) d[k] = String(v); }); return d; }
function ContactListEditor({ icon, label, values, onChange, placeholder, type }: { icon: string; label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string; type?: string }) { const items = values.length > 0 ? values : ['']; return (<div><p className="text-xs mb-1.5" style={{ color: GHL.muted }}>{label}</p>{items.map((v, i) => (<div key={i} className="flex items-center gap-1.5 mb-1">{i === 0 &amp;&amp; <Icon n={icon} c="w-3.5 h-3.5 flex-shrink-0" />}{i > 0 &amp;&amp; <span className="w-3.5" />}<input value={v} onChange={(e) => { const nv = [...items]; nv[i] = e.target.value; onChange(nv); }} placeholder={placeholder} type={type || 'text'} className="flex-1 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-200 min-w-0" style={{ borderColor: GHL.border, color: GHL.text }} />{items.length > 1 &amp;&amp; <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(items.filter((_, j) => j !== i)); }} className="p-0.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-400"><Icon n="x" c="w-3 h-3" /></button>}</div>))}<button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange([...items, '']); }} className="inline-flex items-center gap-1 text-[10px] font-medium ml-5 mt-0.5 hover:bg-blue-50 px-1 py-0.5 rounded" style={{ color: GHL.accent }}><Icon n="plus" c="w-2.5 h-2.5" /> Add</button></div>); }
