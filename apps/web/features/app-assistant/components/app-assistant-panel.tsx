'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react';

import { Icons } from '@/components/icons';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getAnonymousUserId, createClientRequestId } from '@/lib/anonymous-id';
import {
  acceptAppAIPrompt,
  getAppAIWorkspace,
  type AppAIAction,
  type AppAICapabilities,
  type AppAIWorkspace,
  type AppAIMessage,
} from '@/lib/api/app-assistant';
import type { AppRecord } from '@/lib/api/types';
import { MvpOutput, ResearchOutput } from '@/features/ai-workspace/components/ai-output';
import { PromptActions } from '@/features/ai-workspace/components/prompt-actions';
import { cn } from '@/lib/utils';

import { useAppAISocket, type AppAISocketEvent } from '../hooks/use-app-assistant-socket';
import {
  AppAssistantMessageBubble,
  AssistantProgressCard,
  AssistantSkeletonLine,
  AssistantSuggestionButton,
} from './app-assistant-chat';

interface ActiveChat {
  requestId: string;
  temporaryMessageId: string;
  content: string;
}

interface ActiveAction {
  requestId: string;
  action: AppAIAction;
  instruction?: string;
}

interface FailedChat {
  content: string;
  temporaryMessageId: string;
}

export function AppAssistantPanel({ app }: { app: AppRecord }) {
  const [anonymousUserId, setAnonymousUserId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<AppAIWorkspace | null>(null);
  const [capabilities, setCapabilities] = useState<AppAICapabilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastFailedChat, setLastFailedChat] = useState<FailedChat | null>(null);
  const [lastFailedAction, setLastFailedAction] = useState<{ action: AppAIAction; instruction?: string } | null>(null);
  const [chatText, setChatText] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [chatActive, setChatActive] = useState(false);
  const [chatProgressMessage, setChatProgressMessage] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<AppAIAction | null>(null);
  const [progressMessage, setProgressMessage] = useState<string | null>(null);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState('');
  const [draftPrompt, setDraftPrompt] = useState('');
  const [promptEditing, setPromptEditing] = useState(false);
  const activeChatRef = useRef<ActiveChat | null>(null);
  const activeActionRef = useRef<ActiveAction | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadWorkspace = useCallback(
    async (ownerId: string, signal?: AbortSignal) => {
      const next = await getAppAIWorkspace(app.slug, ownerId, signal);
      if (!signal?.aborted) {
        setWorkspace(next);
      }
    },
    [app.slug],
  );

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const ownerId = getAnonymousUserId();
          if (!cancelled) setAnonymousUserId(ownerId);
          await loadWorkspace(ownerId, controller.signal);
        } catch (loadError) {
          if (!controller.signal.aborted) {
            setError(loadError instanceof Error ? loadError.message : 'Could not load the AI workspace.');
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadWorkspace]);

  const handleSocketEvent = useCallback(
    (event: AppAISocketEvent) => {
      if (event.type === 'ready') {
        setCapabilities(event.capabilities);
        return;
      }
      if (event.type === 'error') {
        setNotice(null);
        const chat = activeChatRef.current;
        const action = activeActionRef.current;
        if (chat && event.requestId === chat.requestId) {
          activeChatRef.current = null;
          setChatActive(false);
          setChatProgressMessage(null);
          setLastFailedChat({ content: chat.content, temporaryMessageId: chat.temporaryMessageId });
          setStreamingText('');
        }
        if (action && event.requestId === action.requestId) {
          activeActionRef.current = null;
          setActiveAction(null);
          setProgressMessage(null);
          setLastFailedAction({ action: action.action, instruction: action.instruction });
        }
        setError(event.message);
        return;
      }

      if (event.type === 'app.cancelled') {
        const chat = activeChatRef.current;
        const action = activeActionRef.current;
        if (event.kind === 'chat' && chat && event.requestId === chat.requestId) {
          activeChatRef.current = null;
          setChatActive(false);
          setChatProgressMessage(null);
          setLastFailedChat({ content: chat.content, temporaryMessageId: chat.temporaryMessageId });
          setStreamingText('');
        }
        if (event.kind !== 'chat' && action && event.requestId === action.requestId) {
          activeActionRef.current = null;
          setActiveAction(null);
          setProgressMessage(null);
          setLastFailedAction({ action: action.action, instruction: action.instruction });
        }
        setNotice('Generation stopped. You can retry when you are ready.');
        setError(null);
        return;
      }

      if (event.type === 'app.chat.start') {
        setLastFailedChat(null);
        setChatProgressMessage(null);
        setStreamingText('');
        setNotice(null);
        setError(null);
        return;
      }
      if (event.type === 'app.chat.progress') {
        const request = activeChatRef.current;
        if (!request || event.requestId !== request.requestId) return;
        setChatProgressMessage(event.message);
        return;
      }
      if (event.type === 'app.chat.delta') {
        const request = activeChatRef.current;
        if (!request || event.requestId !== request.requestId) return;
        setChatProgressMessage(null);
        setStreamingText((current) => current + event.token);
        return;
      }
      if (event.type === 'app.chat.done') {
        const request = activeChatRef.current;
        if (!request || event.requestId !== request.requestId) return;
        activeChatRef.current = null;
        setChatActive(false);
        setChatProgressMessage(null);
        setLastFailedChat(null);
        setNotice(null);
        setStreamingText('');
        setWorkspace((current) => {
          if (!current) return current;
          const withoutTemporary = current.messages.filter(
            (message) => message.id !== request.temporaryMessageId,
          );
          const now = new Date().toISOString();
          return {
            ...current,
            messages: [
              ...withoutTemporary,
              {
                id: event.userMessageId,
                role: 'user',
                kind: 'chat',
                content: request.content,
                createdAt: now,
              },
              {
                id: event.assistantMessageId,
                role: 'assistant',
                kind: 'chat',
                content: event.content,
                createdAt: now,
              },
            ],
          };
        });
        return;
      }

      if (event.type === 'app.action.start') {
        setActiveAction(event.action);
        setLastFailedAction(null);
        setNotice(null);
        setProgressMessage(
          event.action === 'research'
            ? 'Preparing live research...'
            : event.action === 'prompt'
              ? 'Preparing prompt refinement...'
              : 'Preparing the MVP specification...',
        );
        setError(null);
        return;
      }
      if (event.type === 'app.action.progress') {
        setProgressMessage(event.message);
        return;
      }
      if (event.type === 'app.action.done') {
        const request = activeActionRef.current;
        if (!request || event.requestId !== request.requestId || request.action !== event.action) return;
        activeActionRef.current = null;
        setActiveAction(null);
        setLastFailedAction(null);
        setNotice(null);
        setProgressMessage(null);
        if (event.action === 'research') {
          setWorkspace((current) => (current ? { ...current, research: event.payload } : current));
        } else if (event.action === 'prompt') {
          setWorkspace((current) => (current ? { ...current, refinedPrompt: event.payload } : current));
          setDraftPrompt(event.payload.content);
          setRefineOpen(true);
        } else {
          setWorkspace((current) => (current ? { ...current, mvp: event.payload } : current));
        }
        return;
      }
    },
    [],
  );

  const { status: socketStatus, send: sendSocket, reconnect } = useAppAISocket({
    appSlug: app.slug,
    anonymousUserId,
    onEvent: handleSocketEvent,
  });
  const chatMessages = workspace?.messages.filter((message) => message.kind === 'chat') ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatMessages.length, streamingText, progressMessage, chatProgressMessage]);

  const sendChat = useCallback(
    (contentOverride?: string, retryTemporaryMessageId?: string) => {
      const content = (contentOverride ?? chatText).trim();
      const retry = Boolean(retryTemporaryMessageId);
      if (!content || !anonymousUserId || socketStatus !== 'connected' || chatActive) return;
      const requestId = createClientRequestId();
      const temporaryMessageId = `local-${requestId}`;
      const now = new Date().toISOString();
      const optimistic: AppAIMessage = {
        id: temporaryMessageId,
        role: 'user',
        kind: 'chat',
        content,
        createdAt: now,
      };
      setWorkspace((current) =>
        current ? { ...current, messages: [...current.messages, optimistic] } : current,
      );
      setChatText('');
      setLastFailedChat(null);
      setLastFailedAction(null);
      setNotice(null);
      setStreamingText('');
      setChatProgressMessage(null);
      setError(null);
      activeChatRef.current = { requestId, temporaryMessageId, content };
      setChatActive(true);
      const sent = sendSocket({
        type: 'app.chat',
        requestId,
        appSlug: app.slug,
        anonymousUserId,
        content,
        retry,
      });
      if (sent && retryTemporaryMessageId) {
        setWorkspace((current) =>
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
        setChatActive(false);
        setWorkspace((current) =>
          current
            ? { ...current, messages: current.messages.filter((message) => message.id !== temporaryMessageId) }
            : current,
        );
        setError('The AI connection is not ready. Reconnect and try again.');
      }
    },
    [anonymousUserId, app.slug, chatActive, chatText, sendSocket, socketStatus],
  );

  const runAction = useCallback(
    (action: AppAIAction, instruction = '') => {
      if (!anonymousUserId || socketStatus !== 'connected' || activeAction) return;
      const requestId = createClientRequestId();
      activeActionRef.current = {
        requestId,
        action,
        instruction: action === 'prompt' ? instruction : undefined,
      };
      setActiveAction(action);
      setLastFailedChat(null);
      setNotice(null);
      setProgressMessage(
        action === 'research'
          ? 'Preparing live research...'
          : action === 'prompt'
            ? 'Preparing prompt refinement...'
            : 'Preparing the MVP specification...',
      );
      setError(null);
      const sent = sendSocket({
        type: `app.${action}`,
        requestId,
        appSlug: app.slug,
        anonymousUserId,
        content: action === 'prompt' ? instruction : undefined,
      });
      if (!sent) {
        activeActionRef.current = null;
        setActiveAction(null);
        setProgressMessage(null);
        setLastFailedAction({ action, instruction: action === 'prompt' ? instruction : undefined });
        setError('The AI connection is not ready. Reconnect and try again.');
      }
    },
    [activeAction, anonymousUserId, app.slug, sendSocket, socketStatus],
  );

  const stopChat = useCallback(() => {
    if (!anonymousUserId) return;
    const active = activeChatRef.current;
    if (!active) return;
    sendSocket({
      type: 'app.cancel',
      requestId: active.requestId,
      appSlug: app.slug,
      anonymousUserId,
    });
  }, [anonymousUserId, app.slug, sendSocket]);

  const stopAction = useCallback(() => {
    if (!anonymousUserId) return;
    const active = activeActionRef.current;
    if (!active) return;
    sendSocket({
      type: 'app.cancel',
      requestId: active.requestId,
      appSlug: app.slug,
      anonymousUserId,
    });
  }, [anonymousUserId, app.slug, sendSocket]);

  const acceptPrompt = useCallback(async () => {
    if (!workspace?.refinedPrompt || !anonymousUserId || !draftPrompt.trim()) return;
    setError(null);
    setNotice(null);
    try {
      const result = await acceptAppAIPrompt(
        app.slug,
        anonymousUserId,
        workspace.refinedPrompt.id,
        draftPrompt,
      );
      setWorkspace((current) =>
        current
          ? {
              ...current,
              app: { ...current.app, prompt: result.prompt },
              refinedPrompt: { ...current.refinedPrompt!, content: result.prompt, accepted: true },
            }
          : current,
      );
      setPromptEditing(false);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : 'Could not save the refined prompt.');
    }
  }, [anonymousUserId, app.slug, draftPrompt, workspace]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendChat();
  };

  const connected = socketStatus === 'connected' && capabilities?.ai === true;
  const chatDisabled = !connected || chatActive || !anonymousUserId;
  const actionDisabled = !connected || Boolean(activeAction) || !anonymousUserId;
  const researchDisabled = actionDisabled || capabilities?.research === false;

  return (
    <aside className='flex min-h-[680px] min-w-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card/60 lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]'>
      <div className='flex items-start justify-between gap-3 border-b border-border/70 px-4 py-3'>
        <div className='flex min-w-0 items-start gap-2.5'>
          <span className='flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <Icons.sparkles className='size-4' />
          </span>
          <div className='min-w-0'>
            <div className='flex items-center gap-2'>
              <h2 className='text-sm font-semibold'>AI Assistant</h2>
              <span className='flex items-center gap-1 font-mono text-[10px] text-muted-foreground'>
                <span className={cn('size-1.5 rounded-full', connected ? 'bg-emerald-500' : 'bg-muted-foreground/50')} />
                {connected ? 'Online' : capabilities?.ai === false ? 'Unavailable' : socketStatus === 'connecting' ? 'Connecting' : 'Offline'}
              </span>
            </div>
            <p className='mt-0.5 truncate text-[11px] text-muted-foreground'>
              I understand {app.name} and can help you analyze, research, and build it.
            </p>
          </div>
        </div>
        <Button type='button' variant='ghost' size='icon-sm' aria-label='AI assistant options'>
          <Icons.dots className='size-4' />
        </Button>
      </div>

      {chatMessages.length === 0 && !loading && (
        <div className='grid gap-2 border-b border-border/70 p-3 sm:grid-cols-3'>
          <AssistantSuggestionButton
            icon={Icons.sparkles}
            label='How can I improve this idea?'
            onClick={() => sendChat(`How can I improve the idea for ${app.name}?`)}
            disabled={chatDisabled}
          />
          <AssistantSuggestionButton
            icon={Icons.search}
            label='Research similar apps'
            onClick={() => runAction('research')}
            disabled={researchDisabled}
          />
          <AssistantSuggestionButton
            icon={Icons.code}
            label='What should the MVP include?'
            onClick={() => runAction('mvp')}
            disabled={actionDisabled}
          />
        </div>
      )}

      <div className='min-h-0 flex-1 overflow-y-auto px-4 py-4'>
        {loading ? (
          <div className='space-y-3'>
            <AssistantSkeletonLine />
            <AssistantSkeletonLine />
            <AssistantSkeletonLine />
          </div>
        ) : (
          <div className='flex flex-col gap-4'>
            {chatMessages.length === 0 && (
              <div className='rounded-2xl border border-primary/20 bg-primary/5 p-4'>
                <p className='text-sm leading-relaxed text-foreground'>
                  Ask about the problem, features, architecture, market, or the smallest useful version of {app.name}.
                </p>
                <p className='mt-2 text-xs leading-relaxed text-muted-foreground'>
                  The assistant uses the stored application context and never invents research results.
                </p>
              </div>
            )}
            {chatMessages.map((message) => <AppAssistantMessageBubble key={message.id} message={message} />)}
            {streamingText && (
              <div className='flex max-w-[92%] flex-col gap-1'>
                <span className='font-mono text-[9px] uppercase tracking-wider text-muted-foreground'>AI assistant</span>
                <div className='rounded-2xl rounded-bl-sm border border-border/70 bg-muted/30 px-3.5 py-2.5 text-sm leading-relaxed'>
                  <MarkdownContent content={streamingText} />
                </div>
                <Button type='button' variant='outline' size='sm' className='w-fit' onClick={stopChat}>
                  Stop
                </Button>
              </div>
            )}
            {chatActive && !streamingText && (
              <AssistantProgressCard message={chatProgressMessage ?? 'Thinking...'} onStop={stopChat} />
            )}
            {progressMessage && <AssistantProgressCard message={progressMessage} onStop={stopAction} />}
            {workspace?.research && (
              <ResearchOutput
                analysis={workspace.research.analysis}
                hits={workspace.research.hits}
              />
            )}
            {workspace?.refinedPrompt && (
              <section className='rounded-xl border border-border/70 bg-muted/20 p-3'>
                <div className='mb-2 flex items-center justify-between gap-2'>
                  <h3 className='text-sm font-semibold'>Refined prompt</h3>
                  <Badge variant='outline' className='font-mono text-[9px] uppercase'>
                    {workspace.refinedPrompt.accepted ? 'Accepted' : 'Preview'}
                  </Badge>
                </div>
                {promptEditing ? (
                  <Textarea
                    value={draftPrompt}
                    onChange={(event) => setDraftPrompt(event.target.value)}
                    rows={10}
                    className='resize-y bg-background/60 text-xs'
                  />
                ) : (
                  <pre className='max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border/60 bg-background/50 p-3 font-mono text-[11px] leading-relaxed'>
                    {draftPrompt || workspace.refinedPrompt.content}
                  </pre>
                )}
                <div className='mt-3 flex flex-wrap justify-end gap-2'>
                  {promptEditing ? (
                    <>
                      <Button type='button' variant='ghost' size='sm' onClick={() => setPromptEditing(false)}>
                        Cancel
                      </Button>
                      <Button type='button' size='sm' onClick={() => void acceptPrompt()} disabled={!draftPrompt.trim()}>
                        <Icons.check className='size-3.5' />
                        Accept changes
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() => {
                          setDraftPrompt(workspace.refinedPrompt?.content ?? '');
                          setPromptEditing(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button type='button' size='sm' onClick={() => void acceptPrompt()}>
                        <Icons.check className='size-3.5' />
                        Accept changes
                      </Button>
                    </>
                  )}
                </div>
                <div className='mt-3 border-t border-border/60 pt-3'>
                  <PromptActions prompt={draftPrompt || workspace.refinedPrompt.content} />
                </div>
              </section>
            )}
            {workspace?.mvp && <MvpOutput content={workspace.mvp.content} />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {refineOpen && (
        <div className='border-t border-border/70 bg-muted/10 p-3'>
          <label className='font-mono text-[10px] uppercase tracking-wider text-muted-foreground' htmlFor='refine-instruction'>
            What should the prompt improve?
          </label>
          <Textarea
            id='refine-instruction'
            value={refineInstruction}
            onChange={(event) => setRefineInstruction(event.target.value)}
            placeholder='Make this more focused for an MVP...'
            rows={2}
            className='mt-2 resize-none bg-background/60 text-xs'
          />
          <div className='mt-2 flex justify-end'>
            <Button type='button' size='sm' onClick={() => runAction('prompt', refineInstruction)} disabled={actionDisabled}>
              <Icons.sparkles className='size-3.5' />
              Refine prompt
            </Button>
          </div>
        </div>
      )}

      {capabilities?.ai === false && !error && !notice && (
        <div className='px-3 pt-3'>
          <Alert>
            <Icons.warning />
            <AlertTitle>AI is unavailable</AlertTitle>
            <AlertDescription>The server provider is not configured right now.</AlertDescription>
          </Alert>
        </div>
      )}

      {(error || notice) && (
        <div className='px-3 pt-3'>
          <Alert variant={error ? 'destructive' : 'default'}>
            <Icons.warning />
            <AlertTitle>{error ? 'AI assistant unavailable' : 'Generation stopped'}</AlertTitle>
            <AlertDescription>{error ?? notice}</AlertDescription>
          </Alert>
          {lastFailedChat && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='mt-2 w-full'
              onClick={() => sendChat(lastFailedChat.content, lastFailedChat.temporaryMessageId)}
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
              className='mt-2 w-full'
              onClick={() => runAction(lastFailedAction.action, lastFailedAction.instruction ?? '')}
              disabled={actionDisabled}
            >
              Retry {lastFailedAction.action === 'mvp' ? 'MVP' : lastFailedAction.action}
            </Button>
          )}
          {!connected && (
            <Button type='button' variant='outline' size='sm' className='mt-2 w-full' onClick={reconnect}>
              Reconnect
            </Button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className='border-t border-border/70 p-3'>
        <div className='flex items-end gap-2'>
          <Textarea
            value={chatText}
            onChange={(event) => setChatText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendChat();
              }
            }}
            disabled={chatDisabled}
            placeholder='Ask anything about this app...'
            aria-label='Ask the application AI assistant'
            rows={2}
            className='min-h-11 resize-none bg-background/60 text-sm'
          />
          <Button type='submit' size='icon' disabled={chatDisabled || !chatText.trim()} aria-label='Send message'>
            <Icons.send className='size-4' />
          </Button>
        </div>
      </form>

      <div className='grid grid-cols-3 gap-2 border-t border-border/70 bg-muted/10 p-3'>
        <Button type='button' variant='outline' size='sm' onClick={() => runAction('research')} disabled={researchDisabled}>
          <Icons.search className='size-3.5' />
          Research
        </Button>
        <Button type='button' variant='outline' size='sm' onClick={() => setRefineOpen(true)} disabled={actionDisabled}>
          <Icons.sparkles className='size-3.5' />
          Refine Prompt
        </Button>
        <Button type='button' variant='outline' size='sm' onClick={() => runAction('mvp')} disabled={actionDisabled}>
          <Icons.code className='size-3.5' />
          Create MVP
        </Button>
      </div>
    </aside>
  );
}
