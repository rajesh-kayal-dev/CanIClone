import { Icons } from '@/components/icons';

export interface CategoryRecord {
  slug: string;
  name: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const CATEGORIES: CategoryRecord[] = [
  {
    slug: 'assistants',
    name: 'AI Assistants',
    description: 'General-purpose chat companions and everyday Q&A helpers.',
    icon: Icons.sparkles
  },
  {
    slug: 'chatbots',
    name: 'Chatbots',
    description: 'Branded, embeddable chatbots and personality-driven characters.',
    icon: Icons.chat
  },
  {
    slug: 'search',
    name: 'AI Search',
    description: 'Answer engines that understand intent, not just keywords.',
    icon: Icons.search
  },
  {
    slug: 'image',
    name: 'Image Generation',
    description: 'Text-to-image and image-editing products with high-quality outputs.',
    icon: Icons.media
  },
  {
    slug: 'audio',
    name: 'Audio & Voice',
    description: 'Speech synthesis, voice cloning, and text-to-voice APIs.',
    icon: Icons.music
  },
  {
    slug: 'code',
    name: 'Code Generation',
    description: 'Coding copilots and AI app builders that ship working software.',
    icon: Icons.code
  },
  {
    slug: 'productivity',
    name: 'Productivity',
    description: 'Tools that make teams faster: scheduling, docs, and workflows.',
    icon: Icons.calendar
  },
  {
    slug: 'example',
    name: 'Reference',
    description: 'Tiny, deliberately simple apps that show the whole CanIClone format.',
    icon: Icons.circle
  }
];

export function getCategoryBySlug(slug: string): CategoryRecord | undefined {
  return CATEGORIES.find((category) => category.slug === slug);
}

export function getCategoryLabel(slug: string): string {
  return getCategoryBySlug(slug)?.name ?? slug;
}