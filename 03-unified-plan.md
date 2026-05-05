# UNIFIED MEMORY MANAGEMENT PLAN — graphify-brain Extension

*Planner subagent — synthesis of Tree + Fractal proposals*

---

## 1. Synthesis: How Tree + Fractal Complement Each Other

The two proposals are not in competition — they operate at different layers:

| Layer | Tree Memory | Fractal Memory | Relationship |
|---|---|---|---|
| **Storage** | 3-level hierarchy (Root→Project→Run) | Self-similar nesting (brain→community→node) | Tree provides the **physical layout**; Fractal provides the **analytical overlay** |
| **Retention** | Pruning via 5-score system + archive | Compression via WL isomorphism + scale collapse | Pruning = storage GC; Compression = knowledge summarization. Both needed. |
| **Freshness** | Exponential decay half-life ~23 days | Temperature tracking (hot/warm/cold) | **Merge these**: temperature *is* the staleness component of the prune score |
| **Deduplication** | Jaccard overlap between sibling runs | MinHash/LSH on node labels | **Complementary**: Jaccard works at run-level; MinHash works at node-level |
| **Versioning** | Newer runs obsolete older siblings | Communities frozen into supernodes | **Same concept, different vocabulary**: both are about collapsing redundant information |
| **Cross-project** | Not addressed | Archetypes (≥3 re-emergences → permanent) | **Fractal fills a gap**: Tree never considered cross-project patterns |

**Conceptual bridges:**
- A `run` (Tree) **contains** a `graph` which can be analyzed into `communities` (Fractal)
- `pruning` (Tree) can be **informed by** `temperature` (Fractal) — cold artifacts are prime prune candidates
- `version obsoletion` (Tree) is a **simpler form of** `scale compression` (Fractal) — both keep only the meaningful delta
- `archetypes` (Fractal) **span across** the `root → project` boundary (Tree), giving cross-project analytical power

**Core insight:** Tree is the *where* and *when* — physical storage, version history, retention policy. Fractal is the *what* and *why* — knowledge structure, semantic relationships, emergent patterns. The unified system uses Tree as its skeleton and Fractal as its analytical muscle.

---

## 2. Unified Commands

Consolidated `/memory` subcommand set:

| Command | Phase | Source | Description |
|---|---|---|---|
| `/memory save` | Exist | Current | Save current `graphify-out/` to brain (now creates a **run**, not overwrite) |
| `/memory list` | Exist | Current | List all saved projects |
| `/memory load <project> [--run <id>]` | Exist+ | Current+Tree | Load LATEST, or a specific run with `--run` |
| `/memory runs <project>` | **1** | Tree | List all runs for a project with timestamps, scores, temp |
| `/memory stats [project]` | **2** | Merged | Show run count, total size, prune scores, archetype hits, temperature distribution |
| `/memory prune [project]` | **2** | Tree | Show prune candidates ranked by composite score |
| `/memory pin <run-id>` | **2** | Tree | Pin a run: immune to pruning |
| `/memory unpin <run-id>` | **2** | Tree | Remove pin protection |
| `/memory gc` | **2** | Tree | Execute garbage collection: archive pruneable runs, delete archived after 30 days |
| `/memory keep <run-id>` | **2** | Tree | Rescue a run from the archive |
| `/memory zoom <run-id>` | **1** | Fractal | Load a specific run into context (alias for `load --run`) |
| `/memory compress <project>` | **4** | Fractal | Run community detection + scale compression, freeze communities |
| `/memory expand <run-id>` | **4** | Fractal | Unfreeze a compressed run back to raw graph |
| `/memory fuse <run-a> <run-b>` | **5** | Fractal | Compute diff/overlap summary between two runs |
| `/memory archetypes` | **5** | Fractal | List cross-project archetypes (patterns appearing ≥3 times) |
| `/memory-wiki sync\|open\|notes` | Exist | Current | Obsidian vault operations (unchanged) |

