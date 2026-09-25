export type Verdict = 'YES' | 'KINDA' | 'NO';

// Wire shapes from the Express API
export interface ApiListApp {
  id: string;
  slug: string;
  name: string;
  domain: string | null;
  category: string;
  subcategory: string | null;
  tagline: string | null;
  priceMonthly: string | null;
  verdict: 'yes' | 'kinda' | 'no';
  verdictConfidence: 'high' | 'medium' | 'low' | null;
  verdictSummary: string | null;
  diyTimeEstimate: string | null;
  pagePriority: number;
  voteCount: number;
  alternativeCount?: number;
  popularityScore?: number;
  marketDirection?: 'RISING' | 'STABLE' | 'FALLING' | null;
  marketGrowth?: number | null;
  marketInterest?: number | null;
  marketFetchedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiPricingPlan {
  id: string;
  appId: string;
  name: string;
  monthly: string | null;
  annualPerMonth: string | null;
  per: string | null;
  limits: string | null;
  notes: string | null;
}

export interface ApiAlternative {
  id: string;
  appId: string;
  name: string;
  url: string;
  type: string | null;
  repo: string | null;
  platforms: unknown;
  description: string | null;
  stars: number | null;
  lastCommit: string | null;
  selfHost: string | null;
  checkedOn: string | null;
  facts: unknown;
}

export interface ApiAppDetail extends ApiListApp {
  coreLoopDIY: string | null;
  requirements: unknown;
  whatYouLose: unknown;
  moatTags: unknown;
  moatNotes: string | null;
  whyPeopleStillPay: string | null;
  priorArt: unknown;
  rejectedAlternatives: unknown;
  relatedSlugs: unknown;
  prompt: string | null;
  promptCurated: boolean;
  verifiedOneShot: boolean;
  notes: string | null;
  pricingPlans: ApiPricingPlan[];
  alternatives: ApiAlternative[];
  createdAt: string;
  updatedAt: string;
}

export interface PricingPlanRecord {
  name: string;
  monthly: string | null;
  annualPerMonth: string | null;
  per: string | null;
  limits: string | null;
  notes: string | null;
}

export interface OpenSourceAlternative {
  name: string;
  url: string;
  repo: string | null;
  description: string | null;
  stars: number | null;
  lastCommit: string | null;
  selfHost: string | null;
  type: string | null;
}

export interface PriorArtItem {
  name: string;
  url: string;
  desc: string;
  status: string | null;
}

// Frontend record consumed by components
export interface AppRecord {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  pricing: string;
  priceMonthly: string | null;
  verdict: Verdict;
  confidence: number;
  voteCount: number;
  pagePriority?: number;
  alternativeCount?: number;
  popularityScore?: number;
  marketDirection?: 'RISING' | 'STABLE' | 'FALLING' | null;
  marketGrowth?: number | null;
  marketInterest?: number | null;
  marketFetchedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  description: string;
  officialUrl?: string;
  repoUrl?: string;
  stack: string[];
  requirements: string[];
  whatYouLose: string[];
  moat: string[];
  diyTimeEstimate: string;
  prompt: string;
  alternatives: string[];
  tags: string[];
  whyPeopleStillPay: string;
  moatNotes: string;
  coreLoopDIY: string;
  pricingPlans: PricingPlanRecord[];
  openSource: OpenSourceAlternative[];
  priorArt: PriorArtItem[];
  verifiedOneShot: boolean;
}

export interface ApiCategoryStat {
  slug: string;
  appCount: number;
  sampleApps: Array<{
    slug: string;
    name: string;
    domain: string | null;
  }>;
}

export interface ApiHybridSearchResult extends ApiListApp {
  keywordScore: number;
  semanticScore: number;
  finalScore: number;
  matchType: string;
}

export interface ApiMarketTrend {
  id: string;
  appId: string;
  source: string;
  query: string;
  trendDirection: 'RISING' | 'STABLE' | 'FALLING' | null;
  growthPercent: number | null;
  currentInterest: number | null;
  averageInterest: number | null;
  timelineData: unknown | null;
  regionalData: unknown | null;
  relatedQueries: unknown | null;
  fetchedAt: string;
  app?: {
    name: string;
    slug: string;
    category?: string;
    domain?: string | null;
  };
}

export interface ApiTrendsTopChart {
  chart: string;
  data?: unknown;
  fetchedAt?: string | null;
  error?: string;
}

export interface ApiTrendsAppData {
  identifier: string;
  growth: unknown;
  timeSeries: unknown;
  fetchedAt?: string | null;
}
