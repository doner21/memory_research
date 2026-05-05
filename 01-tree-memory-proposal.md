# TREE MEMORY PROPOSAL: Memory as a Tree for Graphify-Brain

*Researcher subagent — paradigm: hierarchical, curated, pruned*

---

## Research Foundation

| Concept | Source | Key Insight |
|---|---|---|
| **Zettelkasten** (Niklas Luhmann) | Wikipedia | Organic growth works, but only with deliberate linking and curation — cards that aren't connected die |
| **Personal Knowledge Base data models** | Wikipedia (Stephen Davies) | PKBs can be structured as *tree, graph, tree+graph, spatially, or categorically* — we want **tree+graph** |
| **Forgetting Curve** (Ebbinghaus) | Wikipedia | Memory decays exponentially without reinforcement; spaced repetition counters this |
| **Cache eviction (LRU/SIEVE)** | Wikipedia | LRU is simple but effective: evict what hasn't been accessed longest |
| **Decision tree pruning** (alpha-beta) | Wikipedia | Prune nodes that don't affect outcomes; removes ~50%+ of search space |
| **Centrality (graph theory)** | Wikipedia | Degree, betweenness, eigenvector centrality → quantitative node importance scores |
| **Memory hierarchy** | Wikipedia | Fast+small ↔ slow+large; tiered storage by access frequency |

Core paradigm: **Tree organizes, graph connects.** The tree provides structural hierarchy for curation and pruning; the graph provides lateral connections for discovery.

---

## 1. TREE STRUCTURE

```
                           ┌──────────────────┐
                           │   ROOT: _INDEX    │  (brain index — always exists)
                           │   global canvas   │
                           └──────┬───────────┘
                 ┌────────────────┼────────────────┐
           ┌─────┴─────┐   ┌─────┴─────┐   ┌─────┴─────┐
           │ Project A  │   │ Project B  │   │ Project C  │  BRANCH: one per saved project
           │ (branch)   │   │ (branch)   │   │ (branch)   │
           └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
        ┌───────┼───────┐        │                │
   ┌────┴────┐ ┌───┴───┐ ┌───┴───┐        ┌──────┴──────┐
   │ Run v1  │ │ Run v2│ │Run v1 │        │ Run v1      │  TWIG: one per /graphify run
   │ (twig)  │ │(twig) │ │(twig) │        │ (twig)      │
   └────┬────┘ └───┬───┘ └───────┘        └──────┬──────┘
   ┌────┴────┐     │                         ┌───┴───┐
   │ report  │  ┌──┴───┐                     │ nodes │  LEAVES: individual artifacts
   │ nodes   │  │report│                     │ edges │
   │ edges   │  │ wiki │                     │ wiki  │
   └─────────┘  └──────┘                     └───────┘
```

**Depth: exactly 3 levels fixed** — Root → Project → Run → Artifacts. No deeper. This keeps traversal simple, pruning predictable, and the mental model clean.

### Mapping to existing filesystem:

| Tree Level | Filesystem Path | Description |
|---|---|---|
| **Root** | `~/.pi/graphify-brain/index.md` | Global brain index (already exists) |
| **Branch** | `~/.pi/graphify-brain/{project-slug}/` | One directory per project, contains `meta.json` + all runs |
| **Twig** | `~/.pi/graphify-brain/{project-slug}/runs/{run-id}/` | One per `/graphify` invocation, contains versioned artifacts |
| **Leaf** | `graph.json`, `GRAPH_REPORT.md`, `wiki/`, `obsidian/` | Actual knowledge artifacts inside each run |

**What changes from current structure:** Currently artifacts live flat inside `{project-slug}/`. The proposal nests them one level deeper under `runs/{run-id}/` to enable versioning, so newer graph runs supersede older ones.

---

## 2. PRUNING RULES

Five pruning signals, each scored 0.0–1.0, combined into a **prune_score**:

```
prune_score = w₁·staleness + w₂·redundancy + w₃·low_signal + w₄·obsoletion - w₅·pinned
```

