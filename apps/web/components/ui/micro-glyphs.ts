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
  media: [
    "       ",
    " 00000 ",
    " 0 0 0 ",
    " 0 0 0 ",
    " 0 0 0 ",
    " 00000 ",
    "       "
  ],
  database: [
    " 00000 ",
    " 0   0 ",
    " 00000 ",
    " 0   0 ",
    " 00000 ",
    " 0   0 ",
    " 00000 "
  ],
  mail: [
    "       ",
    "0000000",
    " 0 0 0 ",
    "  000  ",
    "   0   ",
    "0000000",
    "       "
  ],
  calendar: [
    " 0   0 ",
    "0000000",
    "0 0 0 0",
    "0 0 0 0",
    "0 0 0 0",
    "0000000",
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
  const k = name.toLowerCase().trim();
  
  if (k.includes('search') || k.includes('rss')) return GLYPHS.search;
  if (k.includes('social') || k.includes('community') || k.includes('marketing') || k.includes('network') || k.includes('link-in-bio') || k.includes('waitlists')) return GLYPHS.social;
  if (k.includes('dev') || k.includes('code') || k.includes('api') || k.includes('hosting') || k.includes('uptime') || k.includes('monitoring') || k.includes('cron')) return GLYPHS.dev;
  if (k.includes('writing') || k.includes('text') || k.includes('assistant') || k.includes('blog') || k.includes('publishing')) return GLYPHS.writing;
  if (k.includes('auto') || k.includes('workflow') || k.includes('loop') || k.includes('task') || k.includes('no-code')) return GLYPHS.automation;
  if (k.includes('chart') || k.includes('analytic') || k.includes('finance') || k.includes('seo') || k.includes('data') || k.includes('tracking')) return GLYPHS.chart;
  if (k.includes('commerce') || k.includes('shop') || k.includes('sales') || k.includes('crm') || k.includes('store')) return GLYPHS.bag;
  if (k.includes('document') || k.includes('pdf') || k.includes('note') || k.includes('knowledge') || k.includes('form') || k.includes('reading') || k.includes('read-it-later') || k.includes('education')) return GLYPHS.document;
  if (k.includes('secure') || k.includes('shield') || k.includes('auth') || k.includes('legal') || k.includes('hr')) return GLYPHS.shield;
  if (k.includes('audio') || k.includes('video') || k.includes('media') || k.includes('photo') || k.includes('screen-recording') || k.includes('screenshot') || k.includes('podcasting') || k.includes('image')) return GLYPHS.media;
  if (k.includes('database') || k.includes('docs-databases')) return GLYPHS.database;
  if (k.includes('email') || k.includes('newsletter') || k.includes('outreach')) return GLYPHS.mail;
  if (k.includes('calendar') || k.includes('scheduling') || k.includes('meeting') || k.includes('time')) return GLYPHS.calendar;
  
  return GLYPHS.default;
}
