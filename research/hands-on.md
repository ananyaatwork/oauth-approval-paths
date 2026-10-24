# Checked by hand

Everything else in `research/` was read or re-checked by an agent. This file is what I checked myself: facts I opened and compared, and apps I actually set up. Blank rows haven't been done yet.

## Facts I spot-checked

How: open the guide, open the cited page, find the sentence, and mark it **matches**, **wrong** (with what the page really says) or **can't tell**.

| # | Guide | Claim in the guide | Page to open | Result | Note |
|---|---|---|---|---|---|
| 1 | [Dropbox (live)](https://greenlight-lime-iota.vercel.app/g/dropbox) | Dev apps can link up to 500 users; at 50 linked users you have 2 weeks to get production approval, or linking new users freezes | [Developer guide](https://docs.dropboxapi.com/dropbox-api/docs/developer-resources/developer-guide) | | |
| 2 | Dropbox (live) | "Review only starts after 50 linked users" (you can't apply earlier) | same page | | |
| 3 | [Amazon SP-API (live)](https://greenlight-lime-iota.vercel.app/g/amazon-selling-partner) | A private app needs a Professional selling account at $39.99/month | [sell.amazon.com/developers](https://sell.amazon.com/developers) and Amazon's pricing page | | |
| 4 | Amazon SP-API (live) | Public apps must be listed on the Selling Partner Appstore | [List your app](https://developer-docs.amazon/sp-api/docs/list-your-app-on-the-selling-partner-appstore) | | |
| 5 | [PayPal (live)](https://greenlight-lime-iota.vercel.app/g/paypal) | Production review takes 24–72 hours for Merchant API calls | [Go live](https://developer.paypal.com/api/rest/production) | | |
| 6 | [Razorpay (live)](https://greenlight-lime-iota.vercel.app/g/razorpay) | OAuth needs you to become a Technology Partner by contacting support first (only route) | [About OAuth](https://razorpay.com/docs/partners/technology-partners/onboard-businesses/integrate-oauth) | | |
| 7 | [Etsy (live)](https://greenlight-lime-iota.vercel.app/g/etsy) | Personal apps get a review; commercial access takes longer | [Authentication](https://developer.etsy.com/documentation/essentials/authentication) | | |
| 8 | [Slack (library)](https://greenlight-lime-iota.vercel.app/guides/slack) | Marketplace needs 10+ active workspaces before you can submit | [Marketplace guidelines](https://docs.slack.dev/slack-marketplace/slack-marketplace-app-guidelines-and-requirements) | | |
| 9 | [Google (library)](https://greenlight-lime-iota.vercel.app/guides/google) | Testing mode is capped at 100 test users, and their authorizations expire after 7 days | [Configure the consent screen](https://developers.google.com/workspace/guides/configure-oauth-consent) | | |
| 10 | [GitHub (library)](https://greenlight-lime-iota.vercel.app/guides/github) | An OAuth App needs no review, but an org with access restrictions must approve it before it can read that org's data | [Creating an OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) and [About OAuth app access restrictions](https://docs.github.com/en/organizations/managing-oauth-access-to-your-organizations-data/about-oauth-app-access-restrictions) | | |

## Apps I set up

| Provider | What I did | Time it took | Guide said | Matched? | What surprised me |
|---|---|---|---|---|---|
| GitHub | Created an OAuth App (Settings → Developer settings) | | Minutes, no review | | |
| Google | Created an OAuth client with the consent screen in Testing mode | | | | |
| Slack | Created an app in my own free workspace and installed it | | Minutes in your own workspace; Marketplace needs 10 workspaces | | |

Screenshots are in `docs/`. No client secrets are in them.
