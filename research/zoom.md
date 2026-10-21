# Zoom: General app (OAuth), Marketplace

## Summary verdict
**Difficulty: 4/5.** Getting an OAuth app working in your own account is easy. Getting it to work for other accounts means passing a gated beta-share approval or the full Marketplace review, which has two phases and includes a security review.

**The hypothesis is mostly confirmed.** A private or development app can only be authorized inside your own Zoom account. There is one exception: a beta app can go to a limited number of external users, but only after Zoom approves it.

| Phase | Range | Basis |
|---|---|---|
| Setup (create app, scopes, local test) | under 1 day | estimated |
| Prerequisites (Technical Design Document, privacy, terms, docs, support, deauth endpoint) | 2 days–2 weeks | estimated |
| Beta external-share approval (optional) | 72 hrs after requirements are met; "no longer than 3–4 business days" | stated |
| Submission | 1–2 days | estimated |
| Provider review | 72-hour SLA excluding weekends and US holidays; the security queue "can take up to 2 weeks" | stated, but only by Zoom staff on the forum, not in the docs |
| Revisions | 1 or more resubmission cycles | no stated SLA |
| Customer-admin approval | depends on the customer's org | no stated SLA |

## Before approval
- **Development or private apps:** you add the app from Local Test ("Add App Now") and can share the authorization URL with members of your own account. "You can only share private apps with members within your Zoom account."
- **Beta external sharing:** use Production > Beta Test > "Request to Share".
  - Zoom must approve the request, case by case.
  - The cap is 10 additions for an account-level (admin-managed) app and 100 for a user-level app. You can ask marketplace.security@zoom.us for a higher limit, and those requests are reviewed "within 24hrs".
  - The URL lasts 4 weeks, plus two more 4-week extensions, about 90 days in total.
  - Users who already added the app keep access after the URL expires. The URLs stop working once the app is published.
- **Beta apps can't be published.** An unlisted public listing still needs the full review.
- **No deauthorization webhooks before production:** private and development apps don't send deauthorization notifications, so you can't test that flow before production.

## Prerequisites
- A Zoom account with developer permissions. You choose admin-managed or user-managed when you create the app.
- **Admin-managed:** account admins install the app, and it can reach data for users across the account.
- **User-managed:** any individual user can install it, and it sees only that user's data.
- A redirect URL plus an OAuth allow list. Strict Mode is optional.
- The Technical Design section completed, plus supporting evidence. Zoom says it prefers to see a Secure Software Development Lifecycle (SSDLC).
- **Terms of Use, Privacy Policy, self-serve documentation and a Support URL** are the minimum Zoom requires.
- A working deauthorization endpoint that verifies Zoom's signature with the secret token and deletes the user's data.

## Steps
1. **[you]** Go to Marketplace > Develop > Build an app > General app. Set the name and management type.
2. **[agent]** Configure the OAuth redirect URL and allow list, then wire up the authorize and token flow.
3. **[you]** Choose Features, then Scopes, and give each scope a justification. Adding a scope "is actually submitting a request to the Zoom Security Review team".
4. **[you]** Use Local Test to install the app in your own account.
5. **[agent]** Build token caching and refresh handling, the deauth webhook, and webhooks to use instead of polling.
6. **[you]** Fill in the Technical Design section. You can optionally use Request to Share for beta.
7. **[provider]** Approves the beta share (72 hrs / 3–4 business days).
8. **[you]** Switch to production credentials. Complete the listing, test plan, test account, docs, privacy policy and support URL, then submit.
9. **[provider]** Runs the review:
   - completeness and branding;
   - functionality, usability and compliance;
   - security: TDD review, scope minimisation, and OWASP Top 10 testing.
10. **[you]** Work through the remediation report and resubmit.
11. **[customer_admin]** Installs the app or pre-approves it. "A Zoom account may require an app be pre-approved by a Marketplace admin."

