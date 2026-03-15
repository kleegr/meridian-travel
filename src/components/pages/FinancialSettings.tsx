'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import type { FinancialConfig, PricingMode, CategoryMarkup } from '@/lib/types';

interface Props {
  config: FinancialConfig;
  onChange: (c: FinancialConfig) => void;
}

const PRICING_MODES: { mode: PricingMode; label: string; desc: string }[] = [
  { mode: 'cost_and_sell', label: 'Cost & Sell (Manual)', desc: 'You enter cost and sell price on every booking item. Full control over each line.' },
  { mode: 'markup_percentage', label: 'Auto Markup on Cost', desc: 'You enter cost only. Sell price is auto-calculated by adding your markup percentage.' },
  { mode: 'sell_minus_commission', label: 'Commission on Sell', desc: 'You enter the client sell price. Your commission is calculated as a percentage of the sell.' },
  { mode: 'cost_plus_fixed', label: 'Cost + Fixed Fee', desc: 'You enter cost. A fixed dollar amount is added as your fee on each item.' },
  { mode: 'sell_only', label: 'Sell Price Only', desc: 'You only enter what the client pays. No cost tracking at all — simplest mode.' },
  { mode: 'package_fee', label: 'Package Fee', desc: 'One total fee for the entire itinerary. No per-item pricing — just a single package price.' },
];

const CATEGORIES: { key: CategoryMarkup['category']; label: string; icon: string }[] = [
  { key: 'flight', label: 'Flights', icon: 'plane' },
  { key: 'hotel', label: 'Hotels', icon: 'hotel' },
  { key: 'transport', label: 'Transfers', icon: 'car' },
  { key: 'attraction', label: 'Activities', icon: 'star' },
  { key: 'insurance', label: 'Insurance', icon: 'shield' },
  { key: 'carRental', label: 'Car Rentals', icon: 'car' },
];

