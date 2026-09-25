import { apiFetch, getApiUrl } from './client';

export type IdeaSource = 'USER' | 'RESEARCH';
export type IdeaStatus = 'DRAFT' | 'SAVED';

export interface IdeaSummary {
  id: string;
  title: string | null;
  description: string | null;
  source: IdeaSource;
  status: IdeaStatus;
  updatedAt: string;
  createdAt: string;
}

export interface IdeaMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  kind: string;
  content: string;
  createdAt: string;
}

export interface IdeaResearchRecord {
  id: string;
  query: string;
  analysis: string | null;
  results: unknown;
  status: string;
  createdAt: string;
}

export interface IdeaPromptRecord {
  id: string;
  content: string;
  updatedAt: string;
}

export interface IdeaMvpRecord {
  id: string;
  content: string;
  updatedAt: string;
}

export interface IdeaDetail extends IdeaSummary {
  targetUsers: string | null;
  purpose: string | null;
  budget: string | null;
  technology: string | null;
  prompt: string | null;
  research: string | null;
  messages: IdeaMessage[];
  researchRecords: IdeaResearchRecord[];
  prompts: IdeaPromptRecord[];
  mvps: IdeaMvpRecord[];
}

export type IdeaUpdate = Partial<
  Pick<
    IdeaDetail,
    | 'title'
    | 'description'
    | 'targetUsers'
    | 'purpose'
    | 'budget'
    | 'technology'
    | 'prompt'
    | 'research'
    | 'status'
    | 'source'
  >
>;

export interface IdeasCapabilities {
  ai: boolean;
  research: boolean;
}

export interface IdeaResearchHit {
  url: string;
  title: string;
  description: string;
}

export interface ResearchActionPayload {
  query: string;
  hits: IdeaResearchHit[];
  analysis: string;
}

export interface GeneratedActionPayload {
  content: string;
}

export type InitialAnalysisStage = 'title' | 'research' | 'analysis';

export interface InitialAnalysisPayload {
  title: string;
  status: IdeaStatus;
  assistantMessageId: string;
  content: string;
  research: ResearchActionPayload | null;
  researchAvailable: boolean;
  researchMessage: string | null;
}

function ownerHeaders(anonymousUserId: string): HeadersInit {
  return { 'x-anonymous-id': anonymousUserId };
}

function jsonHeaders(anonymousUserId: string): HeadersInit {
  return {
    ...ownerHeaders(anonymousUserId),
    'content-type': 'application/json',
  };
}

export async function listIdeas(
  anonymousUserId: string,
  signal?: AbortSignal,
): Promise<IdeaSummary[]> {
  return apiFetch<IdeaSummary[]>('/api/ideas', {
    headers: ownerHeaders(anonymousUserId),
    signal,
  });
}

export async function getIdeasCapabilities(signal?: AbortSignal): Promise<IdeasCapabilities> {
  return apiFetch<IdeasCapabilities>('/api/ideas/capabilities', { signal });
}

export async function getIdea(
  anonymousUserId: string,
  id: string,
  signal?: AbortSignal,
): Promise<IdeaDetail> {
  return apiFetch<IdeaDetail>(`/api/ideas/${encodeURIComponent(id)}`, {
    headers: ownerHeaders(anonymousUserId),
    signal,
  });
}

export async function createIdea(
  anonymousUserId: string,
  input: { title?: string | null; description?: string | null } = {},
): Promise<IdeaDetail> {
  return apiFetch<IdeaDetail>('/api/ideas', {
    method: 'POST',
    headers: jsonHeaders(anonymousUserId),
    body: JSON.stringify(input),
  });
}

export async function updateIdea(
  anonymousUserId: string,
  id: string,
  input: IdeaUpdate,
): Promise<IdeaDetail> {
  return apiFetch<IdeaDetail>(`/api/ideas/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: jsonHeaders(anonymousUserId),
    body: JSON.stringify(input),
  });
}

export async function deleteIdea(
  anonymousUserId: string,
  id: string,
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/api/ideas/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: ownerHeaders(anonymousUserId),
  });
}

export function getIdeasWebSocketUrl(): string {
  const url = new URL(getApiUrl());
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = '/ws';
  url.search = '';
  url.hash = '';
  return url.toString();
}
