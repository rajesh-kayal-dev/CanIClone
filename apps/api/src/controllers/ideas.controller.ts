import type { Request, Response } from "express";

import {
  createIdea,
  deleteIdea,
  getCapabilities,
  getIdea,
  IdeaNotFoundError,
  InvalidAnonymousIdError,
  isValidAnonymousId,
  listIdeas,
  updateIdea,
} from "../services/ideas.service.js";

/**
 * The anonymous id travels in the `x-anonymous-id` header (preferred) and is also
 * accepted in the query string / JSON body for convenience. It is the only handle
 * on a user's ideas, so it is required on every route.
 */
function readAnonymousId(req: Request): string | undefined {
  const header = req.header("x-anonymous-id");
  if (isValidAnonymousId(header)) return header;
  const query = req.query.anonymousUserId;
  if (isValidAnonymousId(query)) return query;
  const body = (req.body ?? {}) as { anonymousUserId?: unknown };
  if (isValidAnonymousId(body.anonymousUserId)) return body.anonymousUserId;
  return undefined;
}

function handleError(res: Response, err: unknown, context: string): Response {
  if (err instanceof InvalidAnonymousIdError) {
    return res.status(400).json({ success: false, message: "A valid anonymous user id is required" });
  }
  if (err instanceof IdeaNotFoundError) {
    return res.status(404).json({ success: false, message: "Idea not found" });
  }
  // Never echo raw errors (they could carry connection strings or keys).
  console.error("[ideas] %s failed", context);
  return res.status(500).json({ success: false, message: "Request failed" });
}

export async function listIdeasHandler(req: Request, res: Response) {
  const anonymousUserId = readAnonymousId(req);
  if (!anonymousUserId) {
    return res.status(400).json({ success: false, message: "A valid anonymous user id is required" });
  }
  try {
    const data = await listIdeas(anonymousUserId);
    return res.json({ success: true, data });
  } catch (err) {
    return handleError(res, err, "list");
  }
}

export async function capabilitiesHandler(_req: Request, res: Response) {
  res.json({ success: true, data: getCapabilities() });
}

export async function createIdeaHandler(req: Request, res: Response) {
  const anonymousUserId = readAnonymousId(req);
  if (!anonymousUserId) {
    return res.status(400).json({ success: false, message: "A valid anonymous user id is required" });
  }
  const body = (req.body ?? {}) as { title?: string; description?: string };
  try {
    const data = await createIdea(anonymousUserId, {
      title: body.title ?? null,
      description: body.description ?? null,
    });
    return res.status(201).json({ success: true, data });
  } catch (err) {
    return handleError(res, err, "create");
  }
}

export async function getIdeaHandler(req: Request, res: Response) {
  const anonymousUserId = readAnonymousId(req);
  if (!anonymousUserId) {
    return res.status(400).json({ success: false, message: "A valid anonymous user id is required" });
  }
  const { id } = req.params;
  if (typeof id !== "string") {
    return res.status(400).json({ success: false, message: "Invalid idea id" });
  }
  try {
    const data = await getIdea(id, anonymousUserId);
    return res.json({ success: true, data });
  } catch (err) {
    return handleError(res, err, "get");
  }
}

export async function updateIdeaHandler(req: Request, res: Response) {
  const anonymousUserId = readAnonymousId(req);
  if (!anonymousUserId) {
    return res.status(400).json({ success: false, message: "A valid anonymous user id is required" });
  }
  const { id } = req.params;
  if (typeof id !== "string") {
    return res.status(400).json({ success: false, message: "Invalid idea id" });
  }
  try {
    const data = await updateIdea(id, anonymousUserId, (req.body ?? {}) as Record<string, unknown>);
    return res.json({ success: true, data });
  } catch (err) {
    return handleError(res, err, "update");
  }
}

export async function deleteIdeaHandler(req: Request, res: Response) {
  const anonymousUserId = readAnonymousId(req);
  if (!anonymousUserId) {
    return res.status(400).json({ success: false, message: "A valid anonymous user id is required" });
  }
  const { id } = req.params;
  if (typeof id !== "string") {
    return res.status(400).json({ success: false, message: "Invalid idea id" });
  }
  try {
    await deleteIdea(id, anonymousUserId);
    return res.json({ success: true, data: { id } });
  } catch (err) {
    return handleError(res, err, "delete");
  }
}
