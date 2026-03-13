'use client';

import Icon from './Icon';
import { GHL } from '@/lib/constants';
import type { Row } from '@/lib/types';

interface Column { key: string; label: string; render?: (r: Row) => React.ReactNode; }

interface MiniTableProps {
  cols: Column[];
  rows: Row[];
  addLabel?: string;
  onAdd?: () => void;
  onDelete?: (id: number) => void;
  onEdit?: (id: number) => void;
}

export default function MiniTable({ cols, rows, addLabel, onAdd, onDelete, onEdit }: MiniTableProps) {
  if (!rows.length) return <div className="text-center py-8"><p className="text-gray-400 text-sm mb-3">No entries yet</p>{onAdd && <button onClick={onAdd} className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-50" style={{ color: GHL.accent }}><Icon n="plus" /> {addLabel || 'Add entry'}</button>}</div>;

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50">{cols.map((c) => (<th key={c.key} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{c.label}</th>))}{(onEdit || onDelete) && <th className="w-20" />}</tr></thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                {cols.map((c) => (<td key={c.key} className="px-4 py-3 text-gray-700 whitespace-nowrap">{c.render ? c.render(r) : String(r[c.key] ?? '--')}</td>))}
                {(onEdit || onDelete) && <td className="px-2 py-3">
                  <div className="flex items-center gap-1">
                    {onEdit && <button onClick={() => onEdit(Number(r.id))} className="p-1 rounded hover:bg-blue-50 text-gray-300 hover:text-blue-500 transition-colors" title="Edit"><Icon n="edit" c="w-3.5 h-3.5" /></button>}
                    {onDelete && <button onClick={() => onDelete(Number(r.id))} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors" title="Delete"><Icon n="trash" c="w-3.5 h-3.5" /></button>}
                  </div>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onAdd && <button onClick={onAdd} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-50" style={{ color: GHL.accent }}><Icon n="plus" /> {addLabel || 'Add entry'}</button>}
    </div>
  );
}
