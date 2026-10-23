// Toolkits for which Composio supplies the OAuth app, copied from
// https://docs.composio.dev/toolkits/managed-auth ("Composio-managed OAuth
// available", 124 toolkits) on 2026-10-22. Composio changes this list, so the
// guide says when it was copied. The live check is the `composio_managed_auth_schemes`
// field of https://backend.composio.dev/api/v3.1/toolkits/<slug>.
export const COMPOSIO_LIST_DATE = "2026-10-22";

const MANAGED = `Aircall|Airtable|Apaleo|Asana|Attio|Basecamp|Bitbucket|Blackbaud|Boldsign|Box|Cal|Calendly|Canva|Capsule CRM|ClickUp|Confluence|Contentful|Crowdin|Dart|Daytona|Dialpad|Discord|Discord Bot|Dropbox|Dub|Dynamics 365|Eventbrite|Excel|Exist|Facebook|Fathom|Figma|Freeagent|FreshBooks|GitHub|GitLab|Gmail|Gong|Google Ads|Google Analytics|Google BigQuery|Google Calendar|Google Classroom|Google Docs|Google Drive|Google Maps|Google Meet|Google Photos|Google Search Console|Google Sheets|Google Slides|Google Super|Google Tasks|Gorgias|Greenhouse|Gumroad|Harvest|HubSpot|Hugging Face|Instagram|Intercom|Jira|Kit|Linear|LinkedIn|Linkhut|Mailchimp|Microsoft Teams|Miro|Monday|Moneybird|Mural|NotebookLM|Notion|Omnisend|OneDrive|Outlook|PagerDuty|Pinterest|Pinterest Ads|Prisma|Productboard|Pushbullet|QuickBooks|Reddit|Reddit Ads|Roam|Salesforce|Sentry|Servicem8|SharePoint|Shippo|Slack|Slackbot|Splitwise|Square|Stack Exchange|Stripe|Supabase|Ticketmaster|Ticktick|TikTok Ads|Timely|Todoist|Trello|Twitch|Typeform|WakaTime|Webex|WhatsApp|Wrike|Yandex|YNAB|YouTube|Zendesk|Zeplin|Zoho|Zoho Bigin|Zoho Books|Zoho Desk|Zoho Inventory|Zoho Invoice|Zoho Mail|Zoom`.split("|");

const norm = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
// Guide names that differ from Composio's wording for the same company.
const ALIAS: Record<string, string> = { intuit: "quickbooks", "intuit quickbooks online": "quickbooks" };
// Companies whose products are listed under other names.
const FAMILY: Record<string, string[]> = { microsoft: ["Outlook", "Microsoft Teams", "OneDrive", "SharePoint", "Excel", "Dynamics 365"] };

export type ManagedMatch = { managed: boolean; toolkits: string[]; exact: boolean };

// "Exact" means the app's own toolkit is listed. Otherwise a company match
// (Google, Microsoft, Zoho) means Composio manages related toolkits of the same
// company, which is a hint rather than an answer, and the badge says so.
export function composioManaged(name: string): ManagedMatch {
  const n = ALIAS[norm(name)] ?? norm(name);
  const exact = MANAGED.filter((m) => norm(m) === n);
  if (exact.length) return { managed: true, toolkits: exact, exact: true };
  const first = n.split(" ")[0];
  const words = new Set(name.toLowerCase().split(/[^a-z0-9]+/));
  const mentioned = (m: string) => Number(norm(m).split(" ").some((w) => w !== first && words.has(w)));
  const related = [...MANAGED.filter((m) => norm(m).split(" ")[0] === first), ...(FAMILY[first] ?? [])]
    .filter((m, i, all) => all.indexOf(m) === i)
    .sort((x, y) => mentioned(y) - mentioned(x));
  if (related.length) return { managed: true, toolkits: related.slice(0, 4), exact: false };
  return { managed: false, toolkits: [], exact: false };
}
