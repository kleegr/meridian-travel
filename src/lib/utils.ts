import type { Itinerary } from './types';

export function calcFin(itin: Itinerary) {
  const sections = [itin.flights, itin.hotels, itin.transport, itin.attractions, itin.insurance, itin.carRentals];
  const totalCost = sections.reduce((a, s) => a + s.reduce((b, x) => b + (x.cost || 0), 0), 0);
  const totalSell = sections.reduce((a, s) => a + s.reduce((b, x) => b + (x.sell || 0), 0), 0);
  const profit = totalSell - totalCost;
  const margin = totalSell ? Math.round((profit / totalSell) * 1000) / 10 : 0;
  const balance = totalSell - (itin.deposits || 0);
  return { totalCost, totalSell, profit, margin, balance };
}

export function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function fmtDate(d: string) {
  if (!d) return '--';
  try {
    const date = new Date(d.includes('T') ? d : d + 'T12:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return d; }
}

// Format datetime to 12-hour format
export function fmtTime12(d: string) {
  if (!d) return '';
  try {
    const date = new Date(d.replace(' ', 'T'));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch { return d; }
}

// Format datetime to 12-hour date + time
export function fmtDateTime12(d: string) {
  if (!d) return '--';
  try {
    const date = new Date(d.replace(' ', 'T'));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch { return d; }
}

export function nights(start: string, end: string) {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
}

export function uid() {
  return Date.now() + Math.floor(Math.random() * 10000);
}
