# FRACTAL MEMORY PROPOSAL: A Self-Similar Compression & Curation System

*Researcher subagent — paradigm: self-similar, compressed, emergent*

---

## 0. Research Foundation

This proposal synthesizes the following research threads:

| Concept | Source | Application |
|---|---|---|
| **Formal Concept Analysis (FCA)** | Rudolf Wille, 1981; Birkhoff lattice theory | Self-similar concept hierarchy; every node = (objects, attributes) pair; natural zoom |
| **Fractal dimension on networks** | Box-covering method (Song et al.) | Validates self-similarity; quantifies compressibility of a graph |
| **Subgraph isomorphism (VF2)** | Cordella et al., 2004; NP-complete but practical | Detecting structurally identical subgraphs across projects |
| **Weisfeiler-Lehman (WL) graph kernel** | Shervashidze et al., 2011 | Iterative color refinement; fast canonical labeling for approximate isomorphism |
| **Locality-Sensitive Hashing (LSH) / MinHash** | Indyk & Motwani, 1998; Broder, 1997 | Fast semantic duplicate detection via Jaccard similarity on shingled labels |
| **Sparse Distributed Memory (SDM)** | Pentti Kanerva, 1988 | Holographic storage model; patterns stored distributed across address space; retrieval by similarity → archetype detection |
| **Hyperdimensional Computing (HDC/VSA)** | Kanerva, Plate, Gayler | High-dim vector representations where similarity = dot product; used for binding/compressing relational structures |
| **Graph summarization** | Supernode aggregation; Navlakha et al., 2008 | Collapse dense subgraphs into single representative nodes |
| **Graph canonization** | nauty/Traces (McKay), bliss | Deterministic canonical forms for exact isomorphism testing |
| **ARC cache algorithm** | Megiddo & Modha, 2003 | Adaptive replacement cache — balances recency and frequency for heat tracking |

---

## 1. FRACTAL STRUCTURE

### 1.1 The Core Insight: Every Level Mirrors Every Other Level

A fractal knowledge graph is **self-similar at all scales**. This means:

- **A node's summary** = the compressed essence of its children
- **A community's structure** = a miniature of the whole graph's structure
- **Zoom in** on any node and you see a subgraph that looks structurally similar to the parent
- **Zoom out** and you see the same pattern: hubs, bridges, peripheries

This is not just a metaphor. **Fractal dimension on networks** (box-covering method) provides a mathematical test: if the graph's fractal dimension `d_B` is consistent across box sizes, the graph is genuinely self-similar and compressible.

### 1.2 Formal Concept Analysis as the Fractal Scaffold

FCA provides the mathematical backbone. Every concept in a concept lattice is a pair **(A, B)** where:
- **A** (extent) = the set of objects belonging to the concept
- **B** (intent) = the set of attributes shared by those objects

The lattice is **naturally self-similar**: each node's children are more specific concepts (narrower extent, richer intent), and its parents are more general concepts (wider extent, sparser intent).

**Mapping to graphify-brain:**

```
FCA Concept        →  Graphify Node
─────────────────────────────────────
Extent (objects)   →  Child nodes this node summarizes
Intent (attributes)→  Key properties/edges/labels that define this node
Subconcept         →  Zooming into a collapsed node reveals its subgraph
Superconcept       →  Zooming out collapses a subgraph into a summary node
```

### 1.3 Fractal Organization Hierarchy

```
Level 0: BRAIN      (all projects, high-level archetypes, cross-project patterns)
Level 1: PROJECT    (one project graph: communities, god nodes, hyperedges)
Level 2: COMMUNITY  (Louvain/Leiden community: a subgraph of related nodes)
Level 3: NODE       (a single entity: file, function, concept)
Level 4: SUB-NODE   (if a node is expanded: its internal structure)
```

**Self-similarity invariant:** At every level, the structure is the same:
- Every level has `nodes`, `links`, `hyperedges`
- Every level has a `summary` (the compressed view)
- Every level has `god nodes` (most-connected hubs at that scale)
- Every level has a `temperature` (hot/warm/cold)

### 1.4 Implementation: Fractal Nodes

Extend the node schema in `graph.json`:

```typescript
interface FractalNode {
  id: string;
  label: string;
  // ... existing fields ...
  
  // Fractal fields
  level: 0 | 1 | 2 | 3 | 4;       // zoom level
  parent_id?: string;               // which node contains this (null at level 0)
  summary?: string;                 // compressed essence (auto-generated from children)
  compression_state: "expanded" | "summarized" | "frozen";
  subgraph_handle?: string;         // path to child subgraph on disk (lazy-loaded)
  archetype_id?: string;            // if this matches a known cross-project pattern
  temperature: number;              // 0.0 (cold) to 1.0 (hot)
  last_accessed: number;            // Unix timestamp
  access_count: number;            // total access count
}
```

