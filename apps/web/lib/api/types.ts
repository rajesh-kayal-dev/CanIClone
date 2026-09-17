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

// Frontend record consumed by components
export interface AppRecord {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  pricing: string;
  verdict: Verdict;
  confidence: number;
  voteCount: number;
  pagePriority?: number;
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
}
