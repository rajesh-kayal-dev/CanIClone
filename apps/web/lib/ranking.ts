import type { AppRecord } from './api/types';

/**
 * Calculates a transparent trending score for an application based on real database signals:
 * 1. Community Interest: voteCount (log-scaled to prevent extreme values from monopolizing ranking)
 * 2. Editorial Prominence: pagePriority signal (1 = featured/top, 2 = high, 3 = normal)
 * 3. Freshness Boost: decaying bonus based on createdAt timestamp if available
 * 
 * Formula:
 * trendingScore = log10(voteCount + 1) * 40 + priorityBoost + freshnessBoost
 */
export function getTrendingScore(app: AppRecord): number {
  const votes = app.voteCount || 0;
  const voteScore = Math.log10(votes + 1) * 40;

  // Editorial priority signal: priority 1 gets +100 bonus, priority 2 gets +50, priority 3 gets 0
  const priority = app.pagePriority ?? 3;
  const priorityBoost = Math.max(0, 4 - priority) * 50;

  // Freshness signal: decaying bonus over time
  let freshnessBoost = 0;
  if (app.createdAt) {
    const createdTime = new Date(app.createdAt).getTime();
    if (!isNaN(createdTime)) {
      const daysOld = (Date.now() - createdTime) / (1000 * 60 * 60 * 24);
      freshnessBoost = Math.max(0, 100 - daysOld * 2);
    }
  }

  return voteScore + priorityBoost + freshnessBoost;
}

export type DiscoverySortMode = 'trending' | 'popular' | 'new' | 'votes' | 'name' | 'price';

/**
 * Deterministic sort comparator for DISCOVERY modes:
 * - 'trending': Highest trending score (votes + priority + freshness)
 * - 'popular': Most votes -> pagePriority -> name
 * - 'new': Newest createdAt -> voteCount -> name
 * - 'votes': Most votes -> name
 * - 'name': Alphabetical A-Z
 * - 'price': Lowest monthly price -> votes -> name
 */
export function sortAppsByMode(
  apps: AppRecord[],
  mode: DiscoverySortMode,
  isSearchResults = false
): AppRecord[] {
  const total = apps.length;
  const items = apps.map((app, originalIndex) => ({
    app,
    originalIndex
  }));

  items.sort((a, b) => {
    // If sorting search results, hybrid search relevance (originalIndex) is the primary baseline
    if (isSearchResults && mode !== 'name' && mode !== 'price') {
      const aRel = (total - a.originalIndex) * 100;
      const bRel = (total - b.originalIndex) * 100;

      let aDisc = 0;
      let bDisc = 0;
      if (mode === 'trending') {
        aDisc = getTrendingScore(a.app);
        bDisc = getTrendingScore(b.app);
      } else if (mode === 'popular' || mode === 'votes') {
        aDisc = (a.app.voteCount || 0) * 10;
        bDisc = (b.app.voteCount || 0) * 10;
      } else if (mode === 'new') {
        aDisc = a.app.createdAt ? new Date(a.app.createdAt).getTime() / 10000000 : 0;
        bDisc = b.app.createdAt ? new Date(b.app.createdAt).getTime() / 10000000 : 0;
      }

      // Hybrid relevance is 75% weight, discovery signal is 25% weight
      const scoreA = aRel * 0.75 + aDisc * 0.25;
      const scoreB = bRel * 0.75 + bDisc * 0.25;

      if (scoreA !== scoreB) return scoreB - scoreA;
    }

    if (mode === 'trending') {
      const scoreA = getTrendingScore(a.app);
      const scoreB = getTrendingScore(b.app);
      if (scoreA !== scoreB) return scoreB - scoreA;
    } else if (mode === 'popular') {
      const votesDiff = (b.app.voteCount || 0) - (a.app.voteCount || 0);
      if (votesDiff !== 0) return votesDiff;
      const prioDiff = (a.app.pagePriority ?? 3) - (b.app.pagePriority ?? 3);
      if (prioDiff !== 0) return prioDiff;
    } else if (mode === 'new') {
      const timeA = a.app.createdAt ? new Date(a.app.createdAt).getTime() : 0;
      const timeB = b.app.createdAt ? new Date(b.app.createdAt).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
    } else if (mode === 'votes') {
      const votesDiff = (b.app.voteCount || 0) - (a.app.voteCount || 0);
      if (votesDiff !== 0) return votesDiff;
    } else if (mode === 'name') {
      const nameDiff = a.app.name.localeCompare(b.app.name);
      if (nameDiff !== 0) return nameDiff;
    } else if (mode === 'price') {
      const priceA = a.app.pricing === 'Free' ? 0 : parseFloat(a.app.pricing.replace(/[^0-9.]/g, '')) || 0;
      const priceB = b.app.pricing === 'Free' ? 0 : parseFloat(b.app.pricing.replace(/[^0-9.]/g, '')) || 0;
      if (priceA !== priceB) return priceA - priceB;
    }

    // Stable tie-breakers: votes -> name
    const tieVotes = (b.app.voteCount || 0) - (a.app.voteCount || 0);
    if (tieVotes !== 0) return tieVotes;

    return a.app.name.localeCompare(b.app.name);
  });

  return items.map((item) => item.app);
}
