import { getCategoryLabel } from '@/features/categories/data/categories';

export type Verdict = 'YES' | 'KINDA' | 'NO';

export interface AppRecord {
  slug: string;
  name: string;
  tagline: string;
  category: string;
  pricing: string;
  verdict: Verdict;
  confidence: number;
  voteCount: number;
  description: string;
  officialUrl?: string;
  repoUrl?: string;
  stack: string[];
  requirements: string[];
  whatYouLose: string[];
  moat: string[];
  diyTimeEstimate: string;
  prompt: string;
  alternatives: string[];
  tags: string[];
}

export const APPS: AppRecord[] = [
  {
    slug: 'chatgpt',
    name: 'ChatGPT',
    tagline: 'The general-purpose AI assistant that defined the category.',
    category: 'assistants',
    pricing: 'Freemium',
    verdict: 'KINDA',
    confidence: 76,
    voteCount: 2140,
    description:
      'ChatGPT is a conversational assistant that handles writing, coding, research, and creative work. At its core it is a model wrapper plus chat UI, plugin/API surface, memory, and voice. A functional, credible clone is very achievable; a competitive one is a data and infrastructure war.',
    officialUrl: 'https://chatgpt.com',
    stack: ['Next.js', 'OpenAI-compatible API', 'PostgreSQL', 'pgvector', 'LangGraph', 'Clerk'],
    requirements: [
      'An LLM provider key (OpenAI, Anthropic, or an open-weight model)',
      'Streaming chat UI with markdown rendering',
      'Persistent conversation history',
      'RAG layer for uploaded files and memory'
    ],
    whatYouLose: [
      'The trained model quality on the heavy users you see advertised',
      'ChatGPT-model ecosystem: GPTs, app actions, canvas',
      'Global low-latency serving and capacity',
      'Brand trust that makes millions log in daily'
    ],
    moat: [
      'Frontier model training on unmatched human-feedback data',
      'Distribution through browsers, phones, and enterprise deals',
      'Network effect of user-generated GPTs',
      'Compute and inference cost advantages'
    ],
    diyTimeEstimate: '6–9 months for an MVP; a polished product takes longer',
    prompt:
      'Build a multichannel AI assistant chat app. Create a streaming chat interface with markdown rendering, conversation history, and file upload with RAG retrieval. Wire it to an LLM provider for the model layer, add an optional plugin/action surface, and handle rate limits and billing for usage-based pricing.',
    alternatives: ['claude', 'perplexity', 'character-ai'],
    tags: ['chat', 'assistant', 'llm', 'rag']
  },
  {
    slug: 'claude',
    name: 'Claude',
    tagline: 'Anthropic\'s assistant, known for long-context writing and code.',
    category: 'assistants',
    pricing: 'Freemium',
    verdict: 'KINDA',
    confidence: 73,
    voteCount: 1587,
    description:
      'Claude competes head-to-head with ChatGPT on writing, coding, and long-document work via a massive context window and a distinctive "caring" personality. As a product it is thin: chat, projects, artifacts, and API. The reasoning and safety research is the real product.',
    officialUrl: 'https://claude.ai',
    stack: ['Next.js', 'Anthropic-compatible API', 'PostgreSQL', 'Turborepo', 'Tailwind CSS'],
    requirements: [
      'An LLM API key with long-context support',
      'Chat UI with code block rendering and diff-style outputs',
      'Project/prompt organization',
      'Conversation and usage tracking'
    ],
    whatYouLose: [
      'Anthropic\'s frontier model and long-context performance',
      'Responsible-AI engineering and safety evals',
      'The "project artifacts" canvas experience',
      'Established enterprise brand'
    ],
    moat: [
      'RLHF-tuned models trained up to the frontier',
      'Safety research that opens enterprise doors',
      'Featured distribution across apps and the web',
      'Trust of technical and writing communities'
    ],
    diyTimeEstimate: '5–8 months for an MVP',
    prompt:
      'Create a long-context AI assistant for writers and engineers. Build a chat interface with streaming markdown and syntax-highlighted code, project organization, and an artifacts/canvas panel for generated content. Connect to an LLM API with a long context window and add usage-based billing.',
    alternatives: ['chatgpt', 'perplexity', 'notion-ai'],
    tags: ['chat', 'assistant', 'writing', 'code']
  },
  {
    slug: 'perplexity',
    name: 'Perplexity',
    tagline: 'The answer engine that reads the live web and cites sources.',
    category: 'search',
    pricing: 'Freemium',
    verdict: 'KINDA',
    confidence: 69,
    voteCount: 1134,
    description:
      'Perplexity turns a question into a researched answer with inline citations. The product layer is small — query, web search, grounding, and an answer UI. Cloneable in weeks; the hard part is building a query pipeline that reliably beats plain Google + LLM glue.',
    officialUrl: 'https://www.perplexity.ai',
    stack: ['Next.js', 'SERP/Google CSE API', 'LLM API', 'Redis', 'PostgreSQL', 'Vercel'],
    requirements: [
      'A search/retrieval API (SERP, Google CSE, or scraping)',
      'LLM API for grounded answer generation',
      'Citation parsing and source ranking',
      'Query rewriting and follow-up handling'
    ],
    whatYouLose: [
      'Live-index freshness and scale',
      'Proprietary answer-ranking quality',
      'Crawler and index infrastructure',
      'Brand standing as "the" answer engine'
    ],
    moat: [
      'Indexing infrastructure and crawling at scale',
      'Fine-tuned retrieval + ranking models',
      'Breakout consumer brand',
      'Follow-ups that feel like a conversation'
    ],
    diyTimeEstimate: '4–6 weeks for a working prototype',
    prompt:
      'Build a web-grounded answer engine. Give a query box that rewrites the question, fetches live search results via a SERP or search API, summarizes them with an LLM, and renders an answer with numbered citations linking to sources. Add follow-up questions that refine the same thread.',
    alternatives: ['chatgpt', 'claude', 'chatbase'],
    tags: ['search', 'rag', 'research', 'citations']
  },
  {
    slug: 'midjourney',
    name: 'Midjourney',
    tagline: 'The image model whose output quality earned a cult following.',
    category: 'image',
    pricing: '$10/mo',
    verdict: 'NO',
    confidence: 91,
    voteCount: 2403,
    description:
      'Midjourney\'s interface is a Discord bot wrapped around a proprietary diffusion model. Nobody can clone the exact weights, and at the time of writing the output style is outperforming open models in many aesthetics. The lesson: pick a category where the model IS the product and you depend on frontier research.',
    officialUrl: 'https://www.midjourney.com',
    stack: ['Discord bot (or custom UI)', 'Diffusion API (Replicate/OpenAI gpt-image)', 'Cloud queue', 'Payments'],
    requirements: [
      'A high-quality image generation API or model',
      'Async job queue with progress events',
      'Prompt management and gallery',
      'Subscription billing'
    ],
    whatYouLose: [
      'The exact trained model and aesthetic',
      'Community of millions curating prompts',
      'Likeness-style personalization features',
      'Social virality of the brand'
    ],
    moat: [
      'Proprietary diffusion model trained in-house',
      'Extreme iteration speed on model quality',
      'Community and credentialing within Discord',
      'First-mover brand in "AI art"'
    ],
    diyTimeEstimate: '3–6 weeks to a wrapper product; the model is the barrier',
    prompt:
      'Build an AI image generation product. Create a prompt box with aspect-ratio and style presets, an async generation queue that streams progress, a gallery of past generations, and subscription billing. Use a hosted diffusion or image API for generation.',
    alternatives: ['ideogram', 'example'],
    tags: ['image', 'generation', 'diffusion', 'discord']
  },
  {
    slug: 'ideogram',
    name: 'Ideogram',
    tagline: 'Text-to-image that finally renders legible words and logos.',
    category: 'image',
    pricing: 'Freemium',
    verdict: 'YES',
    confidence: 79,
    voteCount: 488,
    description:
      'Ideogram made its name rendering typography correctly inside images — style presets, magic prompt, and a web gallery. A clone riding a capable open image model (or an image API) can replicate the experience; the differentiator is prompt UX, not weights.',
    officialUrl: 'https://ideogram.ai',
    stack: ['Next.js', 'Image API / open diffusion model', 'Object storage', 'PostgreSQL'],
    requirements: [
      'An image generation API (e.g. gpt-image, Flux)',
      'Style preset engine',
      'Prompt auto-completion ("magic prompt")',
      'Gallery with existing-image editing'
    ],
    whatYouLose: [
      'Ideogram\'s tuned typography model',
      'Curated community prompts and styles',
      'Scaling/eval investment in image quality'
    ],
    moat: [
      'Typography-first model quality',
      'Style presets that lower the skill floor',
      'Designer community and brand'
    ],
    diyTimeEstimate: '3–5 weeks',
    prompt:
      'Build a text-to-image editor focused on typography. Provide style presets, a "magic prompt" enhancer, aspect ratio controls, and a gallery with in-place editing. Generate images through a hosted image API and store results in object storage.',
    alternatives: ['midjourney', 'example'],
    tags: ['image', 'typography', 'design']
  },
  {
    slug: 'elevenlabs',
    name: 'ElevenLabs',
    tagline: 'Speech synthesis and voice cloning with human-sounding output.',
    category: 'audio',
    pricing: 'Freemium',
    verdict: 'KINDA',
    confidence: 74,
    voteCount: 1002,
    description:
      'ElevenLabs dominates text-to-speech quality and voice cloning. A clone can wrap a TTS API into a polished studio — voices, projects, playback, and licensing. The model quality and low-latency streaming are the moat; the app layer is buildable.',
    officialUrl: 'https://elevenlabs.io',
    stack: ['Next.js', 'TTS API (e.g. ElevenLabs, Azure Speech)', 'Audio pipeline', 'PostgreSQL', 'Audio workloads'],
    requirements: [
      'A high-quality TTS/voice API',
      'Voice cloning and voice management UI',
      'Project + document upload pipeline',
      'Audio streaming and playback'
    ],
    whatYouLose: [
      'The lowest-latency, highest-fidelity voice models',
      'Fine voice cloning and dubbing quality',
      'Scale of a voice-infrastructure company',
      'APIs, SDKs, and third-party integrations'
    ],
    moat: [
      'Proprietary neural TTS models',
      'Real-time streaming infra',
      'Creator ecosystem for voices and dubbing',
      'Compliance and IP tooling'
    ],
    diyTimeEstimate: '4–8 weeks',
    prompt:
      'Build a text-to-speech studio. Let users pick or clone a voice, upload documents for narration, adjust speed/pitch, and export audio or a shareable player. Stream generated audio through a TTS API and manage voices and projects in PostgreSQL.',
    alternatives: ['chatgpt', 'example'],
    tags: ['audio', 'tts', 'voice', 'dubbing']
  },
  {
    slug: 'github-copilot',
    name: 'GitHub Copilot',
    tagline: 'The AI pair programmer embedded where developers already live.',
    category: 'code',
    pricing: '$10/mo',
    verdict: 'KINDA',
    confidence: 64,
    voteCount: 1761,
    description:
      'Copilot is an IDE extension that suggests code inline. The extension itself is simple; what makes it powerful is model quality, editor distribution inside GitHub/VS Code, and multi-file context. A clone is feasible; competing on completion quality is where it gets hard.',
    officialUrl: 'https://github.com/features/copilot',
    stack: ['VS Code extension / LSP', 'LLM API', 'Prompt/context engine', 'Telemetry & eval'],
    requirements: [
      'An LLM provider tuned for code',
      'Editor extension (VS Code) with inline completions',
      'Context engine (open files, repo index)',
      'Usage metering and billing'
    ],
    whatYouLose: [
      'Copilot\'s code models and selection quality',
      'Tight integration with GitHub and VS Code',
      'Multi-file and organization context',
      'Trained human-feedback tuning at scale'
    ],
    moat: [
      'Code-model quality and eval pipeline',
      'Distribution inside the dominant editor + repo',
      'Telemetry loop from millions of accepted completions',
      'Enterprise licensing and security posture'
    ],
    diyTimeEstimate: '6–12 weeks for an extension MVP',
    prompt:
      'Build a code assistant IDE extension. Provide inline completions as the developer types, a chat panel with repo-aware answers, and snippet actions. Use an LLM API for generation with a context engine that feeds open files and the git working tree.',
    alternatives: ['cursor', 'lovable', 'example'],
    tags: ['code', 'ide', 'completion', 'pair-programming']
  },
  {
    slug: 'cursor',
    name: 'Cursor',
    tagline: 'A fork of VS Code rebuilt as an AI-native coding environment.',
    category: 'code',
    pricing: '$20/mo',
    verdict: 'KINDA',
    confidence: 70,
    voteCount: 1345,
    description:
      'Cursor took the open-source VS Code editor and made AI the center of gravity: composer, agent mode, repo-wide context, and a fast model router. Cloning the experience is a big but well-understood build on the VS Code fork; matching their model routing and latency tuning is the fight.',
    officialUrl: 'https://www.cursor.com',
    repoUrl: 'https://github.com/getcursor/cursor',
    stack: ['VS Code fork (Electron)', 'Model router', 'Indexing/pgvector', 'LangGraph-style agent loop'],
    requirements: [
      'Ability to fork and build a VS Code-based editor',
      'Model routing layer across providers',
      'Repo indexing for context',
      'Agent/edit streaming UX'
    ],
    whatYouLose: [
      'Cursor\'s tuned model routing and rules engine',
      'Fast, battle-tested indexing',
      'Autonomy of the agent loop on real repos',
      'Developer mindshare and conversion model'
    ],
    moat: [
      'Model orchestration + latency engineering',
      'Coding-agent reliability at scale',
      'Distribution momentum in the developer market',
      'Fast iteration culture on AI UX'
    ],
    diyTimeEstimate: '3–6 months',
    prompt:
      'Build an AI-native code editor on top of the VS Code fork. Add a chat panel with repo-wide retrieval, an agent mode that edits files and runs commands, and a model router that picks the best provider per task. Index the repository for context and stream edits inline.',
    alternatives: ['github-copilot', 'lovable', 'example'],
    tags: ['code', 'editor', 'agent', 'ide']
  },
  {
    slug: 'lovable',
    name: 'Lovable',
    tagline: 'An AI app builder: describe it in plain English, get a deployed app.',
    category: 'code',
    pricing: 'Freemium',
    verdict: 'KINDA',
    confidence: 61,
    voteCount: 812,
    description:
      'Lovable turns natural language into working, deployable web apps. The UX — a chat, a canvas, a live site, an editor — is impressive but cloneable. What\'s genuinely hard is the agentic engineering required to keep generated apps building, testing, and shipping reliably.',
    officialUrl: 'https://lovable.dev',
    stack: ['Next.js/React', 'Code-gen agent loop', 'Sandboxed preview runtime', 'Git + deploy pipeline'],
    requirements: [
      'An LLM coding agent (or API such as Claude Code)',
      'Sandboxed preview/build environment',
      'Deploy pipeline to a real URL',
      'DB and auth provisioning for generated apps'
    ],
    whatYouLose: [
      'Lovable\'s agent reliability on large sessions',
      'Polished preview + editing UX',
      'Eval infrastructure across thousands of sessions',
      'Anti-hallucination guardrails for generated code'
    ],
    moat: [
      'Agentic codegen reliability and evals',
      'User trust from "it actually deploys"',
      'Growth loop of shareable live apps',
      'Deployment + hosting integration'
    ],
    diyTimeEstimate: '4–8 weeks for a demo-grade version',
    prompt:
      'Build an AI app builder. Let users describe an app in chat, generate a working Next.js/React codebase with an agent, preview it in a live iframe sandbox, and deploy it to a temporary URL. Provision database and auth for generated apps and keep a per-session context store.',
    alternatives: ['cursor', 'github-copilot', 'example'],
    tags: ['code', 'builder', 'no-code', 'agent']
  },
  {
    slug: 'calcom',
    name: 'Cal.com',
    tagline: 'The open-source scheduling platform that took on Calendly.',
    category: 'productivity',
    pricing: 'Open Source',
    verdict: 'YES',
    confidence: 95,
    voteCount: 3100,
    description:
      'Cal.com is the canonical "can I clone this?" YES. The entire product — booking engine, availability, integrations, video-embedded routing — is open source under a business license. It is greenfield-friendly, the community is large, and the core value is an elegant product, not secret IP.',
    officialUrl: 'https://cal.com',
    repoUrl: 'https://github.com/calcom/cal.com',
    stack: ['Next.js', 'Prisma', 'PostgreSQL', 'tRPC', 'Tailwind CSS'],
    requirements: [
      'The open-source repo as a starting point',
      'PostgreSQL database',
      'OAuth creds for calendar providers',
      'Email + payments for premium features'
    ],
    whatYouLose: [
      'The hosting, domain, and managed infra Cal.com runs',
      'Their closed premium features and apps store',
      'Brand and the "booking link" habit',
      'Enterprise / white-label support'
    ],
    moat: [
      'Open-source community and contributor base',
      'Ecosystem of calendar integrations',
      'Cal.com Calendly-brand recognition',
      'Developer tooling/routing engine'
    ],
    diyTimeEstimate: '4–8 weeks to launch a meaningful product',
    prompt:
      'Build a scheduling product like Cal.com: an availability-based booking engine, a public booking link, calendar provider sync, reminders, and video-meeting routing. Reuse the open-source Cal.com codebase and PostgreSQL with Prisma, then differentiate with a vertical niche and polished UX.',
    alternatives: ['notion-ai', 'example', 'chatbase'],
    tags: ['scheduling', 'open-source', 'calendar', 'saas']
  },
  {
    slug: 'notion-ai',
    name: 'Notion AI',
    tagline: 'Writing and Q&A assistants embedded inside your docs platform.',
    category: 'productivity',
    pricing: 'Free plan + $10/mo',
    verdict: 'YES',
    confidence: 84,
    voteCount: 892,
    description:
      'Notion AI itself is a thin, high-utility product: generate, summarize, ask, and answer over your workspace. The moat is distribution inside Notion\'s docs/wiki lock-in. Building docs-plus-AI is a proven, very buildable wedge — the extra is the collaboration layer, not the AI.',
    officialUrl: 'https://www.notion.com/product/ai',
    stack: ['Next.js', 'LLM API', 'PostgreSQL', 'Realtime collaboration (Yjs/CRDTs)'],
    requirements: [
      'A rich-text docs editor (ProseMirror/Lexical)',
      'LLM integration for generate/summarize/ask',
      'Workspace data model with permissions',
      'Collaboration and sync'
    ],
    whatYouLose: [
      'Notion\'s distribution and template ecosystem',
      'Polished realtime collab and DB views',
      'Brand trust as "the" workspace',
      'Deep enterprise integrations'
    ],
    moat: [
      'Network effect of teams inside one workspace',
      'Templates, community, and plugin/app store',
      'Switching costs from wiki + docs + DB lock-in',
      'Data moat for workspace Q&A'
    ],
    diyTimeEstimate: '6–10 weeks',
    prompt:
      'Build a docs-and-wiki product with AI built in. Create a rich-text editor with blocks and a page tree, realtime collaboration, and an AI sidebar that can generate, summarize, and answer questions over the workspace with retrieval. Charge a per-seat AI add-on on top of a free plan.',
    alternatives: ['chatgpt', 'claude', 'calcom'],
    tags: ['writing', 'docs', 'wiki', 'collaboration']
  },
  {
    slug: 'chatbase',
    name: 'Chatbase',
    tagline: 'Let anyone train a chatbot on their own content in minutes.',
    category: 'chatbots',
    pricing: 'Freemium',
    verdict: 'YES',
    confidence: 90,
    voteCount: 611,
    description:
      'Chatbase is the classic "docs → chatbot" SaaS: upload files, scrape a site, get an embeddable bot. It is a text-book cloneable product — chunking, embedding, retrieval, chat UI, embed widget, billing. The space is crowded, but differentiation comes from UX and vertical focus.',
    officialUrl: 'https://www.chatbase.co',
    stack: ['Next.js', 'pgvector', 'OpenAI/embedding + LLM API', 'Web scraper', 'Stripe'],
    requirements: [
      'Document ingestion (upload + scrape)',
      'Chunking + embeddings into pgvector',
      'Retrieval chat with citations',
      'Embed widget + shareable links'
    ],
    whatYouLose: [
      'Chatbase\'s breadth of integrations and training knobs',
      'Mature fine-tuning options',
      'Brand among no-code builders',
      'Large template/example library'
    ],
    moat: [
      'Retrieval quality and chunking tuning',
      'Self-serve onboarding and embeddability',
      'Searchable marketing / SEO channel',
      'Low cost structure of API reselling'
    ],
    diyTimeEstimate: '4–8 weeks',
    prompt:
      'Build a "train a chatbot on your content" SaaS. Let users upload files or scrape URLs, chunk and embed into pgvector, preview the trust-answer behavior, and embed a chat widget on any site. Add source citations, shared links, and usage-based (Stripe) billing.',
    alternatives: ['character-ai', 'chatgpt', 'claude'],
    tags: ['chatbot', 'rag', 'embedding', 'saas']
  },
  {
    slug: 'character-ai',
    name: 'Character.AI',
    tagline: 'Persona-driven chat with millions of user-created characters.',
    category: 'chatbots',
    pricing: 'Freemium',
    verdict: 'KINDA',
    confidence: 58,
    voteCount: 1320,
    description:
      'Character.AI is a chat UI plus a character creation platform: personas, memory, voice, and enormous UGC. The engine is model work; the product is moderation, character tooling, and community. A clone is feasible; the moderation and UX-for-personas at scale is the challenge.',
    officialUrl: 'https://character.ai',
    stack: ['Next.js', 'LLM API + persona prompting', 'Character data model', 'Moderation pipeline', 'PostgreSQL'],
    requirements: [
      'A persona/prompt engine with memory',
      'Character creation and sharing UIs',
      'Conversation rating and quality signals',
      'Moderation and safety tooling'
    ],
    whatYouLose: [
      'Their persona-tuned model performance',
      'Huge user-generated character library',
      'Moderation and safety infrastructure',
      'Voice + avatar features depth'
    ],
    moat: [
      'UGC flywheel of characters',
      'Persona prompting + memory tuning',
      'Emotional-character brand lock-in',
      'Moderation that keeps a young audience safe'
    ],
    diyTimeEstimate: '6–10 weeks for an MVP',
    prompt:
      'Build a persona chatbot platform. Let creators define characters with personality, backstory, greeting, and memory. Provide a chat UI, character profiles, sharing/discovery, and explore/rating. Route to an LLM with persona prompting and add robust moderation for user content.',
    alternatives: ['chatbase', 'chatgpt', 'claude'],
    tags: ['chatbot', 'persona', 'ugc', 'entertainment']
  },
  {
    slug: 'example',
    name: 'Example App',
    tagline: 'A tiny reference app that demonstrates the whole CanIClone format.',
    category: 'example',
    pricing: 'Free',
    verdict: 'YES',
    confidence: 96,
    voteCount: 42,
    description:
      'This is the tiny, deliberately simple entry in the directory. It exists so every page of CanIClone — card, detail, alternatives, category — has a trivial "you could literally build this" example. No magic, no moat, and a fully readable build path.',
    stack: ['Next.js', 'Tailwind CSS', 'SQLite'],
    requirements: [
      'A text editor',
      'Node.js and a package manager',
      'A few hours of attention'
    ],
    whatYouLose: [
      'Absolutely nothing of substance',
      'No proprietary data or distribution edge'
    ],
    moat: [
      'There is none — that is the point',
      'The value is in the sample structure and prompt'
    ],
    diyTimeEstimate: '1–2 days',
    prompt:
      'Build the smallest useful web app you can: a single-page app with a heading, a list, and a button that mutates the list. Persist to a local SQLite database with an API route. Keep it boring and fast. Congratulations — you just cloned an Example App.',
    alternatives: ['lovable', 'calcom', 'ideogram'],
    tags: ['reference', 'starter', 'demo']
  }
];