**The self-similarity invariant** is enforced structurally: any node with `compression_state: "expanded"` has a child subgraph (stored as `subgraph_handle`). That child subgraph has the identical JSON schema as the parent. This is the fractal property — the data structure at level N is the same as level N+1.

---

## 2. COMPRESSION via SELF-SIMILARITY

### 2.1 Structural Isomorphism Detection (Shape Duplicates)

**Problem:** Two subgraphs in different projects have the same shape — same node types, same edge types, same topology. They should be merged or cross-referenced.

**Algorithm: Weisfeiler-Lehman Iterative Color Refinement**

1. Assign each node an initial color based on its label hash
2. Iterate: each node's new color = hash(previous color, multiset of neighbor colors)
3. After k iterations, each node has a color that encodes its k-hop neighborhood
4. Two subgraphs with matching color multisets are approximately isomorphic

This runs in **O(k·m)** time (linear in edges), making it practical for graphs with hundreds of nodes.

**Exact verification** (optional, for high-confidence matches): use **VF2 algorithm** (O(n!·n) worst-case but fast on sparse graphs typical of knowledge graphs) to confirm isomorphism between WL-matched candidates.

**Implementation:**

```typescript
function wlColorRefinement(graph: FractalGraph, iterations: number = 3): Map<string, string> {
  let colors = new Map<string, string>();
  
  // Initialize: color = hash(node.label)
  for (const node of graph.nodes) {
    colors.set(node.id, hashString(node.label));
  }
  
  for (let i = 0; i < iterations; i++) {
    const newColors = new Map<string, string>();
    for (const node of graph.nodes) {
      const neighborColors = graph.links
        .filter(l => l.source === node.id || l.target === node.id)
        .map(l => colors.get(l.source === node.id ? l.target : l.source))
        .sort();
      const combined = colors.get(node.id) + "|" + neighborColors.join(",");
      newColors.set(node.id, hashString(combined));
    }
    colors = newColors;
  }
  return colors;
}
```

### 2.2 Semantic Similarity Detection (Meaning Duplicates)

**Problem:** Two concepts from different projects mean the same thing but have different names (e.g., "verifier" vs "validator" vs "checker").

**Algorithm: MinHash + LSH for label similarity**

1. **Shingle** each node's label + description into n-grams (e.g., character 3-grams)
2. **MinHash**: compute k independent hash functions; the signature = min hash value for each
3. **LSH banding**: split signatures into b bands of r rows; band-match = candidate pair
4. **Verify** candidate pairs with Jaccard similarity > threshold

```typescript
function detectSemanticDuplicates(
  nodes: FractalNode[],
  threshold: number = 0.85
): Array<[string, string, number]> {
  // Option A: Fast - MinHash + LSH on label n-grams
  const shingles = nodes.map(n => charNGrams(n.label, 3));
  const signatures = shingles.map(s => minHashSignature(s, 128));
  const candidates = lshBandMatch(signatures, bands=16, rows=8);
  
  // Option B: Accurate - embedding cosine similarity (if embeddings available)
  const pairs: Array<[string, string, number]> = [];
  for (const [i, j] of candidates) {
    const sim = jaccardSimilarity(shingles[i], shingles[j]);
    if (sim > threshold) {
      pairs.push([nodes[i].id, nodes[j].id, sim]);
    }
  }
  return pairs;
}
```

### 2.3 Scale Compression (Multi-Resolution Zoom)

**Problem:** A subgraph is complex. Keep the high-level summary and collapse detail, but allow expansion on demand.

**Algorithm: Graph Summarization via Supernode Aggregation**

1. Identify dense subgraphs (communities from Louvain/Leiden, or hyperedge groups)
2. For each community, create a **supernode** with:
   - `label` = most central node's label + " (community)"
   - `summary` = LLM-generated 2-sentence summary of the community
   - `subgraph_handle` = pointer to the frozen subgraph JSON
   - `edge_count` = number of internal edges (for weight display)
   - `node_count` = number of internal nodes
3. Replace old community nodes + edges with the single supernode
4. Preserve **boundary edges** (edges crossing community boundary) as edges to/from supernode

**Compression ratio** = (internal_nodes + internal_edges) / (1 supernode + boundary_edges)

### 2.4 Runtime "Freeze" Compression (Temperature-Driven)

**Temperature scale:**

