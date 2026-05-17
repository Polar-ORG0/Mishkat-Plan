import { useState } from "react";

// ─── ALL DATA ─────────────────────────────────────────────────────────────────

const SERVICES = [
  {
    id: "gateway",
    label: "API Gateway",
    icon: "⬡",
    color: "#E8935A",
    port: 8080,
    tech: "Spring Boot 3 + Spring Cloud Gateway",
    short: "Single entry point. JWT auth, rate limiting, routing to all MKS services.",
    responsibilities: [
      "Routes all /api/mks/** requests to downstream Spring Boot services",
      "JWT RS256 validation — injects X-User-Id, X-User-Role, X-Tenant-Id headers",
      "Sliding-window rate limiting per tier: Guest 100/hr, Scholar 2000/hr (Redis backed)",
      "Request sanitization middleware: strips dangerous inputs, validates Content-Type",
      "Health aggregation endpoint merging status from all downstream services",
      "CORS configuration locked to mishkat.app and sub-domain origins",
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
      "PushService: validates uploaded data, calls Compression Engine, stores in MinIO",
      "DeltaSyncService: applies incremental edits to live Qdrant collection via RAG Engine",
      "RemoteSyncService: manages federation with other Mishkat instances",
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
      "Generates manifest.json per version: hadith count, checksum, file index",
      "Manages package visibility: public (global), org-private, deprecated",
      "Spring Batch job to re-index all packages when embedding model changes",
      "Package search: filter by type (hadith, tafsir, sharh, rijal), language, size",
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
      "Stores delta binary in MinIO; records metadata in PostgreSQL (mks_delta_patches table)",
      "Publishes mks.delta.generated Kafka event after successful generation",
      "Delta compression: patches are zstd-compressed before storage (~200 bytes per single hadith edit)",
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
      "PackageBuilder: assembles .mks bundle from raw hadith JSONL + vector NPY + metadata",
      "Compresses hadiths/ directory: Arabic JSONL → .jsonl.zst (6:1 ratio)",
      "Compresses vectors/ directory: float32 NPY → .npy.zst (2.2:1 ratio)",
      "Compresses metadata/ directory: narrator + grading JSONL (5:1 ratio)",
      "Decompression endpoint: extracts a received .mks for import into local Qdrant",
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
    tech: "Spring Boot 3 + Spring Validation + Custom Arabic NLP",
    short: "Three-layer validation: schema conformance, Arabic text integrity, vector dimension check.",
    responsibilities: [
      "SchemaValidator: verifies pushed JSONL against required fields (hadith_id, text_ar, chain, grade)",
      "ArabicValidator: checks text_ar is valid Unicode Arabic, detects encoding corruption, verifies RTL markers",
      "VectorValidator: confirms embedding dimensions match declared model (1024 for BGE-M3)",
      "DuplicateValidator: cross-checks new hadiths against existing collection to flag duplicates",
      "ContentSafetyValidator: scans for prohibited content patterns and PII",
      "Issues signed ValidationResult token that Sync Service requires before any push proceeds",
      "Logs all validation failures with reason to audit table",
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
      "Snapshot tagging: pin current state with a label (e.g. 'Before adding Nasa'i')",
      "Retention policy: configurable max snapshots, auto-pruning of oldest",
    ],
    deps: ["PostgreSQL", "MinIO/S3", "Sync Service (coordinates rollback with Delta Engine)"],
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
      "ChangelogEntry written per event: collection, operation, author, old_value, new_value, message, timestamp",
      "Full search: filter by collection, author, operation type, date range",
      "Single change detail: show complete before/after diff for any change ID",
      "Export changelog as JSON or CSV for academic publication audit trails",
      "Feeds the msk sync log command and Web UI history view",
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
    short: "Manages federation with other Mishkat instances: register remotes, push/pull cross-instance, auto-sync.",
    responsibilities: [
      "RemoteRegistry: CRUD for registered remote Mishkat instances (name, URL, API key, trust level)",
      "CrossInstancePull: authenticates to remote, fetches package manifest, streams .mks to local",
      "CrossInstancePush: authenticates to remote, pushes local packages or corrections upstream",
      "AutoSyncDaemon: @Scheduled task, polls all active remotes at configured interval (e.g. 6h)",
      "Conflict resolution: timestamp-wins strategy for simultaneous edits to same hadith from two instances",
      "Connectivity health check: periodic ping to all registered remotes, alerts on failure",
      "Audit log for every cross-instance operation including remote identity verification",
    ],
    deps: ["PostgreSQL", "Sync Service", "Kafka", "Notification Service"],
  },
  {
    id: "integrity",
    label: "Integrity Service",
    icon: "⬟",
    color: "#8AE85A",
    port: 8089,
    tech: "Spring Boot 3 + Spring Security Crypto",
    short: "SHA-256 checksum verification, Ed25519 signature on delta patches, schema conformance.",
    responsibilities: [
      "Verifies SHA-256 of uploaded .mks bundle against manifest.json checksum declaration",
      "Validates Ed25519 signatures on approved delta patches against trusted ScholarKey registry",
      "Issues signed IntegrityAttestation token (JWT) that Registry and Delta Engine require",
      "Detects tampered packages: any byte-level mismatch triggers rejection and alert",
      "Publishes mks.integrity.failed Kafka event with failure reason for alerting pipeline",
      "ScholarKey trust management: provisional → trusted → revoked lifecycle",
    ],
    deps: ["PostgreSQL (ScholarKey, AttestatIon tables)", "Kafka"],
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
      "Version pinning: institution can lock to v2.3.x and skip v3.x entirely",
      "License enforcement: org-private packages require valid LicenseKey record",
      "SyncSessionTracker: records in-progress sync sessions with progress and rollback state",
      "Push notification events to Notification Service when subscriber falls 5+ deltas behind",
    ],
    deps: ["PostgreSQL", "Kafka", "Notification Service"],
  },
];

