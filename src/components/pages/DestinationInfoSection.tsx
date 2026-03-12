'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { uid } from '@/lib/utils';
import type { Itinerary, DestinationInfo } from '@/lib/types';

interface Props {
  itin: Itinerary;
  onUpdate: (updated: Itinerary) => void;
}

export default function DestinationInfoSection({ itin, onUpdate }: Props) {
  const [generating, setGenerating] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [newName, setNewName] = useState('');

  const infos = itin.destinationInfo || [];

  const addDestInfo = (name: string) => {
    if (!name.trim()) return;
    const ni: DestinationInfo = { id: uid(), name: name.trim(), description: '', showOnItinerary: true };
    onUpdate({ ...itin, destinationInfo: [...infos, ni] });
    setNewName('');
  };

  const deleteDestInfo = (id: number) => {
    onUpdate({ ...itin, destinationInfo: infos.filter((d) => d.id !== id) });
  };

  const toggleShow = (id: number) => {
    onUpdate({ ...itin, destinationInfo: infos.map((d) => d.id === id ? { ...d, showOnItinerary: !d.showOnItinerary } : d) });
  };

  const saveEdit = (id: number) => {
    onUpdate({ ...itin, destinationInfo: infos.map((d) => d.id === id ? { ...d, description: editText } : d) });
    setEditingId(null);
  };

  const generateWithAI = async (destInfo: DestinationInfo) => {
    setGenerating(destInfo.name);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Write a beautiful, elegant 3-4 sentence description of ${destInfo.name} as a travel destination for a luxury travel itinerary. Focus on what makes it special: scenery, culture, cuisine, landmarks, and experiences. Write in a warm, inviting tone suitable for a high-end client-facing travel document. Do NOT use any markdown, bullet points, or headers. Just flowing prose.`
          }]
        }),
      });
      const data = await response.json();
      const text = data.content?.find((b: any) => b.type === 'text')?.text || '';
      onUpdate({ ...itin, destinationInfo: infos.map((d) => d.id === destInfo.id ? { ...d, description: text.trim() } : d) });
    } catch (err) {
      console.error('AI generation error:', err);
    }
    setGenerating(null);
  };

  // Get destinations that don't have info yet
  const missingDests = (itin.destinations || []).filter((d) => d && !infos.some((i) => i.name.toLowerCase() === d.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold" style={{ color: GHL.text }}>Destination Information</h3>
          <p className="text-xs mt-0.5" style={{ color: GHL.muted }}>Add descriptions for each destination. Toggle which ones appear on the client itinerary.</p>
        </div>
      </div>

      {/* Quick add from existing destinations */}
      {missingDests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs py-1.5" style={{ color: GHL.muted }}>Quick add:</span>
          {missingDests.map((d) => (
            <button key={d} onClick={() => addDestInfo(d)} className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border hover:opacity-80 transition-colors" style={{ borderColor: GHL.border, color: GHL.accent }}>
              <Icon n="plus" c="w-3 h-3" /> {d}
            </button>
          ))}
        </div>
      )}

      {/* Destination info cards */}
      {infos.map((di) => (
        <div key={di.id} className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ borderColor: di.showOnItinerary ? GHL.accent : GHL.border }}>
          <div className="flex items-center justify-between px-5 py-3" style={{ background: di.showOnItinerary ? '#f0f5ff' : GHL.bg, borderBottom: `1px solid ${GHL.border}` }}>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleShow(di.id)} className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors" style={di.showOnItinerary ? { background: GHL.accent, borderColor: GHL.accent } : { borderColor: '#d1d5db' }}>
                {di.showOnItinerary && <Icon n="check" c="w-3 h-3 text-white" />}
              </button>
              <div>
                <p className="font-semibold text-sm" style={{ color: GHL.text }}>{di.name}</p>
                <p className="text-[10px]" style={{ color: GHL.muted }}>{di.showOnItinerary ? 'Shown on client itinerary' : 'Hidden from client itinerary'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => generateWithAI(di)} disabled={generating === di.name} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-white hover:opacity-90 transition-opacity" style={{ background: '#7c3aed' }}>
                {generating === di.name ? <><div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin border-white" /> Generating...</> : <><Icon n="star" c="w-3 h-3" /> Ask AI</>}
              </button>
              <button onClick={() => { setEditingId(di.id); setEditText(di.description); }} className="p-1.5 rounded-lg hover:bg-gray-100" style={{ color: GHL.muted }}><Icon n="edit" c="w-3.5 h-3.5" /></button>
              <button onClick={() => deleteDestInfo(di.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="px-5 py-4">
            {editingId === di.id ? (
              <div className="space-y-3">
                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={5} className="w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" style={{ borderColor: GHL.border }} placeholder={`Write about ${di.name}...`} />
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(di.id)} className="px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Save</button>
                  <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm font-medium rounded-lg" style={{ color: GHL.muted }}>Cancel</button>
                  <button onClick={() => { generateWithAI({ ...di, description: '' }); setEditingId(null); }} className="px-4 py-2 text-sm font-medium rounded-lg" style={{ color: '#7c3aed' }}>Generate with AI</button>
                </div>
              </div>
            ) : di.description ? (
              <p className="text-sm leading-relaxed" style={{ color: '#4b5563', fontFamily: "'Georgia', serif" }}>{di.description}</p>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm mb-2" style={{ color: GHL.muted }}>No description yet</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => { setEditingId(di.id); setEditText(''); }} className="text-xs font-medium px-3 py-1.5 rounded-lg border" style={{ borderColor: GHL.border, color: GHL.accent }}>Write manually</button>
                  <button onClick={() => generateWithAI(di)} className="text-xs font-medium px-3 py-1.5 rounded-lg text-white" style={{ background: '#7c3aed' }}><Icon n="star" c="w-3 h-3 inline mr-1" />Generate with AI</button>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Add custom destination */}
      <div className="flex gap-2">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addDestInfo(newName)} placeholder="Add custom destination..." className="flex-1 px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ borderColor: GHL.border }} />
        <button onClick={() => addDestInfo(newName)} className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add</button>
      </div>

      {infos.length === 0 && (
        <div className="text-center py-8 bg-white rounded-xl border" style={{ borderColor: GHL.border }}>
          <Icon n="globe" c="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm mb-1" style={{ color: GHL.text }}>No destination information yet</p>
          <p className="text-xs" style={{ color: GHL.muted }}>Add destinations above or use the quick-add buttons</p>
        </div>
      )}
    </div>
  );
}
