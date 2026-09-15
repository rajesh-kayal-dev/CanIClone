import Link from 'next/link';

import { Icons } from '@/components/icons';
import { AppCard } from '@/components/shared/app-card';
import { CategoryCard } from '@/components/shared/category-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getPopularApps, getAppCount } from '@/features/apps/data/apps';
import { CATEGORIES } from '@/features/categories/data/categories';
import { countAppsByCategory } from '@/features/apps/data/apps';
import { SearchBar } from '@/features/search/components/search-bar';

const QUICK_SEARCHES = [
  { label: 'Chatbot', query: 'chatbot' },
  { label: 'Image generation', query: 'image' },
  { label: 'Open source', query: 'open source' },
  { label: 'Code', query: 'code' }
];

const HOW_IT_WORKS = [
  {
    icon: Icons.search,
    title: 'Browse the directory',
    description: 'Every AI product gets a card with a verdict — YES, KINDA, or NO — plus confidence and votes.'
  },
  {
    icon: Icons.lock,
    title: 'Understand the moat',
    description: 'We break down what makes each product hard to replicate: model quality, data, distribution, or brand.'
  },
  {
    icon: Icons.code,
    title: 'Get a build prompt',
    description: 'Every app ships with a ready-to-paste prompt to scaffold your own version and get moving today.'
  }
];

export default function HomePage() {
  const popularApps = getPopularApps(6);

  return (
    <div className='flex flex-col gap-20 py-12 sm:py-16'>
      {/* Hero */}
      <section className='mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 text-center sm:px-6'>
        <span className='inline-flex h-6 items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 text-xs font-medium text-muted-foreground'>
          <Icons.sparkles className='size-3.5 text-primary' />
          {getAppCount()} apps reviewed · every one ships a build prompt
        </span>
        <div className='flex flex-col gap-4'>
          <h1 className='text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl'>
            Wondering if you can build that AI app?{' '}
            <span className='bg-gradient-to-r from-foreground to-foreground/50 bg-clip-text text-transparent'>
              We tell you honestly.
            </span>
          </h1>
          <p className='mx-auto max-w-xl text-balance text-base text-muted-foreground sm:text-lg'>
            CanIClone reviews AI products and tells you whether they’re worth cloning — what you lose, what the moat is, and how long it takes. Then it gives you the build prompt.
          </p>
        </div>
        <SearchBar size='lg' className='max-w-xl' />
        <div className='flex flex-wrap items-center justify-center gap-2'>
          <span className='text-xs text-muted-foreground'>Try:</span>
          {QUICK_SEARCHES.map((item) => (
            <Button
              key={item.query}
              variant='outline'
              size='xs'
              className='rounded-full'
              nativeButton={false}
              render={<Link href={`/search?q=${encodeURIComponent(item.query)}`} />}
            >
              {item.label}
              <Icons.arrowRight className='size-3' />
            </Button>
          ))}
        </div>
      </section>

      {/* Popular apps */}
      <section className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6'>
        <div className='flex items-end justify-between gap-4'>
          <div className='flex flex-col gap-1'>
            <h2 className='text-2xl font-bold tracking-tight'>Trending right now</h2>
            <p className='text-sm text-muted-foreground'>The most-voted reviews this month.</p>
          </div>
          <Button variant='ghost' size='sm' nativeButton={false} render={<Link href='/apps' />}>
            View all apps
            <Icons.chevronRight className='size-4' />
          </Button>
        </div>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {popularApps.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className='mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6'>
        <div className='flex items-end justify-between gap-4'>
          <div className='flex flex-col gap-1'>
            <h2 className='text-2xl font-bold tracking-tight'>Browse by category</h2>
            <p className='text-sm text-muted-foreground'>Find the slice of the market you want to take on.</p>
          </div>
          <Button variant='ghost' size='sm' nativeButton={false} render={<Link href='/categories' />}>
            All categories
            <Icons.chevronRight className='size-4' />
          </Button>
        </div>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          {CATEGORIES.slice(0, 8).map((category) => (
            <CategoryCard
              key={category.slug}
              category={category}
              appCount={countAppsByCategory(category.slug)}
            />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id='how-it-works' className='relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 sm:px-6'>
        <div className='flex flex-col gap-1'>
          <h2 className='text-2xl font-bold tracking-tight'>How the verdict works</h2>
          <p className='text-sm text-muted-foreground'>Three steps from “interesting” to “building”.</p>
        </div>
        <div className='grid gap-4 md:grid-cols-3'>
          {HOW_IT_WORKS.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.title}>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <span className='flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary [&>svg]:size-4'>
                      <Icon className='size-4' />
                    </span>
                    <span className='text-sm font-semibold text-foreground/20 tabular-nums'>
                      0{index + 1}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className='flex flex-col gap-1'>
                  <CardTitle className='text-base'>{step.title}</CardTitle>
                  <p className='text-sm text-muted-foreground'>{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className='mx-auto w-full max-w-6xl px-4 sm:px-6'>
        <div className='flex flex-col items-center gap-6 rounded-2xl border border-border bg-gradient-to-b from-primary/10 to-transparent px-6 py-14 text-center'>
          <h2 className='max-w-xl text-balance text-3xl font-bold tracking-tight'>
            Ready to build your first AI app?
          </h2>
          <p className='max-w-md text-balance text-muted-foreground'>
            Start with a YES verdict, grab the prompt, and ship. Your co-founder is already tired of hearing “wouldn’t it be cool if…”
          </p>
          <div className='flex flex-wrap items-center justify-center gap-3'>
            <Button size='lg' nativeButton={false} render={<Link href='/apps' />}>
              Browse apps
              <Icons.arrowRight className='size-4' />
            </Button>
            <Button size='lg' variant='outline' nativeButton={false} render={<Link href='/categories' />}>
              Explore categories
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}