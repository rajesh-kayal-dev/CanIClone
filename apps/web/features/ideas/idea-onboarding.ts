import type { IdeaDetail, IdeaUpdate } from '@/lib/api/ideas';

export type IdeaOnboardingStepId =
  | 'problem'
  | 'targetUsers'
  | 'solution'
  | 'purpose'
  | 'budget'
  | 'technology';

export type IdeaOnboardingAnswers = Record<IdeaOnboardingStepId, string>;

type IdeaContextField = 'description' | 'targetUsers' | 'purpose' | 'budget' | 'technology';

export type IdeaOnboardingStep = {
  id: IdeaOnboardingStepId;
  label: string;
  question: string;
  input: 'textarea' | 'choice';
  placeholder?: string;
  options?: readonly string[];
  field: IdeaContextField;
};

/**
 * The onboarding conversation is intentionally defined in one place. Each
 * answer is projected onto the existing Idea context fields below; no new
 * persistence fields are needed for the UI.
 */
export const IDEA_ONBOARDING_STEPS = [
  {
    id: 'problem',
    label: 'START HERE',
    question: 'What problem would you like to solve?',
    input: 'textarea',
    placeholder: 'Describe the problem in your own words...',
    field: 'description',
  },
  {
    id: 'targetUsers',
    label: 'A LITTLE MORE CONTEXT',
    question: 'Who is experiencing this problem?',
    input: 'textarea',
    placeholder: 'Tell me who runs into this problem...',
    field: 'targetUsers',
  },
  {
    id: 'solution',
    label: 'A LITTLE MORE CONTEXT',
    question: 'Do you already have an idea for solving this problem?',
    input: 'textarea',
    placeholder: 'Share an early idea, or leave it blank for now...',
    field: 'description',
  },
  {
    id: 'purpose',
    label: 'YOUR PURPOSE',
    question: 'What are you building this for?',
    input: 'choice',
    options: ['Personal project', 'College project', 'Business', 'Startup', 'Learning', 'Other'],
    field: 'purpose',
  },
  {
    id: 'budget',
    label: 'CONSTRAINTS',
    question: 'Do you have a budget in mind?',
    input: 'textarea',
    placeholder: 'A number, a range, or no budget yet...',
    field: 'budget',
  },
  {
    id: 'technology',
    label: 'PREFERENCES',
    question: 'Do you have any technology preferences or things you want to avoid?',
    input: 'textarea',
    placeholder: 'Share what you prefer or want to avoid...',
    field: 'technology',
  },
] as const satisfies readonly IdeaOnboardingStep[];

const SOLUTION_MARKER = '\n\nSolution idea:';

export function createEmptyIdeaOnboardingAnswers(): IdeaOnboardingAnswers {
  return {
    problem: '',
    targetUsers: '',
    solution: '',
    purpose: '',
    budget: '',
    technology: '',
  };
}

function parseDescription(description: string | null): { problem: string; solution: string } {
  const value = description?.trim() ?? '';
  const markerIndex = value.indexOf(SOLUTION_MARKER);

  if (markerIndex === -1) {
    return {
      problem: value.replace(/^Problem:\s*/i, ''),
      solution: '',
    };
  }

  return {
    problem: value.slice(0, markerIndex).replace(/^Problem:\s*/i, '').trim(),
    solution: value.slice(markerIndex + SOLUTION_MARKER.length).trim(),
  };
}

function composeDescription(problem: string, solution: string): string | null {
  const sections: string[] = [];
  if (problem.trim()) sections.push(`Problem: ${problem.trim()}`);
  if (solution.trim()) sections.push(`Solution idea: ${solution.trim()}`);
  return sections.length ? sections.join('\n\n') : null;
}

export function readIdeaOnboardingAnswers(detail: IdeaDetail): IdeaOnboardingAnswers {
  const description = parseDescription(detail.description);

  return {
    problem: description.problem,
    targetUsers: detail.targetUsers ?? '',
    solution: description.solution,
    purpose: detail.purpose ?? '',
    budget: detail.budget ?? '',
    technology: detail.technology ?? '',
  };
}

/**
 * Build the existing API patch for one onboarding answer. The schema has one
 * `description` field for the problem/idea, so problem and solution are kept
 * together there instead of introducing a duplicate database field. The
 * persisted map is supplied separately so a skipped, unsaved draft answer is
 * never included when another step is saved.
 */
export function buildIdeaOnboardingPatch(
  step: IdeaOnboardingStep,
  value: string,
  answers: IdeaOnboardingAnswers,
  persistedAnswers: IdeaOnboardingAnswers = answers,
): IdeaUpdate {
  const nextAnswers = { ...persistedAnswers, [step.id]: value };
  const normalizedValue = value.trim() || null;

  switch (step.id) {
    case 'problem':
    case 'solution':
      return {
        description: composeDescription(nextAnswers.problem, nextAnswers.solution),
      };
    case 'targetUsers':
      return normalizedValue ? { targetUsers: normalizedValue } : {};
    case 'purpose':
      return normalizedValue ? { purpose: normalizedValue } : {};
    case 'budget':
      return normalizedValue ? { budget: normalizedValue } : {};
    case 'technology':
      return normalizedValue ? { technology: normalizedValue } : {};
  }
}
