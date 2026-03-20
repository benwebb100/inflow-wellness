# Inflow Wellness — Action Items from Keren's Feedback

## Completed

1. **Contact email fixed** — Changed to hello@inflow-wellness.com.au
2. **Health Coaching "Who This Suits" → "Who This Is For"** — Updated for consistency
3. **Personal Training section reorder** — Moved "How Sessions Work" above "Who This Is For" to match the other pillar pages (descriptive section → who it's for → what to expect)
4. **Health Coaching program links fixed** — "View full details" links for 12-Week Strong Bones and Strength & Fat Loss now point to /personal-training/#programs
5. **"Book a Single Session" → "Enquire About a Session"** — Now links to /contact/ instead of a booking calendar
6. **Header logo** — Replaced "InFlow Wellness" text with actual logo image (logo.png) across all 37 pages
7. **All 6 recipe corrections done:**
   - Pan-Seared Salmon: 6 oz → approx. 170g each; added (200°C)
   - Easy Herby Sausages: 250 g → 250g
   - Chicken Avocado Salad: 300 g → 300g
   - Cottage Cheese Omelette: 200 g → 200g
   - Protein Cottage Cheese Pancakes: 250 g → 250g
   - Sweetcorn Fritters: 280 g → 280g, 120 g → 120g, 185 ml → 185ml

---

## Ask Keren

1. **Company name casing** — She said "all references to my company name should be changed to Inflow-wellness as per logo." Need to confirm the exact format she wants (Inflow-wellness? Inflow Wellness? inflow-wellness?) so we can update it consistently across all pages (footer, meta tags, body copy, copyright notice, etc.)

2. **Replacement banner photo** (#7) — She mentioned attaching examples of what she'd prefer for the "Health should enhance the way you live" parallax section on the homepage. Which photo(s) did she send? Need the file(s).

3. **Replacement travel photo** (#8) — She wants a brighter, more luxurious photo for the Lifestyle & Experiences card on the homepage. Does she have a specific image, or should we source one?

4. **Photo #27** (#9) — She wants the kettlebell photo on the Lifestyle Experiences page swapped to "#27" from the photoshoot. Need to identify which file this is.

5. **High-resolution photos** (#6) — She says all photoshoot images are grainy. Need to get access to the original high-res exports. Were the current images exported at lower quality? Where are the originals?

6. **Testimonial names** (#16) — The last 2 testimonials on the Personal Training page say "Personal Training Client" instead of names. Ask if she can provide names (with permission), or if they should stay anonymous.

7. **Social media URLs** (#2, #3) — Instagram and Facebook links are placeholder (#) across the whole site. She said she'll update the page names — follow up when she's ready to launch.

8. **Newsletter subscription** (#13) — She's happy to keep it for database building even without regular sends. No action needed, but confirm whether there's a backend/service (Mailchimp, etc.) connected to actually capture the emails, or if it's just a dummy form right now.

---

## Ben To-Do

1. **Re-export all photoshoot images at high resolution** — Once originals are located, re-export hero images at ~1920px wide, card images at ~800px, quality 80-85%. Replace all grainy versions in /assets/images/.

2. **Swap homepage banner photo** — Once Keren provides the replacement image for the "Health should enhance..." parallax section (lifestyle-break-1.jpg).

3. **Swap homepage travel photo** — Replace coaching-lifestyle.jpg on the Lifestyle & Experiences card with a brighter travel image once sourced/approved.

4. **Swap lifestyle page kettlebell photo** — Replace lifestyle-whothisisfor.jpg with photo #27 once identified.

5. **Update company name across all pages** — Once Keren confirms exact casing. Will need to update: footer headings (37 pages), copyright notices, meta descriptions, og:titles, body copy references, and the logo alt text.

6. **Set up Stripe products and update purchase links:**
   - eGuides page: High Protein Recipe Guide ($5.99), Tasty Smoothie Guide ($3.99), Complete Wellness Bundle ($9.98)
   - Personal Training page: "Purchase a Session Pack" button
   - All currently pointing to `href="#"`

7. **Update social media links** — When Keren provides the new Instagram and Facebook page URLs, update across all 37 pages (header footer).

8. **Connect contact form** — Make sure the form on /contact/ actually sends submissions to hello@inflow-wellness.com.au (or set up a form handling service like Formspree/Netlify Forms).

9. **Connect newsletter subscription** — Wire up the email subscription forms (homepage + eguides page) to an email service (Mailchimp, ConvertKit, etc.) so signups are actually captured.