## Submission checklist
- Accurate metadata, name, description, images and video, all within Zoom's branding guidelines
- Technical Design Document (in the current format)
- A test plan and a test account or credentials
- A documentation URL with actionable content, including how to remove or deauthorize the app
- Privacy Policy, Terms of Use and Support URL
- A deauthorization endpoint that works
- Only the minimum scopes, with any unused development scopes removed
- A demo video: **UNCONFIRMED** as a requirement. Videos appear only as a listing asset.

## Gotchas
- **Token lifetimes:** access tokens last 1 hour and refresh tokens 90 days. Refresh tokens rotate, so always use the latest one. Calling `/oauth/token` before every request gets apps rejected.
- **Credentials:** development and production credentials are different, so production needs its own configuration.
- **Changing management type:** this changes which features and scopes are available, so recheck both.
- **Granular scopes (2024):** these replaced classic scopes for new apps. Classic apps can migrate with the Migrate button. Forum users report problems with production still returning classic scopes.
- **TDD format:** the required format has changed before, and developers have been rejected as "incomplete" because of it.
- **Meeting SDK (2026):** from 2 March 2026, Meeting SDK apps that join meetings hosted by other accounts need an OBF or ZAK token, or RTMS. This applies only if your General app embeds the SDK.

## Blockers & what to do
- **External testers can't authorize:** request a beta share, or publish the app.
- **Hit the 10 or 100 beta limit:** email marketplace.security@zoom.us.
- **Security reviewers question your scopes:** remove unused scopes and write a justification for each one that remains.
- **Rejection reason unclear:** check the reviewer notes in the dashboard, then post on the devforum Marketplace > Submission category.

## Escalation path
1. Reviewer notes and the remediation report in the build flow
2. devforum.zoom.us, Marketplace > Submission category (Zoom staff reply there)
3. marketplace.security@zoom.us (beta limits and security questions)
4. Developer Support plans for paid support. **UNCONFIRMED**

## Unknowns
- Zoom's docs give no official SLA for public review. The 72-hour and 2–4 week figures come from Zoom staff on the forum.
- Whether a demo video or a separate security questionnaire is required, beyond the TDD.
- Any 2025 changes to the General app build flow beyond granular scopes.

## Sources
| URL | Supports | Confidence |
|---|---|---|
| https://developers.zoom.us/docs/integrations/create/ | Steps, management types, fields, scopes go to the security team, beta limited to own account | CONFIRMED |
| https://developers.zoom.us/docs/distribute/ | Distribution options, two-phase review, minimum ToU, privacy, docs and support | CONFIRMED |
| https://developers.zoom.us/docs/distribute/sharing-private-and-beta-apps/ | Private sharing in own account only, beta external share, 10/100 caps, 4 weeks ×3, 3–4 business days | CONFIRMED |
| https://developers.zoom.us/docs/distribute/app-submission/authorization-url-faq/ | 72 hrs for beta approval, 90 days of testing, limit increases in 24 hrs, URLs invalid after publish | CONFIRMED |
| https://developers.zoom.us/docs/distribute/app-review-process/ | Review stages, OWASP testing, scope minimisation, remediation, no fixed timeline | CONFIRMED |
| https://developers.zoom.us/docs/integrations/oauth/ | 1-hour access and 90-day refresh tokens, rotation, revoke | CONFIRMED |
| https://developers.zoom.us/docs/integrations/end-user-auth/ | Admin pre-approval, no deauth notifications for dev apps, deauth requirement | CONFIRMED |
| https://developers.zoom.us/docs/integrations/migrate/ | Migrating from classic to granular scopes | CONFIRMED |
| https://devforum.zoom.us/t/marketplace-app-production-approval-timelines-post-updates/138920 | 72-hour SLA and up to 2 weeks in the security queue (staff, Dec 2025) | SECONDARY |
| https://devforum.zoom.us/t/why-is-my-application-getting-rejected-by-the-marketplace-team/73260 | 10 common rejection reasons (staff, 2022) | SECONDARY |
| https://developers.zoom.us/docs/meeting-sdk/obf-faq/ | OBF and ZAK enforcement for external meetings from 2 March 2026 | SECONDARY (search summary only) |
| Developer Support paid plans | Escalation path | UNCONFIRMED |
