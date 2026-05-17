import React, { useState } from "react";

// ─── ALL DATA ─────────────────────────────────────────────────────────────────

const SERVICES = [
  {
    id: "gateway",
    label: "API Gateway",
    icon: "⬡",
    color: "#E8935A",
    port: 8080,
    tech: "Spring Boot 3 + Spring Cloud Gateway",
    short: "Single entry point. JWT auth, rate limiting, routing to all mks services.",
    responsibilities: [
      "Routes all /api/mks/** requests to downstream Spring Boot services",
      "JWT RS256 validation — injects X-User-Id, X-User-Role, X-Tenant-Id headers",
      "Sliding-window rate limiting per tier: Guest 100/hr, Maintainer 2000/hr (Redis backed)",
      "Request sanitization middleware: strips dangerous inputs, validates Content-Type",
      "Health aggregation endpoint merging status from all downstream services",
      "CORS configuration locked to allowed tenant origins",
    ],
    deps: ["Redis (rate-limit counters)", "Auth Service (key validation)"],
  },
  {
    id: "sync",
    label: "Sync Service",
    icon: "⇄",
    color: "#5AB4E8",
    port: 8081,
    tech: "Spring Boot 3 + Spring Web + Spring Data JPA",
    short: "Core orchestrator. Handles pull, push, incremental edit, update, and multi-instance sync.",
    responsibilities: [
      "PullService: resolves requested packages from Registry, streams .mks bundles to client",
      "PushService: validates uploaded data against domain.yaml, calls Compression Engine, stores in MinIO",
      "DeltaSyncService: applies incremental edits to live Qdrant collection via RAG Engine",
      "RemoteSyncService: manages federation with other mks instances",
      "AutoSyncService: Spring @Scheduled daemon — polls remotes on configured interval",
      "Emits Kafka events on every push, edit, and sync operation for audit trail",
      "Coordinates with Validation Service before accepting any push",
    ],
    deps: ["PostgreSQL", "Kafka", "MinIO/S3", "Compression Service", "Validation Service"],
  },
  {
    id: "package-registry",
    label: "Package Registry",
    icon: "◈",
    color: "#5AE8A0",
    port: 8082,
    tech: "Spring Boot 3 + Spring Data JPA + Spring Batch",
    short: "Catalog of all knowledge packages: metadata, versioning, manifest, file index.",
    responsibilities: [
      "CRUD for KnowledgePackage and PackageVersion entities in PostgreSQL",
      "Generates manifest.json per version: record count, checksum, file index",
      "Manages package visibility: public (global), org-private, deprecated",
      "Spring Batch job to re-index all packages when embedding model changes",
      "Package search: faceted search by domain (legal, medical, tech, custom), size, embedding model",
      "Signed attestation requirement: all versions must pass Integrity check before publishing",
      "Serves chunk-indexed download manifest for resumable streaming",
    ],
    deps: ["PostgreSQL", "MinIO/S3", "Integrity Service"],
  },
  {
    id: "delta",
    label: "Delta Engine",
    icon: "△",
    color: "#E8D45A",
    port: 8083,
    tech: "Spring Boot 3 + Spring Web + Apache Kafka",
    short: "Computes, stores, and applies incremental change patches between corpus versions.",
    responsibilities: [
      "DeltaComputeService: diffs two PackageVersion snapshots, produces typed INSERT/UPDATE/DELETE patches",
      "DeltaApplyService: atomically applies delta to tenant's Qdrant collection — rolled back on failure",
      "DeltaChainService: resolves the ordered patch chain between client's local version and latest",
      "Stores delta binary in MinIO; records metadata in PostgreSQL (uks_delta_patches table)",
      "Publishes mks.delta.generated Kafka event after successful generation",
      "Delta compression: patches are zstd-compressed before storage (~200 bytes per single record edit)",
      "Maintains delta chain history for full rollback support",
    ],
    deps: ["PostgreSQL", "MinIO/S3", "Kafka", "Qdrant (via RAG Engine gRPC)"],
  },
  {
    id: "compression",
    label: "Compression Engine",
    icon: "◉",
    color: "#A85AE8",
    port: 8084,
    tech: "Spring Boot 3 + Spring Web (calls native zstd via JNI)",
    short: "Builds and decompresses .mks packages: JSONL+zstd for text, NPY+zstd for vectors.",
    responsibilities: [
      "PackageBuilder: assembles .mks bundle from raw JSONL records + vector NPY + domain.yaml config",
      "Compresses records/ directory: JSONL → .jsonl.zst (6:1 ratio)",
      "Compresses vectors/ directory: float32 NPY → .npy.zst (2.2:1 ratio)",
      "Decompression endpoint: extracts a received .mks for import into local Qdrant/PostgreSQL",
      "SHA-256 checksum computation on final bundle before passing to Integrity Service",
      "Supports partial package builds: text-only (no vectors) for --text-only pull flag",
    ],
    deps: ["MinIO/S3 (reads raw data, writes .mks)", "zstd native library via JNI"],
  },
  {
    id: "validation",
    label: "Validation Service",
    icon: "✦",
    color: "#E85A8A",
    port: 8085,
    tech: "Spring Boot 3 + Spring Validation + Dynamic Schema Engine",
    short: "Three-layer validation based on domain.yaml: schema conformance, encoding integrity, vector dimensions.",
    responsibilities: [
      "DynamicSchemaValidator: reads domain.yaml and verifies pushed JSONL against required fields (e.g. contract_id, clause_text)",
      "EncodingValidator: checks text encoding, validates UTF-8, and enforces language-specific normalizations defined in config",
      "VectorValidator: confirms embedding dimensions match declared model in rag_config (e.g., 1536 for text-embedding-3)",
      "DuplicateValidator: cross-checks new records against existing collection based on defined primary_key",
      "ContentSafetyValidator: scans for prohibited content patterns and PII (Regex rules defined in domain.yaml)",
      "Issues signed ValidationResult token that Sync Service requires before any push proceeds",
    ],
    deps: ["PostgreSQL (audit log)", "Qdrant (duplicate check)"],
  },
  {
    id: "snapshot",
    label: "Snapshot Service",
    icon: "▣",
    color: "#5AE8D4",
    port: 8086,
    tech: "Spring Boot 3 + Spring Batch + Spring Scheduling",
    short: "Full-KB versioned snapshots: create, list, export as .mks.zst archive, rollback.",
    responsibilities: [
      "SnapshotCreateService: iterates all active packages, bundles each as .mks, wraps in .mks.zst archive",
      "SnapshotExportService: streams snapshot archive to client for offline / backup use",
      "RollbackService: atomically restores a collection or entire KB to a prior snapshot state",
      "Spring Batch job for background snapshot creation (runs async, emits progress events via SSE)",
      "Auto-snapshot trigger: creates snapshot before any rollback or major push operation",
      "Retention policy: configurable max snapshots, auto-pruning of oldest",
    ],
    deps: ["PostgreSQL", "MinIO/S3", "Sync Service (coordinates rollback)"],
  },
  {
    id: "changelog",
    label: "Changelog Service",
    icon: "◷",
    color: "#E8705A",
    port: 8087,
    tech: "Spring Boot 3 + Spring Data JPA + Kafka Consumer",
    short: "Immutable append-only audit log of every knowledge change: who, what, when, why.",
    responsibilities: [
      "Kafka consumer for mks.push, mks.edit, mks.rollback, mks.sync events — all writes",
      "ChangelogEntry written per event: collection, operation, author, old_value, new_value, message",
      "Full search: filter by collection, author, operation type, date range",
      "Single change detail: show complete before/after diff for any change ID",
      "Export changelog as JSON or CSV for audit trails and compliance",
      "Never deletes entries — append-only by design for tamper-evidence",
    ],
    deps: ["PostgreSQL (append-only table)", "Kafka"],
  },
  {
    id: "remote-sync",
    label: "Remote Sync Manager",
    icon: "⇌",
    color: "#5A7AE8",
    port: 8088,
    tech: "Spring Boot 3 + Spring Web + Spring Scheduling",
    short: "Manages federation with other mks instances: register remotes, push/pull cross-instance, auto-sync.",
    responsibilities: [
      "RemoteRegistry: CRUD for registered remote mks instances (name, URL, API key, trust level)",
      "CrossInstancePull: authenticates to remote, fetches package manifest, streams .mks to local",
      "CrossInstancePush: authenticates to remote, pushes local packages or corrections upstream",
      "AutoSyncDaemon: @Scheduled task, polls all active remotes at configured interval (e.g. 6h)",
      "Conflict resolution: timestamp-wins strategy for simultaneous edits from two instances",
      "Connectivity health check: periodic ping to all registered remotes, alerts on failure",
    ],
    deps: ["PostgreSQL", "Sync Service", "Kafka"],
  },
  {
    id: "integrity",
    label: "Integrity Service",
    icon: "⬟",
    color: "#8AE85A",
    port: 8089,
    tech: "Spring Boot 3 + Spring Security Crypto",
    short: "SHA-256 checksum verification, Ed25519 signature on delta patches, package attestation.",
    responsibilities: [
      "Verifies SHA-256 of uploaded .mks bundle against manifest.json checksum declaration",
      "Validates Ed25519 signatures on approved delta patches against trusted MaintainerKey registry",
      "Issues signed IntegrityAttestation token (JWT) that Registry and Delta Engine require",
      "Detects tampered packages: any byte-level mismatch triggers rejection and alert",
      "Publishes mks.integrity.failed Kafka event with failure reason for alerting pipeline",
      "MaintainerKey trust management: provisional → trusted → revoked lifecycle",
    ],
    deps: ["PostgreSQL (MaintainerKey, Attestation tables)", "Kafka"],
  },
  {
    id: "subscription",
    label: "Subscription Manager",
    icon: "◎",
    color: "#E8C45A",
    port: 8090,
    tech: "Spring Boot 3 + Spring Data JPA",
    short: "Tracks which packages each user/institution subscribes to; delivers delta-available notifications.",
    responsibilities: [
      "CRUD for Subscription entities: package_id, version_constraint, auto_update, pinned_version",
      "PullManifestService: computes the ordered list of delta_ids a client needs to reach latest",
      "Kafka listener for mks.package.published: triggers delta-available check for all subscribers",
      "Version pinning: institution can lock to v1.2.x and skip v2.x entirely",
      "License enforcement: org-private packages require valid LicenseKey record",
      "SyncSessionTracker: records in-progress sync sessions with progress and rollback state",
    ],
    deps: ["PostgreSQL", "Kafka"],
  },
];

