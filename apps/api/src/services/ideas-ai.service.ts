import { prisma } from "@caniclone/database";
import {
  generateIdeaMvp,
  generateIdeaPrompt,
  streamIdeaChat,
  type ChatTurn,
  type IdeaContext,
} from "@caniclone/ai";

import { IdeaNotFoundError, isValidAnonymousId, InvalidAnonymousIdError } from "./ideas.service.js";

/**
 * Orchestration between the Ideas data layer and the real Mistral calls in
 * @caniclone/ai. This module never fabricates model output: if the provider is
 * rate-limited the call throws and the caller reports an honest error.
 */

type IdeaRow = Awaited<ReturnType<typeof prisma.idea.findFirstOrThrow>>;

/** Load an idea strictly scoped to its anonymous owner (ownership guard). */
export async function loadOwnedIdea(ideaId: string, anonymousUserId: string): Promise<IdeaRow> {
  if (!isValidAnonymousId(anonymousUserId)) throw new InvalidAnonymousIdError();
  const idea = await prisma.idea.findFirst({ where: { id: ideaId, anonymousUserId } });
  if (!idea) throw new IdeaNotFoundError(ideaId);
  return idea;
}

/** Project a DB idea row onto the AI context shape. */
export function toIdeaContext(idea: IdeaRow): IdeaContext {
  return {
    title: idea.title,
    description: idea.description,
    targetUsers: idea.targetUsers,
    purpose: idea.purpose,
    budget: idea.budget,
    technology: idea.technology,
    prompt: idea.prompt,
    research: idea.research,
  };
}

/** Prior conversation (user + assistant turns, oldest first) for model context. */
export async function getChatHistory(ideaId: string): Promise<ChatTurn[]> {
  const rows = await prisma.aIMessage.findMany({
    where: { ideaId, role: { in: ["user", "assistant"] } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({ role: r.role as "user" | "assistant", content: r.content }));
}

/** Plain-text transcript used by the prompt/MVP generators. */
export function renderConversation(history: ChatTurn[]): string {
  return history.map((t) => `${t.role === "user" ? "User" : "Assistant"}: ${t.content}`).join("\n\n");
}

export async function appendMessage(
  ideaId: string,
  role: "user" | "assistant" | "system" | "tool",
  kind: string,
  content: string,
) {
  return prisma.aIMessage.create({ data: { ideaId, role, kind, content } });
}

export interface ChatResult {
  userMessageId: string;
  assistantMessageId: string;
  content: string;
}

/**
 * Persist the user's turn, stream a real Mistral reply (emitting tokens via
 * onToken), then persist the assistant turn. The user message is saved first so
 * it is never lost even if the model call fails.
 */
export async function runChat(
  ideaId: string,
  anonymousUserId: string,
  userContent: string,
  onToken: (token: string) => void,
  signal?: AbortSignal,
): Promise<ChatResult> {
  const idea = await loadOwnedIdea(ideaId, anonymousUserId);
  const userMsg = await appendMessage(ideaId, "user", "chat", userContent);

  // Refresh context AFTER saving the user's message; also fold the new turn into
  // the history so the model sees it.
  const context = toIdeaContext(idea);
  const history = [...(await getChatHistory(ideaId))];

  const content = await streamIdeaChat({ context, history, onToken, signal });
  const assistantMsg = await appendMessage(ideaId, "assistant", "chat", content);

  return {
    userMessageId: userMsg.id,
    assistantMessageId: assistantMsg.id,
    content,
  };
}

/** Generate + persist the improved development prompt for an idea. */
export async function runCreatePrompt(
  ideaId: string,
  anonymousUserId: string,
  signal?: AbortSignal,
): Promise<{ content: string }> {
  const idea = await loadOwnedIdea(ideaId, anonymousUserId);
  const context = toIdeaContext(idea);
  const conversation = renderConversation(await getChatHistory(ideaId));

  const content = await generateIdeaPrompt({ context, conversation, signal });

  const existing = await prisma.prompt.findFirst({
    where: { ideaId },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    await prisma.prompt.update({ where: { id: existing.id }, data: { content } });
  } else {
    await prisma.prompt.create({ data: { ideaId, content } });
  }
  await prisma.idea.update({ where: { id: ideaId }, data: { prompt: content } });
  await appendMessage(ideaId, "assistant", "prompt", content);
  return { content };
}

/** Generate + persist the MVP.md document for an idea. */
export async function runCreateMvp(
  ideaId: string,
  anonymousUserId: string,
  signal?: AbortSignal,
): Promise<{ content: string }> {
  const idea = await loadOwnedIdea(ideaId, anonymousUserId);
  const context = toIdeaContext(idea);
  const conversation = renderConversation(await getChatHistory(ideaId));

  const content = await generateIdeaMvp({ context, conversation, signal });

  const existing = await prisma.mvp.findFirst({
    where: { ideaId },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    await prisma.mvp.update({ where: { id: existing.id }, data: { content } });
  } else {
    await prisma.mvp.create({ data: { ideaId, content } });
  }
  await appendMessage(ideaId, "assistant", "mvp", content);
  return { content };
}
