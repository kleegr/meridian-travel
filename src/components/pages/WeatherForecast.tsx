'use client';

import { useState, useEffect } from 'react';
import { GHL } from '@/lib/constants';
import { fmtDate } from '@/lib/utils';
import type { Itinerary } from '@/lib/types';

interface ForecastDay {
  date: string;
  high?: number;
  low?: number;
  unit?: string;
  condition: string;
  conditionType: string;
  icon: string;
  humidity?: number;
  uvIndex?: number;
  rainChance?: number;
  wind?: number;
  windUnit?: string;
}

interface CityForecast {
  city: string;
  forecast: ForecastDay[];
}

// Weather condition to emoji mapping
function weatherEmoji(type: string): string {
  const map: Record<string, string> = {
    'CLEAR': '☀️', 'MOSTLY_CLEAR': '🌤️', 'PARTLY_CLOUDY': '⛅',
    'CLOUDY': '☁️', 'OVERCAST': '☁️', 'FOG': '🌫️',
    'LIGHT_RAIN': '🌦️', 'RAIN': '🌧️', 'RAIN_SHOWERS': '🌧️',
    'HEAVY_RAIN': '🌧️', 'THUNDERSTORM': '⛈️', 'SNOW': '🌨️',
    'LIGHT_SNOW': '🌨️', 'HEAVY_SNOW': '❄️', 'SLEET': '🌨️',
    'WINDY': '💨', 'HAZE': '🌫️',
  };
  return map[type] || '🌤️';
}

function tempF(c: number): number {
  return Math.round(c * 9 / 5 + 32);
}

export default function WeatherForecast({ itin, compact }: { itin: Itinerary; compact?: boolean }) {
  const [forecasts, setForecasts] = useState<CityForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [useFahrenheit, setUseFahrenheit] = useState(true);

  // Get unique cities from the itinerary
  const cities = Array.from(new Set([
    ...itin.hotels.map(h => h.city),
    ...(itin.destinationInfo || []).map(d => d.name),
  ].filter(Boolean)));

  useEffect(() => {
    if (cities.length === 0) { setLoading(false); return; }

    const fetchAll = async () => {
      setLoading(true);
      setError('');
      const results: CityForecast[] = [];

      for (const city of cities.slice(0, 4)) {
        try {
          const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}&days=10`);
          const data = await res.json();
          if (data.forecast) {
            results.push({ city, forecast: data.forecast });
          }
        } catch {}
      }

      setForecasts(results);
      setLoading(false);
    };

    fetchAll();
  }, [itin.id]);

  // Filter forecast to itinerary dates
  const startDate = itin.startDate?.split('T')[0] || '';
  const endDate = itin.endDate?.split('T')[0] || '';

  if (loading) {
    return (
      <div style={{ padding: compact ? '12px 16px' : '16px 24px', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14 }}>☀️</span>
          <span style={{ fontSize: 11, color: GHL.muted }}>Loading weather forecast...</span>
        </div>
      </div>
    );
  }

  if (error || forecasts.length === 0) {
    return null;
  }

  if (compact) {
    // Compact mode for client view / itinerary template
    return (
      <div style={{ padding: '12px 0' }}>
        {forecasts.map(cf => {
          const relevant = cf.forecast.filter(d => d.date >= startDate && d.date <= endDate);
          if (relevant.length === 0) return null;
          return (
            <div key={cf.city} style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: GHL.text, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Weather in {cf.city}</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {relevant.map(d => {
                  const dateObj = new Date(d.date + 'T12:00');
                  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const dayNum = dateObj.getDate();
                  return (
                    <div key={d.date} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 8px', textAlign: 'center', minWidth: 56 }}>
                      <p style={{ fontSize: 8, color: '#94a3b8', fontWeight: 600 }}>{dayName} {dayNum}</p>
                      <p style={{ fontSize: 16, margin: '2px 0' }}>{weatherEmoji(d.conditionType)}</p>
                      <p style={{ fontSize: 9, fontWeight: 700, color: '#1e293b' }}>
                        {useFahrenheit ? `${d.high != null ? tempF(d.high) : '--'}°` : `${d.high != null ? Math.round(d.high) : '--'}°`}
                      </p>
                      <p style={{ fontSize: 7, color: '#94a3b8' }}>
                        {useFahrenheit ? `${d.low != null ? tempF(d.low) : '--'}°` : `${d.low != null ? Math.round(d.low) : '--'}°`}
                      </p>
                      {d.rainChance != null && d.rainChance > 0 && (
                        <p style={{ fontSize: 7, color: '#3b82f6' }}>{d.rainChance}% rain</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Full mode for the admin bookings tab
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🌤️</span>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: GHL.text, margin: 0 }}>Weather Forecast</h3>
        </div>
        <button onClick={() => setUseFahrenheit(!useFahrenheit)} style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 4, border: `1px solid ${GHL.border}`, background: 'white', color: GHL.muted, cursor: 'pointer' }}>
          {useFahrenheit ? '°F' : '°C'} | Switch to {useFahrenheit ? '°C' : '°F'}
        </button>
      </div>

      {forecasts.map(cf => {
        const relevant = cf.forecast.filter(d => d.date >= startDate && d.date <= endDate);
        const allDays = relevant.length > 0 ? relevant : cf.forecast.slice(0, 7);
        return (
          <div key={cf.city} style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: GHL.accent, marginBottom: 8 }}>{cf.city}</p>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
              {allDays.map(d => {
                const dateObj = new Date(d.date + 'T12:00');
                const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const hi = useFahrenheit ? (d.high != null ? tempF(d.high) : null) : (d.high != null ? Math.round(d.high) : null);
                const lo = useFahrenheit ? (d.low != null ? tempF(d.low) : null) : (d.low != null ? Math.round(d.low) : null);
                return (
                  <div key={d.date} style={{ background: 'white', border: `1px solid ${GHL.border}`, borderRadius: 10, padding: '10px 12px', textAlign: 'center', minWidth: 72, flexShrink: 0 }}>
                    <p style={{ fontSize: 9, color: GHL.muted, fontWeight: 600, marginBottom: 2 }}>{dayName}</p>
                    <p style={{ fontSize: 8, color: '#94a3b8', marginBottom: 4 }}>{monthDay}</p>
                    {d.icon ? (
                      <img src={d.icon + '_large.png'} alt={d.condition} style={{ width: 32, height: 32, margin: '0 auto 4px' }} />
                    ) : (
                      <p style={{ fontSize: 22, margin: '0 0 4px' }}>{weatherEmoji(d.conditionType)}</p>
                    )}
                    <p style={{ fontSize: 11, fontWeight: 700, color: GHL.text }}>
                      {hi != null ? `${hi}°` : '--'}
                    </p>
                    <p style={{ fontSize: 9, color: '#94a3b8' }}>
                      {lo != null ? `${lo}°` : '--'}
                    </p>
                    <p style={{ fontSize: 8, color: '#64748b', marginTop: 2 }}>{d.condition}</p>
                    {d.rainChance != null && d.rainChance > 0 && (
                      <p style={{ fontSize: 7, color: '#3b82f6', marginTop: 2 }}>💧 {d.rainChance}%</p>
                    )}
                    {d.wind != null && (
                      <p style={{ fontSize: 7, color: '#64748b', marginTop: 1 }}>💨 {Math.round(d.wind)} km/h</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
