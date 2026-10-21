# LinkedIn OAuth app: setup and approval research

*Researched 2026-10-21 from learn.microsoft.com/linkedin and linkedin.com/help.*

## Summary verdict

**Hypothesis check.** Mostly right, with three corrections:
1. **App creation needs a LinkedIn Page.** You must pick a default Page even as an individual developer. Super-admin verification of the app is documented as a requirement for vetted Marketing products such as Community Management. It is **not** documented as a requirement for the self-serve products.
2. **Self-serve (Open Permissions):** only Sign In with LinkedIn using OpenID Connect (`openid profile email`) and Share on LinkedIn (`w_member_social`). Events Management is described as "self-serve… on request."
3. **There are three gated levels, not one:**
   - **Vetted request-access.** Open to any vetted legal entity: Advertising, Community Management, Lead Sync, Conversions.
   - **Partner or restricted.** Sales Navigator (SNAP), Talent (RSC, Apply Connect and others), Audience Insights, Media Planning, and Matched Audiences (the FAQ calls it a private interest form).
   - **Closed.** Compliance, Company Intelligence, `r_full_profile`, `r_member_social`.

| Phase | Sign In / Share (self-serve) | Community Management / Marketing (gated) |
|---|---|---|
| Setup | 30–90 min (estimated) | 1–3 h (estimated) |
| Prerequisites | Page exists or create one: under 1 h (estimated) | Legal entity, business email, website, privacy policy: days to weeks if missing (estimated) |
| Submission | Minutes; add product in the Products tab (stated self-serve) | Vetting survey must be done **within 21 days** (stated) |
| Provider review | None (stated self-serve) | Development tier: **no stated SLA**. Standard tier: **no stated SLA**. Ads Standard: **up to 30 business days** (stated). Restricted APIs: "no fixed timeline" (stated) |
| Revisions | N/A | A rejection means **creating a new app** and starting again (stated). Duration: no stated SLA |
| Customer-admin approval | Per-user consent only | Page super admin has **30 days** to verify the app (stated). End-user customers need the ADMINISTRATOR Page role (stated); no SLA |

**Difficulty:** Sign In / Share **1/5**. Community Management / Marketing **4/5**. SNAP and Talent **5/5**.

## Before approval
- **Development tier for Community Management is the default once approved.** Limits:
  - 500 calls per app per 24 h
  - 100 calls per member per 24 h
  - no BATCH_GET
  - social-action webhooks disabled
- **You must reach Standard within 12 months** or LinkedIn removes access for inactivity. Standard has no restrictions.
- **Ads Development tier** gives unlimited reads, 1 test ad account created through the API, and edits on up to 5 ad accounts. You map those accounts in the Products tab.

## Prerequisites
- A LinkedIn Page for your organization. The app is permanently tied to it and cannot be moved.
- For Community Management:
  - a registered legal organization with a commercial use case
  - a verified business email (personal emails fail)
  - legal name, registered address, website and privacy policy
- An app name with no "LinkedIn" or "Microsoft" fragments, such as "Linked" or "In".
- HTTPS absolute redirect URLs, with no `#` (query parameters are ignored).

## Steps
1. **[you]** Create or confirm the LinkedIn Page.
2. **[you]** Create the app in the Developer Portal and select the Page.
3. **[customer_admin]** The Page super admin approves the verification request within 30 days.
4. **[agent]** Configure redirect URLs and record the Client ID and Secret.
5. **[you]** In the Products tab:
   - Self-serve: add Sign In / Share, which is granted instantly.
   - Community Management: request it on a **dedicated app that has no other products**.
6. **[you]** Complete the vetting survey within 21 days and verify the business email.
7. **[provider]** LinkedIn runs Access Form Review, then Identity Vetting, then App Review.
8. **[agent]** Build against Development tier limits and implement 3-legged OAuth with state checking. The auth code expires after 30 minutes.
9. **[you]** For Standard tier, submit the form with:
   - a company and product overview
   - use cases
   - test credentials
   - a narrated, downloadable, high-resolution screencast per use case
10. **[provider]** LinkedIn reviews the Standard tier request. No SLA is stated.
11. **[customer_admin]** Each customer's Page admin authorizes through OAuth. Page roles can only be granted in the LinkedIn UI, not through the API.

## Submission checklist
- Page verified by a super admin
- Business email verified (check the spam and promotions folders)
- Legal entity details, website and domain match the Page's organization
- Valid privacy policy URL
- Use case checked against the restricted-use-cases list (for example, an off-LinkedIn Page feed display is not approved)
- App name compliant
- For Standard tier only: screencast showing the full OAuth flow, posting, how comments and commenter profile fields are displayed, and analytics

