'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { uid } from '@/lib/utils';
import type { FinancialConfig, PricingMode, CategoryMarkup, ServiceFee } from '@/lib/types';

interface Props {
  config: FinancialConfig;
  onChange: (c: FinancialConfig) => void;
}

const PRICING_MODES: { mode: PricingMode; label: string; desc: string; icon: string }[] = [
  { mode: 'cost_and_sell', label: 'Cost & Sell (Manual)', desc: 'Enter cost and sell price on every item. Full control. Most common for agencies that negotiate net rates.', icon: 'edit' },
  { mode: 'markup_percentage', label: 'Markup on Cost', desc: 'Enter cost only. Sell price auto-calculated by adding your markup %. Great for agencies with fixed markup policies.', icon: 'trending' },
  { mode: 'commission_on_sell', label: 'Commission on Sell', desc: 'Enter the client sell price only. Your commission is calculated as a % of the sell. Common for commission-based agents.', icon: 'dollar' },
  { mode: 'cost_plus_fixed', label: 'Cost + Fixed Fee', desc: 'Enter cost, sell = cost + a fixed dollar fee per item. Good for agencies that charge flat booking fees.', icon: 'plus' },
  { mode: 'sell_only', label: 'Sell Price Only', desc: 'Only enter the total client price. No cost tracking. Simple mode for agents who don\u2019t track supplier costs.', icon: 'dollar' },
  { mode: 'package_fee', label: 'Package Fee', desc: 'Set one total fee for the entire itinerary instead of per-item pricing. Ideal for all-inclusive packages.', icon: 'globe' },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '\u20ac', name: 'Euro' },
  { code: 'GBP', symbol: '\u00a3', name: 'British Pound' },
  { code: 'ILS', symbol: '\u20aa', name: 'Israeli Shekel' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'JPY', symbol: '\u00a5', name: 'Japanese Yen' },
  { code: 'INR', symbol: '\u20b9', name: 'Indian Rupee' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'THB', symbol: '\u0e3f', name: 'Thai Baht' },
];

const CATEGORIES: { key: CategoryMarkup['category']; label: string; icon: string }[] = [
  { key: 'flight', label: 'Flights', icon: 'plane' },
  { key: 'hotel', label: 'Hotels', icon: 'hotel' },
  { key: 'transport', label: 'Transfers', icon: 'car' },
  { key: 'attraction', label: 'Activities', icon: 'star' },
  { key: 'insurance', label: 'Insurance', icon: 'shield' },
  { key: 'carRental', label: 'Car Rentals', icon: 'car' },
];

const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
const lc = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';

