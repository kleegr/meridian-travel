'use client';

import { STATUS_META } from '@/lib/constants';

export default function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META.Draft;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color: m.color, background: m.bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.dot }} />
      {status}
    </span>
  );
}
