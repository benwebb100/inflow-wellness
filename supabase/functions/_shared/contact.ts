// Contact form -> notification email to Keren, sent through SendGrid.
// Pure functions with no Deno APIs, so the Node tests import this file directly.

export const DEFAULT_TO = 'hello@inflow-wellness.com.au';
// Sent from Ben's SalesPro domain, already authenticated in the SendGrid account; Keren doesn't manage DNS for hers.
export const DEFAULT_FROM = 'Inflow-Wellness Website <notifications@salesproai.com.au>';
export const SUBJECT = 'New Contact Form Submission For Inflow-Wellness';   // same subject the GHL workflow used

export const ALLOWED_ORIGINS = [
  'https://inflow-wellness.com.au',
  'https://www.inflow-wellness.com.au',
  'https://inflow-wellness.onrender.com',
];

const LIMITS = { name: 200, email: 254, message: 5000 };

export type Submission = { name: string; email: string; message: string };
export type Parsed = { ok: true; value: Submission } | { ok: false; error: string } | { ok: false; spam: true };

/** Validates the form body. `hp` is a hidden honeypot field that only bots fill in. */
export function parseSubmission(body: unknown): Parsed {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  if (str(b.hp)) return { ok: false, spam: true };
  const name = str(b.name).replace(/\s+/g, ' '), email = str(b.email), message = str(b.message);
  if (!name || !email || !message) return { ok: false, error: 'Please fill in your name, email and message.' };
  if (name.length > LIMITS.name || email.length > LIMITS.email || message.length > LIMITS.message) return { ok: false, error: 'That message is too long.' };
  if (!/^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/.test(email)) return { ok: false, error: 'Please check your email address.' };
  return { ok: true, value: { name, email, message } };
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** The GHL workflow's email, word for word: subject, then Name / Email / Message. */
export function notificationEmail(s: Submission): { subject: string; text: string; html: string } {
  const text = `${SUBJECT}\n\nName: ${s.name}\n\nEmail: ${s.email}\n\nMessage: ${s.message}\n`;
  const p = 'margin:0 0 16px';
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5;color:#4b3f39">
<p style="${p};font-weight:bold">${SUBJECT}</p>
<p style="${p}"><strong>Name:</strong> ${escapeHtml(s.name)}</p>
<p style="${p}"><strong>Email:</strong> <a href="mailto:${escapeHtml(s.email)}">${escapeHtml(s.email)}</a></p>
<p style="${p};white-space:pre-wrap"><strong>Message:</strong> ${escapeHtml(s.message)}</p>
</div>`;
  return { subject: SUBJECT, text, html };
}

/** "Name <a@b.c>" -> { name, email } */
export function parseAddress(from: string): { name?: string; email: string } {
  const m = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1] || undefined, email: m[2] } : { email: from.trim() };
}

export type SendOptions = { from: string; to: string; sandbox: boolean };

export function sendgridRequest(key: string, opts: SendOptions, s: Submission): { url: string; init: RequestInit } {
  const e = notificationEmail(s);
  return {
    url: 'https://api.sendgrid.com/v3/mail/send',
    init: {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: opts.to.split(',').map((a) => parseAddress(a)) }],
        from: parseAddress(opts.from),
        reply_to: { email: s.email, name: s.name },   // Keren hits Reply and answers the visitor
        subject: e.subject,
        content: [{ type: 'text/plain', value: e.text }, { type: 'text/html', value: e.html }],   // plain text must come first
        categories: ['inflow-wellness'],
        // Keep links unrewritten and add no tracking pixel.
        tracking_settings: { click_tracking: { enable: false, enable_text: false }, open_tracking: { enable: false } },
        // Sandbox: SendGrid validates the request and answers 200 without delivering anything.
        ...(opts.sandbox ? { mail_settings: { sandbox_mode: { enable: true } } } : {}),
      }),
    },
  };
}

/** CORS headers for an allowed origin; none for anything else, so browsers block it. */
export function corsHeaders(origin: string, allowed: string[]): Record<string, string> {
  if (!allowed.includes(origin)) return { Vary: 'Origin' };
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
