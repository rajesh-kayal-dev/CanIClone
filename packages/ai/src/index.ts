export {
  AIConfigurationError,
  generateAIText,
  getAnalysisModelId,
  isAIConfigured,
  streamAIText,
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
  IDEA_TITLE_SYSTEM_PROMPT,
  IDEA_INITIAL_ANALYSIS_SYSTEM_PROMPT,
  buildIdeaChatMessages,
  buildIdeaTitlePrompt,
  buildIdeaInitialAnalysisPrompt,
  buildResearchSynthesisPrompt,
  buildResearchQueryPrompt,
  buildPromptGenerationInput,
  buildMvpGenerationInput,
  renderIdeaContext,
} from "./prompts/idea.js";
export type { IdeaContext, IdeaResearchEvidence, ChatTurn } from "./prompts/idea.js";

export {
  APP_WORKSPACE_CHAT_SYSTEM_PROMPT,
  APP_RESEARCH_QUERY_SYSTEM_PROMPT,
  APP_RESEARCH_SYNTHESIS_SYSTEM_PROMPT,
  APP_PROMPT_REFINEMENT_SYSTEM_PROMPT,
  APP_MVP_SYSTEM_PROMPT,
  buildAppChatMessages,
  buildAppResearchQueryPrompt,
  buildAppResearchSynthesisPrompt,
  buildAppPromptRefinementPrompt,
  buildAppMvpPrompt,
} from "./prompts/app-workspace.js";
export type {
  AppWorkspaceAlternative,
  AppResearchHit,
  AppResearchEvidence,
  AppWorkspaceContext,
  AppChatTurn,
} from "./prompts/app-workspace.js";

export {
  RESEARCH_INTENT_SYSTEM_PROMPT,
  buildResearchIntentPrompt,
  messageLikelyNeedsResearch,
} from "./prompts/research-intent.js";

export {
  streamIdeaChat,
  generateIdeaTitle,
  streamIdeaInitialAnalysis,
  generateIdeaPrompt,
  generateIdeaMvp,
  generateResearchQuery,
  synthesizeResearch,
} from "./services/idea.js";
export type {
  StreamChatOptions,
  IdeaTitleOptions,
  StreamInitialAnalysisOptions,
  GenerateOptions,
} from "./services/idea.js";

export {
  streamAppChat,
  generateAppResearchQuery,
  synthesizeAppResearch,
  generateAppRefinedPrompt,
  generateAppMvp,
} from "./services/app-workspace.js";
export type {
  StreamAppChatOptions,
  AppResearchQueryOptions,
  AppResearchSynthesisOptions,
  AppPromptRefinementOptions,
  AppMvpOptions,
} from "./services/app-workspace.js";

export { shouldUseResearch } from "./services/research-intent.js";
export type { ResearchIntentOptions } from "./services/research-intent.js";
