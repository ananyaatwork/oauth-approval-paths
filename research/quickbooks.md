# Intuit QuickBooks Online — OAuth app setup and production approval

*Researched 2026-10-21. Primary docs pages on developer.intuit.com are rendered with JavaScript, so we read the same content from static.developer.intuit.com/output_html mirrors.*

## Summary verdict
- **Difficulty: 3/5.** Sandbox keys are available right away. Production keys sit behind an App Details form plus an App Assessment Questionnaire that Intuit must approve. A QuickBooks App Store listing is a separate, much heavier review in 3 parts.
- **Time estimate (production keys, unlisted app):**
  - Setup (account, app, sandbox, OAuth flow): hours to 1–2 days of build work. Our estimate, no official figure.
  - Submission: App Details "about 30 minutes" (CONFIRMED). We found no stated length for the questionnaire. Codat says roughly 30 min (SECONDARY).
  - Review wait: **no stated SLA** for questionnaire approval.
  - Revisions: no stated SLA.
- **Time estimate (App Store listing, optional):** Intuit emails within 2 business days to set up a call. Then the technical review is 10 business days, the security review up to 30 business days, and the marketing review 5 business days. Intuit says these are "estimates only" (CONFIRMED). Total is about 9–10 weeks before any fixes.

## Steps
1. Create an Intuit Developer account and a workspace with basic company info.
2. Go to My Hub > App dashboard > "+" to create an app, then choose scopes: `com.intuit.quickbooks.accounting`, `com.intuit.quickbooks.payment`, `openid` (plus profile/email/phone/address). Scopes can be added later but never removed.
3. A US sandbox company is created automatically. You can have up to 10 sandboxes, each lasting 2 years.
4. Keys and credentials > Development > Show credentials. These keys work with sandbox companies only.
5. Set Development redirect URIs. Localhost over plain HTTP is allowed here.
6. Build OAuth and test connect, disconnect and reconnect against the sandbox. The OAuth 2.0 Playground is fine for quick checks.
7. Production > App Details: contact email, EULA URL, Privacy Policy URL, host domain, launch URL, disconnect URL, connect/reconnect URL, up to 4 categories, regulated industries, hosting regions.
8. Review your account profile (My Hub > Account Profile) and verify your email.
9. Production > Compliance > Start Questionnaire, then submit.
10. After approval, the "Show Credentials" switch appears under Production. Copy the production Client ID and secret, and set HTTPS production redirect URIs.
11. Optional: go through the 3-part App Store review.

