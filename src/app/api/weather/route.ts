import { NextRequest, NextResponse } from 'next/server';

// Geocode a city name to lat/lng using Google Geocoding API
async function geocode(city: string, key: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${key}`);
    const data = await res.json();
    if (data.results && data.results[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      return { lat, lng };
    }
  } catch {}
  return null;
}

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get('city');
  const days = req.nextUrl.searchParams.get('days') || '7';

  if (!city) {
    return NextResponse.json({ error: 'city parameter required' }, { status: 400 });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY || '';
  if (!key) {
    return NextResponse.json({ error: 'No API key configured' }, { status: 500 });
  }

  // Step 1: Geocode city to lat/lng
  const coords = await geocode(city, key);
  if (!coords) {
    return NextResponse.json({ error: `Could not geocode: ${city}` }, { status: 404 });
  }

  // Step 2: Get weather forecast from Google Weather API
  try {
    const weatherUrl = `https://weather.googleapis.com/v1/forecast/days:lookup?key=${key}&location.latitude=${coords.lat}&location.longitude=${coords.lng}&days=${Math.min(parseInt(days), 10)}`;
    const weatherRes = await fetch(weatherUrl);
    
    if (!weatherRes.ok) {
      const errText = await weatherRes.text();
      return NextResponse.json({ error: `Weather API error: ${weatherRes.status}`, details: errText }, { status: weatherRes.status });
    }

    const weatherData = await weatherRes.json();

    // Simplify the response for the client
    const forecast = (weatherData.forecastDays || []).map((day: any) => ({
      date: day.displayDate ? `${day.displayDate.year}-${String(day.displayDate.month).padStart(2, '0')}-${String(day.displayDate.day).padStart(2, '0')}` : '',
      high: day.maxTemperature?.degrees,
      low: day.minTemperature?.degrees,
      unit: day.maxTemperature?.unit || 'CELSIUS',
      condition: day.daytimeForecast?.weatherCondition?.description?.text || '',
      conditionType: day.daytimeForecast?.weatherCondition?.type || '',
      icon: day.daytimeForecast?.weatherCondition?.iconBaseUri || '',
      humidity: day.daytimeForecast?.relativeHumidity,
      uvIndex: day.daytimeForecast?.uvIndex,
      rainChance: day.daytimeForecast?.precipitation?.probability?.percent,
      wind: day.daytimeForecast?.wind?.speed?.value,
      windUnit: day.daytimeForecast?.wind?.speed?.unit || 'KILOMETERS_PER_HOUR',
      sunrise: day.sunEvents?.sunrise,
      sunset: day.sunEvents?.sunset,
    }));

    return NextResponse.json({
      city,
      coordinates: coords,
      forecast,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Weather fetch failed' }, { status: 500 });
  }
}
