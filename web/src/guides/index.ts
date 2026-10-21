import type { Guide } from "@/lib/schema";
import github from "./github.json";
import slack from "./slack.json";
import google from "./google.json";
import quickbooks from "./quickbooks.json";
import microsoft from "./microsoft.json";
import salesforce from "./salesforce.json";
import hubspot from "./hubspot.json";
import notion from "./notion.json";
import zoom from "./zoom.json";
import linkedin from "./linkedin.json";

export const library = [github, slack, google, quickbooks, microsoft, salesforce, hubspot, notion, zoom, linkedin] as Guide[];

export const getGuide = (slug: string) => library.find((g) => g.slug === slug);
