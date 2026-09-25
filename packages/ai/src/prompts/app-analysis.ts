export interface AnalysisPricingPlan {
  name: string;
  monthly: number | null;
  annualPerMonth: number | null;
  per: string | null;
  limits: string | null;
  notes: string | null;
}

export interface AnalysisAlternative {
  name: string;
  type: string | null;
  selfHost: string | null;
  description: string | null;
}

export interface AnalysisInput {
  name: string;
  category: string;
  subcategory: string | null;
  tagline: string | null;
  priceMonthly: number | null;
  pricingPlans: AnalysisPricingPlan[];
  moatTags: string[];
  moatNotes: string | null;
  whyPeopleStillPay: string | null;
  requirements: string[];
  priorArt: string[];
  whatYouLose: string[];
  coreLoop: string | null;
  diyTimeEstimate: string | null;
  verdict: string;
  verdictSummary: string | null;
  alternatives: AnalysisAlternative[];
}

type Loose = Record<string, unknown>;

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const obj = item as Loose;
        const label = obj.name ?? obj.label ?? obj.title ?? obj.text;
        if (typeof label === "string") return label;
        return JSON.stringify(item);
      }
      return String(item);
    })
    .filter((s) => s.length > 0);
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Reduce a verified App record (plus its pricing plans and alternatives) to the
 * exact factual payload the model is allowed to reason over. Nothing here is
 * invented — every field comes straight from the database.
 */
export function prepareAnalysisInput(app: Loose & { pricingPlans?: unknown[]; alternatives?: unknown[] }): AnalysisInput {
  const pricingPlans = (app.pricingPlans ?? []).map((plan) => {
    const p = plan as Loose;
    return {
      name: String(p.name ?? ""),
      monthly: toNumber(p.monthly),
      annualPerMonth: toNumber(p.annualPerMonth),
      per: typeof p.per === "string" ? p.per : null,
      limits: typeof p.limits === "string" ? p.limits : null,
      notes: typeof p.notes === "string" ? p.notes : null,
    };
  });

  const alternatives = (app.alternatives ?? []).map((alt) => {
    const a = alt as Loose;
    return {
      name: String(a.name ?? ""),
      type: typeof a.type === "string" ? a.type : null,
      selfHost: typeof a.selfHost === "string" ? a.selfHost : null,
      description: typeof a.description === "string" ? a.description : null,
    };
  });

  return {
    name: String(app.name ?? ""),
    category: String(app.category ?? ""),
    subcategory: typeof app.subcategory === "string" ? app.subcategory : null,
    tagline: typeof app.tagline === "string" ? app.tagline : null,
    priceMonthly: toNumber(app.priceMonthly),
    pricingPlans,
    moatTags: toStringArray(app.moatTags),
    moatNotes: typeof app.moatNotes === "string" ? app.moatNotes : null,
    whyPeopleStillPay: typeof app.whyPeopleStillPay === "string" ? app.whyPeopleStillPay : null,
    requirements: toStringArray(app.requirements),
    priorArt: toStringArray(app.priorArt),
    whatYouLose: toStringArray(app.whatYouLose),
    coreLoop: typeof app.coreLoopDIY === "string" ? app.coreLoopDIY : null,
    diyTimeEstimate: typeof app.diyTimeEstimate === "string" ? app.diyTimeEstimate : null,
    verdict: String(app.verdict ?? ""),
    verdictSummary: typeof app.verdictSummary === "string" ? app.verdictSummary : null,
    alternatives,
  };
}

export const APP_ANALYSIS_SYSTEM_PROMPT = `You are CanIClone, an expert software architect and product analyst.

You are analyzing an existing software product to decide whether an independent developer or small team could realistically clone it.

Rules:
- Use ONLY the supplied product information as factual evidence.
- Do NOT invent product features.
- Do NOT invent pricing.
- Do NOT rely on prior knowledge about the company or product beyond what is supplied.
- If the supplied information is insufficient to judge something, say so explicitly in the relevant field instead of guessing.
- Be concrete and technical. Estimate effort for one focused engineer.
- estimatedMonthlyCost is the approximate running infrastructure cost (hosting, APIs, third-party services) to operate a clone, NOT the product's subscription price. Use a realistic min/max range in the given currency.
- estimatedBuildTime is a human-readable range (e.g. "4-8 weeks").
- verdict: YES = comfortably cloneable, KINDA = cloneable with significant caveats, NO = not realistically cloneable.
- Keep every string field concise. Arrays should contain short, specific items, not sentences of filler.

Respond ONLY with the structured object.`;

export function buildAppAnalysisPrompt(input: AnalysisInput): { system: string; prompt: string } {
  const evidence = JSON.stringify(input, null, 2);
  const prompt = `Analyze the following product and produce the CanIClone verdict.

VERIFIED PRODUCT DATA (source of truth — do not add anything not present here):
${evidence}

Produce the structured analysis now.`;
  return { system: APP_ANALYSIS_SYSTEM_PROMPT, prompt };
}
