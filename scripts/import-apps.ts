import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@caniclone/database";

const SOURCE_DIR = path.resolve(
  process.cwd(),
  "../canivibecodeit-main/data/apps"
);

type AppJson = {
  slug: string;
  name: string;
  domain?: string;
  category: string;
  subcategory?: string;
  tagline?: string;
  priceMonthly?: number | null;

  pricing?: {
    tiers?: Array<{
      name: string;
      monthly?: number | null;
      annualPerMonth?: number | null;
      per?: string;
      limits?: string;
      notes?: string | null;
    }>;
  };

  verdict: "yes" | "kinda" | "no";
  verdictConfidence?: string;
  verdictSummary?: string;
  coreLoopDIY?: string;
  diyTimeEstimate?: string;

  requirements?: unknown[];
  whatYouLose?: unknown[];
  moatTags?: unknown[];
  moatNotes?: string;
  whyPeopleStillPay?: string;

  priorArt?: unknown[];
  alternatives?: Array<{
    name: string;
    url: string;
    type?: string;
    repo?: string | null;
    platforms?: unknown[];
    desc?: string;
    stars?: number | null;
    lastCommit?: string | null;
    selfHost?: string | null;
    checkedOn?: string;
    facts?: unknown;
  }>;

  rejectedAlternatives?: unknown[];
  relatedSlugs?: unknown[];

  pagePriority?: number;
  verifiedOneShot?: boolean;
  notes?: string;
  prompt?: string;
  promptCurated?: boolean;
};

async function importApps() {
  console.log(`Reading apps from: ${SOURCE_DIR}`);

  const files = (await fs.readdir(SOURCE_DIR))
    .filter((file) => file.endsWith(".json"))
    .sort();

  console.log(`Found ${files.length} app files.\n`);

  let imported = 0;

  for (const file of files) {
    const filePath = path.join(SOURCE_DIR, file);
    const content = await fs.readFile(filePath, "utf-8");
    const data: AppJson = JSON.parse(content);

    if (!data.slug || !data.name || !data.category || !data.verdict) {
      throw new Error(`Invalid app data: ${file}`);
    }

    await prisma.app.upsert({
      where: {
        slug: data.slug,
      },

      create: {
        slug: data.slug,
        name: data.name,
        domain: data.domain ?? null,
        category: data.category,
        subcategory: data.subcategory ?? null,
        tagline: data.tagline ?? null,
        priceMonthly: data.priceMonthly ?? null,

        verdict: data.verdict,
        verdictConfidence: data.verdictConfidence ?? null,
        verdictSummary: data.verdictSummary ?? null,
        coreLoopDIY: data.coreLoopDIY ?? null,
        diyTimeEstimate: data.diyTimeEstimate ?? null,

        requirements: data.requirements ?? null,
        whatYouLose: data.whatYouLose ?? null,
        moatTags: data.moatTags ?? null,
        moatNotes: data.moatNotes ?? null,
        whyPeopleStillPay: data.whyPeopleStillPay ?? null,

        priorArt: data.priorArt ?? null,
        rejectedAlternatives: data.rejectedAlternatives ?? null,
        relatedSlugs: data.relatedSlugs ?? null,

        prompt: data.prompt ?? null,
        promptCurated: data.promptCurated ?? false,

        pagePriority: data.pagePriority ?? 3,
        verifiedOneShot: data.verifiedOneShot ?? false,
        notes: data.notes ?? null,

        pricingPlans: {
          create: (data.pricing?.tiers ?? []).map((tier) => ({
            name: tier.name,
            monthly: tier.monthly ?? null,
            annualPerMonth: tier.annualPerMonth ?? null,
            per: tier.per ?? null,
            limits: tier.limits ?? null,
            notes: tier.notes ?? null,
          })),
        },

        alternatives: {
          create: (data.alternatives ?? []).map((alternative) => ({
            name: alternative.name,
            url: alternative.url,
            type: alternative.type ?? null,
            repo: alternative.repo ?? null,
            platforms: alternative.platforms ?? null,
            description: alternative.desc ?? null,
            stars: alternative.stars ?? null,
            lastCommit: alternative.lastCommit ?? null,
            selfHost: alternative.selfHost ?? null,
            checkedOn: alternative.checkedOn ?? null,
            facts: alternative.facts ?? null,
          })),
        },
      },

      update: {
        name: data.name,
        domain: data.domain ?? null,
        category: data.category,
        subcategory: data.subcategory ?? null,
        tagline: data.tagline ?? null,
        priceMonthly: data.priceMonthly ?? null,

        verdict: data.verdict,
        verdictConfidence: data.verdictConfidence ?? null,
        verdictSummary: data.verdictSummary ?? null,
        coreLoopDIY: data.coreLoopDIY ?? null,
        diyTimeEstimate: data.diyTimeEstimate ?? null,

        requirements: data.requirements ?? null,
        whatYouLose: data.whatYouLose ?? null,
        moatTags: data.moatTags ?? null,
        moatNotes: data.moatNotes ?? null,
        whyPeopleStillPay: data.whyPeopleStillPay ?? null,

        priorArt: data.priorArt ?? null,
        rejectedAlternatives: data.rejectedAlternatives ?? null,
        relatedSlugs: data.relatedSlugs ?? null,

        prompt: data.prompt ?? null,
        promptCurated: data.promptCurated ?? false,

        pagePriority: data.pagePriority ?? 3,
        verifiedOneShot: data.verifiedOneShot ?? false,
        notes: data.notes ?? null,

        pricingPlans: {
          deleteMany: {},
          create: (data.pricing?.tiers ?? []).map((tier) => ({
            name: tier.name,
            monthly: tier.monthly ?? null,
            annualPerMonth: tier.annualPerMonth ?? null,
            per: tier.per ?? null,
            limits: tier.limits ?? null,
            notes: tier.notes ?? null,
          })),
        },

        alternatives: {
          deleteMany: {},
          create: (data.alternatives ?? []).map((alternative) => ({
            name: alternative.name,
            url: alternative.url,
            type: alternative.type ?? null,
            repo: alternative.repo ?? null,
            platforms: alternative.platforms ?? null,
            description: alternative.desc ?? null,
            stars: alternative.stars ?? null,
            lastCommit: alternative.lastCommit ?? null,
            selfHost: alternative.selfHost ?? null,
            checkedOn: alternative.checkedOn ?? null,
            facts: alternative.facts ?? null,
          })),
        },
      },
    });

    imported++;

    console.log(`[${imported}/${files.length}] ${data.name}`);
  }

  console.log(`\nSuccessfully imported ${imported} apps.`);
}

importApps()
  .catch((error) => {
    console.error("\nImport failed:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });