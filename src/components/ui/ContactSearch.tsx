'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { GHL } from '@/lib/constants';
import { Icon } from '@/components/ui';

export interface GHLContact {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  tags: string[];
}

interface Props {
  locationId: string;
  value: string;
  onChange: (name: string) => void;
  onSelect: (contact: GHLContact) => void;
  placeholder?: string;
}

export default function ContactSearch({ locationId, value, onChange, onSelect, placeholder = 'Search contacts...' }: Props) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<GHLContact[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value
  useEffect(() => { setQuery(value); }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchContacts = async (q: string) => {
    if (!locationId || q.length < 2) { setResults([]); return; }
    setIsLoading(true);
    try {
      const res = await axios.get(`/api/contacts?locationId=${encodeURIComponent(locationId)}&q=${encodeURIComponent(q)}`);
      if (res.data?.success) {
        setResults(res.data.contacts || []);
        setIsOpen(true);
      }
    } catch (e) {
      console.error('Contact search failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInput = (val: string) => {
    setQuery(val);
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchContacts(val), 400);
  };

  const handleSelect = (contact: GHLContact) => {
    setQuery(contact.name);
    onChange(contact.name);
    onSelect(contact);
    setIsOpen(false);
  };

  const ic = 'w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200';

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          placeholder={placeholder}
          className={ic}
          style={{ borderColor: GHL.border }}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
        {!isLoading && query.length >= 2 && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Icon n="search" c="w-4 h-4" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-xl max-h-60 overflow-y-auto" style={{ borderColor: GHL.border }}>
          {results.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelect(c)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b last:border-0 flex items-center gap-3"
              style={{ borderColor: GHL.bg }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: GHL.accent }}>
                {c.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: GHL.text }}>{c.name}</p>
                <p className="text-xs truncate" style={{ color: GHL.muted }}>
                  {[c.email, c.phone].filter(Boolean).join(' · ') || 'No contact info'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-lg p-4 text-center" style={{ borderColor: GHL.border }}>
          <p className="text-sm" style={{ color: GHL.muted }}>No contacts found. A new contact will be created.</p>
        </div>
      )}
    </div>
  );
}
