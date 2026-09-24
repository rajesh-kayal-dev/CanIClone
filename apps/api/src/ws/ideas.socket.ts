import type { Server } from "http";
import { WebSocketServer, WebSocket } from "ws";

import { isResearchEnabled, ResearchUnavailableError } from "../lib/firecrawl.js";
import {
  getCapabilities,
  IdeaNotFoundError,
  InvalidAnonymousIdError,
  isValidAnonymousId,
} from "../services/ideas.service.js";
import { runChat, runCreateMvp, runCreatePrompt } from "../services/ideas-ai.service.js";
import { runResearch } from "../services/research.service.js";

/**
 * WebSocket transport for the Ideas AI workspace (path: /ws). The AI itself is
 * never faked: handlers call the real Mistral/Firecrawl services and stream the
 * result. When the provider is rate-limited or research is not configured, an
 * honest `error` event is sent instead of a fabricated answer.
 *
 * Protocol (JSON):
 *  client -> server: {type:"ping"} | {type:"chat"|"research"|"prompt"|"mvp", requestId, ideaId, anonymousUserId, content?}
 *  server -> client: {type:"ready"|"pong"|"chat.start"|"chat.delta"|"chat.done"|"action.start"|"action.done"|"error", ...}
 */

type ClientMessage =
  | { type: "ping" }
  | {
      type: "chat" | "research" | "prompt" | "mvp";
      requestId?: string;
      ideaId?: string;
      anonymousUserId?: string;
      content?: string;
    };

function send(socket: WebSocket, payload: Record<string, unknown>): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

/** Walk an error chain for an HTTP status (the AI SDK nests provider errors). */
function findStatusCode(err: unknown): number | undefined {
  let cur = err as { statusCode?: number; cause?: unknown } | null | undefined;
  for (let i = 0; i < 5 && cur; i++) {
    if (typeof cur.statusCode === "number") return cur.statusCode;
    cur = cur.cause as typeof cur;
  }
  return undefined;
}

function classify(err: unknown): { code: string; message: string } {
  if (err instanceof InvalidAnonymousIdError) {
    return { code: "bad_request", message: "A valid anonymous user id is required" };
  }
  if (err instanceof IdeaNotFoundError) {
    return { code: "not_found", message: "Idea not found" };
  }
  if (err instanceof ResearchUnavailableError) {
    return { code: "research_unavailable", message: err.message };
  }
  const status = findStatusCode(err);
  const raw = err instanceof Error ? err.message : "";
  if (status === 429 || /rate.?limit|429/i.test(raw)) {
    return { code: "ai_unavailable", message: "AI is temporarily unavailable (provider rate limit). Try again later." };
  }
  if (status === 401 || status === 403 || raw.includes("MISTRAL_API_KEY")) {
    return { code: "ai_unavailable", message: "AI is not configured on this server." };
  }
  return { code: "internal", message: "Request failed" };
}

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
        return send(socket, { type: "error", requestId, code: "bad_request", message: "Message content is required" });
      }
      send(socket, { type: "chat.start", requestId, ideaId });
      const result = await runChat(ideaId, anonymousUserId, content, (token) =>
        send(socket, { type: "chat.delta", requestId, ideaId, token }),
      );
      return send(socket, { type: "chat.done", requestId, ideaId, ...result });
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
      const result = await runResearch(ideaId, anonymousUserId);
      return send(socket, { type: "action.done", requestId, action: "research", ideaId, payload: result });
    }

    if (type === "prompt") {
      send(socket, { type: "action.start", requestId, action: "prompt", ideaId });
      const result = await runCreatePrompt(ideaId, anonymousUserId);
      return send(socket, { type: "action.done", requestId, action: "prompt", ideaId, payload: result });
    }

    if (type === "mvp") {
      send(socket, { type: "action.start", requestId, action: "mvp", ideaId });
      const result = await runCreateMvp(ideaId, anonymousUserId);
      return send(socket, { type: "action.done", requestId, action: "mvp", ideaId, payload: result });
    }

    return send(socket, { type: "error", requestId, code: "bad_request", message: `Unknown message type: ${type}` });
  } catch (err) {
    const { code, message } = classify(err);
    // Sanitized log: code only, never the raw provider error (could carry secrets).
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
      // Fire-and-forget; errors are reported to the client as `error` events.
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
