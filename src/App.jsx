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
  { name: '🔗 Citation Network Agent', desc: 'Builds knowledge graphs of hadith citations. Exportable to DOT/GraphML.' },
  { name: '📜 Fatwa Generation Agent', desc: 'Drafts preliminary responses across madhabs. Always marked "Awaiting Scholar Review".' },
  { name: '🗣️ Debate Agent', desc: 'Formal munazara structure. Position A vs B, tarjih (weighing), and recommended actions.' },
  { name: '📦 Data Lineage Agent', desc: 'Tracks journey from raw file -> parser -> chunk -> vector -> approved by.' },
  { name: '📊 Meta-Analysis Agent', desc: 'Hub feature: Systematic reviews, statistical summaries, PRISMA flow diagrams.' },
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* CLI Card */}
      <Card title="Mishkat CLI (msk)" icon={Terminal}>
        <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
          The control plane outside the browser. Built in Go. Unix-philosophy, offline-capable via compressed snapshots. Uses zstd compression for vectors and JSONL.
        </p>
        <CodeBlock title="Terminal Commands" code={`$ msk auth login
$ msk query "حكم الزواج" --format json | jq '.sources[].grade'
$ msk knowledge snapshot create --ref bukhari
$ msk agent run chain research,verify --output ./report.md
$ msk admin cache flush`} />
      </Card>

      {/* MKS Card */}
      <Card title="Mishkat Knowledge Sync (MKS)" icon={RefreshCw}>
        <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
          Self-hosted knowledge distribution and sync system. Pull collections, push incremental edits (deltas), and sync across universities. NOT a code version control system.
        </p>
        <div className="bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-sm font-mono space-y-2">
          <div className="flex justify-between"><span className="text-zinc-500">msk sync pull bukhari</span><span className="text-orange-400">Download package</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">msk sync edit</span><span className="text-orange-400">Incremental hadith fix</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">msk sync update</span><span className="text-orange-400">Fetch latest deltas</span></div>
          <div className="flex justify-between"><span className="text-zinc-500">msk sync snapshot create</span><span className="text-orange-400">Backup KB state</span></div>
        </div>
      </Card>

      {/* Canvas Card — Full MSA description */}
      <Card title="Mishkat Automation Canvas (MSA) — Islamic App Builder" icon={Workflow}>
        <p className="text-sm text-zinc-400 mb-3 leading-relaxed">
          MSA is a <strong className="text-zinc-100">no-code Islamic app builder and Backend-as-a-Service platform</strong>. Anyone — developer, scholar, mosque admin — can visually connect blocks to build a fully functional Islamic app or backend API, with <strong className="text-zinc-100">zero backend or AI knowledge required</strong>.
        </p>

        {/* Core value prop */}
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 mb-4">
          <p className="text-xs text-orange-300 font-semibold uppercase tracking-wider mb-1">What MSA Really Is</p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Build a complete app frontend (React, Flutter, Next.js) and use a <strong className="text-zinc-100">single Webhook block as your entire backend</strong>. POST your request → MSA runs the pipeline → returns structured JSON. No server. No AI code. No deployment.
          </p>
        </div>

        {/* Three roles */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'For Scholars', desc: 'Build automated research & fatwa workflows visually', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' },
            { label: 'For Devs', desc: 'Use as Islamic knowledge API backend — one webhook call', color: 'border-blue-500/30 bg-blue-500/5 text-blue-400' },
            { label: 'For Anyone', desc: 'No code needed — drag blocks, hit Run, publish to marketplace', color: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
          ].map((r, i) => (
            <div key={i} className={`rounded-lg border p-2 ${r.color}`}>
              <p className="text-[11px] font-bold mb-1">{r.label}</p>
              <p className="text-[10px] text-zinc-400 leading-relaxed">{r.desc}</p>
            </div>
          ))}
        </div>

        {/* Block types */}
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Block Types</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {[
            { dot: 'bg-emerald-500', label: 'Triggers', items: 'Schedule · Webhook · Event · Manual · CLI' },
            { dot: 'bg-blue-500',   label: 'Agent Blocks', items: 'RAG · Research · Verify · Translate · Compare · Tutor' },
            { dot: 'bg-amber-500',  label: 'Logic Blocks', items: 'Filter · Branch (IF/ELSE) · Loop · Merge · Sort · Limit' },
            { dot: 'bg-red-500',    label: 'Output Blocks', items: 'Email · WhatsApp · Discord · Telegram · HTTP · Hub Publish' },
          ].map((b, i) => (
            <div key={i} className="flex items-start gap-2 bg-zinc-800/40 rounded p-2 border border-zinc-800">
              <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${b.dot}`}></div>
              <div>
                <p className="text-xs font-bold text-zinc-200">{b.label}</p>
                <p className="text-[10px] text-zinc-500 leading-relaxed">{b.items}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Example pipeline as backend */}
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Example: App Using MSA as Full Backend</p>
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono space-y-1 mb-3">
          <div className="text-zinc-500">// React Native app — entire backend is one webhook</div>
          <div className="text-zinc-400">POST <span className="text-orange-400">api.mishkat.app/automations/webhook/abc123</span></div>
          <div className="text-zinc-400">{'{'} <span className="text-cyan-400">"query"</span>: <span className="text-emerald-400">"ما حكم صيام يوم الشك"</span>, <span className="text-cyan-400">"lang"</span>: <span className="text-emerald-400">"en"</span> {'}'}</div>
          <div className="text-zinc-600">// MSA runs: RAG → Verify → Translate → Format</div>
          <div className="text-zinc-400">{'{'} <span className="text-cyan-400">"answer"</span>: <span className="text-emerald-400">"..."</span>, <span className="text-cyan-400">"grade"</span>: <span className="text-emerald-400">"صحيح"</span>, <span className="text-cyan-400">"source"</span>: <span className="text-emerald-400">"البخاري 1906"</span>,</div>
          <div className="text-zinc-400 pl-4"><span className="text-cyan-400">"translations"</span>: {'{'} <span className="text-emerald-400">"en"</span>: <span className="text-emerald-400">"..."</span>, <span className="text-emerald-400">"ur"</span>: <span className="text-emerald-400">"..."</span> {'}'} {'}'}</div>
        </div>

        {/* Real app examples */}
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Apps Anyone Can Build</p>
        <div className="space-y-1.5">
          {[
            { icon: '📱', app: 'Hadith Verification Mobile App', desc: 'Frontend only — MSA handles all AI + verification' },
            { icon: '🕌', app: 'Mosque Website Backend', desc: 'Prayer times + daily hadith + calendar via one GET request' },
            { icon: '📚', app: 'Islamic Learning Flutter App', desc: 'Lessons + quizzes + translations — all from one pipeline' },
            { icon: '🌐', app: 'Islamic Q&A Website', desc: 'Full 4-madhab fatwa answers — no backend written' },
            { icon: '🤖', app: 'Daily Hadith WhatsApp Bot', desc: 'Schedule trigger → RAG → Translate → WhatsApp output' },
          ].map((ex, i) => (
            <div key={i} className="flex items-start gap-2 text-sm p-2 rounded border border-zinc-800 bg-zinc-800/20">
              <span className="text-base shrink-0">{ex.icon}</span>
              <div>
                <span className="font-bold text-zinc-200">{ex.app}</span>
                <span className="text-zinc-500 ml-2 text-xs">{ex.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Pipeline marketplace */}
        <div className="mt-3 p-3 bg-zinc-800/30 border border-zinc-700 rounded-lg">
          <p className="text-xs font-bold text-zinc-200 mb-1">🛒 Pipeline Marketplace</p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Built pipelines can be <strong className="text-zinc-200">published to the marketplace</strong>. Any mosque, school, or developer installs them in one click — turning Mishkat into an <strong className="text-zinc-200">Islamic app ecosystem</strong>, not just a platform.
          </p>
        </div>

        {/* Comparable to */}
        <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
          {[
            { name: 'Firebase', role: 'Backend BaaS' },
            { name: 'Supabase', role: 'DB BaaS' },
            { name: 'OpenAI API', role: 'AI BaaS' },
            { name: 'Mishkat MSA', role: 'Islamic Knowledge BaaS', highlight: true },
          ].map((c, i) => (
            <div key={i} className={`p-2 rounded border text-xs ${c.highlight ? 'border-orange-500/50 bg-orange-500/10 text-orange-300' : 'border-zinc-700 bg-zinc-800/30 text-zinc-400'}`}>
              <p className="font-bold">{c.name}</p>
              <p className="text-[10px] mt-0.5 opacity-70">{c.role}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Hub Card */}
      <Card title="Mishkat-Hub (Researcher Mode)" icon={BookOpen}>
        <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
          Full academic research environment. Moves beyond chat to structured query builders, methodology tracking, and real-time co-authoring via Yjs CRDT.
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

      {/* Input Modality & Platform features */}
      <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Multi-Modal Input" icon={Camera}>
          <p className="text-sm text-zinc-400 leading-relaxed mb-3">
            Intelligent routing for non-text inputs.
          </p>
          <ul className="text-sm text-zinc-300 space-y-2">
            <li>📷 <strong>Image:</strong> Arabic OCR (Tesseract + TrOCR)</li>
            <li>🎤 <strong>Audio:</strong> Whisper ASR (Arabic tuned)</li>
            <li>📄 <strong>Doc:</strong> PDF/EPUB Parser</li>
            <li>🔗 <strong>URL:</strong> Scraper + HTML cleaner</li>
          </ul>
        </Card>

        <Card title="Islamic Calendar Engine" icon={CalendarDays}>
          <p className="text-sm text-zinc-400 leading-relaxed mb-3">
            System-wide Hijri awareness context.
          </p>
          <ul className="text-sm text-zinc-300 space-y-2">
            <li>• Auto-surfaces relevant seasonal hadiths.</li>
            <li>• Smart Prompt injection (e.g. Ramadan).</li>
            <li>• Prayer Time Integration & Adhkar.</li>
            <li>• Historical "On this day" lookups.</li>
          </ul>
        </Card>

        <Card title="Org & Multi-Tenant" icon={Users}>
          <p className="text-sm text-zinc-400 leading-relaxed mb-3">
            Isolated instances with shared infrastructure.
          </p>
          <ul className="text-sm text-zinc-300 space-y-2">
            <li>• Data Isolation (per-org DBs).</li>
            <li>• Shared Global KB (Kutub al-Sittah).</li>
            <li>• Custom Domains & Branding.</li>
            <li>• SSO Integration (SAML/LDAP).</li>
          </ul>
        </Card>
      </div>

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
        
        <Card title="Advanced @ and / Command System" icon={Search}>
          <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
            Universal context-aware routing across the chat, documents, and Hub. Includes fuzzy-matching slash commands.
          </p>
          <div className="space-y-2 text-sm font-mono bg-zinc-950 p-4 rounded border border-zinc-800">
            <div><span className="text-orange-400">@verify</span> <span className="text-zinc-300">هل حديث "..." صحيح؟</span></div>
            <div><span className="text-orange-400">@bukhari:1906</span> <span className="text-zinc-300">Embed specific hadith</span></div>
            <div><span className="text-cyan-400">/insert:table</span> <span className="text-zinc-300">madhab زكاة الفطر</span></div>
            <div><span className="text-cyan-400">/agent:chain</span> <span className="text-zinc-300">research,verify,translate</span></div>
            <div><span className="text-cyan-400">/export:latex</span> <span className="text-zinc-300">@doc:research_zakat</span></div>
          </div>
        </Card>
      </div>

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

export default function App() {
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