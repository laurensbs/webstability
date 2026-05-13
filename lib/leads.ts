// Constants en types voor de leads-CRM. Apart van app/actions/leads.ts
// zodat client-components ze kunnen importeren zonder de server-actions
// mee te slepen.

export const LEAD_SOURCES = [
  "cal_booking",
  "demo_self_serve",
  "manual",
  "blog_subscribe",
  "referral",
  "configurator",
] as const;
export const LEAD_STATUSES = [
  "cold",
  "warmed",
  "booked",
  "met",
  "quote_sent",
  "customer",
  "lost",
] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCE_LABEL_NL: Record<LeadSource, string> = {
  cal_booking: "Cal-booking",
  demo_self_serve: "Demo-bezoek",
  manual: "Handmatig",
  blog_subscribe: "Blog-aanmelding",
  referral: "Referral",
  configurator: "Configurator",
};
export const LEAD_STATUS_LABEL_NL: Record<LeadStatus, string> = {
  cold: "Cold",
  warmed: "Warmed",
  booked: "Booked",
  met: "Gesproken",
  quote_sent: "Offerte verstuurd",
  customer: "Klant",
  lost: "Verloren",
};

export const OUTREACH_TEMPLATES = [
  "lead_outreach_intro",
  "lead_followup_after_call",
  "lead_referral_request",
  "lead_dormant_revive",
] as const;
export type OutreachTemplate = (typeof OUTREACH_TEMPLATES)[number];
export const OUTREACH_LABEL_NL: Record<OutreachTemplate, string> = {
  lead_outreach_intro: "Koude intro",
  lead_followup_after_call: "Opvolg na call",
  lead_referral_request: "Referral-vraag",
  lead_dormant_revive: "Slapend reactiveren",
};