const ENTITIES = [
  {
    name: "KnowledgePackage",
    table: "uks_packages",
    color: "#5AE8A0",
    service: "Package Registry",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "slug", type: "VARCHAR(80) UNIQUE", note: "e.g. corp-contracts, med-guidelines" },
      { name: "display_name", type: "VARCHAR(200)", note: "Human readable name" },
      { name: "domain_schema", type: "VARCHAR(100)", note: "e.g. legal, medical, tech_docs" },
      { name: "description", type: "TEXT" },
      { name: "rag_config", type: "JSONB", note: "Embedding model, dimensions, chunk strategy" },
      { name: "owner_org_id", type: "UUID FK→orgs NULLABLE", note: "NULL = global/public" },
      { name: "is_core", type: "BOOLEAN DEFAULT false", note: "true = Official/Verified package" },
      { name: "forked_from_id", type: "UUID FK→uks_packages NULLABLE", note: "Source package this was forked from" },
      { name: "latest_version", type: "VARCHAR(20)", note: "Semver e.g. 1.2.0" },
      { name: "total_records", type: "INT" },
      { name: "visibility", type: "ENUM(public,org_private,deprecated)" },
      { name: "vector_collection", type: "VARCHAR(100)", note: "Qdrant collection name" },
      { name: "created_at", type: "TIMESTAMPTZ" },
    ],
  },
  {
    name: "PackageVersion",
    table: "uks_package_versions",
    color: "#5AB4E8",
    service: "Package Registry",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "package_id", type: "UUID FK→uks_packages" },
      { name: "version", type: "VARCHAR(20)", note: "Semver. Immutable once published." },
      { name: "minio_key", type: "VARCHAR(500)", note: "Path to .mks bundle in MinIO" },
      { name: "sha256", type: "CHAR(64)", note: "Hex digest of compressed bundle" },
      { name: "byte_size_compressed", type: "BIGINT" },
      { name: "chunk_count", type: "INT", note: "10 MB chunks for resumable download" },
      { name: "has_vectors", type: "BOOLEAN DEFAULT true" },
      { name: "status", type: "ENUM(draft,published,deprecated)" },
      { name: "published_by", type: "UUID FK→users" },
      { name: "published_at", type: "TIMESTAMPTZ" },
    ],
  },
  {
    name: "DeltaPatch",
    table: "uks_delta_patches",
    color: "#E8D45A",
    service: "Delta Engine",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "package_id", type: "UUID FK→uks_packages" },
      { name: "from_version", type: "VARCHAR(20)" },
      { name: "to_version", type: "VARCHAR(20)" },
      { name: "minio_key", type: "VARCHAR(500)", note: "Path to .mks-delta binary in MinIO" },
      { name: "sha256", type: "CHAR(64)" },
      { name: "inserts_count", type: "INT", note: "New records added" },
      { name: "updates_count", type: "INT", note: "Modified records" },
      { name: "deletes_count", type: "INT", note: "Removed records" },
      { name: "patch_type", type: "ENUM(auto_computed,maintainer_edit,batch_correction)" },
      { name: "signature", type: "TEXT", note: "Ed25519 base64, signed by maintainer" },
      { name: "generated_at", type: "TIMESTAMPTZ" },
    ],
  },
  {
    name: "IncrementalEdit",
    table: "uks_incremental_edits",
    color: "#E8D45A",
    service: "Delta Engine",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "package_id", type: "UUID FK→uks_packages" },
      { name: "record_id", type: "VARCHAR(200)", note: "e.g. doc_104, policy_xyz" },
      { name: "domain_record_type", type: "VARCHAR(100)", note: "Type of record defined in domain.yaml" },
      { name: "field_path", type: "VARCHAR(200)", note: "JSONPath e.g. $.status, $.clause_text" },
      { name: "old_value", type: "JSONB" },
      { name: "new_value", type: "JSONB" },
      { name: "edit_message", type: "TEXT", note: "Commit message/justification" },
      { name: "submitted_by", type: "UUID FK→users" },
      { name: "status", type: "ENUM(pending,validated,applied,rejected)" },
      { name: "delta_patch_id", type: "UUID FK→uks_delta_patches NULLABLE" },
      { name: "created_at", type: "TIMESTAMPTZ" },
    ],
  },
  {
    name: "MaintainerKey",
    table: "uks_maintainer_keys",
    color: "#8AE85A",
    service: "Integrity Service",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "user_id", type: "UUID FK→users" },
      { name: "public_key_pem", type: "TEXT", note: "Ed25519 public key in PEM" },
      { name: "trust_level", type: "ENUM(provisional,trusted,revoked)" },
      { name: "valid_from", type: "TIMESTAMPTZ" },
      { name: "created_at", type: "TIMESTAMPTZ" },
    ],
  },
  {
    name: "PackageDependency",
    table: "uks_package_dependencies",
    color: "#E8C45A",
    service: "Package Registry",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "package_id", type: "UUID FK→uks_packages", note: "The package declaring the dependency" },
      { name: "depends_on_id", type: "UUID FK→uks_packages", note: "The referenced/depended-upon package" },
      { name: "version_constraint", type: "VARCHAR(30)", note: "Semver range e.g. ^2.x, =1.4.0, latest" },
      { name: "ref_alias", type: "VARCHAR(80) NULLABLE", note: "Local alias e.g. 'base-taxonomy' used inside the package" },
      { name: "required", type: "BOOLEAN DEFAULT true" },
    ],
  },
];

