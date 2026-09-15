import type { Request, Response } from "express";
import { getApps, getAppBySlug, getAppAlternatives, getCategories, searchApps } from "../services/apps.service.js";

export async function listApps(
  _req: Request,
  res: Response,
) {
  const apps = await getApps();

  res.json({
    success: true,
    data: apps,
  });
}

export async function getApp(
  req: Request,
  res: Response,
) {
  const { slug } = req.params;

  if (typeof slug !== "string") {
    return res.status(400).json({
      success: false,
      message: "Invalid app slug",
    });
  }

  const app = await getAppBySlug(slug);

  if (!app) {
    return res.status(404).json({
      success: false,
      message: "App not found",
    });
  }

  res.json({
    success: true,
    data: app,
  });
}

export async function listAppAlternatives(
  req: Request,
  res: Response,
) {
  const { slug } = req.params;

  if (typeof slug !== "string") {
    return res.status(400).json({
      success: false,
      message: "Invalid app slug",
    });
  }

  const alternatives = await getAppAlternatives(slug);

  res.json({
    success: true,
    data: alternatives,
  });
}

export async function listCategories(
  _req: Request,
  res: Response,
) {
  const categories = await getCategories();

  res.json({
    success: true,
    data: categories,
  });
}

export async function search(
  req: Request,
  res: Response,
) {
  const { q } = req.query;

  if (typeof q !== "string" || !q.trim()) {
    return res.status(400).json({
      success: false,
      message: "Search query is required",
    });
  }

  const apps = await searchApps(q.trim());

  res.json({
    success: true,
    data: apps,
  });
}