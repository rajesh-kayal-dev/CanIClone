import { prisma } from "@caniclone/database";

type IdeaSource = "USER" | "RESEARCH";
type IdeaStatus = "DRAFT" | "SAVED";

/**
 * Ideas data layer. Every read/write is scoped by an anonymous user id that the
 * browser generates and persists (see apps/web/lib/anonymous-id.ts). There is no
 * login: the id is the only handle, so every access re-checks ownership and a
 * mismatch is reported as "not found" rather than "forbidden" to avoid leaking
 * whether an idea exists.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class InvalidAnonymousIdError extends Error {
  constructor() {
    super("Invalid anonymous user id");
    this.name = "InvalidAnonymousIdError";
  }
}

export class IdeaNotFoundError extends Error {
  constructor(id: string) {
    super(`Idea not found: ${id}`);
    this.name = "IdeaNotFoundError";
  }
}

export function isValidAnonymousId(id: unknown): id is string {
  return typeof id === "string" && UUID_RE.test(id);
}

/** Create the anonymous user row on first sight; idempotent afterwards. */
export async function ensureAnonymousUser(id: string): Promise<void> {
  if (!isValidAnonymousId(id)) throw new InvalidAnonymousIdError();
  await prisma.anonymousUser.upsert({
    where: { id },
    create: { id },
    update: {},
  });
}

export interface IdeaSummary {
  id: string;
  title: string | null;
  description: string | null;
  source: IdeaSource;
  status: IdeaStatus;
  updatedAt: Date;
  createdAt: Date;
}

export interface IdeaDetail extends IdeaSummary {
  targetUsers: string | null;
  purpose: string | null;
  budget: string | null;
  technology: string | null;
  prompt: string | null;
  research: string | null;
  messages: {
    id: string;
    role: string;
    kind: string;
    content: string;
    createdAt: Date;
  }[];
  researchRecords: {
    id: string;
    query: string;
    analysis: string | null;
    results: unknown;
    status: string;
    createdAt: Date;
  }[];
  prompts: { id: string; content: string; updatedAt: Date }[];
  mvps: { id: string; content: string; updatedAt: Date }[];
}

const detailInclude = {
  messages: { orderBy: { createdAt: "asc" as const } },
  researchRecords: { orderBy: { createdAt: "desc" as const } },
  prompts: { orderBy: { updatedAt: "desc" as const } },
  mvps: { orderBy: { updatedAt: "desc" as const } },
};

function toSummary(idea: {
  id: string;
  title: string | null;
  description: string | null;
  source: IdeaSource;
  status: IdeaStatus;
  createdAt: Date;
  updatedAt: Date;
}): IdeaSummary {
  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    source: idea.source,
    status: idea.status,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
  };
}

function toDetail(
  idea: Awaited<ReturnType<typeof prisma.idea.findUniqueOrThrow>> & {
    messages: unknown[];
    researchRecords: unknown[];
    prompts: unknown[];
    mvps: unknown[];
  },
): IdeaDetail {
  const d = idea as unknown as {
    targetUsers: string | null;
    purpose: string | null;
    budget: string | null;
    technology: string | null;
    prompt: string | null;
    research: string | null;
    messages: IdeaDetail["messages"];
    researchRecords: IdeaDetail["researchRecords"];
    prompts: IdeaDetail["prompts"];
    mvps: IdeaDetail["mvps"];
  };
  return {
    ...toSummary(idea),
    targetUsers: d.targetUsers,
    purpose: d.purpose,
    budget: d.budget,
    technology: d.technology,
    prompt: d.prompt,
    research: d.research,
    messages: d.messages,
    researchRecords: d.researchRecords,
    prompts: d.prompts,
    mvps: d.mvps,
  };
}

/** All idea cards for one anonymous user, most recently updated first. */
export async function listIdeas(anonymousUserId: string): Promise<IdeaSummary[]> {
  await ensureAnonymousUser(anonymousUserId);
  const ideas = await prisma.idea.findMany({
    where: { anonymousUserId },
    orderBy: { updatedAt: "desc" },
  });
  return ideas.map(toSummary);
}

/** Create a DRAFT idea immediately so nothing is ever lost before an explicit save. */
export async function createIdea(
  anonymousUserId: string,
  input: { title?: string | null; description?: string | null; source?: IdeaSource } = {},
): Promise<IdeaDetail> {
  await ensureAnonymousUser(anonymousUserId);
  const idea = await prisma.idea.create({
    data: {
      anonymousUserId,
      title: input.title ?? null,
      description: input.description ?? null,
      source: input.source ?? "USER",
      status: "DRAFT",
    },
    include: detailInclude,
  });
  return toDetail(idea);
}

/** Load one idea with its full workspace, scoped to its owner. */
export async function getIdea(
  id: string,
  anonymousUserId: string,
): Promise<IdeaDetail> {
  if (!isValidAnonymousId(anonymousUserId)) throw new InvalidAnonymousIdError();
  const idea = await prisma.idea.findFirst({
    where: { id, anonymousUserId },
    include: detailInclude,
  });
  if (!idea) throw new IdeaNotFoundError(id);
  return toDetail(idea);
}

const STRING_FIELDS = [
  "title",
  "description",
  "targetUsers",
  "purpose",
  "budget",
  "technology",
  "prompt",
  "research",
] as const;

/** Whitelist + sanitize an untrusted partial body so only known columns are written. */
function buildUpdateData(input: Record<string, unknown>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  for (const field of STRING_FIELDS) {
    if (!(field in input)) continue;
    const value = input[field];
    if (value === undefined) continue;
    data[field] = value === null ? null : String(value);
  }
  if (input.status === "DRAFT" || input.status === "SAVED") data.status = input.status;
  if (input.source === "USER" || input.source === "RESEARCH") data.source = input.source;
  return data;
}

/** Auto-save: partial update of an idea owned by this anonymous user. */
export async function updateIdea(
  id: string,
  anonymousUserId: string,
  input: Record<string, unknown>,
): Promise<IdeaDetail> {
  if (!isValidAnonymousId(anonymousUserId)) throw new InvalidAnonymousIdError();
  const existing = await prisma.idea.findFirst({
    where: { id, anonymousUserId },
    select: { id: true },
  });
  if (!existing) throw new IdeaNotFoundError(id);

  const data = buildUpdateData(input);
  const idea = await prisma.idea.update({
    where: { id },
    data,
    include: detailInclude,
  });
  return toDetail(idea);
}

/** Delete an idea; Prisma cascades remove its messages, research, prompts and MVPs. */
export async function deleteIdea(
  id: string,
  anonymousUserId: string,
): Promise<void> {
  if (!isValidAnonymousId(anonymousUserId)) throw new InvalidAnonymousIdError();
  const existing = await prisma.idea.findFirst({
    where: { id, anonymousUserId },
    select: { id: true },
  });
  if (!existing) throw new IdeaNotFoundError(id);
  await prisma.idea.delete({ where: { id } });
}

/**
 * Feature flags derived purely from server env — no secrets are exposed, only
 * whether a capability is wired. Research needs a Firecrawl key; the AI chat
 * needs the Mistral key (it may still be rate-limited at call time).
 */
export function getCapabilities(): { ai: boolean; research: boolean } {
  return {
    ai: Boolean(process.env.MISTRAL_API_KEY),
    research: Boolean(process.env.FIRECRAWL_API_KEY),
  };
}
