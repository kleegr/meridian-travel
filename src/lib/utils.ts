import type { Itinerary } from './types';

export function calcFin(i: Itinerary) {
  const all = [
    ...i.flights,
    ...i.hotels,
    ...i.transport,
    ...i.attractions,
    ...i.insurance,
    ...i.carRentals,
  ];
  const totalCost = all.reduce((a, b) => a + (b.cost || 0), 0);
  const totalSell = all.reduce((a, b) => a + (b.sell || 0), 0);
  const profit = totalSell - totalCost;
  const margin = totalSell ? ((profit / totalSell) * 100).toFixed(1) : '0.0';
  return {
    totalCost,
    totalSell,
    profit,
    margin,
    balance: totalSell - (i.deposits || 0),
    deposits: i.deposits || 0,
  };
}

export function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n || 0);
}

export function fmtDate(d: string) {
  if (!d) return '--';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return d;
  }
}

export function nights(s: string, e: string) {
  try {
    return Math.round(
      (new Date(e).getTime() - new Date(s).getTime()) / 86400000
    );
  } catch {
    return 0;
  }
}

export function uid() {
  return Date.now() + Math.floor(Math.random() * 10000);
}