const ENTITIES = [
  {
    name: "KnowledgePackage",
    table: "mks_packages",
    color: "#5AE8A0",
    service: "Package Registry",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "slug", type: "VARCHAR(80) UNIQUE", note: "e.g. bukhari, tafsir_ibn_kathir" },
      { name: "display_name_ar", type: "VARCHAR(200)", note: "Arabic display name" },
      { name: "display_name_en", type: "VARCHAR(200)" },
      { name: "type", type: "ENUM(hadith,tafsir,sharh,rijal,compiled)", note: "" },
      { name: "description", type: "TEXT" },
      { name: "owner_org_id", type: "UUID FK→orgs NULLABLE", note: "NULL = global/public" },
      { name: "latest_version", type: "VARCHAR(20)", note: "Semver e.g. 3.2.0" },
      { name: "total_records", type: "INT" },
      { name: "visibility", type: "ENUM(public,org_private,deprecated)" },
      { name: "vector_collection", type: "VARCHAR(100)", note: "Qdrant collection name" },
      { name: "supported_langs", type: "VARCHAR[]", note: "e.g. [ar, en, ur]" },
      { name: "created_at", type: "TIMESTAMPTZ" },
      { name: "updated_at", type: "TIMESTAMPTZ" },
    ],
  },
  {
    name: "PackageVersion",
    table: "mks_package_versions",
    color: "#5AB4E8",
    service: "Package Registry",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "package_id", type: "UUID FK→mks_packages" },
      { name: "version", type: "VARCHAR(20)", note: "Semver. Immutable once published." },
      { name: "minio_key", type: "VARCHAR(500)", note: "Path to .mks bundle in MinIO" },
      { name: "sha256", type: "CHAR(64)", note: "Hex digest of compressed bundle" },
      { name: "byte_size_compressed", type: "BIGINT" },
      { name: "byte_size_raw", type: "BIGINT" },
      { name: "chunk_count", type: "INT", note: "10 MB chunks for resumable download" },
      { name: "embedding_model", type: "VARCHAR(100)", note: "e.g. BGE-M3" },
      { name: "vector_dims", type: "SMALLINT", note: "1024 for BGE-M3" },
      { name: "hadith_count", type: "INT" },
      { name: "has_vectors", type: "BOOLEAN DEFAULT true" },
      { name: "has_translations", type: "BOOLEAN" },
      { name: "status", type: "ENUM(draft,published,deprecated)" },
      { name: "release_notes", type: "TEXT" },
      { name: "published_by", type: "UUID FK→users" },
      { name: "published_at", type: "TIMESTAMPTZ" },
    ],
  },
  {
    name: "PackageManifest",
    table: "mks_package_manifests",
    color: "#5AE8A0",
    service: "Package Registry",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "version_id", type: "UUID FK→mks_package_versions UNIQUE" },
      { name: "file_index", type: "JSONB", note: "Array of {path, sha256, size_bytes} per internal file" },
      { name: "chunk_index", type: "JSONB", note: "Array of {offset, length, sha256} per 10 MB chunk" },
      { name: "content_summary", type: "JSONB", note: "{hadith_count, tafsir_pages, narrator_count, ...}" },
      { name: "narrators_count", type: "INT" },
      { name: "books_count", type: "INT" },
      { name: "generated_at", type: "TIMESTAMPTZ" },
    ],
  },
  {
    name: "DeltaPatch",
    table: "mks_delta_patches",
    color: "#E8D45A",
    service: "Delta Engine",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "package_id", type: "UUID FK→mks_packages" },
      { name: "from_version", type: "VARCHAR(20)", note: "Base version this patch applies from" },
      { name: "to_version", type: "VARCHAR(20)", note: "Version reached after applying patch" },
      { name: "minio_key", type: "VARCHAR(500)", note: "Path to .mks-delta binary in MinIO" },
      { name: "sha256", type: "CHAR(64)" },
      { name: "byte_size", type: "BIGINT" },
      { name: "inserts_count", type: "INT", note: "New hadith records added" },
      { name: "updates_count", type: "INT", note: "Modified records" },
      { name: "deletes_count", type: "INT", note: "Removed records" },
      { name: "patch_type", type: "ENUM(auto_computed,scholar_edit,batch_correction)" },
      { name: "signature", type: "TEXT", note: "Ed25519 base64, signed by approving scholar" },
      { name: "signer_id", type: "UUID FK→users NULLABLE" },
      { name: "generated_at", type: "TIMESTAMPTZ" },
    ],
  },
  {
    name: "IncrementalEdit",
    table: "mks_incremental_edits",
    color: "#E8D45A",
    service: "Delta Engine",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "package_id", type: "UUID FK→mks_packages" },
      { name: "record_ref", type: "VARCHAR(200)", note: "e.g. bukhari:1906 or narrator:hafsa_bint_umar" },
      { name: "record_type", type: "ENUM(hadith,narrator,tafsir_verse,metadata)" },
      { name: "field_path", type: "VARCHAR(200)", note: "JSONPath e.g. $.grade, $.translation_en" },
      { name: "old_value", type: "JSONB" },
      { name: "new_value", type: "JSONB" },
      { name: "edit_message", type: "TEXT", note: "Mandatory scholarly justification" },
      { name: "submitted_by", type: "UUID FK→users" },
      { name: "status", type: "ENUM(pending,validated,applied,rejected)" },
      { name: "delta_patch_id", type: "UUID FK→mks_delta_patches NULLABLE", note: "Set when edit is bundled into a patch" },
      { name: "created_at", type: "TIMESTAMPTZ" },
      { name: "applied_at", type: "TIMESTAMPTZ NULLABLE" },
    ],
  },
  {
    name: "Snapshot",
    table: "mks_snapshots",
    color: "#5AE8D4",
    service: "Snapshot Service",
    fields: [
      { name: "id", type: "VARCHAR(20) PK", note: "e.g. snap_001 — human-readable" },
      { name: "label", type: "VARCHAR(200)", note: "e.g. 'Before adding Nasai'" },
      { name: "org_id", type: "UUID FK→orgs NULLABLE" },
      { name: "scope", type: "ENUM(full_kb,single_collection)" },
      { name: "collection_slug", type: "VARCHAR(80) NULLABLE", note: "Set when scope = single_collection" },
      { name: "minio_key", type: "VARCHAR(500)", note: "Path to .mks.zst archive in MinIO" },
      { name: "sha256", type: "CHAR(64)" },
      { name: "byte_size", type: "BIGINT" },
      { name: "packages_included", type: "JSONB", note: "Array of {slug, version} included" },
      { name: "status", type: "ENUM(creating,ready,exporting,restored,pruned)" },
      { name: "created_by", type: "UUID FK→users" },
      { name: "created_at", type: "TIMESTAMPTZ" },
      { name: "expires_at", type: "TIMESTAMPTZ NULLABLE", note: "NULL = kept forever" },
    ],
  },
  {
    name: "ChangelogEntry",
    table: "mks_changelog",
    color: "#E8705A",
    service: "Changelog Service",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "package_id", type: "UUID FK→mks_packages NULLABLE" },
      { name: "collection_slug", type: "VARCHAR(80)" },
      { name: "operation", type: "ENUM(push,edit,pull,rollback,remote_sync,snapshot,delete)" },
      { name: "author_id", type: "UUID FK→users" },
      { name: "author_name", type: "VARCHAR(200)", note: "Denormalized for immutable history" },
      { name: "record_ref", type: "VARCHAR(200) NULLABLE", note: "e.g. hadith:1906" },
      { name: "field_changed", type: "VARCHAR(200) NULLABLE" },
      { name: "old_value_summary", type: "TEXT NULLABLE" },
      { name: "new_value_summary", type: "TEXT NULLABLE" },
      { name: "message", type: "TEXT" },
      { name: "delta_patch_id", type: "UUID NULLABLE" },
      { name: "source_remote_id", type: "UUID NULLABLE", note: "Set for cross-instance operations" },
      { name: "created_at", type: "TIMESTAMPTZ", note: "Indexed. Never updated." },
    ],
  },
  {
    name: "Subscription",
    table: "mks_subscriptions",
    color: "#E8C45A",
    service: "Subscription Manager",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "subscriber_id", type: "UUID FK→users" },
      { name: "org_id", type: "UUID FK→orgs NULLABLE" },
      { name: "package_id", type: "UUID FK→mks_packages" },
      { name: "version_constraint", type: "VARCHAR(30)", note: "e.g. ^3.x, =2.4.1, latest" },
      { name: "pinned_version", type: "VARCHAR(20) NULLABLE" },
      { name: "auto_update", type: "BOOLEAN DEFAULT true" },
      { name: "local_version", type: "VARCHAR(20)", note: "Currently applied version" },
      { name: "pending_deltas_count", type: "INT DEFAULT 0" },
      { name: "sync_status", type: "ENUM(synced,behind,syncing,error)" },
      { name: "last_synced_at", type: "TIMESTAMPTZ" },
      { name: "include_vectors", type: "BOOLEAN DEFAULT true", note: "false = text-only subscription" },
      { name: "lang_filter", type: "VARCHAR[] NULLABLE", note: "e.g. [ar, en] — null = all" },
      { name: "created_at", type: "TIMESTAMPTZ" },
    ],
  },
  {
    name: "SyncSession",
    table: "mks_sync_sessions",
    color: "#5AB4E8",
    service: "Sync Service",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "subscription_id", type: "UUID FK→mks_subscriptions NULLABLE" },
      { name: "initiated_by", type: "UUID FK→users" },
      { name: "type", type: "ENUM(full_pull,delta_apply,push,remote_pull,remote_push,auto_sync)" },
      { name: "package_slug", type: "VARCHAR(80)" },
      { name: "from_version", type: "VARCHAR(20) NULLABLE" },
      { name: "to_version", type: "VARCHAR(20) NULLABLE" },
      { name: "status", type: "ENUM(in_progress,completed,failed,rolled_back)" },
      { name: "bytes_transferred", type: "BIGINT" },
      { name: "records_affected", type: "INT" },
      { name: "error_message", type: "TEXT NULLABLE" },
      { name: "started_at", type: "TIMESTAMPTZ" },
      { name: "completed_at", type: "TIMESTAMPTZ NULLABLE" },
    ],
  },
  {
    name: "Remote",
    table: "mks_remotes",
    color: "#5A7AE8",
    service: "Remote Sync Manager",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "name", type: "VARCHAR(100) UNIQUE", note: "e.g. backup, madinah" },
      { name: "base_url", type: "VARCHAR(500)", note: "e.g. https://mishkat-backup.uni.edu" },
      { name: "api_key_hash", type: "VARCHAR(100)", note: "Bcrypt hash of remote's API key" },
      { name: "trust_level", type: "ENUM(untrusted,trusted,verified_partner)" },
      { name: "auto_sync_enabled", type: "BOOLEAN DEFAULT false" },
      { name: "auto_sync_interval_hours", type: "SMALLINT DEFAULT 6" },
      { name: "auto_sync_direction", type: "ENUM(pull,push,bidirectional)" },
      { name: "last_ping_at", type: "TIMESTAMPTZ NULLABLE" },
      { name: "last_ping_status", type: "ENUM(ok,timeout,error) NULLABLE" },
      { name: "last_sync_at", type: "TIMESTAMPTZ NULLABLE" },
      { name: "packages_scope", type: "VARCHAR[] NULLABLE", note: "NULL = all packages" },
      { name: "created_by", type: "UUID FK→users" },
      { name: "created_at", type: "TIMESTAMPTZ" },
    ],
  },
  {
    name: "AutoSyncConfig",
    table: "mks_auto_sync_configs",
    color: "#5A7AE8",
    service: "Remote Sync Manager",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "remote_id", type: "UUID FK→mks_remotes" },
      { name: "package_slug", type: "VARCHAR(80) NULLABLE", note: "NULL = sync all" },
      { name: "cron_expression", type: "VARCHAR(100)", note: "Spring cron e.g. 0 0 */6 * * *" },
      { name: "direction", type: "ENUM(pull,push)" },
      { name: "include_vectors", type: "BOOLEAN DEFAULT true" },
      { name: "enabled", type: "BOOLEAN DEFAULT true" },
      { name: "last_run_at", type: "TIMESTAMPTZ NULLABLE" },
      { name: "last_run_status", type: "ENUM(success,failed,skipped) NULLABLE" },
      { name: "created_at", type: "TIMESTAMPTZ" },
    ],
  },
  {
    name: "ValidationResult",
    table: "mks_validation_results",
    color: "#E85A8A",
    service: "Validation Service",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "upload_session_id", type: "UUID FK→mks_sync_sessions" },
      { name: "package_slug", type: "VARCHAR(80)" },
      { name: "schema_valid", type: "BOOLEAN" },
      { name: "arabic_valid", type: "BOOLEAN" },
      { name: "vector_valid", type: "BOOLEAN" },
      { name: "duplicate_check_passed", type: "BOOLEAN" },
      { name: "overall_status", type: "ENUM(passed,failed,warnings)" },
      { name: "failure_reasons", type: "JSONB[]", note: "Array of {field, rule, message}" },
      { name: "warnings", type: "JSONB[]" },
      { name: "records_checked", type: "INT" },
      { name: "records_failed", type: "INT" },
      { name: "attestation_token", type: "TEXT NULLABLE", note: "JWT issued when passed — required by Sync Service" },
      { name: "checked_at", type: "TIMESTAMPTZ" },
      { name: "expires_at", type: "TIMESTAMPTZ", note: "Attestation valid for 1 hour" },
    ],
  },
  {
    name: "ScholarKey",
    table: "mks_scholar_keys",
    color: "#8AE85A",
    service: "Integrity Service",
    fields: [
      { name: "id", type: "UUID PK" },
      { name: "user_id", type: "UUID FK→users" },
      { name: "public_key_pem", type: "TEXT", note: "Ed25519 public key in PEM" },
      { name: "fingerprint", type: "CHAR(64)", note: "SHA-256 hex of public key bytes" },
      { name: "trust_level", type: "ENUM(provisional,trusted,revoked)" },
      { name: "trusted_by", type: "UUID FK→users NULLABLE" },
      { name: "valid_from", type: "TIMESTAMPTZ" },
      { name: "valid_until", type: "TIMESTAMPTZ NULLABLE" },
      { name: "created_at", type: "TIMESTAMPTZ" },
    ],
  },
];

