# Spot-checks and hands-on setup

Everything else in `research/` was written or re-checked by an agent while the guides were being made. This file is a separate pass on the claims a developer would act on: one claim per row, the page it should come from, and the provider's own words, so anyone can open the page and check.

## Facts spot-checked (24 Oct 2026)

How: open the guide, open the provider's page, find the sentence. Claude fetched each page and quoted it; I chose the claims and reviewed the results. Five of the ten are from live guides, which nobody had checked before.

**Result: 6 match, 2 are partly right (the facts are right but the headline overstates them), 1 is wrong, 1 can't be confirmed from Etsy's public docs.**

| # | Guide | Claim in the guide | What the provider's page says | Result |
|---|---|---|---|---|
| 1 | [Dropbox (live)](https://greenlight-lime-iota.vercel.app/g/dropbox) | Dev apps link up to 500 users; at 50 you have 2 weeks to get production approval or linking freezes | "it can only be linked with up to 500 total Dropbox users" … "once your app links 50 Dropbox users, you will have two weeks to apply for and receive production status approval before your app's ability to link additional Dropbox users will be frozen" ([developer guide](https://docs.dropboxapi.com/dropbox-api/docs/developer-resources/developer-guide)) | **Matches** in the timeline and gotchas. The headline's "freezes at 50 users" is **too strong**: it only freezes if you're not approved 2 weeks after reaching 50 |
| 2 | Dropbox (live) | Headline: production "requires 50 linked users first" | "While you may submit your request for production status anytime, it will not be reviewed until your app has linked with at least 50 Dropbox users." There's also a "Request early review" option (same page) | **Partly right.** You can apply any time; review waits for 50 users unless you ask for early review. The guide misses the early-review option |
| 3 | [Amazon SP-API (live)](https://greenlight-lime-iota.vercel.app/g/amazon-selling-partner) | A Professional selling account costs $39.99/month | "$39.99/month + selling fees" ([sell.amazon.com/pricing](https://sell.amazon.com/pricing)) | **Matches** |
| 4 | Amazon SP-API (live) | Headline: "Public apps require Appstore listing" | "you're not required to list your app on the Selling Partner Appstore." Approved listings are published "in three to four weeks" ([List your app](https://developer-docs.amazon/sp-api/docs/list-your-app-on-the-selling-partner-appstore)) | **Wrong.** Listing is optional (unlisted apps have authorization limits). The 3–4 week publishing time is worth adding |
| 5 | [PayPal (live)](https://greenlight-lime-iota.vercel.app/g/paypal) | Review takes 24–72 hours for Merchant API calls | "PayPal reviews your application within 24 – 72 hours of your submission" ([Go live](https://developer.paypal.com/api/rest/production)). The same page says such apps can use live credentials straight away while the review runs | **Matches.** The guide doesn't say you can go live during the review |
| 6 | [Razorpay (live)](https://greenlight-lime-iota.vercel.app/g/razorpay) | You must become a Technology Partner by contacting support first | "Sign up with Razorpay as a Technology Partner by reaching out to our support team" … "You require this to register your application on the Dashboard." ([About OAuth](https://razorpay.com/docs/partners/technology-partners/onboard-businesses/integrate-oauth)) | **Matches.** The page shows no self-serve route, so one route is right |
| 7 | [Etsy (live)](https://greenlight-lime-iota.vercel.app/g/etsy) | Personal and commercial apps are reviewed; commercial takes longer | Neither the [authentication page](https://developer.etsy.com/documentation/essentials/authentication) nor [get help](https://developer.etsy.com/documentation/get-help) says anything about review or personal vs commercial access | **Can't confirm** from public docs. Treat as a lead, or ask developers@etsy.com |
| 8 | [Slack (library)](https://greenlight-lime-iota.vercel.app/guides/slack) | Marketplace needs 10+ active workspaces before you submit | Unsuitable apps include those "installed on less than 10 active workspaces and have less than 10 weekly active users." "Active workspaces are workspaces that have been used in the past 28 days (and that are not sandboxes)." ([guidelines](https://docs.slack.dev/slack-marketplace/slack-marketplace-app-guidelines-and-requirements)) | **Matches** |
| 9 | [Google (library)](https://greenlight-lime-iota.vercel.app/guides/google) | Testing mode: up to 100 test users, and authorizations expire after 7 days | "limited to up to 100 test users listed in the OAuth consent screen" … "Authorizations by a test user will expire seven days from the time of consent." Refresh tokens expire too ([Google Cloud help](https://support.google.com/cloud/answer/15549945)) | **Matches** |
| 10 | [GitHub (library)](https://greenlight-lime-iota.vercel.app/guides/github) | No review to create an OAuth App, but an org with access restrictions must approve it | With restrictions on, "organization members and outside collaborators cannot authorize OAuth app access to organization resources"; members request access and owners approve ([access restrictions](https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions)). Nothing on the page about GitHub reviewing new apps | **Matches** |

**What this says about the product:** the library guides held up (3 of 3). In the live guides, the weak spot is the headline. Dropbox's headline overstated details that were right further down the page, and Amazon's headline said listing is required when it's optional. The headline check is meant to catch exactly this and missed both, so it needs a stricter prompt that looks for words like "require" and "only" and checks them against the excerpts.

## Apps I set up

Done on 24 Oct 2026 in my own free accounts. Claude in Chrome clicked through the consoles while I watched and signed in myself. No client secrets were generated or captured.

| Provider | What I did | Time it took | Guide said | Matched? | What I found |
|---|---|---|---|---|---|
| GitHub | Created an OAuth App (Settings → Developer settings → New OAuth App) | 4 min, sign-in included | Minutes, no review; up to 10 callback URLs; "Expire user access tokens" on by default | **Yes** | "Application created successfully" and the client ID straight away. No review, no user cap ("0 users"), no extra checks. The form now calls the field **Redirect URIs** ("You may add up to 10") with an **Allow wildcard matching** option; the guide's wording is "callback URL", same limit. There's a "List this application in the Marketplace" button right on the new app. The GitHub App form matched the guide too: webhook **Active** by default with a required URL, permission groups, Setup URL, and "Only on this account" vs "Any account". |
| Google | Tried to create a project for an OAuth client in Testing mode | Blocked after 1 min | Testing mode works right away for up to 100 test users | **Blocked before the guide's first step** | The console said: "Google Cloud access blocked. Effective from 13 March 2026, Google Cloud has begun to enforce two-step verification (2SV), also called multi-factor authentication (MFA)." A first-time Terms of Service dialog sits on top. **The guide doesn't mention this.** A developer without 2SV can't create a project, so they can't get a client ID at all. |
| Slack | Create an app in my own free workspace and install it | | Minutes in your own workspace; Marketplace needs 10 workspaces | | |
| Dropbox | Create a development app and read the production form | | 500 dev users; 2 weeks to get approved after 50 | | |

Screenshots are in `docs/hands-on/`:
- `github-1-form.png`: the OAuth App form
- `github-2-registered.png`: the app right after creation, with its client ID. The app is a throwaway and has no secret.
- `github-3-github-app-form.png`: the GitHub App form's webhook and setup fields
- `google-0-mfa-blocked.png`: the 2SV block, with my name and email covered

**What this says about the guides:** the GitHub guide held up. The Google guide missed a blocker that comes before everything else it describes, and it's a new one: Google started enforcing it on 13 March 2026, after the guide's sources were written. Reading docs can't find this kind of blocker. Doing the setup can.
