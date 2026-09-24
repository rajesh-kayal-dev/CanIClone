import { useEffect, useState } from 'react';

const QUERY = '(max-width: 768px)';

export function useMediaQuery() {
  const [isOpen, setIsOpen] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY);
    const handler = (event: MediaQueryListEvent) => setIsOpen(event.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return { isOpen };
}