const ENDPOINTS = [
  {
    service: "Sync Service",
    color: "#5AB4E8",
    prefix: "/api/mks/sync",
    routes: [
      { method: "GET",  path: "/packages",                    auth: "None",    desc: "List all available packages. Filter: type, lang, visibility." },
      { method: "GET",  path: "/packages/:slug",              auth: "None",    desc: "Package detail: metadata, latest version, compressed size, hadith count." },
      { method: "GET",  path: "/packages/:slug/info",         auth: "None",    desc: "Detailed info: all versions, change history summary, subscriber count." },
      { method: "POST", path: "/pull/:slug",                  auth: "User+",   desc: "Initiate pull. Body: { version?, text_only?, langs? }. Returns session_id for tracking." },
      { method: "GET",  path: "/pull/:session_id/stream",     auth: "User+",   desc: "SSE stream of download progress. Chunked HTTP for actual .mks blob." },
      { method: "POST", path: "/pull/batch",                  auth: "User+",   desc: "Pull multiple packages: { slugs: [bukhari, muslim, tirmidhi] }." },
      { method: "POST", path: "/push",                        auth: "Scholar+",desc: "Multipart upload: metadata JSON + .mks bundle. Triggers validation → compression → registry." },
      { method: "POST", path: "/push/dry-run",                auth: "Scholar+",desc: "Validate push without committing. Returns ValidationResult with all errors/warnings." },
      { method: "POST", path: "/update/:slug",                auth: "User+",   desc: "Apply pending delta patches for a package. Returns session_id." },
      { method: "POST", path: "/update/all",                  auth: "User+",   desc: "Apply all pending deltas across all subscriptions." },
      { method: "GET",  path: "/sessions/:id",                auth: "User+",   desc: "Poll sync session: status, bytes_transferred, records_affected, error." },
      { method: "GET",  path: "/sessions/:id/sse",            auth: "User+",   desc: "SSE stream for live session progress updates." },
    ],
  },
  {
    service: "Package Registry",
    color: "#5AE8A0",
    prefix: "/api/mks/registry",
    routes: [
      { method: "GET",    path: "/packages",                  auth: "None",    desc: "Search packages. Params: q, type, lang, visibility, page, size." },
      { method: "POST",   path: "/packages",                  auth: "Scholar+",desc: "Create package record (metadata only). Returns package_id." },
      { method: "GET",    path: "/packages/:slug/versions",   auth: "None",    desc: "All versions with status and size." },
      { method: "GET",    path: "/packages/:slug/versions/:v","auth": "None",  desc: "Version manifest: file_index, chunk_index, sha256, content_summary." },
      { method: "GET",    path: "/packages/:slug/versions/:v/download", auth: "Subscriber", desc: "Stream .mks bundle. Supports Range header for resumable downloads." },
      { method: "PATCH",  path: "/packages/:slug/versions/:v/status","auth":"Admin","desc": "Transition status: draft→published, published→deprecated." },
      { method: "GET",    path: "/packages/:slug/manifest",   auth: "None",    desc: "Latest manifest.json including file_index and chunk_index." },
    ],
  },
  {
    service: "Delta Engine",
    color: "#E8D45A",
    prefix: "/api/mks/delta",
    routes: [
      { method: "GET",  path: "/chain/:slug",                 auth: "Subscriber", desc: "Ordered delta patch chain from client's local_version to latest." },
      { method: "GET",  path: "/patches/:id/download",        auth: "Subscriber", desc: "Download specific .mks-delta binary." },
      { method: "POST", path: "/patches/generate",            auth: "Admin",   desc: "Trigger delta generation between two versions. Body: { slug, from_version, to_version }." },
      { method: "POST", path: "/apply",                       auth: "Scholar+",desc: "Apply delta to tenant Qdrant collection. Body: { delta_id, target_collection }." },
      { method: "GET",  path: "/history/:slug",               auth: "Scholar+",desc: "Applied delta history for a package in this tenant." },
      { method: "GET",  path: "/jobs/:job_id",                auth: "Admin",   desc: "Poll delta generation job status." },
    ],
  },
  {
    service: "Edit API",
    color: "#A85AE8",
    prefix: "/api/mks/edit",
    routes: [
      { method: "POST",   path: "/hadith",                    auth: "Scholar+",desc: "Edit a hadith field. Body: { package, hadith_id, field, value, message }." },
      { method: "POST",   path: "/hadith/batch",              auth: "Scholar+",desc: "Apply a .jsonl patch file of multiple hadith edits at once." },
      { method: "POST",   path: "/narrator",                  auth: "Scholar+",desc: "Edit a narrator record. Body: { narrator_key, field, value, message }." },
      { method: "POST",   path: "/metadata",                  auth: "Scholar+",desc: "Edit package-level metadata: description, author, version notes." },
      { method: "GET",    path: "/pending",                   auth: "Scholar+",desc: "List caller's pending (not yet applied) edits." },
      { method: "DELETE", path: "/pending/:id",               auth: "Scholar+",desc: "Withdraw a pending edit before it is applied." },
    ],
  },
  {
    service: "Snapshot Service",
    color: "#5AE8D4",
    prefix: "/api/mks/snapshots",
    routes: [
      { method: "GET",    path: "/",                          auth: "User+",   desc: "List all snapshots for this tenant: id, label, date, size, status." },
      { method: "POST",   path: "/",                          auth: "Admin",   desc: "Create snapshot. Body: { label, scope, collection_slug? }. Returns snapshot_id." },
      { method: "GET",    path: "/:id",                       auth: "User+",   desc: "Snapshot detail: packages_included, byte_size, status." },
      { method: "GET",    path: "/:id/export",                auth: "Admin",   desc: "Stream snapshot as .mks.zst archive for offline/backup use." },
      { method: "POST",   path: "/:id/rollback",              auth: "Admin",   desc: "Restore KB or specific collection to this snapshot. Body: { collection_slug? }." },
      { method: "POST",   path: "/:id/tag",                   auth: "Admin",   desc: "Attach a human-readable label to an existing snapshot." },
      { method: "DELETE", path: "/:id",                       auth: "Admin",   desc: "Delete a snapshot. Frees MinIO storage." },
    ],
  },
  {
    service: "Changelog Service",
    color: "#E8705A",
    prefix: "/api/mks/log",
    routes: [
      { method: "GET", path: "/:slug",                        auth: "User+",   desc: "Change log for a collection. Filter: operation, author, since, until, limit." },
      { method: "GET", path: "/all",                          auth: "Admin",   desc: "Full cross-collection audit log. Paginated." },
      { method: "GET", path: "/changes/:change_id",           auth: "User+",   desc: "Full diff for a single change: author, before/after values, message." },
      { method: "GET", path: "/:slug/export",                 auth: "Scholar+",desc: "Export changelog as JSON or CSV. Params: format, since, until." },
      { method: "GET", path: "/since/:slug",                  auth: "User+",   desc: "Changes since a given date. Maps to msk sync changes command." },
    ],
  },
  {
    service: "Remote Sync",
    color: "#5A7AE8",
    prefix: "/api/mks/remotes",
    routes: [
      { method: "GET",    path: "/",                          auth: "Admin",   desc: "List all registered remotes with connectivity status." },
      { method: "POST",   path: "/",                          auth: "Admin",   desc: "Register a new remote. Body: { name, base_url, api_key, trust_level }." },
      { method: "GET",    path: "/:name",                     auth: "Admin",   desc: "Remote detail including last sync time and auto-sync config." },
      { method: "PATCH",  path: "/:name",                     auth: "Admin",   desc: "Update remote config: interval, direction, trust_level, packages_scope." },
      { method: "DELETE", path: "/:name",                     auth: "Admin",   desc: "Remove a remote registration." },
      { method: "POST",   path: "/:name/pull",                auth: "Admin",   desc: "Trigger immediate pull from remote. Body: { slugs?, include_vectors? }." },
      { method: "POST",   path: "/:name/push",                auth: "Admin",   desc: "Push packages to remote instance. Body: { slugs? }." },
      { method: "POST",   path: "/:name/ping",                auth: "Admin",   desc: "Health-check a remote: returns latency, version, available packages count." },
      { method: "GET",    path: "/auto-sync/configs",         auth: "Admin",   desc: "List all AutoSyncConfig records." },
      { method: "POST",   path: "/auto-sync/configs",         auth: "Admin",   desc: "Create auto-sync schedule. Body: { remote_id, cron, direction, slug? }." },
      { method: "PATCH",  path: "/auto-sync/configs/:id",     auth: "Admin",   desc: "Enable/disable or update cron schedule." },
    ],
  },
  {
    service: "Subscription Manager",
    color: "#E8C45A",
    prefix: "/api/mks/subscriptions",
    routes: [
      { method: "GET",    path: "/",                          auth: "User+",   desc: "List subscriptions with sync_status and pending_deltas_count." },
      { method: "POST",   path: "/",                          auth: "User+",   desc: "Subscribe to a package. Body: { slug, version_constraint, auto_update, include_vectors, lang_filter }." },
      { method: "PATCH",  path: "/:id",                       auth: "User+",   desc: "Update version_constraint, auto_update, lang_filter." },
      { method: "DELETE", path: "/:id",                       auth: "User+",   desc: "Unsubscribe. Local data preserved." },
      { method: "GET",    path: "/:id/pull-manifest",         auth: "User+",   desc: "Ordered list of delta_ids client needs to reach latest version." },
    ],
  },
  {
    service: "Validation Service",
    color: "#E85A8A",
    prefix: "/api/mks/validate",
    routes: [
      { method: "POST", path: "/schema",                      auth: "Scholar+",desc: "Run schema validation on uploaded JSONL. Returns pass/fail per record." },
      { method: "POST", path: "/arabic",                      auth: "Scholar+",desc: "Check Arabic text integrity: encoding, RTL markers, diacritics." },
      { method: "POST", path: "/vectors",                     auth: "Scholar+",desc: "Verify vector dimensions and NaN checks." },
      { method: "POST", path: "/full",                        auth: "Scholar+",desc: "Run all validation layers. Returns ValidationResult with attestation_token if passed." },
      { method: "GET",  path: "/results/:id",                 auth: "Scholar+",desc: "Get a previous validation result by ID." },
    ],
  },
];

