'use client';

import { useState } from 'react';
import { Icon } from '@/components/ui';
import { GHL } from '@/lib/constants';
import { uid } from '@/lib/utils';
import type { AutomationRule, AutomationTrigger, AutomationAction } from '@/lib/types';

interface Props {
  rules: AutomationRule[];
  setRules: (r: AutomationRule[]) => void;
  stages: string[];
}

const TRIGGERS: { type: AutomationTrigger['type']; label: string; desc: string }[] = [
  { type: 'flight_status', label: 'Flight Status Changes', desc: 'When a flight status changes to a specific value' },
  { type: 'all_travelers_added', label: 'All Travelers Added', desc: 'When all passenger slots are filled' },
  { type: 'all_flights_added', label: 'Flights Added', desc: 'When at least one flight is added' },
  { type: 'checklist_complete', label: 'Checklist 100%', desc: 'When all checklist items are marked done' },
  { type: 'days_before_departure', label: 'Days Before Departure', desc: 'X days before the trip start date' },
  { type: 'status_change', label: 'Status Changes', desc: 'When itinerary moves to a specific stage' },
  { type: 'pax_added', label: 'Traveler Added', desc: 'When a new traveler is added to the itinerary' },
];

const ACTIONS: { type: AutomationAction['type']; label: string }[] = [
  { type: 'change_status', label: 'Move to Stage' },
  { type: 'add_checklist_item', label: 'Add Checklist Item' },
  { type: 'add_tag', label: 'Add Tag' },
  { type: 'send_notification', label: 'Send Notification' },
];

const FLIGHT_STATUSES = ['Delayed', 'Cancelled', 'Diverted', 'On Time', 'Landed', 'In Air', 'Boarding'];

const arrow = String.fromCharCode(8594);
const bullet = String.fromCharCode(8226);

