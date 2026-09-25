import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";

import { isResearchEnabled } from "../integrations/firecrawl.js";
import {
  getCapabilities,
  isValidAnonymousId,
} from "../services/ideas/ideas.service.js";
import { runChat, runCreateMvp, runCreatePrompt } from "../services/ideas/ideas-ai.service.js";
import { runInitialAnalysis } from "../services/ideas/initial-analysis.service.js";
import { runResearch } from "../services/ideas/research.service.js";

import { handleAppMessage } from "./app-assistant.socket.js";
import {
  isAppClientMessage,
  type AppClientMessage,
} from "./protocols/app-assistant.js";
import { classify } from "./protocols/errors.js";
import type { IdeasClientMessage } from "./protocols/ideas.js";
import { send } from "./protocols/transport.js";

/**
 * WebSocket transport for the Ideas AI workspace (path: /ws). The AI itself is
 * never faked: handlers call the real AI/Firecrawl services and stream the
 * result. When the provider is rate-limited or research is not configured, an
 * honest `error` event is sent instead of a fabricated answer.
 *
 * Protocol (JSON):
 *  client -> server: {type:"ping"} | {type:"chat"|"analyze"|"research"|"prompt"|"mvp", requestId, ideaId, anonymousUserId, content?} | {type:"app.chat"|"app.research"|"app.prompt"|"app.mvp"|"app.cancel", requestId, appSlug, anonymousUserId, content?}
 *  server -> client: {type:"ready"|"pong"|"chat.start"|"chat.progress"|"chat.delta"|"chat.done"|"analysis.start"|"analysis.progress"|"analysis.title"|"analysis.delta"|"analysis.done"|"action.start"|"action.progress"|"action.done"|"app.chat.start"|"app.chat.progress"|"app.chat.delta"|"app.chat.done"|"app.cancelled"|"app.action.start"|"app.action.progress"|"app.action.done"|"error", ...}
 */

type ClientMessage =
  | { type: "ping" }
  | IdeasClientMessage
  | AppClientMessage;

const activeInitialAnalyses = new Set<string>();

async function handle(socket: WebSocket, raw: unknown): Promise<void> {
  let msg: ClientMessage;
  try {
    msg = JSON.parse(String(raw)) as ClientMessage;
  } catch {
    return send(socket, { type: "error", code: "bad_request", message: "Invalid JSON" });
  }

  if (!msg || typeof msg !== "object") {
    return send(socket, { type: "error", code: "bad_request", message: "Invalid message" });
  }

  if (msg.type === "ping") return send(socket, { type: "pong" });
  if (isAppClientMessage(msg)) {
    return handleAppMessage(socket, msg);
  }

  const { type, requestId, ideaId, anonymousUserId } = msg;
  if (!ideaId || !isValidAnonymousId(anonymousUserId)) {
    return send(socket, {
      type: "error",
      requestId,
      code: "bad_request",
      message: "ideaId and a valid anonymousUserId are required",
    });
  }

  try {
    if (type === "chat") {
      const content = typeof msg.content === "string" ? msg.content.trim() : "";
      if (!content) {
        return send(socket, {
          type: "error",
          requestId,
          code: "bad_request",
          message: "Message content is required",
        });
      }
      send(socket, { type: "chat.start", requestId, ideaId });
      const result = await runChat(
        ideaId,
        anonymousUserId,
        content,
        (token) => send(socket, { type: "chat.delta", requestId, ideaId, token }),
        undefined,
        (message) => send(socket, { type: "chat.progress", requestId, ideaId, message }),
        msg.retry === true,
      );
      return send(socket, { type: "chat.done", requestId, ideaId, ...result });
    }

    if (type === "analyze") {
      const analysisKey = `${anonymousUserId}:${ideaId}`;
      if (activeInitialAnalyses.has(analysisKey)) {
        return send(socket, {
          type: "error",
          requestId,
          code: "analysis_in_progress",
          message: "An automatic analysis is already running for this idea.",
        });
      }
      activeInitialAnalyses.add(analysisKey);
      try {
        send(socket, { type: "analysis.start", requestId, ideaId });
        const result = await runInitialAnalysis(
          ideaId,
          anonymousUserId,
          (progress) => send(socket, { type: "analysis.progress", requestId, ideaId, ...progress }),
          (title) => send(socket, { type: "analysis.title", requestId, ideaId, title }),
          (token) => send(socket, { type: "analysis.delta", requestId, ideaId, token }),
        );
        return send(socket, { type: "analysis.done", requestId, ideaId, payload: result });
      } finally {
        activeInitialAnalyses.delete(analysisKey);
      }
    }

    if (type === "research") {
      if (!isResearchEnabled()) {
        return send(socket, {
          type: "error",
          requestId,
          code: "research_unavailable",
          message: "Research is not configured on this server yet.",
        });
      }
      send(socket, { type: "action.start", requestId, action: "research", ideaId });
      const result = await runResearch(
        ideaId,
        anonymousUserId,
        undefined,
        (message) =>
          send(socket, {
            type: "action.progress",
            requestId,
            action: "research",
            ideaId,
            message,
          }),
      );
      return send(socket, {
        type: "action.done",
        requestId,
        action: "research",
        ideaId,
        payload: result,
      });
    }

    if (type === "prompt") {
      send(socket, { type: "action.start", requestId, action: "prompt", ideaId });
      const result = await runCreatePrompt(ideaId, anonymousUserId);
      return send(socket, {
        type: "action.done",
        requestId,
        action: "prompt",
        ideaId,
        payload: result,
      });
    }

    if (type === "mvp") {
      send(socket, { type: "action.start", requestId, action: "mvp", ideaId });
      const result = await runCreateMvp(ideaId, anonymousUserId);
      return send(socket, {
        type: "action.done",
        requestId,
        action: "mvp",
        ideaId,
        payload: result,
      });
    }

    return send(socket, {
      type: "error",
      requestId,
      code: "bad_request",
      message: `Unknown message type: ${type}`,
    });
  } catch (err) {
    const { code, message } = classify(err);
    console.error("[ideas-ws] %s failed code=%s", type, code);
    return send(socket, { type: "error", requestId, code, message });
  }
}

/** Attach the Ideas WebSocket server to an existing HTTP server. */
export function attachIdeasSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket) => {
    send(socket, { type: "ready", capabilities: getCapabilities() });

    socket.on("message", (raw) => {
      void handle(socket, raw);
    });

    socket.on("error", (err) => {
      console.error("[ideas-ws] socket error code=%s", (err as Error)?.name ?? "unknown");
    });

    socket.on("close", () => {
      // Nothing to clean up: each request is self-contained.
    });
  });

  return wss;
}