## Approval and review requirements
- **Production keys:** "The client ID and client secret will be accessible only after completing the Production Key questionnaire and its approval." Intuit support says this applies even to private or internal apps.
- **Questionnaire sections (per Codat's walkthrough):**
  - App info: how the app was built, platforms, public or private, user types.
  - Auth: whether you tested connect/disconnect/reconnect, how often you refresh tokens, retries, how you handle `invalid_grant` and CSRF, whether you use the discovery document.
  - API usage: categories used, call frequency.
  - Accounting API: versions supported, multi-currency, sales tax, webhooks, CDC.
  - Error handling: capturing `intuit_tid`, logging, in-app support contact.
  - Security: past breaches, a security team, storage of the secret, MFA, captcha, who can access the data.
  - Lending questions appear only if you flag the app as a lender.
- **Redirect URIs:** must be HTTPS, and IP addresses are not allowed. Sandbox and production URIs are set separately. A listed app also needs a valid SaaS domain.
- **App Store listing:**
  - Connect to QuickBooks and Sign in with Intuit buttons, an `emailVerified` check, a disconnect action that calls revoke, multi-company support for accountant apps, and Intuit-approved logos.
  - All critical, high and medium security findings must be fixed. HTTPS everywhere, TLS 1.2 recommended, Secure and HttpOnly cookies.
  - Lending, insurance, investment and payments apps go through an extra industry review.
  - There is an annual compliance review, and the security affidavit is due within 2 weeks of Intuit's request.

## Gotchas
- **Refresh tokens:** they expire after 100 days unused (rolling). There is now a **5-year hard maximum**, listed in the Feb 2026 release notes. The token **rotates about every 24 hours**: store the newest value from every response, because the old one stops working. Access tokens last 1 hour.
- **First 5-year expiries:** reported for Feb 2027 (granular scopes) and Oct 2028 (accounting/payments). These dates are SECONDARY. Build a reconnect flow now. A Reconnect URL field was added to the portal in Feb 2026.
- **App Partner Program** (US since 2025-07-28; UK/AU/CA from 2025-11-03):
  - The Builder tier is the free default and you can't opt out. It is capped at **500K CorePlus (read) calls per month**, and calls above the cap are **blocked, not billed**.
  - Silver costs $300/month (US example) and includes 1M calls, then $3.50 per 1K.
  - Core (write) calls and sandbox calls are not metered.
  - Tier eligibility requires an approved questionnaire.
  - Quebec is excluded.
- **Rate limits:** 500 requests per minute per realm, 10 per second per realm and app, and 40 batch requests per minute. A 429 means wait 60 seconds. Forum users report hitting throttles below these limits.
- **Sandbox limits:**
  - No payroll, live bank feeds, or import/export.
  - Sample data can't be reset.
  - Region and SKU are fixed once created.
  - 40 emails per day.
- **Placeholder URLs:** forum answers say a placeholder EULA or privacy URL is accepted for apps you use yourself.
- **Approved but still failing:** June–July 2026 forum threads describe apps approved for production that still fail with "undefined didn't connect" or route to sandbox companies. No official fix has been posted.
- **Redirect URI not saving:** a common cause of `redirect_uri` errors is a redirect URI that was never saved. The URI must match exactly, and you must click Save.

## What an agent can do vs. what the human must do
- **Agent:** draft EULA and privacy policy text; build and test OAuth (token rotation, reconnect, `intuit_tid` logging); prepare questionnaire answers; check that redirect URIs are HTTPS and match exactly.
- **Human:**
  - Create the account, verify email, and accept the Developer Terms.
  - Host the EULA and privacy pages on a real domain.
  - Answer the questionnaire truthfully, especially the security and breach questions, and submit it.
  - Add a payment method if moving to Silver.
  - Take the setup call and handle security-scan correspondence if listing.

## Escalation path
1. Search the Intuit Developer Community at help.developer.intuit.com. Answers there come from staff and peers.
2. Open a support case from the developer portal with your App ID, `intuit_tid` and the authorization URL.
3. For App Store reviews, reply to the review-team email thread. Keeping your account contact details current speeds this up.

## Sources
| URL | Supports | Confidence |
|---|---|---|
| static.developer.intuit.com/output_html/qbo/docs/go-live/publish-app.html | App Details fields, "about 30 minutes", questionnaire gates Show Credentials, no review time | CONFIRMED |
| …/get-started/get-client-id-and-client-secret.html | Dev keys sandbox-only; production keys after questionnaire approval | CONFIRMED |
| …/get-started/start-developing-your-app.html | Account, workspace and app creation; scopes | CONFIRMED |
| …/learn/scopes.html | Scope list; incremental scopes; re-auth needed when scopes change | CONFIRMED |
| …/get-started/app-settings.html | Settings fields; scopes can't be removed; up to 4 categories | CONFIRMED |
| …/develop/authentication-and-authorization/set-redirect-uri.html | HTTPS only, no IPs, localhost allowed for sandbox only | CONFIRMED |
| …/develop/authentication-and-authorization/faq.html | 100-day rolling refresh, 5-year max, 24h rotation, 1h access token | CONFIRMED |
| …/release-notes/general-release-notes.html | Feb 2026 5-year max and Reconnect URL field; partner program dates | CONFIRMED |
| …/get-started/partner-faq.html | Tiers, Builder 500K cap blocked, Core vs CorePlus, fees (updated 2026-10-20) | CONFIRMED |
| …/learn/limits-and-throttles.html | Rate limits, 429 handling | CONFIRMED |
| …/develop/sandboxes/sandbox-faqs.html | Sandbox count, lifetime, limitations | CONFIRMED |
| …/go-live/list-on-the-app-store/what-to-expect-during-the-review.html | 3-part review and its business-day estimates | CONFIRMED |
| …/go-live/publish-app/technical-requirements.html, …/common-reasons-for-rejection.html | Listing requirements, rejection reasons | CONFIRMED |
| …/go-live/publish-app/security-requirements.html | Security requirements | SECONDARY (seen in search summary only) |
| docs.codat.io/integrations/accounting/quickbooksonline/qbo-app-assessment-questionnaire | Questionnaire question list | SECONDARY |
| apideck.com/blog/ai-built-accounting-integrations-maintenance | First expiry dates Feb 2027 / Oct 2028 | SECONDARY |
| help.developer.intuit.com forum threads (private-app questionnaire, placeholder URLs, "undefined didn't connect") | Questionnaire required for private apps; placeholder URLs; post-approval failures | SECONDARY (forum) |
| Questionnaire approval turnaround | No stated SLA found | UNCONFIRMED |
