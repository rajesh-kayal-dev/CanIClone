'use client';

import * as React from 'react';

import {
  IconAntigravity,
  IconClaude,
  IconCursor,
  IconOpenAI
} from '@/components/icons/agent-logos';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { AGENTS, buildAgentLaunchUrl, type AgentConfig, type AgentId } from '@/lib/agent-launch';

const AGENT_LOGOS: Record<AgentId, React.ComponentType<{ className?: string }>> = {
  claude: IconClaude,
  codex: IconOpenAI,
  cursor: IconCursor,
  antigravity: IconAntigravity
};

function isCoarsePointer(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
}

/** Window we give the OS to raise its "Open <app>?" dialog before assuming no app. */
const PROTOCOL_SETTLE_MS = 2500;

/**
 * Hands a custom protocol URL to the OS so the browser raises its native "Open <app>?"
 * dialog. This MUST be called synchronously inside the click handler (before any await)
 * so it still carries the transient user activation Chrome requires.
 *
 * The iframe is kept at zero size but NOT `display:none` (Chrome skips protocol
 * launches for display:none frames) and is left attached for the whole detection
 * window — removing it early cancels the dialog. We infer "opened" only from the tab
 * actually losing focus / being hidden; we never claim an app is installed otherwise.
 */
function attemptDesktopProtocol(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    let handled = false;
    const markHandled = () => {
      handled = true;
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') handled = true;
    };

    window.addEventListener('blur', markHandled);
    window.addEventListener('pagehide', markHandled);
    document.addEventListener('visibilitychange', onVisibility);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText =
      'position:fixed;top:-1px;left:-1px;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';
    iframe.src = url;
    document.body.appendChild(iframe);

    window.setTimeout(() => {
      window.removeEventListener('blur', markHandled);
      window.removeEventListener('pagehide', markHandled);
      document.removeEventListener('visibilitychange', onVisibility);
      iframe.remove();
      resolve(handled);
    }, PROTOCOL_SETTLE_MS);
  });
}

export function PromptActions({ prompt }: { prompt: string }) {
  const [copied, setCopied] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const noticeTimer = React.useRef<number | undefined>(undefined);

  React.useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const flash = React.useCallback((text: string) => {
    setNotice(text);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 4000);
  }, []);

  const copy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      return true;
    } catch {
      return false;
    }
  }, [prompt]);

  const handleCopy = React.useCallback(async () => {
    if (await copy()) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [copy]);

  const openExternal = React.useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const launch = React.useCallback(
    async (agent: AgentConfig) => {
      const plan = buildAgentLaunchUrl(agent.id, prompt);
      const notAttachedMsg = plan.overLimit
        ? 'Prompt copied — paste it into the agent.'
        : `Prompt copied — paste it into ${agent.label}.`;

      // Mobile has no reliable desktop-protocol handoff, and a web-only agent has no
      // scheme to fire: go straight to the official web entry.
      if (isCoarsePointer() || !plan.desktopUrl) {
        void copy();
        openExternal(plan.webUrl);
        if (!plan.promptAttached) flash(notAttachedMsg);
        return;
      }

      // Fire the OS protocol attempt FIRST and synchronously inside this click, so it
      // keeps the transient user activation Chrome needs to raise the native
      // "Open <app>?" dialog. Do NOT await anything before this.
      const openedPromise = attemptDesktopProtocol(plan.desktopUrl);

      // Copy the prompt immediately after, so it is on the clipboard whichever way this
      // goes (app opens bare, or we fall back to the web entry).
      void copy();

      const opened = await openedPromise;

      // The tab never lost focus, so the OS did not take the scheme — the app is not
      // installed. Open the official web version instead (no dialog, no popup).
      if (!opened) {
        openExternal(plan.webUrl);
      }

      // When the prompt could not be embedded in the deep link, tell the user it is
      // waiting on the clipboard.
      if (!plan.promptAttached) flash(notAttachedMsg);
    },
    [copy, prompt, openExternal, flash]
  );

  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-wrap items-center gap-2'>
        <Button type='button' variant='outline' size='sm' onClick={handleCopy} aria-live='polite'>
          {copied ? (
            <Icons.check className='size-3.5 text-emerald-500' />
          ) : (
            <Icons.forms className='size-3.5' />
          )}
          {copied ? 'copied' : 'copy prompt'}
        </Button>

        {AGENTS.map((agent) => {
          const Logo = AGENT_LOGOS[agent.id];
          return (
            <Button
              key={agent.id}
              type='button'
              variant='outline'
              size='sm'
              title={`Copies the build prompt, then opens ${agent.label}`}
              onClick={() => void launch(agent)}
            >
              <Logo className='size-3.5' />
              open in {agent.label}
            </Button>
          );
        })}
      </div>

      {notice && (
        <span aria-live='polite' className='font-mono text-[11px] text-emerald-600 dark:text-emerald-400'>
          {notice}
        </span>
      )}
    </div>
  );
}
