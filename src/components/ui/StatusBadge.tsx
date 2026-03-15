'use client';

import { getStatusMeta } from '@/lib/constants';
import type { StageColor } from '@/lib/types';

interface Props {
  status: string;
  stageColors?: StageColor[];
}

export default function StatusBadge({ status, stageColors }: Props) {
  // Build custom map from stageColors array
  const custom: Record<string, { bg: string; dot: string; color: string }> | undefined = stageColors?.length
    ? Object.fromEntries(stageColors.map((sc) => [sc.stage, { bg: sc.bg, dot: sc.color, color: sc.color }]))
    : undefined;
  const m = getStatusMeta(status, custom);
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