## Gotchas
- **Token lifetimes:**
  - Access tokens last 60 days.
  - Programmatic refresh tokens last 365 days with a fixed TTL and are only for "approved MDP partners" / "a limited set of partners."
  - Self-serve apps get no refresh token. They must re-run OAuth; consent is skipped if the user is still logged in and the token is still valid.
- **Changing scopes invalidates every prior access token** and forces users to re-authenticate.
- **Users can't pick scopes:** they must accept all requested scopes or none.
- **The Community Management request button is greyed out** if the app has any other product or pending request.
- **A rejection is final for that app:** you cannot re-apply with the same app. The exception is "Insufficient Details" (survey not submitted within 21 days), which enables a Reapply button.
- **Share on LinkedIn rate limits:** 150 requests per member per day and 100,000 per app per day. It posts as the member only; posting as an organization needs Community Management.
- **OIDC does not verify identity.** `email` may be absent from the response.
- **All Marketing permissions are 3-legged.** There is no 2-legged option.
- **Ads Standard requests for analytics-only use cases are rejected.**
- Marketing API version 202511 sunsets on 2026-11-16.

## Blockers & what to do

| Blocker | Action |
|---|---|
| No legal entity or business email | Self-serve products only; Community Management is unavailable |
| Super admin unresponsive | Get the admin role or chase the super admin; the request lapses after 30 days |
| Denied, for example "Fail Organization Verification" or "Invalid Company Page" | File a vetting appeal through the dsapi form, or fix the issue and create a new app |
| "Insufficient Details" | Use the Reapply button on the same app |
| Development tier limits too low | Finish the integration, then apply for Standard |
| Need SNAP or Talent | Apply through the business.linkedin.com partner forms |

## Escalation path
- **Developer Support Portal:** linkedin.com/help/linkedin/ask/dsapi. Form types are Developer Support and Vetting Appeal. Include the Client ID, endpoint, request body, response UUID, error and number of customers affected.
- **Help Assistant chat** on developer.linkedin.com.
- **Partner representative**, for approved Marketing partners.
- **No support response SLA is stated.**

## Unknowns
- Typical review durations for Development or Standard tier. None are published.
- Whether Page verification is enforced for self-serve products.
- Whether self-serve apps can request refresh tokens at all.
- Matched Audiences status: the Increasing Access page says "apply," but the FAQ says it uses a private interest form with LinkedIn replying within 60 days only if there is a fit.
- What happens when the 30-day super-admin window expires.

## Sources

| URL | Supports | Confidence |
|---|---|---|
| learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access | Open Permissions list; Marketing, SNAP, Talent and Compliance gating | CONFIRMED |
| learn.microsoft.com/en-us/linkedin/marketing/increasing-access | Product availability table; Development and Standard tier limits; 12-month rule; restricted APIs have no fixed timeline | CONFIRMED |
| learn.microsoft.com/en-us/linkedin/marketing/community-management-app-review | Legal entity, business email, Page verification; screencast; reject means new app | CONFIRMED |
| learn.microsoft.com/en-us/linkedin/marketing/quick-start | Steps; Page creation; Standard tier materials | CONFIRMED |
| learn.microsoft.com/en-us/linkedin/shared/linkedin-api-partner-support-guide | 21-day survey; Community Management must be the only product; Ads Standard up to 30 business days; appeals; ticket contents | CONFIRMED |
| learn.microsoft.com/en-us/linkedin/marketing/lms-faq | Access removed after 12 months; closed permissions; Matched Audiences 60 days; 3-legged only | CONFIRMED |
| learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow | 60-day tokens; 30-minute auth code; redirect rules; scope invalidation | CONFIRMED |
| learn.microsoft.com/en-us/linkedin/shared/authentication/programmatic-refresh-tokens | 365-day refresh tokens for approved MDP partners only | CONFIRMED |
| learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/sign-in-with-linkedin-v2 | OIDC scopes; no identity verification | CONFIRMED |
| learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin | `w_member_social`; rate limits | CONFIRMED |
| linkedin.com/help/linkedin/answer/a548360 | Super admin approves; 30 days; Page link is permanent; default Page required | CONFIRMED |
| linkedin.com/help/linkedin/answer/a1449586 | Review statuses and denial reasons | CONFIRMED |
| bundle.social/blog/linkedin-api-permissions | Says approval times "vary widely" | UNCONFIRMED |
