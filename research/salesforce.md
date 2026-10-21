# Salesforce — OAuth app setup and approval (researched 2026-10-21)

## Summary verdict
**Difficulty: 4/5.** Your app does not need Salesforce review to call the API. The work is distribution. Since Spring '26, new **Connected Apps** are disabled by default and you build an **External Client App (ECA)** instead. A *local* ECA works only in the org where you create it, so reaching customer orgs means packaging it in a managed package. Since Sept 2025, customer orgs block end users from **uninstalled** connected apps.

The original hypothesis was partly wrong. "Create in Developer Edition, works across orgs" was true for legacy Connected Apps. It is no longer the default path.

| Phase | Path A: connect customer orgs, no listing | Path B: AppExchange listing |
|---|---|---|
| Setup (ECA + OAuth policies) | hours; *estimated* | same; *estimated* |
| Prerequisites (Dev Hub, namespace, managed package) | 1–5 days; *estimated* | same, plus partner onboarding; *no stated SLA* |
| Settings take effect | up to ~10 min; *SECONDARY (Okta)* | same |
| Submission | none | days to prepare scans and docs; *estimated* |
| Provider review | none | next-steps email within 2 business days; "up to 4 weeks" after verification; *stated* |
| Revisions | none | each retest costs a fee; duration *no stated SLA* |
| Customer-admin approval | minutes to weeks (customer change control); *no stated SLA* | same: install still needed; *no stated SLA* |

## Before approval
- In your own org, OAuth (web-server flow + PKCE) works right after you create the ECA. No review is needed.
- A managed package with the ECA can be installed in any customer org by an install link without AppExchange. Whether a security review is needed before customers install an unlisted package is UNCONFIRMED.
- A legacy Connected App created before Spring '26 still works cross-org and can still be edited. In customer orgs it counts as "uninstalled" until their admin installs it.

## Prerequisites
- Developer Edition org enabled as a **Dev Hub**, plus a registered **namespace** (2GP). The docs say packageable ECAs must be developed in a Dev Hub org.
- Salesforce CLI and a 2GP managed package. 1GP is also supported.
- For a listing: Salesforce partner (ISV) account, Partner Console access, and a listing org.
- Callback URL(s) over HTTPS, and a chosen scope set (e.g. `api`, `refresh_token`).

## Steps
1. **you:** Create the ECA in Setup > External Client App Manager. Enable OAuth, set the callback URL and scopes, and keep **PKCE required** (the default). Keep the secret required for refresh. Settings are in the ECA's Policies and Settings.
2. **you:** Wait about 10 minutes, then test the web-server flow against `login.salesforce.com`. Use `test.salesforce.com` for sandboxes.
3. **you:** Set Distribution State from Local to **Packaged**. Add the ECA to a managed package. Global OAuth settings, including the consumer secret, are never packaged.
4. **agent:** Generate the package version, install link, and admin install guide.
5. **customer_admin:** Install the package, or install the app from Setup > Connected Apps OAuth Usage. Set Permitted Users to admin-approved if the policy calls for it, and assign profiles or permission sets.
6. **customer_admin (if API Access Control is on):** Allowlist the app, or users get blocked.
7. **you:** Path B only: submit for security review and pay the fee. **provider:** reviews.
8. **you:** Fix the findings and resubmit.

## Submission checklist (Path B)
- Managed package version, and only the related packages in the review org
- Code scanner results (Code Analyzer/Checkmarx), plus a DAST scan for external endpoints
- False-positive documentation, architecture and data-flow docs, and test credentials for your SaaS
- Fee paid. Free solutions are exempt.

