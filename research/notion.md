# Notion: public connection (OAuth)

*Researched 2026-10-21. Notion now calls integrations **connections**. They're managed in the Developer portal (app.notion.com/developers), which launched 2026-05-12.*

## Summary verdict
**Difficulty: 2/5.** OAuth works for any workspace as soon as you create the connection, with no review. The only reviewed step is the optional Marketplace listing.

| Phase | Range | Basis |
|---|---|---|
| Setup (create connection, get credentials) | under 1 hour | estimated |
| Prerequisites (Notion account, dev workspace, HTTPS redirect) | 0 to 1 day | estimated |
| Submission (Marketplace listing, optional) | 1 to 3 hours | estimated |
| Provider review (Marketplace only) | 5 to 10 business days | **stated** |
| Revisions | unknown | no stated SLA |
| Customer-admin approval (Enterprise allow-list) | unknown | no stated SLA |

## Before approval
- Without any review, a connection with the "Any workspace" scope can be authorised by any Notion user in any workspace. Listing is optional, and an unlisted connection still works through OAuth.
- "Selected workspaces only" limits installs to workspaces you choose, and those connections can never be listed.

## Prerequisites
- A Notion account and a development workspace.
- Redirect URI(s).
- A decision on installation scope. **It can't be changed after creation.**
- For a listing: name, description, category, tags, images and logo.
- **Hypothesis not confirmed:** the current docs list no company name, website, privacy URL, terms URL or support-email fields. Only a third-party page (Make) describes those as fields of the older form.

## Steps
1. **you:** Open Developer portal > Build > Public connections > Create new connection.
2. **you:** Enter the name, dev workspace, redirect URIs, installation scope and capabilities.
3. **agent:** Copy the OAuth client ID and secret from the Configuration tab into a secret store.
4. **agent:** Build the authorize URL `https://api.notion.com/v1/oauth/authorize` with `client_id`, `redirect_uri`, `response_type=code`, `owner=user` and an optional `state`.
5. **customer user:** Approve the capabilities and pick pages in the page picker.
6. **agent:** POST the code to `/v1/oauth/token` with HTTP Basic auth. The response returns `access_token`, `refresh_token`, `bot_id` and workspace info.
7. **customer_admin:** On Enterprise, approve the connection if the workspace restricts installs.
8. **you (optional):** Listings > Connections. Draft the listing, then submit it.
9. **provider:** Review and reply by email within 5 to 10 business days. Approve, or send feedback.

## OAuth specifics
- There are **no OAuth scopes**. You choose **capabilities** on the connection itself:
  - Content: read, update, insert.
  - Comments: read, insert.
  - User info: none, without email, or with email.
- Access is granted per page, not per workspace. The user shares specific pages, and child pages inherit that access.
- **Token behaviour:**
  - Each refresh rotates both tokens.
  - Since 2026-06-08, each new authorisation returns a new token pair instead of the existing token.
  - The docs don't state an access-token lifetime for the REST API.
  - Notion MCP tokens last about 8 hours. Read `expires_in` rather than assuming that.

## Rate limits
- Per connection: 180 requests per minute, or 600 on Business and Enterprise plans, in a fixed 60-second window.
- A shared per-workspace limit applies on top of that.
- Handle 429 and 529 by honouring `Retry-After`.
- Payloads are capped at 1,000 blocks and 500KB. Rich text is capped at 2,000 characters.

## Submission checklist
- [ ] Connection created with the "Any workspace" scope
- [ ] Listing name and description
- [ ] Category and tags
- [ ] Logo and listing images
- [ ] Linked public connection
- [ ] Name with no brand or trademark conflict
- [ ] OAuth flow tested end to end

## Gotchas
- **The page picker is the number one support issue.** Your app sees nothing the user didn't share. The picker only shows pages the user has full access to. New pages aren't shared automatically unless they sit under a shared parent.
- Clicking Allow without finishing the token exchange leaves the connection with **no** page access.
- Every user must authorise separately, and tokens are tied to a single workspace.
- The installation scope can't be changed, so picking the wrong one means a new connection, which can't be listed if it's "Selected workspaces only".
- API version `2026-03-11` made breaking changes:
  - `archived` became `in_trash`.
  - `after` became `position`.
  - The `transcription` block became `meeting_notes`.
- SDK v5 and later need API version `2025-09-03` or newer, which splits databases into data sources.
- The per-workspace limit can return a `Retry-After` longer than 60 seconds.

## Blockers & what to do
| Blocker | Action |
|---|---|
| Empty search results or 404s on pages | Prompt the user to reshare pages. You can also attach a template so Notion duplicates and shares it on install. |
| Enterprise "approved only" policy | The customer's workspace owner adds the connection under Settings > Connections. |
| Listing rejected | Read the emailed feedback, revise and resubmit. |
| Scope chosen wrong | Create a new connection. |
| `public_api_request_blocked` | Don't retry. API access is restricted. |

## Escalation path
- For the Marketplace: reply to the review email.
- For anything else: Notion's general support or the developer community. **No dedicated developer support channel or SLA was found.**

## Unknowns
- Whether privacy, terms or company fields are still required anywhere in the current form.
- The access-token lifetime for REST public connections.
- How many review rounds and how long revisions take.
- Whether a security or privacy review applies to "featured" partners. A directory FAQ snippet says one does. It's unverified, and featured partners are picked by Notion.

## Sources
| URL | Supports | Confidence |
|---|---|---|
| developers.notion.com/guides/get-started/public-connections | Steps, fields, installation scope, per-user authorisation | CONFIRMED |
| developers.notion.com/guides/get-started/authorization | OAuth URLs, params, page picker, refresh rotation | CONFIRMED |
| developers.notion.com/guides/get-started/marketplace-listing | Listing fields, eligibility, 5 to 10 business days, rejection reasons, OAuth works unlisted | CONFIRMED |
| developers.notion.com/reference/capabilities | Capabilities list | CONFIRMED |
| developers.notion.com/reference/refresh-a-token | Token rotation | CONFIRMED |
| developers.notion.com/reference/request-limits | Rate and size limits | CONFIRMED |
| developers.notion.com/page/changelog | Developer portal, token change on 2026-06-08, MCP, API versions, rate-limit history | CONFIRMED |
| notion.com/help/enterprise-connection-settings | Enterprise install restrictions | CONFIRMED |
| make.com/en/help/app/notion | Privacy, terms and support fields (older form) | SECONDARY |
| Notion directory FAQ (search snippet) | Security review for featured integrations | UNCONFIRMED |
