# Microsoft identity platform (Entra ID, multi-tenant, Microsoft Graph)

## Summary verdict
**Difficulty: 3/5.** Registering the app takes minutes. The friction comes from consent: publisher verification needs a verified Microsoft AI Cloud Partner Program (CPP, formerly MPN) account, and since Aug 2025 the Microsoft-managed default consent policy sends many common Graph scopes to the customer's admin anyway. **The hypothesis holds**, with one refinement: verification does not unlock Mail, Calendar, Files or Chat scopes in tenants that use Microsoft's default policy.

| Phase | Path A: low-risk delegated scopes (User.Read, openid, profile) | Path B: admin-consent or blocked-by-default scopes (application permissions, Mail.*, Files.Read.All, etc.) | Tag |
|---|---|---|---|
| Setup (register app) | Minutes | Minutes | estimated |
| Prerequisites (verify CPP account in Partner Center) | 3–5 business days, longer if Microsoft asks for more info | Same | **stated** |
| Submission (enter Partner ID) | "A few minutes" | Same | **stated** |
| Provider review | None for publisher verification; it is automated | None. M365 Certification audit (optional) has no stated SLA | stated / no stated SLA |
| Revisions | If verification is rejected, file an appeal | Same | no stated SLA |
| Customer-admin approval | Not needed if user consent is on and the app is verified | Needed in every tenant | no stated SLA |

## Before approval (unverified)
- Without verification, users in other tenants see an "unverified" publisher on the consent screen and no blue badge.
- Risk-based step-up consent is on by default. It sends user consent to admin approval for newly registered multi-tenant apps that are not publisher verified and ask for more than basic sign-in and profile. Users get **AADSTS90094**, or an "admin approval needed" request if the tenant has the admin consent workflow turned on.
- In your own tenant, everything works, and any admin can consent.
- No user caps or token quotas tied to verification were found.
- Tenants using `microsoft-user-default-low` allow user consent only to apps from verified publishers or apps registered in that tenant.

## Prerequisites (these block publisher verification)
- An Entra work or school tenant. Apps registered with a personal Microsoft account (MSA) can't be verified. B2C and national clouds aren't supported.
- A CPP **Partner Global Account (PGA)** Partner One ID, fully verified. A location ID won't work.
- The app's tenant must be linked to the PGA.
- A publisher domain other than `*.onmicrosoft.com`. It must match the email domain used for CPP verification, or be a DNS-verified custom domain.
- One person holding both roles:
  - Entra: Application Administrator or Cloud Application Administrator.
  - Partner Center: CPP Partner Admin or Account Admin.
- That person signs in with MFA and accepts the identity platform Terms of Use.
- Partner Center verification checks your business email, identity (government ID), employment (domain registrar documents) and business registration documents.

## Steps
1. **[you]** Create an Entra tenant and give yourself at least the Application Developer role.
2. **[agent]** Register the app under App registrations → New registration, choosing **Multiple Entra ID tenants**.
3. **[agent]** Add redirect URIs (see Gotchas) and a credential.
4. **[agent]** Add Graph permissions:
   - Delegated (scopes): users can consent to some. Admins can consent for everyone.
   - Application (app roles): **always need admin consent**, and must be requested with `/.default`.
5. **[agent]** Point code at `/organizations` or `/common`, validate `iss` against `tid`, and cache tokens per tenant.
6. **[you]** Enroll in CPP and complete Partner Center verification.
7. **[provider]** Microsoft verifies your Partner Center account.
8. **[you]** In Branding & properties, set the publisher domain, choose Add Partner ID, then Verify and save.
9. **[agent]** Test the badge with `prompt=consent`, for testing only.
10. **[customer_admin]** Each customer's admin grants consent at `https://login.microsoftonline.com/{tenant}/v2.0/adminconsent?client_id=…&scope=…/.default&redirect_uri=…`. Success returns `admin_consent=True`. Granting consent creates the app's service principal in their tenant.
11. **[you, optional]** Microsoft 365 Publisher Attestation, a self-assessment. Most take an hour or less.
12. **[you, optional]** Microsoft 365 Certification, a yearly third-party audit with Claranet. It's optional, though the docs say it "may be required" in some tenants.

## Submission checklist
- [ ] Partner One ID is the PGA ID, and its status is **Authorized**
- [ ] Tenant is linked to the PGA
- [ ] Publisher domain is set, matches the CPP email domain, and is not onmicrosoft.com
- [ ] Your account has both roles and signs in with MFA
- [ ] Permissions are minimal and listed correctly as delegated or application
- [ ] There's an admin-consent link or "connect" page for customer admins

