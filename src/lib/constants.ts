import type { CheckItem } from './types';

// Kleegr platform colors
export const GHL = {
  sidebar: '#093168',
  sidebarHover: '#143F77',
  accent: '#143F77',
  accentHover: '#093168',
  accentLight: '#D0E2FA',
  card: '#FBFBFC',
  bg: '#F0F2F8',
  border: '#D0E2FA',
  text: '#093168',
  muted: '#8599B4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
};

export const AGENTS = [
  'Sarah Chen',
  'Marco Rossi',
  'Aisha Okonkwo',
  'James Liu',
  'Elena Vasquez',
];

export const DEFAULT_STATUSES = [
  'Draft',
  'Confirmed',
  'In Progress',
  'Completed',
  'Cancelled',
];

export const STATUSES = DEFAULT_STATUSES;

export const STATUS_COLORS: Record<string, { color: string; bg: string; dot: string }> = {
  Draft: { color: '#8599B4', bg: '#F0F2F8', dot: '#8599B4' },
  Confirmed: { color: '#143F77', bg: '#D0E2FA', dot: '#143F77' },
  'In Progress': { color: '#f59e0b', bg: '#fef3c7', dot: '#f59e0b' },
  Completed: { color: '#10b981', bg: '#d1fae5', dot: '#10b981' },
  Cancelled: { color: '#ef4444', bg: '#fef2f2', dot: '#ef4444' },
};

export const STATUS_META = STATUS_COLORS;

export function getStatusMeta(status: string) {
  return STATUS_COLORS[status] || { color: '#143F77', bg: '#D0E2FA', dot: '#143F77' };
}

export const DEFAULT_CHECKLIST: CheckItem[] = [
  { id: 1, text: 'Confirm all flights booked', done: false },
  { id: 2, text: 'Hotel confirmations received', done: false },
  { id: 3, text: 'Passport validity checked', done: false },
  { id: 4, text: 'Travel insurance arranged', done: false },
  { id: 5, text: 'Transfers confirmed', done: false },
  { id: 6, text: 'Client payment received', done: false },
  { id: 7, text: 'Itinerary sent to client', done: false },
  { id: 8, text: 'Emergency contacts collected', done: false },
];
