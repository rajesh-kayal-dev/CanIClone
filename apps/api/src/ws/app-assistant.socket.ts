import { WebSocket } from "ws";

import {
  runAppChat,
  runAppMvp,
  runAppPromptRefinement,
  runAppResearch,
  type AppAIMvpDto,
  type AppAIPromptDto,
  type AppAIResearchDto,
} from "../services/ai/app-ai.service.js";
import { isValidAnonymousId } from "../services/ideas/ideas.service.js";

import { classify } from "./protocols/errors.js";
import type { AppClientMessage } from "./protocols/app-assistant.js";
import { send } from "./protocols/transport.js";

type AppRunKind = "chat" | "research" | "prompt" | "mvp";
type ActiveAppRun = {
  controller: AbortController;
  requestId?: string;
  kind: AppRunKind;
  cancelled: boolean;
};

const activeAppRuns = new Map<string, ActiveAppRun>();

export async function handleAppMessage(
  socket: WebSocket,
  msg: AppClientMessage,
): Promise<void> {
  const { type, requestId, appSlug, anonymousUserId } = msg;
  if (!appSlug?.trim() || !isValidAnonymousId(anonymousUserId)) {
    return send(socket, {
      type: "error",
      requestId,
      code: "bad_request",
      message: "appSlug and a valid anonymousUserId are required",
    });
  }

  const runBase = `${anonymousUserId}:${appSlug}`;
  if (type === "app.cancel") {
    const activeEntry = [...activeAppRuns.entries()].find(
      ([key, run]) =>
        key.startsWith(`${runBase}:`) && (!requestId || run.requestId === requestId),
    );
    if (!activeEntry) {
      return send(socket, {
        type: "error",
        requestId,
        code: "nothing_to_cancel",
        message: "There is no matching AI action to stop.",
      });
    }
    const [activeKey, active] = activeEntry;
    active.cancelled = true;
    active.controller.abort();
    activeAppRuns.delete(activeKey);
    return send(socket, {
      type: "app.cancelled",
      requestId: active.requestId,
      appSlug,
      kind: active.kind,
    });
  }

  const runKey = `${runBase}:${type === "app.chat" ? "chat" : "action"}`;
  if (activeAppRuns.has(runKey)) {
    return send(socket, {
      type: "error",
      requestId,
      code: "run_in_progress",
      message: "Another AI action is already running for this application.",
    });
  }

  const action: AppRunKind =
    type === "app.chat"
      ? "chat"
      : type === "app.research"
        ? "research"
        : type === "app.prompt"
          ? "prompt"
          : "mvp";
  const controller = new AbortController();
  const run: ActiveAppRun = { controller, requestId, kind: action, cancelled: false };
  activeAppRuns.set(runKey, run);
  const emit = (payload: Record<string, unknown>): void => {
    if (!run.cancelled) send(socket, payload);
  };

  try {
    if (type === "app.chat") {
      const content = typeof msg.content === "string" ? msg.content.trim() : "";
      if (!content) {
        return send(socket, {
          type: "error",
          requestId,
          code: "bad_request",
          message: "Message content is required",
        });
      }
      emit({ type: "app.chat.start", requestId, appSlug });
      const result = await runAppChat(
        appSlug,
        anonymousUserId,
        content,
        (token) => emit({ type: "app.chat.delta", requestId, appSlug, token }),
        controller.signal,
        (message) => emit({ type: "app.chat.progress", requestId, appSlug, message }),
        msg.retry === true,
      );
      return emit({ type: "app.chat.done", requestId, appSlug, ...result });
    }

    const actionName = action as "research" | "prompt" | "mvp";
    emit({ type: "app.action.start", requestId, appSlug, action: actionName });
    const progress = (message: string) =>
      emit({ type: "app.action.progress", requestId, appSlug, action: actionName, message });
    if (actionName === "research") {
      const payload: AppAIResearchDto = await runAppResearch(
        appSlug,
        anonymousUserId,
        progress,
        controller.signal,
      );
      return emit({ type: "app.action.done", requestId, appSlug, action: actionName, payload });
    }
    if (actionName === "prompt") {
      const result = await runAppPromptRefinement(
        appSlug,
        anonymousUserId,
        typeof msg.content === "string" ? msg.content : "",
        progress,
        controller.signal,
      );
      const payload: AppAIPromptDto & { assistantMessageId: string; content: string } = {
        ...result.prompt,
        assistantMessageId: result.assistantMessageId,
        content: result.content,
      };
      return emit({ type: "app.action.done", requestId, appSlug, action: actionName, payload });
    }
    const result = await runAppMvp(appSlug, anonymousUserId, progress, controller.signal);
    const payload: AppAIMvpDto & { assistantMessageId: string; content: string } = {
      ...result.mvp,
      assistantMessageId: result.assistantMessageId,
      content: result.content,
    };
    return emit({ type: "app.action.done", requestId, appSlug, action: actionName, payload });
  } catch (err) {
    if (run.cancelled) return;
    const { code, message } = classify(err);
    console.error("[app-ai] %s failed code=%s", type, code);
    return send(socket, { type: "error", requestId, code, message });
  } finally {
    if (activeAppRuns.get(runKey)?.controller === controller) {
      activeAppRuns.delete(runKey);
    }
  }
}
