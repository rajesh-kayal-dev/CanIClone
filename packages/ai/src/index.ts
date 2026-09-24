export {
  getAnalysisModel,
  getAnalysisModelId,
  DEFAULT_MISTRAL_MODEL,
} from "./models.js";

export {
  AppAnalysisSchema,
  MonthlyCostSchema,
  VerdictSchema,
  DifficultySchema,
} from "./schemas/app-analysis.js";
export type { AppAnalysis, Verdict, Difficulty } from "./schemas/app-analysis.js";

export {
  buildAppAnalysisPrompt,
  prepareAnalysisInput,
  APP_ANALYSIS_SYSTEM_PROMPT,
} from "./prompts/app-analysis.js";
export type {
  AnalysisInput,
  AnalysisPricingPlan,
  AnalysisAlternative,
} from "./prompts/app-analysis.js";

export {
  getCachedAnalysis,
  generateAnalysis,
  getOrGenerateAnalysis,
  AppNotFoundError,
} from "./services/analyze-app.js";
export type { StoredAnalysis } from "./services/analyze-app.js";

export {
  IDEA_CHAT_SYSTEM_PROMPT,
  buildIdeaChatMessages,
  buildResearchSynthesisPrompt,
  buildResearchQueryPrompt,
  buildPromptGenerationInput,
  buildMvpGenerationInput,
  renderIdeaContext,
} from "./prompts/idea.js";
export type { IdeaContext, ChatTurn } from "./prompts/idea.js";

export {
  streamIdeaChat,
  generateIdeaPrompt,
  generateIdeaMvp,
  generateResearchQuery,
  synthesizeResearch,
} from "./services/idea.js";
export type { StreamChatOptions, GenerateOptions } from "./services/idea.js";
