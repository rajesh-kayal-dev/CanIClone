/**
 * Agent launch configuration + deep-link builder.
 *
 * Two kinds of URLs are used, and both are grounded in real, registered handlers:
 *
 *  1. Prompt-carrying deep links — only where the vendor documents them:
 *     - Claude  — `claude://claude.ai/new?q=` (Anthropic "Open Claude Desktop with a
 *                 link"). The client truncates `q` at ~14,000 chars, so we refuse to
 *                 attach longer prompts and open the app bare instead.
 *     - Cursor  — `cursor://anysphere.cursor-deeplink/prompt?text=` and its HTTPS twin
 *                 `https://cursor.com/link/prompt?text=` (documented). Deeplink URLs
 *                 are capped at 10,000 characters.
 *
 *  2. Bare app-launch schemes — the plain `scheme://` that the installed desktop app
 *     registers with the OS. These open the app WITHOUT any prompt parameters, because
 *     OpenAI and Google document no prompt route (we never invent query params). The
 *     build prompt is handed over via the clipboard instead. The schemes below are the
 *     ones the apps themselves register:
 *     - Codex / ChatGPT desktop — `chatgpt://`
 *     - Antigravity             — `antigravity://`
 *     - Claude / Cursor also get their bare scheme so an over-long prompt still opens
 *       the installed app rather than dumping the user on a web page.
 *
 * The same build prompt string (from the THE PROMPT panel) is reused everywhere; it is
 * never duplicated, hardcoded, or silently truncated.
 */

export type AgentId = 'claude' | 'codex' | 'cursor' | 'antigravity';

export interface AgentConfig {
  id: AgentId;
  /** Display name, e.g. "Claude". */
  label: string;
  /** Official web entry point (used when the desktop app is not installed). */
  webUrl: string;
  /** Official download / install page. */
  downloadUrl: string;
  /**
   * Documented prompt-carrying desktop deep link, when one exists. Returns the full
   * `scheme://…?prompt=` URL for a given (already length-checked) prompt.
   */
  desktopDeepLink?: (prompt: string) => string;
  /**
   * Bare registered scheme (`scheme://`) that simply opens the installed desktop app
   * with no prompt parameters. Used for agents with no documented prompt deep link and
   * as the over-limit fallback for those that have one.
   */
  desktopLaunchScheme?: string;
  /** Documented HTTPS prompt link, when one exists (Cursor). */
  httpsPromptLink?: (prompt: string) => string;
  /** Documented maximum prompt length the provider will accept in a deep link. */
  promptLimit?: number;
}

export const AGENTS: AgentConfig[] = [
  {
    id: 'claude',
    label: 'Claude',
    webUrl: 'https://claude.ai/new',
    downloadUrl: 'https://claude.com/download',
    desktopDeepLink: (prompt) => `claude://claude.ai/new?q=${encodeURIComponent(prompt)}`,
    desktopLaunchScheme: 'claude://',
    promptLimit: 14000,
  },
  {
    id: 'codex',
    label: 'Codex',
    // OpenAI documents no public prompt deep link; `chatgpt://` is the scheme the
    // ChatGPT/Codex desktop app registers, so we use it to open the app bare and hand
    // the prompt over via the clipboard.
    webUrl: 'https://chatgpt.com/codex/',
    downloadUrl: 'https://developers.openai.com/codex',
    desktopLaunchScheme: 'chatgpt://',
  },
  {
    id: 'cursor',
    label: 'Cursor',
    webUrl: 'https://cursor.com/',
    downloadUrl: 'https://cursor.com/download',
    desktopDeepLink: (prompt) =>
      `cursor://anysphere.cursor-deeplink/prompt?text=${encodeURIComponent(prompt)}`,
    desktopLaunchScheme: 'cursor://',
    httpsPromptLink: (prompt) => `https://cursor.com/link/prompt?text=${encodeURIComponent(prompt)}`,
    promptLimit: 10000,
  },
  {
    id: 'antigravity',
    label: 'Antigravity',
    // Google documents no deep link; `antigravity://` is the scheme the installed
    // Antigravity app registers, used to open it bare. Prompt goes via the clipboard.
    webUrl: 'https://antigravity.google/',
    downloadUrl: 'https://antigravity.google/download',
    desktopLaunchScheme: 'antigravity://',
  },
];

export function getAgent(id: AgentId): AgentConfig {
  const agent = AGENTS.find((a) => a.id === id);
  if (!agent) throw new Error(`Unknown agent: ${id}`);
  return agent;
}

export interface LaunchPlan {
  /**
   * Custom desktop protocol URL to fire first (opens the installed app), or null when
   * the agent has no registered scheme. Carries the prompt only when documented.
   */
  desktopUrl: string | null;
  /** True when the build prompt is embedded in `desktopUrl`. */
  promptAttached: boolean;
  /** True when the prompt exceeds the provider's documented deep-link limit. */
  overLimit: boolean;
  /** Official web URL to open when the desktop app is not installed / not handled. */
  webUrl: string;
}

/**
 * Builds the launch plan for an agent + prompt. This is the single reusable entry point
 * used by Copy Prompt and every "Open in …" button. It never truncates: when the prompt
 * is too long for a provider's deep link we still open the installed app via its bare
 * scheme (or the web entry when there is none) and report `overLimit` so the caller can
 * copy the full prompt and say so.
 */
export function buildAgentLaunchUrl(agentId: AgentId, prompt: string): LaunchPlan {
  const agent = getAgent(agentId);
  const overLimit = agent.promptLimit !== undefined && prompt.length > agent.promptLimit;

  // Web entry to fall back to when the desktop app is not installed. Cursor keeps the
  // prompt in-browser via its documented HTTPS prompt link when it still fits.
  const webUrl =
    !overLimit && agent.httpsPromptLink ? agent.httpsPromptLink(prompt) : agent.webUrl;

  // 1. Documented prompt-carrying deep link, only when within the provider's limit.
  if (agent.desktopDeepLink && !overLimit) {
    return {
      desktopUrl: agent.desktopDeepLink(prompt),
      promptAttached: true,
      overLimit: false,
      webUrl,
    };
  }

  // 2. Bare registered scheme — opens the installed app (prompt handed over by copy).
  if (agent.desktopLaunchScheme) {
    return {
      desktopUrl: agent.desktopLaunchScheme,
      promptAttached: false,
      overLimit,
      webUrl,
    };
  }

  // 3. No desktop scheme at all — web only.
  return {
    desktopUrl: null,
    promptAttached: false,
    overLimit,
    webUrl,
  };
}
