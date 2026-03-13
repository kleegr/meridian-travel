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

export const STATUS_META: Record<string, { bg: string; dot: string; color: string }> = {
  Draft: { bg: '#f0f4f8', dot: '#94a3b8', color: '#475569' },
  Confirmed: { bg: '#ecfdf5', dot: '#10b981', color: '#065f46' },
  'In Progress': { bg: '#eff6ff', dot: '#3b82f6', color: '#1e40af' },
  Completed: { bg: '#f0fdf4', dot: '#22c55e', color: '#15803d' },
  Cancelled: { bg: '#fef2f2', dot: '#ef4444', color: '#991b1b' },
};

export function getStatusMeta(status: string) {
  return STATUS_META[status] || { bg: '#f0f5ff', dot: GHL.accent, color: GHL.text };
}
