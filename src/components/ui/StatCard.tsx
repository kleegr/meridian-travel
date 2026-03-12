'use client';

import { GHL } from '@/lib/constants';

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

export default function StatCard({ label, value, sub, accent }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
        {label}
      </p>
      <p className="text-2xl font-bold" style={{ color: accent || GHL.text }}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}