**Command nomenclature principle:** Prefer Tree's `pin/unpin/gc/keep` for storage operations (they're standard vocabulary). Prefer Fractal's `compress/expand/zoom/fuse/archetypes` for analytical operations (they're domain-appropriate metaphors).

---

## 3. Unified Data Model

### 3.1 Filesystem Layout (Backward Compatible)

```
~/.pi/graphify-brain/
├── index.md                          # EXISTING: rebuilt by rebuildBrainIndex()
├── brain-meta.json                   # NEW: global state (schema v2, archetypes, heat tracker)
├── obsidian-vault/                   # EXISTING: unchanged
│   └── ...
├── .archive/                         # NEW: 30-day grace period holding area
│   └── <run-id>.json                 # archived run metadata
│
└── <project-slug>/                   # EXISTING: project directory (unchanged path)
    ├── meta.json                     # EXISTING: extended with runCount, lastRunId, compressionState
    ├── graph.json                    # EXISTING: LATEST copy (backward compat)
    ├── GRAPH_REPORT.md               # EXISTING: LATEST copy (backward compat)
    ├── wiki/                         # EXISTING: unchanged
    ├── obsidian/                     # EXISTING: unchanged
    │
    └── runs/                         # NEW: additive run storage
        └── <run-id>/                 # timestamp-based ISO: 2026-05-04T14-30-00Z
            ├── run-meta.json         # RunMeta: scores, temp, compression state
            ├── graph.json            # full graph for this run
            ├── GRAPH_REPORT.md       # report for this run
            ├── communities.json      # NEW (Phase 4): community detection output
            ├── wiki/                 # wiki index at this point in time
            └── obsidian/             # obsidian notes at this point in time
```

**Backward compatibility guarantee:** Every artifact that exists at the project root today (`graph.json`, `GRAPH_REPORT.md`, `meta.json`, `wiki/`, `obsidian/`) remains in the same location. After a save, these reflect the LATEST run. Existing tooling (index.md rebuild, obsidian-vault sync, `memory load`) continues to work without modification. New runs go under `runs/` — additive, never destructive.

### 3.2 Metadata Schemas

**`meta.json` — Project-level (extended)**

```typescript
interface ProjectMeta {
  // ── EXISTING fields (unchanged, backward compat) ──
  displayName: string;
  projectPath: string;
  savedAt: string;           // ISO timestamp of last save
  nodeCount: string | number;
  edgeCount: string | number;

  // ── NEW Tree fields ──
  schemaVersion: 2;          // discriminator for old vs new format
  runCount: number;
  lastRunId: string;

  // ── NEW Fractal fields ──
  compressionState: "raw" | "communities" | "compressed" | "frozen";
  communityCount?: number;
  archetypeIds?: string[];
}
```

**`run-meta.json` — Run-level (new)**

```typescript
interface RunMeta {
  runId: string;             // ISO-based: "2026-05-04T14-30-00Z"
  savedAt: string;           // ISO timestamp
  nodeCount: number;
  edgeCount: number;
  artifactCount: number;     // files copied

  // ── Tree: Pruning (Phase 2) ──
  pruneScore: {
    staleness: number;       // 0-1, derived from temperature decay
    redundancy: number;      // 0-1, Jaccard overlap with newest sibling
    lowSignal: number;       // 0-1, nodeCount < threshold (default 10)
    obsoletion: number;      // 0-1, age rank among siblings
    pinned: boolean;         // user override: always 0 if true
  };
  totalPruneScore: number;   // weighted composite (0-1)

  // ── Fractal: Temperature (Phase 3) ──
  temperature: "hot" | "warm" | "cold";
  lastAccessedAt: string;
  accessCount: number;

  // ── Fractal: Compression (Phase 4-5) ──
  compressionState: "raw" | "communities" | "compressed" | "frozen";
  communityCount?: number;
  archetypeIds?: string[];
}
```

