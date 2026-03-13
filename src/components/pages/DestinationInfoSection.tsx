'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { uid } from '@/lib/utils';
import type { Itinerary, DestinationInfo } from '@/lib/types';

interface Props { itin: Itinerary; onUpdate: (u: Itinerary) => void; }

export default function DestinationInfoSection({ itin, onUpdate }: Props) {
  const [generating, setGenerating] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [newName, setNewName] = useState('');
  const infos = itin.destinationInfo || [];

  const addDI = (name: string) => { if (!name.trim()) return; onUpdate({ ...itin, destinationInfo: [...infos, { id: uid(), name: name.trim(), description: '', showOnItinerary: true }] }); setNewName(''); };
  const delDI = (id: number) => onUpdate({ ...itin, destinationInfo: infos.filter((d) => d.id !== id) });
  const toggleShow = (id: number) => onUpdate({ ...itin, destinationInfo: infos.map((d) => d.id === id ? { ...d, showOnItinerary: !d.showOnItinerary } : d) });
  const saveEdit = (id: number) => { onUpdate({ ...itin, destinationInfo: infos.map((d) => d.id === id ? { ...d, description: editText } : d) }); setEditingId(null); };

  const generateAI = async (di: DestinationInfo) => {
    setGenerating(di.id);
    try {
      const hotels = itin.hotels.map((h) => `${h.name} in ${h.city}`).join(', ');
      const activities = itin.attractions.map((a) => `${a.name} in ${a.city}`).join(', ');
      const prompt = `Write a beautiful 4-5 sentence description of "${di.name}" for a luxury travel itinerary. Trip: ${itin.title}. Hotels: ${hotels || 'TBD'}. Activities: ${activities || 'TBD'}. Destinations: ${(itin.destinations || []).join(', ')}. Focus on scenery, culture, cuisine, landmarks. Weave in specific places naturally. Warm, inviting prose. NO markdown, NO bullets. Just paragraphs.`;

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, destinationName: di.name }),
      });
      const data = await res.json();
      if (data.text) {
        onUpdate({ ...itin, destinationInfo: infos.map((d) => d.id === di.id ? { ...d, description: data.text.trim() } : d) });
      } else {
        alert('Could not generate description. Please write manually.');
      }
    } catch (err) {
      alert('Connection error. Please try again.');
    }
    setGenerating(null);
  };

  // Gather all places from itinerary
  const allPlaces: string[] = [];
  (itin.destinations || []).forEach((d) => { if (d && !allPlaces.includes(d)) allPlaces.push(d); });
  itin.hotels.forEach((h) => { if (h.city && !allPlaces.includes(h.city)) allPlaces.push(h.city); });
  itin.attractions.forEach((a) => { if (a.city && !allPlaces.includes(a.city)) allPlaces.push(a.city); });
  const missing = allPlaces.filter((p) => !infos.some((i) => i.name.toLowerCase() === p.toLowerCase()));

  return (
    <div className="space-y-4">
      <div><h3 className="font-semibold" style={{ color: GHL.text }}>Destination Info</h3><p className="text-xs mt-0.5" style={{ color: GHL.muted }}>Write or AI-generate descriptions. Check the box to show on client itinerary.</p></div>

      {missing.length > 0 && <div className="flex flex-wrap gap-2"><span className="text-xs py-1.5" style={{ color: GHL.muted }}>Quick add:</span>{missing.map((d) => (<button key={d} onClick={() => addDI(d)} className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border hover:opacity-80" style={{ borderColor: GHL.border, color: GHL.accent }}><Icon n="plus" c="w-3 h-3" /> {d}</button>))}</div>}

      {infos.map((di) => (
        <div key={di.id} className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: di.showOnItinerary ? GHL.accent : GHL.border }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ background: di.showOnItinerary ? '#f0f5ff' : GHL.bg, borderBottom: `1px solid ${GHL.border}` }}>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleShow(di.id)} className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={di.showOnItinerary ? { background: GHL.accent, borderColor: GHL.accent } : { borderColor: '#d1d5db' }}>{di.showOnItinerary && <Icon n="check" c="w-3 h-3 text-white" />}</button>
              <div><p className="font-semibold text-sm" style={{ color: GHL.text }}>{di.name}</p><p className="text-[10px]" style={{ color: GHL.muted }}>{di.showOnItinerary ? 'On client itinerary' : 'Hidden'}</p></div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => generateAI(di)} disabled={generating === di.id} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white hover:opacity-90" style={{ background: '#7c3aed' }}>{generating === di.id ? <><div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin border-white" /> Writing...</> : <><Icon n="star" c="w-3 h-3" /> Ask AI</>}</button>
              <button onClick={() => { setEditingId(di.id); setEditText(di.description); }} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: GHL.muted }}><Icon n="edit" c="w-3.5 h-3.5" /></button>
              <button onClick={() => delDI(di.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="px-5 py-4">
            {editingId === di.id ? <div className="space-y-3"><textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={5} className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" style={{ borderColor: GHL.border }} placeholder={`Describe ${di.name}...`} /><div className="flex gap-2"><button onClick={() => saveEdit(di.id)} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Save</button><button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm rounded-lg" style={{ color: GHL.muted }}>Cancel</button></div></div>
            : di.description ? <p className="text-sm leading-relaxed" style={{ color: '#4b5563', fontFamily: "'Georgia', serif" }}>{di.description}</p>
            : <div className="text-center py-4"><p className="text-sm mb-2" style={{ color: GHL.muted }}>No description yet</p><div className="flex gap-2 justify-center"><button onClick={() => { setEditingId(di.id); setEditText(''); }} className="text-xs font-medium px-3 py-1.5 rounded-lg border" style={{ borderColor: GHL.border, color: GHL.accent }}>Write manually</button><button onClick={() => generateAI(di)} className="text-xs font-medium px-3 py-1.5 rounded-lg text-white" style={{ background: '#7c3aed' }}>Generate with AI</button></div></div>}
          </div>
        </div>
      ))}

      <div className="flex gap-2"><input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addDI(newName)} placeholder="Add a place (city, region, landmark)..." className="flex-1 px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: GHL.border }} /><button onClick={() => addDI(newName)} className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add</button></div>
    </div>
  );
}
