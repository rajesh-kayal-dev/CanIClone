export const GLYPHS: Record<string, string[]> = {
  search: [
    "  000  ",
    " 0   0 ",
    " 0   0 ",
    "  000  ",
    "     0 ",
    "      0",
    "       "
  ],
  social: [
    "       ",
    "   0   ",
    " 0   0 ",
    "  0 0  ",
    " 0   0 ",
    "0     0",
    "       "
  ],
  dev: [
    "       ",
    "  0 0  ",
    " 0   0 ",
    "0     0",
    " 0   0 ",
    "  0 0  ",
    "       "
  ],
  writing: [
    "       ",
    "   0   ",
    "  000  ",
    " 00000 ",
    "  000  ",
    "   0   ",
    "       "
  ],
  automation: [
    "       ",
    " 0000  ",
    "0    0 ",
    "0  0 0 ",
    "0    0 ",
    " 0000  ",
    "       "
  ],
  chart: [
    "       ",
    "     0 ",
    "     0 ",
    "   0 0 ",
    "   0 0 ",
    " 0 0 0 ",
    " 0 0 0 "
  ],
  bag: [
    "       ",
    "  000  ",
    " 0   0 ",
    "0000000",
    "0     0",
    "0000000",
    "       "
  ],
  document: [
    "       ",
    " 0000  ",
    " 0   0 ",
    " 0 0 0 ",
    " 0   0 ",
    " 0000  ",
    "       "
  ],
  shield: [
    "       ",
    " 00000 ",
    " 0   0 ",
    " 0   0 ",
    "  0 0  ",
    "   0   ",
    "       "
  ],
  default: [
    "       ",
    "  000  ",
    " 0   0 ",
    " 0   0 ",
    " 0   0 ",
    "  000  ",
    "       "
  ]
};

export function getGlyph(name: string): string[] {
  const n = name.toLowerCase();
  
  if (n.includes('search')) return GLYPHS.search;
  if (n.includes('social') || n.includes('marketing') || n.includes('network')) return GLYPHS.social;
  if (n.includes('dev') || n.includes('code') || n.includes('api')) return GLYPHS.dev;
  if (n.includes('writing') || n.includes('text') || n.includes('ai') || n.includes('design')) return GLYPHS.writing;
  if (n.includes('auto') || n.includes('loop') || n.includes('task')) return GLYPHS.automation;
  if (n.includes('analytic') || n.includes('data') || n.includes('chart') || n.includes('finance') || n.includes('seo')) return GLYPHS.chart;
  if (n.includes('commerce') || n.includes('shop') || n.includes('store')) return GLYPHS.bag;
  if (n.includes('document') || n.includes('pdf') || n.includes('note') || n.includes('form')) return GLYPHS.document;
  if (n.includes('secure') || n.includes('shield') || n.includes('auth')) return GLYPHS.shield;
  if (n.includes('audio') || n.includes('video') || n.includes('media')) return GLYPHS.writing; // use spark for media
  
  return GLYPHS.default;
}