## Gotchas
- **Default consent policy:** "Let Microsoft manage your consent settings" (`microsoft-user-default-recommended`) is the default for new tenants. Microsoft updates its list automatically. It blocks user consent to Files.Read/ReadWrite.All, Sites.Read/ReadWrite.All, Mail.*, Calendars.*, Chat.*, OnlineMeetings.*, Contacts/Tasks.*, People.Read, and EWS/IMAP/POP/EAS, even for verified apps. ISVs on Microsoft Q&A reported this broke onboarding in Aug 2025, and they say it was poorly announced.
- **Redirect URIs:**
  - HTTPS only, except localhost.
  - Case-sensitive. Max 256 characters each.
  - Max 256 per app for org-only apps, or 100 if you add personal accounts.
  - No wildcards if personal accounts are enabled. For org-only apps they're possible through the manifest but discouraged.
  - Query parameters are allowed only for org-only apps.
  - Localhost ignores the port, and IPv6 `[::1]` isn't supported.
  - `http://127.0.0.1` can only be added by editing the manifest.
- **Client secrets:** max 24 months, and Microsoft recommends under 12. The value is shown only once. Microsoft recommends a certificate or federated credential for production.
- **App ID URI:** must be globally unique for multi-tenant apps, or the switch fails. You can't move an app registration to another tenant.
- **Admin consent without `prompt=consent`:** if an admin signs in without it, consent applies only to that admin's own account.
- Requiring user assignment forces admin consent.

## Blockers & what to do
| Blocker | Action |
|---|---|
| AADSTS90094 "needs admin permission" | Get publisher verified. Ask the customer to turn on the admin consent workflow, or send their admin the adminconsent URL. |
| Scope blocked by the Microsoft-managed policy | Plan for admin consent. Use a narrower scope, such as `Sites.Selected` or `User.Read`, where you can. |
| Partner Center verification rejected or stuck | Upload matching business and domain documents, then submit an appeal. |
| Domain mismatch | Add a DNS-verified custom domain to the tenant. |

## Escalation path
1. Microsoft Q&A, tag "Microsoft Entra ID"
2. GitHub issues on the MSAL libraries
3. An Azure support request (needs a support plan) or Microsoft Support for business
4. A Partner Center support ticket for CPP verification
5. Feedback at feedback.azure.com

## Unknowns
- No SLA for verification appeals, Microsoft 365 Certification, or how fast customer admins approve.
- What "newly registered" means for step-up consent beyond "registered after 8 Nov 2020".
- Whether verified apps are exempt from any part of the Microsoft-managed policy. The docs list scope exclusions only.
- The future scope list. Microsoft updates it automatically, so check `policies/permissionGrantPolicies/microsoft-user-default-recommended` live.

## Sources
| URL | Supports | Confidence |
|---|---|---|
| learn.microsoft.com/entra/identity-platform/quickstart-register-app | Registration steps, account types, roles | CONFIRMED |
| learn.microsoft.com/entra/identity-platform/publisher-verification-overview | Requirements, "verified in minutes", free, Nov 2020 rule | CONFIRMED |
| learn.microsoft.com/entra/identity-platform/mark-app-as-publisher-verified | Steps, "a few minutes" | CONFIRMED |
| learn.microsoft.com/partner-center/enroll/understand-the-verification-process | CPP checks, "3–5 business days" | CONFIRMED |
| learn.microsoft.com/entra/identity/enterprise-apps/configure-risk-based-step-up-consent | Step-up on by default, AADSTS90094 | CONFIRMED |
| learn.microsoft.com/entra/identity/enterprise-apps/manage-app-consent-policies | Microsoft-managed default and its scope exclusions | CONFIRMED |
| learn.microsoft.com/entra/identity/enterprise-apps/configure-user-consent | Consent settings, `microsoft-user-default-low` | CONFIRMED |
| learn.microsoft.com/entra/identity-platform/permissions-consent-overview | Delegated vs application permissions | CONFIRMED |
| learn.microsoft.com/entra/identity-platform/v2-admin-consent | Admin consent endpoint | CONFIRMED |
| learn.microsoft.com/entra/identity-platform/howto-convert-app-to-be-multi-tenant | Multi-tenant code and consent gotchas | CONFIRMED |
| learn.microsoft.com/entra/identity-platform/reply-url | Redirect URI rules | CONFIRMED |
| learn.microsoft.com/entra/identity-platform/how-to-add-credentials | 24-month secret limit | CONFIRMED |
| learn.microsoft.com/microsoft-365-app-certification/overview | Attestation (about 1 hr), Certification (yearly audit, Claranet) | CONFIRMED |
| learn.microsoft.com/entra/identity-platform/developer-support-help-options | Support channels | CONFIRMED |
| learn.microsoft.com/answers/questions/5526830 | Aug 2025 rollout broke ISV onboarding | SECONDARY |
| blog-en.topedia.com (2025-11, 2026-05 posts) | Expansion timeline, rollout by July 2026 | SECONDARY |
