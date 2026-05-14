import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Server, Bot, Route, Workflow, Terminal, 
  GitBranch, Code2, Database, Shield, Zap, Search, Globe, 
  Layers, CheckCircle2, Activity, BookOpen, 
  Cpu, FileText, MessagesSquare, Check,
  AlertTriangle, Settings, FileBox
} from 'lucide-react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";

import "highlight.js/styles/github-dark.css";

import part1 from './assets/mishkat_final_blueprint_part1.md?raw';
import part2 from './assets/mishkat_final_blueprint_part2.md?raw';
import part3a from './assets/mishkat_final_blueprint_part3a.md?raw';
import part3b from './assets/mishkat_final_blueprint_part3b.md?raw';
import advanced from './assets/mishkat_advanced_features.md?raw';


// ==========================================
// MASSIVE DATA MODELS (Extracted from Parts 1-3B & Advanced)
// ==========================================

const currentAudit = [
  { component: 'API Server', tech: 'Python FastAPI monolith', status: 'Working', gap: 'Single process, no horizontal scaling', debt: 'QueryController.py handles too much. No message queue.' },
  { component: 'Document DB', tech: 'MongoDB (Motor async)', status: 'Working', gap: 'No replica set, no sharding', debt: 'Tight coupling in lifespan.py' },
  { component: 'Vector DB', tech: 'Qdrant', status: 'Working', gap: 'Single node', debt: 'No embedding cache' },
  { component: 'LLM Providers', tech: 'Ollama, Google, HuggingFace', status: 'Working', gap: 'No fallback chain', debt: 'Every query hits LLM + Qdrant directly' },
  { component: 'Frontend', tech: 'React + Vite + Tailwind v4', status: 'Basic', gap: 'Single-file App.tsx', debt: 'No routing, basic auth' },
  { component: 'Security', tech: 'bcrypt hashing, CORS [*]', status: 'Insecure', gap: 'No JWT, RBAC, OAuth', debt: 'Wide open CORS' },
];

const techStack = [
  { service: 'API Gateway', lang: 'Go', framework: 'Gin + ReverseProxy', reason: 'Custom-built: full control, sub-ms routing, native middleware chain.' },
  { service: 'Auth & User Services', lang: 'Go', framework: 'Gin', reason: 'Sub-ms token validation, minimal memory, highly concurrent.' },
  { service: 'Query & Chat Services', lang: 'Go', framework: 'Gin + Gorilla WS / gRPC', reason: 'Orchestrates AI calls, handles backpressure, SSE/WebSocket streaming.' },
  { service: 'Data Ingestion', lang: 'Java', framework: 'Spring Boot 3 + Spring Batch', reason: 'Enterprise batch processing, scheduling, transactional ETL.' },
  { service: 'Reference Service', lang: '.NET 8', framework: 'ASP.NET Minimal API', reason: 'iText7 for PDF, NPOI for Excel, rich document parsing.' },
  { service: 'RAG & Embedding', lang: 'Python', framework: 'FastAPI + gRPC', reason: 'Keep existing logic, HuggingFace integration, model inference.' },
  { service: 'Agent Orchestrator', lang: 'Python', framework: 'LangGraph', reason: 'Multi-agent orchestration, tool routing, memory management.' },
];