const CLI_COMMANDS = [
  {
    group: "Auth",
    color: "#E8935A",
    commands: [
      { cmd: "msk auth login", flags: "--totp", desc: "Authenticate. --totp for Scholar/Admin (MFA required)." },
      { cmd: "msk auth status", flags: "", desc: "Current identity, role, token expiry, rate-limit remaining." },
      { cmd: "msk auth logout", flags: "", desc: "Revoke current session." },
    ],
  },
  {
    group: "Browse & Info",
    color: "#5AE8A0",
    commands: [
      { cmd: "msk sync list", flags: "--type hadith", desc: "Browse available packages on server." },
      { cmd: "msk sync info <slug>", flags: "", desc: "Show package details: version, size, hadith count." },
      { cmd: "msk sync changes <slug>", flags: "--since 2026-05-01", desc: "Show what changed since your last pull or a given date." },
    ],
  },
  {
    group: "Pull",
    color: "#5AB4E8",
    commands: [
      { cmd: "msk sync pull bukhari", flags: "", desc: "Download Sahih al-Bukhari (.mks bundle)." },
      { cmd: "msk sync pull bukhari muslim tirmidhi", flags: "", desc: "Pull multiple packages at once." },
      { cmd: "msk sync pull --all", flags: "", desc: "Pull every available package." },
      { cmd: "msk sync pull bukhari", flags: "--offline", desc: "Download for offline use — includes vectors." },
      { cmd: "msk sync pull bukhari", flags: "--text-only", desc: "Text + metadata only, no vectors (smaller)." },
      { cmd: "msk sync pull bukhari", flags: "--lang ar,en", desc: "Only Arabic + English translations." },
    ],
  },
  {
    group: "Push",
    color: "#A85AE8",
    commands: [
      { cmd: "msk sync push ./nasai_data/", flags: "--name nasai --type hadith --message '...'", desc: "Upload new collection from a directory." },
      { cmd: "msk sync push ./tirmidhi.json", flags: "--name tirmidhi --type hadith", desc: "Push from a structured JSON file." },
      { cmd: "msk sync push ./data/", flags: "--name test --dry-run --verbose", desc: "Validate push without uploading (dry run)." },
    ],
  },
  {
    group: "Incremental Edit",
    color: "#E8D45A",
    commands: [
      { cmd: "msk sync edit bukhari", flags: "--hadith 1906 --field grade --value 'صحيح' --message 'Fix per Ibn Hajar'", desc: "Edit one field of one hadith. Only bytes transferred, not the whole collection." },
      { cmd: "msk sync edit narrator_database", flags: "--narrator 'حفص بن سليمان' --field grade --value 'متروك'", desc: "Edit a narrator's reliability rating." },
      { cmd: "msk sync edit bukhari", flags: "--hadith 1 --field translation_en --value '...'", desc: "Add or update a translation field." },
      { cmd: "msk sync edit bukhari", flags: "--patch ./corrections.jsonl --message 'Batch corrections'", desc: "Apply a .jsonl patch file of multiple edits." },
      { cmd: "msk sync edit bukhari", flags: "--metadata --field description --value '...'", desc: "Edit package-level metadata." },
    ],
  },
  {
    group: "Update (Delta)",
    color: "#5AE8A0",
    commands: [
      { cmd: "msk sync update", flags: "", desc: "Apply all pending deltas across all subscriptions." },
      { cmd: "msk sync update bukhari", flags: "", desc: "Get latest changes for Bukhari (delta only — not full re-pull)." },
      { cmd: "msk sync log bukhari", flags: "", desc: "View the full change history for a collection." },
      { cmd: "msk sync log --all", flags: "--limit 50", desc: "Change log across all collections." },
    ],
  },
  {
    group: "Snapshots & Rollback",
    color: "#5AE8D4",
    commands: [
      { cmd: "msk sync snapshot create", flags: "--message 'Before adding Nasai'", desc: "Create a named snapshot of the entire KB." },
      { cmd: "msk sync snapshot list", flags: "", desc: "List all snapshots: ID, date, size, message." },
      { cmd: "msk sync rollback snap_002", flags: "--confirm", desc: "Restore entire KB to snapshot." },
      { cmd: "msk sync rollback snap_001", flags: "--collection bukhari", desc: "Rollback only one collection." },
      { cmd: "msk sync snapshot export snap_003", flags: "--out ./mishkat-backup.mks.zst", desc: "Export snapshot as downloadable archive." },
    ],
  },
  {
    group: "Remote (Multi-Instance)",
    color: "#5A7AE8",
    commands: [
      { cmd: "msk sync remote add backup", flags: "https://mishkat-backup.youruni.edu", desc: "Register a remote Mishkat instance." },
      { cmd: "msk sync push --remote backup --all", flags: "", desc: "Push all knowledge to a remote." },
      { cmd: "msk sync remote add madinah", flags: "https://mishkat.iu-madinah.edu", desc: "Register a partner university instance." },
      { cmd: "msk sync pull --remote madinah tafsir_ibn_kathir", flags: "", desc: "Pull a package from a partner university." },
      { cmd: "msk sync auto", flags: "--interval 6h --remote backup", desc: "Start background auto-sync daemon." },
    ],
  },
  {
    group: "Admin",
    color: "#E8705A",
    commands: [
      { cmd: "msk admin snapshot prune", flags: "--keep 5", desc: "Delete oldest snapshots keeping the N most recent." },
      { cmd: "msk admin cache flush", flags: "--service qdrant", desc: "Flush service caches." },
      { cmd: "msk admin audit-log", flags: "--user scholar@uni.edu --last 30d", desc: "Pull audit log for a user or package." },
      { cmd: "msk admin keys list", flags: "--trust trusted", desc: "List scholar signing keys." },
    ],
  },
];

