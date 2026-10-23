# Spotify (Web API): Development mode vs extended quota mode

Researched 2026-10-22. Not on Composio's managed-OAuth list, so the developer registers and gets approved themselves.

## Summary verdict
- **Difficulty: 4 of 5 for production use, 1 of 5 for a personal/dev-mode app.** Development mode works in minutes but is capped at 5 allowlisted users, needs a Premium app owner and one Client ID per developer. Extended quota mode (unlimited users) is only open to registered organizations with a launched service and at least 250k MAUs, and review can take up to six weeks.
- **Biggest surprise:** a small startup cannot reach "unlimited users" at all unless it already has 250k monthly active users. Individuals have not been accepted since 2025-05-15.

| Phase | Range | Basis |
|---|---|---|
| Dev mode setup (create app, redirect URI, secret) | 10-30 min | Inferred from a short form |
| Dev mode review | None | Spotify page describes no review for dev mode |
| Extended quota prerequisites (entity, launched service, 250k MAU) | **no stated time** | Depends on the business |
| Extended quota review | up to 6 weeks | STATED |
| Revisions after rejection | **no stated SLA** | Page is silent on rejection and reapplication |

## Steps
1. Dashboard: Create an App, enter name and description (shown on the grant screen), tick the Developer Terms of Service box. (CONFIRMED)
2. Settings: Website, Redirect URIs, and Android Package / Bundle ID for mobile. (CONFIRMED)
3. Copy Client ID and secret. Rotate with the ROTATE button if leaked. (CONFIRMED)
4. Dev mode: Settings > Users Management > Add new user, enter name and Spotify email. (CONFIRMED)
5. Flow choice: Authorization Code (server, with secret), Authorization Code with PKCE (no secret safe), Client Credentials (no user data). (CONFIRMED)
6. PKCE: authorize with client_id, response_type=code, redirect_uri, code_challenge_method=S256, code_challenge, optional state and scope; exchange with grant_type=authorization_code, code, redirect_uri, client_id, code_verifier. (CONFIRMED)
7. Extended quota: Dashboard Quota Extension Request tab (4-step questionnaire), plus the Google form sent from a company email. (CONFIRMED)
8. Spotify emails feedback to the address on the Spotify account. (CONFIRMED)

## Approval/review requirements
- **Dev mode (default):** max 5 authenticated users on the allowlist; owner needs active Premium. Intended for learning, experimentation and non-commercial personal projects. (CONFIRMED)
- **Feb 2026 changes:** one dev-mode Client ID per developer, 5 users per Client ID. New apps from 2026-02-11, existing apps from 2026-03-09. Existing apps with more IDs or users are described as keeping them in the migration guide. Endpoint reductions for existing apps were postponed per the blog. (CONFIRMED, see unknowns)
- **Extended quota criteria:** established business entity; active, launched service; at least 250k MAUs; available in key Spotify markets; commercial viability; adherence to Developer Policy. (CONFIRMED)
- **Individuals:** since 2025-05-15 only organizations are accepted. (CONFIRMED)
- **Review time:** "can take up to six weeks". (CONFIRMED)
- **Benefit:** unlimited users, much higher rate limit. Numbers not published. (CONFIRMED)

## Gotchas
- **Redirect URIs:** HTTPS required except loopback. `localhost` not allowed; use `http://127.0.0.1:PORT` or `http://[::1]:PORT`. Exact match including case and trailing slash. Dynamic port allowed only for loopback registered without a port. (CONFIRMED)
- **Token lifetimes:** access token 1 hour. Refresh tokens from dashboard apps live 6 months and refreshing does not extend them. `invalid_grant` on expired/revoked refresh token. A new refresh token may not be returned on each refresh. (CONFIRMED)
- **Rate limit:** rolling 30 seconds window; 429 includes `Retry-After`. Numbers per mode not published. (CONFIRMED)
- **App cap:** 25 apps per developer account (apps page), but new dev-mode limit is 1 Client ID (migration guide). Pages differ; see unknowns.
- **Removed endpoints in dev mode (Feb 2026):** batch GETs, browse new-releases/categories, artist top-tracks, user profile by id; search limit max 10, default 5. Extended quota apps unaffected. (CONFIRMED)
- `streaming` scope requires the user to have Premium. (CONFIRMED)

## What an agent can do vs what the human must do
- **Human must:** log in to the dashboard, hold a Premium account, create the app, accept Developer Terms, add allowlist users, apply for extended quota from a company email, answer Spotify's email feedback, hold the business entity and MAU numbers.
- **Agent can:** write PKCE/code-flow and refresh code, handle 429 backoff, list exact redirect URIs, draft questionnaire answers and a user-growth/compliance summary for review, write allowlist instructions.

## Escalation path
1. Reply to Spotify's review email. (CONFIRMED that feedback is by email; no support SLA)
2. Spotify Community forum. UNCONFIRMED, not opened.

## Sources
| URL | Supports | Confidence |
|---|---|---|
| https://developer.spotify.com/documentation/web-api/concepts/quota-modes | Caps, criteria, 6 weeks, form, allowlist steps | CONFIRMED |
| https://developer.spotify.com/documentation/web-api/concepts/redirect_uri | Redirect rules | CONFIRMED |
| https://developer.spotify.com/documentation/web-api/tutorials/refreshing-tokens | Token lifetimes | CONFIRMED |
| https://developer.spotify.com/documentation/web-api/concepts/apps | App creation, 25 apps, fields | CONFIRMED |
| https://developer.spotify.com/documentation/web-api/concepts/rate-limits | Rate limit behaviour | CONFIRMED |
| https://developer.spotify.com/documentation/web-api/concepts/authorization | Flow choice | CONFIRMED |
| https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow | PKCE params | CONFIRMED |
| https://developer.spotify.com/documentation/web-api/tutorials/february-2026-migration-guide | Premium, 1 ID, 5 users, dates, removals | CONFIRMED |
| https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security | Reasons, dates, postponement, intended scope | CONFIRMED |
| https://developer.spotify.com/documentation/web-api/references/changes/february-2026 | Removed endpoints, search limits | CONFIRMED |
| https://developer.spotify.com/documentation/web-api/concepts/scopes | streaming needs Premium | CONFIRMED |
| https://developer.spotify.com/blog (404) | Not opened | n/a |
| Setup time 10-30 min | Inference | UNCONFIRMED |