const microservices = [
  {
    id: 'S0', name: 'Gateway Service', lang: 'Go',
    purpose: 'Custom API Gateway. Single entry point handling reverse proxying, JWT, rate limiting, and CORS.',
    architecture: ['RecoveryMiddleware', 'RequestIdMiddleware', 'LoggerMiddleware', 'TracingMiddleware', 'CorsMiddleware', 'RateLimitMiddleware', 'JwtMiddleware', 'RequestSanitizerMiddleware'],
    details: 'Uses YAML-driven RouteConfig. Sub-millisecond overhead compared to Kong/Envoy. Integrates a Health Aggregator.'
  },
  {
    id: 'S1', name: 'Data Ingestion Service', lang: 'Java Spring Boot',
    purpose: 'Enterprise ETL pipeline for ingesting Islamic texts, cleaning, chunking, and triggering embeddings.',
    architecture: ['Readers (Json, Csv, Pdf, Xml, Html, Api, Shamela)', 'Extractors (Metadata, Isnad, Matn)', 'Converters (Normalizer, Diacritic, Dedup)', 'Validators (Schema, Content, Integrity)', 'Spring Batch (Chunker, Enricher, Tagger)'],
    details: 'Outputs to Mongo, S3, and fires Kafka events (ingestion.complete) to trigger Python Embedding service.'
  },
  {
    id: 'S2', name: 'Reference Service', lang: '.NET 8',
    purpose: 'Manages reference sources, document parsing (PDF, DOCX), and catalog maintenance.',
    architecture: ['PdfParser (iText7)', 'Docx/ExcelParser (NPOI)', 'EpubParser', 'ImageParser (Tesseract OCR)', 'StructureAnalyzer', 'VersionManager'],
    details: 'Handles right-to-left Arabic extraction, detects columns, and manages the Reference Crud Service.'
  },
  {
    id: 'S3', name: 'Auth Service', lang: 'Go',
    purpose: 'High-performance auth, JWT lifecycle, OAuth2, RBAC, MFA, API keys.',
    architecture: ['TokenService (JWT RS256)', 'OAuthService', 'MfaService (TOTP)', 'RbacService', 'TokenBlacklist (Redis)'],
    details: 'Issues 15min access & 7d refresh tokens. Hashes with bcrypt (cost 12). Strict RBAC checks.'
  },
  {
    id: 'S4', name: 'User Service', lang: 'Go',
    purpose: 'User profile management, preferences, learning progress, saved research.',
    architecture: ['ProfileService', 'PreferencesService', 'SavedResearchService', 'LearningProgressService'],
    details: 'Stores JSON preferences (madhab, theme, diacritics toggle) in Redis/Postgres.'
  },
  {
    id: 'S5', name: 'Query Service', lang: 'Go',
    purpose: 'The orchestrator. Receives queries, calls Python RAG via gRPC, manages streaming.',
    architecture: ['QueryOrchestrator', 'CacheService (Redis)', 'StreamManager (SSE)', 'RetryHandler (Circuit Breaker)'],
    details: 'Checks exact Redis cache first, then Qdrant semantic cache (>0.95 sim), then calls Python.'
  },
  {
    id: 'S6', name: 'Chat Service', lang: 'Go',
    purpose: 'Real-time chat, WebSocket connections, conversation memory.',
    architecture: ['ChatService', 'MessageService', 'WebSocketHub (Gorilla)', 'TitleGenerator', 'ConversationMemory'],
    details: 'Maintains last 20 messages in Redis for sliding window context. Broadcasts typing indicators.'
  },
  {
    id: 'S7', name: 'RAG Engine', lang: 'Python',
    purpose: 'AI core executing the pipeline. Exposes gRPC to Query Service.',
    architecture: ['PreProcessor', 'QueryRewriter', 'MultiCollectionRetriever', 'DocumentReranker', 'ResponseGenerator', 'PostProcessor'],
    details: 'Includes an LLM Cascading Failover (Google -> Ollama -> Cohere -> HuggingFace) with Circuit Breakers.'
  },
  {
    id: 'S8', name: 'Embedding Service', lang: 'Python',
    purpose: 'Model inference service for text embedding. Decoupled for GPU scaling.',
    architecture: ['SingleEmbedder', 'BatchEmbedder (Kafka)', 'EmbeddingCache (Redis)', 'ModelManager (BGE-M3, Jina)'],
    details: 'Caching embeddings by sha256 text hash eliminates ~40% of redundant API calls.'
  },
  {
    id: 'S9', name: 'Agent Orchestrator', lang: 'Python',
    purpose: 'Multi-agent system using LangGraph. Supervisor routes to specialist agents.',
    architecture: ['IntentClassifier', 'ExecutionPlanner', 'AgentRouter', 'ToolRegistry (38 tools)', 'MemoryManager'],
    details: 'Contains 9 core agents (RAG, Research, Tutor, Verify, etc.) and enforces RBAC on tool execution.'
  }
];

