export const ALLOWED_EVENTS = new Set([
  'page_view',
  'hero_buy_click',
  'hero_action_click',
  'checkout_open',
  'checkout_submit',
  'whatsapp_click',
]);

const DEVICE_TYPES = new Set(['mobile', 'desktop', 'tablet', 'unknown']);

type RawEvent = {
  event?: unknown;
  visitor_id?: unknown;
  session_id?: unknown;
  page_path?: unknown;
  referrer?: unknown;
  device_type?: unknown;
};

export type NormalizedEvent = {
  eventName: string;
  visitorId?: string;
  sessionId?: string;
  pagePath: string;
  referrer?: string;
  deviceType: string;
};

function shortString(value: unknown, max: number): string | undefined {
  return typeof value === 'string' && value.length > 0 && value.length <= max ? value : undefined;
}

export function normalizeEvent(input: RawEvent): NormalizedEvent | null {
  const eventName = shortString(input.event, 40);
  const pagePath = input.page_path === undefined ? '/' : shortString(input.page_path, 240);
  const deviceType = shortString(input.device_type, 20) ?? 'unknown';
  if (!eventName || !ALLOWED_EVENTS.has(eventName) || !pagePath || !DEVICE_TYPES.has(deviceType)) return null;
  const normalized: NormalizedEvent = {
    eventName,
    pagePath,
    deviceType,
  };
  const visitorId = shortString(input.visitor_id, 100);
  const sessionId = shortString(input.session_id, 100);
  const referrer = shortString(input.referrer, 500);
  if (visitorId) normalized.visitorId = visitorId;
  if (sessionId) normalized.sessionId = sessionId;
  if (referrer) normalized.referrer = referrer;
  return normalized;
}

export function calculateConversion(pageViews: number, approvedPayments: number): number | null {
  if (!pageViews) return null;
  return Number(((approvedPayments / pageViews) * 100).toFixed(2));
}

export function periodStart(period: string, now = new Date()): string {
  const start = new Date(now);
  if (period === 'all') return '1970-01-01T00:00:00.000Z';
  start.setUTCDate(start.getUTCDate() - (period === '30d' ? 30 : 7));
  return start.toISOString();
}
