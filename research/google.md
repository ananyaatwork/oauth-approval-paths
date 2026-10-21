# Google OAuth app verification: research notes

Researched 2026-10-21 from primary sources (developers.google.com, support.google.com/cloud) unless tagged otherwise.

## Summary verdict

| Scope tier | Difficulty (1–5) | Setup | Submission prep | Review wait (Google's stated estimate) | Revisions |
|---|---|---|---|---|---|
| Non-sensitive only (brand verification) | 1–2 | 30–60 min | under 1 hr | Automated check usually takes minutes. A manual review takes "2–3 business days". | Days, if issues are found |
| Sensitive (e.g. `gmail.send`, Calendar) | 3 | 1–2 hrs | 1–3 days (video, justifications, privacy policy) | Google gives two figures: "10 business days" (FAQ) and "typically 3–5 business days" (developer page). | No stated SLA. Each Trust & Safety email pauses the review until you reply. |
| Restricted (e.g. Gmail read, `mail.google.com`, broad Drive) | 5 | 1–2 hrs | 1–2 weeks | "6 weeks" (FAQ) or "several weeks" (developer page), **plus** a CASA security assessment as the final step | No stated SLA. Community reports of 6–8+ week stalls are SECONDARY. CASA turnaround of 1–6 weeks is SECONDARY. |

Google states its estimates "are not guaranteed" and vary with how quickly the developer responds. The expectation that restricted scopes are the slow, human-reviewed end is **confirmed**.

## Steps (Google Cloud Console → Google Auth Platform)

1. Create or select a Google Cloud project and enable the APIs you need (Gmail, Drive, Calendar).
2. Go to **Menu → Google Auth platform → Branding → Get Started**. Enter the app name and user support email. Choose an **Audience** (Internal or External), add contact email(s), and accept the User Data Policy. Once created, the consent screen can't be removed.
3. On **Branding**, add the homepage, privacy policy, terms and logo, and list the **Authorized domains**. Verify each domain in **Google Search Console** using a project Owner or Editor account.
4. On **Data Access → Add or Remove Scopes**, declare every scope. The Console labels each one non-sensitive, sensitive or restricted. Look for narrower alternatives before you commit.
5. On **Audience → Test users**, add accounts. External apps only, maximum 100.
6. On **Clients**, create an OAuth client ID (web, desktop and so on) with redirect URIs. Exact field names were not read in this pass.
7. Click **Verify Branding**, then publish the branding once its status reads "ready to publish". A compliant result stays valid for only **7 days**.
8. Click **Publish app** to move to *In production*. Then open the **Verification Center → Prepare for verification**, add a justification for each scope and the demo video link, and **Submit**.
9. Restricted scopes only: once the other requirements pass, Trust & Safety emails you to begin the CASA assessment.

## Publishing status facts (CONFIRMED)

- **Testing:** up to **100 test users**. Authorizations **and refresh tokens expire after 7 days**. The exception is apps that request only `openid`, `userinfo.email` and `userinfo.profile`.
- **Unverified app** in production: users see the "unverified app" screen, and the app is capped at **100 new users for the project's lifetime**. The cap cannot be reset.
- **Internal** user type: limited to your Workspace or Cloud Identity organization. It skips both the unverified screen and the cap.
- **Exempt from verification:** personal use (fewer than 100 users), dev/test/staging projects, service-account-owned data, internal apps, and admin-trusted or Marketplace domain installs.
- There is a limit of 100 refresh tokens per client per Google account. When it's reached, the oldest token is silently revoked.

## Approval and review requirements (CONFIRMED)

**Brand verification (every app that shows a name or logo):**
- A public homepage on a verified domain that describes the app. It can't be just a login page.
- A privacy policy on the same domain, linked from the homepage and the consent screen with the identical URL.
- Every authorized domain verified in Search Console.
- Compliance with Google branding guidelines.
- Current contact information.

**Sensitive and restricted scopes, in addition:**
- An appropriate use case, which generally means a user-facing productivity feature.
- The narrowest scopes possible, with a written explanation of why narrower scopes fail.
- Limited Use compliance: no ads, no selling data, no credit decisions, and human reading only in narrow cases. Using Google user data to train foundational AI models is **prohibited**.
- **Demo video**, uploaded to YouTube as Unlisted and recorded in English. It must show the full OAuth flow, the consent screen with the app name and exact scopes, the **client ID in the address bar**, and each scope in use. If data is used for AI training, it must show the user's explicit consent.

**Restricted scopes, in addition:**
- An annual **CASA** assessment (App Defense Alliance framework, based on OWASP ASVS) by a Google-empanelled assessor, at assurance level AL1 or AL2. Passing produces a Letter of Validation/Assessment. It must be renewed every 12 months, and a new restricted scope may trigger reassessment.
- **Cost:** "Google does not charge the developer any fees". You pay the assessor directly, and some apps qualify for a free Tier 2 assessment. Third-party prices of about $540 for Tier 2 and $4,500 for Tier 3 (TAC Security, 2024) are SECONDARY and may be stale.

## Gotchas

- Google publishes conflicting sensitive-scope estimates (10 vs 3–5 business days). Quote both.
- Refresh tokens issued in Testing mode die after 7 days, which looks like a random auth bug.
- The 100-user cap on unverified apps is per project and permanent. Keep dev and prod in separate projects and submit only prod. Remove OAuth clients that aren't ready for production before you submit.
- Branding can't be edited while verification is in progress. Changing the logo, name or domains triggers re-verification.
- `https://mail.google.com/` is restricted and acceptable only if the app needs permanent delete. Send-only apps should use `gmail.send`, which is sensitive and avoids CASA.
- Google lists no rejection reasons. The causes it does name: scopes broader than needed, a homepage or privacy policy mismatch, policy non-compliance, and unresolved critical vulnerabilities, which can lead to API suspension.
- Restricted-scope approval needs annual recertification, so budget for it every year.

## Agent vs human

| An agent can | The human must |
|---|---|
| Draft scope justifications and map features to the narrowest scopes | Own the Cloud project as Owner or Editor and accept the User Data Policy |
| Draft the privacy policy and homepage copy, then audit links and domain match | Verify domains in Search Console, which needs DNS access |
| Generate a checklist and a demo-video script | **Record** the demo video and upload it to YouTube as Unlisted |
| Pre-check the CASA self-scan setup and remediation | Contract and pay a CASA assessor, and sign off on the results |
| Track status and draft replies to Trust & Safety | Monitor the contact inboxes and send replies from them |

## Escalation path

- No phone number or support form is documented. All communication goes by **email** to project Owners and Editors and to the support and contact emails.
- To follow up, **reply directly to the last email from the verification team**.
- Check status on the **Branding** and **Verification Center** pages.
- If automated brand verification fails, you can **request a manual review**.
- The community forum at discuss.google.dev is unofficial (SECONDARY).

## Recent changes

- The Console flow now lives under the **Google Auth Platform** pages: Branding, Audience, Data Access, Clients and Verification Center.
- The AI-training prohibition and the consent rule in the demo video are now explicit.

## Sources

| URL | Supports | Confidence |
|---|---|---|
| https://support.google.com/cloud/answer/15549945 | Testing vs production, 100 test users, 7-day expiry, unverified cap | CONFIRMED |
| https://developers.google.com/identity/protocols/oauth2 | 7-day refresh tokens, 100-token limit | CONFIRMED |
| https://support.google.com/cloud/answer/13463073 | Verification types, annual re-verification | CONFIRMED |
| https://support.google.com/cloud/answer/13464321 | Full requirements, video, Limited Use, AI training | CONFIRMED |
| https://support.google.com/cloud/answer/13464323 | Exemptions | CONFIRMED |
| https://support.google.com/cloud/answer/13465431 | CASA, AL1/AL2, annual renewal | CONFIRMED |
| https://support.google.com/cloud/answer/13463817 | Review times (2–3 days / 10 days / 6 weeks), no Google fee, reply-to-email contact, Gmail scope guidance | CONFIRMED |
| https://support.google.com/cloud/answer/13461325 | Submission flow, email-only communication | CONFIRMED |
| https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification | Steps, video specs, "3–5 business days" | CONFIRMED |
| https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification | Restricted steps, "several weeks", 7-day brand validity | CONFIRMED |
| https://developers.google.com/workspace/guides/configure-oauth-consent | Console navigation | CONFIRMED |
| https://appdefensealliance.dev/casa/tier-2/tier2-overview | Tier 2 self-scan process | SECONDARY (not fully read) |
| https://switchlabs.dev/post/casa-tier-2-tier-3-security-review-providers-pricing-and-the-cheapest-option | CASA prices and turnaround | SECONDARY |
| https://discuss.google.dev/t/oauth-consent-screen-verification-taking-months/179199 | Reports of long stalls | SECONDARY |
| Clients page field names and redirect URIs | Not read in this pass | UNCONFIRMED |