const ENDPOINTS = [
  {
    service: "Sync Service",
    color: "#5AB4E8",
    prefix: "/api/mks/sync",
    routes: [
      { method: "GET",  path: "/packages",                  auth: "None",    desc: "List all packages. Filter: domain, visibility, org." },
      { method: "POST", path: "/pull/:slug",                auth: "User+",   desc: "Initiate pull. Body: { version?, text_only? }. Returns session_id." },
      { method: "GET",  path: "/pull/:session_id/stream",   auth: "User+",   desc: "SSE stream of download progress." },
      { method: "POST", path: "/push",                      auth: "Maint+",  desc: "Multipart upload: domain.yaml + .mks bundle. Triggers validation → registry." },
      { method: "POST", path: "/push/dry-run",              auth: "Maint+",  desc: "Validate push without committing. Returns ValidationResult." },
      { method: "POST", path: "/update/:slug",              auth: "User+",   desc: "Apply pending delta patches for a package." },
    ],
  },
  {
    service: "Package Registry",
    color: "#5AE8A0",
    prefix: "/api/mks/registry",
    routes: [
      { method: "GET",    path: "/packages",                auth: "None",    desc: "Search packages. Params: q, domain (legal/medical/tech), visibility, page." },
      { method: "GET",    path: "/packages/:slug/versions", auth: "None",    desc: "All versions with status and size." },
      { method: "GET",    path: "/packages/:slug/manifest", auth: "None",    desc: "Latest manifest.json including chunk_index." },
      { method: "POST",   path: "/packages/:slug/fork",     auth: "User+",   desc: "Fork a package into caller's namespace. Returns new package_id." },
      { method: "POST",   path: "/packages/:slug/deps",     auth: "User+",   desc: "Add a dependency/ref. Body: { depends_on_slug, version_constraint }." },
      { method: "GET",    path: "/core",                    auth: "None",    desc: "List all Official/Core packages (is_core=true)." },
    ],
  },
  {
    service: "Validation Service",
    color: "#E85A8A",
    prefix: "/api/mks/validate",
    routes: [
      { method: "POST", path: "/schema",                    auth: "Maint+",  desc: "Run dynamic schema validation on uploaded JSONL based on domain.yaml." },
      { method: "POST", path: "/encoding",                  auth: "Maint+",  desc: "Check text encoding and language constraints." },
      { method: "POST", path: "/vectors",                   auth: "Maint+",  desc: "Verify vector dimensions match rag_config declaration." },
      { method: "POST", path: "/full",                      auth: "Maint+",  desc: "Run all validation layers. Returns ValidationResult." },
    ],
  },
  {
    service: "Edit API",
    color: "#A85AE8",
    prefix: "/api/mks/edit",
    routes: [
      { method: "POST",   path: "/record",                  auth: "Maint+",  desc: "Edit any record field. Body: { package, record_id, field, value, message }." },
      { method: "POST",   path: "/record/batch",            auth: "Maint+",  desc: "Apply a .jsonl patch file of multiple record edits at once." },
      { method: "POST",   path: "/metadata",                auth: "Maint+",  desc: "Edit package-level metadata: description, version notes." },
      { method: "GET",    path: "/pending",                 auth: "Maint+",  desc: "List caller's pending (not yet applied) edits." },
    ],
  },
];

const CLI_COMMANDS = [
  {
    group: "Auth",
    color: "#E8935A",
    commands: [
      { cmd: "mks auth login", flags: "--totp", desc: "Authenticate. --totp for Maintainer/Admin (MFA required)." },
      { cmd: "mks auth status", flags: "", desc: "Current identity, role, token expiry, rate-limit remaining." },
    ],
  },
  {
    group: "Browse & Info",
    color: "#5AE8A0",
    commands: [
      { cmd: "mks sync list", flags: "--domain legal", desc: "Browse available packages on server. Domains: legal, medical, tech, custom." },
      { cmd: "mks sync info <slug>", flags: "", desc: "Show package details: version, size, record count." },
    ],
  },
  {
    group: "Pull",
    color: "#5AB4E8",
    commands: [
      { cmd: "mks sync pull corp-contracts", flags: "", desc: "Download Corporate Contracts (.mks bundle)." },
      { cmd: "mks sync pull med-guidelines corp-contracts", flags: "", desc: "Pull multiple packages at once." },
      { cmd: "mks sync pull corp-contracts", flags: "--text-only", desc: "Text + metadata only, no vectors (smaller)." },
    ],
  },
  {
    group: "Push",
    color: "#A85AE8",
    commands: [
      { cmd: "mks sync push ./contracts_data/", flags: "--name corp-contracts --domain legal", desc: "Upload a legal corpus from a directory." },
      { cmd: "mks sync push ./react_docs/", flags: "--name react-docs --domain tech", desc: "Upload technical documentation." },
      { cmd: "mks sync push ./data/", flags: "--name test --dry-run", desc: "Validate push without uploading (dry run)." },
    ],
  },
  {
    group: "Incremental Edit",
    color: "#E8D45A",
    commands: [
      { cmd: "mks sync edit corp-contracts", flags: "--record doc_104 --field status --value 'archived' --message 'Update per legal team'", desc: "Edit one field of one record. Only bytes transferred, not the whole collection." },
      { cmd: "mks sync edit corp-contracts", flags: "--patch ./corrections.jsonl --message 'Batch corrections'", desc: "Apply a .jsonl patch file of multiple edits." },
    ],
  },
  {
    group: "Remote (Multi-Instance)",
    color: "#5A7AE8",
    commands: [
      { cmd: "mks sync remote add partner", flags: "https://mks.partner-corp.com", desc: "Register a remote mks instance." },
      { cmd: "mks sync pull --remote partner legal-framework", flags: "", desc: "Pull a package from a partner organization." },
    ],
  },
  {
    group: "Package (Fork & Refs)",
    color: "#E8935A",
    commands: [
      { cmd: "mks pkg list", flags: "--core", desc: "Browse mks official core packages. These are verified knowledge sources." },
      { cmd: "mks pkg fork core/medical-icd10", flags: "--name my-icd10", desc: "Fork the official ICD-10 package into your own namespace." },
      { cmd: "mks pkg ref add my-pkg", flags: "--dep core/base-taxonomy --alias tax", desc: "Declare a dependency on another package. Like adding to package.json." },
    ],
  },
];

