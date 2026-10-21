# HubSpot: Public (Marketplace) OAuth App

*Researched 2026-10-21 from developers.hubspot.com.*

## Summary verdict
**Difficulty: 2/5 to run OAuth unlisted, 3/5 to get listed.** The hypothesis mostly holds, with three corrections. OAuth works straight away, but only in developer test accounts until you sign the Acceptable Use Policy (AUP). The unlisted cap is **25 installs**. Listing needs **3 active installs** plus a manual review.

| Phase | Path A: unlisted (≤25 installs) | Path B: Marketplace listing |
|---|---|---|
| Setup (account, CLI, project, OAuth server) | Hours to 1 day (estimated) | Same |
| Prerequisites (AUP, test installs) | Under 1 day (estimated) | Plus 3 unaffiliated production accounts with activity in the last 30 days. Depends on your customers (no stated SLA) |
| Submission (7-tab wizard) | n/a | 1–2 days (estimated) |
| Provider review | n/a | Initial review within **10 business days** (stated) |
| Revisions | n/a | **≤60 days** from when feedback is shared (stated) |
| Customer-admin approval | Minutes per install (estimated); org approval workflow has no stated SLA | Same |

## Before approval
- Unlisted Marketplace-distribution apps on platform 2025.2+ can be installed in **25 accounts**. Developer test accounts don't count toward this. The cap lifts when the listing is approved.
- Private OAuth distribution allows 10 allowlisted accounts, or 100 for a Solutions Partner portal.
- Until the AUP is signed, a Marketplace OAuth app installs **only into developer test accounts**.
- Installers have to tick "authorize an unverified app".

## Prerequisites
- A HubSpot developer account, with Super Admin rights to submit a listing.
- HubSpot CLI v7.6.0 or later, authenticated with `hs account auth`.
- Your own hosted OAuth backend, since HubSpot doesn't host one (a Node quickstart is provided).
- A signed AUP and acceptance of the Technology Partner Program Agreement.
- Live public URLs: setup docs, support, Terms of Service, Privacy Policy and pricing.

## Steps
1. **you**: Create a developer account and install and authenticate the CLI.
2. **agent**: Run `hs project create`, choose App, Marketplace distribution and OAuth.
3. **agent**: Configure `app-hsmeta.json`. Set a stable `uid`, `name`, `auth.type: oauth`, `redirectUrls`, `requiredScopes`, `conditionallyRequiredScopes`, `optionalScopes`, `permittedUrls` and `support`.
4. **agent**: Run `hs project upload` to trigger the build.
5. **you**: Copy the Client ID and secret from the project's Auth tab into the OAuth server.
6. **agent**: Implement the flow. The user goes to `app.hubspot.com/oauth/authorize` (`client_id`, `scope`, `redirect_uri`, optional `optional_scope`, `state`). Exchange the code at `POST api.hubspot.com/oauth/v3/token`, then refresh with `grant_type=refresh_token`.
7. **you**: Create a test account. On the Distribution tab, add a test install and connect.
8. **you**: Sign the AUP so you can install into standard (production) accounts.
9. **customer_admin**: Install the app. This needs Super Admin or the App Marketplace Access permission, plus the permissions the requested scopes imply.
10. **you**: Get 3 unaffiliated production accounts making API calls or signed requests within 30 days.
11. **you**: Go to Development → App Listings → Create listing, complete the 7 tabs, run validation, then Agree & submit.
12. **provider**: The Ecosystem Quality team reviews manually and replies by email.
13. **you**: Address feedback. Once approved, the 25-install cap is removed.

## Submission checklist
- [ ] OAuth is the only auth method, using one app ID and client ID. No redirecting to, or depending on, another app.
- [ ] One use case per app, and not a duplicate of an existing listing.
- [ ] 3 or more active installs from unaffiliated accounts.
- [ ] Every requested scope is used. Scopes some users won't have are marked conditional or optional. The "Shared data" table matches the scopes.
- [ ] If you request read and write on an object, the sync is advertised as bi-directional.
- [ ] No classic CRM cards. Apps with app cards request no sensitive-data scopes.
- [ ] Name, company, tagline, install option, 800×800 icon, support email and support languages.
- [ ] Setup docs, ToS, privacy policy and support URLs are live (max 250 characters each). The HubSpot Crawler is allowlisted.
- [ ] Pricing matches your website.
- [ ] Brand and trademark guidelines are followed.
- [ ] AI connectors use user-level permissions and HubSpot's MCP Server.

