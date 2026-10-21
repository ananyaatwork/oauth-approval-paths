# 00 — Managed OAuth app directory landscape

Researched 2026-10-21. Tags: **CONFIRMED** means I read it on the primary source. **SECONDARY** means a blog or third-party source. **UNCONFIRMED** means my own inference or guess.

## Which "managed OAuth app directory"?

The best match is **Composio's "Managed OAuth apps" page**: https://docs.composio.dev/toolkits/managed-auth. It is the only vendor page I found that is literally a directory. It has two tables, one for toolkits where Composio supplies the OAuth app and one headed "Bring your own OAuth app" (CONFIRMED). Composio is also an agent-integrations platform, which fits the "APM Integrations" framing.

Runner-ups:
- **Nango**: "Nango-managed apps" plus a per-API docs catalog (https://www.nango.dev/docs/guides/auth/auth-guide).
- **Arcade.dev**: "default auth providers", documented per provider (https://docs.arcade.dev/en/references/auth-providers/google).
- **Pipedream Connect**: "Pipedream's official OAuth client" (https://pipedream.com/docs/connect/managed-auth/oauth-clients).

Choosing Composio is my inference from the wording match. The brief does not name the vendor (UNCONFIRMED).

## 1. What "managed OAuth app" means, in each vendor's words

- **Composio:** "Composio registers and maintains OAuth apps for popular toolkits such as GitHub, Gmail, and Slack." With custom auth configs, "you provide your own OAuth app, API key, bearer token, or other credentials." Source: https://docs.composio.dev/docs/custom-app-vs-managed-app (CONFIRMED)
- **Nango:** "For popular APIs, Nango ships a built-in shared developer app so you can test connections with zero setup." These are "pre-approved OAuth apps for popular APIs such as Gmail, Outlook, Salesforce, and HubSpot." Nango-managed apps "work in production, but we recommend registering your own OAuth app before you go live." Source: https://www.nango.dev/docs/guides/auth/auth-guide (CONFIRMED)
- **Pipedream:** Connect "will default to using Pipedream's official OAuth client." Also: "Your ability to use Pipedream's OAuth clients in production depends on the use case." Source: https://pipedream.com/docs/connect/managed-auth/oauth-clients (CONFIRMED)
- **Arcade:** The default Google provider "supports a fixed set of scopes and is shared across all Arcade users." For production, "we strongly recommend creating your own Google OAuth provider." Source: https://docs.arcade.dev/en/references/auth-providers/google (CONFIRMED). Arcade has no default provider at all for Reddit, Discord, Spotify or Twitch (https://docs.arcade.dev/home/auth-providers/reddit, CONFIRMED via search snippet).

**How the pieces relate (synthesis, UNCONFIRMED):**
- A *provider OAuth app* is the client registered with Slack, Google or another provider. It holds the client ID, secret, redirect URI, scopes and review status.
- The *developer's integration* points at either the platform's shared app (managed) or the developer's own app (bring your own, BYO).
- Each *end-user connection* is a token grant issued to whichever app was used. That is why switching apps forces users to re-authenticate. Composio confirms this: switching affects new connections only, and existing users keep theirs until they re-authenticate or are migrated (https://docs.composio.dev/docs/custom-app-vs-managed-app, CONFIRMED via search summary).

## 2. What the Composio directory lists

- **Fields:** Toolkit name (linked) and slug (e.g. `GMAIL`) only. There are no scopes, no auth type and no review notes. Source: https://docs.composio.dev/toolkits/managed-auth (CONFIRMED)
- **Count:** About 343 OAuth toolkits. **124** have Composio-managed OAuth and **219** require your own app (CONFIRMED, as of the fetch date).
  - Managed examples: Gmail, GitHub, Slack, Notion, Stripe, Zoom, HubSpot.
  - BYO examples: Shopify, Vercel, DocuSign, Xero, Pipedrive, Spotify.
- **Programmatic check:** Read the `composio_managed_auth_schemes` field from the toolkits API (CONFIRMED).
- **Review/approval:** The page does not mention verification, app review or approval at all (CONFIRMED).
- **Composio's per-provider "auth guides"** (e.g. https://composio.dev/auth/slack) cover only two things: managed versus custom. They do not walk through creating the provider app, its scopes or Marketplace review (CONFIRMED).
- **Nango comparison:** Nango claims "1,000+ APIs" (https://nango.dev/platform/auth, SECONDARY because it is marketing). Its Gmail setup guide does have a "Verify your app" step. It says "You will need to pass a security review." It does not name CASA and gives no timelines (https://www.nango.dev/docs/api-integrations/google-mail/how-to-register-your-own-gmail-api-oauth-app, CONFIRMED).

## 3. Tradeoffs: managed app vs own app

| Factor | Managed (shared) app | Own app | Source |
|---|---|---|---|
| Consent-screen branding | Shows "Composio wants to access your account", "Arcade" or "Nango" | Shows your name | Composio, Arcade, Nango (CONFIRMED) |
| Scopes | "Sensible defaults" (Composio); "fixed scopes" (Nango); unlisted scopes error out (Arcade) | Your choice | CONFIRMED |
| Rate limits | "Share quota across all Composio users"; Arcade's limits are shared | Dedicated quota | CONFIRMED |
| Polling | Composio enforces a 15-minute minimum | Shorter intervals where the API supports them | CONFIRMED |
| Revocation risk | "If a provider revokes a Nango-managed app, every connection using it stops working" | Isolated to you | Nango (CONFIRMED) |
| Token portability | Can't export tokens; Pipedream won't return credentials for its client | Exportable; you can leave the platform without users re-authorizing | Nango, Pipedream (CONFIRMED) |
| Marketplace listing | "Provider marketplaces require your own app" | Possible | Nango (CONFIRMED) |
| Verification ownership and user caps | Done by the vendor ("pre-approved") | **You** own it. Example: an unverified Google app is "limited to 100 new users until it is verified" | Nango; Google https://support.google.com/cloud/answer/7454865 (CONFIRMED) |
| Speed to start | Zero setup | Register the app and pass review | CONFIRMED |

Google also requires restricted-scope apps to "complete 're-verification' annually" (https://support.google.com/cloud/answer/13463073, CONFIRMED).

## 4. The gap: what the directory does NOT tell a developer

All four vendors' pages I read omit the following (CONFIRMED absence on the pages fetched):
- Whether the provider requires **app review** and what the review checks: demo video, privacy policy, security assessment (CASA), publisher verification.
- **Timelines**: days or weeks of human review, and resubmission loops.
- **Pre-approval limits**: user caps, test-user allowlists, "unverified app" warnings, dev-mode restrictions.
- **Gating**: whether the API is partner-only, needs a paid plan, needs a sales contact or needs an admin install.
- **Scope classification**: which scopes trigger stricter review.
- **Common rejection reasons**, and what to prepare before submitting.
- **Migration cost** when moving users off a managed app.
- **Ordering**: what to start first so review isn't the critical path.

That gap is what our guide tool would fill (UNCONFIRMED product inference).

## 5. Candidate providers (~25) by expected difficulty

**All tiers below are UNCONFIRMED guesses from general knowledge**, except where a confirmed fact is noted. Every one needs verification in later research files.

- **Instant / self-serve:** GitHub, GitLab, Notion, Linear, Asana, Figma, Dropbox (dev mode), Zoom (private apps).
- **Moderate (light review or verification):** Slack (private install is instant; Marketplace listing is reviewed), Microsoft Entra / Graph (publisher verification, admin consent), Atlassian Jira/Confluence (distribution), HubSpot (Marketplace listing), Calendly, Intercom, Discord (bots in 100+ servers need verification).
- **Slow human review:** Google Gmail/Drive/Calendar (sensitive or restricted scopes, CASA; the 100-user cap is CONFIRMED above), Meta/Instagram (App Review plus business verification), LinkedIn (product access requests), X/Twitter (paid tiers), TikTok, Shopify (public app review; it is BYO in Composio, CONFIRMED), Xero (certification for scale; BYO in Composio, CONFIRMED), QuickBooks/Intuit (production keys questionnaire).
- **Partner-gated:** Salesforce (AppExchange security review), Workday, NetSuite, Epic/healthcare-type APIs.