const agents = [
  { name: 'Supervisor Agent', icon: Cpu, type: 'Router', desc: 'Analyzes intent, creates execution plans (parallel/sequential), and routes to specialists.' },
  { name: '📖 RAG Agent', icon: BookOpen, type: 'Core', desc: 'Standard Q&A. Pipeline: Clean -> Rewrite -> Multi-Search -> Rank -> Generate -> Hallucination Check.' },
  { name: '🔬 Research Agent', icon: Search, type: 'Deep', desc: 'Multi-source research across Hadith, Quran, Tafsir, Web, and Fatwas. Outputs structured reports.' },
  { name: '⚖️ Comparative Agent', icon: GitBranch, type: 'Fiqh', desc: 'Compares 4 madhabs. Outputs tables with evidence, consensus points, and strongest opinions.' },
  { name: '🎓 Tutor Agent', icon: CheckCircle2, type: 'Learning', desc: 'Adaptive learning. Adjusts depth, generates quizzes, tracks progress, suggests next topics.' },
  { name: '✅ Verification Agent', icon: Shield, type: 'Authenticity', desc: 'Isnad analysis. Outputs Chain validation, cross-references, scholar gradings, and confidence.' },
  { name: '🧹 Cleaning Agent', icon: Settings, type: 'Pipeline', desc: 'Admin agent to process raw Islamic texts, diacritize, extract entities, and embed data.' },
  { name: '🌍 Translation Agent', icon: Globe, type: 'Lang', desc: 'Accurate translations (8 languages: AR, EN, UR, FR, TR, MS, ID, BN) with transliteration fallback.' },
  { name: '📊 Summarization Agent', icon: FileText, type: 'Utility', desc: 'Topic overviews, study notes. Uses topic_classify and extract_keywords tools.' },
  { name: '💬 General Agent', icon: MessagesSquare, type: 'Fallback', desc: 'Handles greetings. Politely redirects non-Islamic queries back to core domains.' }
];

const advancedAgents = [
  { name: '🔗 Citation Network', desc: 'Builds knowledge graphs of hadith citations. Exportable to DOT/GraphML.' },
  { name: '📜 Fatwa Generation', desc: 'Drafts preliminary responses. Always marked "Awaiting Scholar Review".' },
  { name: '🗣️ Debate Agent', desc: 'Formal munazara structure. Position A vs B, tarjih, and recommended actions.' },
  { name: '📦 Data Lineage', desc: 'Tracks journey from raw file -> parser -> chunk -> vector -> approved by.' },
  { name: '📊 Meta-Analysis', desc: 'Hub feature: Systematic reviews, statistical summaries, PRISMA flow diagrams.' },
];

const allTools = [
  { cat: 'Search & Retrieval', list: [
    { name: 'vector_search', inOut: 'query, collection → ranked chunks' },
    { name: 'keyword_search', inOut: 'keywords → matching documents' },
    { name: 'web_search', inOut: 'query → URLs + snippets' },
    { name: 'web_scrape', inOut: 'URL → cleaned text' },
    { name: 'quran_search', inOut: 'surah:ayah → text + translation' },
    { name: 'tafsir_lookup', inOut: 'surah:ayah → explanation text' },
    { name: 'hadith_by_number', inOut: 'collection, num → full record' },
    { name: 'cross_reference_search', inOut: 'hadith_id → identical narrations' },
    { name: 'narrator_search', inOut: 'name → bio, grading, teachers' },
    { name: 'fatwa_search', inOut: 'topic, madhab → scholarly opinions' },
  ]},
  { cat: 'Text Processing', list: [
    { name: 'arabic_clean', inOut: 'raw → normalized (no tashkeel)' },
    { name: 'arabic_diacritize', inOut: 'raw → fully voweled' },
    { name: 'transliterate', inOut: 'Arabic → Buckwalter/Roman' },
    { name: 'translate_text', inOut: 'text, src, tgt → translated' },
    { name: 'summarize_text', inOut: 'text, length → summary' },
    { name: 'extract_keywords', inOut: 'text → Islamic terms, entities' },
    { name: 'detect_language', inOut: 'text → lang code + confidence' },
    { name: 'chunk_text', inOut: 'text → overlapping chunks' },
    { name: 'parse_pdf / html', inOut: 'file → clean markdown' },
  ]},
  { cat: 'Analysis & Storage', list: [
    { name: 'verify_isnad', inOut: 'chain → grading, weak links' },
    { name: 'grade_hadith', inOut: 'text → Sahih/Da\'if + reasoning' },
    { name: 'compare_narrations', inOut: '2+ texts → diff analysis' },
    { name: 'topic_classify', inOut: 'text → Fiqh/Aqeedah labels' },
    { name: 'hallucination_check', inOut: 'LLM + source → verified claims' },
    { name: 'cache_get/set', inOut: 'key ↔ value + TTL' },
    { name: 'embed_text', inOut: 'text → 1024-dim BGE-M3 vector' },
  ]},
];

const rbacMatrix = [
  { role: 'Guest', limit: '5/hr', permissions: 'Basic RAG, Browse references, Vector/Keyword search' },
  { role: 'Student', limit: '50/hr', permissions: 'Everything + Web search, Save research, Tutor agent, Verification tools' },
  { role: 'Scholar', limit: '200/hr', permissions: 'Everything + Hub publishing, PDF upload, Full tool access, Approve Fatwas' },
  { role: 'Admin', limit: 'Unlimited', permissions: 'Data ingestion, User management, System config, Raw embedding access' },
];

