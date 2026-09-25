'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';

import { Icons } from '@/components/icons';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { getAnonymousUserId, createClientRequestId } from '@/lib/anonymous-id';
import {
  createIdea,
  deleteIdea,
  getIdea,
  getIdeasCapabilities,
  listIdeas,
  updateIdea,
  type IdeaDetail,
  type IdeaMessage,
  type IdeaResearchHit,
  type InitialAnalysisStage,
  type IdeaSummary,
  type IdeaUpdate,
  type IdeasCapabilities,
} from '@/lib/api/ideas';
import { cn } from '@/lib/utils';

import { useIdeasSocket, type IdeasSocketEvent } from '../hooks/use-ideas-socket';
import {
  buildIdeaOnboardingPatch,
  createEmptyIdeaOnboardingAnswers,
  IDEA_ONBOARDING_STEPS,
  readIdeaOnboardingAnswers,
  type IdeaOnboardingAnswers,
  type IdeaOnboardingStepId,
} from '../idea-onboarding';
import { IdeaOnboarding } from './idea-onboarding';
import { IdeaListItem, IdeaSaveIndicator, type IdeaSaveState } from './idea-list';
import { IdeaMessageBubble } from './idea-conversation';
import { MvpOutput, PromptOutput, ResearchOutput } from '@/features/ai-workspace/components/ai-output';

type SaveState = IdeaSaveState;
type ActionKind = 'research' | 'prompt' | 'mvp';
type EditableTextField = 'title' | 'description';

type ActiveChatRequest = {
  requestId: string;
  temporaryMessageId: string;
  content: string;
};

type FailedChatRequest = {
  content: string;
  temporaryMessageId: string;
};

type ActiveActionRequest = {
  requestId: string;
  action: ActionKind;
};

type OnboardingRetry = {
  ideaId: string;
  stepId: IdeaOnboardingStepId;
  value: string;
};

type PendingInitialAnalysis = {
  ideaId: string;
  requestId: string;
};

type ActiveInitialAnalysis = PendingInitialAnalysis;

type OnboardingResume = {
  ideaId: string;
  stepIndex: number;
  autoAnalyze: boolean;
};

const ONBOARDING_RESUME_KEY = 'caniclone-ideas-onboarding-draft';
const PENDING_ANALYSIS_KEY = 'caniclone-ideas-pending-analysis';

function readOnboardingResume(): OnboardingResume | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(ONBOARDING_RESUME_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as Record<string, unknown>;
    if (typeof record.ideaId !== 'string' || typeof record.stepIndex !== 'number') return null;
    if (!Number.isInteger(record.stepIndex) || record.stepIndex < 0) return null;
    return {
      ideaId: record.ideaId,
      stepIndex: Math.min(record.stepIndex, IDEA_ONBOARDING_STEPS.length - 1),
      autoAnalyze: record.autoAnalyze === true,
    };
  } catch {
    return null;
  }
}

function writeOnboardingResume(value: OnboardingResume | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) window.localStorage.setItem(ONBOARDING_RESUME_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(ONBOARDING_RESUME_KEY);
  } catch {
    // Private browsing can reject localStorage; the server-side idea remains safe.
  }
}

type PendingAnalysisResume = {
  ideaId: string;
  requestId: string;
};

function readPendingAnalysisResume(): PendingAnalysisResume | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PENDING_ANALYSIS_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const record = parsed as Record<string, unknown>;
    if (typeof record.ideaId !== 'string' || typeof record.requestId !== 'string') return null;
    return { ideaId: record.ideaId, requestId: record.requestId };
  } catch {
    return null;
  }
}

function writePendingAnalysisResume(value: PendingAnalysisResume | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (value) window.localStorage.setItem(PENDING_ANALYSIS_KEY, JSON.stringify(value));
    else window.localStorage.removeItem(PENDING_ANALYSIS_KEY);
  } catch {
    // The idea remains persisted even when browser storage is unavailable.
  }
}

