import type { CheckItem, ChecklistTemplate } from './types';

export const GHL = {
  sidebar: '#093168',
  accent: '#143F77',
  accentLight: '#D0E2FA',
  bg: '#F0F2F8',
  border: '#D0E2FA',
  text: '#093168',
  muted: '#8599B4',
  card: '#FBFBFC',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

export const AGENTS = ['Sarah Chen', 'Marco Rossi', 'Aisha Okonkwo', 'Elena Vasquez', 'James Liu', 'David Kim', 'Rachel Green'];
export const DEFAULT_STATUSES = ['Draft', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];
export const STATUSES = DEFAULT_STATUSES;

export const DEFAULT_CHECKLIST_ITEMS: string[] = [
  'Confirm all flights booked',
  'Hotel confirmations received',
  'Passport validity checked',
  'Travel insurance arranged',
  'Transfers confirmed',
  'Client payment received',
  'Itinerary sent to client',
  'Emergency contacts collected',
];

export const DEFAULT_CHECKLIST: CheckItem[] = DEFAULT_CHECKLIST_ITEMS.map((text, i) => ({ id: i + 1, text, done: false }));

export const DEFAULT_CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  { id: 1, name: 'Standard Travel', items: [...DEFAULT_CHECKLIST_ITEMS] },
  { id: 2, name: 'VIP Package', items: [...DEFAULT_CHECKLIST_ITEMS, 'Send VIP welcome gift', 'Arrange airport lounge access', 'Confirm upgrade requests'] },
  { id: 3, name: 'Group Travel', items: ['Confirm group flights booked', 'Hotel block confirmed', 'Group transfers arranged', 'Dietary requirements collected', 'Rooming list finalized', 'Travel insurance for all', 'Group payment received', 'Send group itinerary', 'Emergency contacts for all'] },
];

export const STAGE_COLOR_PRESETS = [
  { color: '#475569', bg: '#f0f4f8', dot: '#94a3b8', label: 'Gray' },
  { color: '#065f46', bg: '#ecfdf5', dot: '#10b981', label: 'Green' },
  { color: '#1e40af', bg: '#eff6ff', dot: '#3b82f6', label: 'Blue' },
  { color: '#7c3aed', bg: '#f5f3ff', dot: '#8b5cf6', label: 'Purple' },
  { color: '#b45309', bg: '#fffbeb', dot: '#f59e0b', label: 'Amber' },
  { color: '#991b1b', bg: '#fef2f2', dot: '#ef4444', label: 'Red' },
  { color: '#0e7490', bg: '#ecfeff', dot: '#06b6d4', label: 'Cyan' },
  { color: '#be185d', bg: '#fdf2f8', dot: '#ec4899', label: 'Pink' },
  { color: '#15803d', bg: '#f0fdf4', dot: '#22c55e', label: 'Emerald' },
  { color: '#c2410c', bg: '#fff7ed', dot: '#f97316', label: 'Orange' },
];

export const DEFAULT_STAGE_COLORS: Record<string, { bg: string; dot: string; color: string }> = {
  Draft: STAGE_COLOR_PRESETS[0],
  Confirmed: STAGE_COLOR_PRESETS[1],
  'In Progress': STAGE_COLOR_PRESETS[2],
  Completed: STAGE_COLOR_PRESETS[8],
  Cancelled: STAGE_COLOR_PRESETS[5],
};

export const STATUS_META = DEFAULT_STAGE_COLORS;

export function getStatusMeta(status: string, custom?: Record<string, { bg: string; dot: string; color: string }>) {
  if (custom?.[status]) return custom[status];
  return DEFAULT_STAGE_COLORS[status] || { bg: '#f0f5ff', dot: GHL.accent, color: GHL.text };
}
