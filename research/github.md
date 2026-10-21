# GitHub: OAuth Apps vs GitHub Apps

## Summary verdict
- **Difficulty: 1 of 5.** No submission and no provider review before an app works for any GitHub user. The one real hurdle is that each customer organization has to approve the app itself.
- **Which to pick:** GitHub recommends a **GitHub App** for most cases. It gets fine-grained permissions, short-lived tokens and rate limits that scale with installs. Pick an **OAuth App** only if you need enterprise-level resources, which GitHub Apps can't yet be granted. For a multi-user integration, use a GitHub App.

| Phase | Range | Basis |
|---|---|---|
| Setup (register app, get credentials) | 5–15 min | Inferred from a single settings form |
| Submission | None | Nothing is submitted to GitHub for a working app |
| Review wait | 0 for GitHub itself. Per-org owner approval has **no stated SLA** | Org docs give no timeline |
| Revisions | None from GitHub | — |
| Optional Marketplace listing | **no stated SLA** | Requirements are listed, timing is not |

Time to the first working token is minutes, once the callback handler is coded. This is inferred, not stated by GitHub.

## Steps
**GitHub App (recommended)**
1. Go to Settings (or Org > Settings) > Developer settings > GitHub Apps > New GitHub App.
2. Fill the required fields:
   - **App name:** at most 34 characters and unique on GitHub.
   - **Homepage URL:** your repo URL works if you have no site.
   - **Permissions:** set each one to the minimum you need (Read-only, Read & write or No access).
   - **Where can it be installed:** "Only on this account" or "Any account". Pick "Any account" for multi-user.
3. Fill the optional fields:
   - **Callback URL:** up to 10, needed for user tokens.
   - **Expire user tokens:** keep it on.
   - **Request user authorization during installation:** on or off.
   - **Device flow:** on or off.
   - **Setup URL:** where users land after installing.
   - **Webhook:** you can turn **Active** off. If it's on, a URL is required and a secret is strongly recommended.
4. Click Create GitHub App. Then generate a client secret, and a private key if you need installation tokens.

**OAuth App**
1. Go to Settings > Developer settings > OAuth apps > New OAuth App.
2. Fill the fields:
   - **Application name:** required.
   - **Homepage URL:** required.
   - **Authorization callback URL:** required, up to 10.
   - **Description:** optional.
   - **Device Flow:** optional.
   - **Expire user access tokens:** on by default.
3. Click Register application, then use "Generate a new client secret".

**Flow (both app types):**
1. Send the user to `GET github.com/login/oauth/authorize` with `client_id`, `redirect_uri`, `state` and PKCE (S256 only).
2. GitHub returns a `code`, which expires after 10 minutes.
3. Exchange it with `POST github.com/login/oauth/access_token`.
4. Call the API with a Bearer token.

Implicit grant is not supported, and the token endpoint doesn't support CORS.

**Scopes and permissions:**
- **OAuth Apps use scopes** requested in the authorize URL, separated by spaces, for example `repo`, `read:org`, `user:email` or `offline_access`.
  - With no scope, the token can read public data only.
  - GitHub drops redundant scopes when it stores them.
  - Users can grant fewer scopes than you asked for. Check the `X-OAuth-Scopes` header.
- **GitHub Apps use fine-grained permissions** set on the app, not scopes.

## Approval/review requirements
- **GitHub-side review:** none for a working app, private or public. Each account can own up to 100 OAuth Apps and 100 GitHub Apps. There's no cap on users or installs before approval.
- **Org OAuth app access restrictions:** these are **on by default for new orgs**. An unapproved OAuth App loses access to the org's private resources and can't make privileged writes. Members can request approval, but only an owner can grant it, with **no stated SLA**.
- **GitHub Apps and orgs:** an org owner must approve installs that ask for org permissions. Repo admins can request an install. GitHub Apps aren't subject to the OAuth app restriction policy.
- **Marketplace (optional, only needed to sell):**
  - **Free listing:** needs a privacy policy, a support contact, value beyond authentication, and plan-change webhooks.
  - **Paid listing:** also needs an org that is a **verified publisher**. GitHub Apps should have at least 100 installs, and OAuth Apps at least 200 users. You must request verification, and only org owners can submit.
  - **Review time:** no stated SLA.