export default function FinancialSettings({ config, onChange }: Props) {
  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';

  const set = (key: keyof FinancialConfig, value: any) => onChange({ ...config, [key]: value });

  const getCatMarkup = (cat: CategoryMarkup['category']): CategoryMarkup => {
    return config.categoryMarkups.find((m) => m.category === cat) || { category: cat, markupType: 'percentage', value: config.defaultMarkupPercent };
  };
  const setCatMarkup = (cat: CategoryMarkup['category'], field: 'markupType' | 'value', val: any) => {
    const existing = config.categoryMarkups.filter((m) => m.category !== cat);
    const current = getCatMarkup(cat);
    onChange({ ...config, categoryMarkups: [...existing, { ...current, [field]: field === 'value' ? parseFloat(val) || 0 : val }] });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-lg" style={{ color: GHL.text }}>Financial Settings</h3>
        <p className="text-sm" style={{ color: GHL.muted }}>Choose how you price itineraries and what you see in booking forms</p>
      </div>

      {/* ═══ PRICING MODE ═══ */}
      <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: GHL.muted }}>How do you price your itineraries?</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRICING_MODES.map((pm) => (
            <div key={pm.mode} onClick={() => set('pricingMode', pm.mode)} className={`rounded-xl border p-4 cursor-pointer transition-all ${config.pricingMode === pm.mode ? 'ring-2 shadow-md' : 'hover:shadow-sm hover:border-blue-200'}`} style={{ borderColor: config.pricingMode === pm.mode ? GHL.accent : GHL.border, background: config.pricingMode === pm.mode ? '#f0f5ff' : 'white' }}>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={config.pricingMode === pm.mode ? { borderColor: GHL.accent, background: GHL.accent } : { borderColor: '#d1d5db' }}>
                  {config.pricingMode === pm.mode && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <p className="font-bold text-sm" style={{ color: GHL.text }}>{pm.label}</p>
              </div>
              <p className="text-[11px] leading-relaxed ml-8" style={{ color: GHL.muted }}>{pm.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ MODE-SPECIFIC SETTINGS ═══ */}
      {config.pricingMode === 'markup_percentage' && (
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: GHL.muted }}>Markup Settings</p>
          <div className="flex items-end gap-4 mb-5">
            <div className="flex-1">
              <label className={lc} style={{ color: GHL.muted }}>Default Markup %</label>
              <div className="relative">
                <input type="number" value={config.defaultMarkupPercent} onChange={(e) => set('defaultMarkupPercent', parseFloat(e.target.value) || 0)} className={ic + ' pr-8 text-lg font-bold'} style={{ borderColor: GHL.border }} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: GHL.muted }}>%</span>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <p className="text-[10px] uppercase font-semibold" style={{ color: '#065f46' }}>Example</p>
              <p className="text-xs" style={{ color: '#065f46' }}>$1,000 cost → <span className="font-bold">${Math.round(1000 * (1 + config.defaultMarkupPercent / 100)).toLocaleString()}</span> sell</p>
              <p className="text-xs" style={{ color: '#065f46' }}>Profit: <span className="font-bold">${Math.round(1000 * config.defaultMarkupPercent / 100)}</span></p>
            </div>
          </div>

          {/* Per-category overrides */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-lg cursor-pointer" style={{ background: GHL.bg }} onClick={() => set('useCategoryMarkups', !config.useCategoryMarkups)}>
            <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={config.useCategoryMarkups ? { background: GHL.accent, borderColor: GHL.accent } : { borderColor: '#d1d5db' }}>{config.useCategoryMarkups && <Icon n="check" c="w-3 h-3 text-white" />}</div>
            <div><p className="text-sm font-semibold" style={{ color: GHL.text }}>Different markup per category</p><p className="text-[10px]" style={{ color: GHL.muted }}>Example: 12% on flights, 20% on hotels, 25% on activities</p></div>
          </div>
          {config.useCategoryMarkups && (
            <div className="space-y-2 pl-1">
              {CATEGORIES.map((cat) => {
                const m = getCatMarkup(cat.key);
                return (
                  <div key={cat.key} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: GHL.bg }}>
                    <Icon n={cat.icon} c="w-4 h-4" />
                    <span className="text-sm font-medium w-24" style={{ color: GHL.text }}>{cat.label}</span>
                    <select value={m.markupType} onChange={(e) => setCatMarkup(cat.key, 'markupType', e.target.value)} className="px-2 py-1.5 border rounded text-xs bg-white" style={{ borderColor: GHL.border }}>
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed $</option>
                    </select>
                    <input type="number" value={m.value} onChange={(e) => setCatMarkup(cat.key, 'value', e.target.value)} className="w-20 px-2 py-1.5 border rounded text-sm text-right bg-white" style={{ borderColor: GHL.border }} />
                    <span className="text-xs font-semibold w-4" style={{ color: GHL.muted }}>{m.markupType === 'percentage' ? '%' : '$'}</span>
                    <span className="text-[10px] ml-auto" style={{ color: GHL.muted }}>
                      $1,000 → ${m.markupType === 'percentage' ? Math.round(1000 * (1 + m.value / 100)).toLocaleString() : (1000 + m.value).toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {config.pricingMode === 'sell_minus_commission' && (
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: GHL.muted }}>Commission Settings</p>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className={lc} style={{ color: GHL.muted }}>Your Commission %</label>
              <div className="relative">
                <input type="number" value={config.defaultCommissionPercent} onChange={(e) => set('defaultCommissionPercent', parseFloat(e.target.value) || 0)} className={ic + ' pr-8 text-lg font-bold'} style={{ borderColor: GHL.border }} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: GHL.muted }}>%</span>
              </div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <p className="text-[10px] uppercase font-semibold" style={{ color: '#065f46' }}>Example</p>
              <p className="text-xs" style={{ color: '#065f46' }}>$1,000 sell price</p>
              <p className="text-xs" style={{ color: '#065f46' }}>Your commission: <span className="font-bold">${Math.round(1000 * config.defaultCommissionPercent / 100)}</span></p>
            </div>
          </div>
        </div>
      )}

      {config.pricingMode === 'cost_plus_fixed' && (
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: GHL.muted }}>Fixed Fee Settings</p>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className={lc} style={{ color: GHL.muted }}>Fee per Booking Item ($)</label>
              <input type="number" value={config.defaultFixedFee} onChange={(e) => set('defaultFixedFee', parseFloat(e.target.value) || 0)} className={ic + ' text-lg font-bold'} style={{ borderColor: GHL.border }} />
            </div>
            <div className="p-3 rounded-lg" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <p className="text-[10px] uppercase font-semibold" style={{ color: '#065f46' }}>Example</p>
              <p className="text-xs" style={{ color: '#065f46' }}>$1,000 cost + ${config.defaultFixedFee} fee</p>
              <p className="text-xs" style={{ color: '#065f46' }}>Client pays: <span className="font-bold">${(1000 + config.defaultFixedFee).toLocaleString()}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DISPLAY OPTIONS ═══ */}
      <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: GHL.muted }}>What to show in booking forms & tables</p>
        <div className="space-y-2">
          {[
            { key: 'showCostToAgent' as const, label: 'Show Cost Column', desc: 'Display cost/net rate in booking tables and forms' },
            { key: 'showProfitToAgent' as const, label: 'Show Profit Column', desc: 'Display profit (sell minus cost) in tables and financials' },
            { key: 'showMarkupPercent' as const, label: 'Show Markup %', desc: 'Display the markup percentage alongside profit' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer" style={{ background: GHL.bg }} onClick={() => set(key, !config[key])}>
              <div className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={config[key] ? { background: GHL.accent, borderColor: GHL.accent } : { borderColor: '#d1d5db' }}>{config[key] && <Icon n="check" c="w-3 h-3 text-white" />}</div>
              <div><p className="text-sm font-semibold" style={{ color: GHL.text }}>{label}</p><p className="text-[10px]" style={{ color: GHL.muted }}>{desc}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ SUMMARY ═══ */}
      <div className="rounded-xl p-5" style={{ background: '#f0f5ff', border: '1px solid #D0E2FA' }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: GHL.accent }}>Your Setup</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <p className="text-[10px] uppercase" style={{ color: GHL.muted }}>Mode</p>
            <p className="text-sm font-bold" style={{ color: GHL.text }}>{PRICING_MODES.find((p) => p.mode === config.pricingMode)?.label || config.pricingMode}</p>
          </div>
          {config.pricingMode === 'markup_percentage' && <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-[10px] uppercase" style={{ color: GHL.muted }}>Markup</p><p className="text-sm font-bold" style={{ color: GHL.text }}>{config.defaultMarkupPercent}%</p></div>}
          {config.pricingMode === 'sell_minus_commission' && <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-[10px] uppercase" style={{ color: GHL.muted }}>Commission</p><p className="text-sm font-bold" style={{ color: GHL.text }}>{config.defaultCommissionPercent}%</p></div>}
          {config.pricingMode === 'cost_plus_fixed' && <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-[10px] uppercase" style={{ color: GHL.muted }}>Fee</p><p className="text-sm font-bold" style={{ color: GHL.text }}>${config.defaultFixedFee}</p></div>}
          <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-[10px] uppercase" style={{ color: GHL.muted }}>Cost Column</p><p className="text-sm font-bold" style={{ color: config.showCostToAgent ? GHL.success : '#ef4444' }}>{config.showCostToAgent ? 'Visible' : 'Hidden'}</p></div>
          <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-[10px] uppercase" style={{ color: GHL.muted }}>Profit Column</p><p className="text-sm font-bold" style={{ color: config.showProfitToAgent ? GHL.success : '#ef4444' }}>{config.showProfitToAgent ? 'Visible' : 'Hidden'}</p></div>
        </div>
      </div>
    </div>
  );
}
