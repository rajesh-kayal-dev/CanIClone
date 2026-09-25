import type { Request, Response } from "express";
import {
  listOpportunities,
  getOpportunityBySlug,
  toOpportunity,
} from "../../services/opportunities/opportunities.service.js";

function queryInt(value: unknown): number | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

function queryString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

export async function listOpportunityRows(req: Request, res: Response) {
  const result = await listOpportunities({
    page: queryInt(req.query.page),
    limit: queryInt(req.query.limit),
    category: queryString(req.query.category),
    verdict: queryString(req.query.verdict),
    difficulty: queryString(req.query.difficulty),
    market: queryString(req.query.market),
    sort: queryString(req.query.sort),
    q: queryString(req.query.q),
  });

  res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
  res.json({
    success: true,
    data: result.items.map(toOpportunity),
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      hasMore: result.hasMore,
    },
  });
}

export async function getOpportunity(req: Request, res: Response) {
  const { slug } = req.params;
  if (typeof slug !== "string") {
    return res.status(400).json({ success: false, message: "Invalid app slug" });
  }
  const opportunity = await getOpportunityBySlug(slug);
  if (!opportunity) {
    return res.status(404).json({ success: false, message: "App not found" });
  }
  res.json({ success: true, data: opportunity });
}
