import { prisma } from '@caniclone/database';

export async function getMarketTrending(limit = 15) {
  const rising = await prisma.marketTrend.findMany({
    where: {
      trendDirection: 'RISING',
    },
    orderBy: {
      growthPercent: 'desc',
    },
    take: limit,
    include: {
      app: {
        select: {
          name: true,
          slug: true,
          category: true,
          domain: true,
        },
      },
    },
  });

  if (rising.length > 0) {
    return rising;
  }

  // Fallback if no rising trends exist yet
  return prisma.marketTrend.findMany({
    orderBy: {
      currentInterest: 'desc',
    },
    take: limit,
    include: {
      app: {
        select: {
          name: true,
          slug: true,
          category: true,
          domain: true,
        },
      },
    },
  });
}

export async function getMarketOverview(limit = 5) {
  const withInterest = await prisma.marketTrend.findMany({
    where: {
      currentInterest: { gt: 0 },
    },
    orderBy: {
      currentInterest: 'desc',
    },
    take: limit,
    include: {
      app: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  if (withInterest.length >= limit) {
    return withInterest;
  }

  return prisma.marketTrend.findMany({
    orderBy: {
      currentInterest: 'desc',
    },
    take: limit,
    include: {
      app: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });
}

export async function getAppMarketData(slug: string) {
  return prisma.marketTrend.findFirst({
    where: {
      app: {
        slug: slug,
      },
    },
  });
}
