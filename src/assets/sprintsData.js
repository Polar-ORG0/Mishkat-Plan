export const sprintsData = [
  {
    sprint: 1,
    title: "Sprint 1: Infra Setup & Base DBs",
    weeks: "Weeks 1-2",
    tasks: [
      { id: "MKT-101", type: "DevOps", title: "Initialize base monorepo structure with Turborepo", est: "4h", status: "Done" },
      { id: "MKT-102", type: "DevOps", title: "Configure ESLint, Prettier, and Go linter", est: "4h", status: "Done" },
      { id: "MKT-103", type: "DevOps", title: "Setup GitHub branch protection and PR templates", est: "2h", status: "Done" },
      { id: "MKT-104", type: "DevOps", title: "Create docker-compose.yml for Postgres and Redis", est: "4h", status: "In Progress" },
      { id: "MKT-105", type: "DevOps", title: "Add Qdrant and MongoDB to local Docker network", est: "4h", status: "Todo" },
      { id: "MKT-106", type: "Infra", title: "Write Terraform scripts for AWS VPC and subnets", est: "1d", status: "Todo" },
      { id: "MKT-107", type: "Infra", title: "Write Terraform for EKS Cluster provisioning", est: "2d", status: "Todo" },
      { id: "MKT-108", type: "Infra", title: "Setup Nginx Ingress Controller on EKS", est: "1d", status: "Todo" }
    ]
  },
  {
    sprint: 2,
    title: "Sprint 2: Gateway & Auth Service",
    weeks: "Weeks 3-4",
    tasks: [
      { id: "MKT-201", type: "Backend", title: "Initialize Go module for API Gateway", est: "2h", status: "Todo" },
      { id: "MKT-202", type: "Backend", title: "Implement Gin router with health check endpoints", est: "4h", status: "Todo" },
      { id: "MKT-203", type: "Backend", title: "Write httputil.ReverseProxy handler to route to microservices", est: "1d", status: "Todo" },
      { id: "MKT-204", type: "Backend", title: "Implement Redis sliding window rate limiter middleware", est: "1d", status: "Todo" },
      { id: "MKT-205", type: "Backend", title: "Setup CORS middleware for frontend domains", est: "2h", status: "Todo" },
      { id: "MKT-206", type: "Database", title: "Create Postgres migrations for User and Role tables", est: "1d", status: "Todo" },
      { id: "MKT-207", type: "Backend", title: "Implement User Registration endpoint with bcrypt", est: "1d", status: "Todo" },
      { id: "MKT-208", type: "Auth", title: "Implement JWT generation (15m access, 7d refresh)", est: "1d", status: "Todo" },
      { id: "MKT-209", type: "Auth", title: "Create JWT validation middleware in API Gateway", est: "4h", status: "Todo" }
    ]
  },
  {
    sprint: 3,
    title: "Sprint 3: Python RAG & SSE Streaming",
    weeks: "Weeks 5-6",
    tasks: [
      { id: "MKT-301", type: "AI", title: "Setup FastAPI project for Python RAG engine", est: "4h", status: "Todo" },
      { id: "MKT-302", type: "Backend", title: "Write gRPC protobuf definitions for Query Service", est: "1d", status: "Todo" },
      { id: "MKT-303", type: "Backend", title: "Generate Java, Go and Python gRPC stubs from proto files", est: "2h", status: "Todo" },
      { id: "MKT-304", type: "Backend", title: "Implement StreamManager in Go Gateway for Server-Sent Events", est: "2d", status: "Todo" },
      { id: "MKT-305", type: "Backend", title: "Connect Java gRPC client to Python RAG Server", est: "1d", status: "Todo" },
      { id: "MKT-306", type: "AI", title: "Implement Qdrant embedding storage interface in Python", est: "1d", status: "Todo" },
      { id: "MKT-307", type: "Backend", title: "Create Redis semantic caching layer for exact query matches", est: "1d", status: "Todo" },
      { id: "MKT-308", type: "AI", title: "Implement >0.95 similarity check in Qdrant before generation", est: "1d", status: "Todo" }
    ]
  },
  {
    sprint: 4,
    title: "Sprint 4: Chat Service & Data Ingestion Base",
    weeks: "Weeks 7-8",
    tasks: [
      { id: "MKT-401", type: "Backend", title: "Setup Spring WebSocket Hub in Java for Chat Service", est: "1d", status: "Todo" },
      { id: "MKT-402", type: "Backend", title: "Implement Redis 20-message sliding window history", est: "1d", status: "Todo" },
      { id: "MKT-403", type: "Database", title: "Persist completed WebSocket chat sessions to MongoDB", est: "1d", status: "Todo" },
      { id: "MKT-404", type: "Backend", title: "Setup Spring Boot application for Data Ingestion", est: "4h", status: "Todo" },
      { id: "MKT-405", type: "Backend", title: "Configure Spring Batch JobRepository with Postgres", est: "1d", status: "Todo" },
      { id: "MKT-406", type: "Backend", title: "Write JsonHadithReader for parsing large JSON arrays", est: "2d", status: "Todo" },
      { id: "MKT-407", type: "Backend", title: "Implement ContentValidator to filter malformed records", est: "1d", status: "Todo" },
      { id: "MKT-408", type: "Backend", title: "Setup Kafka producer in Java to emit 'chunk_ready' events", est: "1d", status: "Todo" }
    ]
  },
  {
    sprint: 5,
    title: "Sprint 5: LangGraph & Intent Routing",
    weeks: "Weeks 9-10",
    tasks: [
      { id: "MKT-501", type: "AI", title: "Setup LangGraph project structure in Python", est: "4h", status: "Todo" },
      { id: "MKT-502", type: "AI", title: "Design Prompt/Small LLM chain for Intent Classification", est: "2d", status: "Todo" },
      { id: "MKT-503", type: "AI", title: "Implement LangGraph State schema (messages, context, route)", est: "1d", status: "Todo" },
      { id: "MKT-504", type: "AI", title: "Build AgentRouter node to forward to specialist sub-graphs", est: "2d", status: "Todo" },
      { id: "MKT-505", type: "AI", title: "Implement Short-term working memory per request", est: "1d", status: "Todo" },
      { id: "MKT-506", type: "Backend", title: "Write episodic memory summarization cron job", est: "2d", status: "Todo" },
      { id: "MKT-507", type: "Backend", title: "Setup iText PDF parser in Java Reference Service", est: "1d", status: "Todo" },
      { id: "MKT-508", type: "Backend", title: "Implement RTL Arabic text extraction logic", est: "2d", status: "Todo" }
    ]
  },
  {
    sprint: 6,
    title: "Sprint 6: Tool Registry & Base Agents",
    weeks: "Weeks 11-12",
    tasks: [
      { id: "MKT-601", type: "AI", title: "Implement Google/Bing Web Search Tool wrapper", est: "4h", status: "Todo" },
      { id: "MKT-602", type: "AI", title: "Implement BeautifulSoup Web Scraper tool", est: "4h", status: "Todo" },
      { id: "MKT-603", type: "AI", title: "Implement DeepL/Google Translation API tool", est: "4h", status: "Todo" },
      { id: "MKT-604", type: "AI", title: "Build vector_search tool connecting to Qdrant", est: "1d", status: "Todo" },
      { id: "MKT-605", type: "AI", title: "Build hadith_by_number strict SQL lookup tool", est: "1d", status: "Todo" },
      { id: "MKT-606", type: "AI", title: "Build hallucination_check validation tool", est: "2d", status: "Todo" },
      { id: "MKT-607", type: "AI", title: "Write ReAct prompt template for Research Agent", est: "1d", status: "Todo" },
      { id: "MKT-608", type: "AI", title: "Implement verify_isnad logic and prompts", est: "2d", status: "Todo" }
    ]
  },
  {
    sprint: 7,
    title: "Sprint 7: Content Ingestion (Kutub al-Sittah)",
    weeks: "Weeks 13-14",
    tasks: [
      { id: "MKT-701", type: "Data", title: "Clean and format Bukhari JSON source files", est: "1d", status: "Todo" },
      { id: "MKT-702", type: "Backend", title: "Run Bukhari through Spring Batch pipeline", est: "1d", status: "Todo" },
      { id: "MKT-703", type: "Data", title: "Clean and format Muslim JSON source files", est: "1d", status: "Todo" },
      { id: "MKT-704", type: "Backend", title: "Run Muslim through Spring Batch pipeline", est: "1d", status: "Todo" },
      { id: "MKT-705", type: "Data", title: "Map numbering schemas for Tirmidhi and Abu Dawood", est: "2d", status: "Todo" },
      { id: "MKT-706", type: "Backend", title: "Ingest Tirmidhi and Abu Dawood", est: "1d", status: "Todo" },
      { id: "MKT-707", type: "Backend", title: "Ingest Nasai and Ibn Majah", est: "1d", status: "Todo" },
      { id: "MKT-708", type: "AI", title: "Verify embeddings generation via Python Kafka consumer", est: "1d", status: "Todo" }
    ]
  },
  {
    sprint: 8,
    title: "Sprint 8: Advanced Agents & Narrators",
    weeks: "Weeks 15-16",
    tasks: [
      { id: "MKT-801", type: "Data", title: "Ingest primary Fiqh texts for the 4 Madhabs", est: "3d", status: "Todo" },
      { id: "MKT-802", type: "AI", title: "Design tabular output template for Comparative Agent", est: "1d", status: "Todo" },
      { id: "MKT-803", type: "AI", title: "Test multi-madhab query resolution prompt", est: "2d", status: "Todo" },
      { id: "MKT-804", type: "AI", title: "Implement language detection NLP tool", est: "1d", status: "Todo" },
      { id: "MKT-805", type: "AI", title: "Implement Fatwa drafting prompt template", est: "1d", status: "Todo" },
      { id: "MKT-806", type: "Data", title: "Parse Taqrib al-Tahdhib PDF for Rijal data", est: "2d", status: "Todo" },
      { id: "MKT-807", type: "Database", title: "Extract structured Narrator data (Name, Grade) to MongoDB", est: "1d", status: "Todo" },
      { id: "MKT-808", type: "Backend", title: "Implement fuzzy Arabic name matching for Isnad chains", est: "2d", status: "Todo" }
    ]
  },
  {
    sprint: 9,
    title: "Sprint 9: Next.js Frontend Foundation",
    weeks: "Weeks 17-18",
    tasks: [
      { id: "MKT-901", type: "Frontend", title: "Initialize Next.js 15 App Router", est: "4h", status: "Todo" },
      { id: "MKT-902", type: "Frontend", title: "Setup Shadcn UI and Tailwind CSS v4", est: "4h", status: "Todo" },
      { id: "MKT-903", type: "Frontend", title: "Configure next-themes for Light/Dark mode", est: "2h", status: "Todo" },
      { id: "MKT-904", type: "Frontend", title: "Implement Base Layout (Sidebar, Topnav)", est: "1d", status: "Todo" },
      { id: "MKT-905", type: "Frontend", title: "Create Chat Interface React components", est: "2d", status: "Todo" },
      { id: "MKT-906", type: "Frontend", title: "Implement markdown parser with ReactMarkdown", est: "1d", status: "Todo" },
      { id: "MKT-907", type: "Frontend", title: "Add custom component rendering for citation tags", est: "1d", status: "Todo" },
      { id: "MKT-908", type: "Frontend", title: "Implement SSE consumer hook for streaming messages", est: "1d", status: "Todo" }
    ]
  },
  {
    sprint: 10,
    title: "Sprint 10: Multi-Modal, PWA, and / Commands",
    weeks: "Weeks 19-20",
    tasks: [
      { id: "MKT-1001", type: "Frontend", title: "Implement drag-and-drop file upload zone component", est: "1d", status: "Todo" },
      { id: "MKT-1002", type: "Frontend", title: "Integrate browser audio recording API for voice queries", est: "2d", status: "Todo" },
      { id: "MKT-1003", type: "Frontend", title: "Configure next-pwa for offline service workers", est: "1d", status: "Todo" },
      { id: "MKT-1004", type: "Frontend", title: "Implement IndexedDB wrapper for offline chat history", est: "2d", status: "Todo" },
      { id: "MKT-1005", type: "Frontend", title: "Build fuzzy-searchable Command Palette for / slash commands", est: "2d", status: "Todo" },
      { id: "MKT-1006", type: "Frontend", title: "Implement inline /insert hadith/ayah handlers", est: "1d", status: "Todo" },
      { id: "MKT-1007", type: "Frontend", title: "Implement robust @ mentions autocomplete popup", est: "2d", status: "Todo" },
      { id: "MKT-1008", type: "Frontend", title: "Implement API Key generation UI in Admin Dashboard", est: "1d", status: "Todo" }
    ]
  },
  {
    sprint: 11,
    title: "Sprint 11: Production Kubernetes & CI/CD",
    weeks: "Weeks 21-22",
    tasks: [
      { id: "MKT-1101", type: "DevOps", title: "Create base Helm chart templates for Java and Go services", est: "1d", status: "Todo" },
      { id: "MKT-1102", type: "DevOps", title: "Create Helm charts for Python services", est: "1d", status: "Todo" },
      { id: "MKT-1103", type: "DevOps", title: "Define resource limits and requests for all pods", est: "1d", status: "Todo" },
      { id: "MKT-1104", type: "DevOps", title: "Configure Horizontal Pod Autoscaler (HPA) for Gateway", est: "4h", status: "Todo" },
      { id: "MKT-1105", type: "DevOps", title: "Setup GPU node autoscaling for Python RAG", est: "1d", status: "Todo" },
      { id: "MKT-1106", type: "DevOps", title: "Deploy kube-prometheus-stack to EKS", est: "1d", status: "Todo" },
      { id: "MKT-1107", type: "DevOps", title: "Create custom Grafana dashboards for API Gateway", est: "2d", status: "Todo" },
      { id: "MKT-1108", type: "DevOps", title: "Setup alertmanager for pod crashes", est: "1d", status: "Todo" }
    ]
  },
  {
    sprint: 12,
    title: "Sprint 12: Tracing & Reliability",
    weeks: "Weeks 23-24",
    tasks: [
      { id: "MKT-1201", type: "DevOps", title: "Deploy Jaeger operator to EKS", est: "4h", status: "Todo" },
      { id: "MKT-1202", type: "Backend", title: "Inject traceparents in Go API Gateway", est: "1d", status: "Todo" },
      { id: "MKT-1203", type: "Backend", title: "Propagate trace IDs to Python gRPC services", est: "1d", status: "Todo" },
      { id: "MKT-1204", type: "AI", title: "Implement LLM retry logic with exponential backoff", est: "1d", status: "Todo" },
      { id: "MKT-1205", type: "AI", title: "Implement failover from Google -> Ollama -> Cohere", est: "2d", status: "Todo" },
      { id: "MKT-1206", type: "QA", title: "Write k6 test scripts for 1000 concurrent websockets", est: "2d", status: "Todo" },
      { id: "MKT-1207", type: "QA", title: "Run load tests and analyze bottlenecks", est: "2d", status: "Todo" },
      { id: "MKT-1208", type: "Database", title: "Optimize database connection pools based on load test", est: "1d", status: "Todo" }
    ]
  },
  {
    sprint: 13,
    title: "Sprint 13: Billing Service Base",
    weeks: "Weeks 25-26",
    tasks: [
      { id: "MKT-1301", type: "Database", title: "Design PostgreSQL Wallet and Ledger schemas", est: "1d", status: "Todo" },
      { id: "MKT-1302", type: "Backend", title: "Implement WalletService credit/debit transaction logic", est: "2d", status: "Todo" },
      { id: "MKT-1303", type: "Backend", title: "Implement immutable Ledger append-only logging", est: "1d", status: "Todo" },
      { id: "MKT-1304", type: "Backend", title: "Create Stripe Developer account and get keys", est: "2h", status: "Todo" },
      { id: "MKT-1305", type: "Backend", title: "Implement coin package purchase API endpoints", est: "1d", status: "Todo" },
      { id: "MKT-1306", type: "Backend", title: "Setup Stripe Webhook listener for payment_intent.succeeded", est: "2d", status: "Todo" },
      { id: "MKT-1307", type: "Backend", title: "Handle Stripe refund and dispute webhook events", est: "1d", status: "Todo" },
      { id: "MKT-1308", type: "Frontend", title: "Build frontend UI for Coin purchasing and Wallet history", est: "2d", status: "Todo" }
    ]
  },
  {
    sprint: 14,
    title: "Sprint 14: Coin Enforcement",
    weeks: "Weeks 27-28",
    tasks: [
      { id: "MKT-1401", type: "Backend", title: "Implement CoinCheck Middleware in API Gateway", est: "1d", status: "Todo" },
      { id: "MKT-1402", type: "Backend", title: "Cache user coin balance in Redis (TTL 5 mins)", est: "1d", status: "Todo" },
      { id: "MKT-1403", type: "Backend", title: "Return 402 Payment Required for insufficient funds", est: "4h", status: "Todo" },
      { id: "MKT-1404", type: "Backend", title: "Define coin cost configurations for all 38 tools", est: "1d", status: "Todo" },
      { id: "MKT-1405", type: "Backend", title: "Implement post-execution atomic coin deduction", est: "2d", status: "Todo" },
      { id: "MKT-1406", type: "Backend", title: "Implement auto-refund logic for upstream LLM failures", est: "1d", status: "Todo" },
      { id: "MKT-1407", type: "Backend", title: "Write unit tests for race conditions in WalletService", est: "1d", status: "Todo" },
      { id: "MKT-1408", type: "Frontend", title: "Build Admin UI to override user coin balances", est: "1d", status: "Todo" }
    ]
  },
  {
    sprint: 15,
    title: "Sprint 15: msk CLI Tool",
    weeks: "Weeks 29-30",
    tasks: [
      { id: "MKT-1501", type: "Backend", title: "Initialize Go Cobra CLI project for `msk`", est: "4h", status: "Todo" },
      { id: "MKT-1502", type: "Backend", title: "Implement `msk auth login` OAuth device flow", est: "2d", status: "Todo" },
      { id: "MKT-1503", type: "Backend", title: "Implement `msk query` with JSON output formatting", est: "1d", status: "Todo" },
      { id: "MKT-1504", type: "Backend", title: "Implement `msk agent run` chain logic", est: "2d", status: "Todo" },
      { id: "MKT-1505", type: "Backend", title: "Add stdin/stdout piping support for local files", est: "1d", status: "Todo" },
      { id: "MKT-1506", type: "Backend", title: "Handle streaming SSE responses in terminal", est: "1d", status: "Todo" },
      { id: "MKT-1507", type: "DevOps", title: "Setup GoReleaser for cross-platform binary builds", est: "1d", status: "Todo" },
      { id: "MKT-1508", type: "Docs", title: "Publish `msk` CLI documentation and man pages", est: "1d", status: "Todo" }
    ]
  },
  {
    sprint: 16,
    title: "Sprint 16: Mishkat Knowledge Sync (MKS)",
    weeks: "Weeks 31-32",
    tasks: [
      { id: "MKT-1601", type: "Database", title: "Design MKS collection versioning DB schema", est: "1d", status: "Todo" },
      { id: "MKT-1602", type: "Backend", title: "Implement KB package export to S3 bucket", est: "2d", status: "Todo" },
      { id: "MKT-1603", type: "Backend", title: "Build `msk sync pull` to download from S3", est: "1d", status: "Todo" },
      { id: "MKT-1604", type: "Backend", title: "Track individual hadith changes and generate diffs", est: "2d", status: "Todo" },
      { id: "MKT-1605", type: "Backend", title: "Implement `msk sync update` for delta application", est: "2d", status: "Todo" },
      { id: "MKT-1606", type: "Backend", title: "Integrate zstd compression library in Go", est: "4h", status: "Todo" },
      { id: "MKT-1607", type: "Backend", title: "Format vectors and metadata into `.mishkat.zst` blobs", est: "2d", status: "Todo" },
      { id: "MKT-1608", type: "Backend", title: "Write decompression and ingestion script for edge devices", est: "1d", status: "Todo" }
    ]
  },
  {
    sprint: 17,
    title: "Sprint 17: Automation Canvas",
    weeks: "Weeks 33-34",
    tasks: [
      { id: "MKT-1701", type: "Frontend", title: "Implement React Flow for DAG node visualization", est: "3d", status: "Todo" },
      { id: "MKT-1702", type: "Frontend", title: "Create UI components for Trigger and Action blocks", est: "2d", status: "Todo" },
      { id: "MKT-1703", type: "Frontend", title: "Generate JSON graph representation from Canvas UI", est: "1d", status: "Todo" },
      { id: "MKT-1704", type: "Backend", title: "Parse JSON graph into execution order in Go backend", est: "2d", status: "Todo" },
      { id: "MKT-1705", type: "Backend", title: "Implement parallel/sequential DAG node runners", est: "3d", status: "Todo" },
      { id: "MKT-1706", type: "Backend", title: "Handle Automation node failures and retries", est: "2d", status: "Todo" },
      { id: "MKT-1707", type: "Backend", title: "Define strict YAML schema for Skill Engine", est: "1d", status: "Todo" },
      { id: "MKT-1708", type: "Backend", title: "Build Skill publishing and versioning API", est: "2d", status: "Todo" }
    ]
  },
  {
    sprint: 18,
    title: "Sprint 18: Mishkat-Hub & Notifications",
    weeks: "Weeks 35-36",
    tasks: [
      { id: "MKT-1801", type: "Frontend", title: "Integrate Tiptap editor with Yjs for Co-authoring", est: "3d", status: "Todo" },
      { id: "MKT-1802", type: "Backend", title: "Setup Hocuspocus WebSocket server for Yjs sync", est: "2d", status: "Todo" },
      { id: "MKT-1803", type: "Backend", title: "Generate Citation Network data from hadith references", est: "2d", status: "Todo" },
      { id: "MKT-1804", type: "Frontend", title: "Implement Force-directed graph visualization in UI", est: "2d", status: "Todo" },
      { id: "MKT-1805", type: "Frontend", title: "Build Hub discussion threads and replies UI", est: "2d", status: "Todo" },
      { id: "MKT-1806", type: "Backend", title: "Setup cross-platform Push API (FCM/APNs) backend", est: "2d", status: "Todo" },
      { id: "MKT-1807", type: "Frontend", title: "Implement real-time in-app notification bell UI", est: "1d", status: "Todo" },
      { id: "MKT-1808", type: "Backend", title: "Send alerts for @mentions and long-running agent completion", est: "1d", status: "Todo" }
    ]
  },
  {
    sprint: 19,
    title: "Sprint 19: System Optimization",
    weeks: "Weeks 37-38",
    tasks: [
      { id: "MKT-1901", type: "DevOps", title: "Analyze Redis cache hit rates in production environment", est: "1d", status: "Todo" },
      { id: "MKT-1902", type: "Backend", title: "Adjust TTLs and eviction policies based on metrics", est: "1d", status: "Todo" },
      { id: "MKT-1903", type: "Database", title: "Optimize Qdrant HNSW indexing parameters for speed", est: "2d", status: "Todo" },
      { id: "MKT-1904", type: "Database", title: "Run Postgres EXPLAIN ANALYZE on top 10 slow queries", est: "2d", status: "Todo" },
      { id: "MKT-1905", type: "Database", title: "Add composite DB indexes for common user filters", est: "1d", status: "Todo" },
      { id: "MKT-1906", type: "Database", title: "Setup Postgres vacuuming and maintenance cron jobs", est: "1d", status: "Todo" },
      { id: "MKT-1907", type: "Security", title: "Conduct automated vulnerability scans (OWASP ZAP)", est: "1d", status: "Todo" },
      { id: "MKT-1908", type: "Security", title: "Manual penetration testing of JWT and CORS boundaries", est: "2d", status: "Todo" }
    ]
  },
  {
    sprint: 20,
    title: "Sprint 20: Launch Prep",
    weeks: "Weeks 39-40",
    tasks: [
      { id: "MKT-2001", type: "Security", title: "Resolve identified critical/high security issues", est: "3d", status: "Todo" },
      { id: "MKT-2002", type: "QA", title: "Write integration tests for RBAC tenant isolation", est: "2d", status: "Todo" },
      { id: "MKT-2003", type: "Docs", title: "Finalize Swagger/Redoc API documentation", est: "1d", status: "Todo" },
      { id: "MKT-2004", type: "Docs", title: "Write end-user guides and tutorials for Mishkat Hub", est: "3d", status: "Todo" },
      { id: "MKT-2005", type: "Marketing", title: "Prepare launch announcement marketing content", est: "2d", status: "Todo" },
      { id: "MKT-2006", type: "Database", title: "Execute final database migrations and backups", est: "1d", status: "Todo" },
      { id: "MKT-2007", type: "DevOps", title: "Flip DNS to production EKS clusters", est: "1d", status: "Todo" },
      { id: "MKT-2008", type: "DevOps", title: "Establish 24/7 on-call rotation for post-launch week", est: "1d", status: "Todo" }
    ]
  }
];
