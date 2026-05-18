import React, { useState } from 'react';
import { 
  LayoutDashboard, Server, Bot, Route, Workflow, Terminal, 
  GitBranch, Code2, Database, Shield, Zap, Search, Globe, 
  Layers, CheckCircle2, Activity, BookOpen, 
  Cpu, FileText, MessagesSquare, Check,
  AlertTriangle, Settings, Camera, CalendarDays, Users,
  RefreshCw, ChevronDown, ChevronRight, ListChecks
} from 'lucide-react';
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Link } from 'react-router-dom';
import "highlight.js/styles/github-dark.css";

// Assuming these are loaded correctly in your environment
import part1 from './assets/mishkat_final_blueprint_part1.md?raw';
import part2 from './assets/mishkat_final_blueprint_part2.md?raw';
import part3a from './assets/mishkat_final_blueprint_part3a.md?raw';
import part3b from './assets/mishkat_final_blueprint_part3b.md?raw';
import advanced from './assets/mishkat_advanced_features.md?raw';

import { sprintsData } from './assets/sprintsData';

// ==========================================
// MASSIVE DATA MODELS (Expanded details from all files)
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
  { service: 'API Gateway', lang: 'Java Spring Boot', framework: 'Gin + ReverseProxy', reason: 'Custom-built: full control, sub-ms routing, native middleware chain (Recovery, RequestId, Logger, Tracing, Cors, RateLimit, Jwt, Sanitizer).' },
  { service: 'Auth & User Services', lang: 'Java Spring Boot', framework: 'Gin', reason: 'Sub-ms token validation, minimal memory, highly concurrent. Handles OAuth, TOTP MFA, API Keys, and User profiles.' },
  { service: 'Query & Chat Services', lang: 'Java Spring Boot', framework: 'Gin + Gorilla WS / gRPC', reason: 'Orchestrates AI calls, checks Redis/Qdrant caches, handles SSE streaming backpressure.' },
  { service: 'Data Ingestion', lang: 'Java', framework: 'Spring Boot 3 + Spring Batch', reason: 'Enterprise batch processing, scheduling, transactional ETL. Includes Readers (PDF, DB, XML) and Validators.' },
  { service: 'Reference Service', lang: 'Java Spring Boot', framework: 'Spring Web', reason: 'iText for PDF, Apache POI for Excel, rich document parsing. Extracts structure and maintains catalog.' },
  { service: 'RAG & Embedding', lang: 'Python', framework: 'FastAPI + gRPC', reason: 'AI Core. Cascading LLM Failovers, embedding caches, batch embedding via Kafka.' },
  { service: 'Agent Orchestrator', lang: 'Python', framework: 'LangGraph', reason: 'Multi-agent orchestration, tool routing, memory management (Short, Working, Long, Semantic, Episodic).' },
];

const microservices = [
  {
    id: 'S0', name: 'Gateway Service', lang: 'Go',
    purpose: 'Custom API Gateway. Single entry point handling reverse proxying, JWT, rate limiting, and CORS.',
    architecture: ['RecoveryMiddleware', 'RequestIdMiddleware', 'LoggerMiddleware', 'TracingMiddleware', 'CorsMiddleware', 'RateLimitMiddleware', 'JwtMiddleware', 'RequestSanitizerMiddleware'],
    details: 'Uses YAML-driven RouteConfig. Sub-millisecond overhead compared to Kong/Envoy. Includes a Health Aggregator merging states of all downstream services.'
  },
  {
    id: 'S1', name: 'Data Ingestion Service', lang: 'Java Spring Boot',
    purpose: 'Enterprise ETL pipeline for ingesting Islamic texts, cleaning, chunking, and triggering embeddings.',
    architecture: ['Readers (Json, Csv, Pdf, Xml, Html, Api, Shamela)', 'Extractors (Metadata, Isnad, Matn, Reference, Narrator)', 'Converters (Normalizer, Diacritic, Dedup, Encoding)', 'Validators (Schema, Content, Integrity)', 'Spring Batch (Chunker, Enricher, Tagger)'],
    details: 'Outputs to Mongo, S3, and fires Kafka events (ingestion.complete) to trigger Python Embedding service.'
  },
  {
    id: 'S2', name: 'Reference Service', lang: 'Java Spring Boot',
    purpose: 'Manages reference sources, document parsing (PDF, DOCX), and catalog maintenance.',
    architecture: ['PdfParser (iText)', 'Docx/ExcelParser (Apache POI)', 'EpubParser', 'ImageParser (Tesseract OCR)', 'StructureAnalyzer', 'VersionManager', 'StatisticsService'],
    details: 'Handles right-to-left Arabic extraction, detects columns, and manages the Reference Crud Service. Extracts footnotes and cross-links.'
  },
  {
    id: 'S3', name: 'Auth Service', lang: 'Java Spring Boot',
    purpose: 'High-performance auth, JWT lifecycle, OAuth2, RBAC, MFA, API keys.',
    architecture: ['TokenService (JWT RS256)', 'OAuthService (Google, GitHub, Apple)', 'MfaService (TOTP)', 'RbacService', 'TokenBlacklist (Redis)', 'AuditLogger'],
    details: 'Issues 15min access & 7d refresh tokens. Hashes with bcrypt (cost 12). Strict RBAC checks. Emits audit logs to Kafka.'
  },
  {
    id: 'S4', name: 'User Service', lang: 'Java Spring Boot',
    purpose: 'User profile management, preferences, learning progress, saved research.',
    architecture: ['ProfileService', 'PreferencesService', 'SavedResearchService', 'LearningProgressService', 'BookmarkService'],
    details: 'Stores JSON preferences (madhab, theme, diacritics toggle) in Redis/Postgres. Tracks curriculum progress.'
  },
  {
    id: 'S5', name: 'Billing Service', lang: 'Java Spring Boot',
    purpose: 'Implements a coins-based economy for the platform, handles purchases, transactions, and micro-billing.',
    architecture: ['WalletService', 'LedgerService', 'PricingService', 'PaymentService (Stripe)', 'GrantService', 'DistributedLock', 'IdempotencyKey'],
    details: 'Enforces balance checks atomically before any chargeable request. Decouples monetary pricing from usage costs. Integrates with Stripe.'
  },
  {
    id: 'S6', name: 'Query Service', lang: 'Java Spring Boot',
    purpose: 'The orchestrator. Receives queries, calls Python RAG via gRPC, manages streaming.',
    architecture: ['QueryOrchestrator', 'CacheService (Redis + Qdrant)', 'StreamManager (SSE)', 'RetryHandler (Circuit Breaker)', 'MetricsCollector'],
    details: 'Checks exact Redis cache first, then Qdrant semantic cache (>0.95 sim), then calls Python RAG Engine via gRPC. Assembles response with citations.'
  },
  {
    id: 'S7', name: 'Chat Service', lang: 'Java Spring Boot',
    purpose: 'Real-time chat, WebSocket connections, conversation memory.',
    architecture: ['ChatService', 'MessageService', 'WebSocketHub (Gorilla)', 'TitleGenerator (via RAG)', 'ConversationMemory'],
    details: 'Maintains last 20 messages in Redis for sliding window context. Broadcasts typing indicators. Persists to MongoDB.'
  },
  {
    id: 'S8', name: 'RAG Engine', lang: 'Python',
    purpose: 'AI core executing the pipeline. Exposes gRPC to Query Service.',
    architecture: ['PreProcessor', 'QueryRewriter', 'MultiCollectionRetriever', 'DocumentReranker', 'ResponseGenerator', 'PostProcessor (Hallucinations)'],
    details: 'Includes an LLM Cascading Failover (Google -> Ollama -> Cohere -> HuggingFace) with Circuit Breakers to prevent downtime.'
  },
  {
    id: 'S9', name: 'Embedding Service', lang: 'Python',
    purpose: 'Model inference service for text embedding. Decoupled for GPU scaling.',
    architecture: ['SingleEmbedder', 'BatchEmbedder (Kafka)', 'EmbeddingCache (Redis)', 'ModelManager (BGE-M3, Jina, Cohere)'],
    details: 'Caching embeddings by sha256 text hash eliminates ~40% of redundant API calls. Batch jobs triggered async via Kafka.'
  },
  {
    id: 'S10', name: 'Agent Orchestrator', lang: 'Python',
    purpose: 'Multi-agent system using LangGraph. Supervisor routes to specialist agents.',
    architecture: ['IntentClassifier', 'ExecutionPlanner', 'AgentRouter', 'ToolRegistry (38 tools)', 'MemoryManager (Short, Working, Long, Semantic)'],
    details: 'Enforces RBAC on tool execution. Agents coordinate through shared state to execute parallel or sequential plans.'
  }
];

const agents = [
  { name: 'Supervisor Agent', icon: Cpu, type: 'Router', desc: 'Analyzes intent, creates execution plans (parallel/sequential), and routes to specialists.', tools: ['topic_classify', 'detect_language'] },
  { name: '📖 RAG Agent', icon: BookOpen, type: 'Core', desc: 'Standard Q&A. Pipeline: Clean -> Rewrite -> Multi-Search -> Rank -> Generate -> Hallucination Check.', tools: ['vector_search', 'keyword_search', 'hallucination_check', 'hadith_by_number'] },
  { name: '🔬 Research Agent', icon: Search, type: 'Deep', desc: 'Multi-source research across Hadith, Quran, Tafsir, Web, and Fatwas. Outputs structured reports.', tools: ['web_search', 'quran_search', 'tafsir_lookup', 'fatwa_search', 'save_research'] },
  { name: '⚖️ Comparative Agent', icon: GitBranch, type: 'Fiqh', desc: 'Compares 4 madhabs. Outputs tables with evidence, consensus points, and strongest opinions.', tools: ['fatwa_search', 'translate_text', 'sentiment_analyze'] },
  { name: '🎓 Tutor Agent', icon: CheckCircle2, type: 'Learning', desc: 'Adaptive learning. Adjusts depth, generates quizzes, tracks progress, suggests next topics.', tools: ['summarize_text', 'cache_get/set', 'quran_search'] },
  { name: '✅ Verification Agent', icon: Shield, type: 'Authenticity', desc: 'Isnad analysis. Outputs Chain validation, cross-references, scholar gradings, and confidence.', tools: ['verify_isnad', 'grade_hadith', 'narrator_search', 'compare_narrations'] },
  { name: '🧹 Cleaning Agent', icon: Settings, type: 'Pipeline', desc: 'Admin agent to process raw Islamic texts, diacritize, extract entities, and embed data.', tools: ['arabic_clean', 'arabic_diacritize', 'parse_pdf', 'embed_text'] },
  { name: '🌍 Translation Agent', icon: Globe, type: 'Lang', desc: 'Accurate translations (8 languages: AR, EN, UR, FR, TR, MS, ID, BN) with transliteration fallback.', tools: ['translate_text', 'transliterate', 'detect_language'] },
  { name: '📊 Summarization Agent', icon: FileText, type: 'Utility', desc: 'Topic overviews, study notes. Uses topic_classify and extract_keywords tools.', tools: ['summarize_text', 'extract_keywords', 'topic_classify'] },
  { name: '💬 General Agent', icon: MessagesSquare, type: 'Fallback', desc: 'Handles greetings. Politely redirects non-Islamic queries back to core domains.', tools: ['web_search', 'translate_text'] }
];