| State | Temperature | Meaning | Action |
|---|---|---|---|
| 🔥 **Hot** | t > 0.7 | Actively explored in last 7 days | Keep fully expanded |
| 🌡️ **Warm** | 0.3 ≤ t ≤ 0.7 | Touched occasionally | Keep summary + key edges; collapse detail |
| ❄️ **Cold** | t < 0.3 | Dormant > 30 days | Single compressed node; write frozen subgraph to disk |
| 💀 **Frozen** | t = 0.0 | Never accessed or explicitly archived | Metadata only; detail may be garbage-collected |

**Temperature formula (decay function):**

```typescript
function computeTemperature(
  lastAccessed: number,      // Unix timestamp
  accessCount: number,
  firstSaved: number,        // Unix timestamp
  now: number = Date.now()
): number {
  const daysSinceAccess = (now - lastAccessed) / (1000 * 60 * 60 * 24);
  const totalDays = (now - firstSaved) / (1000 * 60 * 60 * 24);
  
  // Recency factor: exponential decay, half-life 14 days
  const recency = Math.exp(-daysSinceAccess / 20); 
  
  // Frequency factor: log-scaled access count, normalized
  const frequency = Math.min(1.0, Math.log2(accessCount + 1) / Math.log2(50));
  
  // Age factor: newer projects get a slight boost
  const ageFactor = Math.max(0.5, 1.0 - totalDays / 365);
  
  return recency * frequency * ageFactor;
}
```

---

## 3. CURATION via COHERENCE

### 3.1 What Stays Expanded vs. Compressed

The curation policy follows a **coherence maximization** principle: keep expanded precisely what helps the agent (or user) answer questions. Compress what hasn't been relevant.

| Trigger | Action |
|---|---|
| Node/community accessed via `/memory load` or injected into agent prompt | Temperature ↑, mark hot |
| Node/community appears in agent's working context (via `brainContextForCwd`) | Temperature ↑, mark hot |
| Node/community NOT accessed for 30 days | Temperature decays, mark cold → auto-freeze |
| User explicitly runs `/memory compress` | Force-compress all warm+cold; report what was frozen |
| Cross-project pattern detected (same subgraph shape in ≥3 projects) | Promote to **archetype** — permanent, never frozen |
| User runs `/memory expand <node>` | Thaw a frozen subgraph, restore detail |

### 3.2 Archetypes: Cross-Project Patterns That Never Die

**Definition:** A subgraph pattern that re-emerges across ≥3 different projects becomes an **archetype**. Archetypes are:

- Stored at **brain level** (level 0), not inside any single project
- **Never frozen** — they are permanent reference patterns
- **Automatically matched** when new projects are saved: if a community matches an archetype with WL similarity > 0.8, it's tagged with `archetype_id`

**Archetype examples from real graphify-brain data:**
- "Build Toolchain" pattern: config file → plugin → output → dev server
- "PEV Workflow" pattern: plan → execute → verify → report
- "Validation System" pattern: input → validator → pass/fail → report
- "3D Scene" pattern: scene → mesh → material → renderer
- "Bootstrap Entry" pattern: entry point → root component → render call

```typescript
interface Archetype {
  id: string;
  name: string;
  description: string;
  wl_signature: string;          // Weisfeiler-Lehman color multiset signature
  subgraph_template: FractalGraph; // normalized template subgraph
  member_count: number;
  member_projects: string[];
  discovered_at: number;
}
```

### 3.3 Coherence Scoring

A subgraph's **coherence score** determines whether it should stay expanded:

```typescript
function coherenceScore(graph: FractalGraph, subgraph: FractalGraph): number {
  const internalEdges = subgraph.links.length;
  const internalNodes = subgraph.nodes.length;
  const boundaryEdges = countBoundaryEdges(graph, subgraph);
  
  // Density: how interconnected is this subgraph internally?
  const maxEdges = internalNodes * (internalNodes - 1);
  const density = maxEdges > 0 ? internalEdges / maxEdges : 0;
  
  // Cohesion: internal edges vs. edges leaving the subgraph
  const cohesion = boundaryEdges > 0 
    ? internalEdges / (internalEdges + boundaryEdges) 
    : 1.0;
  
  // Combined: dense AND cohesive subgraphs are good compression candidates
  // (they form natural conceptual units)
  return density * 0.5 + cohesion * 0.5;
}
```

High coherence → good candidate for compression (it's a natural conceptual unit).  
Low coherence → probably shouldn't be compressed (it's a diffuse boundary).

---

## 4. IMPLEMENTATION PLAN

### 4.1 New Commands