const roadmapPhases = [
  { p: 1, title: 'Foundation', w: '1-4', tasks: ['Monorepo setup', 'Auth Service (Go)', 'Gateway Service (Go)', 'Python RAG extraction', 'gRPC contracts'] },
  { p: 2, title: 'Core Services', w: '5-8', tasks: ['Query/Chat/User Services (Go)', 'Data Ingestion (Java)', 'Reference (.NET)', 'Integration tests'] },
  { p: 3, title: 'Agent System', w: '9-12', tasks: ['Tool Registry (38 tools)', 'Supervisor routing', 'Enhanced RAG', 'Research & Verification Agents'] },
  { p: 4, title: 'Content', w: '13-16', tasks: ['Kutub al-Sittah', 'Comparative Agent', 'Translation Agent', 'Narrator DB', 'Semantic Query Cache'] },
  { p: 5, title: 'Frontend', w: '17-20', tasks: ['Next.js 15 + shadcn', 'Agent selector UI', 'Admin dashboard', 'PWA Offline mode'] },
  { p: 6, title: 'Launch', w: '21-24', tasks: ['EKS Kubernetes', 'Load testing', 'Prometheus/Jaeger', 'LLM fallback chain'] },
  { p: 7, title: 'CLI & MVC', w: '25-28', tasks: ['msk CLI', '.mishkat.zst compression', 'MVC S3/Postgres', 'Scholar Review Requests (PRs)'] },
  { p: 8, title: 'Skill Engine', w: '29-31', tasks: ['Skill YAML schema', 'Runner (Local/Docker)', 'Skill Registry', '10 official skills'] },
  { p: 9, title: 'Mishkat-Hub', w: '32-35', tasks: ['Hub backend', 'Research Studio (Yjs)', 'Citation Manager', 'Forum + @mentions'] },
  { p: 10, title: 'Automation', w: '36-38', tasks: ['n8n-style Canvas', 'Trigger/Logic Blocks', 'Pipeline Executor', 'Marketplace'] },
  { p: 11, title: 'Adv Integration', w: '39-40', tasks: ['Citation Network', 'Fatwa/Debate Agents', 'Smart Notifications', 'Public Launch'] },
];

// ==========================================
// ASSET MANIFEST DEFINITIONS
// ==========================================
const markdownFiles = [
  {
  id: 'part1',
  title: 'Part 1: Architecture & AI',
  content: part1,
  },
  {
  id: 'part2',
  title: 'Part 2: Tools & DevOps',
  content: part2,
  },
  {
  id: 'part3a',
  title: 'Part 3A: Gateway & Data Pipelines',
  content: part3a,
  },
  {
  id: 'part3b',
  title: 'Part 3B: AI & Orchestration',
  content: part3b,
  },
  {
  id: 'advanced',
  title: 'Advanced Features Blueprint',
  content: advanced,
  },
  ];
  

// ==========================================
// REUSABLE UI COMPONENTS (Dark Mode)
// ==========================================