const KAFKA_EVENTS = [
  { topic: "mks.package.published", producer: "Package Registry", consumers: ["Subscription Manager", "Changelog Service"], payload: "{ package_id, slug, version, published_by }" },
  { topic: "mks.push.received", producer: "Sync Service", consumers: ["Validation Service", "Changelog Service"], payload: "{ session_id, slug, submitted_by, byte_size }" },
  { topic: "mks.delta.generated", producer: "Delta Engine", consumers: ["Subscription Manager", "Changelog Service"], payload: "{ delta_id, package_id, inserts, updates, deletes }" },
  { topic: "mks.edit.submitted", producer: "Edit API", consumers: ["Delta Engine", "Changelog Service"], payload: "{ edit_id, package_slug, record_id, field_path, submitted_by }" },
  { topic: "mks.integrity.failed", producer: "Integrity Service", consumers: ["Notification Service (Alert)"], payload: "{ upload_id, failure_reason, submitted_by }" },
];

const FILE_STORAGE = {
  packageModel: {
    title: "Package Model — Core, Fork & Refs",
    description: "mks has a two-tier package model. Administrators maintain official 'core' packages. Any user/org can fork them into their own namespace, add their own content, and optionally declare refs (dependencies) to other packages — just like package.json for RAG datasets.",
    tiers: [
      {
        name: "Core Packages",
        color: "#5AE8A0",
        icon: "◈",
        who: "Maintained by Platform Admins",
        examples: ["core/legal-framework", "core/medical-icd10", "core/tech-standards"],
        rules: [
          "is_core = true — read-only for all non-admins",
          "Publicly pullable, no auth required (if configured)",
          "Versioned, signed, and integrity-checked",
          "Anyone can fork them but cannot push to the original",
        ],
      },
      {
        name: "User / Org Packages",
        color: "#E8935A",
        icon: "⬡",
        who: "Created or forked by any registered user/org",
        examples: ["acme-corp/internal-docs", "legal-team/corp-contracts"],
        rules: [
          "Fully independent after fork — changes never touch the source",
          "Can be public (others can pull/fork) or private",
          "Owner can push, edit, and manage versions freely",
          "Slug format: owner/package-name",
        ],
      },
    ],
    flow: [
      { step: "1. Browse core packages", cmd: "mks pkg list --core", desc: "See all official packages" },
      { step: "2. Fork into your namespace", cmd: "mks pkg fork core/legal-framework --name my-framework", desc: "Creates your own independent copy" },
      { step: "3. Add your content", cmd: "mks sync push ./my-docs/ --name my-framework", desc: "Push extra records into your fork" },
      { step: "4. Add refs (dependencies)", cmd: "mks pkg ref add my-framework --dep core/base-taxonomy", desc: "Declare what your package builds on" },
    ],
    deps: {
      title: "Package Refs (Dependencies)",
      description: "Like package.json — a package can declare other packages it builds on. When someone pulls your package, they can also resolve your refs to get the full picture.",
      example: `// my-framework/manifest.json
{
  "slug": "acme-corp/my-framework",
  "forked_from": "core/legal-framework@1.2.0",
  "refs": [
    { "alias": "taxonomy", "package": "core/base-taxonomy", "constraint": "^2.x" },
    { "alias": "hr-policies",  "package": "hr-team/policies", "constraint": "latest" }
  ]
}`,
    },
  },
  analogy: {
    title: "mks is Git + HuggingFace, but for RAG",
    description: "Just like GitHub stores code repositories with versioning, branching, and collaboration — mks stores Retrieval-Augmented Generation datasets (.mks bundles) with domain validation, delta patching, and distributed syncing.",
    comparison: [
      { github: "Repository (.git folder)", mks: "Knowledge Package (.mks bundle)", color: "#5AB4E8" },
      { github: "git commit", mks: "mks sync push / edit", color: "#5AE8A0" },
      { github: "git pull / git fetch", mks: "mks sync pull / update", color: "#E8D45A" },
      { github: "git diff (patch file)", mks: ".mks-delta binary (zstd patch)", color: "#A85AE8" },
      { github: "npm publish", mks: "Package Registry (browse & subscribe)", color: "#E8C45A" },
    ],
  },
  bundleFormat: {
    title: ".mks Bundle — Configuration-Driven Storage",
    description: "A .mks file is a zstd-compressed archive. The structure is domain-agnostic, governed entirely by the domain.yaml configuration file you provide when pushing.",
    types: [
      {
        type: "The Generic RAG Bundle Structure",
        color: "#5AB4E8",
        icon: "📦",
        layout: [
          { path: "domain.yaml", desc: "Defines primary keys, vector dimensions, schemas, and chunking strategy." },
          { path: "manifest.json", desc: "Auto-generated: package name, version, record counts, sha256 checksums." },
          { path: "records/*.jsonl.zst", desc: "Compressed raw data (e.g., {contract_id, clause_text, metadata})." },
          { path: "vectors/*.npy.zst", desc: "Float32 embedding matrices (generated based on rag_config in domain.yaml)." },
          { path: "metadata/*.jsonl.zst", desc: "Auxiliary data, taxonomies, or knowledge graphs." },
          { path: "changelog.json", desc: "Append-only history of every correction made to this package." },
        ],
      },
      {
        type: "Example Config: domain.yaml",
        color: "#5AE8A0",
        icon: "⚙️",
        layout: [
          { path: "schema:", desc: "record_type: 'legal_doc', primary_key: 'contract_id', text_field: 'clause_text'" },
          { path: "rag_config:", desc: "embedding_model: 'text-embedding-3', vector_dims: 1536, distance_metric: 'cosine'" },
          { path: "validation:", desc: "language: 'en', custom_regex: { contract_id: '^[A-Z]{3}-\\d{4}$' }" },
        ],
      }
    ],
  },
  storageFlow: {
    title: "How a Package Flows Through the System",
    steps: [
      { step: "1. User pushes data", detail: "mks sync push ./data/ --domain legal --name corp-contracts", color: "#E8935A", icon: "⬆" },
      { step: "2. Dynamic Validation", detail: "Validation Service reads domain.yaml: checks schema, text encoding, vector dimensions → issues attestation", color: "#E85A8A", icon: "✦" },
      { step: "3. Compression Engine", detail: "Builds .mks bundle: JSONL → .jsonl.zst (6:1), NPY → .npy.zst (2.2:1)", color: "#A85AE8", icon: "◉" },
      { step: "4. MinIO/S3 Storage", detail: "Bundle stored at: packages/{slug}/v{version}/{slug}-v{version}.mks", color: "#5AB4E8", icon: "▦" },
      { step: "5. Package Registry", detail: "Creates PackageVersion record, generates chunk indexes for resumable downloads", color: "#5AE8A0", icon: "◈" },
    ],
  },
  deltaFlow: {
    title: "How a Delta (Incremental Edit) Works — Like git diff",
    steps: [
      { step: "Maintainer edits one record", detail: "mks sync edit corp-contracts --record doc_104 --field status --value 'archived'", color: "#E8D45A" },
      { step: "Delta Engine diffs versions", detail: "Produces a typed INSERT/UPDATE/DELETE patch — zstd compressed (~200 bytes)", color: "#E8D45A" },
      { step: "Subscribers pull the delta", detail: "mks sync update corp-contracts — client downloads only the .mks-delta (50 KB vs full repo)", color: "#5AE8A0" },
      { step: "Delta applied to Qdrant", detail: "DeltaApplyService atomically patches the vector collection — rolled back on failure", color: "#A85AE8" },
    ],
  },
  storageInfra: {
    title: "Storage Infrastructure",
    layers: [
      { name: "MinIO / S3", role: "Raw file storage", detail: "All .mks bundles and .mks-delta patches live here. Object storage — cheap, scalable, supports Range requests.", color: "#5AB4E8", icon: "▦" },
      { name: "PostgreSQL", role: "Metadata & audit", detail: "All structured metadata: package records, versions, schemas, subscriptions. Never stores the raw blobs.", color: "#5AE8A0", icon: "⊡" },
      { name: "Qdrant", role: "Vector search index", detail: "Live semantic search index. Stores float32 embeddings per record. Updated atomically via deltas.", color: "#E8D45A", icon: "◈" },
      { name: "Redis", role: "Rate limiting & cache", detail: "Sliding-window rate limit counters. Package manifest cache.", color: "#E85A8A", icon: "⬡" },
      { name: "Kafka", role: "Event bus", detail: "Async decoupling between services. Every push, edit, and sync emits a Kafka event.", color: "#A85AE8", icon: "⇄" },
    ],
  },
};