const advancedAgents = [
  { name: '🔗 Citation Network Agent', desc: 'Constructs force-directed knowledge graphs mapping every hadith citation, cross-narrator reference, and thematic cluster across the entire corpus. Outputs to DOT, GraphML, and interactive D3 visualizations. Researchers can trace how a single narration propagated across centuries of Islamic scholarship — revealing transmission chains, rediscovery patterns, and scholarly consensus formation in real time.' },
  { name: '📜 Fatwa Generation Agent', desc: 'Drafts structured preliminary fatwa responses by synthesizing evidence from all four madhabs, grading source strength (Sahih → Da\'if → Mawquf), and applying Usul al-Fiqh methodology. Every output is explicitly tagged "Draft — Awaiting Scholar Review", routed to the Scholar Review Queue, and cannot be published without human approval. Enables muftis to process high-volume recurring questions at 10x speed without compromising authority.' },
  { name: '🗣️ Debate Agent (Munazara Engine)', desc: 'Structures formal Islamic scholarly debates using classical munazara methodology: Muda\'i (claimant) vs Mu\'tarid (objector), with structured tarjih (comparative weighing) of proofs. Outputs verdict tables showing which daleel outweighs the other and why. Used by researchers for comparative theology, by educators for teaching critical thinking, and by scholars to stress-test their positions against documented counterarguments.' },
  { name: '📦 Data Lineage & Provenance Agent', desc: 'Provides full audit trails for every piece of knowledge in the system: raw source file → parser → chunker → embedder → Qdrant collection → who reviewed it → when it was last updated. Researchers can verify exactly which edition of Sahih al-Bukhari a hadith came from, which translator\'s variant was used, and the complete change history. Ensures academic-grade reproducibility for any published research.' },
  { name: '📊 Meta-Analysis & Systematic Review Agent', desc: 'Performs academic-grade systematic literature reviews across the entire hadith corpus and linked scholarly commentary. Outputs PRISMA-compliant flow diagrams, statistical frequency analyses, thematic heat maps, and structured synthesis tables. Enables researchers to identify consensus, minority opinions, and underdiscussed topics across hundreds of classical sources — work that previously required months of manual scholarship.' },
  { name: '🧬 Isnad Graph Reconstruction Agent', desc: 'Reconstructs complete isnads as directed acyclic graphs (DAGs), automatically resolving narrator name variants (e.g. Abu Hurayra\'s 30+ recorded aliases) using fuzzy Arabic NLP matching. Surfaces weak links, missing generations (inqita\'), and tadlis patterns. Cross-references with the Narrator DB (sourced from Taqrib al-Tahdhib) to assign confidence scores to each chain link — giving hadith scholars a precision tool that replaces weeks of manual rijal research.' },
  { name: '📐 Methodology Tracker Agent', desc: 'Tracks and enforces research methodology consistency across a scholar\'s entire project. Records which usul principles were applied, which madhab\'s qawa\'id were used for analogical reasoning, and flags any internal contradictions between different sections of a multi-part fatwa or research paper. Outputs a methodology audit log that can be attached to any academic submission for peer review.' },
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
  { role: 'Guest', limit: '5/hr', permissions: 'Basic RAG, Browse references, Vector/Keyword search, Arabic clean' },
  { role: 'Student', limit: '50/hr', permissions: 'Everything + Web search, Save research, Tutor agent, Verification tools' },
  { role: 'Scholar', limit: '200/hr', permissions: 'Everything + Hub publishing, PDF upload, Full tool access, Approve Fatwas, MKS Incremental Edits' },
  { role: 'Admin', limit: 'Unlimited', permissions: 'Data ingestion, User management, System config, Raw embedding access, Flush Caches' },
];