| # | Signal | Weight | Mechanism | Threshold |
|---|---|---|---|---|
| 1 | **Staleness** | `w₁=0.35` | Days since `last_accessed`. Maps through sigmoid: score = `1 - e^(-λ·days)`. After 90 days → score ≈ 0.95 | N days configurable (default 90) |
| 2 | **Redundancy** | `w₂=0.25` | SimHash on node labels + edge sets between runs. If two runs share >80% node overlap, the older is redundant | 0.8 Jaccard threshold |
| 3 | **Low signal** | `w₃=0.20` | Nodes with degree < 2 in the graph → leaf nodes that don't connect. Project with 0 run artifacts → empty branch | degree ≤ 1 → flagged |
| 4 | **Obsoletion** | `w₄=0.20` | Newer run of same project exists. The most recent run is always immune. Older runs: score increases with each newer version | v1 behind v3 → score 0.7; behind v10 → score 0.95 |
| 5 | **Pinned** (saves) | `w₅=0.99` | User explicitly pinned. `prune_score -= 0.99` → effectively immune unless user unpins | Binary: pinned = true |

**Pruning thresholds:**
- `prune_score > 0.75` → **archive** (move to `~/.pi/graphify-brain/.archive/{project-slug}/`)
- `prune_score > 0.90` → **delete** (after 30 days in archive grace period)
- Everything below stays

**What this looks like in practice:**
- A project run from 6 months ago with 0 queries against it → staleness 0.8 + low-signal → pruned
- An old run v1 when v3 exists → obsoletion 0.7 + staleness → likely pruned
- A pinned project even 2 years old → pinned flag neutralizes all scores → safe

---

## 3. CURATION SIGNALS (what stays)

These counterbalance pruning — each adds **keep_score**:

| Signal | How Tracked | Effect |
|---|---|---|
| **Connection count (degree centrality)** | Calculated from `graph.json` on save | High-degree nodes → project keeps high value |
| **Recency of access** | `last_accessed` timestamp updated on any `/memory load` or auto-injection into agent context | Recent access resets staleness counter |
| **User pinned** | Boolean in `meta.json` | Overrides all pruning (score penalty of -0.99) |
| **Connected to active project** | CWD matching in `brainContextForCwd()` | Active project's branch is always immune |
| **Cited in a query session** | Count of `/graphify query` hits per run, stored in `meta.json` | High query count → valuable reference material |

### Additional keep signals:

| Signal | Method | Rationale |
|---|---|---|
| **Cross-project bridges** | Nodes that appear in ≥2 projects (by label similarity) | Zettelkasten principle: high-connection notes are hubs |
| **Surprise connections** | Already computed by graphify's `surprising_connections()` | Cross-community edges are most valuable for discovery |
| **God nodes** | Already computed by graphify's `god_nodes()` | Top-N most central nodes → project is worth keeping |

---

## 4. IMPLEMENTATION

### 4a. New Commands

```typescript
/memory prune [--dry-run] [--aggressive]  // score everything, report candidates
/memory pin <project> [<run-id>]          // mark as immune from pruning
/memory unpin <project> [<run-id>]        // remove immunity
/memory gc                                // garbage collect: archive >0.75, delete >0.90
/memory stats                             // show tree: projects, runs, total size, prune scores
/memory keep <project> <run-id>           // explicitly preserve a specific old run
```

### 4b. New Metadata Schema (`meta.json`)

```jsonc
{
  "displayName": "my-project",
  "projectPath": "/abs/path/to/project",
  "savedAt": "2026-05-03T12:00:00Z",
  "nodeCount": 245,
  "edgeCount": 512,

  // ── NEW: tree metadata ──
  "version": 1,                          // incremented each /graphify run
  "pinned": false,
  "last_accessed": "2026-05-03T12:00:00Z",
  "query_count": 7,
  "cross_project_bridges": 3,
  "god_node_count": 5,
  "surprise_connection_count": 2,

  "runs": [
    {
      "run_id": "20260503-120000",
      "version": 3,
      "node_count": 245,
      "edge_count": 512,
      "pinned": false,
      "last_accessed": "2026-05-03T14:00:00Z",
      "query_hits": 2,
      "prune_score": 0.12,
      "redundant_with": null              // run_id if >80% overlap with another
    },
    {
      "run_id": "20260401-093000",
      "version": 2,
      "node_count": 230,
      "edge_count": 490,
      "pinned": false,
      "last_accessed": "2026-04-15T00:00:00Z",
      "query_hits": 5,
      "prune_score": 0.65,
      "redundant_with": "20260503-120000"
    }
  ]
}
```

### 4c. New Filesystem Structure