const CLI_BUILD = {
  overview: `The mks CLI is a native Go binary that communicates with the mks API Gateway over HTTPS. Go compiles to a single self-contained executable — no JVM, no installation required.`,
  steps: [
    {
      title: "1. Project structure",
      color: "#E8935A",
      code: `mks-cli/
├── cmd/
│   ├── main.go               # Entry: cobra root command
│   ├── auth.go               # mks auth login / status
│   ├── sync_pull.go          # mks sync pull
│   ├── sync_push.go          # mks sync push
│   ├── sync_edit.go          # mks sync edit
│   └── admin.go              # mks admin commands
├── internal/
│   ├── api/                  # HTTP client, streaming SSE
│   ├── config/               # ~/.mks/config.toml
│   └── compress/             # Local zstd decompression
├── go.mod
└── .goreleaser.yaml          # Cross-platform release config`,
    },
    {
      title: "2. Cross-platform release with GoReleaser",
      color: "#5A7AE8",
      code: `# .goreleaser.yaml
project_name: mks
builds:
  - id: mks
    main: ./cmd/main.go
    binary: mks
    goos:   [linux, darwin, windows]
    goarch: [amd64, arm64]
    ldflags:
      - -s -w  # strip debug symbols`,
    },
  ],
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

const METHOD_STYLE = {
  GET:    { bg: "#0d3520", fg: "#4ade80" },
  POST:   { bg: "#0d1e3d", fg: "#60a5fa" },
  PATCH:  { bg: "#2d2100", fg: "#fbbf24" },
  DELETE: { bg: "#3d0d0d", fg: "#f87171" },
};

function MethodBadge({ method }) {
  const s = METHOD_STYLE[method] || { bg: "#222", fg: "#aaa" };
  return (
    <span style={{ background: s.bg, color: s.fg, fontSize: 9, fontWeight: 700, fontFamily: "monospace", padding: "2px 7px", borderRadius: 3, letterSpacing: 1, flexShrink: 0 }}>{method}</span>
  );
}

function AuthBadge({ auth }) {
  const fg = auth === "None" ? "#555" : auth === "Admin" ? "#f87171" : auth === "Maint+" ? "#c084fc" : "#60a5fa";
  return (
    <span style={{ color: fg, fontSize: 10, fontFamily: "monospace", flexShrink: 0, opacity: 0.9 }}>{auth}</span>
  );
}

function SectionLabel({ text, color }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color, marginBottom: 12 }}>{text}</div>
  );
}

function Tab({ label, active, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 16px", borderRadius: 5, border: active ? `1px solid ${color}50` : "1px solid transparent",
      background: active ? `${color}18` : "transparent", color: active ? color : "#555",
      fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.12s",
    }}>{label}</button>
  );
}

// ─── VIEWS ───────────────────────────────────────────────────────────────────