const roadmapPhases = [
  {
    p: 1, title: 'Foundation', w: '1-4',
    mainTasks: [
      {
        name: 'Monorepo & Infra Setup',
        deps: ['None'],
        subtasks: [
          { 
            name: 'Initialize GitHub Monorepo', deps: [],
            subSubtasks: [
              { name: 'Create base repository and README', est: '1d' },
              { name: 'Setup Branch protection rules (main, dev)', est: '1d' },
              { name: 'Configure GitHub Actions CI/CD template', est: '2d' }
            ]
          },
          { 
            name: 'Setup Docker Compose for all services', deps: ['Initialize GitHub Monorepo'],
            subSubtasks: [
              { name: 'Create docker-compose.yml with Redis & Postgres', est: '1d' },
              { name: 'Add local Qdrant and MongoDB containers', est: '1d' },
              { name: 'Configure network bridges and volumes', est: '1d' }
            ]
          },
          { 
            name: 'Configure Kubernetes (EKS) Dev Cluster', deps: ['Setup Docker Compose for all services'],
            subSubtasks: [
              { name: 'Provision EKS cluster via Terraform', est: '3d' },
              { name: 'Install Nginx Ingress Controller', est: '1d' },
              { name: 'Configure cluster autoscaler', est: '1d' }
            ]
          }
        ]
      },
      {
        name: 'Core API Gateway (Go)',
        deps: ['Monorepo & Infra Setup'],
        subtasks: [
          { 
            name: 'Implement Gin Gateway & Reverse Proxy', deps: [],
            subSubtasks: [
              { name: 'Setup Gin router and base health checks', est: '1d' },
              { name: 'Implement httputil.ReverseProxy handler', est: '2d' },
              { name: 'Create YAML-driven RouteConfig loader', est: '2d' }
            ]
          },
          { 
            name: 'Setup Rate Limiting & CORS', deps: ['Implement Gin Gateway & Reverse Proxy'],
            subSubtasks: [
              { name: 'Integrate Redis sliding window rate limiter', est: '2d' },
              { name: 'Configure CORS middleware for mishkat.app origins', est: '1d' },
              { name: 'Add RequestSanitizerMiddleware for input cleaning', est: '1d' }
            ]
          },
          { 
            name: 'JWT Middleware validation', deps: ['Setup Rate Limiting & CORS'],
            subSubtasks: [
              { name: 'Implement RS256 public key loading at startup', est: '1d' },
              { name: 'Extract user_id and role from JWT claims', est: '1d' },
              { name: 'Inject X-User-Id/Role headers for downstream', est: '1d' }
            ]
          }
        ]
      },
      {
        name: 'Auth Service (Java)',
        deps: ['Monorepo & Infra Setup'],
        subtasks: [
          { 
            name: 'Implement User Registration/Login', deps: [],
            subSubtasks: [
              { name: 'Create Postgres User/Role tables', est: '1d' },
              { name: 'Implement bcrypt password hashing', est: '1d' },
              { name: 'Generate 15min access & 7d refresh tokens', est: '2d' }
            ]
          },
          { 
            name: 'OAuth Integrations (Google, Apple)', deps: ['Implement User Registration/Login'],
            subSubtasks: [
              { name: 'Implement Google OAuth2 flow', est: '2d' },
              { name: 'Implement Apple OAuth2 flow', est: '2d' },
              { name: 'Link social accounts to existing emails', est: '1d' }
            ]
          },
          { 
            name: 'RBAC Enforcement Middleware', deps: ['Implement User Registration/Login'],
            subSubtasks: [
              { name: 'Define Guest, Student, Scholar, Admin roles', est: '1d' },
              { name: 'Implement permission matrix checking', est: '2d' },
              { name: 'Add TOTP MFA for Admin/Scholar roles', est: '2d' }
            ]
          }
        ]
      },
      {
        name: 'Python RAG Foundation',
        deps: ['Monorepo & Infra Setup'],
        subtasks: [
          { 
            name: 'Extract FastAPI RAG logic from monolithic app', deps: [],
            subSubtasks: [
              { name: 'Isolate QueryController logic into new module', est: '2d' },
              { name: 'Separate Embedding calls from Retriever', est: '2d' },
              { name: 'Write unit tests for isolated RAG components', est: '1d' }
            ]
          },
          { 
            name: 'Define gRPC contracts for Query Service', deps: ['Extract FastAPI RAG logic from monolithic app'],
            subSubtasks: [
              { name: 'Write .proto files for streaming RAG responses', est: '2d' },
              { name: 'Generate Java, Go and Python gRPC stubs', est: '1d' },
              { name: 'Implement gRPC server in Python RAG engine', est: '2d' }
            ]
          }
        ]
      }
    ]
  },
  {
    p: 2, title: 'Core Services', w: '5-8',
    mainTasks: [
      {
        name: 'Query, Chat & User Services (Java)',
        deps: ['Core API Gateway', 'Python RAG Foundation'],
        subtasks: [
          { 
            name: 'Implement SSE Streaming for queries', deps: [],
            subSubtasks: [
              { name: 'Create StreamManager for Server-Sent Events', est: '2d' },
              { name: 'Connect Java gRPC client to Python RAG server', est: '2d' },
              { name: 'Implement Circuit Breaker for LLM failovers', est: '1d' }
            ]
          },
          { 
            name: 'WebSocket integration for Chat Service', deps: ['Implement SSE Streaming for queries'],
            subSubtasks: [
              { name: 'Setup Gorilla WebSocket Hub', est: '2d' },
              { name: 'Manage Redis 20-message sliding window history', est: '2d' },
              { name: 'Persist completed chats to MongoDB', est: '1d' }
            ]
          },
          { 
            name: 'Semantic Query Caching with Redis', deps: ['Implement SSE Streaming for queries'],
            subSubtasks: [
              { name: 'Check exact match in Redis before routing', est: '1d' },
              { name: 'Check >0.95 similarity in Qdrant before generating', est: '2d' },
              { name: 'Implement cache invalidation strategy', est: '1d' }
            ]
          },
          { 
            name: 'User profile and preference endpoints', deps: [],
            subSubtasks: [
              { name: 'Create preferences JSON schema (madhab, theme)', est: '1d' },
              { name: 'Implement GET/PUT /api/v1/users/:id/preferences', est: '1d' },
              { name: 'Cache active user preferences in Redis', est: '1d' }
            ]
          }
        ]
      },
      {
        name: 'Data Ingestion Service (Java)',
        deps: ['None'],
        subtasks: [
          { 
            name: 'Spring Boot batch configuration', deps: [],
            subSubtasks: [
              { name: 'Setup Spring Batch JobRepository', est: '1d' },
              { name: 'Configure MongoDB and S3 writers', est: '2d' },
              { name: 'Implement FailureHandler and retry logic', est: '2d' }
            ]
          },
          { 
            name: 'Implement Hadith JSON/CSV extractors', deps: ['Spring Boot batch configuration'],
            subSubtasks: [
              { name: 'Write JsonHadithReader for streaming large arrays', est: '2d' },
              { name: 'Write CsvHadithReader with mapping config', est: '2d' },
              { name: 'Implement ContentValidator and DuplicateValidator', est: '2d' }
            ]
          },
          { 
            name: 'Kafka event publishing for embeddings', deps: ['Implement Hadith JSON/CSV extractors'],
            subSubtasks: [
              { name: 'Setup KafkaProducer in Spring Boot', est: '1d' },
              { name: 'Publish "ingestion.chunk_ready" events', est: '1d' },
              { name: 'Implement Python KafkaConsumer to trigger embedding', est: '2d' }
            ]
          }
        ]
      },
      {
        name: 'Reference Service (Java)',
        deps: ['None'],
        subtasks: [
          { 
            name: 'Setup iText for PDF extraction', deps: [],
            subSubtasks: [
              { name: 'Implement PdfParser for text extraction', est: '2d' },
              { name: 'Handle RTL Arabic text correctly', est: '2d' },
              { name: 'Extract footnotes and images', est: '2d' }
            ]
          },
          { 
            name: 'Implement Catalog Search', deps: ['Setup iText for PDF extraction'],
            subSubtasks: [
              { name: 'Create Reference metadata models in MongoDB', est: '1d' },
              { name: 'Implement CatalogSearchService', est: '2d' },
              { name: 'Build REST endpoints for Reference CRUD', est: '2d' }
            ]
          }
        ]
      }
    ]
  },
  {
    p: 3, title: 'Agent System', w: '9-12',
    mainTasks: [
      {
        name: 'LangGraph Orchestrator',
        deps: ['Python RAG Foundation'],
        subtasks: [
          { 
            name: 'Implement IntentClassifier', deps: [],
            subSubtasks: [
              { name: 'Train/prompt small LLM for intent detection', est: '2d' },
              { name: 'Map intents to specialist agents', est: '1d' },
              { name: 'Handle ambiguous intents with fallback', est: '1d' }
            ]
          },
          { 
            name: 'Setup Supervisor Routing logic', deps: ['Implement IntentClassifier'],
            subSubtasks: [
              { name: 'Define state schema for LangGraph', est: '1d' },
              { name: 'Implement ExecutionPlanner for parallel/sequential tasks', est: '3d' },
              { name: 'Create AgentRouter node', est: '2d' }
            ]
          },
          { 
            name: 'MemoryManager (Short/Long term)', deps: ['Setup Supervisor Routing logic'],
            subSubtasks: [
              { name: 'Implement short-term working memory per request', est: '1d' },
              { name: 'Implement semantic memory hooks into Qdrant', est: '2d' },
              { name: 'Implement episodic memory summarization', est: '2d' }
            ]
          }
        ]
      },
      {
        name: 'Tool Registry (38 Base Tools)',
        deps: ['LangGraph Orchestrator'],
        subtasks: [
          { 
            name: 'Integrate Web Search & Translation APIs', deps: [],
            subSubtasks: [
              { name: 'Implement web_search tool (Google/Bing API)', est: '1d' },
              { name: 'Implement web_scrape tool (BeautifulSoup)', est: '1d' },
              { name: 'Implement translate_text tool (DeepL/Google)', est: '1d' }
            ]
          },
          { 
            name: 'Implement internal retrieval tools', deps: ['Integrate Web Search & Translation APIs'],
            subSubtasks: [
              { name: 'Implement vector_search tool connecting to Qdrant', est: '2d' },
              { name: 'Implement hadith_by_number strict lookup', est: '1d' },
              { name: 'Implement hallucination_check validation tool', est: '2d' }
            ]
          }
        ]
      },
      {
        name: 'Specialized Agents',
        deps: ['LangGraph Orchestrator', 'Tool Registry'],
        subtasks: [
          { 
            name: 'Research Agent (Multi-source)', deps: [],
            subSubtasks: [
              { name: 'Define ReAct prompts for deep research', est: '2d' },
              { name: 'Configure tool access (quran, hadith, web)', est: '1d' },
              { name: 'Implement report formatting and citations', est: '2d' }
            ]
          },
          { 
            name: 'Verification Agent (Isnad)', deps: [],
            subSubtasks: [
              { name: 'Implement verify_isnad logic and prompts', est: '2d' },
              { name: 'Connect to narrator database tool', est: '1d' },
              { name: 'Implement output grading (Sahih/Daif)', est: '1d' }
            ]
          }
        ]
      }
    ]
  },
  {
    p: 4, title: 'Content & Knowledge', w: '13-16',
    mainTasks: [
      {
        name: 'Kutub al-Sittah Ingestion',
        deps: ['Data Ingestion Service'],
        subtasks: [
          { 
            name: 'Process Bukhari & Muslim', deps: [],
            subSubtasks: [
              { name: 'Clean and format source JSON files', est: '2d' },
              { name: 'Run through Spring Batch pipeline', est: '1d' },
              { name: 'Verify embeddings in Qdrant', est: '1d' }
            ]
          },
          { 
            name: 'Process Sunan Abu Dawood, Tirmidhi, etc.', deps: ['Process Bukhari & Muslim'],
            subSubtasks: [
              { name: 'Source and clean text data', est: '3d' },
              { name: 'Map numbering schemas accurately', est: '2d' },
              { name: 'Run ingestion and embeddings', est: '2d' }
            ]
          }
        ]
      },
      {
        name: 'Advanced Agents',
        deps: ['Specialized Agents', 'Kutub al-Sittah Ingestion'],
        subtasks: [
          { 
            name: 'Comparative Agent (4 Madhabs)', deps: [],
            subSubtasks: [
              { name: 'Ingest primary Fiqh texts per madhab', est: '4d' },
              { name: 'Design tabular output templates', est: '1d' },
              { name: 'Test multi-madhab query resolution', est: '3d' }
            ]
          },
          { 
            name: 'Translation Agent (8 languages)', deps: [],
            subSubtasks: [
              { name: 'Implement language detection tool', est: '1d' },
              { name: 'Configure prompts for accurate Islamic terminology', est: '2d' },
              { name: 'Add transliteration fallback for AR terms', est: '2d' }
            ]
          },
          { 
            name: 'Fatwa & Tutor Agents', deps: ['Comparative Agent'],
            subSubtasks: [
              { name: 'Implement Fatwa drafting & scholar review flow', est: '2d' },
              { name: 'Develop Tutor Agent with Socratic prompting', est: '2d' },
              { name: 'Add difficulty scaling for Tutor learning paths', est: '1d' }
            ]
          }
        ]
      },
      {
        name: 'Narrator Database',
        deps: ['Reference Service'],
        subtasks: [
          { 
            name: 'Extract Rijal data from books', deps: [],
            subSubtasks: [
              { name: 'Parse Taqrib al-Tahdhib PDF', est: '3d' },
              { name: 'Extract structured data (Name, Generation, Grade)', est: '2d' },
              { name: 'Populate MongoDB Narrator collection', est: '1d' }
            ]
          },
          { 
            name: 'Map isnad chains to narrators', deps: ['Extract Rijal data from books'],
            subSubtasks: [
              { name: 'Implement fuzzy Arabic name matching', est: '3d' },
              { name: 'Process existing hadiths to link narrators', est: '3d' },
              { name: 'Expose narrator graphs to Verification Agent', est: '2d' }
            ]
          }
        ]
      }
    ]
  },
  {
    p: 5, title: 'Frontend & UI', w: '17-20',
    mainTasks: [
      {
        name: 'Next.js 15 Web App',
        deps: ['Query, Chat & User Services'],
        subtasks: [
          { 
            name: 'Setup Shadcn UI and Tailwind v4', deps: [],
            subSubtasks: [
              { name: 'Initialize Next.js app router structure', est: '1d' },
              { name: 'Configure theming and typography', est: '1d' },
              { name: 'Implement base layout and navigation', est: '2d' }
            ]
          },
          { 
            name: 'Implement Chat Interface with SSE', deps: ['Setup Shadcn UI and Tailwind v4'],
            subSubtasks: [
              { name: 'Create React components for message streaming', est: '3d' },
              { name: 'Parse and render markdown with citations', est: '2d' },
              { name: 'Add typing indicators and error states', est: '1d' }
            ]
          },
          { 
            name: 'Offline-First PWA & Mobile Support', deps: ['Setup Shadcn UI and Tailwind v4'],
            subSubtasks: [
              { name: 'Configure next-pwa for service workers', est: '1d' },
              { name: 'Implement IndexedDB for offline chat history', est: '2d' },
              { name: 'Add Add-to-Homescreen prompt & mobile responsive fixes', est: '2d' }
            ]
          }
        ]
      },
      {
        name: 'Agent Interaction UI',
        deps: ['Next.js 15 Web App'],
        subtasks: [
          { 
            name: 'Agent Selector and Context visualizer', deps: [],
            subSubtasks: [
              { name: 'Build dropdown for manual agent selection', est: '1d' },
              { name: 'Create visual execution plan timeline', est: '2d' },
              { name: 'Show tool calls and intermediate steps', est: '2d' }
            ]
          },
          { 
            name: 'Multi-modal Input handling', deps: [],
            subSubtasks: [
              { name: 'Implement drag-and-drop file upload zone', est: '1d' },
              { name: 'Integrate audio recording for voice queries', est: '2d' },
              { name: 'Send files to appropriate parsers', est: '1d' }
            ]
          },
          { 
            name: 'Slash Command (/) & Context System', deps: ['Agent Selector and Context visualizer'],
            subSubtasks: [
              { name: 'Implement fuzzy-searchable command palette', est: '2d' },
              { name: 'Add inline /insert and /export action handlers', est: '2d' },
              { name: 'Integrate robust @ mentions for hadiths/users/skills', est: '2d' }
            ]
          }
        ]
      },
      {
        name: 'Admin Dashboard',
        deps: ['Next.js 15 Web App', 'Auth Service'],
        subtasks: [
          { 
            name: 'User & Role Management Module', deps: [],
            subSubtasks: [
              { name: 'Create user listing data table', est: '1d' },
              { name: 'Implement role assignment forms', est: '1d' },
              { name: 'Implement API key generation UI', est: '1d' }
            ]
          },
          { 
            name: 'System Analytics view', deps: [],
            subSubtasks: [
              { name: 'Fetch metrics from Prometheus', est: '2d' },
              { name: 'Visualize query volume and latency charts', est: '2d' },
              { name: 'Show active users and cache hit rates', est: '1d' }
            ]
          }
        ]
      }
    ]
  },
  {
    p: 6, title: 'Infrastructure & Launch Prep', w: '21-24',
    mainTasks: [
      {
        name: 'Production Kubernetes (EKS)',
        deps: ['All Core Services'],
        subtasks: [
          { 
            name: 'Setup Helm charts for all services', deps: [],
            subSubtasks: [
              { name: 'Create base Helm chart templates', est: '2d' },
              { name: 'Define resource limits and requests', est: '1d' },
              { name: 'Configure readiness and liveness probes', est: '1d' }
            ]
          },
          { 
            name: 'Configure Auto-scaling (HPA)', deps: ['Setup Helm charts for all services'],
            subSubtasks: [
              { name: 'Setup Horizontal Pod Autoscaler for Go services', est: '1d' },
              { name: 'Setup GPU node autoscaling for Python services', est: '2d' },
              { name: 'Test scale up/down behavior under load', est: '2d' }
            ]
          }
        ]
      },
      {
        name: 'Observability Stack',
        deps: ['Production Kubernetes (EKS)'],
        subtasks: [
          { 
            name: 'Prometheus & Grafana dashboards', deps: [],
            subSubtasks: [
              { name: 'Deploy kube-prometheus-stack', est: '1d' },
              { name: 'Create custom Go application dashboards', est: '2d' },
              { name: 'Setup alertmanager for critical failures', est: '1d' }
            ]
          },
          { 
            name: 'Jaeger Distributed Tracing integration', deps: [],
            subSubtasks: [
              { name: 'Deploy Jaeger operator and instances', est: '1d' },
              { name: 'Inject traceparents through API Gateway -> RAG', est: '2d' },
              { name: 'Verify end-to-end trace visibility', est: '1d' }
            ]
          }
        ]
      },
      {
        name: 'Reliability Engineering',
        deps: ['Python RAG Foundation'],
        subtasks: [
          { 
            name: 'Implement LLM Fallback Chain', deps: [],
            subSubtasks: [
              { name: 'Write retry logic with exponential backoff', est: '1d' },
              { name: 'Implement failover from Google -> Ollama -> Cohere', est: '2d' },
              { name: 'Monitor and log failover events', est: '1d' }
            ]
          },
          { 
            name: 'End-to-end Load Testing', deps: [],
            subSubtasks: [
              { name: 'Write k6 test scripts for typical user flows', est: '2d' },
              { name: 'Simulate 1000 concurrent websocket connections', est: '1d' },
              { name: 'Identify and resolve bottlenecks', est: '3d' }
            ]
          }
        ]
      }
    ]
  },
  {
    p: 7, title: 'Billing & Economy', w: '25-28',
    mainTasks: [
      {
        name: 'Billing Service (Java)',
        deps: ['Core API Gateway', 'Auth Service'],
        subtasks: [
          { 
            name: 'Implement Wallet & Ledger tables', deps: [],
            subSubtasks: [
              { name: 'Design ACID compliant PostgreSQL schemas', est: '1d' },
              { name: 'Implement WalletService credit/debit logic', est: '2d' },
              { name: 'Implement Ledger immutable logging', est: '1d' }
            ]
          },
          { 
            name: 'Stripe Payment Integration', deps: ['Implement Wallet & Ledger tables'],
            subSubtasks: [
              { name: 'Setup Stripe webhook listeners', est: '2d' },
              { name: 'Implement coin package purchase endpoints', est: '2d' },
              { name: 'Handle refund and dispute edge cases', est: '2d' }
            ]
          }
        ]
      },
      {
        name: 'Coin-based Enforcement',
        deps: ['Billing Service', 'Query Service'],
        subtasks: [
          { 
            name: 'Gateway CoinCheck Middleware', deps: [],
            subSubtasks: [
              { name: 'Cache user balance in Redis', est: '1d' },
              { name: 'Intercept and check balance before routing', est: '2d' },
              { name: 'Return 402 Payment Required correctly', est: '1d' }
            ]
          },
          { 
            name: 'PricingService configuration for individual agents', deps: [],
            subSubtasks: [
              { name: 'Define coin costs for all tools and agents', est: '1d' },
              { name: 'Deduct coins atomically post-execution', est: '2d' },
              { name: 'Implement auto-refund on upstream failures', est: '2d' }
            ]
          }
        ]
      }
    ]
  },
  {
    p: 8, title: 'CLI & MKS Ecosystem', w: '29-32',
    mainTasks: [
      {
        name: 'msk CLI Tool',
        deps: ['Core API Gateway'],
        subtasks: [
          { 
            name: 'CLI Auth & Query commands', deps: [],
            subSubtasks: [
              { name: 'Implement msk auth login flow', est: '2d' },
              { name: 'Implement msk query and JSON output formatting', est: '2d' },
              { name: 'Publish cross-platform binaries (GoReleaser)', est: '1d' }
            ]
          },
          { 
            name: 'Agent runner via CLI', deps: ['CLI Auth & Query commands'],
            subSubtasks: [
              { name: 'Implement msk agent run chain logic', est: '2d' },
              { name: 'Support local file piping (stdin/stdout)', est: '1d' },
              { name: 'Handle streaming responses in terminal', est: '2d' }
            ]
          }
        ]
      },
      {
        name: 'Mishkat Knowledge Sync (MKS)',
        deps: ['msk CLI Tool', 'Data Ingestion Service'],
        subtasks: [
          { 
            name: 'S3/Postgres Storage architecture for MKS', deps: [],
            subSubtasks: [
              { name: 'Design collection versioning schema', est: '2d' },
              { name: 'Implement package export to S3', est: '2d' },
              { name: 'Build msk sync pull functionality', est: '2d' }
            ]
          },
          { 
            name: 'Incremental Edits & Deltas propagation mechanism', deps: ['S3/Postgres Storage architecture for MKS'],
            subSubtasks: [
              { name: 'Track individual hadith changes over time', est: '2d' },
              { name: 'Generate diffs between snapshot versions', est: '2d' },
              { name: 'Implement msk sync update for delta application', est: '3d' }
            ]
          },
          { 
            name: '.mishkat.zst binary compression support', deps: [],
            subSubtasks: [
              { name: 'Integrate zstd compression libraries', est: '1d' },
              { name: 'Format vector and metadata into binary blobs', est: '2d' },
              { name: 'Test decompression performance on edge devices', est: '1d' }
            ]
          }
        ]
      }
    ]
  },
  {
    p: 9, title: 'Advanced Workflows & Hub', w: '33-36',
    mainTasks: [
      {
        name: 'Automation Canvas',
        deps: ['Agent System'],
        subtasks: [
          { 
            name: 'Visual n8n-style drag-and-drop DAG builder', deps: [],
            subSubtasks: [
              { name: 'Implement React Flow for node visualization', est: '3d' },
              { name: 'Create trigger and action node UI components', est: '2d' },
              { name: 'Generate JSON graph representation', est: '1d' }
            ]
          },
          { 
            name: 'Java DAG Executor Service Implementation', deps: ['Visual n8n-style drag-and-drop DAG builder'],
            subSubtasks: [
              { name: 'Parse JSON graph into execution order', est: '2d' },
              { name: 'Implement parallel/sequential node runners', est: '3d' },
              { name: 'Handle node failures and retries', est: '2d' }
            ]
          }
        ]
      },
      {
        name: 'Skill Engine',
        deps: ['Automation Canvas'],
        subtasks: [
          { 
            name: 'YAML Schema Parser for external skills', deps: [],
            subSubtasks: [
              { name: 'Define strict YAML schema for steps', est: '1d' },
              { name: 'Implement Java parser and validator', est: '2d' },
              { name: 'Map skill steps to internal tools', est: '2d' }
            ]
          },
          { 
            name: 'Skill Registry & Publishing workflow', deps: ['YAML Schema Parser for external skills'],
            subSubtasks: [
              { name: 'Create database tables for Skill metadata', est: '1d' },
              { name: 'Implement skill publishing and versioning API', est: '2d' },
              { name: 'Build UI for browsing public skills', est: '2d' }
            ]
          }
        ]
      },
      {
        name: 'Mishkat-Hub',
        deps: ['Frontend & UI'],
        subtasks: [
          { 
            name: 'Research Studio with Yjs Co-authoring', deps: [],
            subSubtasks: [
              { name: 'Integrate Tiptap editor with Yjs', est: '3d' },
              { name: 'Setup Hocuspocus WebSocket server for sync', est: '2d' },
              { name: 'Implement real-time cursors and changes', est: '2d' }
            ]
          },
          { 
            name: 'Citation Network graphing interface', deps: [],
            subSubtasks: [
              { name: 'Generate network data from hadith references', est: '2d' },
              { name: 'Implement Force-directed graph visualization', est: '2d' },
              { name: 'Add node expansion and details view', est: '2d' }
            ]
          },
          { 
            name: 'Community Forum & @mentions System', deps: [],
            subSubtasks: [
              { name: 'Implement discussion threads and replies', est: '2d' },
              { name: 'Parse @mentions for users and specific hadiths', est: '2d' },
              { name: 'Build notification system for mentions', est: '1d' }
            ]
          }
        ]
      },
      {
        name: 'Smart Notifications Service',
        deps: ['Agent System', 'Mishkat-Hub'],
        subtasks: [
          { 
            name: 'WebSocket & Push Notification Infra', deps: [],
            subSubtasks: [
              { name: 'Setup cross-platform Push API (FCM/APNs)', est: '2d' },
              { name: 'Implement real-time in-app notification bell', est: '1d' },
              { name: 'Design email fallback digest templates', est: '2d' }
            ]
          },
          { 
            name: 'Event-driven Notification triggers', deps: ['WebSocket & Push Notification Infra'],
            subSubtasks: [
              { name: 'Listen for @mentions and Scholar review requests', est: '1d' },
              { name: 'Send alerts for long-running agent completion', est: '1d' },
              { name: 'User opt-in/opt-out preference management', est: '1d' }
            ]
          }
        ]
      }
    ]
  },
  {
    p: 10, title: 'Final Polish & Public Launch', w: '37-40',
    mainTasks: [
      {
        name: 'System Optimization',
        deps: ['Observability Stack'],
        subtasks: [
          { 
            name: 'Cache Tuning (Redis/Qdrant)', deps: [],
            subSubtasks: [
              { name: 'Analyze cache hit rates in production', est: '2d' },
              { name: 'Adjust TTLs and eviction policies', est: '1d' },
              { name: 'Optimize Qdrant HNSW parameters', est: '2d' }
            ]
          },
          { 
            name: 'Database Index Optimization', deps: [],
            subSubtasks: [
              { name: 'Run Postgres EXPLAIN on slow queries', est: '2d' },
              { name: 'Add composite indexes for common filters', est: '1d' },
              { name: 'Setup database vacuuming and maintenance jobs', est: '1d' }
            ]
          }
        ]
      },
      {
        name: 'Security Audit',
        deps: ['All Modules'],
        subtasks: [
          { 
            name: 'Penetration Testing', deps: [],
            subSubtasks: [
              { name: 'Conduct automated vulnerability scans', est: '1d' },
              { name: 'Manual testing of JWT and CORS boundaries', est: '2d' },
              { name: 'Resolve identified critical/high issues', est: '3d' }
            ]
          },
          { 
            name: 'RBAC Policy verification', deps: [],
            subSubtasks: [
              { name: 'Write integration tests for all roles', est: '2d' },
              { name: 'Ensure tenant isolation is strictly enforced', est: '2d' },
              { name: 'Audit admin endpoint access logs', est: '1d' }
            ]
          }
        ]
      },
      {
        name: 'Public Release',
        deps: ['Security Audit'],
        subtasks: [
          { 
            name: 'Marketing & Documentation finalization', deps: [],
            subSubtasks: [
              { name: 'Publish API documentation (Swagger/Redoc)', est: '2d' },
              { name: 'Write user guides and tutorials', est: '3d' },
              { name: 'Prepare launch announcement content', est: '2d' }
            ]
          },
          { 
            name: 'General Availability (GA) Launch', deps: ['Marketing & Documentation finalization'],
            subSubtasks: [
              { name: 'Final database migrations and backups', est: '1d' },
              { name: 'Flip DNS to production clusters', est: '1d' },
              { name: 'Monitor error rates closely post-launch', est: '3d' }
            ]
          }
        ]
      }
    ]
  }
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

    <Card title="Security, RBAC & Content Safety Architecture" icon={Shield}>
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
          <h4 className="font-bold text-zinc-100 mb-3 text-sm uppercase tracking-wider">Islamic Content Safety Pipeline</h4>
          <ul className="space-y-3">
            <li className="flex items-start gap-2 text-sm text-zinc-400"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/> <strong className="text-zinc-200">Source Attribution:</strong> Every response MUST include book, chapter, number, narrator.</li>
            <li className="flex items-start gap-2 text-sm text-zinc-400"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/> <strong className="text-zinc-200">Hallucination Guard:</strong> Claims cross-validated against source chunks before return.</li>
            <li className="flex items-start gap-2 text-sm text-zinc-400"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/> <strong className="text-zinc-200">Fabrication Detector (Anti-Mawdu'):</strong> Cross-checks hadiths against known blocklists of fabricated texts.</li>
            <li className="flex items-start gap-2 text-sm text-zinc-400"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/> <strong className="text-zinc-200">Sectarian Bias Filter:</strong> Detects one-sided framing of disputed issues, enforces balanced presentation.</li>
            <li className="flex items-start gap-2 text-sm text-zinc-400"><CheckCircle2 size={16} className="text-emerald-500 mt-0.5 shrink-0"/> <strong className="text-zinc-200">Scholar Review Queue:</strong> Low confidence responses (&lt;60%) queued for human approval.</li>
          </ul>
        </div>
      </div>
    </Card>

    <Card title="Inter-Service Communication Map" icon={Server}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <div className="p-3 border border-zinc-800 rounded bg-zinc-800/30">
          <span className="font-mono text-orange-400 text-xs block mb-1">REST + SSE</span>
          <span className="text-zinc-200 font-bold">Client → Gateway Service</span>
          <p className="text-zinc-500 text-xs mt-1">All external traffic; JWT validated at gateway via middleware.</p>
        </div>
        <div className="p-3 border border-zinc-800 rounded bg-zinc-800/30">
          <span className="font-mono text-cyan-400 text-xs block mb-1">gRPC (Streaming)</span>
          <span className="text-zinc-200 font-bold">Query → RAG Engine</span>
          <p className="text-zinc-500 text-xs mt-1">Executes the AI RAG pipeline, streams tokens back to orchestrator.</p>
        </div>
        <div className="p-3 border border-zinc-800 rounded bg-zinc-800/30">
          <span className="font-mono text-purple-400 text-xs block mb-1">Kafka (Async)</span>
          <span className="text-zinc-200 font-bold">Data Ingestion → Embedding</span>
          <p className="text-zinc-500 text-xs mt-1">Batch embedding jobs triggered asynchronously post-processing.</p>
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
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Internal Architecture Components</h4>
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
          <div key={i} className="p-4 rounded-xl border border-zinc-800 hover:border-orange-500/50 transition-colors bg-zinc-800/30 shadow-sm flex items-start gap-4 flex-col sm:flex-row">
            <div className="p-3 rounded-lg bg-orange-500/10 text-orange-500 shrink-0">
              <agent.icon size={24} />
            </div>
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h4 className="font-bold text-zinc-100">{agent.name}</h4>
                <Badge color="bg-zinc-800 text-zinc-300 border-zinc-700">{agent.type}</Badge>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed mb-3">{agent.desc}</p>
              <div className="flex flex-wrap gap-1.5">
                {agent.tools.map(t => (
                  <span key={t} className="text-[10px] font-mono px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-orange-300 rounded">{t}</span>
                ))}
              </div>
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
        <Card title="Multi-Agent Chaining Example" icon={Workflow}>
          <div className="text-sm text-zinc-400 leading-relaxed mb-4">
            Supervisor creates an execution plan when users ask complex multi-part queries:
            <br/><span className="italic text-zinc-300 mt-2 block">"اجمع أحاديث الصدقة مع التخريج والترجمة الإنجليزية"</span>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 p-3 rounded text-sm font-mono space-y-3">
            <div className="border-l-2 border-emerald-500 pl-3">
              <span className="text-emerald-400 font-bold block text-xs">Step 1 (Parallel)</span>
              <span className="text-zinc-300 block">Research Agent → collect</span>
              <span className="text-zinc-300 block">Verify Agent → grade each</span>
            </div>
            <div className="border-l-2 border-blue-500 pl-3">
              <span className="text-blue-400 font-bold block text-xs">Step 2 (Sequential)</span>
              <span className="text-zinc-300 block">Translate Agent → EN</span>
            </div>
            <div className="border-l-2 border-orange-500 pl-3">
              <span className="text-orange-400 font-bold block text-xs">Step 3 (Final)</span>
              <span className="text-zinc-300 block">Summary Agent → structure</span>
              <span className="text-zinc-300 block">save_research → store</span>
            </div>
          </div>
        </Card>

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

    {/* Hero Banner */}
    <div className="bg-gradient-to-br from-orange-500/10 via-zinc-900 to-zinc-900 border border-orange-500/30 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-orange-500/20 rounded-xl shrink-0">
          <Zap size={28} className="text-orange-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-zinc-100 mb-1">Mishkat Hub — The Absolute Toolkit for Islamic Research</h2>
          <p className="text-sm text-zinc-400 leading-relaxed max-w-4xl">
            MSH is not a chat tool. It is a <strong className="text-orange-300">fully integrated research operating system</strong> — combining a scholar-grade AI engine, 
            institutional-grade data pipelines, a no-code automation platform, a real-time collaborative research studio, 
            a knowledge sync protocol, and a CLI control plane — all purpose-built for Islamic scholarship. 
            What took research teams months now takes minutes.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {['🎓 Researchers', '⚖️ Scholars & Muftis', '🏛️ Universities & Institutes', '💻 Developers', '🕌 Mosques & NGOs', '📖 Students'].map((tag, i) => (
              <span key={i} className="text-xs px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-300 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* CLI Card — expanded */}
      <Card title="Mishkat CLI (msk) — Research at Terminal Speed" icon={Terminal}>
        <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
          The full power of Mishkat without a browser. Built in Go for sub-millisecond startup. 
          Unix-philosophy design — every command pipes, every output is structured JSON or Markdown. 
          Researchers can script entire multi-step hadith investigations, pipe results through jq, 
          and integrate MSH into CI/CD pipelines, cron jobs, or Jupyter notebooks.
        </p>
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 mb-3 text-xs text-orange-300">
          <strong>Why this matters:</strong> A researcher can write a shell script that pulls all Sahih hadiths on a topic, 
          runs isnad verification, translates them, and exports a structured Markdown report — completely automated, repeatable, 
          and schedulable. No browser. No clicking. Pure scholarship at scale.
        </div>
        <CodeBlock title="Terminal — Research Automation Examples" code={`# Authenticate once
$ msk auth login --totp

# Query with full JSON output — pipe into analysis tools
$ msk query "حكم الزكاة على الأسهم" --agent research --format json \\
  | jq '.sources[] | {grade, book, number, narrator}'

# Run a full chain: research → verify → translate → save report
$ msk agent run chain research,verify,translate \\
  --topic "صيام رمضان" --lang en --output ./reports/siyam.md

# Bulk-verify a list of hadiths from a CSV
$ cat hadiths.csv | msk verify --batch --format table

# Pull a knowledge snapshot (offline-capable via .mishkat.zst)
$ msk knowledge snapshot create --ref bukhari --compress zstd
$ msk knowledge snapshot load ./bukhari-v3.mishkat.zst

# Sync your institution's curated KB deltas
$ msk sync pull bukhari --delta-only
$ msk sync edit hadith:bukhari:1906 --note "Correct narrator chain"
$ msk sync push --review-required

# Flush caches and audit logs
$ msk admin cache flush --service qdrant
$ msk admin audit-log --user scholar@uni.edu --last 30d`} />
      </Card>

      {/* MKS Card — expanded */}
      <Link to="/mks">
      <Card title="Mishkat Knowledge Sync (MKS) — Git for Islamic Knowledge" icon={RefreshCw}>
        <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
          MKS is a <strong className="text-zinc-100">distributed knowledge versioning and synchronization protocol</strong> — 
          the Git of Islamic knowledge infrastructure. Universities, research institutes, and individual scholars 
          can maintain their own curated, versioned forks of the global corpus, apply incremental edits (deltas), 
          share corrections upstream, and keep their local systems perfectly synchronized — even offline.
        </p>
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 mb-3 text-xs text-orange-300">
          <strong>Why this matters:</strong> When a leading hadith institute corrects a narrator attribution, that delta 
          propagates as a typed patch to every subscribing institution's Qdrant collection within minutes — no manual 
          re-ingestion, no broken embeddings. The entire scholarly community stays in sync with verified corrections automatically.
        </div>
        <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-sm font-mono space-y-2 mb-3">
          <div className="text-zinc-600 text-xs mb-2">// MKS Protocol — knowledge lifecycle</div>
          <div className="flex justify-between items-center"><span className="text-zinc-400">msk sync pull bukhari</span><span className="text-emerald-400 text-xs">↓ Download full .mishkat.zst package</span></div>
          <div className="flex justify-between items-center"><span className="text-zinc-400">msk sync edit hadith:bukhari:1906</span><span className="text-blue-400 text-xs">✏ Propose incremental correction</span></div>
          <div className="flex justify-between items-center"><span className="text-zinc-400">msk sync push --review</span><span className="text-amber-400 text-xs">↑ Submit for Scholar review queue</span></div>
          <div className="flex justify-between items-center"><span className="text-zinc-400">msk sync update --delta</span><span className="text-orange-400 text-xs">⚡ Apply only changed vectors</span></div>
          <div className="flex justify-between items-center"><span className="text-zinc-400">msk sync snapshot tag v2.4.0</span><span className="text-purple-400 text-xs">🏷 Version-pin your corpus state</span></div>
          <div className="flex justify-between items-center"><span className="text-zinc-400">msk sync diff v2.3.0 v2.4.0</span><span className="text-cyan-400 text-xs">🔍 Inspect what changed</span></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: '.mishkat.zst', desc: 'Binary-compressed snapshot of vectors + metadata. Self-contained. Portable.', color: 'border-cyan-800/40 bg-cyan-900/10 text-cyan-400' },
            { label: 'Delta Patches', desc: 'Only changed embeddings transmitted. 98% bandwidth savings vs full re-sync.', color: 'border-emerald-800/40 bg-emerald-900/10 text-emerald-400' },
            { label: 'Signed Commits', desc: 'Every edit cryptographically signed by the Scholar\'s key. Full audit trail.', color: 'border-amber-800/40 bg-amber-900/10 text-amber-400' },
          ].map((f, i) => (
            <div key={i} className={`rounded-lg border p-2 ${f.color}`}>
              <p className="text-[11px] font-bold font-mono mb-1">{f.label}</p>
              <p className="text-[10px] text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </Card>
      </Link>


      {/* MSA Canvas Card — full width, deeply expanded */}
      <div className="lg:col-span-2">
        <Card title="Mishkat Automation Canvas (MSA) — No-Code Islamic App Builder & BaaS Platform" icon={Workflow}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
                MSA is the <strong className="text-zinc-100">backbone infrastructure layer</strong> of Mishkat — a visual, no-code platform 
                that lets anyone (developer, scholar, mosque admin, NGO worker) build fully functional Islamic applications 
                and automated research workflows without writing a single line of backend or AI code.
              </p>
              <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 mb-4">
                <p className="text-xs text-orange-300 font-semibold uppercase tracking-wider mb-1">The Core Insight</p>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  Build your entire app frontend (React, Flutter, Next.js, or plain HTML) and 
                  use <strong className="text-zinc-100">a single MSA Webhook URL as your complete backend</strong>. 
                  One POST request triggers a full RAG → Verify → Translate → Format pipeline 
                  and returns production-ready structured JSON. No servers provisioned. 
                  No AI APIs configured. No DevOps. Just your UI and one endpoint.
                </p>
              </div>

              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Who MSA is For</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: '⚖️ Scholars', desc: 'Build automated fatwa research pipelines, scheduled hadith digests, and peer-review workflows — all visually', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' },
                  { label: '💻 Developers', desc: 'Use MSA as your Islamic AI backend. One webhook call replaces months of RAG engineering and hadith data work', color: 'border-blue-500/30 bg-blue-500/5 text-blue-400' },
                  { label: '🏛️ Institutions', desc: 'Automate daily hadith emails, student quiz generation, and curriculum delivery — zero IT team required', color: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
                ].map((r, i) => (
                  <div key={i} className={`rounded-lg border p-2.5 ${r.color}`}>
                    <p className="text-[11px] font-bold mb-1">{r.label}</p>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">{r.desc}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Block Types — The Full Node Library</p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { dot: 'bg-emerald-500', label: 'Triggers', items: 'Schedule (cron) · Webhook (POST/GET) · Kafka Event · Manual Run · CLI Trigger · Hijri Calendar Event · Scholar Approval · File Upload' },
                  { dot: 'bg-blue-500',   label: 'Agent Blocks', items: 'RAG Query · Deep Research · Isnad Verify · 4-Madhab Compare · Translate (8 langs) · Tutor Quiz · Summarize · Fatwa Draft · Citation Graph' },
                  { dot: 'bg-amber-500',  label: 'Logic & Control', items: 'IF/ELSE Branch · Switch · Loop (forEach) · Merge · Sort & Rank · Limit/Paginate · Error Retry · Confidence Gate · Human-in-the-Loop pause' },
                  { dot: 'bg-purple-500', label: 'Data Blocks', items: 'MongoDB Read/Write · Redis Cache · Qdrant Vector Search · S3 File · CSV/JSON Parser · Hadith Lookup · Quran Verse · Narrator DB Query' },
                  { dot: 'bg-red-500',    label: 'Output & Notify', items: 'HTTP Response · Email (SMTP) · WhatsApp · Telegram · Discord · SMS · Push Notification · Hub Publish · PDF Export · LaTeX Export' },
                  { dot: 'bg-cyan-500',   label: 'Custom Code', items: 'Python Snippet · JavaScript Node · Shell Command · gRPC Call · External API · SQL Query · Jinja Template render' },
                ].map((b, i) => (
                  <div key={i} className="flex items-start gap-2 bg-zinc-800/40 rounded p-2.5 border border-zinc-800">
                    <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${b.dot}`}></div>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">{b.label}</p>
                      <p className="text-[10px] text-zinc-500 leading-relaxed">{b.items}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Example: Complete App — Zero Backend Code Written</p>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono space-y-1 mb-4">
                <div className="text-zinc-600">// React Native app — MSA IS the entire backend</div>
                <div className="text-zinc-400">POST <span className="text-orange-400">api.mishkat.app/automations/webhook/abc123</span></div>
                <div className="text-zinc-400">{'{'}</div>
                <div className="text-zinc-400 pl-4"><span className="text-cyan-400">"query"</span>: <span className="text-emerald-400">"ما حكم صيام يوم الشك"</span>,</div>
                <div className="text-zinc-400 pl-4"><span className="text-cyan-400">"lang"</span>: <span className="text-emerald-400">"en"</span>,</div>
                <div className="text-zinc-400 pl-4"><span className="text-cyan-400">"madhab"</span>: <span className="text-emerald-400">"all"</span></div>
                <div className="text-zinc-400">{'}'}</div>
                <div className="text-zinc-600 mt-2">// MSA Pipeline: RAG → Verify → 4-Madhab → Translate → Format</div>
                <div className="text-zinc-400">{'{'}</div>
                <div className="text-zinc-400 pl-4"><span className="text-cyan-400">"answer"</span>: <span className="text-emerald-400">"Scholars differ on this..."</span>,</div>
                <div className="text-zinc-400 pl-4"><span className="text-cyan-400">"grade"</span>: <span className="text-emerald-400">"صحيح"</span>,</div>
                <div className="text-zinc-400 pl-4"><span className="text-cyan-400">"source"</span>: <span className="text-emerald-400">"البخاري 1906 · Muslim 1080"</span>,</div>
                <div className="text-zinc-400 pl-4"><span className="text-cyan-400">"madhab_opinions"</span>: {'{'} <span className="text-emerald-400">"hanafi"</span>: <span className="text-emerald-400">"..."</span>, <span className="text-emerald-400">"maliki"</span>: <span className="text-emerald-400">"..."</span> ... {'}'},</div>
                <div className="text-zinc-400 pl-4"><span className="text-cyan-400">"isnad_confidence"</span>: <span className="text-emerald-400">0.94</span>,</div>
                <div className="text-zinc-400 pl-4"><span className="text-cyan-400">"translations"</span>: {'{'} <span className="text-emerald-400">"en"</span>: <span className="text-emerald-400">"..."</span>, <span className="text-emerald-400">"ur"</span>: <span className="text-emerald-400">"..."</span>, <span className="text-emerald-400">"fr"</span>: <span className="text-emerald-400">"..."</span> {'}'}</div>
                <div className="text-zinc-400">{'}'}</div>
              </div>

              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Real-World Applications Anyone Can Deploy</p>
              <div className="space-y-1.5 mb-4">
                {[
                  { icon: '📱', app: 'Hadith Verification Mobile App', desc: 'Frontend-only app — MSA handles all AI, isnad grading, and Rijal lookups as a single webhook' },
                  { icon: '🕌', app: 'Mosque Digital Platform', desc: 'Prayer times + daily hadith + khutbah summaries + Hijri events — all from one scheduled MSA pipeline' },
                  { icon: '📚', app: 'Adaptive Islamic Learning App', desc: 'Lesson delivery + Socratic quizzes + progress tracking — MSA Tutor Agent powers the entire curriculum backend' },
                  { icon: '🌐', app: 'Scholar Q&A Portal', desc: '4-madhab fatwa responses with full evidence citations — published to Hub after Scholar approval. Zero infrastructure owned.' },
                  { icon: '🤖', app: 'Daily Hadith WhatsApp/Telegram Bot', desc: 'Cron trigger → RAG → Verify → Translate → Push to WhatsApp API. Runs daily, fully automated' },
                  { icon: '🎓', app: 'University Research Assistant', desc: 'Students submit topics → MSA runs systematic review → outputs PRISMA report + citation network graph' },
                  { icon: '📡', app: 'Hadith RSS/API Feed Service', desc: 'Any third-party app subscribes to a live feed of verified hadiths by topic, grade, or madhab via MSA webhooks' },
                  { icon: '🔔', app: 'Scholar Peer Review Notification System', desc: 'Research submission triggers review queue → MSA notifies assigned scholars → collects approvals → auto-publishes' },
                ].map((ex, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm p-2 rounded border border-zinc-800 bg-zinc-800/20 hover:border-orange-500/30 transition-colors">
                    <span className="text-base shrink-0 mt-0.5">{ex.icon}</span>
                    <div>
                      <span className="font-bold text-zinc-200 text-xs">{ex.app}</span>
                      <p className="text-zinc-500 text-[11px] mt-0.5 leading-relaxed">{ex.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-zinc-800/30 border border-zinc-700 rounded-lg mb-3">
                <p className="text-xs font-bold text-zinc-200 mb-1">🛒 Pipeline Marketplace — The Islamic App Ecosystem</p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Any MSA pipeline can be <strong className="text-zinc-200">published to the Marketplace</strong>. 
                  Mosques, schools, and developers install pre-built pipelines with one click — 
                  zero configuration. Mishkat becomes the <strong className="text-zinc-200">npm registry for Islamic AI applications</strong>: 
                  a living ecosystem where the community builds and shares production-ready 
                  knowledge infrastructure.
                </p>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-center">
                {[
                  { name: 'Firebase', role: 'Backend BaaS' },
                  { name: 'Supabase', role: 'DB + Auth BaaS' },
                  { name: 'OpenAI API', role: 'AI BaaS' },
                  { name: 'Mishkat MSA', role: 'Islamic Knowledge BaaS', highlight: true },
                ].map((c, i) => (
                  <div key={i} className={`p-2 rounded border text-xs ${c.highlight ? 'border-orange-500/50 bg-orange-500/10 text-orange-300' : 'border-zinc-700 bg-zinc-800/30 text-zinc-400'}`}>
                    <p className="font-bold">{c.name}</p>
                    <p className="text-[10px] mt-0.5 opacity-70">{c.role}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Mishkat-Hub — full width, deeply expanded */}
      <div className="lg:col-span-2">
        <Card title="Mishkat-Hub — The Academic Research Command Center" icon={BookOpen}>
          <div className="mb-4 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
            <p className="text-sm text-zinc-300 leading-relaxed">
              Mishkat-Hub transforms MSH from a query tool into a <strong className="text-orange-300">full scholarly research environment</strong> — 
              combining real-time collaborative document authoring, structured multi-source research workflows, 
              citation graph visualization, isnad network mapping, systematic review tools, peer review queues, 
              and community forum threads — all in one unified workspace. 
              It is what <strong className="text-zinc-100">Notion + Zotero + Overleaf + a hadith corpus + a fatwa council</strong> would look like if built natively for Islamic scholarship.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Research Studio — Powered by Yjs CRDT</h4>
              <div className="space-y-2 mb-4">
                {[
                  { icon: '✍️', title: 'Real-Time Co-Authoring', desc: 'Multiple scholars edit the same research document simultaneously via Tiptap + Yjs CRDT. Live cursors, presence indicators, and conflict-free merging — just like Google Docs but built for Islamic research papers with inline hadith embedding.' },
                  { icon: '🔖', title: 'Structured Query Builder', desc: 'Instead of free-text chat, researchers build explicit queries: Select sources (Bukhari, Muslim, Tafsir Ibn Kathir), set madhab context, choose verification depth, and define output format (table, narrative, PRISMA). Results are reproducible and auditable.' },
                  { icon: '📋', title: 'Methodology Audit Log', desc: 'Every usul principle applied, every source included or excluded, and every agent call made during a research session is automatically logged. Attach the log to any academic submission for full methodological transparency.' },
                  { icon: '📤', title: 'One-Click Export', desc: 'Export complete research papers to LaTeX, Markdown, PDF, Word, or BibTeX-compatible citation lists. Arabic RTL formatting, footnotes, and isnad chains are preserved exactly.' },
                ].map((f, i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-800/20 hover:border-orange-500/30 transition-colors">
                    <span className="text-xl shrink-0">{f.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-zinc-200 mb-0.5">{f.title}</p>
                      <p className="text-xs text-zinc-500 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Advanced Research Agents (Hub-Exclusive)</h4>
              <div className="space-y-3">
                {advancedAgents.map((aa, i) => (
                  <div key={i} className="border-l-2 border-orange-500/40 pl-3 hover:border-orange-500 transition-colors">
                    <h5 className="font-bold text-sm text-zinc-200 mb-0.5">{aa.name}</h5>
                    <p className="text-xs text-zinc-500 leading-relaxed">{aa.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Citation & Isnad Network Visualization</h4>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-4">
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  Every hadith in the corpus is mapped into a <strong className="text-zinc-200">force-directed knowledge graph</strong>. 
                  Researchers can visually explore how narrations cluster by theme, how narrators connected, 
                  where chains converge or diverge, and which scholars cited which texts across centuries. 
                  Graphs are interactive, zoomable, and exportable to DOT/GraphML for external analysis tools.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Node types', val: 'Hadith · Narrator · Scholar · Book · Topic · Madhab' },
                    { label: 'Edge types', val: 'Narrated-by · Cited-in · Cross-references · Shares-isnad' },
                    { label: 'Export formats', val: 'DOT · GraphML · JSON · Interactive D3 embed' },
                    { label: 'Use cases', val: 'Isnad analysis · Thematic clustering · Scholar lineage · Consensus mapping' },
                  ].map((g, i) => (
                    <div key={i} className="bg-zinc-900 rounded p-2 border border-zinc-800">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">{g.label}</p>
                      <p className="text-[11px] text-zinc-300 leading-relaxed">{g.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Scholar Peer Review & Publication Workflow</h4>
              <div className="space-y-2 mb-4">
                {[
                  { step: '01', label: 'Submission', desc: 'Researcher submits paper or fatwa draft. System auto-attaches sources, confidence scores, and methodology log.' },
                  { step: '02', label: 'Assignment', desc: 'Hub automatically routes to qualified Scholar reviewers based on topic, madhab, and expertise tags.' },
                  { step: '03', label: 'Review', desc: 'Scholars annotate inline, run verification queries from Hub, and vote Approve / Request Revision / Reject.' },
                  { step: '04', label: 'Publication', desc: 'Approved content is published to Hub with Scholar attribution, timestamp, and permanent DOI-style reference ID.' },
                ].map((s, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="font-mono text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 px-1.5 py-0.5 rounded shrink-0 mt-0.5">{s.step}</span>
                    <div>
                      <p className="text-xs font-bold text-zinc-200">{s.label}</p>
                      <p className="text-[11px] text-zinc-500 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Community & @mention System</h4>
              <div className="space-y-2 text-xs font-mono bg-zinc-950 p-3 rounded border border-zinc-800">
                <div className="text-zinc-500">// Inline @mentions route anywhere in the system</div>
                <div><span className="text-orange-400">@scholar:ibn-baz</span> <span className="text-zinc-400">— cites a specific scholar's published opinion</span></div>
                <div><span className="text-orange-400">@bukhari:1906</span> <span className="text-zinc-400">— embeds the full hadith inline in the discussion</span></div>
                <div><span className="text-orange-400">@research:my-zakat-paper</span> <span className="text-zinc-400">— links your saved research project</span></div>
                <div><span className="text-cyan-400">/verify @bukhari:1906</span> <span className="text-zinc-400">— trigger isnad check from forum thread</span></div>
                <div><span className="text-cyan-400">/compare hanafi maliki</span> <span className="text-zinc-400">— spawn comparison table in-thread</span></div>
                <div><span className="text-cyan-400">/export:pdf @doc:zakat-research</span> <span className="text-zinc-400">— export paper from thread</span></div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Input Modality + Calendar + Multi-Tenant */}
      <Card title="Multi-Modal Input Processing" icon={Camera}>
        <p className="text-sm text-zinc-400 leading-relaxed mb-3">
          MSH accepts any input format a researcher works with. Every modality is intelligently routed 
          through the appropriate preprocessing pipeline before hitting the AI engine — 
          so a photo of a manuscript page produces the same quality analysis as typed Arabic text.
        </p>
        <div className="space-y-2">
          {[
            { icon: '📷', label: 'Image / Manuscript Scan', desc: 'Tesseract + TrOCR Arabic OCR pipeline. Handles historical manuscripts, printed books, handwritten notes. Detects RTL columns, diacritics, and marginalia. Extracted text feeds directly into RAG.' },
            { icon: '🎤', label: 'Voice / Audio Query', desc: 'Whisper ASR fine-tuned for Classical Arabic, Quranic recitation, and Islamic terminology. Researchers dictate complex queries without switching to keyboard. Supports 8 languages.' },
            { icon: '📄', label: 'PDF / EPUB / DOCX', desc: 'Full document parsing preserving structure, footnotes, chapter hierarchy, and cross-references. Automatic chunking, embedding, and indexing into the researcher\'s private Qdrant collection.' },
            { icon: '🔗', label: 'URL / Web Scrape', desc: 'Scrapes any URL, cleans HTML, removes boilerplate, and feeds structured content to the agent pipeline. Used for fetching fatwa websites, online tafsir, or contemporary scholarly articles.' },
          ].map((m, i) => (
            <div key={i} className="flex gap-3 p-2.5 rounded border border-zinc-800 bg-zinc-800/20">
              <span className="text-lg shrink-0">{m.icon}</span>
              <div>
                <p className="text-xs font-bold text-zinc-200">{m.label}</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Islamic Calendar Engine — Hijri-Aware Intelligence" icon={CalendarDays}>
        <p className="text-sm text-zinc-400 leading-relaxed mb-3">
          MSH operates with full Hijri calendar awareness — surfacing contextually relevant 
          knowledge based on the Islamic date, season, and upcoming events without any user prompt.
        </p>
        <div className="space-y-2">
          {[
            { label: 'Automatic Seasonal Context Injection', desc: 'During Ramadan, the system automatically surfaces fasting hadiths, laylat al-qadr narrations, and zakat al-fitr rulings into every relevant response — without the user asking.' },
            { label: 'Smart Prompt Priming', desc: 'The current Hijri date is injected into every agent\'s system context. "What should I focus on today?" correctly answers with relevant ibadah, historical events, and scholarly reminders for that exact day.' },
            { label: 'Prayer Time API Integration', desc: 'Real-time prayer times (Fajr to Isha) with adhkar reminders are accessible as a tool and webhook block inside MSA. Mosques can automate daily digital bulletin boards from one pipeline.' },
            { label: '"On This Hijri Day" Research', desc: 'Query historical events, births of scholars, or significant rulings that occurred on any Hijri date across Islamic history — sourced from ingested tarikh and sirah collections.' },
          ].map((f, i) => (
            <div key={i} className="border-l-2 border-orange-500/30 pl-3 py-1 hover:border-orange-500 transition-colors">
              <p className="text-xs font-bold text-zinc-200 mb-0.5">{f.label}</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Multi-Tenant & Institutional Deployment" icon={Users}>
        <p className="text-sm text-zinc-400 leading-relaxed mb-3">
          Universities, seminaries, and Islamic organizations get their own fully isolated MSH instance 
          with shared global infrastructure — complete data sovereignty with zero operational overhead.
        </p>
        <div className="space-y-2">
          {[
            { label: 'Complete Data Isolation', desc: 'Per-organization MongoDB databases, Qdrant collections, and Redis namespaces. No cross-tenant data leakage possible by design. Institutions own their curated knowledge.' },
            { label: 'Shared Global Knowledge Base', desc: 'All organizations benefit from the shared Kutub al-Sittah, Quran, Tafsir, and Narrator DB without duplicating storage — 50GB+ of verified Islamic content available day one.' },
            { label: 'Custom Domain & White-Label Branding', desc: 'Universities deploy MSH under their own domain (research.azhar.edu) with custom logos, color schemes, and welcome screens. Students see the institution\'s brand, not Mishkat\'s.' },
            { label: 'SSO / LDAP / SAML Integration', desc: 'Students and faculty log in with their existing university credentials. No separate account creation. Works with Microsoft Entra ID, Google Workspace, and any SAML 2.0 provider.' },
            { label: 'Dedicated Scholar Review Committees', desc: 'Institutions configure their own scholar review boards with custom approval workflows. A fatwa generated by a student at Al-Azhar is reviewed by Al-Azhar\'s committee — not a shared pool.' },
          ].map((f, i) => (
            <div key={i} className="border-l-2 border-blue-500/30 pl-3 py-1 hover:border-blue-500 transition-colors">
              <p className="text-xs font-bold text-zinc-200 mb-0.5">{f.label}</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Skill Engine — expanded */}
      <Card title="Skill Engine — Reusable Intelligence Pipelines" icon={Code2}>
        <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
          Skills are <strong className="text-zinc-100">shareable, versioned, YAML-defined agent pipelines</strong> — 
          reusable sequences of tools and agent calls that encapsulate domain expertise. 
          A scholar who builds the perfect "Hadith Authentication + Summary + Translation" pipeline 
          publishes it as a Skill — and every institution in the ecosystem installs it in one click.
        </p>
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 mb-3 text-xs text-orange-300">
          <strong>The power:</strong> Skills are the <em>npm packages of Islamic AI</em>. Once built, the community 
          benefits forever. A skill built by a rijal expert for narrator chain validation becomes available 
          to every student and researcher on the platform — turning individual expertise into shared infrastructure.
        </div>
        <CodeBlock title="skills/systematic-hadith-review.yml" language="yaml" code={`name: systematic-hadith-review
version: 2.1.0
description: >
  Full academic systematic review pipeline for any Islamic research topic.
  Produces PRISMA flow diagram, evidence table, and citation network.
author: research@example-institute.edu
inputs:
  - name: topic
    type: string
    description: Arabic or English research question
  - name: madhab
    type: enum
    values: [hanafi, maliki, shafii, hanbali, all]
  - name: output_lang
    type: string
    default: en
steps:
  - tool: vector_search
    input: "{{ inputs.topic }}"
    collections: [hadith, tafsir, fiqh, fatawa]
  - agent: research
    tools: [quran_search, web_search, narrator_search]
    depth: comprehensive
  - tool: verify_isnad
    for_each: "{{ steps[0].results }}"
  - agent: comparative
    madhabs: "{{ inputs.madhab }}"
  - tool: translate_text
    target: "{{ inputs.output_lang }}"
  - agent: summarize
    format: prisma_systematic_review
  - tool: save_research
    export: [pdf, latex, bibtex, graphml]`} />
      </Card>

      {/* @ and / Command System — expanded */}
      <Card title="@ and / Command System — Universal Research Shortcuts" icon={Search}>
        <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
          A <strong className="text-zinc-100">context-aware command language</strong> that works everywhere in MSH — 
          in the chat interface, inside Hub research documents, in forum threads, and in CLI pipelines. 
          It gives researchers keyboard-speed access to the entire system without leaving their current workflow.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">@mention — Embed Anywhere</p>
            <div className="space-y-1.5 text-xs font-mono bg-zinc-950 p-3 rounded border border-zinc-800">
              <div><span className="text-orange-400">@verify</span> <span className="text-zinc-300">هل حديث "طلب العلم فريضة" صحيح؟</span></div>
              <div className="text-zinc-600 pl-2">→ Runs full isnad verification inline</div>
              <div className="mt-1"><span className="text-orange-400">@bukhari:1906</span> <span className="text-zinc-300">show full text</span></div>
              <div className="text-zinc-600 pl-2">→ Embeds full hadith with narrator chain</div>
              <div className="mt-1"><span className="text-orange-400">@narrator:abu-hurayra</span></div>
              <div className="text-zinc-600 pl-2">→ Opens narrator profile from Rijal DB</div>
              <div className="mt-1"><span className="text-orange-400">@fatwa:zakat-stocks-2024</span></div>
              <div className="text-zinc-600 pl-2">→ Cites a published Hub fatwa by ID</div>
              <div className="mt-1"><span className="text-orange-400">@research:my-project</span></div>
              <div className="text-zinc-600 pl-2">→ Links your saved research project</div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">/command — Trigger Actions</p>
            <div className="space-y-1.5 text-xs font-mono bg-zinc-950 p-3 rounded border border-zinc-800">
              <div><span className="text-cyan-400">/agent:chain</span> <span className="text-zinc-300">research,verify,translate</span></div>
              <div className="text-zinc-600 pl-2">→ Chains agents in sequence on current query</div>
              <div className="mt-1"><span className="text-cyan-400">/insert:table</span> <span className="text-zinc-300">madhab زكاة الفطر</span></div>
              <div className="text-zinc-600 pl-2">→ Generates 4-madhab comparison table inline</div>
              <div className="mt-1"><span className="text-cyan-400">/export:latex</span> <span className="text-zinc-300">@doc:zakat-research</span></div>
              <div className="text-zinc-600 pl-2">→ Exports full paper to LaTeX format</div>
              <div className="mt-1"><span className="text-cyan-400">/skill:run</span> <span className="text-zinc-300">systematic-hadith-review</span></div>
              <div className="text-zinc-600 pl-2">→ Executes a published Skill pipeline</div>
              <div className="mt-1"><span className="text-cyan-400">/publish:hub</span> <span className="text-zinc-300">@doc:my-fatwa --review</span></div>
              <div className="text-zinc-600 pl-2">→ Submits to Scholar review queue</div>
            </div>
          </div>
        </div>
      </Card>

    </div>
  </div>
);

// ==========================================
// ROADMAP VIEW COMPONENTS
// ==========================================

const RoadmapSubSubtask = ({ task }) => {
  return (
    <div className="flex items-center justify-between text-sm py-1.5 pl-6 border-l-2 border-zinc-800 ml-5 hover:bg-zinc-800/30 transition-colors group rounded-r-md">
      <div className="flex items-center gap-2 text-zinc-400">
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 group-hover:bg-orange-500 transition-colors"></div>
        <span>{task.name}</span>
      </div>
      <div className="px-2">
        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
          est: {task.est}
        </span>
      </div>
    </div>
  );
};

const RoadmapSubtask = ({ subtask }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="mb-2 last:mb-0">
      <div 
        className="flex items-start gap-3 relative cursor-pointer hover:bg-zinc-800/20 p-2 rounded-lg transition-colors group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="absolute -left-[27px] top-4 w-[20px] h-px bg-zinc-800"></div>
        <div className="mt-1 flex-shrink-0 text-zinc-600 group-hover:text-cyan-500 transition-colors">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">{subtask.name}</p>
          {subtask.deps && subtask.deps.length > 0 && (
            <div className="mt-1 flex gap-2">
              {subtask.deps.map(d => (
                <span key={d} className="text-[9px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">↳ dep: {d}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {isOpen && subtask.subSubtasks && (
        <div className="mt-1 mb-3 pr-2">
          {subtask.subSubtasks.map((sst, i) => (
            <RoadmapSubSubtask key={i} task={sst} />
          ))}
        </div>
      )}
    </div>
  );
};

const RoadmapMainTask = ({ task }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative mb-6 last:mb-0">
      <div className="absolute left-3.5 top-8 bottom-0 w-px bg-zinc-800"></div>
      
      <div 
        className="flex items-start gap-3 mb-2 relative z-10 cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-7 h-7 mt-0.5 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 shadow-sm group-hover:border-orange-500/50 transition-colors">
          <Workflow size={14} className="text-orange-500" />
        </div>
        <div className="flex-1 bg-zinc-800/20 p-3 rounded-lg border border-zinc-800/50 group-hover:border-zinc-700 transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isOpen ? <ChevronDown size={16} className="text-zinc-500" /> : <ChevronRight size={16} className="text-zinc-500" />}
              <h4 className="font-semibold text-zinc-200 text-base">{task.name}</h4>
            </div>
            {task.deps && task.deps.length > 0 && task.deps[0] !== 'None' && (
              <div className="flex gap-2 items-center flex-wrap">
                <span className="text-[10px] text-zinc-500 uppercase">Depends on:</span>
                {task.deps.map(d => (
                  <span key={d} className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700">{d}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="mt-3 pl-2">
          {task.subtasks.map((sub, sIdx) => (
            <RoadmapSubtask key={sIdx} subtask={sub} />
          ))}
        </div>
      )}
    </div>
  );
};

const RoadmapPhaseNode = ({ phase }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30">
      <div 
        className="flex justify-between items-center bg-zinc-800/50 p-4 border-b border-zinc-800 cursor-pointer hover:bg-zinc-800/70 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border shadow-sm transition-colors
            ${isOpen ? 'bg-orange-500 text-white border-orange-400' : 'bg-orange-500/20 text-orange-500 border-orange-500/30'}`}
          >
            P{phase.p}
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-100">{phase.title}</h3>
            <span className="text-xs text-zinc-500 font-mono tracking-wider">Weeks {phase.w}</span>
          </div>
        </div>
        <div className="text-zinc-500">
          {isOpen ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
        </div>
      </div>
      
      {isOpen && (
        <div className="p-5">
          {phase.mainTasks.map((task, idx) => (
            <RoadmapMainTask key={idx} task={task} />
          ))}
        </div>
      )}
    </div>
  );
};

const RoadmapView = () => (
  <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
    <Card>
      <div className="p-6 border-b border-zinc-800 bg-zinc-800/30 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">40-Week Engineering Roadmap</h2>
          <p className="text-sm text-zinc-500">Sprint-Ready Execution Plan (Click phases to expand)</p>
        </div>
        <Badge color="bg-orange-500/10 text-orange-400 border border-orange-500/20">{roadmapPhases.length} Phases</Badge>
      </div>
      <div className="p-6 space-y-4">
        {roadmapPhases.map((phase, i) => (
          <RoadmapPhaseNode key={i} phase={phase} />
        ))}
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
  
  return ( 
    <div className="flex gap-6 min-h-[700px]">
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
              prose prose-invert max-w-none
              prose-headings:text-zinc-100
              prose-h1:text-4xl prose-h1:font-black prose-h1:mb-8
              prose-h2:text-2xl prose-h2:text-orange-400 prose-h2:border-b prose-h2:border-zinc-800 prose-h2:pb-2 prose-h2:mt-10
              prose-h3:text-xl prose-h3:text-zinc-200
              prose-p:text-zinc-300 prose-p:leading-8
              prose-strong:text-white
              prose-code:text-orange-300 prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-zinc-700 prose-pre:rounded-xl prose-pre:p-4
              prose-blockquote:border-orange-500 prose-blockquote:text-zinc-400
              prose-li:text-zinc-300
              prose-table:w-full
              prose-th:text-white prose-th:border prose-th:border-zinc-700 prose-th:bg-zinc-800
              prose-td:border prose-td:border-zinc-800
              prose-a:text-orange-400 prose-a:no-underline hover:prose-a:text-orange-300
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
// SPRINTS VIEW COMPONENT
// ==========================================

const SprintsView = () => {
  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <Card>
        <div className="p-6 border-b border-zinc-800 bg-zinc-800/30 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Granular Sprint Backlog</h2>
            <p className="text-sm text-zinc-500">Atomic, Jira-style task breakdown for all 40 weeks ("from nothing until it works").</p>
          </div>
          <Badge color="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">{sprintsData.length} Sprints</Badge>
        </div>
        
        <div className="p-6 grid grid-cols-1 gap-8">
          {sprintsData.map((sprint, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="bg-zinc-800/60 p-4 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center font-bold text-sm text-cyan-400 border border-zinc-700">
                    S{sprint.sprint}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-100">{sprint.title}</h3>
                    <div className="text-xs text-zinc-500">{sprint.weeks}</div>
                  </div>
                </div>
              </div>
              
              <div className="p-0">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-950/50 text-xs uppercase text-zinc-500 border-b border-zinc-800">
                    <tr>
                      <th className="px-6 py-3 font-medium">Ticket ID</th>
                      <th className="px-6 py-3 font-medium">Task / Objective</th>
                      <th className="px-6 py-3 font-medium">Type</th>
                      <th className="px-6 py-3 font-medium">Est.</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {sprint.tasks.map((task, j) => (
                      <tr key={j} className="hover:bg-zinc-800/20 transition-colors">
                        <td className="px-6 py-3 font-mono text-xs text-orange-400 whitespace-nowrap">
                          {task.id}
                        </td>
                        <td className="px-6 py-3 text-zinc-300 font-medium">
                          {task.title}
                        </td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] rounded uppercase tracking-wider">
                            {task.type}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-zinc-400 text-xs font-mono">
                          {task.est}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 text-[10px] rounded uppercase font-bold ${task.status === 'Done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : task.status === 'In Progress' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}`}>
                            {task.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
  
// ==========================================
// MAIN LAYOUT (Horizontal Nav / No Sidebar)
// ==========================================

export default function Home() {
  const [activeTab, setActiveTab] = useState('architecture');

  const tabs = [
    { id: 'architecture', label: 'Arch & Security', icon: LayoutDashboard },
    { id: 'microservices', label: 'Microservices', icon: Server },
    { id: 'agents', label: 'Agents & Tools', icon: Bot },
    { id: 'advanced', label: 'Advanced Features', icon: Terminal },
    { id: 'roadmap', label: 'Roadmap', icon: Route },
    { id: 'sprints', label: 'Sprints', icon: ListChecks },
    { id: 'files', label: 'Raw Blueprints', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'architecture': return <ArchitectureView />;
      case 'microservices': return <MicroservicesView />;
      case 'agents': return <AgentsToolsView />;
      case 'advanced': return <AdvancedFeaturesView />;
      case 'roadmap': return <RoadmapView />;
      case 'sprints': return <SprintsView />;
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