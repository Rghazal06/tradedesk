/**
 * Validates Twilio webhook signatures using HMAC-SHA1.
 * Must be called on every Twilio voice/SMS webhook to prevent
 * spoofed requests that could spam phones or create fake leads.
 *
 * Reference: https://www.twilio.com/docs/usage/security#validating-signatures
 */
import crypto from 'crypto';
import type { NextRequest } from 'next/server';

export async function validateTwilioSignature(req: NextRequest, rawBody: string): Promise<boolean> {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN not set — cannot validate webhook');
    return false;
  }

  const twilioSignature = req.headers.get('x-twilio-signature');
  if (!twilioSignature) return false;

  // Build the full URL Twilio signed — must match exactly including protocol and host
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host') || '';
  const url = `${proto}://${host}${req.nextUrl.pathname}`;

  // Parse the POST body params and sort them
  const params = new URLSearchParams(rawBody);
  const sortedKeys = Array.from(params.keys()).sort();

  // Build the string to sign: URL + sorted key=value pairs (no separators)
  let stringToSign = url;
  for (const key of sortedKeys) {
    stringToSign += key + (params.get(key) || '');
  }

  const expected = crypto
    .createHmac('sha1', authToken)
    .update(stringToSign)
    .digest('base64');

  // Constant-time comparison to prevent timing attacks
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(twilioSignature);

  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}
