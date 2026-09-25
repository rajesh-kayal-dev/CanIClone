import { prisma } from "@caniclone/database";
import {
  generateAppMvp,
  generateAppRefinedPrompt,
  generateAppResearchQuery,
  shouldUseResearch,
  streamAppChat,
  synthesizeAppResearch,
  type AppChatTurn,
  type AppResearchEvidence,
  type AppWorkspaceAlternative,
  type AppWorkspaceContext,
} from "@caniclone/ai";

import { isResearchEnabled, ResearchUnavailableError, searchWeb } from "../../integrations/firecrawl.js";
import {
  ensureAnonymousUser,
  InvalidAnonymousIdError,
  isValidAnonymousId,
} from "../ideas/ideas.service.js";

const appInclude = {
  pricingPlans: true,
  alternatives: true,
  marketTrend: true,
  aiAnalyses: { orderBy: { createdAt: "desc" as const }, take: 1 },
} as const;

const conversationInclude = {
  messages: { orderBy: { createdAt: "asc" as const } },
  research: { orderBy: { createdAt: "desc" as const }, take: 1 },
  prompts: { orderBy: { updatedAt: "desc" as const }, take: 1 },
  mvps: { orderBy: { updatedAt: "desc" as const }, take: 1 },
} as const;

type AppRow = NonNullable<Awaited<ReturnType<typeof loadAppRow>>>;
type ConversationRow = NonNullable<Awaited<ReturnType<typeof ensureConversation>>>;

export class AppAINotFoundError extends Error {
  constructor(slug: string) {
    super(`App not found: ${slug}`);
    this.name = "AppAINotFoundError";
  }
}

export interface AppAIMessageDto {
  id: string;
  role: string;
  kind: string;
  content: string;
  createdAt: string;
}

export interface AppAIResearchDto {
  id: string;
  query: string;
  hits: Array<{ url: string; title: string; description: string }>;
  analysis: string;
  createdAt: string;
}

export interface AppAIPromptDto {
  id: string;
  content: string;
  accepted: boolean;
  updatedAt: string;
}

export interface AppAIMvpDto {
  id: string;
  content: string;
  updatedAt: string;
}

export interface AppAIWorkspaceSnapshot {
  app: { slug: string; name: string; prompt: string | null };
  messages: AppAIMessageDto[];
  research: AppAIResearchDto | null;
  refinedPrompt: AppAIPromptDto | null;
  mvp: AppAIMvpDto | null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        const record = asRecord(item);
        const label =
          record.name ?? record.label ?? record.title ?? record.text ?? record.description ?? record.desc;
        if (typeof label === "string") return label;
        return JSON.stringify(item);
      }
      return String(item);
    })
    .filter(Boolean);
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new Error("AI request cancelled");
}

function toNumberString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function toAlternative(value: unknown): AppWorkspaceAlternative {
  const record = asRecord(value);
  return {
    name: String(record.name ?? ""),
    url: String(record.url ?? ""),
    description: typeof record.description === "string" ? record.description : null,
    type: typeof record.type === "string" ? record.type : null,
  };
}

function parseResearchHits(value: unknown): Array<{ url: string; title: string; description: string }> {
  const web = value && typeof value === "object" ? asRecord(value).web : null;
  const raw: unknown[] = Array.isArray(value)
    ? value
    : Array.isArray(web)
      ? web
      : [];
  return raw
    .map((item) => {
      const record = asRecord(item);
      if (typeof record.url !== "string" || !record.url.trim()) return null;
      return {
        url: record.url,
        title: typeof record.title === "string" ? record.title : record.url,
        description: typeof record.description === "string" ? record.description : "",
      };
    })
    .filter((hit): hit is { url: string; title: string; description: string } => hit !== null);
}

function toResearchDto(row: ConversationRow["research"][number] | undefined): AppAIResearchDto | null {
  if (!row) return null;
  return {
    id: row.id,
    query: row.query,
    hits: parseResearchHits(row.results),
    analysis: row.analysis ?? "",
    createdAt: row.createdAt.toISOString(),
  };
}

