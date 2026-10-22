# Notion guide: verification log

Checked 2026-10-21 by agent against live pages (WebFetch).

| # | Guide's claim | Live page says | URL | Verdict |
|---|---|---|---|---|
| 1 | Public connections need no review before OAuth works for any workspace | "can be used via its OAuth flow without being listed"; "Any workspace" lets any Notion user in any workspace install it. Listings are what get reviewed ("The Notion team reviews every listing submission"). No pre-OAuth review is mentioned. | https://developers.notion.com/guides/get-started/marketplace-listing ; https://developers.notion.com/guides/get-started/public-connections | MATCH |
| 2 | Installation scope is permanent | "Installation scope is set once, at creation time, and can't be changed afterward." | https://developers.notion.com/guides/get-started/public-connections | MATCH |
| 3 | The current creation form doesn't ask for company name, privacy policy, terms or support email (only Make's older page lists them) | Creation fields: name and dev workspace, redirect URI(s), installation scope, capabilities. None of the five fields appears on the public-connections, authorization or marketplace-listing pages. Caveat: the page says "the required fields, including:", so the list may not be complete. | https://developers.notion.com/guides/get-started/public-connections ; https://developers.notion.com/guides/get-started/authorization | MATCH |
| 4 | Listing review takes 5–10 business days, and only "Any workspace" connections can list | "expect to hear back from our team within 5-10 business days via email"; "Only public connections with an installation scope of **Any workspace** can be listed on the Marketplace." | https://developers.notion.com/guides/get-started/marketplace-listing | MATCH |
| 5 | A refresh rotates both the access and refresh tokens | "generating a new access token and new refresh token"; the authorization guide says the same. Neither page says whether the old refresh token is invalidated. | https://developers.notion.com/reference/refresh-a-token | MATCH |
| — | Source s10, "Notion directory FAQ" (a search snippet with no URL): featured partners get a security and privacy review | Copies of this FAQ text turn up in search results (including localized notion.com/*/integrations pages), but neither the live English nor the Italian notion.com/integrations page showed it when fetched. | https://www.notion.com/integrations | COULD NOT VERIFY: source removed and the item kept as an unconfirmed unknown (no guide item cited only s10) |

**Summary:** All 5 high-impact claims match the live Notion docs. The only change was removing source s10, which had no URL and couldn't be confirmed on the live page; the featured-partner review stays listed as an unknown.
