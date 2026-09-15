import { Icons } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AppRecord } from '@/features/apps/data/apps';

type SectionKey = 'whatYouLose' | 'requirements' | 'moat';

interface AnalysisSection {
  key: SectionKey;
  title: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  emptyText: string;
}

const SECTIONS: AnalysisSection[] = [
  {
    key: 'whatYouLose',
    title: 'What you lose cloning it',
    description: 'The parts you cannot take with you.',
    icon: Icons.xCircle,
    emptyText: 'Nothing significant — this one is genuinely open.'
  },
  {
    key: 'moat',
    title: 'The moat',
    description: 'Why it is hard to compete (or not).',
    icon: Icons.lock,
    emptyText: 'No real moat — a fair fight.'
  },
  {
    key: 'requirements',
    title: 'What you’ll need',
    description: 'Ingredients to build your version.',
    icon: Icons.check,
    emptyText: 'Nothing exotic required.'
  }
];

export function AnalysisGrid({ app }: { app: AppRecord }) {
  return (
    <div className='grid gap-4 md:grid-cols-2'>
      {SECTIONS.map((section) => {
        const Icon = section.icon;
        const items = app[section.key];
        return (
          <Card key={section.key}>
            <CardHeader className='flex flex-row items-start justify-between gap-3'>
              <div>
                <CardTitle className='text-base'>{section.title}</CardTitle>
                <p className='text-sm text-muted-foreground'>{section.description}</p>
              </div>
              <span className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
                <Icon className='size-4' />
              </span>
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <ul className='flex flex-col gap-2.5'>
                  {items.map((item, index) => (
                    <li key={index} className='flex items-start gap-2.5 text-sm'>
                      <span className='mt-1.5 size-1 shrink-0 rounded-full bg-foreground/40' />
                      <span className='text-muted-foreground'>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='text-sm text-muted-foreground'>{section.emptyText}</p>
              )}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader className='flex flex-row items-start justify-between gap-3'>
          <div>
            <CardTitle className='text-base'>Suggested stack</CardTitle>
            <p className='text-sm text-muted-foreground'>A sane starting point for your build.</p>
          </div>
          <span className='flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
            <Icons.code className='size-4' />
          </span>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            {app.stack.map((item) => (
              <span
                key={item}
                className='h-6 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs text-foreground'
              >
                {item}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}