**`brain-meta.json` — Global brain state (new, Phase 3+)**

```typescript
interface BrainMeta {
  schemaVersion: 2;
  
  // ── Archetypes (Phase 5) ──
  archetypes: Array<{
    archetypeId: string;
    label: string;           // human-readable name
    nodePattern: string[];   // representative node label signature
    occurrenceCount: number;
    projectSlugs: string[];
    firstSeenAt: string;
    lastSeenAt: string;
  }>;

  // ── Heat Tracker (Phase 3) ──
  heatTracker: {
    lastUpdateAt: string;
    entries: Record<string, {   // key = run-id
      accessCount: number;
      lastAccessedAt: string;
      temperature: "hot" | "warm" | "cold";
    }>;
  };
}
```

### 3.3 Key Design Decisions

**Run ID format:** ISO 8601 timestamp with colons replaced by hyphens for filesystem safety: `2026-05-04T14-30-00Z`. This is sortable, human-readable, and collision-free at practical save frequencies.

**Prune score composite (Phase 2):**
```
totalPruneScore = pinned ? 0 :
  0.35 * staleness +
  0.25 * redundancy +
  0.15 * lowSignal +
  0.25 * obsoletion
```
Range `[0, 1]`. Runs with `totalPruneScore > 0.7` are prune candidates. Runs with `totalPruneScore > 0.9` are auto-prune candidates (with archive grace).

**Temperature → Staleness mapping (Phase 3):**
| Temperature | Staleness score |
|---|---|
| `hot` (accessed < 1 day) | 0.0 |
| `warm` (accessed 1-7 days) | 0.3 |
| `cold` (accessed > 7 days) | 0.7 → 1.0 (approaches 1.0 at 23-day half-life) |

This replaces the exponential decay formula from Proposal 1 with a simpler two-tier system: temperature buckets provide the coarse signal, and within the `cold` bucket, exponential decay towards 1.0 adds precision for very old runs.

**Redundancy calculation (Jaccard):** For each run, compute Jaccard similarity with the most recent (newest) run of the same project. `redundancy = 1 - |A ∩ B| / |A ∪ B|` where A and B are node label sets. Low redundancy = high prune score (it's very similar to the newest run, so it's redundant).

**Obsoletion (simplified):** Instead of the transitive update system in Proposal 1 (where each new save raises scores of all older siblings), use rank-based: `obsoletion = rank / totalRuns` where `rank = 0` for newest, `totalRuns-1` for oldest. Simpler, no cross-run mutation needed.

---

## 4. Implementation Roadmap

### Phase 1: Run-Level Storage *(MVP this session)*
**Value: High | Cost: Low | Risk: Minimal**

**Changes to `handleSave()` in graphify.ts:**
1. Generate run ID: `runId = new Date().toISOString().replace(/:/g, '-')`
2. Create `path.join(destDir, "runs", runId)` directory
3. Copy artifacts into `runs/{runId}/` (not project root)
4. Write `run-meta.json` with initial empty prune scores
5. Then copy artifacts to project root as LATEST (backward compat)
6. Update `meta.json` with `runCount`, `lastRunId`, `schemaVersion: 2`

**New handler: `handleRuns()`**
- Reads `runs/` directory, displays run IDs with timestamps, node/edge counts
- Registered as `/memory runs <project>`

**Modify `handleLoad()`**
- Accept optional run-id parameter: `load <project> [--run <id>]`
- If `--run` provided, load from `runs/{run-id}/`; otherwise load LATEST from project root

**Estimated lines:** ~80 new, ~20 modified. Pure additive. No breaking changes.

### Phase 2: Pruning Infrastructure
**Value: Medium | Cost: Medium | Risk: Low**

**New functions:**
- `computePruneScores(projectDir)` — scan runs, compute all scores, write to run-meta
- `getPruneCandidates(projectDir, threshold = 0.7)` — filter runs above threshold
- `archiveRun(projectDir, runId)` — move to `.archive/` with metadata
- `deleteExpiredArchives(brainDir)` — remove archives older than 30 days
- `keepRun(runId)` — move from `.archive/` back to `runs/`

