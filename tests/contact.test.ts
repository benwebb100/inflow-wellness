// node --test 'tests/*.test.ts'   (Node 23.6+ runs TypeScript directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ALLOWED_ORIGINS, DEFAULT_FROM, DEFAULT_TO, SUBJECT, corsHeaders, notificationEmail, parseSubmission, sendgridRequest } from '../supabase/functions/_shared/contact.ts';

const good = { name: '  Jane   Citizen ', email: 'jane@example.com', message: 'Hi Keren,\nDo you have Saturday sessions?' };

test('accepts a normal submission and tidies whitespace', () => {
  assert.deepEqual(parseSubmission(good), { ok: true, value: { name: 'Jane Citizen', email: 'jane@example.com', message: 'Hi Keren,\nDo you have Saturday sessions?' } });
});

test('rejects missing fields, bad emails and oversized input', () => {
  for (const body of [null, 'x', {}, { ...good, name: ' ' }, { ...good, message: '' }, { ...good, email: 'jane' }, { ...good, email: 'a b@c.d' }, { ...good, email: 'x@y.com, z@q.com' }]) {
    assert.equal(parseSubmission(body).ok, false, JSON.stringify(body));
  }
  assert.equal(parseSubmission({ ...good, message: 'x'.repeat(5001) }).ok, false);
  assert.equal(parseSubmission({ ...good, message: 'x'.repeat(5000) }).ok, true);
});

test('a filled honeypot is flagged as spam', () => {
  assert.deepEqual(parseSubmission({ ...good, hp: 'http://spam.example' }), { ok: false, spam: true });
  assert.equal(parseSubmission({ ...good, hp: '' }).ok, true);
});

test('email matches the GHL workflow and escapes HTML', () => {
  const e = notificationEmail({ name: 'Jane <b>', email: 'jane@example.com', message: 'a & b\n<script>' });
  assert.equal(e.subject, 'New Contact Form Submission For Inflow-Wellness');
  assert.equal(e.text, `${SUBJECT}\n\nName: Jane <b>\n\nEmail: jane@example.com\n\nMessage: a & b\n<script>\n`);
  assert.match(e.html, /Jane &lt;b&gt;/);
  assert.match(e.html, /a &amp; b\n&lt;script&gt;/);
  assert.doesNotMatch(e.html, /<script>|<b>/);
});

test('SendGrid request: recipient, reply-to, text before HTML, category, no tracking', () => {
  const { url, init } = sendgridRequest('SG.test', { from: DEFAULT_FROM, to: DEFAULT_TO, sandbox: false }, { name: 'Jane', email: 'jane@example.com', message: 'Hello' });
  assert.equal(url, 'https://api.sendgrid.com/v3/mail/send');
  assert.equal((init.headers as Record<string, string>).Authorization, 'Bearer SG.test');
  const b = JSON.parse(init.body as string);
  assert.deepEqual(b.personalizations, [{ to: [{ email: 'hello@inflow-wellness.com.au' }] }]);
  assert.deepEqual(b.from, { name: 'Inflow-Wellness Website', email: 'notifications@salesproai.com.au' });
  assert.deepEqual(b.reply_to, { email: 'jane@example.com', name: 'Jane' });
  assert.deepEqual(b.content.map((c: { type: string }) => c.type), ['text/plain', 'text/html']);
  assert.deepEqual(b.categories, ['inflow-wellness']);
  assert.equal(b.tracking_settings.click_tracking.enable, false);
  assert.equal(b.tracking_settings.open_tracking.enable, false);
  assert.equal(b.mail_settings, undefined);
});

test('sandbox mode and a NOTIFY_TO override', () => {
  const { init } = sendgridRequest('k', { from: 'a@b.co', to: 'Ben <ben@example.com>', sandbox: true }, { name: 'J', email: 'j@x.co', message: 'm' });
  const b = JSON.parse(init.body as string);
  assert.deepEqual(b.mail_settings, { sandbox_mode: { enable: true } });
  assert.deepEqual(b.personalizations[0].to, [{ name: 'Ben', email: 'ben@example.com' }]);
  assert.deepEqual(b.from, { email: 'a@b.co' });
});

test('CORS only for the site origins', () => {
  assert.equal(corsHeaders('https://inflow-wellness.com.au', ALLOWED_ORIGINS)['Access-Control-Allow-Origin'], 'https://inflow-wellness.com.au');
  assert.equal(corsHeaders('https://evil.example', ALLOWED_ORIGINS)['Access-Control-Allow-Origin'], undefined);
  assert.equal(corsHeaders('', ALLOWED_ORIGINS)['Access-Control-Allow-Origin'], undefined);
});
