'use client';

import { SmartFormModal } from '@/components/ui';
import { AGENTS, STATUSES, DEFAULT_CHECKLIST } from '@/lib/constants';
import { uid } from '@/lib/utils';
import { ITINERARY_FIELDS } from '@/components/forms/field-configs';
import type { Itinerary, FormField } from '@/lib/types';

interface Props { onClose: () => void; onCreate: (i: Itinerary) => void; }

export default function NewItineraryModal({ onClose, onCreate }: Props) {
  const fields: FormField[] = ITINERARY_FIELDS.map((f) => {
    if (f.key === 'agent') return { ...f, options: AGENTS };
    if (f.key === 'status') return { ...f, options: STATUSES };
    return f;
  });

  const handleSave = (data: Record<string, string>) => {
    if (!data.title || !data.client || !data.destination) { alert('Please fill in Trip Name, Client, and Destination.'); return; }
    onCreate({
      id: uid(), title: data.title, client: data.client, agent: data.agent || AGENTS[0],
      startDate: data.startDate, endDate: data.endDate, destination: data.destination,
      status: data.status || 'Draft', passengers: parseInt(data.passengers) || 2,
      tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      notes: data.notes, created: new Date().toISOString().split('T')[0],
      passengerList: [], flights: [], hotels: [], transport: [], attractions: [],
      insurance: [], carRentals: [], davening: [], mikvah: [], deposits: 0,
      checklist: DEFAULT_CHECKLIST.map((c) => ({ ...c })),
    });
    onClose();
  };

  return <SmartFormModal title="New Itinerary" subtitle="Create a new trip file" fields={fields} onSave={handleSave} onClose={onClose} initial={{ agent: AGENTS[0], status: 'Draft', passengers: '2' }} />;
}