function errorText(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function toSummary(detail: IdeaDetail): IdeaSummary {
  return {
    id: detail.id,
    title: detail.title,
    description: detail.description,
    source: detail.source,
    status: detail.status,
    createdAt: detail.createdAt,
    updatedAt: detail.updatedAt,
  };
}

function latestResearch(detail: IdeaDetail) {
  const record = detail.researchRecords[0];
  const results = record?.results;
  const rawHits = Array.isArray(results)
    ? results
    : results && typeof results === 'object' && 'web' in results && Array.isArray(results.web)
      ? results.web
      : [];
  const hits: IdeaResearchHit[] = [];

  for (const value of rawHits) {
    if (!value || typeof value !== 'object') continue;
    const hit = value as Record<string, unknown>;
    if (typeof hit.url !== 'string' || !hit.url.trim()) continue;
    hits.push({
      url: hit.url,
      title: typeof hit.title === 'string' ? hit.title : hit.url,
      description: typeof hit.description === 'string' ? hit.description : '',
    });
  }

  return {
    query: record?.query ?? null,
    analysis: detail.research?.trim() || record?.analysis?.trim() || '',
    hits,
  };
}

function getPrompt(detail: IdeaDetail): string {
  return detail.prompts[0]?.content?.trim() || detail.prompt?.trim() || '';
}

function getMvp(detail: IdeaDetail): string {
  return detail.mvps[0]?.content?.trim() || '';
}

export function IdeasWorkspace() {
  const [anonymousUserId, setAnonymousUserId] = useState<string | null>(null);
  const [ideas, setIdeas] = useState<IdeaSummary[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<IdeaDetail | null>(null);
  const [loadingIdeas, setLoadingIdeas] = useState(true);
  const [loadingIdea, setLoadingIdea] = useState(false);
  const [creating, setCreating] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<IdeasCapabilities | null>(null);
  const [chatText, setChatText] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [chatPending, setChatPending] = useState(false);
  const [chatProgress, setChatProgress] = useState<string | null>(null);
  const [lastFailedChat, setLastFailedChat] = useState<FailedChatRequest | null>(null);
  const [actionPending, setActionPending] = useState<ActionKind | null>(null);
  const [actionProgress, setActionProgress] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastFailedAction, setLastFailedAction] = useState<ActionKind | null>(null);
  const [promptContent, setPromptContent] = useState('');
  const [mvpContent, setMvpContent] = useState('');
  const [researchContent, setResearchContent] = useState('');
  const [researchHits, setResearchHits] = useState<IdeaResearchHit[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [onboardingActive, setOnboardingActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingAnswers, setOnboardingAnswers] = useState<IdeaOnboardingAnswers>(() =>
    createEmptyIdeaOnboardingAnswers(),
  );
  const [onboardingSaving, setOnboardingSaving] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [onboardingResume, setOnboardingResume] = useState<OnboardingResume | null>(null);
  const [analysisPending, setAnalysisPending] = useState(false);
  const [analysisStage, setAnalysisStage] = useState<InitialAnalysisStage | 'starting' | null>(null);
  const [analysisStatusMessage, setAnalysisStatusMessage] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisNotice, setAnalysisNotice] = useState<string | null>(null);
  const [initialAnalysisRequest, setInitialAnalysisRequest] = useState<PendingInitialAnalysis | null>(null);
  const [pendingAnalysisResume, setPendingAnalysisResume] = useState<PendingAnalysisResume | null>(null);

  const anonymousUserIdRef = useRef<string | null>(null);
  const selectedIdeaIdRef = useRef<string | null>(null);
  const listAbortRef = useRef<AbortController | null>(null);
  const ideaAbortRef = useRef<AbortController | null>(null);
  const saveTimerRef = useRef<number | undefined>(undefined);
  const pendingPatchRef = useRef<IdeaUpdate>({});
  const saveInFlightRef = useRef(false);
  const flushSaveRef = useRef<() => void>(() => undefined);
  const activeChatRef = useRef<ActiveChatRequest | null>(null);
  const activeActionRef = useRef<ActiveActionRequest | null>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);
  const onboardingAnswersRef = useRef<IdeaOnboardingAnswers>(onboardingAnswers);
  const onboardingPersistedAnswersRef = useRef<IdeaOnboardingAnswers>(onboardingAnswers);
  const onboardingResumeRef = useRef<OnboardingResume | null>(null);
  const onboardingResumeInProgressRef = useRef(false);
  const onboardingSaveLockRef = useRef(false);
  const onboardingRetryRef = useRef<OnboardingRetry | null>(null);
  const analysisRequestRef = useRef<PendingInitialAnalysis | null>(null);
  const activeAnalysisRef = useRef<ActiveInitialAnalysis | null>(null);
  const pendingAnalysisResumeRef = useRef<PendingAnalysisResume | null>(null);
  const pendingAnalysisResumeInProgressRef = useRef(false);
  const autoAnalyzeAfterOnboardingRef = useRef(false);

  const replaceOnboardingAnswers = useCallback((answers: IdeaOnboardingAnswers) => {
    onboardingAnswersRef.current = answers;
    setOnboardingAnswers(answers);
  }, []);

  const setOnboardingResumeMarker = useCallback((ideaId: string, stepIndex: number, autoAnalyze = false) => {
    const next = {
      ideaId,
      stepIndex: Math.max(0, Math.min(stepIndex, IDEA_ONBOARDING_STEPS.length - 1)),
      autoAnalyze,
    };
    onboardingResumeRef.current = next;
    setOnboardingResume(next);
    writeOnboardingResume(next);
  }, []);

  const clearOnboardingResumeMarker = useCallback(() => {
    onboardingResumeRef.current = null;
    setOnboardingResume(null);
    writeOnboardingResume(null);
  }, []);

  const setPendingAnalysisMarker = useCallback((ideaId: string, requestId: string) => {
    const next = { ideaId, requestId };
    pendingAnalysisResumeRef.current = next;
    setPendingAnalysisResume(next);
    writePendingAnalysisResume(next);
  }, []);

  const clearPendingAnalysisMarker = useCallback(() => {
    pendingAnalysisResumeRef.current = null;
    setPendingAnalysisResume(null);
    writePendingAnalysisResume(null);
  }, []);

  const resetAutomaticAnalysis = useCallback(() => {
    analysisRequestRef.current = null;
    activeAnalysisRef.current = null;
    setInitialAnalysisRequest(null);
    setAnalysisPending(false);
    setAnalysisStage(null);
    setAnalysisStatusMessage(null);
    setAnalysisError(null);
    setAnalysisNotice(null);
    setStreamingText('');
  }, []);

  const applyIdeaDetail = useCallback((detail: IdeaDetail) => {
    setSelectedIdea(detail);
    setIdeas((current) => {
      const summary = toSummary(detail);
      const exists = current.some((idea) => idea.id === detail.id);
      return exists
        ? current.map((idea) => (idea.id === detail.id ? summary : idea))
        : [summary, ...current];
    });

    const research = latestResearch(detail);
    setResearchContent(research.analysis);
    setResearchHits(research.hits);
    setPromptContent(getPrompt(detail));
    setMvpContent(getMvp(detail));
    setSaveState('saved');
    setSaveError(null);
  }, []);

  const loadIdeas = useCallback(async (userId: string, signal?: AbortSignal) => {
    setLoadingIdeas(true);
    setListError(null);
    try {
      const rows = await listIdeas(userId, signal);
      setIdeas(rows);
    } catch (error) {
      if (signal?.aborted) return;
      setListError(errorText(error, 'Could not load your ideas.'));
    } finally {
      if (!signal?.aborted) setLoadingIdeas(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const initializeTimer = window.setTimeout(() => {
      try {
        const userId = getAnonymousUserId();
        anonymousUserIdRef.current = userId;
        setAnonymousUserId(userId);
        void loadIdeas(userId, controller.signal).then(() => {
          if (controller.signal.aborted) return;
          const resume = readOnboardingResume();
          if (resume) {
            onboardingResumeRef.current = resume;
            setOnboardingResume(resume);
          }
          const pendingAnalysis = readPendingAnalysisResume();
          if (pendingAnalysis) {
            pendingAnalysisResumeRef.current = pendingAnalysis;
            setPendingAnalysisResume(pendingAnalysis);
          }
        });
      } catch (error) {
        setListError(errorText(error, 'Could not initialize the anonymous workspace.'));
        setLoadingIdeas(false);
      }
    }, 0);
    listAbortRef.current = controller;
    return () => {
      window.clearTimeout(initializeTimer);
      controller.abort();
    };
  }, [loadIdeas]);

  useEffect(() => {
    if (!anonymousUserId) return;
    const controller = new AbortController();
    void getIdeasCapabilities(controller.signal)
      .then((next) => {
        if (!controller.signal.aborted) setCapabilities(next);
      })
      .catch(() => {
        // The WebSocket ready event is the second capability source.
      });
    return () => controller.abort();
  }, [anonymousUserId]);

  const clearPendingSave = useCallback(() => {
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = undefined;
    pendingPatchRef.current = {};
  }, []);

  const flushSave = useCallback(async () => {
    if (saveInFlightRef.current) return;
    const ideaId = selectedIdeaIdRef.current;
    const userId = anonymousUserIdRef.current;
    const patch = pendingPatchRef.current;
    if (!ideaId || !userId || Object.keys(patch).length === 0) {
      setSaveState('saved');
      return;
    }

    pendingPatchRef.current = {};
    saveInFlightRef.current = true;
    setSaveState('saving');
    setSaveError(null);
    try {
      const detail = await updateIdea(userId, ideaId, patch);
      if (selectedIdeaIdRef.current === ideaId) {
        setSelectedIdea((current) =>
          current
            ? { ...current, ...detail, ...pendingPatchRef.current }
            : detail,
        );
        setIdeas((current) =>
          current.map((idea) => (idea.id === ideaId ? toSummary(detail) : idea)),
        );
        setSaveState('saved');
      }
    } catch (error) {
      if (selectedIdeaIdRef.current === ideaId) {
        pendingPatchRef.current = { ...patch, ...pendingPatchRef.current };
        setSaveState('error');
        setSaveError(errorText(error, 'Could not save this idea.'));
      }
    } finally {
      saveInFlightRef.current = false;
      if (
        selectedIdeaIdRef.current === ideaId &&
        Object.keys(pendingPatchRef.current).length > 0
      ) {
        saveTimerRef.current = window.setTimeout(() => flushSaveRef.current(), 650);
      }
    }
  }, []);

  useEffect(() => {
    flushSaveRef.current = () => void flushSave();
  }, [flushSave]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      ideaAbortRef.current?.abort();
      listAbortRef.current?.abort();
    };
  }, []);

  const queueSave = useCallback(
    (patch: IdeaUpdate) => {
      pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
      setSaveState('saving');
      setSaveError(null);
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => flushSaveRef.current(), 650);
    },
    [],
  );

  const persistOnboardingAnswer = useCallback(
    async (stepId: IdeaOnboardingStepId, value: string, isRetry = false): Promise<boolean> => {
      const step = IDEA_ONBOARDING_STEPS.find((candidate) => candidate.id === stepId);
      const ideaId = selectedIdeaIdRef.current;
      const userId = anonymousUserIdRef.current;
      if (!step || !ideaId || !userId || onboardingSaving || onboardingSaveLockRef.current) return false;

      const nextAnswers = { ...onboardingAnswersRef.current, [stepId]: value };
      const patch = buildIdeaOnboardingPatch(
        step,
        value,
        nextAnswers,
        onboardingPersistedAnswersRef.current,
      );
      replaceOnboardingAnswers(nextAnswers);
      if (!isRetry) onboardingRetryRef.current = null;
      if (Object.keys(patch).length === 0) {
        onboardingRetryRef.current = null;
        setOnboardingError(null);
        setSaveState('saved');
        setSaveError(null);
        return true;
      }

      onboardingSaveLockRef.current = true;
      setOnboardingSaving(true);
      setOnboardingError(null);
      setSaveState('saving');
      setSaveError(null);
      if (selectedIdeaIdRef.current === ideaId) {
        setSelectedIdea((current) => (current ? { ...current, ...patch } : current));
        if (patch.description !== undefined) {
          setIdeas((current) =>
            current.map((idea) =>
              idea.id === ideaId ? { ...idea, description: patch.description ?? null } : idea,
            ),
          );
        }
      }

      try {
        const detail = await updateIdea(userId, ideaId, patch);
        if (selectedIdeaIdRef.current === ideaId) {
          onboardingPersistedAnswersRef.current = readIdeaOnboardingAnswers(detail);
          setSelectedIdea((current) => (current ? { ...current, ...detail } : detail));
          setIdeas((current) =>
            current.map((idea) => (idea.id === ideaId ? toSummary(detail) : idea)),
          );
          onboardingRetryRef.current = null;
          setSaveState('saved');
          setSaveError(null);
        }
        return true;
      } catch (error) {
        if (selectedIdeaIdRef.current === ideaId) {
          const message = errorText(error, 'Could not save this answer. Try again.');
          onboardingRetryRef.current = { ideaId, stepId, value };
          setSaveState('error');
          setSaveError(message);
          setOnboardingError(message);
        }
        return false;
      } finally {
        onboardingSaveLockRef.current = false;
        setOnboardingSaving(false);
      }
    },
    [onboardingSaving, replaceOnboardingAnswers],
  );

  const retrySave = useCallback(() => {
    const retry = onboardingRetryRef.current;
    if (retry && selectedIdeaIdRef.current === retry.ideaId) {
      void persistOnboardingAnswer(retry.stepId, retry.value, true);
      return;
    }
    if (retry) onboardingRetryRef.current = null;
    if (Object.keys(pendingPatchRef.current).length === 0) {
      setSaveState('saved');
      return;
    }
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => flushSaveRef.current(), 0);
  }, [persistOnboardingAnswer]);

  const updateIdeaField = useCallback(
    (field: EditableTextField, value: string) => {
      if (analysisRequestRef.current || activeAnalysisRef.current) return;
      const ideaId = selectedIdeaIdRef.current;
      if (!ideaId) return;
      setSelectedIdea((current) => (current ? { ...current, [field]: value } : current));
      setIdeas((current) =>
        current.map((idea) => (idea.id === ideaId ? { ...idea, [field]: value } : idea)),
      );
      queueSave({ [field]: value });
    },
    [queueSave],
  );

  const queueInitialAnalysis = useCallback((ideaId: string) => {
    if (analysisRequestRef.current || activeAnalysisRef.current) return;
    const request = { ideaId, requestId: createClientRequestId() };
    setPendingAnalysisMarker(ideaId, request.requestId);
    analysisRequestRef.current = request;
    setInitialAnalysisRequest(request);
    setAnalysisPending(true);
    setAnalysisStage('starting');
    setAnalysisStatusMessage('Preparing automatic analysis...');
    setAnalysisError(null);
    setAnalysisNotice(null);
  }, [setPendingAnalysisMarker]);

  const startOnboarding = useCallback(() => {
    if (
      !selectedIdea ||
      saveState === 'saving' ||
      onboardingSaveLockRef.current ||
      analysisRequestRef.current ||
      activeAnalysisRef.current ||
      Object.keys(pendingPatchRef.current).length > 0
    )
      return;
    const answers = readIdeaOnboardingAnswers(selectedIdea);
    onboardingPersistedAnswersRef.current = answers;
    replaceOnboardingAnswers(answers);
    onboardingRetryRef.current = null;
    autoAnalyzeAfterOnboardingRef.current = false;
    clearPendingAnalysisMarker();
    resetAutomaticAnalysis();
    setOnboardingError(null);
    setCurrentStep(0);
    setOnboardingResumeMarker(selectedIdea.id, 0);
    setOnboardingActive(true);
  }, [clearPendingAnalysisMarker, replaceOnboardingAnswers, resetAutomaticAnalysis, saveState, selectedIdea, setOnboardingResumeMarker]);

  const handleOnboardingAnswerChange = useCallback(
    (stepId: IdeaOnboardingStepId, value: string) => {
      if (onboardingSaveLockRef.current) return;
      const nextAnswers = { ...onboardingAnswersRef.current, [stepId]: value };
      replaceOnboardingAnswers(nextAnswers);
      onboardingRetryRef.current = null;
      setOnboardingError(null);
    },
    [replaceOnboardingAnswers],
  );

  const finishOnboarding = useCallback(() => {
    onboardingRetryRef.current = null;
    clearOnboardingResumeMarker();
    setOnboardingActive(false);
    setCurrentStep(0);
    setOnboardingError(null);
  }, [clearOnboardingResumeMarker]);

  const completeOnboarding = useCallback(
    (ideaId: string) => {
      finishOnboarding();
      if (autoAnalyzeAfterOnboardingRef.current) {
        queueInitialAnalysis(ideaId);
        autoAnalyzeAfterOnboardingRef.current = false;
      }
    },
    [finishOnboarding, queueInitialAnalysis],
  );

  const handleOnboardingContinue = useCallback(async () => {
    const step = IDEA_ONBOARDING_STEPS[currentStep];
    const ideaId = selectedIdeaIdRef.current;
    if (!step || !ideaId || onboardingSaving || onboardingSaveLockRef.current) return;
    const saved = await persistOnboardingAnswer(step.id, onboardingAnswersRef.current[step.id] ?? '');
    if (!saved || selectedIdeaIdRef.current !== ideaId) return;

    if (currentStep >= IDEA_ONBOARDING_STEPS.length - 1) {
      completeOnboarding(ideaId);
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setOnboardingResumeMarker(ideaId, nextStep, autoAnalyzeAfterOnboardingRef.current);
      setOnboardingError(null);
    }
  }, [completeOnboarding, currentStep, onboardingSaving, persistOnboardingAnswer, setOnboardingResumeMarker]);

  const handleOnboardingSkip = useCallback(() => {
    const ideaId = selectedIdeaIdRef.current;
    if (!ideaId || onboardingSaving || onboardingSaveLockRef.current) return;
    onboardingRetryRef.current = null;
    setSaveState('saved');
    setSaveError(null);
    if (currentStep >= IDEA_ONBOARDING_STEPS.length - 1) {
      completeOnboarding(ideaId);
    } else {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setOnboardingResumeMarker(ideaId, nextStep, autoAnalyzeAfterOnboardingRef.current);
      setOnboardingError(null);
    }
  }, [completeOnboarding, currentStep, onboardingSaving, setOnboardingResumeMarker]);

  const handleOnboardingBack = useCallback(() => {
    const ideaId = selectedIdeaIdRef.current;
    if (!ideaId || onboardingSaving || onboardingSaveLockRef.current || currentStep === 0) return;
    onboardingRetryRef.current = null;
    setSaveState('saved');
    setSaveError(null);
    const nextStep = Math.max(0, currentStep - 1);
    setCurrentStep(nextStep);
    setOnboardingResumeMarker(ideaId, nextStep, autoAnalyzeAfterOnboardingRef.current);
    setOnboardingError(null);
  }, [currentStep, onboardingSaving, setOnboardingResumeMarker]);

  const selectIdea = useCallback(
    async (id: string) => {
      if (
        !anonymousUserId ||
        id === selectedIdeaIdRef.current ||
        onboardingSaveLockRef.current ||
        analysisRequestRef.current ||
        activeAnalysisRef.current
      )
        return;
      if (onboardingResumeRef.current?.ideaId !== id) clearOnboardingResumeMarker();
      if (pendingAnalysisResumeRef.current?.ideaId !== id) clearPendingAnalysisMarker();
      clearPendingSave();
      selectedIdeaIdRef.current = id;
      setSelectedIdeaId(id);
      setSelectedIdea(null);
      setOnboardingActive(false);
      setCurrentStep(0);
      const emptyAnswers = createEmptyIdeaOnboardingAnswers();
      onboardingPersistedAnswersRef.current = emptyAnswers;
      replaceOnboardingAnswers(emptyAnswers);
      onboardingRetryRef.current = null;
      setOnboardingError(null);
      autoAnalyzeAfterOnboardingRef.current = false;
      resetAutomaticAnalysis();
      setLoadingIdea(true);
      setWorkspaceError(null);
      setActionError(null);
      activeChatRef.current = null;
      activeActionRef.current = null;
      setActionPending(null);
      setActionProgress(null);
      setLastFailedAction(null);
      setLastFailedChat(null);
      setChatText('');
      setChatProgress(null);
      setStreamingText('');
      setResearchContent('');
      setResearchHits([]);
      setPromptContent('');
      setMvpContent('');
      ideaAbortRef.current?.abort();
      const controller = new AbortController();
      ideaAbortRef.current = controller;
      try {
        const detail = await getIdea(anonymousUserId, id, controller.signal);
        if (selectedIdeaIdRef.current === id) {
          const answers = readIdeaOnboardingAnswers(detail);
          onboardingPersistedAnswersRef.current = answers;
          replaceOnboardingAnswers(answers);
          applyIdeaDetail(detail);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setWorkspaceError(errorText(error, 'Could not load this idea.'));
      } finally {
        if (!controller.signal.aborted && selectedIdeaIdRef.current === id) {
          setLoadingIdea(false);
        }
      }
    },
    [anonymousUserId, applyIdeaDetail, clearOnboardingResumeMarker, clearPendingAnalysisMarker, clearPendingSave, replaceOnboardingAnswers, resetAutomaticAnalysis],
  );

  const onboardingResumeExists = onboardingResume
    ? ideas.some((idea) => idea.id === onboardingResume.ideaId)
    : false;

  useEffect(() => {
    if (!onboardingResume || loadingIdeas) return;
    if (!onboardingResumeExists) {
      const clearTimer = window.setTimeout(() => clearOnboardingResumeMarker(), 0);
      return () => window.clearTimeout(clearTimer);
    }
    if (selectedIdeaIdRef.current || onboardingResumeInProgressRef.current) return;

    const resume = onboardingResume;
    onboardingResumeRef.current = resume;
    onboardingResumeInProgressRef.current = true;
    void (async () => {
      await selectIdea(resume.ideaId);
      if (selectedIdeaIdRef.current === resume.ideaId) {
        setCurrentStep(resume.stepIndex);
        setOnboardingActive(true);
        setOnboardingError(null);
        autoAnalyzeAfterOnboardingRef.current = resume.autoAnalyze;
        resetAutomaticAnalysis();
      }
      onboardingResumeInProgressRef.current = false;
    })();
  }, [clearOnboardingResumeMarker, loadingIdeas, onboardingResume, onboardingResumeExists, resetAutomaticAnalysis, selectIdea]);

  const pendingAnalysisExists = pendingAnalysisResume
    ? ideas.some((idea) => idea.id === pendingAnalysisResume.ideaId)
    : false;

  useEffect(() => {
    if (!pendingAnalysisResume || loadingIdeas) return;
    if (!pendingAnalysisExists) {
      const clearTimer = window.setTimeout(() => clearPendingAnalysisMarker(), 0);
      return () => window.clearTimeout(clearTimer);
    }
    if (selectedIdeaIdRef.current || pendingAnalysisResumeInProgressRef.current) return;

    const pending = pendingAnalysisResume;
    pendingAnalysisResumeRef.current = pending;
    pendingAnalysisResumeInProgressRef.current = true;
    void (async () => {
      await selectIdea(pending.ideaId);
      if (selectedIdeaIdRef.current === pending.ideaId) {
        queueInitialAnalysis(pending.ideaId);
      }
      pendingAnalysisResumeInProgressRef.current = false;
    })();
  }, [clearPendingAnalysisMarker, loadingIdeas, pendingAnalysisExists, pendingAnalysisResume, queueInitialAnalysis, selectIdea]);

  const createNewIdea = useCallback(async () => {
    if (
      !anonymousUserId ||
      creating ||
      onboardingSaveLockRef.current ||
      analysisRequestRef.current ||
      activeAnalysisRef.current
    )
      return;
    clearPendingSave();
    clearPendingAnalysisMarker();
    autoAnalyzeAfterOnboardingRef.current = false;
    onboardingRetryRef.current = null;
    setOnboardingError(null);
    setCreating(true);
    setWorkspaceError(null);
    setActionError(null);
    try {
      const detail = await createIdea(anonymousUserId);
      selectedIdeaIdRef.current = detail.id;
      setSelectedIdeaId(detail.id);
      setSelectedIdea(detail);
      const emptyAnswers = createEmptyIdeaOnboardingAnswers();
      onboardingPersistedAnswersRef.current = emptyAnswers;
      replaceOnboardingAnswers(emptyAnswers);
      onboardingRetryRef.current = null;
      setCurrentStep(0);
      setOnboardingResumeMarker(detail.id, 0, true);
      setOnboardingError(null);
      setOnboardingActive(true);
      autoAnalyzeAfterOnboardingRef.current = true;
      resetAutomaticAnalysis();
      setIdeas((current) => [toSummary(detail), ...current]);
      activeChatRef.current = null;
      activeActionRef.current = null;
      setActionPending(null);
      setActionProgress(null);
      setLastFailedAction(null);
      setLastFailedChat(null);
      setResearchContent('');
      setResearchHits([]);
      setPromptContent('');
      setMvpContent('');
      setChatText('');
      setChatProgress(null);
      setStreamingText('');
      setSaveState('saved');
      setOnboardingSaving(false);
    } catch (error) {
      setOnboardingActive(false);
      setWorkspaceError(errorText(error, 'Could not create a new idea.'));
    } finally {
      setCreating(false);
    }
  }, [anonymousUserId, clearPendingAnalysisMarker, clearPendingSave, creating, replaceOnboardingAnswers, resetAutomaticAnalysis, setOnboardingResumeMarker]);

  const refreshIdea = useCallback(
    async (id: string) => {
      const userId = anonymousUserIdRef.current;
      if (!userId) return;
      try {
        const detail = await getIdea(userId, id);
        if (selectedIdeaIdRef.current === id) applyIdeaDetail(detail);
      } catch (error) {
        if (selectedIdeaIdRef.current === id) {
          setWorkspaceError(errorText(error, 'The idea changed, but could not be refreshed.'));
        }
      }
    },
    [applyIdeaDetail],
  );

  const handleSocketEvent = useCallback(
    (event: IdeasSocketEvent) => {
      if (event.type === 'ready') {
        setCapabilities(event.capabilities);
        return;
      }

      if (event.type === 'error') {
        const activeAnalysis = activeAnalysisRef.current;
        if (activeAnalysis && event.requestId === activeAnalysis.requestId) {
          const failedIdeaId = activeAnalysis.ideaId;
          analysisRequestRef.current = null;
          activeAnalysisRef.current = null;
          clearPendingAnalysisMarker();
          setInitialAnalysisRequest(null);
          setAnalysisPending(false);
          setAnalysisStage(null);
          setAnalysisStatusMessage(null);
          setStreamingText('');
          setAnalysisError(event.message);
          setSaveState('saved');
          void refreshIdea(failedIdeaId);
          return;
        }
        const activeChat = activeChatRef.current;
        const activeAction = activeActionRef.current;
        if (activeChat && event.requestId === activeChat.requestId) {
          setChatPending(false);
          setChatProgress(null);
          setLastFailedChat({
            content: activeChat.content,
            temporaryMessageId: activeChat.temporaryMessageId,
          });
          setStreamingText('');
          setSaveState('saved');
          activeChatRef.current = null;
        }
        if (activeAction && event.requestId === activeAction.requestId) {
          setActionPending(null);
          setActionProgress(null);
          setLastFailedAction(activeAction.action);
          activeActionRef.current = null;
        }
        setActionError(event.message);
        if (event.code === 'research_unavailable') {
          setCapabilities((current) => (current ? { ...current, research: false } : current));
        }
        return;
      }

      if (event.type === 'chat.start') {
        setChatPending(true);
        setChatProgress(null);
        setLastFailedChat(null);
        setStreamingText('');
        setActionError(null);
        return;
      }

      if (event.type === 'chat.progress') {
        if (event.requestId !== activeChatRef.current?.requestId) return;
        setChatProgress(event.message);
        return;
      }

      if (event.type === 'chat.delta') {
        if (event.requestId !== activeChatRef.current?.requestId) return;
        setStreamingText((current) => current + event.token);
        return;
      }

      if (event.type === 'chat.done') {
        const request = activeChatRef.current;
        if (!request || event.requestId !== request.requestId) return;
        setChatPending(false);
        setChatProgress(null);
        setLastFailedChat(null);
        setStreamingText('');
        setSaveState('saved');
        activeChatRef.current = null;
        if (!event.content.trim()) {
          setActionError('The AI returned an empty response. Please try again.');
          return;
        }
        const now = new Date().toISOString();
        setSelectedIdea((current) => {
          if (!current) return current;
          const withoutTemporary = current.messages.filter(
            (message) => message.id !== request.temporaryMessageId,
          );
          const userMessage: IdeaMessage = {
            id: event.userMessageId,
            role: 'user',
            kind: 'chat',
            content: request.content,
            createdAt: now,
          };
          const assistantMessage: IdeaMessage = {
            id: event.assistantMessageId,
            role: 'assistant',
            kind: 'chat',
            content: event.content,
            createdAt: now,
          };
          return {
            ...current,
            messages: [
              ...withoutTemporary.filter(
                (message) => message.id !== userMessage.id && message.id !== assistantMessage.id,
              ),
              userMessage,
              assistantMessage,
            ],
          };
        });
        activeChatRef.current = null;
        return;
      }

      if (event.type === 'analysis.start') {
        const request = activeAnalysisRef.current;
        if (!request || event.requestId !== request.requestId || event.ideaId !== request.ideaId) return;
        setAnalysisPending(true);
        setAnalysisStage('starting');
        setAnalysisStatusMessage('Analyzing your idea...');
        setAnalysisError(null);
        setStreamingText('');
        return;
      }

      if (event.type === 'analysis.progress') {
        const request = activeAnalysisRef.current;
        if (!request || event.requestId !== request.requestId || event.ideaId !== request.ideaId) return;
        setAnalysisStage(event.stage);
        setAnalysisStatusMessage(event.message);
        setAnalysisPending(true);
        return;
      }

      if (event.type === 'analysis.title') {
        const request = activeAnalysisRef.current;
        if (!request || event.requestId !== request.requestId || event.ideaId !== request.ideaId) return;
        const title = event.title.trim();
        if (!title) return;
        setSelectedIdea((current) => (current ? { ...current, title } : current));
        setIdeas((current) =>
          current.map((idea) => (idea.id === event.ideaId ? { ...idea, title } : idea)),
        );
        return;
      }

      if (event.type === 'analysis.delta') {
        const request = activeAnalysisRef.current;
        if (!request || event.requestId !== request.requestId || event.ideaId !== request.ideaId) return;
        setStreamingText((current) => current + event.token);
        return;
      }

      if (event.type === 'analysis.done') {
        const request = activeAnalysisRef.current;
        if (!request || event.requestId !== request.requestId || event.ideaId !== request.ideaId) return;

        analysisRequestRef.current = null;
        activeAnalysisRef.current = null;
        clearPendingAnalysisMarker();
        setInitialAnalysisRequest(null);
        setAnalysisPending(false);
        setAnalysisStage(null);
        setAnalysisStatusMessage(null);
        setStreamingText('');
        setAnalysisError(null);
        setSaveState('saved');
        setSaveError(null);

        const payload = event.payload;
        if (!payload.content.trim()) {
          setAnalysisError('The AI returned an empty analysis. Your idea is saved; please retry.');
          return;
        }

        const assistantMessage: IdeaMessage = {
          id: payload.assistantMessageId,
          role: 'assistant',
          kind: 'analysis',
          content: payload.content,
          createdAt: new Date().toISOString(),
        };
        setSelectedIdea((current) => {
          if (!current) return current;
          return {
            ...current,
            title: payload.title,
            status: payload.status,
            messages: [
              ...current.messages.filter((message) => message.id !== assistantMessage.id),
              assistantMessage,
            ],
          };
        });
        setIdeas((current) =>
          current.map((idea) =>
            idea.id === event.ideaId
              ? { ...idea, title: payload.title, status: payload.status }
              : idea,
          ),
        );

        if (payload.research) {
          setResearchContent(payload.research.analysis);
          setResearchHits(payload.research.hits);
          setAnalysisNotice(null);
        } else {
          setResearchContent('');
              setResearchHits([]);
          setAnalysisNotice(
            payload.researchMessage ??
              'Live research was not completed. The response below is analysis without current external research.',
          );
        }
        void refreshIdea(event.ideaId);
        return;
      }

      if (event.type === 'action.start') {
        setActionPending(event.action);
        setActionProgress(null);
        setLastFailedAction(null);
        setActionError(null);
        return;
      }

      if (event.type === 'action.progress') {
        const request = activeActionRef.current;
        if (!request || event.requestId !== request.requestId || request.action !== event.action) return;
        setActionProgress(event.message);
        return;
      }

      if (event.type === 'action.done') {
        const request = activeActionRef.current;
        if (!request || event.requestId !== request.requestId) return;
        setActionPending(null);
        setActionProgress(null);
        setLastFailedAction(null);
        activeActionRef.current = null;
        setSaveState('saved');

        if (event.action === 'research') {
          const payload = event.payload as { analysis?: string; query?: string; hits?: IdeaResearchHit[] };
          const analysis = payload.analysis?.trim() || '';
          const hits = Array.isArray(payload.hits) ? payload.hits : [];
          setResearchContent(analysis);
          setResearchHits(hits);
          setAnalysisNotice(null);
          if (!analysis && hits.length === 0) {
            setActionError('Research completed without an analysis or sources. Please try again.');
          }
        } else if (event.action === 'prompt') {
          const payload = event.payload as { content?: string };
          const content = payload.content?.trim() || '';
          setPromptContent(content);
          if (!content) setActionError('The AI returned an empty build prompt. Please try again.');
        } else {
          const payload = event.payload as { content?: string };
          const content = payload.content?.trim() || '';
          setMvpContent(content);
          if (!content) setActionError('The AI returned an empty MVP document. Please try again.');
        }
        void refreshIdea(event.ideaId);
      }
    },
    [clearPendingAnalysisMarker, refreshIdea],
  );

  const { status: socketStatus, send: sendSocket, reconnect } = useIdeasSocket({
    anonymousUserId,
    onEvent: handleSocketEvent,
  });

  useEffect(() => {
    const request = initialAnalysisRequest;
    if (!request || request.ideaId !== selectedIdeaId || activeAnalysisRef.current) return;
    if (socketStatus !== 'connected' || !anonymousUserId) return;

    activeAnalysisRef.current = request;
    const sent = sendSocket({
      type: 'analyze',
      requestId: request.requestId,
      ideaId: request.ideaId,
      anonymousUserId: anonymousUserId ?? '',
    });
    if (!sent) {
      window.setTimeout(() => {
        if (analysisRequestRef.current?.requestId !== request.requestId) return;
        analysisRequestRef.current = null;
        activeAnalysisRef.current = null;
        clearPendingAnalysisMarker();
        setInitialAnalysisRequest(null);
        setAnalysisPending(false);
        setAnalysisStage(null);
        setAnalysisStatusMessage(null);
        setAnalysisError('The AI connection closed before the automatic analysis could start. Your idea is saved; retry when connected.');
      }, 0);
    }
  }, [anonymousUserId, clearPendingAnalysisMarker, initialAnalysisRequest, selectedIdeaId, sendSocket, socketStatus]);

  const sendChat = useCallback((contentOverride?: string, retryTemporaryMessageId?: string) => {
    const content = (contentOverride ?? chatText).trim();
    const retry = Boolean(retryTemporaryMessageId);
    const idea = selectedIdea;
    const userId = anonymousUserId;
    if (!content || !idea || !userId || chatPending || analysisPending) return;
    if (socketStatus !== 'connected') {
      setActionError('The AI connection is not ready. Reconnect and try again.');
      return;
    }
    if (capabilities?.ai === false) {
      setActionError('AI is not configured on this server yet.');
      return;
    }

    const requestId = createClientRequestId();
    const temporaryMessageId = `local-${requestId}`;
    const now = new Date().toISOString();
    const userMessage: IdeaMessage = {
      id: temporaryMessageId,
      role: 'user',
      kind: 'chat',
      content,
      createdAt: now,
    };
    setSelectedIdea((current) =>
      current ? { ...current, messages: [...current.messages, userMessage] } : current,
    );
    setChatText('');
    setStreamingText('');
    setChatProgress(null);
    setLastFailedChat(null);
    setChatPending(true);
    setActionError(null);
    activeChatRef.current = { requestId, temporaryMessageId, content };
    const sent = sendSocket({
      type: 'chat',
      requestId,
      ideaId: idea.id,
      anonymousUserId: userId,
      content,
      retry,
    });
    if (sent && retryTemporaryMessageId) {
      setSelectedIdea((current) =>
        current
          ? {
              ...current,
              messages: current.messages.filter(
                (message) => message.id !== retryTemporaryMessageId,
              ),
            }
          : current,
      );
    }
    if (!sent) {
      activeChatRef.current = null;
      setSelectedIdea((current) =>
        current
          ? {
              ...current,
              messages: current.messages.filter(
                (message) => message.id !== temporaryMessageId,
              ),
            }
          : current,
      );
      setChatPending(false);
      setActionError('The AI connection closed before the message was sent. Please try again.');
    }
  }, [analysisPending, anonymousUserId, capabilities?.ai, chatPending, chatText, selectedIdea, sendSocket, socketStatus]);

  const runAction = useCallback(
    (action: ActionKind) => {
      const idea = selectedIdea;
      const userId = anonymousUserId;
      if (!idea || !userId || actionPending || analysisPending) return;
      if (socketStatus !== 'connected') {
        setActionError('The AI connection is not ready. Reconnect and try again.');
        return;
      }
      if (action === 'research' && capabilities?.research === false) {
        setActionError('Research is unavailable because Firecrawl credentials are not configured on the server.');
        return;
      }
      if (action !== 'research' && capabilities?.ai === false) {
        setActionError('AI is not configured on this server yet.');
        return;
      }

      const requestId = createClientRequestId();
      activeActionRef.current = { requestId, action };
      setActionPending(action);
      setActionProgress(null);
      setLastFailedAction(null);
      setActionError(null);
      if (
        !sendSocket({
          type: action,
          requestId,
          ideaId: idea.id,
          anonymousUserId: userId,
        })
      ) {
        activeActionRef.current = null;
        setActionPending(null);
        setActionProgress(null);
        setLastFailedAction(action);
        setActionError('The AI connection closed before the action could start.');
      }
    },
    [actionPending, analysisPending, anonymousUserId, capabilities?.ai, capabilities?.research, selectedIdea, sendSocket, socketStatus],
  );

  const handleComposerSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendChat();
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendChat();
    }
  };

  const handleDelete = useCallback(async () => {
    const ideaId = selectedIdeaIdRef.current;
    const userId = anonymousUserIdRef.current;
    if (
      !ideaId ||
      !userId ||
      deletePending ||
      onboardingSaveLockRef.current ||
      analysisRequestRef.current ||
      activeAnalysisRef.current
    )
      return;
    setDeletePending(true);
    setWorkspaceError(null);
    try {
      await deleteIdea(userId, ideaId);
      setListError(null);
      setIdeas((current) => current.filter((idea) => idea.id !== ideaId));
      if (onboardingResumeRef.current?.ideaId === ideaId) clearOnboardingResumeMarker();
      if (pendingAnalysisResumeRef.current?.ideaId === ideaId) clearPendingAnalysisMarker();
      selectedIdeaIdRef.current = null;
      setSelectedIdeaId(null);
      setSelectedIdea(null);
      autoAnalyzeAfterOnboardingRef.current = false;
      resetAutomaticAnalysis();
      setActionPending(null);
      setActionProgress(null);
      setLastFailedAction(null);
      setLastFailedChat(null);
      setOnboardingActive(false);
      setCurrentStep(0);
      const emptyAnswers = createEmptyIdeaOnboardingAnswers();
      onboardingPersistedAnswersRef.current = emptyAnswers;
      replaceOnboardingAnswers(emptyAnswers);
      onboardingRetryRef.current = null;
      setOnboardingError(null);
      setOnboardingSaving(false);
      setResearchContent('');
      setResearchHits([]);
      setPromptContent('');
      setMvpContent('');
      setChatText('');
      setChatProgress(null);
      setStreamingText('');
      setDeleteOpen(false);
    } catch (error) {
      setWorkspaceError(errorText(error, 'Could not delete this idea.'));
    } finally {
      setDeletePending(false);
    }
  }, [clearOnboardingResumeMarker, clearPendingAnalysisMarker, deletePending, replaceOnboardingAnswers, resetAutomaticAnalysis]);

  const chatMessages = useMemo(
    () =>
      selectedIdea?.messages.filter(
        (message) => (message.kind === 'chat' || message.kind === 'analysis') && message.content.trim(),
      ) ?? [],
    [selectedIdea?.messages],
  );

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages.length, selectedIdeaId, streamingText]);

  const socketLabel =
    socketStatus === 'connected'
      ? 'AI connected'
      : socketStatus === 'connecting'
        ? 'Connecting to AI'
        : socketStatus === 'error'
          ? 'AI connection error'
          : 'AI offline';

  const actionDisabled =
    !selectedIdea || socketStatus !== 'connected' || actionPending !== null || analysisPending;
  const chatDisabled =
    !selectedIdea || socketStatus !== 'connected' || chatPending || analysisPending || capabilities?.ai === false;

  return (
    <div className='layout-container flex min-h-[calc(100vh-4rem)] flex-col py-6 sm:py-8'>
      <div className='mb-5 flex flex-col gap-1 border-b border-border pb-4'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Ideas</h1>
            <p className='mt-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground'>
              Think it through. Research it. Build the first version.
            </p>
          </div>
          <div className='flex items-center gap-2 font-mono text-[10px] text-muted-foreground'>
            <span
              className={cn(
                'size-1.5 rounded-full',
                socketStatus === 'connected'
                  ? 'bg-emerald-500'
                  : socketStatus === 'connecting'
                    ? 'animate-pulse bg-amber-500'
                    : 'bg-muted-foreground/50',
              )}
            />
            {socketLabel}
            {(socketStatus === 'disconnected' || socketStatus === 'error') && (
              <Button type='button' variant='ghost' size='xs' onClick={reconnect}>
                Reconnect
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className='grid min-h-[680px] flex-1 gap-4 lg:grid-cols-2'>
        <aside className='flex min-h-0 flex-col rounded-xl border border-border/70 bg-card/50'>
          <div className='flex items-center justify-between gap-2 border-b border-border/70 p-3'>
            <div>
              <h2 className='text-sm font-semibold'>Saved ideas</h2>
              <p className='font-mono text-[10px] text-muted-foreground'>{ideas.length} total</p>
            </div>
            <Button type='button' size='sm' onClick={() => void createNewIdea()} disabled={creating || onboardingSaving || analysisPending}>
              {creating ? <Icons.spinner className='size-3.5 animate-spin' /> : <Icons.add className='size-3.5' />}
              Create Idea
            </Button>
          </div>

          <div className='min-h-0 flex-1 overflow-y-auto p-2'>
            {loadingIdeas ? (
              <div className='space-y-2'>
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className='h-20 w-full' />
                ))}
              </div>
            ) : listError ? (
              <div className='flex flex-col items-center gap-3 px-3 py-8 text-center'>
                <p className='text-xs text-muted-foreground'>{listError}</p>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => anonymousUserId && void loadIdeas(anonymousUserId)}
                >
                  Try again
                </Button>
              </div>
            ) : ideas.length === 0 ? (
              <div className='px-3 py-8 text-center'>
                <p className='text-xs leading-relaxed text-muted-foreground'>
                  Your saved ideas will appear here. Start with a rough problem and let the assistant help you shape it.
                </p>
              </div>
            ) : (
              <div className='flex flex-col gap-1'>
                {ideas.map((idea) => (
                  <IdeaListItem
                    key={idea.id}
                    idea={idea}
                    selected={idea.id === selectedIdeaId}
                    onSelect={() => void selectIdea(idea.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className='flex min-h-0 min-w-0 flex-col rounded-xl border border-border/70 bg-card/40'>
          {!selectedIdea ? (
            <div className='flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center'>
              <div className='flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary'>
                <Icons.sparkles className='size-7' />
              </div>
              <div className='max-w-md space-y-2'>
                <h2 className='text-xl font-semibold tracking-tight'>What are you thinking about?</h2>
                <p className='text-sm leading-relaxed text-muted-foreground'>
                  Create an idea and start with one simple question. Tell the assistant what problem you want to solve; it will help you clarify, challenge, research, and build it.
                </p>
              </div>
              {workspaceError && (
                <Alert variant='destructive' className='max-w-md text-left'>
                  <Icons.warning />
                  <AlertTitle>Could not load the workspace</AlertTitle>
                  <AlertDescription>{workspaceError}</AlertDescription>
                </Alert>
              )}
              <Button type='button' onClick={() => void createNewIdea()} disabled={creating || onboardingSaving || analysisPending}>
                {creating ? <Icons.spinner className='size-4 animate-spin' /> : <Icons.add className='size-4' />}
                Create Idea
              </Button>
            </div>
          ) : loadingIdea ? (
            <div className='space-y-4 p-5'>
              <Skeleton className='h-10 w-2/3' />
              <Skeleton className='h-20 w-full' />
              <Skeleton className='h-64 w-full' />
            </div>
          ) : (
            <>
              <div className='flex flex-wrap items-start justify-between gap-3 border-b border-border/70 p-4'>
                <div className='min-w-0 flex-1'>
                  {onboardingActive ? (
                    <div className='truncate px-0 text-lg font-semibold'>New idea</div>
                  ) : (
                    <Input
                      value={selectedIdea.title ?? ''}
                      onChange={(event) => updateIdeaField('title', event.target.value)}
                      placeholder='Untitled idea'
                      aria-label='Idea title'
                      disabled={analysisPending}
                      className='h-9 border-transparent bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:ring-0'
                    />
                  )}
                  <div className='mt-1 flex flex-wrap items-center gap-2'>
                    <Badge variant='outline' className='font-mono text-[9px] uppercase'>
                      {selectedIdea.status === 'DRAFT' ? 'Draft' : 'Saved idea'}
                    </Badge>
                    <IdeaSaveIndicator state={saveState} error={saveError} onRetry={retrySave} />
                  </div>
                </div>
                <div className='flex items-center gap-1'>
                  {!onboardingActive && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={startOnboarding}
                      disabled={saveState === 'saving' || analysisPending}
                    >
                      <Icons.edit className='size-3.5' />
                      Edit context
                    </Button>
                  )}
                  {!onboardingActive &&
                    !analysisError &&
                    selectedIdea.status === 'DRAFT' &&
                    Boolean(selectedIdea.description?.trim()) && (
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => queueInitialAnalysis(selectedIdea.id)}
                        disabled={analysisPending}
                      >
                        <Icons.sparkles className='size-3.5' />
                        Analyze idea
                      </Button>
                    )}
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='text-muted-foreground hover:text-destructive'
                    disabled={onboardingSaving || analysisPending || deletePending}
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Icons.trash className='size-3.5' />
                    Delete
                  </Button>
                </div>
              </div>

              {onboardingActive ? (
                <IdeaOnboarding
                  stepIndex={currentStep}
                  answers={onboardingAnswers}
                  saving={onboardingSaving}
                  error={onboardingError}
                  onAnswerChange={handleOnboardingAnswerChange}
                  onContinue={handleOnboardingContinue}
                  onSkip={handleOnboardingSkip}
                  onBack={handleOnboardingBack}
                />
              ) : (
                <div className='flex min-h-0 flex-1 flex-col'>
                  <div className='border-b border-border/70 px-4 pb-4'>
                    <Textarea
                      value={selectedIdea.description ?? ''}
                      onChange={(event) => updateIdeaField('description', event.target.value)}
                      placeholder='Describe the rough idea in your own words. You can leave this blank and let the conversation guide you.'
                      aria-label='Idea description'
                      disabled={analysisPending}
                      rows={3}
                      className='resize-none bg-transparent text-sm'
                    />
                  </div>

              {workspaceError && (
                <div className='px-4 pt-4'>
                  <Alert variant='destructive'>
                    <Icons.warning />
                    <AlertTitle>Something went wrong</AlertTitle>
                    <AlertDescription>{workspaceError}</AlertDescription>
                  </Alert>
                </div>
              )}

              {capabilities?.ai === false && (
                <div className='px-4 pt-4'>
                  <Alert>
                    <Icons.info />
                    <AlertTitle>AI is unavailable</AlertTitle>
                    <AlertDescription>
                      AI is not configured on this server, so chat and generated outputs are unavailable. Your idea is still saved locally through the Ideas API.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {capabilities?.research === false && (
                <div className='px-4 pt-4'>
                  <Alert>
                    <Icons.info />
                    <AlertTitle>Research is unavailable</AlertTitle>
                    <AlertDescription>
                      Firecrawl is not configured on this server. Automatic analysis will be clearly labeled as analysis without live research; you can still use chat, Create Prompt, and Create MVP when AI is available.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {analysisNotice && capabilities?.research !== false && (
                <div className='px-4 pt-4'>
                  <Alert>
                    <Icons.info />
                    <AlertTitle>Analysis without live research</AlertTitle>
                    <AlertDescription>{analysisNotice}</AlertDescription>
                  </Alert>
                </div>
              )}

              {analysisError && (
                <div className='space-y-2 px-4 pt-4'>
                  <Alert variant='destructive'>
                    <Icons.warning />
                    <AlertTitle>Automatic analysis unavailable</AlertTitle>
                    <AlertDescription>{analysisError}</AlertDescription>
                  </Alert>
                  <div className='flex justify-end'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => selectedIdea && queueInitialAnalysis(selectedIdea.id)}
                      disabled={analysisPending}
                    >
                      <Icons.sparkles className='size-3.5' />
                      Retry analysis
                    </Button>
                  </div>
                </div>
              )}

              {actionError && (
                <div className='space-y-2 px-4 pt-4'>
                  <Alert variant='destructive'>
                    <Icons.warning />
                    <AlertTitle>
                      {lastFailedChat || lastFailedAction ? 'AI request unavailable' : 'AI action unavailable'}
                    </AlertTitle>
                    <AlertDescription>{actionError}</AlertDescription>
                  </Alert>
                  {(lastFailedChat || lastFailedAction) && (
                    <div className='flex flex-wrap justify-end gap-2'>
                      {lastFailedChat && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() =>
                            sendChat(lastFailedChat.content, lastFailedChat.temporaryMessageId)
                          }
                          disabled={chatDisabled}
                        >
                          Retry question
                        </Button>
                      )}
                      {lastFailedAction && (
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          onClick={() => runAction(lastFailedAction)}
                          disabled={actionDisabled}
                        >
                          Retry {lastFailedAction === 'mvp' ? 'MVP' : lastFailedAction}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className='min-h-0 flex-1 overflow-y-auto px-4 py-5'>
                <div className='mx-auto flex max-w-3xl flex-col gap-4'>
                  {chatMessages.length === 0 && !streamingText && !analysisPending && (
                    <div className='rounded-2xl border border-primary/20 bg-primary/5 p-5'>
                      <span className='font-mono text-[10px] uppercase tracking-wider text-primary'>
                        Start here
                      </span>
                      <p className='mt-2 text-lg font-medium'>Your idea is ready to explore</p>
                      <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
                        Ask a follow-up, challenge an assumption, or use the build tools when you are ready.
                      </p>
                    </div>
                  )}

                  {chatMessages.map((message) => (
                    <IdeaMessageBubble key={message.id} message={message} />
                  ))}

                  {streamingText.trim() && (
                    <div className='flex max-w-[88%] flex-col gap-1'>
                      <span className='font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>
                        Idea assistant
                      </span>
                      <div className='rounded-2xl rounded-bl-sm border border-border/70 bg-muted/30 px-3.5 py-2.5 text-sm leading-relaxed'>
                        <MarkdownContent content={streamingText} />
                      </div>
                    </div>
                  )}

                  {chatPending && chatProgress && (
                    <div
                      role='status'
                      aria-live='polite'
                      className='flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 font-mono text-[11px] text-muted-foreground'
                    >
                      <Icons.spinner className='size-3.5 animate-spin text-primary' />
                      {chatProgress}
                    </div>
                  )}

                  {chatPending && !streamingText.trim() && !chatProgress && (
                    <div className='flex items-center gap-2 font-mono text-[11px] text-muted-foreground'>
                      <Icons.spinner className='size-3.5 animate-spin' />
                      Thinking...
                    </div>
                  )}

                  {analysisPending && (
                    <div
                      role='status'
                      aria-live='polite'
                      className='flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5'
                    >
                      <Icons.spinner className='mt-0.5 size-3.5 animate-spin text-primary' />
                      <div>
                        <span className='font-mono text-[10px] uppercase tracking-wider text-primary'>
                          Automatic analysis
                        </span>
                        <p className='mt-0.5 text-sm text-foreground'>
                          {analysisStatusMessage ??
                            (analysisStage === 'research'
                              ? 'Researching existing solutions...'
                              : analysisStage === 'analysis'
                                ? 'Challenging the idea and preparing your analysis...'
                                : 'Analyzing your idea...')}
                        </p>
                      </div>
                    </div>
                  )}

                  {actionPending && (
                    <div
                      role='status'
                      aria-live='polite'
                      className='flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 font-mono text-[11px] text-muted-foreground'
                    >
                      <Icons.spinner className='size-3.5 animate-spin' />
                      {actionProgress ??
                        (actionPending === 'research'
                          ? 'Researching the current idea...'
                          : actionPending === 'prompt'
                            ? 'Creating the build prompt...'
                            : 'Creating MVP.md...')}
                    </div>
                  )}

                  {(researchContent || researchHits.length > 0 || promptContent || mvpContent) && (
                    <div className='flex flex-col gap-4'>
                      {researchContent && (
                        <ResearchOutput analysis={researchContent} hits={researchHits} />
                      )}
                      {promptContent && <PromptOutput content={promptContent} />}
                      {mvpContent && <MvpOutput content={mvpContent} />}
                    </div>
                  )}

                  <div ref={conversationEndRef} />
                </div>
              </div>

              <form onSubmit={handleComposerSubmit} className='border-t border-border/70 p-4'>
                <div className='mx-auto flex max-w-3xl flex-col gap-2'>
                  <Textarea
                    value={chatText}
                    onChange={(event) => setChatText(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    disabled={chatDisabled}
                    placeholder={
                      capabilities?.ai === false
                        ? 'AI is unavailable on this server.'
                        : socketStatus !== 'connected'
                          ? 'Connecting to the AI...'
                          : 'Tell the assistant what problem you want to solve...'
                    }
                    aria-label='Message the idea assistant'
                    rows={3}
                    className='resize-none'
                  />
                  <div className='flex items-center justify-between gap-3'>
                    <span className='font-mono text-[10px] text-muted-foreground'>
                      Enter to send · Shift+Enter for a new line
                    </span>
                    <Button type='submit' size='sm' disabled={chatDisabled || !chatText.trim()}>
                      {chatPending ? <Icons.spinner className='size-3.5 animate-spin' /> : <Icons.arrowRight className='size-3.5' />}
                      Send
                    </Button>
                  </div>
                </div>
              </form>

              <div className='flex flex-wrap items-center gap-2 border-t border-border/70 bg-muted/10 px-4 py-3'>
                <span className='mr-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground'>
                  Build tools
                </span>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={actionDisabled}
                  onClick={() => runAction('research')}
                >
                  <Icons.search className='size-3.5' />
                  Research
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={actionDisabled}
                  onClick={() => runAction('prompt')}
                >
                  <Icons.sparkles className='size-3.5' />
                  Create Prompt
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={actionDisabled}
                  onClick={() => runAction('mvp')}
                >
                  <Icons.code className='size-3.5' />
                  Create MVP
                </Button>
              </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <Modal
        isOpen={deleteOpen}
        onClose={() => {
          if (!deletePending) setDeleteOpen(false);
        }}
        title='Delete this idea?'
        description='This permanently removes the idea, its conversation, research, prompt, and MVP. This cannot be undone.'
      >
        <div className='flex justify-end gap-2'>
          <Button type='button' variant='outline' onClick={() => setDeleteOpen(false)} disabled={deletePending}>
            Cancel
          </Button>
          <Button type='button' variant='destructive' onClick={() => void handleDelete()} disabled={deletePending}>
            {deletePending ? <Icons.spinner className='size-3.5 animate-spin' /> : <Icons.trash className='size-3.5' />}
            Delete idea
          </Button>
        </div>
      </Modal>
    </div>
  );
}
