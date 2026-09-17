import type { Verdict } from './types';

export function formatVotes(votes: number): string {
  if (votes >= 1000) {
    return `${(votes / 1000).toFixed(votes % 1000 === 0 ? 0 : 1)}k`;
  }
  return String(votes);
}

export function upperVerdict(v: string): Verdict {
  if (v === 'yes') return 'YES';
  if (v === 'kinda') return 'KINDA';
  return 'NO';
}

export function confidenceToPercent(confidence: string | null): number {
  if (confidence === 'high') return 85;
  if (confidence === 'medium') return 60;
  return 50;
}

export function formatPricing(priceMonthly: string | null): string {
  if (priceMonthly === null) return 'varies';
  const num = Number(priceMonthly);
  if (num === 0) return 'Free';
  return `$${priceMonthly}/mo`;
}

export function toOfficialUrl(domain: string | null): string | undefined {
  if (!domain) return undefined;
  return domain.startsWith('http') ? domain : `https://${domain}`;
}

export function humanizeSlug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