const Badge = ({ children, color = 'bg-zinc-800 text-zinc-300 border border-zinc-700' }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${color}`}>
    {children}
  </span>
);

const Card = ({ children, className = '', title, icon: Icon }) => (
  <div className={`bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col ${className}`}>
    {title && (
      <div className="bg-zinc-800/50 border-b border-zinc-800 px-5 py-4 flex items-center gap-3">
        {Icon && <Icon className="text-orange-500" size={20} />}
        <h3 className="font-bold text-zinc-100">{title}</h3>
      </div>
    )}
    <div className="p-5 flex-1">{children}</div>
  </div>
);

const CodeBlock = ({ title, code, language = 'bash' }) => (
  <div className="rounded-lg overflow-hidden border border-zinc-800 bg-[#0d0d0f] mt-4 shadow-inner">
    {title && <div className="bg-zinc-800/80 text-zinc-400 text-xs px-4 py-2 border-b border-zinc-800 font-mono flex items-center justify-between">
      <span>{title}</span>
      <span className="uppercase text-[10px]">{language}</span>
    </div>}
    <pre className="p-4 text-sm text-orange-300 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
      {code}
    </pre>
  </div>
);

// ==========================================
// VIEWS
// ==========================================

const ArchitectureView = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card title="Current Debt vs Target Resolution" icon={AlertTriangle}>
        <div className="space-y-4">
          {currentAudit.slice(0, 4).map((audit, i) => (
            <div key={i} className="flex flex-col gap-1 text-sm border-b border-zinc-800 pb-3 last:border-0">
              <div className="flex justify-between font-bold text-zinc-200">
                <span>{audit.component}</span>
                <span className="text-red-400">{audit.gap}</span>
              </div>
              <p className="text-zinc-500">{audit.debt}</p>
            </div>
          ))}
        </div>
      </Card>
      
      <Card title="Hybrid Tech Stack Philosophy" icon={Layers}>
        <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
          Languages are chosen for their <strong>strongest domain</strong>, not uniformity. Connected via gRPC and Kafka.
        </p>
        <div className="space-y-3">
          {techStack.map((tech, i) => (
            <div key={i} className="bg-zinc-800/30 rounded p-3 border border-zinc-800 flex gap-4 items-start">
              <div className="mt-0.5"><Badge color={tech.lang === 'Go' ? 'bg-cyan-900/30 text-cyan-400 border-cyan-800/50' : tech.lang === 'Python' ? 'bg-blue-900/30 text-blue-400 border-blue-800/50' : 'bg-red-900/30 text-red-400 border-red-800/50'}>{tech.lang}</Badge></div>
              <div>
                <p className="font-bold text-sm text-zinc-200">{tech.service} <span className="font-normal text-zinc-500">({tech.framework})</span></p>
                <p className="text-xs text-zinc-400 mt-1">{tech.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>

    <Card title="Security & RBAC Architecture" icon={Shield}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h4 className="font-bold text-zinc-100 mb-3 text-sm uppercase tracking-wider">Role-Based Access Control</h4>
          <div className="space-y-2">
            {rbacMatrix.map((r, i) => (
              <div key={i} className="flex gap-4 items-center p-3 rounded-lg border border-zinc-800 bg-zinc-900/50">
                <div className="w-20"><Badge color="bg-orange-500/10 text-orange-400 border-orange-500/20">{r.role}</Badge></div>
                <div className="w-16 text-xs font-mono text-zinc-500">{r.limit}</div>
                <div className="text-xs text-zinc-400 leading-relaxed flex-1">{r.permissions}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-bold text-zinc-100 mb-3 text-sm uppercase tracking-wider">Islamic Content Security</h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-2 text-sm text-zinc-400"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/> <strong className="text-zinc-200">Source Attribution:</strong> Every response MUST include book, chapter, number, narrator.</li>
            <li className="flex items-start gap-2 text-sm text-zinc-400"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/> <strong className="text-zinc-200">Hallucination Guard:</strong> Claims are cross-validated against source chunks. Confidence scored.</li>
            <li className="flex items-start gap-2 text-sm text-zinc-400"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/> <strong className="text-zinc-200">Grading Filter:</strong> Only Sahih/Hasan default. Da'if flagged with warnings.</li>
            <li className="flex items-start gap-2 text-sm text-zinc-400"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/> <strong className="text-zinc-200">Scholar Review Queue:</strong> Low confidence responses (&lt;60%) queued for human approval.</li>
          </ul>
        </div>
      </div>
    </Card>
  </div>
);

const MicroservicesView = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {microservices.map((svc) => (
        <Card key={svc.id} className="hover:border-orange-500/50 transition-colors group border-t-4 border-t-orange-500">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-1 rounded">{svc.id}</span>
                <h3 className="text-lg font-bold text-zinc-100 group-hover:text-orange-400 transition-colors">{svc.name}</h3>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{svc.purpose}</p>
            </div>
            <Badge color={svc.lang.includes('Go') ? 'bg-cyan-900/30 text-cyan-400' : svc.lang.includes('Python') ? 'bg-blue-900/30 text-blue-400' : 'bg-zinc-800'}>{svc.lang}</Badge>
          </div>
          
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Internal Architecture</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {svc.architecture.map((arch, i) => (
                <span key={i} className="text-[11px] px-2 py-1 bg-zinc-800/80 text-zinc-300 rounded border border-zinc-700">{arch}</span>
              ))}
            </div>
            <p className="text-xs text-zinc-400 bg-zinc-950/50 p-3 rounded leading-relaxed border border-zinc-800 font-mono">
              {svc.details}
            </p>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

const AgentsToolsView = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <Card title="Agentic Supervisor & Core Agents" icon={Bot}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent, i) => (
          <div key={i} className="p-4 rounded-xl border border-zinc-800 hover:border-orange-500/50 transition-colors bg-zinc-800/30 shadow-sm flex items-start gap-4">
            <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
              <agent.icon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold text-zinc-100">{agent.name}</h4>
                <Badge color="bg-zinc-800 text-zinc-300 border-zinc-700">{agent.type}</Badge>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{agent.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card title="Complete Tool Registry (38 Tools)" icon={Zap}>
          <div className="space-y-6">
            {allTools.map((cat, i) => (
              <div key={i}>
                <h4 className="font-bold text-zinc-200 mb-3 border-b border-zinc-800 pb-2">{cat.cat}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {cat.list.map((tool, j) => (
                    <div key={j} className="bg-zinc-800/50 border border-zinc-800 rounded p-3">
                      <div className="font-mono text-xs font-bold text-orange-400 mb-1">{tool.name}</div>
                      <div className="text-xs text-zinc-400">{tool.inOut}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      
      <div className="space-y-6">
        <Card title="Hallucination Prevention" icon={CheckCircle2}>
          <div className="space-y-4">
            <div className="text-sm text-zinc-400 leading-relaxed">
              Every RAG response runs through the <code className="bg-zinc-800 text-zinc-200 px-1 rounded">hallucination_check</code> tool before returning to the user.
            </div>
            <ul className="space-y-2">
              <li className="p-2 rounded bg-emerald-900/20 text-emerald-400 text-sm border border-emerald-800/50"><strong>🟢 &gt;85%:</strong> Verified. In source chunks.</li>
              <li className="p-2 rounded bg-amber-900/20 text-amber-400 text-sm border border-amber-800/50"><strong>🟡 60-85%:</strong> External. Found via web search.</li>
              <li className="p-2 rounded bg-red-900/20 text-red-400 text-sm border border-red-800/50"><strong>🔴 &lt;60%:</strong> Unverified. Reject / Flag for Scholar.</li>
            </ul>
          </div>
        </Card>

        <Card title="Agent Memory System" icon={Database}>
          <ul className="space-y-3 text-sm text-zinc-300">
            <li className="border-b border-zinc-800 pb-2"><strong className="text-zinc-100">Short-term:</strong> Redis (Session context)</li>
            <li className="border-b border-zinc-800 pb-2"><strong className="text-zinc-100">Working:</strong> In-process (Tools called)</li>
            <li className="border-b border-zinc-800 pb-2"><strong className="text-zinc-100">Long-term:</strong> MongoDB (User preferences)</li>
            <li className="border-b border-zinc-800 pb-2"><strong className="text-zinc-100">Semantic:</strong> Qdrant (Past research)</li>
            <li><strong className="text-zinc-100">Episodic:</strong> MongoDB (90-day summaries)</li>
          </ul>
        </Card>
      </div>
    </div>
  </div>
);

const AdvancedFeaturesView = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* CLI Card */}
      <Card title="Mishkat CLI (msk)" icon={Terminal}>
        <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
          The control plane outside the browser. Built in Go. Unix-philosophy, offline-capable via compressed snapshots.
        </p>
        <CodeBlock title="Terminal Commands" code={`$ msk auth login
$msk query "حكم الزواج" --format json | jq '.sources[].grade'$ msk knowledge snapshot create --ref bukhari
$msk agent run chain research,verify --output ./report.md$ msk admin cache flush`} />
      </Card>

      {/* MVC Card */}
      <Card title="MVC (Version Control)" icon={GitBranch}>
        <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
          Self-hosted Git for the Knowledge Base. Atomic commits, Arabic-aware diffs, and compressed \`.mishkat.zst\` storage.
        </p>
        <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-sm font-mono space-y-2">
          <div className="flex justify-between"><span className="text-zinc-500">msk vc commit</span><span className="text-orange-400">Add Abu Dawud</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">msk vc diff</span><span className="text-orange-400">Arabic-aware comparison</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">msk vc branch protect</span><span className="text-orange-400">Require Scholar Review</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">msk vc tag create</span><span className="text-orange-400">v2.3.0 (Sign w/ Key)</span></div>
        </div>
      </Card>

      {/* Canvas Card */}
      <Card title="Automation Canvas" icon={Workflow}>
        <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
          Visual n8n-style drag-and-drop pipeline builder. Runs on a dedicated Go DAG executor service.
        </p>
        <ul className="space-y-2 text-sm text-zinc-300">
          <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> <strong className="text-zinc-100">Triggers:</strong> Schedule, Webhook, Event (New Fatwa)</li>
          <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> <strong className="text-zinc-100">Agents:</strong> Wrapper around the 9 core agents</li>
          <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> <strong className="text-zinc-100">Logic:</strong> Filter, Branch, Loop, Merge</li>
          <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> <strong className="text-zinc-100">Outputs:</strong> Discord, Email, MVC Push, Hub Publish</li>
        </ul>
      </Card>

      {/* Hub Card */}
      <Card title="Mishkat-Hub (Researcher Mode)" icon={BookOpen}>
        <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
          Full academic research environment. Moves beyond chat to structured query builders and co-authoring.
        </p>
        <div className="space-y-3">
          {advancedAgents.map((aa, i) => (
            <div key={i} className="border-l-2 border-orange-500/50 pl-3">
              <h5 className="font-bold text-sm text-zinc-200">{aa.name}</h5>
              <p className="text-xs text-zinc-500">{aa.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Skill Engine & Mentions */}
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Skill Engine Anatomy" icon={Code2}>
          <p className="text-xs text-zinc-500 mb-2">Skills are reusable NLP/Agent pipelines (YAML).</p>
          <CodeBlock title="skills/hadith-formatter.yml" language="yaml" code={`name: hadith-formatter
version: 1.2.0
inputs:
  - name: text
    type: string
steps:
  - tool: arabic_clean
    input: "{{ inputs.text }}"
  - agent: summary
    prompt: "Format in {{ inputs.style }}"`} />
        </Card>
        
        <Card title="Advanced @ Mention System" icon={Search}>
          <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
            Universal context-aware routing across the chat, documents, and Hub.
          </p>
          <div className="space-y-2 text-sm font-mono bg-zinc-950 p-4 rounded border border-zinc-800">
            <div><span className="text-orange-400">@verify</span> <span className="text-zinc-300">هل حديث "..." صحيح؟</span></div>
            <div><span className="text-orange-400">@dr-yusuf</span> <span className="text-zinc-300">أرجو مراجعة التخريج</span></div>
            <div><span className="text-orange-400">@bukhari:1906</span> <span className="text-zinc-300">Embed specific hadith</span></div>
            <div><span className="text-orange-400">@skill:isnad-visualizer</span> <span className="text-zinc-300">Run graph</span></div>
            <div><span className="text-orange-400">@auto:daily-digest</span> <span className="text-zinc-300">Trigger pipeline</span></div>
          </div>
        </Card>
      </div>

    </div>
  </div>
);

const RoadmapView = () => (
  <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
    <Card>
      <div className="p-6 border-b border-zinc-800 bg-zinc-800/30 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">40-Week Engineering Roadmap</h2>
          <p className="text-sm text-zinc-500">From Foundation to Public Launch</p>
        </div>
        <Badge color="bg-orange-500/10 text-orange-400 border border-orange-500/20">11 Phases</Badge>
      </div>
      <div className="p-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b-2 border-zinc-800">
              <th className="py-3 text-xs font-bold text-zinc-500 uppercase">Phase</th>
              <th className="py-3 text-xs font-bold text-zinc-500 uppercase">Focus</th>
              <th className="py-3 text-xs font-bold text-zinc-500 uppercase">Timeline</th>
              <th className="py-3 text-xs font-bold text-zinc-500 uppercase">Key Deliverables</th>
            </tr>
          </thead>
          <tbody>
            {roadmapPhases.map((phase, i) => (
              <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                <td className="py-4 align-top w-16 font-bold text-orange-500 text-lg">
                  {phase.p}
                </td>
                <td className="py-4 align-top w-48 font-semibold text-zinc-200">
                  {phase.title}
                </td>
                <td className="py-4 align-top w-24">
                  <Badge>Wk {phase.w}</Badge>
                </td>
                <td className="py-4 align-top">
                  <div className="flex flex-wrap gap-2">
                    {phase.tasks.map((t, idx) => (
                      <span key={idx} className="flex items-center gap-1 text-xs bg-zinc-900 border border-zinc-700 text-zinc-300 px-2 py-1 rounded shadow-sm">
                        <Check size={12} className="text-emerald-500" /> {t}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
    
    <Card className="mt-8" title="Architectural Optimizations" icon={Cpu}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {['LLM Fallback Chain (Google -> Ollama -> Cohere)', 'Semantic Query Cache (Qdrant similarity > 0.95)', 'Embedding Cache (sha256 keys, cuts 40% calls)', 'Arabic NLP Pipeline (Root analysis, NER)', 'Offline-First PWA (Top 1000 hadiths cached)', 'Scholar Consensus Engine'].map((opt, i) => (
          <div key={i} className="p-3 bg-orange-500/5 rounded border border-orange-500/20 text-sm text-orange-200 font-medium">
            {opt}
          </div>
        ))}
      </div>
    </Card>
  </div>
);
const FilesView = () => {
  const [activeFile, setActiveFile] = useState(0);
  
  return ( <div className="flex gap-6 min-h-[700px]">
  
    {/* Sidebar */}
    <div className="w-72 shrink-0 overflow-y-auto border border-zinc-800 rounded-xl bg-zinc-900 p-3">
      <h2 className="text-sm font-bold text-zinc-400 mb-3">
        Blueprint Files
      </h2>
  
      <div className="space-y-2">
        {markdownFiles.map((file, index) => (
          <button
            key={file.id}
            onClick={() => setActiveFile(index)}
            className={`w-full text-left p-3 rounded-lg border transition-all duration-200
            ${
              activeFile === index
                ? "bg-orange-500/10 border-orange-500 text-orange-400"
                : "bg-zinc-800/40 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            <div className="font-semibold text-sm">
              {file.title}
            </div>
  
            <div className="text-xs text-zinc-500 mt-1 font-mono truncate">
              {file.id}
            </div>
          </button>
        ))}
      </div>
    </div>
  
    {/* Markdown Viewer */}
    <div className="flex-1 border border-zinc-800 rounded-xl bg-zinc-900 overflow-hidden">
  
      <div className="h-[calc(100vh-220px)] overflow-y-auto p-8">
  
        <article
          className="
            prose
            prose-invert
            max-w-none
  
            prose-headings:text-zinc-100
  
            prose-h1:text-4xl
            prose-h1:font-black
            prose-h1:mb-8
  
            prose-h2:text-2xl
            prose-h2:text-orange-400
            prose-h2:border-b
            prose-h2:border-zinc-800
            prose-h2:pb-2
            prose-h2:mt-10
  
            prose-h3:text-xl
            prose-h3:text-zinc-200
  
            prose-p:text-zinc-300
            prose-p:leading-8
  
            prose-strong:text-white
  
            prose-code:text-orange-300
            prose-code:bg-zinc-800
            prose-code:px-1.5
            prose-code:py-0.5
            prose-code:rounded
  
            prose-pre:bg-[#0d1117]
            prose-pre:border
            prose-pre:border-zinc-700
            prose-pre:rounded-xl
            prose-pre:p-4
  
            prose-blockquote:border-orange-500
            prose-blockquote:text-zinc-400
  
            prose-li:text-zinc-300
  
            prose-table:w-full
  
            prose-th:text-white
            prose-th:border
            prose-th:border-zinc-700
            prose-th:bg-zinc-800
  
            prose-td:border
            prose-td:border-zinc-800
  
            prose-a:text-orange-400
            prose-a:no-underline
            hover:prose-a:text-orange-300
          "
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {markdownFiles[activeFile].content}
          </ReactMarkdown>
        </article>
  
      </div>
    </div>
  </div>
  
  );
  };
  
  
