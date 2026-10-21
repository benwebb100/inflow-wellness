# Contact form email (SendGrid, replacing GoHighLevel)

The site is static HTML on Render (`inflow-wellness.onrender.com`, custom domain `inflow-wellness.com.au`). It has no backend of its own. The contact form on `/contact/` is the only form that sends anything; the Hoi An retreat form went with the retreat page, and the newsletter sign-up was removed in March.

## How it works

```
/contact/ form ──┬─► GHL inbound webhook ─► GHL workflow emails Keren    (old; stays until cutover)
                 └─► Supabase edge function `contact` ─► SendGrid ─► NOTIFY_TO
```

- Function: `supabase/functions/contact/index.ts`, logic in `_shared/contact.ts`. URL `https://vouzbdexpajfcciztisj.supabase.co/functions/v1/contact`.
- Supabase project `inflow-wellness` (`vouzbdexpajfcciztisj`, Sydney), free plan, in the Beadedbychar org. It holds nothing but this function and a `ping()` database function.
- The email is the GHL one word for word: subject *New Contact Form Submission For Inflow-Wellness*, then Name / Email / Message. Reply-To is the visitor, so Keren can just hit Reply. Nothing is sent to the visitor.
- Sent from the SalesPro AI SendGrid account with Inflow's own restricted key, category `inflow-wellness`, click and open tracking off.
- Sender is `Inflow-Wellness Website <notifications@salesproai.com.au>`. Keren manages her own domain's DNS, so it isn't authenticated in SendGrid; `salesproai.com.au` already is. Any domain authenticated in that SendGrid account works (set `EMAIL_FROM`); an unauthenticated one is refused.
- The page shows "sent" if either GHL or the function accepts the message.
- Spam: only the site's own origins are accepted, a hidden honeypot field (`hp`) drops bots silently, and the only recipient is `NOTIFY_TO`, so the endpoint can't be used to email anyone else.
- Keep-alive: free Supabase projects pause after a week without database requests, and a paused project takes the form down. `.github/workflows/keepalive.yml` calls `ping()` every 8 hours and re-enables itself so GitHub doesn't switch the schedule off after 60 quiet days. Supabase emails the project owner a week before any pause.

Render serves the whole repo, so everything committed here is public. No secrets are committed; they live in `.env` (gitignored) and Supabase function secrets.

## Function secrets

| Secret | Value |
|---|---|
| `SENDGRID_API_KEY` | Restricted key, Mail Send only, named `inflow-wellness` in SendGrid |
| `NOTIFY_TO` | Ben's address while GHL is still running; unset at cutover so it falls back to `hello@inflow-wellness.com.au` |
| `EMAIL_FROM` | Optional. Default `Inflow-Wellness Website <notifications@salesproai.com.au>` |
| `SENDGRID_SANDBOX` | `1` makes SendGrid validate without delivering. Never leave it set in production |

## Setup (once)

1. SendGrid (SalesPro account) → Settings → API Keys → Create → Restricted Access → **Mail Send: Full Access**, name `inflow-wellness`. Put it in `.env` as `SENDGRID_API_KEY=…`.
2. Deploy, from this folder:
   ```bash
   supabase link --project-ref vouzbdexpajfcciztisj      # asks for SUPABASE_DB_PASSWORD from .env
   supabase db push                                    # creates ping()
   supabase secrets set SENDGRID_API_KEY=… NOTIFY_TO=…   # or: supabase secrets set --env-file <file>
   supabase functions deploy contact --no-verify-jwt
   ```
3. Commit and push; Render redeploys the site. Run the keep-alive once: `gh workflow run keepalive.yml`.
4. Ask Keren to mark the first one "Not spam" / add the sender to her contacts if it lands in spam.

## Testing

```bash
node --test 'tests/*.test.ts'                                   # request shape, validation, escaping
npx deno check supabase/functions/contact/index.ts
# Whole function locally, SendGrid in sandbox mode (validates, delivers nothing):
set -a; . ./.env; set +a
ALLOWED_ORIGINS=http://localhost:4322 SENDGRID_SANDBOX=1 npx deno run --allow-net --allow-env supabase/functions/contact/index.ts
curl -i -X POST http://127.0.0.1:8000 -H 'Origin: http://localhost:4322' -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"test@example.com","message":"Sandbox test"}'
```

Sandbox mode checks the key and the request body but not the sender: it answers 200 even for an unauthenticated From address. Only a real send proves the sender.

Logs: Supabase dashboard → Edge Functions → contact → Logs. Delivery: SendGrid → Activity, filter by category `inflow-wellness`.

## Cutover: removing the GHL webhook

Do this once SendGrid copies have matched GHL's for a few real submissions.

1. `supabase secrets unset NOTIFY_TO` so the emails go to `hello@inflow-wellness.com.au`.
2. In `contact/index.html`, delete the GHL `post(...)` line and the `Promise.all`, and show success only when the function answers OK:
   ```js
   post('https://vouzbdexpajfcciztisj.supabase.co/functions/v1/contact', { …, hp: … })
     .then(function(ok) { if (ok) { /* success + reset */ } else { /* error */ } })
   ```
   Then confirm `grep -r leadconnectorhq .` finds nothing, commit and push.
3. Submit one test message on the live site and check it reaches Keren's inbox from SendGrid only.
4. In GHL, export the sub-account's contacts (her past enquiries live there) and hand them to Keren, then turn off the contact-form workflow. Cancelling the agency deletes the sub-account, so export first.
