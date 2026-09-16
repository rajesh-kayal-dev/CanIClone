'use client';

import { useEffect } from 'react';

const SVG_TEMPLATE = (fill: string, stroke: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
  `<rect width="64" height="64" rx="14" fill="${fill}"/>` +
  `<g transform="translate(3.6,-0.8) scale(2.7)" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="M4 8a3.5 3 0 0 1 3.5-3h1a3.5 3 0 0 1 3.5 3a3 3 0 0 1-2 3a3 4 0 0 0-2 4"/>` +
  `<path d="M8 19v.01"/><path d="M17 15v-10"/><path d="M17 19v.01"/>` +
  `</g></svg>`;

function readThemeColors() {
  const s = getComputedStyle(document.documentElement);
  const primary = s.getPropertyValue('--primary').trim();
  const fg = s.getPropertyValue('--primary-foreground').trim();
  return { primary, fg };
}

function applyFavicon() {
  const { primary, fg } = readThemeColors();
  if (!primary || !fg) return;

  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.sizes = 'any';
    document.head.appendChild(link);
  }
  link.href = `data:image/svg+xml,${encodeURIComponent(SVG_TEMPLATE(primary, fg))}`;
}

export function ThemeFavicon() {
  useEffect(() => {
    applyFavicon();

    const observer = new MutationObserver(() => {
      applyFavicon();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
