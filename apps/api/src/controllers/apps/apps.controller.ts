import type { Request, Response } from "express";
import {
  getAppAlternatives,
  getAppBySlug,
  getAppCount,
  getCategoryStats,
  getCategoryStatsBySlug,
  getRelatedApps,
  listAppsPage,
  searchApps,
} from "../../services/apps/apps.service.js";

function queryInt(value: unknown): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function queryString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function setReadCache(res: Response, seconds = 30): void {
  res.setHeader("Cache-Control", `public, max-age=${seconds}, stale-while-revalidate=120`);
}

export async function listApps(req: Request, res: Response) {
  const result = await listAppsPage({
    page: queryInt(req.query.page),
    limit: queryInt(req.query.limit),
    category: queryString(req.query.category),
    verdict: queryString(req.query.verdict),
    sort: queryString(req.query.sort),
    q: queryString(req.query.q),
  });

  setReadCache(res);
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

export async function getApp(req: Request, res: Response) {
  const { slug } = req.params;
  if (typeof slug !== "string" || !slug.trim()) {
    return res.status(400).json({ success: false, message: "Invalid app slug" });
  }

  const app = await getAppBySlug(slug);
  if (!app) {
    return res.status(404).json({ success: false, message: "App not found" });
  }

  setReadCache(res, 120);
  return res.json({ success: true, data: app });
}

export async function listAppAlternatives(req: Request, res: Response) {
  const { slug } = req.params;
  if (typeof slug !== "string" || !slug.trim()) {
    return res.status(400).json({ success: false, message: "Invalid app slug" });
  }

  const alternatives = await getAppAlternatives(slug);
  setReadCache(res, 120);
  return res.json({ success: true, data: alternatives });
}

export async function listRelatedApps(req: Request, res: Response) {
  const { slug } = req.params;
  if (typeof slug !== "string" || !slug.trim()) {
    return res.status(400).json({ success: false, message: "Invalid app slug" });
  }

  const related = await getRelatedApps(slug, queryInt(req.query.limit) ?? 4);
  setReadCache(res, 120);
  return res.json({ success: true, data: related });
}

export async function listCategories(_req: Request, res: Response) {
  const categories = await getCategoryStats();
  setReadCache(res, 120);
  return res.json({ success: true, data: categories });
}

export async function getCategory(req: Request, res: Response) {
  const { slug } = req.params;
  if (typeof slug !== "string" || !slug.trim()) {
    return res.status(400).json({ success: false, message: "Invalid category slug" });
  }

  const category = await getCategoryStatsBySlug(slug);
  if (!category) return res.status(404).json({ success: false, message: "Category not found" });
  setReadCache(res, 120);
  return res.json({ success: true, data: category });
}

export async function getAppStats(_req: Request, res: Response) {
  const count = await getAppCount();
  setReadCache(res, 120);
  return res.json({ success: true, data: { count } });
}

export async function search(req: Request, res: Response) {
  const q = queryString(req.query.q);
  if (!q) {
    return res.status(400).json({ success: false, message: "Search query is required" });
  }

  const limit = Math.min(50, Math.max(1, queryInt(req.query.limit) ?? 20));
  const results = await searchApps(q, limit);
  return res.json({ success: true, data: results });
}
