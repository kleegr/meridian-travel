'use client';

import { useRef, useState, useEffect } from 'react';

interface GooglePlacesInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  types?: string;
}

export default function GooglePlacesInput({ value, onChange, placeholder, className, types }: GooglePlacesInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Fetch the API key from our server route (so we don't need NEXT_PUBLIC_ prefix)
  const [apiKey, setApiKey] = useState<string | null>(null);
  useEffect(() => {
    // Check if already loaded
    if ((window as any).google?.maps?.places) { setLoaded(true); return; }
    // Try the public env var first
    const pubKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (pubKey) { setApiKey(pubKey); return; }
    // Otherwise fetch from server
    fetch('/api/places?action=key').then((r) => r.json()).then((d) => { if (d.key) setApiKey(d.key); }).catch(() => {});
  }, []);

  useEffect(() => {
    if ((window as any).google?.maps?.places) { setLoaded(true); return; }
    if (!apiKey) return;
    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existing) { existing.addEventListener('load', () => setLoaded(true)); return; }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true; script.defer = true;
    script.onload = () => setLoaded(true);
    document.head.appendChild(script);
  }, [apiKey]);

  useEffect(() => {
    if (!loaded || !inputRef.current || autocompleteRef.current) return;
    if (!(window as any).google?.maps?.places) return;
    const opts: google.maps.places.AutocompleteOptions = { fields: ['formatted_address', 'name', 'geometry'] };
    if (types) opts.types = [types];
    const ac = new (window as any).google.maps.places.Autocomplete(inputRef.current, opts);
    ac.addListener('place_changed', () => { const place = ac.getPlace(); onChange(place?.formatted_address || place?.name || ''); });
    autocompleteRef.current = ac;
  }, [loaded, types, onChange]);

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 22s-8-4.5-8-11.8A8 8 0 0120 10.2C20 17.5 12 22 12 22zm0-7a2 2 0 100-4 2 2 0 000 4z" /></svg></span>
      <input ref={inputRef} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || 'Search location...'} className={className || 'w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white'} autoComplete="off" />
    </div>
  );
}