const KAFKA_EVENTS = [
  { topic: "mks.package.published", producer: "Package Registry", consumers: ["Subscription Manager", "Changelog Service"], payload: "{ package_id, slug, version, published_by }" },
  { topic: "mks.push.received", producer: "Sync Service", consumers: ["Validation Service", "Changelog Service"], payload: "{ session_id, slug, submitted_by, byte_size }" },
  { topic: "mks.delta.generated", producer: "Delta Engine", consumers: ["Subscription Manager", "Changelog Service"], payload: "{ delta_id, package_id, from_version, to_version, inserts, updates, deletes }" },
  { topic: "mks.delta.applied", producer: "Sync Service", consumers: ["Changelog Service", "Subscription Manager"], payload: "{ session_id, delta_id, records_affected, applied_by }" },
  { topic: "mks.edit.submitted", producer: "Edit API / Sync Service", consumers: ["Delta Engine", "Changelog Service"], payload: "{ edit_id, package_slug, record_ref, field_path, submitted_by }" },
  { topic: "mks.snapshot.created", producer: "Snapshot Service", consumers: ["Changelog Service", "Notification Service"], payload: "{ snapshot_id, label, scope, byte_size }" },
  { topic: "mks.rollback.completed", producer: "Snapshot Service", consumers: ["Subscription Manager", "Changelog Service"], payload: "{ snapshot_id, collection_slug?, restored_by }" },
  { topic: "mks.remote.sync.completed", producer: "Remote Sync Manager", consumers: ["Changelog Service", "Subscription Manager"], payload: "{ remote_id, direction, packages_synced[], session_id }" },
  { topic: "mks.integrity.failed", producer: "Integrity Service", consumers: ["Notification Service (Alert)"], payload: "{ upload_id, failure_reason, submitted_by }" },
  { topic: "mks.subscription.behind", producer: "Subscription Manager", consumers: ["Notification Service"], payload: "{ subscription_id, subscriber_id, pending_deltas_count }" },
];

