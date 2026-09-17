'use client';

export function MarketSourceBadges() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Google Trends Badge Card */}
      <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-xs">
        <div className="w-7 h-7 rounded-lg bg-white/10 dark:bg-white/5 border border-border/40 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground tracking-tight">
            Search interest — Google Trends
          </span>
          <span className="text-[11px] text-muted-foreground/80">
            Values are relative, not absolute.
          </span>
        </div>
      </div>

      {/* Trends API Badge Card */}
      <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm shadow-xs">
        <div className="flex items-center -space-x-1.5 shrink-0">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white z-10 border border-border/40 shadow-xs">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.64-.78 1.08-1.86.96-2.95-1 .04-2.16.67-2.83 1.45-.58.68-1.1 1.77-.96 2.83 1.12.09 2.19-.55 2.83-1.33z" />
            </svg>
          </div>
          <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center text-white border border-border/40 shadow-xs">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a2.22 2.22 0 0 1-.61-1.594V3.408c0-.62.23-1.192.61-1.594zm11.303 11.306l2.368 2.368-11.758 6.784 9.39-9.152zm0-2.24L5.522 1.726l11.758 6.784-2.368 2.37zm1.742 1.12l3.812 2.201a1.272 1.272 0 0 1 0 2.202l-3.812 2.201-2.488-2.488 2.488-2.488z" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-foreground tracking-tight">
            App-store signals — Trends API
          </span>
          <span className="text-[11px] text-muted-foreground/80">
            Estimated downloads and rankings.
          </span>
        </div>
      </div>
    </div>
  );
}
