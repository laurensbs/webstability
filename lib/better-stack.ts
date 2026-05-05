// Better Stack Uptime API client.
// Docs: https://betterstack.com/docs/uptime/api/
const BASE = "https://uptime.betterstack.com/api/v2";

export type MonitorStatus = "up" | "down" | "validating" | "paused" | "pending" | "maintenance";

export type Monitor = {
  id: string;
  url: string;
  name: string;
  status: MonitorStatus;
  lastCheckedAt: string | null;
};

type MonitorRaw = {
  id: string;
  attributes: {
    url: string;
    pronounceable_name: string;
    status: MonitorStatus;
    last_checked_at: string | null;
    paused: boolean;
  };
};

async function api<T>(path: string): Promise<T> {
  const key = process.env.BETTER_STACK_API_KEY;
  if (!key) throw new Error("BETTER_STACK_API_KEY missing");
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${key}` },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Better Stack API ${res.status}`);
  return res.json() as Promise<T>;
}

export async function listMonitors(): Promise<Monitor[]> {
  const json = await api<{ data: MonitorRaw[] }>("/monitors");
  return json.data.map((m) => ({
    id: m.id,
    url: m.attributes.url,
    name: m.attributes.pronounceable_name || m.attributes.url,
    status: m.attributes.paused ? "paused" : m.attributes.status,
    lastCheckedAt: m.attributes.last_checked_at,
  }));
}

export function aggregateStatus(monitors: Monitor[]): "operational" | "degraded" | "down" {
  if (monitors.length === 0) return "operational";
  const downs = monitors.filter((m) => m.status === "down").length;
  if (downs === 0) return "operational";
  if (downs === monitors.length) return "down";
  return "degraded";
}
