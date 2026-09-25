import type { Metadata } from 'next';

import { IdeasWorkspace } from '@/features/ideas/components/ideas-workspace';

export const metadata: Metadata = {
  title: 'Ideas',
  description: 'Think through, research, and build your next idea with the CanIClone AI workspace.',
};

export default function IdeasPage() {
  return <IdeasWorkspace />;
}
