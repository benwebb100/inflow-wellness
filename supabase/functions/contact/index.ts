// POST /functions/v1/contact  { name, email, message, hp }  ->  emails the submission to Keren via SendGrid.
// Secrets: SENDGRID_API_KEY (required), NOTIFY_TO, EMAIL_FROM, SENDGRID_SANDBOX=1, ALLOWED_ORIGINS (comma-separated).
import { ALLOWED_ORIGINS, DEFAULT_FROM, DEFAULT_TO, corsHeaders, parseSubmission, sendgridRequest } from '../_shared/contact.ts';

const env = (k: string) => Deno.env.get(k)?.trim() || '';

Deno.serve(async (req) => {
  const allowed = env('ALLOWED_ORIGINS') ? env('ALLOWED_ORIGINS').split(',').map((o) => o.trim()) : ALLOWED_ORIGINS;
  const origin = req.headers.get('origin') || '';
  const cors = corsHeaders(origin, allowed);
  const reply = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response(null, { status: allowed.includes(origin) ? 204 : 403, headers: cors });
  if (req.method !== 'POST') return reply(405, { error: 'Method not allowed' });
  if (!allowed.includes(origin)) return reply(403, { error: 'Forbidden' });

  let body: unknown;
  try { body = await req.json(); } catch { return reply(400, { error: 'Invalid request' }); }
  const parsed = parseSubmission(body);
  if ('spam' in parsed) { console.log('honeypot filled; not sending'); return reply(200, { ok: true }); }
  if (!parsed.ok) return reply(400, { error: parsed.error });

  const key = env('SENDGRID_API_KEY');
  if (!key) { console.error('SENDGRID_API_KEY is not set'); return reply(500, { error: 'Email is not set up' }); }
  const opts = { from: env('EMAIL_FROM') || DEFAULT_FROM, to: env('NOTIFY_TO') || DEFAULT_TO, sandbox: env('SENDGRID_SANDBOX') === '1' };
  const { url, init } = sendgridRequest(key, opts, parsed.value);
  const res = await fetch(url, init);
  if (!res.ok) { console.error(`SendGrid ${res.status}: ${await res.text()}`); return reply(502, { error: 'Could not send' }); }
  console.log(`contact form emailed to ${opts.to}${opts.sandbox ? ' (sandbox, not delivered)' : ''}`);
  return reply(200, { ok: true });
});