const CLI_BUILD = {
  overview: `The msk CLI is a native Go binary that communicates with the MKS API Gateway over HTTPS. Go is used instead of Java because Go compiles to a single self-contained executable — no JVM, no classpath, no installation required. The user downloads one binary and runs it.`,
  steps: [
    {
      title: "1. Project structure",
      color: "#E8935A",
      code: `msk-cli/
├── cmd/
│   ├── main.go               # Entry: cobra root command
│   ├── auth.go               # msk auth login / status / logout
│   ├── sync_pull.go          # msk sync pull
│   ├── sync_push.go          # msk sync push
│   ├── sync_edit.go          # msk sync edit
│   ├── sync_update.go        # msk sync update / log / changes
│   ├── sync_snapshot.go      # msk sync snapshot / rollback
│   ├── sync_remote.go        # msk sync remote / auto
│   └── admin.go              # msk admin commands
├── internal/
│   ├── api/
│   │   ├── client.go         # HTTP client: base URL, JWT header, retry
│   │   └── streaming.go      # SSE + chunked HTTP download handler
│   ├── config/
│   │   └── config.go         # ~/.msk/config.toml — server URL, token store
│   ├── auth/
│   │   └── token_store.go    # Secure local token storage (OS keychain)
│   ├── compress/
│   │   └── zstd.go           # Local zstd decompression of .mks bundles
│   └── output/
│       └── printer.go        # Table printer, JSON output, progress bars
├── go.mod
├── go.sum
└── .goreleaser.yaml          # Cross-platform release config`,
    },
    {
      title: "2. Main entry (Cobra)",
      color: "#5AB4E8",
      code: `// cmd/main.go
package main

import (
    "github.com/spf13/cobra"
    "github.com/spf13/viper"
)

func main() {
    rootCmd := &cobra.Command{
        Use:   "msk",
        Short: "Mishkat Knowledge Sync CLI",
    }

    // Persistent flags (all sub-commands inherit)
    rootCmd.PersistentFlags().String("server", "https://api.mishkat.app", "MKS server URL")
    rootCmd.PersistentFlags().String("format", "table", "Output format: table | json | quiet")
    viper.BindPFlag("server", rootCmd.PersistentFlags().Lookup("server"))

    // Register command groups
    rootCmd.AddCommand(authCmd())
    rootCmd.AddCommand(syncCmd())   // sync pull/push/edit/update/snapshot/remote/auto
    rootCmd.AddCommand(adminCmd())

    rootCmd.Execute()
}`,
    },
    {
      title: "3. A sync pull command",
      color: "#5AE8A0",
      code: `// cmd/sync_pull.go
func pullCmd() *cobra.Command {
    var textOnly bool
    var langs    string
    var offline  bool

    cmd := &cobra.Command{
        Use:   "pull [slug...]",
        Short: "Download knowledge packages",
        RunE: func(cmd *cobra.Command, args []string) error {
            client := api.NewClient(viper.GetString("server"), auth.LoadToken())

            for _, slug := range args {
                opts := api.PullOptions{TextOnly: textOnly, Langs: langs, Offline: offline}
                session, err := client.StartPull(slug, opts)
                if err != nil { return err }

                // SSE progress stream
                bar := output.NewProgressBar(slug)
                err = client.StreamSession(session.ID, func(event api.ProgressEvent) {
                    bar.Update(event.BytesTransferred, event.TotalBytes)
                })
                if err != nil { return err }

                // Decompress .mks into local Qdrant
                err = compress.ImportMKS(session.LocalPath)
                fmt.Printf("✓ %s pulled successfully\\n", slug)
            }
            return nil
        },
    }
    cmd.Flags().BoolVar(&textOnly, "text-only", false, "Skip vectors")
    cmd.Flags().StringVar(&langs,  "lang", "",      "Comma-separated lang codes")
    cmd.Flags().BoolVar(&offline,  "offline", false, "Include vectors for offline use")
    return cmd
}`,
    },
    {
      title: "4. Incremental edit command",
      color: "#E8D45A",
      code: `// cmd/sync_edit.go
func editCmd() *cobra.Command {
    var hadithID int
    var field, value, message, patchFile string
    var isMetadata bool

    cmd := &cobra.Command{
        Use:   "edit [slug]",
        Short: "Incrementally edit a hadith, narrator, or metadata",
        RunE: func(cmd *cobra.Command, args []string) error {
            client := api.NewClient(viper.GetString("server"), auth.LoadToken())
            slug := args[0]

            if patchFile != "" {
                // Batch edit from .jsonl file
                return client.BatchEdit(slug, patchFile)
            }
            if isMetadata {
                return client.EditMetadata(slug, field, value, message)
            }
            // Single hadith edit — only a few bytes over the wire
            edit := api.EditRequest{
                Package:   slug,
                HadithID:  hadithID,
                Field:     field,
                NewValue:  value,
                Message:   message,
            }
            result, err := client.EditHadith(edit)
            if err != nil { return err }
            fmt.Printf("✓ Edit queued — delta ID: %s\\n", result.DeltaID)
            return nil
        },
    }
    cmd.Flags().IntVar(&hadithID,   "hadith",   0,    "Hadith number to edit")
    cmd.Flags().StringVar(&field,   "field",    "",   "Field to change e.g. grade, translation_en")
    cmd.Flags().StringVar(&value,   "value",    "",   "New value")
    cmd.Flags().StringVar(&message, "message",  "",   "Scholarly justification (required)")
    cmd.Flags().StringVar(&patchFile,"patch",   "",   ".jsonl patch file for batch edits")
    cmd.Flags().BoolVar(&isMetadata,"metadata", false,"Edit package metadata instead of a hadith")
    return cmd
}`,
    },
    {
      title: "5. Cross-platform release with GoReleaser",
      color: "#5A7AE8",
      code: `# .goreleaser.yaml
project_name: msk
builds:
  - id: msk
    main: ./cmd/main.go
    binary: msk
    goos:   [linux, darwin, windows]
    goarch: [amd64, arm64]
    ldflags:
      - -s -w  # strip debug symbols — smaller binary
      - -X main.version={{.Version}}

archives:
  - format: tar.gz
    name_template: "msk_{{.Version}}_{{.Os}}_{{.Arch}}"
    format_overrides:
      - goos: windows
        format: zip

checksum:
  name_template: checksums.txt
  algorithm: sha256

release:
  github:
    owner: mishkat-app
    name: msk

# Run: goreleaser release --clean
# Output: dist/ folder with:
#   msk_1.0.0_linux_amd64.tar.gz
#   msk_1.0.0_darwin_arm64.tar.gz   (Apple Silicon)
#   msk_1.0.0_windows_amd64.zip
#   checksums.txt`,
    },
    {
      title: "6. Installation (end user)",
      color: "#5AE8A0",
      code: `# Linux / macOS — one-liner install
curl -sSL https://install.mishkat.app/msk | bash
# Downloads the right binary, places in /usr/local/bin/msk

# macOS Homebrew
brew install mishkat-app/tap/msk

# Windows — Scoop
scoop bucket add mishkat https://github.com/mishkat-app/scoop-bucket
scoop install msk

# Or manual: download binary from GitHub Releases and add to PATH

# Verify
msk --version
# → msk v1.0.0 (linux/amd64)

# First-time setup
msk auth login
# → Enter email: ...
# → Enter password: ...
# → (Scholar role) Enter TOTP code: ...
# → ✓ Logged in as dr-yusuf@azhar.edu (Scholar)
# Token stored in OS keychain (Keychain on macOS, Credential Manager on Windows, libsecret on Linux)`,
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
  const fg = auth === "None" ? "#555" : auth === "Admin" ? "#f87171" : auth === "Scholar+" ? "#c084fc" : "#60a5fa";
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
          <span style={{ color: "#f0f0f0", fontWeight: 700 }}>MKS</span> is an app-store for Islamic knowledge packages. Browse, pull collections, push corrections, apply incremental edits (only the changed bytes), rollback to any snapshot, and sync between university Mishkat instances — all via CLI or Web UI. Everything is Spring Boot Java except the CLI (Go binary for zero-install distribution).
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 22 }}>
        {[
          { label: "Microservices", value: "10", sub: "All Spring Boot 3 Java", color: "#5AB4E8" },
          { label: "Data Entities", value: "14", sub: "PostgreSQL + MinIO", color: "#5AE8A0" },
          { label: "API Endpoints", value: "65+", sub: "Across all services", color: "#E8D45A" },
          { label: "Kafka Topics", value: "10", sub: "Async event bus", color: "#A85AE8" },
          { label: "CLI Commands", value: "30+", sub: "Go binary, cross-platform", color: "#E8935A" },
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
          { title: ".mks package format", color: "#5AE8A0", lines: [
            "manifest.json — name, version, hadith count, sha256",
            "hadiths/01-الإيمان.jsonl.zst — per-book compressed",
            "vectors/01-الإيمان.npy.zst — embedding vectors",
            "metadata/narrators.jsonl.zst",
            "metadata/grading.jsonl.zst",
            "changelog.json — history of changes to this package",
          ]},
          { title: "Delta transfer sizes", color: "#E8D45A", lines: [
            "Edit 1 hadith grade → ~200 bytes transferred",
            "Add 100 new hadiths → ~50 KB (vs 6 MB full re-pull)",
            "Typical daily sync → under 1 MB",
            "Full Bukhari bundle → ~6 MB compressed",
            "Compression ratio: text 6:1, vectors 2.2:1",
            "Arabic JSONL 22 MB raw → 3.7 MB compressed",
          ]},
          { title: "Why Spring Boot (not Go) for services", color: "#A85AE8", lines: [
            "Spring Batch for ETL ingestion pipelines",
            "Spring Data JPA for clean entity-repository pattern",
            "Spring Scheduling for auto-sync daemon (@Scheduled)",
            "Spring Security for JWT + RBAC middleware",
            "Spring Cloud Gateway for routing + rate limiting",
            "Rich ecosystem: iText, POI, Kafka, Testcontainers",
          ]},
          { title: "Why Go for the CLI", color: "#E8935A", lines: [
            "Compiles to single self-contained binary",
            "No JVM, no classpath, no installation steps",
            "Cross-compile to linux/mac/windows in one build",
            "Sub-millisecond startup (JVM takes 300ms+)",
            "Cobra + Viper = industry-standard CLI framework",
            "GoReleaser automates GitHub release artifacts",
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

// ─── ROOT ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",   label: "Overview",       color: "#E8935A" },
  { id: "services",   label: "Microservices",  color: "#5AB4E8" },
  { id: "entities",   label: "Data Entities",  color: "#5AE8A0" },
  { id: "endpoints",  label: "API Endpoints",  color: "#E8D45A" },
  { id: "cli",        label: "CLI + .exe Build","color": "#A85AE8" },
  { id: "kafka",      label: "Kafka Events",   color: "#5A7AE8" },
];

export default function App() {
  const [tab, setTab] = useState("overview");
  const active = TABS.find(t => t.id === tab);

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#e0e0e0", fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" }}>
      <div style={{ borderBottom: "1px solid #161616", padding: "18px 28px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: "#111", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⇄</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f0", letterSpacing: -0.3 }}>Mishkat Knowledge Sync (MKS)</div>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginTop: 1 }}>Architecture Reference · Spring Boot · v2.0</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["10 services", "14 entities", "65+ endpoints", "10 kafka topics", "Go CLI"].map(b => (
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
        {tab === "endpoints"  && <EndpointsView />}
        {tab === "cli"        && <CLIView />}
        {tab === "kafka"      && <KafkaView />}
      </div>
    </div>
  );
}
