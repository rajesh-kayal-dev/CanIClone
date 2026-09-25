import { getGlyph } from './micro-glyphs';
import { cn } from '@/lib/utils';

interface MicroGlyphProps {
  name: string;
  className?: string;
}

export function MicroGlyph({ name, className }: MicroGlyphProps) {
  const glyph = getGlyph(name);
  const rows = glyph.length;
  const cols = glyph[0].length;
  
  return (
    <svg 
      viewBox={`0 0 ${cols * 2} ${rows * 2}`} 
      className={cn('inline-block fill-current', className)}
      aria-hidden="true"
    >
      {glyph.map((row, y) => 
        row.split('').map((cell, x) => {
          if (cell !== '0') return null;
          return (
            <circle 
              key={`${x}-${y}`} 
              cx={x * 2 + 1} 
              cy={y * 2 + 1} 
              r={0.85} 
            />
          );
        })
      )}
    </svg>
  );
}