export default function AutomationsPanel({ rules, setRules, stages }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', triggerType: 'flight_status' as AutomationTrigger['type'], triggerValue: '', actionType: 'change_status' as AutomationAction['type'], actionValue: '' });

  const handleCreate = () => {
    if (!form.name.trim()) return;
    const rule: AutomationRule = {
      id: uid(), name: form.name.trim(), enabled: true,
      trigger: { type: form.triggerType, value: form.triggerValue || undefined },
      action: { type: form.actionType, value: form.actionValue },
    };
    setRules([...rules, rule]);
    setForm({ name: '', triggerType: 'flight_status', triggerValue: '', actionType: 'change_status', actionValue: '' });
    setShowCreate(false);
  };

  const toggleRule = (id: number) => setRules(rules.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
  const deleteRule = (id: number) => setRules(rules.filter((r) => r.id !== id));
  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white';
  const lc = 'block text-xs font-semibold uppercase tracking-wider mb-1.5';

  const getTriggerLabel = (t: AutomationTrigger) => TRIGGERS.find((tr) => tr.type === t.type)?.label || t.type;
  const getActionLabel = (a: AutomationAction) => ACTIONS.find((ac) => ac.type === a.type)?.label || a.type;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold" style={{ color: GHL.text }}>Automations</h2><p className="text-sm" style={{ color: GHL.muted }}>Set up rules that automatically take action on your itineraries</p></div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 text-white rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm hover:opacity-90" style={{ background: GHL.accent }}><Icon n="plus" c="w-4 h-4" /> New Automation</button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-xl border p-6 shadow-sm" style={{ borderColor: GHL.border }}>
          <h3 className="font-semibold mb-4" style={{ color: GHL.text }}>Create Automation</h3>
          <div className="space-y-4">
            <div><label className={lc} style={{ color: GHL.muted }}>Automation Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Move delayed flights to Attention Needed" className={ic} style={{ borderColor: GHL.border }} /></div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl" style={{ background: '#f0f5ff', border: '1px solid #D0E2FA' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: GHL.accent }}>When (Trigger)</p>
                <select value={form.triggerType} onChange={(e) => setForm({ ...form, triggerType: e.target.value as any, triggerValue: '' })} className={ic} style={{ borderColor: GHL.border }}>
                  {TRIGGERS.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
                </select>
                <p className="text-[10px] mt-1.5" style={{ color: GHL.muted }}>{TRIGGERS.find((t) => t.type === form.triggerType)?.desc}</p>
                {form.triggerType === 'flight_status' && <div className="mt-2"><select value={form.triggerValue} onChange={(e) => setForm({ ...form, triggerValue: e.target.value })} className={ic} style={{ borderColor: GHL.border }}><option value="">Any status change</option>{FLIGHT_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>}
                {form.triggerType === 'days_before_departure' && <div className="mt-2"><input type="number" value={form.triggerValue} onChange={(e) => setForm({ ...form, triggerValue: e.target.value })} placeholder="30" className={ic} style={{ borderColor: GHL.border }} /></div>}
                {form.triggerType === 'status_change' && <div className="mt-2"><select value={form.triggerValue} onChange={(e) => setForm({ ...form, triggerValue: e.target.value })} className={ic} style={{ borderColor: GHL.border }}><option value="">Any stage</option>{stages.map((s) => <option key={s}>{s}</option>)}</select></div>}
              </div>
              
              <div className="p-4 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#065f46' }}>Then (Action)</p>
                <select value={form.actionType} onChange={(e) => setForm({ ...form, actionType: e.target.value as any })} className={ic} style={{ borderColor: GHL.border }}>
                  {ACTIONS.map((a) => <option key={a.type} value={a.type}>{a.label}</option>)}
                </select>
                <div className="mt-2">
                  {form.actionType === 'change_status' && <select value={form.actionValue} onChange={(e) => setForm({ ...form, actionValue: e.target.value })} className={ic} style={{ borderColor: GHL.border }}>{stages.map((s) => <option key={s}>{s}</option>)}</select>}
                  {form.actionType !== 'change_status' && <input value={form.actionValue} onChange={(e) => setForm({ ...form, actionValue: e.target.value })} placeholder={form.actionType === 'add_tag' ? 'Tag name' : form.actionType === 'add_checklist_item' ? 'Checklist item text' : 'Notification text'} className={ic} style={{ borderColor: GHL.border }} />}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3"><button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm" style={{ color: GHL.muted }}>Cancel</button><button onClick={handleCreate} className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: GHL.accent }}>Create Automation</button></div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-white rounded-xl border p-4 shadow-sm flex items-center gap-4" style={{ borderColor: GHL.border, opacity: rule.enabled ? 1 : 0.5 }}>
            <button onClick={() => toggleRule(rule.id)} className="w-10 h-6 rounded-full transition-colors flex-shrink-0 relative" style={{ background: rule.enabled ? GHL.accent : '#d1d5db' }}>
              <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all" style={{ left: rule.enabled ? 18 : 2 }} />
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm" style={{ color: GHL.text }}>{rule.name}</p>
              <p className="text-xs mt-0.5" style={{ color: GHL.muted }}>
                <span className="font-semibold" style={{ color: '#1e40af' }}>WHEN</span> {getTriggerLabel(rule.trigger)}{rule.trigger.value ? ` = ${rule.trigger.value}` : ''}
                <span className="mx-1.5">{arrow}</span>
                <span className="font-semibold" style={{ color: '#065f46' }}>THEN</span> {getActionLabel(rule.action)}: {rule.action.value}
              </p>
            </div>
            <button onClick={() => deleteRule(rule.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"><Icon n="trash" c="w-4 h-4" /></button>
          </div>
        ))}
        {rules.length === 0 && !showCreate && (
          <div className="bg-white rounded-xl border p-12 text-center" style={{ borderColor: GHL.border }}>
            <Icon n="settings" c="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="font-semibold" style={{ color: GHL.text }}>No automations yet</p>
            <p className="text-sm mt-1" style={{ color: GHL.muted }}>Create rules like: "When flight is delayed {arrow} Move to Attention Needed"</p>
          </div>
        )}
      </div>

      {/* Examples */}
      <div className="rounded-xl p-5" style={{ background: '#fefce8', border: '1px solid #fde68a' }}>
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#d97706' }}>Popular Automation Ideas</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs" style={{ color: '#92400e' }}>
          {[
            `Flight delayed ${arrow} Move to "Attention Needed"`,
            `All travelers added ${arrow} Move to "Ready to Book"`,
            `Checklist 100% complete ${arrow} Move to "Completed"`,
            `30 days before departure ${arrow} Add tag "Upcoming"`,
            `Flight cancelled ${arrow} Add checklist item "Rebook flight"`,
            `Status changes to Confirmed ${arrow} Add checklist item "Send confirmation email"`,
          ].map((ex, i) => <p key={i}>{bullet} {ex}</p>)}
        </div>
      </div>
    </div>
  );
}
