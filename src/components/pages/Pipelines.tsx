'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { uid } from '@/lib/utils';
import type { Pipeline } from '@/lib/types';

interface PipelinesProps {
  pipelines: Pipeline[];
  onUpdate: (p: Pipeline[]) => void;
}

export default function Pipelines({ pipelines, onUpdate }: PipelinesProps) {
  const [selected, setSelected] = useState<number | null>(pipelines[0]?.id || null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStage, setNewStage] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const current = pipelines.find((p) => p.id === selected);

  const addPipeline = () => {
    if (!newName.trim()) return;
    const np: Pipeline = { id: uid(), name: newName.trim(), stages: ['New', 'In Progress', 'Done'] };
    onUpdate([...pipelines, np]);
    setSelected(np.id);
    setNewName('');
    setShowNew(false);
  };

  const deletePipeline = (id: number) => {
    const np = pipelines.filter((p) => p.id !== id);
    onUpdate(np);
    if (selected === id) setSelected(np[0]?.id || null);
  };

  const addStage = () => {
    if (!newStage.trim() || !current) return;
    onUpdate(pipelines.map((p) => (p.id === current.id ? { ...p, stages: [...p.stages, newStage.trim()] } : p)));
    setNewStage('');
  };

  const deleteStage = (idx: number) => {
    if (!current) return;
    onUpdate(pipelines.map((p) => (p.id === current.id ? { ...p, stages: p.stages.filter((_, i) => i !== idx) } : p)));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx || !current) return;
    const stages = [...current.stages];
    const [moved] = stages.splice(dragIdx, 1);
    stages.splice(idx, 0, moved);
    onUpdate(pipelines.map((p) => (p.id === current.id ? { ...p, stages } : p)));
    setDragIdx(idx);
  };

  const handleDragEnd = () => setDragIdx(null);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Pipelines</h2>
          <p className="text-gray-400 text-sm">Manage workflow stages</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 text-white rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
          style={{ background: GHL.accent }}
        >
          <Icon n="plus" c="w-4 h-4" /> New Pipeline
        </button>
      </div>

      {showNew && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex gap-3">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPipeline()}
              placeholder="Pipeline name..."
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            />
            <button onClick={addPipeline} className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Create</button>
            <button onClick={() => setShowNew(false)} className="px-3 py-2.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      {/* Pipeline tabs */}
      <div className="flex gap-3 flex-wrap">
        {pipelines.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={selected === p.id ? { background: GHL.accent, color: 'white' } : { background: 'white', color: '#6b7280', border: '1px solid #e5e7eb' }}
          >
            {p.name} <span className="ml-1 opacity-60">({p.stages.length})</span>
          </button>
        ))}
      </div>

      {/* Stages */}
      {current && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">{current.name} \u2014 Stages</h3>
            <button onClick={() => deletePipeline(current.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">
              Delete Pipeline
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-2">
              {current.stages.map((stage, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all cursor-grab active:cursor-grabbing"
                  style={dragIdx === idx ? { opacity: 0.5 } : {}}
                >
                  <span className="text-gray-300 cursor-grab"><Icon n="grip" c="w-4 h-4" /></span>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: GHL.accent }}>{idx + 1}</span>
                  <span className="flex-1 font-medium text-gray-800 text-sm">{stage}</span>
                  <button onClick={() => deleteStage(idx)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                    <Icon n="trash" c="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
              <input
                value={newStage}
                onChange={(e) => setNewStage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addStage()}
                placeholder="Add new stage..."
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              <button onClick={addStage} className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add Stage</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
