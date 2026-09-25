import { prisma } from "@caniclone/database";
import {
  generateIdeaTitle,
  streamIdeaInitialAnalysis,
  type IdeaResearchEvidence,
} from "@caniclone/ai";

import { isResearchEnabled, ResearchUnavailableError } from "../../integrations/firecrawl.js";
import { loadOwnedIdea, toIdeaContext } from "./ideas-ai.service.js";
import { runResearch, type ResearchOutcome } from "./research.service.js";

export type InitialAnalysisStage = "title" | "research" | "analysis";

export interface InitialAnalysisProgress {
  stage: InitialAnalysisStage;
  message: string;
}

export interface InitialAnalysisResult {
  title: string;
  status: "SAVED";
  assistantMessageId: string;
  content: string;
  research: ResearchOutcome | null;
  researchAvailable: boolean;
  researchMessage: string | null;
}

/**
 * Run the real post-onboarding workflow:
 * persisted idea -> AI-generated title -> shared research service -> streamed AI
 * analysis -> persisted assistant message. No stage fabricates a result when a
 * provider is unavailable.
 */
export async function runInitialAnalysis(
  ideaId: string,
  anonymousUserId: string,
  onProgress: (progress: InitialAnalysisProgress) => void,
  onTitle: (title: string) => void,
  onToken: (token: string) => void,
  signal?: AbortSignal,
): Promise<InitialAnalysisResult> {
  const initialIdea = await loadOwnedIdea(ideaId, anonymousUserId);
  const initialContext = toIdeaContext(initialIdea);

  let title = initialIdea.title?.trim() || "";
  if (!title) {
    onProgress({ stage: "title", message: "Generating a meaningful name for your idea..." });
    title = await generateIdeaTitle({ context: initialContext, signal });
    await prisma.idea.update({ where: { id: ideaId }, data: { title } });
    onTitle(title);
  } else {
    onProgress({ stage: "title", message: "Using the existing idea name while preparing the analysis..." });
  }

  let research: ResearchOutcome | null = null;
  let researchMessage: string | null = null;

  if (isResearchEnabled()) {
    onProgress({ stage: "research", message: "Researching existing solutions and alternatives..." });
    try {
      research = await runResearch(ideaId, anonymousUserId, signal);
      onProgress({ stage: "research", message: "Research complete; preparing the evidence-backed analysis..." });
    } catch (error) {
      // A missing/invalid Firecrawl configuration must not turn into invented
      // research. The shared AI service can still provide a clearly labeled analysis-only pass.
      if (!(error instanceof ResearchUnavailableError)) throw error;
      researchMessage = error.message;
      onProgress({
        stage: "research",
        message: "Live research is unavailable; preparing an analysis without external research.",
      });
    }
  } else {
    researchMessage = "Live research was not performed because Firecrawl is not configured on this server.";
    onProgress({
      stage: "research",
      message: "Live research is unavailable; preparing an analysis without external research.",
    });
  }

  const refreshedIdea = await loadOwnedIdea(ideaId, anonymousUserId);
  const analysisContext = toIdeaContext(refreshedIdea);
  // Do not let a prior research snapshot masquerade as fresh evidence when this
  // run could not perform a live search.
  if (!research) analysisContext.research = null;

  const evidence: IdeaResearchEvidence = research
    ? {
        available: true,
        query: research.query,
        analysis: research.analysis,
        hits: research.hits,
      }
    : {
        available: false,
        query: null,
        analysis: null,
        hits: [],
        unavailableReason: researchMessage,
      };

  onProgress({ stage: "analysis", message: "Preparing your structured analysis..." });
  const content = await streamIdeaInitialAnalysis({
    context: analysisContext,
    research: evidence,
    onToken,
    signal,
  });

  // Persist only after the complete stream succeeds. A provider failure therefore
  // cannot leave an empty assistant message behind.
  const assistantMessage = await prisma.$transaction(async (tx) => {
    const message = await tx.aIMessage.create({
      data: { ideaId, role: "assistant", kind: "analysis", content },
    });
    await tx.idea.update({ where: { id: ideaId }, data: { status: "SAVED" } });
    return message;
  });

  return {
    title,
    status: "SAVED",
    assistantMessageId: assistantMessage.id,
    content,
    research,
    researchAvailable: Boolean(research),
    researchMessage,
  };
}