## Gotchas
- **Connected App creation is off by default (Spring '26)**, in both the UI and the Metadata API. Support can enable it for now, but Salesforce says that option will be removed.
- **Uninstalled-app restriction (Sept 2025):** non-admin users can't authorize uninstalled connected apps. Users who already authorized can keep using it, **except with device flow**, which is blocked for everyone.
- The **Approve Uninstalled Connected Apps** permission is the bypass when API Access Control is off. **Use Any API Client** is the bypass when it is on. A later Salesforce article says Use Any API Client will **stop allowing self-authorization of uninstalled apps** (rollout reported to start the week of Dec 8, 2025).
- Local ECAs are not copied to sandboxes on refresh.
- Professional Edition orgs and some API limits depend on the partner program or review. UNCONFIRMED.
- Spring '26 release notes say blocked attempts to use uninstalled apps are now tracked, so customer admins will see your app in that tracking.

## Blockers & what to do
- **`OAUTH_APPROVAL_ERROR_GENERIC` / app blocked:** have the customer admin install the app or package. Don't ask them to grant broad bypass permissions.
- **Can't create a Connected App:** use an ECA. Open a Support case only for a short-term exception.
- **Security review fails:** fix the findings, pay the retest fee, and resubmit.

## Escalation path
Salesforce Help case (org permissions), Partner Community / Partner Account Manager (ISV), Partner Operations (review logistics), Trailblazer Community.

## Unknowns
- Whether an unlisted managed package needs a security review before customers install it.
- Current review queue times. Salesforce states "up to 4 weeks", and no 2026 data was found.
- The current listing or annual fee alongside the $999 per-attempt fee.
- A help.salesforce.com statement of how long settings take to propagate. The 10-minute figure is from Okta.
- Whether the Use Any API Client change is fully enforced.

## Sources
| URL | Supports | Confidence |
|---|---|---|
| https://help.salesforce.com/s/articleView?id=005228017&type=1 | Connected app creation disabled in Spring '26; Support exception being removed; API blocked too; editing and installing unaffected | CONFIRMED |
| https://help.salesforce.com/s/articleView?id=release-notes.rn_security_identity_connected_app_creation_disabled.htm&release=260&type=5 | Disabled by default; preference removed | CONFIRMED |
| https://developer.salesforce.com/blogs/2026/01/developers-guide-to-the-spring-26-release | Existing connected apps unaffected | CONFIRMED |
| https://help.salesforce.com/s/articleView?id=005132365&type=1 | Uninstalled-app restriction, Sept 2025 | CONFIRMED (via search excerpt) |
| https://admin.salesforce.com/blog/2025/get-ready-for-changes-to-connected-app-usage-restrictions | Restriction scope, device flow, permissions | CONFIRMED (via search excerpt) |
| https://help.salesforce.com/s/articleView?id=005228838&type=1 | Use Any API Client change | SECONDARY (date via Alibaba notice) |
| https://help.salesforce.com/s/articleView?id=release-notes.rn_security_track_blocked_apps.htm&release=260&type=5 | Blocked attempts tracked | CONFIRMED (title only) |
| https://help.salesforce.com/s/articleView?id=sf.configure_packageable_external_client_apps.htm&type=5 | Local vs Packaged; managed package; Dev Hub | CONFIRMED |
| https://trailhead.salesforce.com/content/learn/modules/external-client-app-basics/package-and-distribute-external-client-apps | 2GP distribution; secrets not packaged | CONFIRMED |
| https://developer.salesforce.com/docs/atlas.en-us.248.0.api_meta.meta/api_meta/meta_extlclntappglobaloauthsettings.htm | PKCE required by default; secret required for refresh | CONFIRMED |
| https://help.okta.com/en-us/content/topics/provisioning/salesforce/sfdc-configure-provisioning-rest.htm | ~10 min propagation | SECONDARY |
| https://developer.salesforce.com/blogs/2023/04/prepare-your-app-to-pass-the-appexchange-security-review | $999 per attempt; free exempt | CONFIRMED (2023, may be stale) |
| https://developer.salesforce.com/docs/platform/isvforce/guide/security-review-submit-solution.html | Retest fee; "up to 4 weeks"; free solutions pay no fee | CONFIRMED (via search excerpt) |
| https://developer.salesforce.com/docs/atlas.en-us.packagingGuide.meta/packagingGuide/security_review_how_it_works.htm | Five stages; email within 2 business days | CONFIRMED (via search excerpt) |
| https://nango.dev/blog/fix-salesforce-oauth-approval-error-generic | Error string for a blocked app | SECONDARY |
