import { NextRequest, NextResponse } from 'next/server';

// Server-side AI proxy — avoids CORS issues with direct Anthropic API calls from browser
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, maxTokens = 600 } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Anthropic API error:', res.status, err);
      return NextResponse.json({ error: `API error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    const text = data.content?.find((b: any) => b.type === 'text')?.text || '';
    return NextResponse.json({ text });
  } catch (err: any) {
    console.error('AI route error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
