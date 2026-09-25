import { z } from "zod";

export const VerdictSchema = z.enum(["YES", "KINDA", "NO"]);
export const DifficultySchema = z.enum(["EASY", "MEDIUM", "HARD", "VERY_HARD"]);

export const MonthlyCostSchema = z.object({
  min: z.number().int().nonnegative(),
  max: z.number().int().nonnegative(),
  currency: z.string().length(3),
});

export const AppAnalysisSchema = z.object({
  verdict: VerdictSchema,
  difficulty: DifficultySchema,
  estimatedBuildTime: z.string().min(1),
  estimatedMonthlyCost: MonthlyCostSchema,
  summary: z.string().min(1),
  coreFeatures: z.array(z.string()),
  cloneableFeatures: z.array(z.string()),
  difficultFeatures: z.array(z.string()),
  technicalRequirements: z.array(z.string()),
  thirdPartyDependencies: z.array(z.string()),
  whatYouLose: z.array(z.string()),
  biggestChallenges: z.array(z.string()),
  recommendedStack: z.array(z.string()),
  reasoning: z.string().min(1),
});

export type AppAnalysis = z.infer<typeof AppAnalysisSchema>;
export type Verdict = z.infer<typeof VerdictSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