## Gotchas
- **Token lifetimes.** The access token lasts 30 minutes (`expires_in` 1800). Read `expires_in` instead of hard-coding it, because older docs showed 21600. A HubSpot blog says the refresh token doesn't expire until the app is uninstalled or the token is revoked. An expired refresh token returns `invalid_grant`.
- **Scopes.** Required scopes must appear in the install URL's `scope` parameter. If a conditionally required scope is in the URL and the user lacks that feature (for example a tier-gated scope), **the install fails**. The `oauth` scope is added by default. Sensitive scopes are mostly Enterprise-only.
- **Legacy apps.** No new legacy public apps can be created since 2026-06-23. Existing ones keep working without new features. Migrating a legacy app with more than 25 installs to 2025.2+ **auto-enforces the cap** if it isn't listed.
- **Platform versions.** 2025.1 apps had to migrate by 2026-08-01. 2025.2 is supported through March 2027. 2026.03 is current. Listing is refused on unsupported versions.
- **UIDs.** Changing the `uid` after upload creates a new app.
- **One submission at a time.** Any other submissions are auto-rejected.
- **Certification is separate.** It needs 60 active installs (raised from 6 on 2024-05-15), at least 6 months listed, and a technical review.

## Blockers & what to do
- **"Developer has not signed the AUP"**: accept the AUP and program terms in the developer account.
- **Hit 25 installs**: list the app. Community moderators say HubSpot makes no exceptions to the cap.
- **Fewer than 3 active installs**: run pilots with unaffiliated customers making real API calls.
- **Installer lacks permission**: a Super Admin grants App Marketplace Access, or approves the app request.
- **Listing stuck in Draft**: fix the missing fields flagged on Review info.
- **Errors after migration**: submit a developer support request.

## Escalation path
In order: the HubSpot Developer Community forum (community.hubspot.com), then a developer support request from the developer account, then the Ecosystem Quality team via the review emails. Tech Partner Program contacts apply once you're listed.

## Unknowns
- No stated SLA for the AUP, the customer's org approval, or certification review.
- The refresh-token lifetime is stated only in a blog post. The reference docs say nothing.
- One community thread cited "<10 installs" as a migration limit, which conflicts with the official 25.
- Whether the listing review clock pauses during revisions.

## Sources
| URL | Supports | Confidence |
|---|---|---|
| developers.hubspot.com/docs/apps/developer-platform/build-apps/manage-apps-in-hubspot | Install limits (1/10/25/unlimited), AUP gating to test accounts | CONFIRMED |
| developers.hubspot.com/changelog/new-marketplace-distribution-app-install-limits | 25 cap on 2025.2 from 2025-09-22, migration enforcement, private limits 10/100 | CONFIRMED |
| developers.hubspot.com/docs/apps/developer-platform/list-apps/listing-your-app/app-marketplace-listing-requirements | 3 active installs, scope rules, 10 business days and 60 days, one submission at a time | CONFIRMED |
| developers.hubspot.com/docs/apps/developer-platform/list-apps/listing-your-app/listing-your-app | Listing wizard steps, required fields, Super Admin | CONFIRMED |
| developers.hubspot.com/docs/apps/developer-platform/build-apps/create-an-app | CLI steps, config fields, test installs, unverified-app checkbox | CONFIRMED |
| developers.hubspot.com/docs/apps/developer-platform/build-apps/authentication/scopes | Required, conditional and optional scopes; failure modes; tiers | CONFIRMED |
| developers.hubspot.com/docs/api-reference/auth-oauth-v3/guide | Endpoints, 30-minute access token, `invalid_grant` | CONFIRMED |
| developers.hubspot.com/blog/oauth-token-management-hubspot-integrations | Refresh token doesn't expire | SECONDARY |
| developers.hubspot.com/docs/apps/legacy-apps/overview | Legacy creation cutoff 2026-06-23; version support dates | CONFIRMED |
| developers.hubspot.com/changelog/new-permission-requirements-for-installing-public-apps | App Marketplace Access permission to install | CONFIRMED |
| developers.hubspot.com/changelog/active-install-requirement-increase-for-app-certification | Certification needs 60 installs | CONFIRMED |
| developers.hubspot.com/app-partners/set-up | Tech Partner Program Agreement | SECONDARY |
| community.hubspot.com (AUP error thread; install-limits thread) | AUP fix, no cap exceptions | UNCONFIRMED |