// ==========================================
// MAIN LAYOUT (Horizontal Nav / No Sidebar)
// ==========================================

export default function App() {
  const [activeTab, setActiveTab] = useState('architecture');

  const tabs = [
    { id: 'architecture', label: 'Arch & Security', icon: LayoutDashboard },
    { id: 'microservices', label: 'Microservices', icon: Server },
    { id: 'agents', label: 'Agents & Tools', icon: Bot },
    { id: 'advanced', label: 'Advanced Features', icon: Terminal },
    { id: 'roadmap', label: 'Roadmap', icon: Route },
    { id: 'files', label: 'Raw Blueprints', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'architecture': return <ArchitectureView />;
      case 'microservices': return <MicroservicesView />;
      case 'agents': return <AgentsToolsView />;
      case 'advanced': return <AdvancedFeaturesView />;
      case 'roadmap': return <RoadmapView />;
      case 'files': return <FilesView />;
      default: return <ArchitectureView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#18181b] font-sans text-zinc-200 flex flex-col">
      
      {/* Top Header & Navigation */}
      <header className="bg-[#18181b] border-b border-zinc-800 sticky top-0 z-20 pt-5 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          
          {/* Branding Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg shadow-inner border border-white/20">
                M
              </div>
              <div>
                <h1 className="font-bold text-xl text-zinc-100 leading-tight">Mishkat</h1>
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mt-0.5">Blueprint v2.0</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
              <span className="flex items-center gap-1.5"><Activity size={12} className="text-emerald-500"/> System Online</span>
            </div>
          </div>

          {/* Horizontal Tab Navigation */}
          <nav className="flex gap-8 overflow-x-auto custom-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap
                    ${isActive 
                      ? 'border-orange-500 text-orange-400' 
                      : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'}`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              )
            })}
          </nav>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full">
        <div className="p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}