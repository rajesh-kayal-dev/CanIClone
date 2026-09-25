import { apiFetch } from './client';
import { getIdeasWebSocketUrl } from './ideas';

export interface AppAIMessage {
  id: string;
  role: string;
  kind: string;
  content: string;
  createdAt: string;
}

export interface AppAIResearchHit {
  url: string;
  title: string;
  description: string;
}

export interface AppAIResearch {
  id: string;
  query: string;
  hits: AppAIResearchHit[];
  analysis: string;
  createdAt: string;
}

export interface AppAIPrompt {
  id: string;
  content: string;
  accepted: boolean;
  updatedAt: string;
}

export interface AppAIMvp {
  id: string;
  content: string;
  updatedAt: string;
}

export interface AppAIWorkspace {
  app: { slug: string; name: string; prompt: string | null };
  messages: AppAIMessage[];
  research: AppAIResearch | null;
  refinedPrompt: AppAIPrompt | null;
  mvp: AppAIMvp | null;
}

export interface AppAICapabilities {
  ai: boolean;
  research: boolean;
}

export type AppAIAction = 'research' | 'prompt' | 'mvp';

export interface AppAIActionPayloadMap {
  research: AppAIResearch;
  prompt: AppAIPrompt & { assistantMessageId: string; content: string };
  mvp: AppAIMvp & { assistantMessageId: string; content: string };
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

export async function getAppAIWorkspace(
  slug: string,
  anonymousUserId: string,
  signal?: AbortSignal,
): Promise<AppAIWorkspace> {
  return apiFetch<AppAIWorkspace>(`/api/apps/${encodeURIComponent(slug)}/ai`, {
    headers: ownerHeaders(anonymousUserId),
    signal,
  });
}

export async function acceptAppAIPrompt(
  slug: string,
  anonymousUserId: string,
  promptId: string,
  prompt: string,
): Promise<{ prompt: string }> {
  return apiFetch<{ prompt: string }>(`/api/apps/${encodeURIComponent(slug)}/ai/prompt`, {
    method: 'PATCH',
    headers: jsonHeaders(anonymousUserId),
    body: JSON.stringify({ promptId, prompt }),
  });
}

export function getAppAIWebSocketUrl(): string {
  return getIdeasWebSocketUrl();
}