```
~/.pi/graphify-brain/
├── index.md                          # root index (exists)
├── _BRAIN_CANVAS.canvas              # global canvas (exists)
├── .archive/                         # NEW: archive for pruned projects
│   ├── old-project/                  # pruned project, grace period
│   │   ├── meta.json
│   │   ├── runs/
│   │   │   └── 2025...
│   │   └── archived_at.txt
│   └── ...
├── obsidian-vault/                   # wiki vault (exists)
│   ├── _INDEX.md
│   ├── _BRAIN_CANVAS.canvas
│   ├── _notes/
│   ├── project-a/                    # per-project notes
│   │   ├── _PROJECT.md
│   │   └── ... (obsidian notes)
│   └── project-b/
├── project-a/                        # branch
│   ├── meta.json                     # branch metadata (enhanced)
│   ├── GRAPH_REPORT.md               # LATEST (symlink or copy of latest run)
│   ├── graph.json                    # LATEST (symlink or copy of latest run)
│   ├── wiki/                         # LATEST
│   ├── obsidian/                     # LATEST
│   └── runs/                         # NEW: versioned run directory
│       ├── 20260503-120000_v3/       # twig — most recent
│       │   ├── GRAPH_REPORT.md
│       │   ├── graph.json
│       │   ├── wiki/
│       │   └── obsidian/
│       └── 20260401-093000_v2/       # twig — older version
│           ├── GRAPH_REPORT.md
│           ├── graph.json
│           ├── wiki/
│           └── obsidian/
└── project-b/
    └── ...
```

### 4d. Pruning Algorithm (pseudocode)

```typescript
function computePruneScore(run: RunMeta, project: ProjectMeta, now: Date): number {
  // 1. Staleness — exponential decay
  const daysSinceAccess = (now - run.last_accessed) / (1000 * 60 * 60 * 24);
  const staleness = 1 - Math.exp(-0.03 * daysSinceAccess); // λ=0.03, half-life ~23 days

  // 2. Redundancy — duplicate artifact detection via SimHash
  let redundancy = 0;
  if (run.redundant_with) redundancy = 0.85; // known duplicate
  // else compute Jaccard similarity of node IDs against sibling runs

  // 3. Low signal — degree centrality or artifact emptiness
  let lowSignal = 0;
  if (run.node_count < 5) lowSignal = 0.9;       // nearly empty graph
  else if (run.edge_count / run.node_count < 0.5) lowSignal = 0.5; // sparse

  // 4. Obsoletion — how far behind latest version
  const versionsBehind = project.version - run.version;
  const obsoletion = Math.min(1.0, versionsBehind * 0.2);

  // 5. Pinned — subtract large penalty
  const pinPenalty = (run.pinned || project.pinned) ? 0.99 : 0;

  const score = (0.35 * staleness) + (0.25 * redundancy) +
                (0.20 * lowSignal) + (0.20 * obsoletion) - pinPenalty;

  return Math.max(0, Math.min(1.0, score));
}
```

### 4e. Tree View for `/memory list`

```
/memory list →
  🌳 Global Brain (3 projects, 7 runs, 1.2MB)
  ├── 📌 my-project (pinned) — 3 runs, latest: v3
  │   ├── v3 (2026-05-03) ← LATEST [prune=0.00]
  │   ├── v2 (2026-04-01) [prune=0.65] ⚠
  │   └── v1 (2026-03-15) [prune=0.88] 🔴
  ├── other-project — 2 runs, latest: v2
  │   ├── v2 (2026-04-20) ← LATEST [prune=0.00]
  │   └── v1 (2026-03-01) [prune=0.72] ⚠
  └── .archive/ — 1 project
      └── deleted-project (archived 2026-02-01, expires 2026-03-01)
```

---

## 5. DESIGN PRINCIPLES

| Principle | Implementation |
|---|---|
| **Tree organizes, graph connects** | 3-level tree (root→branch→twig) for curation; graph.json for discovery |
| **Ebbinghaus forgetting curve** | Exponential staleness decay `1-e^(-λt)`; access resets the curve |
| **LRU eviction** | `last_accessed` is the strongest negative pruning signal |
| **Version obsoletion** | Newer runs automatically raise prune_score of older siblings |
| **Pin to preserve** | User override neutralizes all pruning signals |
| **Archive, don't delete** | 30-day archive grace period before permanent deletion |
| **Centrality as value signal** | God nodes, surprise connections, degree → high-value projects identified automatically |
| **Zettelkasten linking** | Cross-project bridge nodes are explicitly tracked and protected |
| **Backward compatible** | LATEST copies at branch root keep existing `/memory load` working; runs are additive |
| **Dry-run first** | `/memory prune` without `--force` shows candidates without acting |