export default function FinancialSettings({ config, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<'pricing' | 'fees' | 'currency' | 'display' | 'advanced'>('pricing');
  const [newFeeName, setNewFeeName] = useState('');

  const set = (key: keyof FinancialConfig, value: any) => onChange({ ...config, [key]: value });

  const getCatMarkup = (cat: CategoryMarkup['category']): CategoryMarkup => {
    return config.categoryMarkups.find((m) => m.category === cat) || { category: cat, markupType: 'percentage', value: config.defaultMarkupPercent };
  };
  const setCatMarkup = (cat: CategoryMarkup['category'], field: 'markupType' | 'value', val: any) => {
    const existing = config.categoryMarkups.filter((m) => m.category !== cat);
    const current = getCatMarkup(cat);
    onChange({ ...config, categoryMarkups: [...existing, { ...current, [field]: field === 'value' ? parseFloat(val) || 0 : val }] });
  };

  const addServiceFee = () => {
    if (!newFeeName.trim()) return;
    const fee: ServiceFee = { id: uid(), name: newFeeName.trim(), type: 'fixed', value: 0, applyTo: 'all', taxable: false };
    set('serviceFees', [...config.serviceFees, fee]);
    setNewFeeName('');
  };
  const updateFee = (id: number, field: keyof ServiceFee, val: any) => {
    set('serviceFees', config.serviceFees.map((f) => f.id === id ? { ...f, [field]: field === 'value' ? parseFloat(val) || 0 : val } : f));
  };
  const removeFee = (id: number) => set('serviceFees', config.serviceFees.filter((f) => f.id !== id));

  // Live preview calculation
  const previewCost = 1000;
  const previewSell = (() => {
    switch (config.pricingMode) {
      case 'markup_percentage': return Math.round(previewCost * (1 + config.defaultMarkupPercent / 100));
      case 'commission_on_sell': return Math.round(previewCost / (1 - config.defaultCommissionPercent / 100));
      case 'cost_plus_fixed': return previewCost + config.defaultFixedFee;
      case 'sell_only': return 1200;
      case 'package_fee': return 5000;
      default: return 1200;
    }
  })();
  const previewProfit = previewSell - previewCost;

  const tabs = [
    { id: 'pricing' as const, label: 'Pricing Mode', icon: 'dollar' },
    { id: 'fees' as const, label: 'Service Fees', icon: 'plus' },
    { id: 'currency' as const, label: 'Currency & Tax', icon: 'globe' },
    { id: 'display' as const, label: 'Display', icon: 'eye' },
    { id: 'advanced' as const, label: 'Advanced', icon: 'settings' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-lg" style={{ color: GHL.text }}>Financial Settings</h3>
        <p className="text-sm" style={{ color: GHL.muted }}>Configure how pricing, markups, commissions, and fees work for your agency</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b pb-px" style={{ borderColor: GHL.border }}>
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-t-lg whitespace-nowrap flex items-center gap-1.5" style={activeTab === t.id ? { color: GHL.accent, borderBottom: `2px solid ${GHL.accent}`, background: GHL.accentLight } : { color: GHL.muted }}>
            <Icon n={t.icon} c="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* ═══ PRICING MODE ═══ */}
      {activeTab === 'pricing' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: GHL.muted }}>How do you price itineraries?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRICING_MODES.map((pm) => (
                <div key={pm.mode} onClick={() => set('pricingMode', pm.mode)} className={`rounded-xl border p-4 cursor-pointer transition-all ${config.pricingMode === pm.mode ? 'ring-2 shadow-md' : 'hover:shadow-sm hover:border-blue-200'}`} style={{ borderColor: config.pricingMode === pm.mode ? GHL.accent : GHL.border, background: config.pricingMode === pm.mode ? '#f0f5ff' : 'white' }}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: config.pricingMode === pm.mode ? GHL.accent : GHL.bg }}>
                      <Icon n={pm.icon} c={`w-4 h-4 ${config.pricingMode === pm.mode ? 'text-white' : ''}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm" style={{ color: GHL.text }}>{pm.label}</p>
                    </div>
                    {config.pricingMode === pm.mode && <Icon n="check" c="w-5 h-5 text-blue-500" />}
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: GHL.muted }}>{pm.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mode-specific settings */}
          {config.pricingMode === 'markup_percentage' && (
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: GHL.muted }}>Markup Settings</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={lc} style={{ color: GHL.muted }}>Default Markup %</label>
                  <div className="relative">
                    <input type="number" value={config.defaultMarkupPercent} onChange={(e) => set('defaultMarkupPercent', parseFloat(e.target.value) || 0)} className={ic + ' pr-8'} style={{ borderColor: GHL.border }} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: GHL.muted }}>%</span>
                  </div>
                </div>
                <div className="flex items-end">
                  <div className="p-3 rounded-lg flex-1" style={{ background: GHL.bg }}>
                    <p className="text-[10px] uppercase" style={{ color: GHL.muted }}>Preview: {config.currencySymbol}1,000 cost</p>
                    <p className="text-lg font-bold" style={{ color: GHL.success }}>{config.currencySymbol}{Math.round(1000 * (1 + config.defaultMarkupPercent / 100)).toLocaleString()} sell</p>
                  </div>
                </div>
              </div>

              {/* Per-category overrides */}
              <div className="flex items-center gap-3 mb-4 p-3 rounded-lg" style={{ background: GHL.bg }}>
                <button onClick={() => set('useCategoryMarkups', !config.useCategoryMarkups)} className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={config.useCategoryMarkups ? { background: GHL.accent, borderColor: GHL.accent } : { borderColor: '#d1d5db' }}>{config.useCategoryMarkups && <Icon n="check" c="w-3 h-3 text-white" />}</button>
                <div><p className="text-sm font-semibold" style={{ color: GHL.text }}>Different markup per category</p><p className="text-[10px]" style={{ color: GHL.muted }}>Set separate markup rates for flights, hotels, transfers, etc.</p></div>
              </div>
              {config.useCategoryMarkups && (
                <div className="space-y-2">
                  {CATEGORIES.map((cat) => {
                    const m = getCatMarkup(cat.key);
                    return (
                      <div key={cat.key} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: GHL.bg }}>
                        <Icon n={cat.icon} c="w-4 h-4" />
                        <span className="text-sm font-medium flex-1" style={{ color: GHL.text }}>{cat.label}</span>
                        <select value={m.markupType} onChange={(e) => setCatMarkup(cat.key, 'markupType', e.target.value)} className="px-2 py-1.5 border rounded text-xs bg-white" style={{ borderColor: GHL.border }}>
                          <option value="percentage">%</option>
                          <option value="fixed">Fixed $</option>
                        </select>
                        <input type="number" value={m.value} onChange={(e) => setCatMarkup(cat.key, 'value', e.target.value)} className="w-20 px-2 py-1.5 border rounded text-sm text-right bg-white" style={{ borderColor: GHL.border }} />
                        <span className="text-xs w-4" style={{ color: GHL.muted }}>{m.markupType === 'percentage' ? '%' : config.currencySymbol}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {config.pricingMode === 'commission_on_sell' && (
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: GHL.muted }}>Commission Settings</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc} style={{ color: GHL.muted }}>Default Commission %</label>
                  <div className="relative">
                    <input type="number" value={config.defaultCommissionPercent} onChange={(e) => set('defaultCommissionPercent', parseFloat(e.target.value) || 0)} className={ic + ' pr-8'} style={{ borderColor: GHL.border }} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: GHL.muted }}>%</span>
                  </div>
                </div>
                <div className="flex items-end">
                  <div className="p-3 rounded-lg flex-1" style={{ background: GHL.bg }}>
                    <p className="text-[10px] uppercase" style={{ color: GHL.muted }}>Preview: {config.currencySymbol}1,000 sell</p>
                    <p className="text-lg font-bold" style={{ color: GHL.success }}>{config.currencySymbol}{Math.round(1000 * config.defaultCommissionPercent / 100)} commission</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {config.pricingMode === 'cost_plus_fixed' && (
            <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: GHL.muted }}>Fixed Fee Settings</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lc} style={{ color: GHL.muted }}>Fee per Booking Item ({config.currencySymbol})</label>
                  <input type="number" value={config.defaultFixedFee} onChange={(e) => set('defaultFixedFee', parseFloat(e.target.value) || 0)} className={ic} style={{ borderColor: GHL.border }} />
                </div>
                <div className="flex items-end">
                  <div className="p-3 rounded-lg flex-1" style={{ background: GHL.bg }}>
                    <p className="text-[10px] uppercase" style={{ color: GHL.muted }}>Preview: {config.currencySymbol}1,000 cost</p>
                    <p className="text-lg font-bold" style={{ color: GHL.success }}>{config.currencySymbol}{(1000 + config.defaultFixedFee).toLocaleString()} sell</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live preview card */}
          <div className="rounded-xl p-5" style={{ background: '#f0f5ff', border: '1px solid #D0E2FA' }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: GHL.accent }}>How it works — Example</p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-[10px] uppercase" style={{ color: GHL.muted }}>Cost</p><p className="text-xl font-bold" style={{ color: GHL.text }}>{config.currencySymbol}{previewCost.toLocaleString()}</p></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-[10px] uppercase" style={{ color: GHL.muted }}>Sell</p><p className="text-xl font-bold" style={{ color: GHL.text }}>{config.currencySymbol}{previewSell.toLocaleString()}</p></div>
              <div className="bg-white rounded-lg p-3 shadow-sm"><p className="text-[10px] uppercase" style={{ color: GHL.success }}>Profit</p><p className="text-xl font-bold" style={{ color: GHL.success }}>{config.currencySymbol}{previewProfit.toLocaleString()}</p></div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ SERVICE FEES ═══ */}
      {activeTab === 'fees' && (
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: GHL.muted }}>Service Fees</p>
            <p className="text-sm" style={{ color: GHL.muted }}>Add planning fees, booking fees, VIP surcharges, or any other fees charged to clients</p>
          </div>

          {config.serviceFees.length > 0 && (
            <div className="space-y-3 mb-4">
              {config.serviceFees.map((fee) => (
                <div key={fee.id} className="rounded-xl border p-4" style={{ borderColor: GHL.border }}>
                  <div className="flex items-center justify-between mb-3">
                    <input value={fee.name} onChange={(e) => updateFee(fee.id, 'name', e.target.value)} className="font-semibold text-sm bg-transparent border-0 focus:outline-none" style={{ color: GHL.text }} />
                    <button onClick={() => removeFee(fee.id)} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold uppercase" style={{ color: GHL.muted }}>Type</label>
                      <select value={fee.type} onChange={(e) => updateFee(fee.id, 'type', e.target.value)} className="w-full px-2 py-2 border rounded-lg text-xs bg-white mt-1" style={{ borderColor: GHL.border }}>
                        <option value="fixed">Fixed Amount</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase" style={{ color: GHL.muted }}>Amount</label>
                      <div className="relative mt-1">
                        <input type="number" value={fee.value} onChange={(e) => updateFee(fee.id, 'value', e.target.value)} className="w-full px-2 py-2 border rounded-lg text-xs pr-6 bg-white" style={{ borderColor: GHL.border }} />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold" style={{ color: GHL.muted }}>{fee.type === 'percentage' ? '%' : config.currencySymbol}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase" style={{ color: GHL.muted }}>Applies To</label>
                      <select value={fee.applyTo} onChange={(e) => updateFee(fee.id, 'applyTo', e.target.value)} className="w-full px-2 py-2 border rounded-lg text-xs bg-white mt-1" style={{ borderColor: GHL.border }}>
                        <option value="all">All Bookings</option>
                        <option value="flight">Flights Only</option>
                        <option value="hotel">Hotels Only</option>
                        <option value="package">Package Total</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer py-2">
                        <input type="checkbox" checked={fee.taxable} onChange={(e) => updateFee(fee.id, 'taxable', e.target.checked)} className="rounded" />
                        <span className="text-xs" style={{ color: GHL.muted }}>Taxable</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {config.serviceFees.length === 0 && (
            <div className="text-center py-8 mb-4" style={{ color: GHL.muted }}>
              <Icon n="plus" c="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No service fees configured</p>
              <p className="text-xs mt-1">Add planning fees, booking fees, or VIP surcharges</p>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t" style={{ borderColor: GHL.border }}>
            <input value={newFeeName} onChange={(e) => setNewFeeName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addServiceFee()} placeholder="e.g. Planning Fee, Booking Fee, VIP Surcharge..." className={ic + ' flex-1'} style={{ borderColor: GHL.border }} />
            <button onClick={addServiceFee} className="px-5 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Add Fee</button>
          </div>

          <div className="mt-4 p-3 rounded-lg" style={{ background: '#fefce8', border: '1px solid #fde68a' }}>
            <p className="text-[10px] font-bold uppercase" style={{ color: '#d97706' }}>Common service fees used by travel agencies:</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {['Planning Fee', 'Booking Fee', 'Research Fee', 'Consultation Fee', 'Cancellation Fee', 'Change Fee', 'Rush Fee', 'VIP Surcharge', 'After-Hours Fee', 'Complex Itinerary Fee'].map((name) => (
                <button key={name} onClick={() => { setNewFeeName(name); }} className="text-[10px] px-2 py-1 rounded bg-white border hover:bg-amber-50" style={{ borderColor: '#fde68a', color: '#92400e' }}>{name}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CURRENCY & TAX ═══ */}
      {activeTab === 'currency' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: GHL.muted }}>Currency</p>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className={lc} style={{ color: GHL.muted }}>Currency</label>
                <select value={config.currency} onChange={(e) => { const c = CURRENCIES.find((cur) => cur.code === e.target.value); if (c) { set('currency', c.code); set('currencySymbol', c.symbol); } }} className={ic} style={{ borderColor: GHL.border }}>
                  {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code} ({c.symbol}) — {c.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lc} style={{ color: GHL.muted }}>Symbol</label>
                <input value={config.currencySymbol} onChange={(e) => set('currencySymbol', e.target.value)} className={ic + ' text-center text-lg font-bold'} style={{ borderColor: GHL.border }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => set('taxEnabled', !config.taxEnabled)} className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={config.taxEnabled ? { background: GHL.accent, borderColor: GHL.accent } : { borderColor: '#d1d5db' }}>{config.taxEnabled && <Icon n="check" c="w-3 h-3 text-white" />}</button>
              <div><p className="text-sm font-semibold" style={{ color: GHL.text }}>Enable Tax</p><p className="text-[10px]" style={{ color: GHL.muted }}>VAT, GST, Sales Tax, or other applicable taxes</p></div>
            </div>
            {config.taxEnabled && (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={lc} style={{ color: GHL.muted }}>Tax Label</label>
                  <input value={config.taxLabel} onChange={(e) => set('taxLabel', e.target.value)} placeholder="VAT" className={ic} style={{ borderColor: GHL.border }} list="tax-labels" />
                  <datalist id="tax-labels"><option value="VAT" /><option value="GST" /><option value="Sales Tax" /><option value="Service Tax" /><option value="Ma'am (VAT)" /></datalist>
                </div>
                <div>
                  <label className={lc} style={{ color: GHL.muted }}>Tax Rate %</label>
                  <div className="relative">
                    <input type="number" value={config.taxRate} onChange={(e) => set('taxRate', parseFloat(e.target.value) || 0)} className={ic + ' pr-8'} style={{ borderColor: GHL.border }} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: GHL.muted }}>%</span>
                  </div>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer py-2.5">
                    <input type="checkbox" checked={config.taxOnServiceFees} onChange={(e) => set('taxOnServiceFees', e.target.checked)} className="rounded" />
                    <span className="text-xs" style={{ color: GHL.muted }}>Tax on service fees</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ DISPLAY ═══ */}
      {activeTab === 'display' && (
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: GHL.muted }}>What to show in the booking forms and tables</p>
          <div className="space-y-3">
            {[
              ['showCostToAgent', 'Show Cost Column', 'Display cost/net rate in booking tables. Turn off if you only track sell prices.'],
              ['showProfitToAgent', 'Show Profit Column', 'Display profit (sell - cost) in booking tables and financials.'],
              ['showMarkupPercent', 'Show Markup %', 'Display the markup percentage alongside profit figures.'],
            ].map(([key, label, desc]) => (
              <div key={key} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: GHL.bg }}>
                <button onClick={() => set(key as any, !(config as any)[key])} className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={(config as any)[key] ? { background: GHL.accent, borderColor: GHL.accent } : { borderColor: '#d1d5db' }}>{(config as any)[key] && <Icon n="check" c="w-3 h-3 text-white" />}</button>
                <div><p className="text-sm font-semibold" style={{ color: GHL.text }}>{label}</p><p className="text-[10px]" style={{ color: GHL.muted }}>{desc}</p></div>
              </div>
            ))}

            <div className="pt-3 mt-3 border-t" style={{ borderColor: GHL.border }}>
              <label className={lc} style={{ color: GHL.muted }}>Round Prices To</label>
              <div className="flex gap-2">
                {[{ v: 1, l: 'Exact' }, { v: 5, l: 'Nearest $5' }, { v: 10, l: 'Nearest $10' }, { v: 50, l: 'Nearest $50' }, { v: 100, l: 'Nearest $100' }].map(({ v, l }) => (
                  <button key={v} onClick={() => set('roundToNearest', v)} className="px-3 py-2 rounded-lg text-xs font-semibold border" style={config.roundToNearest === v ? { background: GHL.accentLight, borderColor: GHL.accent, color: GHL.accent } : { borderColor: GHL.border, color: GHL.muted }}>{l}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADVANCED ═══ */}
      {activeTab === 'advanced' && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: GHL.muted }}>Deposit & Payment Tracking</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: GHL.bg }}>
                <button onClick={() => set('trackDeposits', !config.trackDeposits)} className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={config.trackDeposits ? { background: GHL.accent, borderColor: GHL.accent } : { borderColor: '#d1d5db' }}>{config.trackDeposits && <Icon n="check" c="w-3 h-3 text-white" />}</button>
                <div className="flex-1"><p className="text-sm font-semibold" style={{ color: GHL.text }}>Track Deposits</p><p className="text-[10px]" style={{ color: GHL.muted }}>Record deposit amounts received from clients</p></div>
                {config.trackDeposits && <div className="flex items-center gap-1.5"><input type="number" value={config.defaultDepositPercent} onChange={(e) => set('defaultDepositPercent', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1.5 border rounded text-xs text-right bg-white" style={{ borderColor: GHL.border }} /><span className="text-xs" style={{ color: GHL.muted }}>% default</span></div>}
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: GHL.bg }}>
                <button onClick={() => set('trackPayments', !config.trackPayments)} className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={config.trackPayments ? { background: GHL.accent, borderColor: GHL.accent } : { borderColor: '#d1d5db' }}>{config.trackPayments && <Icon n="check" c="w-3 h-3 text-white" />}</button>
                <div><p className="text-sm font-semibold" style={{ color: GHL.text }}>Track Payments</p><p className="text-[10px]" style={{ color: GHL.muted }}>Record multiple payment installments per itinerary</p></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
            <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: GHL.muted }}>Host Agency Commission Split</p>
            <p className="text-sm mb-4" style={{ color: GHL.muted }}>For independent contractors working under a host agency</p>
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: GHL.bg }}>
              <button onClick={() => set('hostSplitEnabled', !config.hostSplitEnabled)} className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0" style={config.hostSplitEnabled ? { background: GHL.accent, borderColor: GHL.accent } : { borderColor: '#d1d5db' }}>{config.hostSplitEnabled && <Icon n="check" c="w-3 h-3 text-white" />}</button>
              <div className="flex-1"><p className="text-sm font-semibold" style={{ color: GHL.text }}>Enable Host Agency Split</p><p className="text-[10px]" style={{ color: GHL.muted }}>Host takes a percentage of your commission/profit</p></div>
              {config.hostSplitEnabled && <div className="flex items-center gap-1.5"><span className="text-xs" style={{ color: GHL.muted }}>Host takes</span><input type="number" value={config.hostSplitPercent} onChange={(e) => set('hostSplitPercent', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1.5 border rounded text-xs text-right bg-white" style={{ borderColor: GHL.border }} /><span className="text-xs" style={{ color: GHL.muted }}>%</span></div>}
            </div>
            {config.hostSplitEnabled && (
              <div className="mt-3 p-3 rounded-lg" style={{ background: '#f0f5ff' }}>
                <p className="text-[10px] uppercase font-bold" style={{ color: GHL.accent }}>Example: {config.currencySymbol}500 profit</p>
                <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                  <div><span style={{ color: GHL.muted }}>Host ({config.hostSplitPercent}%): </span><span className="font-bold" style={{ color: '#ef4444' }}>{config.currencySymbol}{Math.round(500 * config.hostSplitPercent / 100)}</span></div>
                  <div><span style={{ color: GHL.muted }}>You ({100 - config.hostSplitPercent}%): </span><span className="font-bold" style={{ color: GHL.success }}>{config.currencySymbol}{Math.round(500 * (100 - config.hostSplitPercent) / 100)}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
