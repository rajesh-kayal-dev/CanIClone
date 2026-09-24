import type { Request, Response } from "express";
import { listAppsPage } from "../services/apps.service.js";

function queryInt(value: unknown): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function queryString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

const CLONE_SORTS = new Set([
  "replaced",
  "trending",
  "popular",
  "new",
  "name",
  "price",
]);

export async function listCloneListApps(req: Request, res: Response) {
  const requestedSort = queryString(req.query.sort);
  const result = await listAppsPage({
    page: queryInt(req.query.page),
    limit: queryInt(req.query.limit),
    category: queryString(req.query.category),
    verdict: queryString(req.query.verdict),
    sort: requestedSort && CLONE_SORTS.has(requestedSort) ? requestedSort : "replaced",
    q: queryString(req.query.q),
  });

  res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
  return res.json({
    success: true,
    data: result.items,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      hasMore: result.hasMore,
    },
  });
}
