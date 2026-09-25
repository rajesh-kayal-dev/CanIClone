import {
  AppAnalysisSchema,
  buildAppAnalysisPrompt,
  getCachedAnalysis,
  getOrGenerateAnalysis,
  prepareAnalysisInput,
} from "@caniclone/ai";
import { prisma } from "@caniclone/database";

const SLUGS = ["claude", "cursor", "notion", "calendly", "canva", "chatgpt"];
const DRY = process.argv.includes("--dry");

async function main() {
  for (const slug of SLUGS) {
    const app = await prisma.app.findUnique({
      where: { slug },
      include: { pricingPlans: true, alternatives: true },
    });

    if (!app) {
      console.log(`\n=== ${slug} === NOT IN DB — skipping`);
      continue;
    }

    const input = prepareAnalysisInput(app as unknown as Record<string, unknown>);
    const { prompt } = buildAppAnalysisPrompt(input);

    console.log(`\n=== ${slug} (${app.name}) ===`);
    console.log(
      `evidence: prompt=${prompt.length}chars plans=${input.pricingPlans.length} alts=${input.alternatives.length} reqs=${input.requirements.length} moat=${input.moatTags.length}`,
    );

    if (DRY) continue;

    const t0 = Date.now();
    const stored = await getOrGenerateAnalysis(slug);
    const ms = Date.now() - t0;
    const a = stored.analysis;

    const reparsed = AppAnalysisSchema.safeParse(a);
    console.log(
      `verdict=${a.verdict} difficulty=${a.difficulty} build="${a.estimatedBuildTime}" cost=${a.estimatedMonthlyCost.min}-${a.estimatedMonthlyCost.max} ${a.estimatedMonthlyCost.currency} model=${stored.model} ${ms}ms zod=${reparsed.success}`,
    );
    console.log(
      `counts: core=${a.coreFeatures.length} cloneable=${a.cloneableFeatures.length} hard=${a.difficultFeatures.length} techReq=${a.technicalRequirements.length} deps=${a.thirdPartyDependencies.length} lose=${a.whatYouLose.length} challenges=${a.biggestChallenges.length} stack=${a.recommendedStack.length}`,
    );
    console.log(`summary: ${a.summary}`);

    const cached = await getCachedAnalysis(slug);
    console.log(
      `cache reuse: ${cached && cached.id === stored.id ? "OK (same row returned)" : "FAIL"}`,
    );
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