```typescript
// ── /memory zoom <level> ─────────────────────────────────────
// Zoom the current project's graph view to a specific fractal level
// /memory zoom brain   → level 0 (all projects, archetypes)
// /memory zoom project → level 1 (current project)
// /memory zoom community <id> → level 2
// /memory zoom node <id> → level 3

// ── /memory compress ─────────────────────────────────────────
// Auto-freeze cold subgraphs, report compression stats
// Options: --aggressive (freeze warm too), --dry-run (report only)

// ── /memory expand <node-id> ──────────────────────────────────
// Thaw a frozen/compressed subgraph back to expanded state

// ── /memory fuse <node-a> <node-b> ────────────────────────────
// Manually merge two semantically identical nodes

// ── /memory archetypes ────────────────────────────────────────
// List all detected cross-project archetypes

// ── /memory stats ─────────────────────────────────────────────
// Show brain stats: total nodes, compression ratio, temperatures,
// archetype count, disk usage
```

### 4.2 Data Storage Layout

```
~/.pi/graphify-brain/
├── index.md                        # existing: brain index
├── brain-meta.json                 # NEW: brain-level metadata, archetypes, heat map
├── archetypes/                     # NEW: cross-project permanent patterns
│   ├── build-toolchain.json
│   ├── pev-workflow.json
│   └── ...
├── frozen/                         # NEW: compressed subgraphs
│   ├── icosahedron-vite/
│   │   ├── comm_14.json
│   │   └── comm_26.json
│   └── ...
├── <project-slug>/                 # existing: per-project
│   ├── meta.json                   # EXTENDED: add fractal_state, temperature
│   ├── graph.json                  # EXTENDED: add FractalNode fields
│   ├── GRAPH_REPORT.md            # existing
│   ├── wiki/                       # existing
│   └── obsidian/                   # existing
└── obsidian-vault/                 # existing: central wiki vault
```

### 4.3 Core Algorithm Implementations

#### A. Weisfeiler-Lehman Color Refinement

```typescript
function wlHash(graph: FractalGraph, iterations: number = 3): Map<string, string> {
  let colors = new Map<string, string>();
  
  // Init: hash each node's label + file_type
  for (const n of graph.nodes) {
    colors.set(n.id, simpleHash(n.label + "|" + (n.file_type || "")));
  }
  
  // Build adjacency for fast lookup
  const adj = new Map<string, string[]>();
  for (const n of graph.nodes) adj.set(n.id, []);
  for (const l of graph.links) {
    adj.get(l.source)?.push(l.target);
    adj.get(l.target)?.push(l.source);
  }
  
  for (let i = 0; i < iterations; i++) {
    const next = new Map<string, string>();
    for (const n of graph.nodes) {
      const neighborColors = (adj.get(n.id) || [])
        .map(id => colors.get(id) || "0")
        .sort();
      next.set(n.id, simpleHash(colors.get(n.id) + "|" + neighborColors.join(",")));
    }
    colors = next;
  }
  return colors;
}
```

#### B. Heat Tracking

```typescript
class HeatTracker {
  private heatmap: Map<string, HeatEntry> = new Map();
  private storagePath: string;
  
  constructor(brainDir: string) {
    this.storagePath = path.join(brainDir, "heatmap.json");
    this.load();
  }
  
  touch(nodeId: string): void {
    const entry = this.heatmap.get(nodeId) || {
      node_id: nodeId,
      access_count: 0,
      last_accessed: Date.now(),
      first_saved: Date.now(),
    };
    entry.access_count++;
    entry.last_accessed = Date.now();
    this.heatmap.set(nodeId, entry);
  }
  
  temperature(nodeId: string): number {
    const entry = this.heatmap.get(nodeId);
    if (!entry) return 0;
    return computeTemperature(
      entry.last_accessed, entry.access_count, entry.first_saved
    );
  }
  
  getColdNodes(threshold: number = 0.3): string[] {
    const now = Date.now();
    return [...this.heatmap.entries()]
      .filter(([id, e]) => computeTemperature(e.last_accessed, e.access_count, e.first_saved, now) < threshold)
      .map(([id]) => id);
  }
  
  save(): void {
    fs.writeFileSync(this.storagePath, JSON.stringify([...this.heatmap.values()], null, 2));
  }
  
  load(): void {
    if (fs.existsSync(this.storagePath)) {
      const data = JSON.parse(fs.readFileSync(this.storagePath, "utf-8"));
      for (const entry of data) {
        this.heatmap.set(entry.node_id, entry);
      }
    }
  }
}
```

#### C. Cross-Project Archetype Detection

