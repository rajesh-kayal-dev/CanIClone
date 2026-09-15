import { prisma } from "@caniclone/database";

export async function getApps() {
  return prisma.app.findMany({
    orderBy: [
      { pagePriority: "desc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      slug: true,
      name: true,
      domain: true,
      category: true,
      subcategory: true,
      tagline: true,
      priceMonthly: true,
      verdict: true,
      verdictConfidence: true,
      verdictSummary: true,
      diyTimeEstimate: true,
      pagePriority: true,
      voteCount: true,
    },
  });
}

export async function getAppBySlug(slug: string) {
  return prisma.app.findUnique({
    where: { slug },
    include: {
      pricingPlans: true,
      alternatives: true,
    },
  });
}

export async function getAppAlternatives(slug: string) {
  return prisma.alternative.findMany({
    where: {
      app: {
        slug,
      },
    },
    orderBy: {
      name: "asc",
    },
  });
}
export async function getCategories() {
  const apps = await prisma.app.findMany({
    select: {
      category: true,
    },
    distinct: ["category"],
    orderBy: {
      category: "asc",
    },
  });

  return apps.map((app) => app.category);
}

export async function searchApps(query: string) {
  return prisma.app.findMany({
    where: {
      OR: [
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          tagline: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          category: {
            contains: query,
            mode: "insensitive",
          },
        },
      ],
    },
    orderBy: {
      name: "asc",
    },
    take: 20,
    select: {
      id: true,
      slug: true,
      name: true,
      domain: true,
      category: true,
      tagline: true,
      verdict: true,
      priceMonthly: true,
    },
  });
}