function toPromptDto(row: ConversationRow["prompts"][number] | undefined): AppAIPromptDto | null {
  if (!row) return null;
  return {
    id: row.id,
    content: row.content,
    accepted: row.accepted,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMvpDto(row: ConversationRow["mvps"][number] | undefined): AppAIMvpDto | null {
  if (!row) return null;
  return {
    id: row.id,
    content: row.content,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMessageDto(row: ConversationRow["messages"][number]): AppAIMessageDto {
  return {
    id: row.id,
    role: row.role,
    kind: row.kind,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  };
}

async function loadAppRow(slug: string) {
  return prisma.app.findUnique({ where: { slug }, include: appInclude });
}

async function ensureConversation(appId: string, anonymousUserId: string) {
  if (!isValidAnonymousId(anonymousUserId)) throw new InvalidAnonymousIdError();
  await ensureAnonymousUser(anonymousUserId);
  return prisma.appAIConversation.upsert({
    where: { appId_anonymousUserId: { appId, anonymousUserId } },
    create: { appId, anonymousUserId },
    update: {},
    include: conversationInclude,
  });
}

function buildContext(
  app: AppRow,
  conversation: ConversationRow,
  researchOverride?: AppResearchEvidence | null,
): AppWorkspaceContext {
  const analysis = app.aiAnalyses[0]?.analysis;
  const analysisRecord = asRecord(analysis);
  const latestResearch = researchOverride === undefined
    ? toResearchDto(conversation.research[0])
    : researchOverride;

  return {
    id: app.id,
    slug: app.slug,
    name: app.name,
    domain: app.domain,
    category: app.category,
    subcategory: app.subcategory,
    tagline: app.tagline,
    description: app.verdictSummary,
    verdict: String(app.verdict),
    verdictConfidence: app.verdictConfidence,
    verdictSummary: app.verdictSummary,
    whyPeopleStillPay: app.whyPeopleStillPay,
    coreLoop: app.coreLoopDIY,
    diyTimeEstimate: app.diyTimeEstimate,
    verifiedOneShot: app.verifiedOneShot,
    priceMonthly: toNumberString(app.priceMonthly),
    requirements: stringList(app.requirements),
    features: unique([
      ...stringList(app.requirements),
      ...stringList(analysisRecord.coreFeatures),
    ]),
    whatYouLose: stringList(app.whatYouLose),
    moat: stringList(app.moatTags),
    moatNotes: app.moatNotes,
    priorArt: stringList(app.priorArt),
    rejectedAlternatives: stringList(app.rejectedAlternatives),
    relatedSlugs: stringList(app.relatedSlugs),
    technology: stringList(analysisRecord.recommendedStack),
    alternatives: app.alternatives.map(toAlternative),
    currentPrompt: app.prompt,
    promptCurated: app.promptCurated,
    notes: app.notes,
    pricingPlans: app.pricingPlans.map((plan) => ({
      name: plan.name,
      monthly: toNumberString(plan.monthly),
      annualPerMonth: toNumberString(plan.annualPerMonth),
      per: plan.per,
      limits: plan.limits,
      notes: plan.notes,
    })),
    marketTrend: app.marketTrend
      ? {
          direction: app.marketTrend.trendDirection,
          growthPercent: app.marketTrend.growthPercent,
          currentInterest: app.marketTrend.currentInterest,
          fetchedAt: app.marketTrend.fetchedAt.toISOString(),
        }
      : null,
    research: latestResearch
      ? {
          available: true,
          query: latestResearch.query,
          analysis: latestResearch.analysis,
          hits: latestResearch.hits,
        }
      : null,
  };
}

function historyFor(conversation: ConversationRow): AppChatTurn[] {
  return conversation.messages
    .filter(
      (message) =>
        message.kind === "chat" && (message.role === "user" || message.role === "assistant"),
    )
    .slice(-20)
    .map((message) => ({ role: message.role as "user" | "assistant", content: message.content }));
}

async function loadCurrentHistory(conversationId: string): Promise<AppChatTurn[]> {
  const messages = await prisma.appAIMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
  return messages
    .filter(
      (message) =>
        message.kind === "chat" && (message.role === "user" || message.role === "assistant"),
    )
    .slice(-20)
    .map((message) => ({ role: message.role as "user" | "assistant", content: message.content }));
}

function conversationText(conversation: ConversationRow): string {
  return historyFor(conversation)
    .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content}`)
    .join("\n\n");
}

async function appendMessage(
  conversationId: string,
  role: "user" | "assistant" | "system" | "tool",
  kind: string,
  content: string,
) {
  return prisma.appAIMessage.create({ data: { conversationId, role, kind, content } });
}

async function findRetryableUserMessage(conversationId: string, content: string) {
  const candidate = await prisma.appAIMessage.findFirst({
    where: { conversationId, kind: "chat", role: "user", content },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });
  if (!candidate) return null;
  const laterAssistant = await prisma.appAIMessage.findFirst({
    where: {
      conversationId,
      kind: "chat",
      role: "assistant",
      createdAt: { gt: candidate.createdAt },
    },
    select: { id: true },
  });
  return laterAssistant ? null : candidate;
}

export async function getAppAIWorkspace(
  slug: string,
  anonymousUserId: string,
): Promise<AppAIWorkspaceSnapshot | null> {
  const app = await loadAppRow(slug);
  if (!app) return null;
  const conversation = await ensureConversation(app.id, anonymousUserId);
  return {
    app: { slug: app.slug, name: app.name, prompt: app.prompt },
    messages: conversation.messages.map(toMessageDto),
    research: toResearchDto(conversation.research[0]),
    refinedPrompt: toPromptDto(conversation.prompts[0]),
    mvp: toMvpDto(conversation.mvps[0]),
  };
}

export async function runAppChat(
  slug: string,
  anonymousUserId: string,
  content: string,
  onToken: (token: string) => void,
  signal?: AbortSignal,
  onProgress: (message: string) => void = () => undefined,
  retry = false,
): Promise<{ userMessageId: string; assistantMessageId: string; content: string }> {
  const app = await loadAppRow(slug);
  if (!app) throw new AppAINotFoundError(slug);
  const conversation = await ensureConversation(app.id, anonymousUserId);
  const retryableMessage = retry ? await findRetryableUserMessage(conversation.id, content) : null;
  const userMessage = retryableMessage ?? (await appendMessage(conversation.id, "user", "chat", content));
  let context = buildContext(app, conversation);

  if (await shouldUseResearch({ context, message: content, signal })) {
    onProgress("Research is needed for this question. Planning a focused search...");
    await runAppResearch(slug, anonymousUserId, onProgress, signal);
    const refreshedApp = await loadAppRow(slug);
    if (!refreshedApp) throw new AppAINotFoundError(slug);
    const refreshedConversation = await ensureConversation(refreshedApp.id, anonymousUserId);
    context = buildContext(refreshedApp, refreshedConversation);
    onProgress("Research complete. Preparing the answer from the current sources...");
  }

  const response = await streamAppChat({
    context,
    history: await loadCurrentHistory(conversation.id),
    onToken,
    signal,
  });
  throwIfAborted(signal);
  const assistantMessage = await appendMessage(conversation.id, "assistant", "chat", response);
  return {
    userMessageId: userMessage.id,
    assistantMessageId: assistantMessage.id,
    content: response,
  };
}

export async function runAppResearch(
  slug: string,
  anonymousUserId: string,
  onProgress: (message: string) => void = () => undefined,
  signal?: AbortSignal,
): Promise<AppAIResearchDto> {
  if (!isResearchEnabled()) throw new ResearchUnavailableError();
  const app = await loadAppRow(slug);
  if (!app) throw new AppAINotFoundError(slug);
  const conversation = await ensureConversation(app.id, anonymousUserId);
  const context = buildContext(app, conversation, null);
  onProgress("Planning the research question...");
  const query = await generateAppResearchQuery({ context, signal });
  if (!query) throw new ResearchUnavailableError("Could not derive a research query");

  onProgress("Searching live sources with Firecrawl...");
  const hits = await searchWeb(query, 5, signal);
  onProgress("Analyzing the retrieved sources...");
  const resultsText = hits.length
    ? hits.map((hit, index) => `[${index + 1}] ${hit.title}\n${hit.url}\n${hit.description}`).join("\n\n")
    : "(No usable web results were returned.)";
  const analysis = await synthesizeAppResearch({ context, resultsText, signal });
  throwIfAborted(signal);
  if (!analysis.trim()) throw new Error("Model returned an empty research analysis");
  const record = await prisma.appAIResearch.create({
    data: {
      conversationId: conversation.id,
      query,
      results: hits as unknown as object,
      analysis,
      status: "complete",
    },
  });
  await appendMessage(conversation.id, "assistant", "research", analysis);
  return toResearchDto(record) as AppAIResearchDto;
}

export async function runAppPromptRefinement(
  slug: string,
  anonymousUserId: string,
  instruction: string,
  onProgress: (message: string) => void = () => undefined,
  signal?: AbortSignal,
): Promise<{ prompt: AppAIPromptDto; assistantMessageId: string; content: string }> {
  const app = await loadAppRow(slug);
  if (!app) throw new AppAINotFoundError(slug);
  const conversation = await ensureConversation(app.id, anonymousUserId);
  if (instruction.trim()) {
    await appendMessage(conversation.id, "user", "prompt_request", instruction.trim());
  }
  const context = buildContext(app, conversation);
  onProgress("Preparing a refined build prompt...");
  const content = await generateAppRefinedPrompt({
    context,
    instruction,
    conversation: conversationText(conversation),
    signal,
  });
  throwIfAborted(signal);
  const record = await prisma.appAIPrompt.create({
    data: { conversationId: conversation.id, content },
  });
  const assistantMessage = await appendMessage(conversation.id, "assistant", "prompt_refinement", content);
  return {
    prompt: toPromptDto(record) as AppAIPromptDto,
    assistantMessageId: assistantMessage.id,
    content,
  };
}

export async function acceptAppPrompt(
  slug: string,
  anonymousUserId: string,
  promptId: string,
  content: string,
): Promise<{ prompt: string }> {
  const app = await loadAppRow(slug);
  if (!app) throw new AppAINotFoundError(slug);
  const conversation = await ensureConversation(app.id, anonymousUserId);
  const prompt = await prisma.appAIPrompt.findFirst({ where: { id: promptId, conversationId: conversation.id } });
  if (!prompt) throw new Error("Prompt refinement not found");
  const nextPrompt = content.trim();
  if (!nextPrompt) throw new Error("Refined prompt cannot be empty");
  await prisma.$transaction([
    prisma.appAIPrompt.update({ where: { id: prompt.id }, data: { content: nextPrompt, accepted: true } }),
    prisma.app.update({ where: { id: app.id }, data: { prompt: nextPrompt, promptCurated: false } }),
  ]);
  return { prompt: nextPrompt };
}

export async function runAppMvp(
  slug: string,
  anonymousUserId: string,
  onProgress: (message: string) => void = () => undefined,
  signal?: AbortSignal,
): Promise<{ mvp: AppAIMvpDto; assistantMessageId: string; content: string }> {
  const app = await loadAppRow(slug);
  if (!app) throw new AppAINotFoundError(slug);
  const conversation = await ensureConversation(app.id, anonymousUserId);
  const context = buildContext(app, conversation);
  const research = toResearchDto(conversation.research[0]);
  onProgress("Preparing the MVP specification...");
  const content = await generateAppMvp({
    context,
    conversation: conversationText(conversation),
    research: research
      ? { available: true, query: research.query, analysis: research.analysis, hits: research.hits }
      : null,
    signal,
  });
  throwIfAborted(signal);
  const record = await prisma.appAIMvp.create({
    data: { conversationId: conversation.id, content },
  });
  const assistantMessage = await appendMessage(conversation.id, "assistant", "mvp", content);
  return {
    mvp: toMvpDto(record) as AppAIMvpDto,
    assistantMessageId: assistantMessage.id,
    content,
  };
}