export function getAppBySlug(slug: string): AppRecord | undefined {
  return APPS.find((app) => app.slug === slug);
}

export function getAppCount() {
  return APPS.length;
}

export function getPopularApps(limit = APPS.length): AppRecord[] {
  return [...APPS].sort((a, b) => b.voteCount - a.voteCount).slice(0, limit);
}

export function getAppsByCategory(categorySlug: string): AppRecord[] {
  return APPS.filter((app) => app.category === categorySlug);
}

export function countAppsByCategory(categorySlug: string): number {
  return getAppsByCategory(categorySlug).length;
}

export function getAlternatives(app: AppRecord, limit = 4): AppRecord[] {
  const curated = app.alternatives
    .map((slug) => getAppBySlug(slug))
    .filter((candidate): candidate is AppRecord => candidate !== undefined && candidate.slug !== app.slug)
    .slice(0, limit);

  if (curated.length >= limit) return curated;

  const fill = APPS.filter(
    (candidate) =>
      candidate.slug !== app.slug &&
      !curated.some((existing) => existing.slug === candidate.slug)
  )
    .sort((a, b) => b.voteCount - a.voteCount)
    .slice(0, limit - curated.length);

  return [...curated, ...fill];
}

export function getRelatedApps(app: AppRecord, limit = 4): AppRecord[] {
  const sameCategory = APPS.filter(
    (candidate) => candidate.slug !== app.slug && candidate.category === app.category
  );
  const fill = APPS.filter(
    (candidate) =>
      candidate.slug !== app.slug &&
      !sameCategory.some((existing) => existing.slug === candidate.slug)
  ).sort((a, b) => b.voteCount - a.voteCount);

  return [...sameCategory, ...fill].slice(0, limit);
}

export function searchApps(query: string): AppRecord[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  const tokens = normalized.split(/\s+/).filter(Boolean);

  const score = (app: AppRecord): number => {
    let total = 0;
    for (const token of tokens) {
      if (app.name.toLowerCase().includes(token)) total += 3;
      if (app.tagline.toLowerCase().includes(token)) total += 2;
      if (app.tags.some((tag) => tag.toLowerCase().includes(token))) total += 2;
      if (getCategoryLabel(app.category).toLowerCase().includes(token)) total += 1;
      if (app.description.toLowerCase().includes(token)) total += 0.5;
      if (app.stack.some((item) => item.toLowerCase().includes(token))) total += 1;
      if (
        app.whatYouLose.some((item) => item.toLowerCase().includes(token)) ||
        app.moat.some((item) => item.toLowerCase().includes(token))
      ) {
        total += 0.5;
      }
    }
    return total;
  };

  return APPS.map((app) => ({ app, score: score(app) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || b.app.voteCount - a.app.voteCount)
    .map(({ app }) => app);
}

export function formatVotes(votes: number): string {
  if (votes >= 1000) {
    return `${(votes / 1000).toFixed(votes % 1000 === 0 ? 0 : 1)}k`;
  }
  return String(votes);
}