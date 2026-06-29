import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { rateLimit } from '../../../lib/rateLimit';
import { getAuthUser } from '../../../lib/apiAuth';

export async function POST(req: NextRequest) {
  // Auth required — prevents OpenAI credit abuse
  const user = await getAuthUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit per user (10 scans/minute is generous)
  if (!rateLimit(user.id, 10, 60000)) {
    return NextResponse.json({ error: 'Too many scan requests. Please wait a moment.' }, { status: 429 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const body = await req.json();
    const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : null;
    const mimeType = typeof body.mimeType === 'string' && body.mimeType.startsWith('image/') ? body.mimeType : 'image/jpeg';

    if (!imageBase64) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Sanity-check image size (base64 of 10 MB = ~13.3 MB string)
    if (imageBase64.length > 14_000_000) {
      return NextResponse.json({ error: 'Image too large. Please use a smaller photo.' }, { status: 413 });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a receipt scanner. Analyze this receipt image carefully and extract every detail.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "merchant": "store or vendor name",
  "date": "YYYY-MM-DD or null if not visible",
  "category": "one of: Materials, Tools, Fuel, Food, Office, Insurance, Subcontractor, Other",
  "subtotal": 123.45,
  "tax": 16.05,
  "amount": 139.50,
  "line_items": [
    {
      "description": "item name exactly as on receipt",
      "qty": 2,
      "unit_price": 14.99,
      "amount": 29.98
    }
  ],
  "raw_text": "all visible text on the receipt verbatim"
}

Rules:
- line_items: extract EVERY line item on the receipt. If qty or unit_price is not shown, set them to null. amount is always required per line.
- subtotal: the pre-tax total (null if not shown)
- tax: the tax amount (null if not shown)
- amount: the final total actually paid (required — if ambiguous, use the largest dollar amount on the receipt)
- category: infer from the merchant and items (Home Depot / Rona / Lowes = Materials, gas station = Fuel, restaurant = Food, etc.)
- If a value truly cannot be determined, use null
- Do not include tip lines or change as line items`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not parse receipt' }, { status: 422 });
    }

    const extracted = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ success: true, data: extracted });
  } catch (error) {
    console.error('scan-receipt error:', error);
    return NextResponse.json({ error: 'Receipt scan failed. Please try again.' }, { status: 500 });
  }
}