**New commands:** `/memory prune [project]`, `/memory pin <run-id>`, `/memory unpin <run-id>`, `/memory gc`, `/memory keep <run-id>`

**Modify `/memory stats`:** Show per-project run count, total size, prune score histogram.

### Phase 3: Temperature Tracking
**Value: Medium | Cost: Low | Risk: Minimal**

**New class: `HeatTracker`** (inline in graphify.ts, ~60 lines)
- `persistPath = path.join(BRAIN_DIR, "brain-meta.json")`
- `recordAccess(runId)` — increment access count, update lastAccessedAt
- `decayTemperatures()` — on session_start, decay all entries: hot→warm after 1 day, warm→cold after 7 days
- `getTemperature(runId)` — return current temperature
- `getStats()` — count of hot/warm/cold

**Integration points:**
- `handleLoad` and `handleZoom`: call `heatTracker.recordAccess(runId)`
- `handleSave`: seed new run as `hot`
- `session_start` hook: call `heatTracker.decayTemperatures()`
- `computePruneScores`: use temperature for staleness component

### Phase 4: Fractal Compression
**Value: Medium | Cost: High | Risk: Medium**

**New function: `detectCommunities(graph)`**
- Operates on the existing `graph.json` structure
- Performs community detection (Louvain or simple label propagation)
- Outputs `communities.json`: `{ communities: [{ id, label, nodeIds[], summary }], modularity }`

**New function: `compressToSupernodes(communities, graph)`**
- Collapses communities into supernodes with auto-generated summaries
- Sets `compressionState = "compressed"` on the run
- Saves condensed graph alongside original (original preserved)

**Commands:** `/memory compress <project>`, `/memory expand <run-id>`

### Phase 5: Archetypes
**Value: Medium-High | Cost: High | Risk: Medium**

**New function: `detectArchetypes(brainDir)`**
- Scans all uncompressed runs across all projects
- Collects node label sets per run
- Computes MinHash signatures for each run's node set
- Uses LSH to find label sets that appear in ≥3 distinct projects
- Promotes to archetypes in `brain-meta.json`

**Command:** `/memory archetypes`

### Phase 6: Advanced (Future)
- WL graph isomorphism for structural equivalence
- `/memory fuse` with meaningful diff output
- Sub-node expansion from compressed supernodes
- Semantic search across the compressed brain

---

## 5. Conflict Resolution

