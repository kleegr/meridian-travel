'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui';
import { GHL, AGENTS } from '@/lib/constants';
import { uid, fmtDate } from '@/lib/utils';
import type { Itinerary, Flight, Hotel, Attraction, Transport, CheckNote } from '@/lib/types';

interface Props { onComplete: (itin: Itinerary) => void; onCancel: () => void; }

type Step = 'basics' | 'travelers' | 'destinations' | 'activities' | 'review';

const TRIP_TYPES = ['Honeymoon', 'Family', 'Adventure', 'Luxury', 'Budget', 'Business', 'Group', 'Religious', 'Cruise', 'Safari'];
const ACTIVITY_PRESETS: { name: string; icon: string; category: string }[] = [
  { name: 'City Walking Tour', icon: 'map', category: 'Culture' },
  { name: 'Museum Visit', icon: 'globe', category: 'Culture' },
  { name: 'Cooking Class', icon: 'star', category: 'Food' },
  { name: 'Wine Tasting', icon: 'star', category: 'Food' },
  { name: 'Boat Tour', icon: 'plane', category: 'Adventure' },
  { name: 'Hiking Trail', icon: 'map', category: 'Adventure' },
  { name: 'Spa Day', icon: 'star', category: 'Wellness' },
  { name: 'Shopping', icon: 'star', category: 'Leisure' },
  { name: 'Private Tour', icon: 'car', category: 'Luxury' },
  { name: 'Sunset Cruise', icon: 'plane', category: 'Romance' },
  { name: 'Snorkeling', icon: 'globe', category: 'Adventure' },
  { name: 'Food Market Tour', icon: 'star', category: 'Food' },
];

