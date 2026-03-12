import type { CheckItem } from './types';

export const GHL = {
  sidebar: '#1a1f2e',
  sidebarHover: '#252b3b',
  accent: '#0d9488',
  accentHover: '#0f766e',
  accentLight: '#ccfbf1',
  card: '#ffffff',
  bg: '#f4f6fa',
  border: '#e5e7eb',
  text: '#111827',
  muted: '#6b7280',
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

export const STATUSES = [
  'Draft',
  'Confirmed',
  'In Progress',
  'Completed',
  'Cancelled',
];

export const STATUS_META: Record<string, { color: string; bg: string; dot: string }> = {
  Draft: { color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' },
  Confirmed: { color: '#0d9488', bg: '#ccfbf1', dot: '#0d9488' },
  'In Progress': { color: '#f59e0b', bg: '#fef3c7', dot: '#f59e0b' },
  Completed: { color: '#3b82f6', bg: '#eff6ff', dot: '#3b82f6' },
  Cancelled: { color: '#ef4444', bg: '#fef2f2', dot: '#ef4444' },
};

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
