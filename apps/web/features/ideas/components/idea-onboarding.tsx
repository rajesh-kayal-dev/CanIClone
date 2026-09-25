'use client';

import type { FormEvent } from 'react';

import { Icons } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

import {
  IDEA_ONBOARDING_STEPS,
  type IdeaOnboardingAnswers,
  type IdeaOnboardingStepId,
} from '../idea-onboarding';

interface IdeaOnboardingProps {
  stepIndex: number;
  answers: IdeaOnboardingAnswers;
  saving: boolean;
  error: string | null;
  onAnswerChange: (stepId: IdeaOnboardingStepId, value: string) => void;
  onContinue: () => void | Promise<void>;
  onSkip: () => void;
  onBack: () => void;
}

export function IdeaOnboarding({
  stepIndex,
  answers,
  saving,
  error,
  onAnswerChange,
  onContinue,
  onSkip,
  onBack,
}: IdeaOnboardingProps) {
  const step = IDEA_ONBOARDING_STEPS[stepIndex];
  if (!step) return null;

  const value = answers[step.id] ?? '';
  const isLastStep = stepIndex === IDEA_ONBOARDING_STEPS.length - 1;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!saving) void onContinue();
  };

  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-8 sm:px-8'>
        <form
          key={step.id}
          onSubmit={handleSubmit}
          className='animate-in fade-in slide-in-from-bottom-1 duration-200'
        >
          <div className='space-y-2'>
            <span className='font-mono text-[10px] uppercase tracking-[0.18em] text-primary'>
              {step.label}
            </span>
            <h2 className='max-w-xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl'>
              {step.question}
            </h2>
          </div>

          <div className='mt-7'>
            {step.input === 'choice' ? (
              <div
                role='radiogroup'
                aria-label={step.question}
                className='grid gap-2 sm:grid-cols-2'
              >
                {step.options?.map((option) => {
                  const selected = value === option;
                  return (
                    <button
                      key={option}
                      type='button'
                      role='radio'
                      aria-checked={selected}
                      disabled={saving}
                      onClick={() => onAnswerChange(step.id, option)}
                      className={cn(
                        'flex min-h-11 items-center justify-between rounded-lg border px-3.5 py-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60',
                        selected
                          ? 'border-primary/50 bg-primary/10 text-foreground'
                          : 'border-border bg-background/40 hover:border-primary/30 hover:bg-muted/40',
                      )}
                    >
                      <span>{option}</span>
                      {selected && <Icons.check className='size-4 text-primary' />}
                    </button>
                  );
                })}
              </div>
            ) : (
              <Textarea
                autoFocus
                value={value}
                onChange={(event) => onAnswerChange(step.id, event.target.value)}
                placeholder={step.placeholder}
                aria-label={step.question}
                rows={6}
                disabled={saving}
                className='min-h-40 resize-none bg-background/40 text-base leading-relaxed'
              />
            )}
          </div>

          {step.input === 'choice' && (
            <p className='mt-2 text-xs text-muted-foreground'>Choose one option.</p>
          )}

          {error && (
            <Alert variant='destructive' className='mt-5' aria-live='polite'>
              <Icons.warning />
              <AlertTitle>Could not save this answer</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className='mt-8 flex items-center justify-between gap-3 border-t border-border/60 pt-4'>
            <div>
              {stepIndex > 0 && (
                <Button type='button' variant='ghost' size='sm' onClick={onBack} disabled={saving}>
                  <Icons.chevronLeft className='size-3.5' />
                  Back
                </Button>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <Button type='button' variant='ghost' size='sm' onClick={onSkip} disabled={saving}>
                Skip
              </Button>
              <Button type='submit' size='sm' disabled={saving}>
                {saving ? <Icons.spinner className='size-3.5 animate-spin' /> : <Icons.arrowRight className='size-3.5' />}
                Continue
              </Button>
            </div>
          </div>

          <p className='mt-3 text-right font-mono text-[10px] text-muted-foreground'>
            Step {stepIndex + 1} of {IDEA_ONBOARDING_STEPS.length}
            {isLastStep ? ' · then explore with the assistant' : ''}
          </p>
        </form>
      </div>
    </div>
  );
}