function OverviewView() {
  return (
    <div>
      <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "18px 22px", marginBottom: 22 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#aaa", lineHeight: 1.85 }}>
          <span style={{ color: "#f0f0f0", fontWeight: 700 }}>mks</span> is a generalized infrastructure platform for synchronizing Retrieval-Augmented Generation (RAG) datasets. It acts as an app-store/Git hybrid for knowledge packages (e.g., corporate contracts, medical guidelines, technical docs). Administrators maintain official <span style={{ color: "#5AE8A0", fontFamily: "monospace" }}>core</span> packages. Users can fork any package, add content, and declare dependencies on other datasets. Schemas, embedding models, and chunking strategies are fully dynamic, controlled by a <span style={{ color: "#E8D45A", fontFamily: "monospace" }}>domain.yaml</span> file inside each package.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 22 }}>
        {[
          { label: "Microservices", value: "11", sub: "All Spring Boot 3 Java", color: "#5AB4E8" },
          { label: "Data Entities", value: "6+", sub: "PostgreSQL + MinIO", color: "#5AE8A0" },
          { label: "API Endpoints", value: "20+", sub: "Across all services", color: "#E8D45A" },
          { label: "Kafka Topics", value: "5+", sub: "Async event bus", color: "#A85AE8" },
          { label: "CLI Commands", value: "15+", sub: "Go binary, cross-platform", color: "#E8935A" },
          { label: "Package format", value: ".mks", sub: "zstd-compressed bundle", color: "#5AE8D4" },
        ].map(m => (
          <div key={m.label} style={{ background: "#111", border: `1px solid ${m.color}25`, borderRadius: 8, padding: "14px 16px" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: m.color, fontFamily: "monospace" }}>{m.value}</div>
            <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{m.label}</div>
            <div style={{ fontSize: 10, color: "#555", marginTop: 3, fontFamily: "monospace" }}>{m.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[
          { title: "Mishkat .mks package format", color: "#5AE8A0", lines: [
            "domain.yaml — schemas, vectors, chunking rules",
            "manifest.json — name, version, checksum",
            "records/*.jsonl.zst — raw data chunks",
            "vectors/*.npy.zst — embedding vectors",
            "changelog.json — full change history",
          ]},
          { title: "Delta transfer sizes", color: "#E8D45A", lines: [
            "Edit 1 record field → ~200 bytes transferred",
            "Add 100 new documents → ~50 KB (vs 6 MB full pull)",
            "Typical daily sync → under 1 MB",
            "Compression ratio: text 6:1, vectors 2.2:1",
          ]},
          { title: "Why Spring Boot (not Go) for services", color: "#A85AE8", lines: [
            "Spring Batch for ETL ingestion pipelines",
            "Spring Scheduling for auto-sync daemon (@Scheduled)",
            "Spring Cloud Gateway for routing + rate limiting",
            "Rich ecosystem: Kafka, Testcontainers, JPA",
          ]},
          { title: "Why Go for the CLI", color: "#E8935A", lines: [
            "Compiles to single self-contained binary",
            "No JVM, no classpath, no installation steps",
            "Cross-compile to linux/mac/windows in one build",
            "Sub-millisecond startup (JVM takes 300ms+)",
          ]},
        ].map(b => (
          <div key={b.title} style={{ background: "#111", border: `1px solid ${b.color}25`, borderRadius: 8, padding: 16 }}>
            <SectionLabel text={b.title} color={b.color} />
            {b.lines.map((l, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                <span style={{ color: b.color, flexShrink: 0 }}>›</span>
                <span style={{ fontSize: 12, color: "#999", lineHeight: 1.6, fontFamily: "monospace" }}>{l}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ServicesView() {
  const [sel, setSel] = useState("sync");
  const svc = SERVICES.find(s => s.id === sel);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 16, minHeight: 550 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {SERVICES.map(s => (
          <button key={s.id} onClick={() => setSel(s.id)} style={{
            padding: "9px 12px", borderRadius: 7, cursor: "pointer", textAlign: "left",
            border: `1px solid ${sel === s.id ? s.color : "#1e1e1e"}`,
            background: sel === s.id ? `${s.color}14` : "#0d0d0d",
            color: sel === s.id ? s.color : "#777", fontSize: 12, fontWeight: 500,
            transition: "all 0.12s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ fontSize: 14 }}>{s.icon}</span> {s.label}
            </div>
            <div style={{ fontSize: 10, color: "#444", marginTop: 3, fontFamily: "monospace" }}>:{s.port || "infra"}</div>
          </button>
        ))}
      </div>
      <div style={{ background: "#0d0d0d", border: `1px solid ${svc.color}30`, borderRadius: 10, padding: 22 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ width: 40, height: 40, borderRadius: 9, background: `${svc.color}18`, border: `1px solid ${svc.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: svc.color, flexShrink: 0 }}>{svc.icon}</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#f0f0f0" }}>{svc.label}</div>
            <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", marginTop: 2 }}>{svc.tech} · port {svc.port || "infra"}</div>
          </div>
        </div>
        <p style={{ fontSize: 13, color: "#999", marginBottom: 18, lineHeight: 1.7 }}>{svc.short}</p>
        <SectionLabel text="Responsibilities" color={svc.color} />
        {svc.responsibilities.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
            <span style={{ color: svc.color, flexShrink: 0, marginTop: 2 }}>›</span>
            <span style={{ fontSize: 12, color: "#c0c0c0", lineHeight: 1.65 }}>{r}</span>
          </div>
        ))}
        {svc.deps && (
          <>
            <div style={{ marginTop: 16, marginBottom: 8 }}>
              <SectionLabel text="Dependencies" color={svc.color} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {svc.deps.map(d => (
                <span key={d} style={{ fontSize: 10, color: "#888", background: "#161616", border: "1px solid #222", padding: "3px 10px", borderRadius: 4, fontFamily: "monospace" }}>{d}</span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EntitiesView() {
  const [sel, setSel] = useState("KnowledgePackage");
  const entity = ENTITIES.find(e => e.name === sel);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "190px 1fr", gap: 16, minHeight: 550 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, overflowY: "auto" }}>
        {ENTITIES.map(e => (
          <button key={e.name} onClick={() => setSel(e.name)} style={{
            padding: "8px 12px", borderRadius: 6, cursor: "pointer", textAlign: "left",
            border: `1px solid ${sel === e.name ? e.color : "#1a1a1a"}`,
            background: sel === e.name ? `${e.color}12` : "#0d0d0d",
            color: sel === e.name ? e.color : "#777", fontSize: 11, fontWeight: 500, transition: "all 0.12s",
          }}>
            <div>{e.name}</div>
            <div style={{ fontSize: 9, color: "#3a3a3a", marginTop: 2, fontFamily: "monospace" }}>{e.service}</div>
          </button>
        ))}
      </div>
      <div style={{ background: "#0d0d0d", border: `1px solid ${entity.color}30`, borderRadius: 10, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #161616", background: `${entity.color}0d` }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0" }}>{entity.name}</div>
          <div style={{ fontSize: 10, fontFamily: "monospace", color: entity.color, marginTop: 2 }}>{entity.table} · {entity.service}</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: "#111" }}>
                {["Column", "Type / Constraint", "Notes"].map(h => (
                  <th key={h} style={{ padding: "7px 14px", textAlign: "left", color: "#444", fontWeight: 700, fontSize: 9, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entity.fields.map((f, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #161616", background: i % 2 ? "#0a0a0a" : "transparent" }}>
                  <td style={{ padding: "7px 14px", fontFamily: "monospace", color: entity.color, fontWeight: 700, fontSize: 11 }}>{f.name}</td>
                  <td style={{ padding: "7px 14px", fontFamily: "monospace", color: "#777", fontSize: 10 }}>{f.type}</td>
                  <td style={{ padding: "7px 14px", color: "#666", fontSize: 11 }}>{f.note || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EndpointsView() {
  const [sel, setSel] = useState("Sync Service");
  const grp = ENDPOINTS.find(e => e.service === sel);
  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
        {ENDPOINTS.map(e => (
          <button key={e.service} onClick={() => setSel(e.service)} style={{
            padding: "5px 12px", borderRadius: 5,
            border: `1px solid ${sel === e.service ? e.color : "#1e1e1e"}`,
            background: sel === e.service ? `${e.color}16` : "#0d0d0d",
            color: sel === e.service ? e.color : "#666", fontSize: 11, fontWeight: 500,
            cursor: "pointer", transition: "all 0.12s",
          }}>{e.service}</button>
        ))}
      </div>
      <div style={{ fontSize: 10, color: "#444", fontFamily: "monospace", marginBottom: 12 }}>Base prefix: {grp.prefix}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {grp.routes.map((r, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px", background: "#0d0d0d", border: "1px solid #161616", borderRadius: 7 }}>
            <MethodBadge method={r.method} />
            <code style={{ fontSize: 11, color: "#e0e0e0", fontFamily: "monospace", flexShrink: 0, lineHeight: 1.5 }}>{r.path}</code>
            <AuthBadge auth={r.auth} />
            <span style={{ fontSize: 11, color: "#888", lineHeight: 1.5, flex: 1 }}>{r.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CLIView() {
  const [tab, setTab] = useState("commands");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        <Tab label="Commands" active={tab === "commands"} color="#E8935A" onClick={() => setTab("commands")} />
        <Tab label="How to build the .exe" active={tab === "build"} color="#5AB4E8" onClick={() => setTab("build")} />
      </div>

      {tab === "commands" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {CLI_COMMANDS.map(grp => (
            <div key={grp.group}>
              <SectionLabel text={grp.group} color={grp.color} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {grp.commands.map((c, i) => (
                  <div key={i} style={{ background: "#0d0d0d", border: "1px solid #161616", borderRadius: 7, padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap", marginBottom: 4 }}>
                      <code style={{ fontSize: 12, color: grp.color, fontFamily: "monospace", fontWeight: 700 }}>{c.cmd}</code>
                      {c.flags && <code style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>{c.flags}</code>}
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#777", lineHeight: 1.6 }}>{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "build" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 8, padding: "14px 18px", marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#aaa", lineHeight: 1.8 }}>{CLI_BUILD.overview}</p>
          </div>
          {CLI_BUILD.steps.map((s, i) => (
            <div key={i} style={{ background: "#0d0d0d", border: `1px solid ${s.color}25`, borderRadius: 8, overflow: "hidden", marginBottom: 6 }}>
              <div style={{ padding: "10px 16px", background: `${s.color}0d`, borderBottom: `1px solid ${s.color}20` }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.title}</span>
              </div>
              <pre style={{ margin: 0, padding: "14px 16px", fontSize: 11, color: "#c0c0c0", fontFamily: "monospace", overflowX: "auto", lineHeight: 1.65, whiteSpace: "pre" }}>{s.code}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KafkaView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {KAFKA_EVENTS.map((ev, i) => (
        <div key={i} style={{ background: "#0d0d0d", border: "1px solid #161616", borderRadius: 8, padding: "12px 16px" }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 5 }}>
            <code style={{ fontSize: 11, color: "#60a5fa", fontFamily: "monospace", fontWeight: 700 }}>{ev.topic}</code>
            <span style={{ fontSize: 10, color: "#555" }}>←</span>
            <span style={{ fontSize: 10, color: "#e0c97f", background: "#1e1800", padding: "2px 7px", borderRadius: 4, fontFamily: "monospace" }}>{ev.producer}</span>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: "#444" }}>consumers:</span>
            {ev.consumers.map(c => (
              <span key={c} style={{ fontSize: 10, color: "#999", background: "#161616", padding: "1px 7px", borderRadius: 4, fontFamily: "monospace" }}>{c}</span>
            ))}
          </div>
          <code style={{ fontSize: 10, color: "#666", fontFamily: "monospace" }}>{ev.payload}</code>
        </div>
      ))}
    </div>
  );
}

function FileStorageView() {
  const [section, setSection] = useState("pkgmodel");
  const sections = [
    { id: "pkgmodel",  label: "Package Model",       color: "#5AE8A0" },
    { id: "analogy",   label: "mks vs GitHub",       color: "#5AB4E8" },
    { id: "bundles",   label: ".mks Bundle Format",  color: "#5AE8A0" },
    { id: "pushflow",  label: "Push → Storage Flow", color: "#E8935A" },
    { id: "delta",     label: "Delta (Edit) Flow",   color: "#E8D45A" },
    { id: "infra",     label: "Storage Layers",      color: "#A85AE8" },
  ];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
        {sections.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            padding: "5px 13px", borderRadius: 5, fontSize: 11, fontWeight: 500, cursor: "pointer",
            border: `1px solid ${section === s.id ? s.color : "#1e1e1e"}`,
            background: section === s.id ? `${s.color}16` : "#0d0d0d",
            color: section === s.id ? s.color : "#666", transition: "all 0.12s",
          }}>{s.label}</button>
        ))}
      </div>

      {section === "pkgmodel" && (
        <div>
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "16px 20px", marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", marginBottom: 6 }}>{FILE_STORAGE.packageModel.title}</div>
            <p style={{ margin: 0, fontSize: 12, color: "#888", lineHeight: 1.8 }}>{FILE_STORAGE.packageModel.description}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
            {FILE_STORAGE.packageModel.tiers.map((tier, i) => (
              <div key={i} style={{ background: "#0d0d0d", border: `1px solid ${tier.color}30`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", background: `${tier.color}0d`, borderBottom: `1px solid ${tier.color}20`, display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 16, color: tier.color }}>{tier.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: tier.color }}>{tier.name}</div>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 1 }}>{tier.who}</div>
                  </div>
                </div>
                <div style={{ padding: "12px 16px" }}>
                  <div style={{ marginBottom: 8 }}>
                    {tier.examples.map((ex, j) => (
                      <code key={j} style={{ display: "block", fontSize: 10, color: tier.color, fontFamily: "monospace", marginBottom: 3 }}>{ex}</code>
                    ))}
                  </div>
                  {tier.rules.map((r, j) => (
                    <div key={j} style={{ display: "flex", gap: 7, marginBottom: 5 }}>
                      <span style={{ color: tier.color, flexShrink: 0 }}>›</span>
                      <span style={{ fontSize: 11, color: "#888", lineHeight: 1.6 }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "14px 18px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#E8935A", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Fork & Build Flow</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {FILE_STORAGE.packageModel.flow.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 12px", background: "#0d0d0d", borderRadius: 7 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: "#E8935A18", border: "1px solid #E8935A40", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#E8935A", flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#ccc", marginBottom: 2 }}>{f.step}</div>
                    <code style={{ fontSize: 10, color: "#5AE8A0", fontFamily: "monospace", display: "block", marginBottom: 2 }}>{f.cmd}</code>
                    <span style={{ fontSize: 10, color: "#666" }}>{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#111", border: "1px solid #E8C45A25", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#E8C45A", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{FILE_STORAGE.packageModel.deps.title}</div>
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 12px", lineHeight: 1.7 }}>{FILE_STORAGE.packageModel.deps.description}</p>
            <pre style={{ margin: 0, background: "#0d0d0d", border: "1px solid #1e1e1e", borderRadius: 7, padding: "14px 16px", fontSize: 11, color: "#c0c0c0", fontFamily: "monospace", lineHeight: 1.7, overflowX: "auto", whiteSpace: "pre" }}>{FILE_STORAGE.packageModel.deps.example}</pre>
          </div>
        </div>
      )}

      {section === "analogy" && (
        <div>
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "16px 20px", marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", marginBottom: 6 }}>{FILE_STORAGE.analogy.title}</div>
            <p style={{ margin: 0, fontSize: 12, color: "#888", lineHeight: 1.8 }}>{FILE_STORAGE.analogy.description}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 6 }}>
              <div style={{ padding: "7px 14px", background: "#111", borderRadius: 6, fontSize: 10, fontWeight: 700, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>GitHub / Git</div>
              <div style={{ padding: "7px 14px", background: "#111", borderRadius: 6, fontSize: 10, fontWeight: 700, color: "#555", letterSpacing: 1, textTransform: "uppercase" }}>mks Equivalent</div>
            </div>
            {FILE_STORAGE.analogy.comparison.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                <div style={{ padding: "9px 14px", background: "#0d0d0d", border: "1px solid #161616", borderRadius: 6, fontSize: 11, color: "#bbb", fontFamily: "monospace" }}>{row.github}</div>
                <div style={{ padding: "9px 14px", background: "#0d0d0d", border: `1px solid ${row.color}30`, borderRadius: 6, fontSize: 11, color: row.color, fontFamily: "monospace" }}>{row.mks}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === "bundles" && (
        <div>
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "16px 20px", marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", marginBottom: 6 }}>{FILE_STORAGE.bundleFormat.title}</div>
            <p style={{ margin: 0, fontSize: 12, color: "#888", lineHeight: 1.8 }}>{FILE_STORAGE.bundleFormat.description}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {FILE_STORAGE.bundleFormat.types.map((t, i) => (
              <div key={i} style={{ background: "#0d0d0d", border: `1px solid ${t.color}30`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", background: `${t.color}0d`, borderBottom: `1px solid ${t.color}20`, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{t.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: t.color }}>{t.type}</span>
                </div>
                <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {t.layout.map((f, j) => (
                    <div key={j} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <code style={{ fontSize: 10, color: t.color, fontFamily: "monospace", flexShrink: 0, minWidth: 270, lineHeight: 1.7 }}>{f.path}</code>
                      <span style={{ fontSize: 11, color: "#777", lineHeight: 1.7 }}>{f.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === "pushflow" && (
        <div>
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "16px 20px", marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", marginBottom: 6 }}>{FILE_STORAGE.storageFlow.title}</div>
            <p style={{ margin: 0, fontSize: 12, color: "#888", lineHeight: 1.8 }}>Follow the journey of a push from the CLI all the way to MinIO and subscriber notification.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FILE_STORAGE.storageFlow.steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "12px 16px", background: "#0d0d0d", border: `1px solid ${s.color}25`, borderRadius: 8, alignItems: "flex-start" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}18`, border: `1px solid ${s.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: s.color, flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.step}</div>
                  <code style={{ fontSize: 11, color: "#888", fontFamily: "monospace", lineHeight: 1.7 }}>{s.detail}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === "delta" && (
        <div>
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "16px 20px", marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", marginBottom: 6 }}>{FILE_STORAGE.deltaFlow.title}</div>
            <p style={{ margin: 0, fontSize: 12, color: "#888", lineHeight: 1.8 }}>Instead of re-downloading huge datsets every time, mks transfers only the changed bytes — exactly like git push / git pull with patches.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {FILE_STORAGE.deltaFlow.steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "12px 16px", background: "#0d0d0d", border: `1px solid ${s.color}25`, borderRadius: 8, alignItems: "flex-start" }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: `${s.color}18`, border: `1px solid ${s.color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: s.color, flexShrink: 0 }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.step}</div>
                  <span style={{ fontSize: 11, color: "#888", lineHeight: 1.7 }}>{s.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {section === "infra" && (
        <div>
          <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 10, padding: "16px 20px", marginBottom: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0", marginBottom: 6 }}>{FILE_STORAGE.storageInfra.title}</div>
            <p style={{ margin: 0, fontSize: 12, color: "#888", lineHeight: 1.8 }}>Five distinct storage technologies — each used for what it does best. No single database does everything.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FILE_STORAGE.storageInfra.layers.map((l, i) => (
              <div key={i} style={{ background: "#0d0d0d", border: `1px solid ${l.color}30`, borderRadius: 10, overflow: "hidden" }}>
                <div style={{ padding: "10px 18px", background: `${l.color}0d`, borderBottom: `1px solid ${l.color}20`, display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: 18, color: l.color }}>{l.icon}</span>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: l.color }}>{l.name}</span>
                    <span style={{ fontSize: 10, color: "#555", marginLeft: 10, fontFamily: "monospace" }}>{l.role}</span>
                  </div>
                </div>
                <div style={{ padding: "12px 18px" }}>
                  <p style={{ margin: 0, fontSize: 12, color: "#999", lineHeight: 1.8 }}>{l.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: "overview",   label: "Overview",             color: "#E8935A" },
  { id: "services",   label: "Microservices",        color: "#5AB4E8" },
  { id: "entities",   label: "Data Entities",        color: "#5AE8A0" },
  { id: "storage",    label: "File Storage & Config", color: "#E8C45A" },
  { id: "endpoints",  label: "API Endpoints",        color: "#E8D45A" },
  { id: "cli",        label: "CLI + .exe Build",     color: "#A85AE8" },
  { id: "kafka",      label: "Kafka Events",         color: "#5A7AE8" },
];

export default function MKS() {
  const [tab, setTab] = useState("overview");

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#e0e0e0", fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" }}>
      <div style={{ borderBottom: "1px solid #161616", padding: "18px 28px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: "#111", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⇄</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0", letterSpacing: -0.3 }}>Mishkat Knowledge Sync (mks)</div>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginTop: 1 }}>Architecture Reference · Spring Boot · Generalized Domain Data</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["11 services", "6+ entities", "20+ endpoints", "Kafka topics", "Go CLI", "Domain Config"].map(b => (
              <span key={b} style={{ fontSize: 10, color: "#555", background: "#111", border: "1px solid #1e1e1e", padding: "3px 9px", borderRadius: 3, fontFamily: "monospace" }}>{b}</span>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 2, overflowX: "auto" }}>
          {TABS.map(t => <Tab key={t.id} label={t.label} active={tab === t.id} color={t.color} onClick={() => setTab(t.id)} />)}
        </div>
      </div>
      <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>
        {tab === "overview"   && <OverviewView />}
        {tab === "services"   && <ServicesView />}
        {tab === "entities"   && <EntitiesView />}
        {tab === "storage"    && <FileStorageView />}
        {tab === "endpoints"  && <EndpointsView />}
        {tab === "cli"        && <CLIView />}
        {tab === "kafka"      && <KafkaView />}
      </div>
    </div>
  );
}