```typescript
async function detectArchetypes(
  pi: ExtensionAPI,
  brainDir: string
): Promise<Archetype[]> {
  const projects = loadAllProjects(brainDir);
  const allSignatures: Array<{
    project: string;
    communityId: number;
    signature: string;
    subgraph: FractalGraph;
  }> = [];
  
  // Extract community signatures from all projects
  for (const [projName, graph] of projects) {
    const communities = extractCommunities(graph);
    for (const comm of communities) {
      const nodeIds = graph.nodes
        .filter(n => n.community === comm.id)
        .map(n => n.id);
      allSignatures.push({
        project: projName,
        communityId: comm.id,
        signature: subgraphSignature(graph, nodeIds),
        subgraph: { nodes: graph.nodes.filter(n => nodeIds.includes(n.id)), 
                     links: graph.links.filter(l => nodeIds.includes(l.source) && nodeIds.includes(l.target)) },
      });
    }
  }
  
  // Group by signature (identical signatures = isomorphic subgraphs)
  const groups = new Map<string, typeof allSignatures>();
  for (const sig of allSignatures) {
    const existing = [...groups.keys()].find(k => 
      signatureSimilarity(k, sig.signature) > 0.8
    );
    const key = existing || sig.signature;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(sig);
  }
  
  // Filter to archetypes (patterns appearing in ≥3 projects)
  const archetypes: Archetype[] = [];
  for (const [sig, members] of groups) {
    const uniqueProjects = new Set(members.map(m => m.project));
    if (uniqueProjects.size >= 3) {
      archetypes.push({
        id: `archetype_${simpleHash(sig)}`,
        name: `Pattern-${uniqueProjects.size}projects`,
        description: `Recurring pattern across ${uniqueProjects.size} projects`,
        wl_signature: sig,
        subgraph_template: members[0].subgraph,
        member_count: uniqueProjects.size,
        member_projects: [...uniqueProjects],
        discovered_at: Date.now(),
      });
    }
  }
  
  return archetypes;
}
```

### 4.4 Integration into the Agent Loop

```
session_start
  └─ rebuildBrainIndex()           // existing
  └─ loadHeatmap()                 // NEW: load temperature data
  └─ autoFreezeColdNodes()         // NEW: compress cold subgraphs

before_agent_start
  └─ brainContextForCwd()          // existing: inject relevant graph
  └─ injectActiveArchetypes()      // NEW: inject matching archetypes
  └─ touchNode(projectNodeId)      // NEW: increment heat
  
memory save
  └─ save project graph            // existing
  └─ detectArchetypes()            // NEW: check for new patterns
  └─ updateHeatmap()               // NEW: mark new nodes as warm

memory compress
  └─ autoFreezeAllCold()           // NEW: batch freeze
  └─ reportCompressionStats()      // NEW: show what was frozen
  
memory zoom <level>
  └─ switchActiveZoomLevel()       // NEW: change context injection granularity
```

### 4.5 Compression Ratio Estimation

For the existing icosahedron-vite graph (222 nodes, 278 edges, 33 communities):

- Average community size: ~6.7 nodes
- If we freeze cold communities (let's say 20 of 33 are cold after 30 days):
  - Frozen: 20 supernodes replacing ~134 nodes + ~120 internal edges
  - Before: 134 nodes + 120 edges = 254 items
  - After: 20 supernodes = 20 items
  - **Compression ratio: ~12.7:1** for frozen communities
- Brain total: ~10% reduction in node count, ~30% in edge count

For a mature brain with 20+ projects and cross-project archetype merging, expect **40-60% total compression** after deduplication.

---

## 5. SUMMARY OF RECOMMENDATIONS

### Phase Plan

| Phase | What | Commands |
|---|---|---|
| **1: Foundation** | Add `FractalNode` fields to graph.json, implement `HeatTracker`, `/memory stats` | stats |
| **2: Compression** | `wlHash()`, `compressCommunity()`, `/memory compress`, `/memory expand` | compress, expand |
| **3: Fractal Navigation** | `/memory zoom` for seamless scale transitions, `FractalGraphView` | zoom |
| **4: Archetypes** | `detectArchetypes()`, `/memory archetypes`, `/memory fuse` | archetypes, fuse |

### Key Design Principles
- **Backward compatible**: existing `graph.json` and `meta.json` work unchanged; fractal fields are additive
- **Lazy loading**: frozen subgraphs are stored on disk, only loaded on `/memory expand`
- **Deterministic hashing**: all signatures use `simpleHash()` (FNV-1a variant) for reproducibility
- **No external dependencies**: WL hashing, MinHash, and temperature decay are all ~50 lines of pure TypeScript
- **LLM-optional compression**: summaries can fall back to template strings ("Community of N nodes about X") when LLM is unavailable
