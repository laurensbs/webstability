// Constants en types voor de leads-CRM. Apart van app/actions/leads.ts
// zodat client-components ze kunnen importeren zonder de server-actions
// mee te slepen.

export const LEAD_SOURCES = [
  "cal_booking",
  "demo_self_serve",
  "manual",
  "blog_subscribe",
  "referral",
] as const;
export const LEAD_STATUSES = ["cold", "warmed", "booked", "met", "customer", "lost"] as const;

export type LeadSource = (typeof LEAD_SOURCES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_SOURCE_LABEL_NL: Record<LeadSource, string> = {
  cal_booking: "Cal-booking",
  demo_self_serve: "Demo-bezoek",
  manual: "Handmatig",
  blog_subscribe: "Blog-aanmelding",
  referral: "Referral",
};
export const LEAD_STATUS_LABEL_NL: Record<LeadStatus, string> = {
  cold: "Cold",
  warmed: "Warmed",
  booked: "Booked",
  met: "Gesproken",
  customer: "Klant",
  lost: "Verloren",
};