| Conflict | Decision | Rationale |
|---|---|---|
| **Filesystem layout** | **Tree wins** (3-level: Root→Project→Run) | Simple, predictable, matches current structure. Fractal's self-similar hierarchy exists as analytical metadata, not physical nesting. Infinite filesystem recursion adds complexity without benefit. |
| **Staleness vs Temperature** | **Merge into one**: temperature drives staleness | Avoids two separate aging systems. Temperature buckets (hot/warm/cold) are intuitive and actionable. Cold runs with high age get additional decay toward 1.0. |
| **Version obsoletion (transitive update)** | **Simplify to rank-based** (Tree's idea, simplified) | Proposal 1's transitive update requires mutating all older siblings on every save — expensive and error-prone. Rank-based obsoletion (`rank/totalRuns`) is stateless, computable on-the-fly, and produces the same gradient. |
| **Pinned runs** | **Tree's pin/unpin** adopted as-is | Simple boolean override. Works. No reason to change it. |
| **30-day archive** | **Tree's archive** adopted as-is | Standard practice. Provides safety net. Fractal's compression is about knowledge preservation, not physical file retention — they serve different purposes. |
| **Archetypes** | **Fractal's approach** adopted | Tree never addressed cross-project patterns. This is genuinely useful and the MinHash/LSH approach is practical for the scale involved (tens to hundreds of runs, not millions). |
| **Community detection** | **Hybrid: Louvain/Leiden for community detection; postpone WL isomorphism** | WL graph isomorphism is overkill for this scale. Simple community detection on node co-occurrence graphs is sufficient. Reserve WL isomorphism for Phase 6 if needed. |
| **LATEST copies at project root** | **Keep** (Tree's backward compat strategy) | Essential for zero-breakage migration. All existing consumers (index.md rebuild, `brainContextForCwd`, `handleLoad`) rely on artifacts at the project root. The run-level `runs/` directory is additive underneath. |
| **Compression naming** | **Fractal's state machine**: `raw → communities → compressed → frozen` | Clear progression. Each state implies what you can do next. `frozen` is the terminal state — read-only, can be expanded back to raw. |

---

## 6. Minimal Viable Product — This Session

**Goal:** Ship Phase 1 — Run-Level Storage. This is the foundation everything else builds on, delivers immediate value (version history), and is entirely backward compatible.

### Specific changes to `graphify.ts`:

**A) Modify `handleSave()`:**
```typescript
// After computing destDir, nodeCount, edgeCount, meta:
const runId = new Date().toISOString().replace(/:/g, '-');
const runDir = path.join(destDir, "runs", runId);
fs.mkdirSync(runDir, { recursive: true });

// Copy artifacts into runDir (not destDir)
// ... same copy logic, target = runDir ...

// Write run-meta.json
const runMeta = {
  runId, savedAt: new Date().toISOString(),
  nodeCount: parseInt(String(nodeCount)) || 0,
  edgeCount: parseInt(String(edgeCount)) || 0,
  artifactCount: copied,
  pruneScore: { staleness: 0, redundancy: 0, lowSignal: 0, obsoletion: 0, pinned: false },
  totalPruneScore: 0,
  temperature: "hot",
  lastAccessedAt: new Date().toISOString(),
  accessCount: 0,
  compressionState: "raw",
};
fs.writeFileSync(path.join(runDir, "run-meta.json"), JSON.stringify(runMeta, null, 2));

// THEN copy to project root for LATEST (existing behavior)
// ... existing copy-to-destDir logic ...

// Extend meta.json
meta.schemaVersion = 2;
meta.runCount = (existingMeta?.runCount ?? 0) + 1;
meta.lastRunId = runId;
```

**B) Add `/memory runs` subcommand:**
```typescript
case "runs":
  await handleRuns(ctx, pi, rest);
  break;
```

**C) Add `handleRuns()` function:**
```typescript
async function handleRuns(ctx, pi, projectName) {
  const slug = slugify(projectName || path.basename(ctx.cwd));
  const runsDir = path.join(BRAIN_DIR, slug, "runs");
  if (!fs.existsSync(runsDir)) { ctx.ui.notify("No runs yet.", "info"); return; }
  
  const runs = fs.readdirSync(runsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const meta = JSON.parse(fs.readFileSync(path.join(runsDir, d.name, "run-meta.json"), "utf-8"));
      return `- \`${d.name}\` — ${meta.nodeCount} nodes, ${meta.edgeCount} edges, ${meta.temperature ?? "?"}`;
    });
  
  pi.sendUserMessage(`## Runs for ${projectName}\n\n${runs.join("\n")}`);
}
```

**D) Extend `handleLoad()`** to accept `--run <id>`:
```typescript
case "load":
  const runMatch = rest.match(/^(.+?)\s+--run\s+(\S+)$/);
  if (runMatch) {
    await handleLoadRun(ctx, pi, runMatch[1], runMatch[2]);
  } else {
    await handleLoad(ctx, pi, rest);
  }
  break;
```

**Estimated effort:** ~60 new lines, ~15 modified lines. ~20 minutes of implementation.

**Validation:** Run `/memory save` twice on the same project, then `/memory runs <project>` — should show two distinct run IDs. `/memory load <project>` still loads LATEST. Existing index.md rebuild still works.
