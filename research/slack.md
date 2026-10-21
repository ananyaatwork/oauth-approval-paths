# Slack — OAuth App Setup & Approval

## Summary verdict
**Difficulty: 3/5 (moderate). Confirmed.** The app works right away in your own workspace. Unlisted public distribution ("Manage Distribution") needs **no review**. A Marketplace listing needs a two-stage review, and you can't submit until the app is **installed on 10+ active workspaces**. The Marketplace became much more important after May 2025, because unlisted commercial apps now get heavily throttled history APIs.

| Phase | Range | Basis |
|---|---|---|
| Setup (app + OAuth + public distribution) | Hours to 1–2 days of build time | Estimate; no Slack figure |
| Submission prep (landing page, privacy policy, support page, demo video, test accounts, scope justifications) | Days to weeks, plus the time it takes to reach 10 active installs | Estimate |
| Review wait | Preliminary review up to 10 business days, then functional review up to 10 weeks (new apps). Updates: up to 6 weeks | CONFIRMED (Slack's stated maximums) |
| Revisions | No stated SLA. Resubmitting during preliminary review resets your place in the queue; resubmitting during functional review does not | CONFIRMED |

Review cannot be skipped or expedited for launches.

## Steps
1. Go to api.slack.com/apps and choose **Create New App**, either **From scratch** or **From a manifest** (YAML/JSON). Pick a development workspace.
   - An agent can also call `apps.manifest.create` with an app configuration token. These tokens expire after 12h; rotate them with `tooling.tokens.rotate`.
2. Add bot scopes and/or user scopes. Use **Install to Workspace** to get a single-workspace token with no OAuth build needed.
3. To install on other workspaces, build OAuth v2:
   - Redirect the user to `https://slack.com/oauth/v2/authorize` with `client_id`, `scope` (bot), `user_scope`, `redirect_uri` and `state`.
   - The `code` comes back and expires after 10 minutes. Verify `state`.
   - POST to `oauth.v2.access` with `code`, `client_id` and `client_secret`. This returns an `xoxb-` bot token and, if user scopes were requested, an `xoxp-` user token under `authed_user`.
4. Redirect URLs must be HTTPS, have no `#`, and match (or be a subpath of) a URL registered in app settings. If several are registered, send the same `redirect_uri` in both steps, or you get `bad_redirect_uri`.
5. Open **Manage Distribution**, finish the checklist (OAuth flow, SSL on every request URL), and click **Activate Public Distribution**. You get an Add to Slack button, a shareable install URL and a meta tag.
6. Optional: submit to the Slack Marketplace from the app's settings once eligible.

## Approval / review requirements (Marketplace)
- **Eligibility:** 10+ active workspaces (active = used in the last 28 days). Coded workflows are not eligible. Some categories are not accepted.
- **Checklist:**
  - App is fully functional, publicly installable, and tested on a non-dev workspace (install, onboarding, use, uninstall).
  - No test slash commands left in.
  - Automated pre-submission checks pass.
  - **Each scope justified.**
  - Test credentials with dummy data for your service and any third-party service it connects to.
  - An install path that doesn't need your workspace; reviewers can't access Slack workspaces.
  - **Video demo** covering install, OAuth, setup, end-to-end use and uninstall.
- **Landing page:** public, not a PDF or repo, with screenshots/GIFs and an Add to Slack install path.
- **Privacy policy:** says what data is collected, how it's used, how long it's kept, and how users can access, transfer or delete it. Needs a contact email or form, and must disclose data the app receives but doesn't use.
- **Support:** an email or form that doesn't require an account. **Respond within 2 business days.**
- **Security:**
  - TLS 1.2+; signing-secret verification (verification tokens are deprecated); `state` in OAuth.
  - Tokens never logged or exposed.
  - **No training LLMs on Slack data.** AI agent apps must not store Slack data.
  - There is a Security & Compliance section with AI fields (model, retention, tenancy). Slack may security-review the app at any time.
- **Stages:** preliminary review (listing, docs, scopes, installability), then functional review (a reviewer tests the app and its scopes).

**Common rejection/return reasons:** the app is in beta or untested; bugs that block testing; scopes for features that don't exist yet; legacy, restricted or broad scopes (`admin.*`, `search:read`, `triggers:*`); test accounts missing or inaccessible; incomplete submission; earlier feedback not addressed. Apps with broad history or private-channel scopes get enhanced review.

## Gotchas
- **Rate-limit cliff (May 29, 2025).** For unlisted commercially distributed apps, `conversations.history` and `conversations.replies` dropped to **Tier 1: 1 request/min, max 15 objects per call**. Internal apps keep 50+ requests/min and 1,000 objects. Marketplace apps are unaffected.
  - The limit applies to new apps and to new installs of existing unlisted apps.
  - When it applies to existing installs is unresolved: secondary copies of the changelog cite March 3, 2026, but the current page I read doesn't state that date.
  - Any data-reading product effectively needs a Marketplace listing.
- The updated ToS took effect immediately for apps created on or after May 29, 2025, and on June 30, 2025 for older apps.
- Catch-22: you need 10 active installs before submitting, so plan an unlisted pilot phase.
- Scopes are additive on reinstall. Revoke with `auth.revoke` to reset.
- Turning off distribution uninstalls the app from every other workspace. Once the app is listed, you must discontinue the listing instead.
- Enterprise org installs, and workspaces that require admin approval, add friction.
- Direct-install URLs must 302-redirect to a full `oauth/v2/authorize` URL.

## Agent vs human
**An agent can:**
- Write the manifest and create the app through the API (given a config token).
- Build the OAuth handler.
- Draft scope justifications, the privacy policy, the support page and the landing page.
- Run pre-submission checks.
- Script the demo storyboard.

**The human must:**
- Own the Slack account and workspace, and generate the config token.
- Click Activate Public Distribution.
- Recruit the 10+ active workspaces.
- Provide legal entity details and approve the privacy policy.
- Record the demo video and submit.
- Answer reviewer messages and staff support within 2 business days.

## Escalation path
The Marketplace submission page shows estimated timing and reviewer messages. Report security issues through the Slack Help Center. Contact Slack developer support (feedback@slack.com / help center) about stuck reviews; there is no stated SLA. Slack says review cannot be expedited.

## Sources
| URL | Supports | Confidence |
|---|---|---|
| https://docs.slack.dev/slack-marketplace/slack-marketplace-review-guide | Eligibility (10 workspaces), checklist, stages, timelines, rejection reasons | CONFIRMED |
| https://docs.slack.dev/slack-marketplace/slack-marketplace-app-guidelines-and-requirements | Privacy, landing page, support (2 business days), security, scope and token rules | CONFIRMED |
| https://docs.slack.dev/distribution | Single-workspace / unlisted / listed options; Manage Distribution checklist | CONFIRMED |
| https://docs.slack.dev/authentication/installing-with-oauth | OAuth v2 flow, redirect rules, token types | CONFIRMED |
| https://docs.slack.dev/app-manifests/configuring-apps-with-app-manifests | Manifest UI/API, config tokens | CONFIRMED |
| https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps | Tier 1 limits, who is affected, May 29 / June 30, 2025 dates | CONFIRMED |
| https://api.slack.com/changelog/2025-05-terms-rate-limit-update-and-faq (via search snippet) | March 3, 2026 date for existing installs | SECONDARY |
| Security review guide (link returned 404) | Questionnaire details | UNCONFIRMED |