export default function ItineraryBuilder({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState<Step>('basics');
  const [title, setTitle] = useState('');
  const [client, setClient] = useState('');
  const [agent, setAgent] = useState(AGENTS[0]);
  const [tripType, setTripType] = useState('Luxury');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pax, setPax] = useState('2');
  const [destinations, setDestinations] = useState<string[]>(['']);
  const [selectedActivities, setSelectedActivities] = useState<{ name: string; city: string; day: number }[]>([]);
  const [notes, setNotes] = useState('');
  const [isVip, setIsVip] = useState(false);

  const steps: { id: Step; label: string; num: number }[] = [
    { id: 'basics', label: 'Trip Basics', num: 1 },
    { id: 'travelers', label: 'Travelers', num: 2 },
    { id: 'destinations', label: 'Destinations', num: 3 },
    { id: 'activities', label: 'Activities', num: 4 },
    { id: 'review', label: 'Review', num: 5 },
  ];
  const stepIdx = steps.findIndex((s) => s.id === step);

  const dayCount = startDate && endDate ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1) : 0;
  const dests = destinations.filter((d) => d.trim());

  const toggleActivity = (name: string) => {
    const exists = selectedActivities.find((a) => a.name === name);
    if (exists) {
      setSelectedActivities(selectedActivities.filter((a) => a.name !== name));
    } else {
      setSelectedActivities([...selectedActivities, { name, city: dests[0] || '', day: 1 }]);
    }
  };

  const handleComplete = () => {
    const checklist = ['Confirm client details', 'Book flights', 'Book hotels', 'Arrange transfers', 'Send itinerary to client'].map((text, i) => ({ id: uid() + i, text, done: false, notes: [] as CheckNote[] }));
    if (isVip) checklist.push({ id: uid(), text: 'Send VIP welcome gift', done: false, notes: [] });
    const itin: Itinerary = {
      id: uid(), title: title || `${client}'s ${tripType} Trip`, client, agent,
      startDate, endDate, destinations: dests, destination: dests.join(', '),
      clientPhones: [], clientEmails: [], clientAddresses: [],
      status: 'Draft', passengers: parseInt(pax) || 2, tags: [tripType],
      notes, created: new Date().toISOString().split('T')[0], isVip,
      destinationInfo: [], tripType,
      passengerList: [], flights: [] as Flight[], hotels: [] as Hotel[],
      transport: [] as Transport[],
      attractions: selectedActivities.map((a) => ({ id: uid(), name: a.name, city: a.city, date: '', time: '', ticketType: 'General', source: 'Builder', ref: '', cost: 0, sell: 0, notes: '' })) as Attraction[],
      insurance: [], carRentals: [], davening: [], mikvah: [],
      deposits: 0, checklist,
    };
    onComplete(itin);
  };

  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4"><button onClick={onCancel} className="p-2 rounded-lg hover:bg-gray-100" style={{ color: GHL.muted }}><Icon n="back" c="w-5 h-5" /></button><div><h2 className="text-2xl font-bold" style={{ color: GHL.text }}>Itinerary Builder</h2><p className="text-sm" style={{ color: GHL.muted }}>Build a complete itinerary step by step</p></div></div>

      {/* Progress bar */}
      <div className="bg-white rounded-xl border p-4 shadow-sm" style={{ borderColor: GHL.border }}>
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (<div key={s.id} className="flex items-center gap-2 flex-1">
            <button onClick={() => setStep(s.id)} className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={i <= stepIdx ? { background: GHL.accent, color: 'white' } : { background: GHL.bg, color: GHL.muted }}>{s.num}</span>
              <span className="text-xs font-medium hidden md:inline" style={{ color: i <= stepIdx ? GHL.accent : GHL.muted }}>{s.label}</span>
            </button>
            {i < steps.length - 1 && <div className="flex-1 h-0.5 rounded" style={{ background: i < stepIdx ? GHL.accent : GHL.bg }} />}
          </div>))}
        </div>
      </div>

      {/* Step content */}
      <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
        {step === 'basics' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="font-semibold text-lg" style={{ color: GHL.text }}>Trip Basics</h3>
            <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Trip Name</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Johnson Family Italy Trip" className={ic} style={{ borderColor: GHL.border }} /></div>
            <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Client Name *</label><input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Johnson Family" className={ic} style={{ borderColor: GHL.border }} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Agent</label><select value={agent} onChange={(e) => setAgent(e.target.value)} className={ic + ' bg-white'} style={{ borderColor: GHL.border }}>{AGENTS.map((a) => <option key={a}>{a}</option>)}</select></div>
              <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Passengers</label><input type="number" value={pax} onChange={(e) => setPax(e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Departure</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
              <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Return</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={ic} style={{ borderColor: GHL.border }} /></div>
            </div>
            <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Trip Type</label><div className="flex flex-wrap gap-2">{TRIP_TYPES.map((t) => (<button key={t} onClick={() => setTripType(t)} className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all" style={tripType === t ? { background: GHL.accentLight, borderColor: GHL.accent, color: GHL.accent } : { background: 'white', borderColor: GHL.border, color: GHL.muted }}>{t}</button>))}</div></div>
            <div className="flex items-center gap-3 p-3 rounded-lg cursor-pointer" style={{ background: isVip ? '#fefce8' : GHL.bg, border: isVip ? '1px solid #fde68a' : `1px solid ${GHL.border}` }} onClick={() => setIsVip(!isVip)}><button className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={isVip ? { background: '#d97706', borderColor: '#d97706' } : { borderColor: '#d1d5db' }}>{isVip && <Icon n="check" c="w-3 h-3 text-white" />}</button><span className="text-sm" style={{ color: GHL.text }}>VIP Client</span></div>
          </div>
        )}

        {step === 'travelers' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="font-semibold text-lg" style={{ color: GHL.text }}>Travelers</h3>
            <p className="text-sm" style={{ color: GHL.muted }}>You have {pax} passengers. Traveler details can be added after the itinerary is created.</p>
            <div className="p-4 rounded-lg" style={{ background: GHL.bg }}>
              <p className="text-sm font-semibold" style={{ color: GHL.text }}>{pax} Travelers</p>
              <p className="text-xs mt-1" style={{ color: GHL.muted }}>Names, passports, and contact details will be collected in the Passengers tab</p>
            </div>
            <div><label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Special Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Dietary needs, mobility requirements, special requests..." rows={3} className={ic + ' resize-none'} style={{ borderColor: GHL.border }} /></div>
          </div>
        )}

        {step === 'destinations' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="font-semibold text-lg" style={{ color: GHL.text }}>Destinations</h3>
            {destinations.map((d, i) => (<div key={i} className="flex gap-2"><input value={d} onChange={(e) => { const nd = [...destinations]; nd[i] = e.target.value; setDestinations(nd); }} placeholder={`Destination ${i + 1}`} className={ic + ' flex-1'} style={{ borderColor: GHL.border }} />{destinations.length > 1 && <button onClick={() => setDestinations(destinations.filter((_, j) => j !== i))} className="p-2 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-4 h-4" /></button>}</div>))}
            <button onClick={() => setDestinations([...destinations, ''])} className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50" style={{ color: GHL.accent }}><Icon n="plus" c="w-3.5 h-3.5" /> Add Destination</button>
            {dayCount > 0 && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: GHL.bg, color: GHL.muted }}>{dayCount} days &middot; {dests.length} destinations</p>}
          </div>
        )}

        {step === 'activities' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg" style={{ color: GHL.text }}>Activities</h3>
            <p className="text-sm" style={{ color: GHL.muted }}>Select activities to include. You can customize dates and details later.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">{ACTIVITY_PRESETS.map((a) => { const selected = selectedActivities.some((s) => s.name === a.name); return (<button key={a.name} onClick={() => toggleActivity(a.name)} className="p-3 rounded-xl border text-left transition-all" style={selected ? { background: GHL.accentLight, borderColor: GHL.accent } : { background: 'white', borderColor: GHL.border }}><div className="flex items-center gap-2 mb-1"><Icon n={a.icon} c="w-3.5 h-3.5" /><span className="text-xs font-semibold" style={{ color: selected ? GHL.accent : GHL.text }}>{a.name}</span></div><span className="text-[9px]" style={{ color: GHL.muted }}>{a.category}</span>{selected && <span className="block text-[9px] font-bold mt-1" style={{ color: GHL.accent }}>\u2713 Selected</span>}</button>); })}</div>
            {selectedActivities.length > 0 && <p className="text-xs font-semibold" style={{ color: GHL.accent }}>{selectedActivities.length} activities selected</p>}
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4 max-w-lg">
            <h3 className="font-semibold text-lg" style={{ color: GHL.text }}>Review & Create</h3>
            <div className="space-y-2">
              {[['Trip', title || `${client}'s ${tripType} Trip`], ['Client', client], ['Agent', agent], ['Type', tripType], ['Dates', `${fmtDate(startDate)} - ${fmtDate(endDate)}`], ['Passengers', pax], ['Destinations', dests.join(', ')], ['Activities', `${selectedActivities.length} selected`], ['VIP', isVip ? 'Yes' : 'No']].map(([k, v]) => (<div key={k} className="flex items-center justify-between py-2 border-b border-gray-50"><span className="text-xs" style={{ color: GHL.muted }}>{k}</span><span className="text-sm font-semibold" style={{ color: GHL.text }}>{v}</span></div>))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => { if (stepIdx > 0) setStep(steps[stepIdx - 1].id); else onCancel(); }} className="px-4 py-2.5 text-sm font-medium rounded-lg hover:bg-gray-100" style={{ color: GHL.muted }}>{stepIdx === 0 ? 'Cancel' : 'Back'}</button>
        {step === 'review' ? (
          <button onClick={handleComplete} disabled={!client} className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 shadow-sm" style={{ background: GHL.accent, opacity: client ? 1 : 0.5 }}>Create Itinerary</button>
        ) : (
          <button onClick={() => setStep(steps[stepIdx + 1].id)} className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg hover:opacity-90 shadow-sm" style={{ background: GHL.accent }}>Next</button>
        )}
      </div>
    </div>
  );
}