## Gotchas
- **`redirect_uri_mismatch`:** the redirect must exactly match a registered callback unless you enable wildcard matching. For loopback, use `127.0.0.1` rather than `localhost`; the port may differ.
- **Org data comes back empty:** this is usually the org's OAuth restrictions, not your code. Point customers to "request approval".
- **Token cap:** at most 10 tokens per user, app and scope combination. Past that, GitHub silently revokes the oldest one. Token creation is also limited to 10 per hour.
- **Refresh tokens rotate:** each refresh invalidates the old pair. Refresh tokens expire after 6 months unused, and access tokens after 8 hours. A race between two refreshes can lock a user out.
- **Shared rate limit:** user tokens draw on the user's 5,000 requests per hour, shared with all their other apps. Installation tokens start at 5,000 per hour and scale up to 12,500 (15,000 on Enterprise Cloud). Secondary limits: 100 concurrent requests, 900 points per minute per endpoint, and 2,000 OAuth token requests per hour.
- **Secrets:** keep the private key and client secret in a vault, never in client apps. Public clients should use PKCE. Rotate a leaked secret by generating a new one, deploying it, then deleting the old one.
- **Abuse:** an app reported for abuse can get `application_suspended`. Only GitHub Support can fix that.
- **Stored identity:** store numeric `id`s, not logins or emails, which can change.

## What an agent can do vs what the human must do
- **The human must:**
  - Create the app in a logged-in, 2FA-capable browser session. There's no public API for registering OAuth Apps.
  - Generate and copy the client secret and private key.
  - Get customer org owners to approve the app.
  - Accept the Marketplace agreement and complete publisher verification, if listing.
- **An agent can:**
  - Prepare field values and the permission set.
  - Write the authorize, callback, refresh and PKCE code.
  - Draft the privacy policy, support page and listing copy.
  - Build rate-limit backoff.
  - Write the approval-request instructions for customer orgs.
  - Test with the human's token.
  - Optionally, a "manifest" flow can pre-fill a GitHub App. The human still has to click confirm. This was not verified in this pass.

## Escalation path
1. Docs troubleshooting pages for authorization request errors.
2. GitHub Community Discussions (Apps/API category). SECONDARY.
3. GitHub Support at support.github.com, needed for suspensions. Response time is plan-dependent, no stated SLA here.
4. Marketplace onboarding contact. UNCONFIRMED.

## Sources
| URL | Supports | Confidence |
|---|---|---|
| docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app | OAuth App steps, fields, 100-app and 10-callback caps | CONFIRMED |
| docs.github.com/en/apps/oauth-apps/building-oauth-apps/differences-between-github-apps-and-oauth-apps | Recommendation, token expiry, org approval | CONFIRMED |
| docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app | GitHub App fields, 34-char name, webhook optional, 100-app cap | CONFIRMED |
| docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions | Restrictions on by default, owner approval, no SLA | CONFIRMED |
| docs.github.com/en/apps/oauth-apps/building-oauth-apps/scopes-for-oauth-apps | Scopes model, normalization, headers | CONFIRMED |
| docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps | Flow, PKCE, expiry, 10-token cap, device flow | CONFIRMED |
| docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api | Rate-limit numbers | CONFIRMED |
| docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app | Secret and key handling, token lifetimes | CONFIRMED |
| docs.github.com/en/apps/oauth-apps/maintaining-oauth-apps/troubleshooting-authorization-request-errors | Error causes, Support for suspension | CONFIRMED |
| docs.github.com/en/apps/github-marketplace/github-marketplace-overview/about-github-marketplace-for-apps | Marketplace optional, verified publisher for paid | CONFIRMED |
| docs.github.com/en/apps/github-marketplace/creating-apps-for-github-marketplace/requirements-for-listing-an-app | Listing requirements, 100/200 thresholds | CONFIRMED |
| docs.github.com/en/apps/oauth-apps/building-oauth-apps/best-practices-for-creating-an-oauth-app (search snippet) | Secret rotation steps | SECONDARY |
| Client secret shown only once | Common practice, not found in docs this pass | UNCONFIRMED |
| Setup time 5–15 min | Inference from form length | UNCONFIRMED |
