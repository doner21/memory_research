---
type: overview/architecture
llm_instructions: "This is the top-level architecture diagram. Use it to orient yourself before diving into any layer or community. The layers are ordered by data flow: Storage → Scoring → Temperature → Compression → Archetypes."
---

# Architecture at a Glance

> The big picture — how the system fits together from top to bottom.

## 🏗️ System Stack (5 Layers)

```
┌────────────────────────────────────────────────────────────┐
│                   LAYER 5: ARCHETYPES                      │
│   "The Pattern Finder"                                     │
│   Looks across all projects for recurring blueprints       │
│   Uses: WL graph isomorphism, MinHash+LSH, FCA             │
├────────────────────────────────────────────────────────────┤
│                   LAYER 4: COMPRESSION                     │
│   "The Archivist"                                          │
│   Summarizes cold runs into compact forms                  │
│   Uses: Community detection, supernode aggregation,        │
│         fractal dimension, coherence scoring               │
├────────────────────────────────────────────────────────────┤
│                   LAYER 3: TEMPERATURE                     │
│   "The Thermometer"                                        │
│   Tracks hot/warm/cold — access frequency over time        │
│   Uses: HeatTracker class, Ebbinghaus decay curve,         │
│         LRU-inspired eviction                              │
├────────────────────────────────────────────────────────────┤
│                   LAYER 2: SCORING                         │
│   "The Judge"                                              │
│   Evaluates every run on 5 independent signals            │
│   Uses: Staleness, redundancy, low-signal, obsoletion,     │
│         pin override                                       │
├────────────────────────────────────────────────────────────┤
│                   LAYER 1: STORAGE                         │
│   "The Filing Cabinet"                                     │
│   3-level hierarchy: Root → Project → Run                 │
│   Uses: Filesystem directories, JSON metadata,             │
│         .archive/ for grace-period storage                 │
└────────────────────────────────────────────────────────────┘
```

## 🧠 What Lives in Each Layer

### Layer 1 — Storage
> **Core question:** *Where does data live?*

```
~/.pi/graphify-brain/
├── index.md                  ← Global brain index
├── brain-meta.json           ← Global state (HeatTracker, archetypes)
├── {project-slug}/
│   ├── _PROJECT.md           ← Project overview note
│   ├── runs/
│   │   ├── {run-id}/
│   │   │   ├── graph.json    ← Full graph data
│   │   │   ├── GRAPH_REPORT.md
│   │   │   └── wiki/         ← This wiki!
│   │   └── ...
│   └── ...
└── .archive/                 ← Grace-period storage before deletion
```

### Layer 2 — Scoring
> **Core question:** *What stays and what goes?*

Each run gets scored on **5 independent signals**:
1. **Staleness** — How old is it? (exponential decay)
2. **Redundancy** — Is it a duplicate? (SimHash + Jaccard)
3. **Low Signal** — Is it too short or noisy? (content threshold)
4. **Obsoletion** — Has it been superseded? (version tracking)
5. **Pin Override** — Has someone protected it? (manual flag)

Scores are summed into a single prune score. Runs above threshold get flagged for pruning.

### Layer 3 — Temperature
> **Core question:** *What's active right now?*

The `HeatTracker` class maintains a temperature for every run:
- **🔥 Hot** — Accessed recently, high priority
- **☀️ Warm** — Accessed a while ago, medium priority
- **❄️ Cold** — Not accessed in a long time, candidate for compression

Temperature decays using an **Ebbinghaus forgetting curve** — decay is fast at first, then slows down.

### Layer 4 — Compression
> **Core question:** *How do we make old stuff small without losing the shape?*

When a run is cold enough, it becomes eligible for compression:
1. **Community detection** (Louvain/Leiden algorithm) groups related nodes
2. **Supernode aggregation** replaces each community with a summary node
3. **Coherence scoring** decides if the compression preserved meaning
4. **Fractal dimension** measures whether the compressed version still looks like the original

The result: a run that was 1,000 nodes becomes 50 summary nodes — 95% smaller, still structurally meaningful.

### Layer 5 — Archetypes
> **Core question:** *What patterns keep showing up?*

Across all projects, the system looks for:
- **Same structure, different content** — e.g., "you always build a frontend+backend+database"
- **Same concepts, different names** — e.g., "HeatTracker here is like the TemperatureService over there"
- **Recurring design patterns** — WL graph isomorphism detects structural similarity

## 🔄 Data Flow

```
Human runs /graphify
       │
       ▼
Layer 1: STORAGE — Run saved to brain
       │
       ▼
Layer 2: SCORING — Run evaluated on 5 signals
       │
       ▼
Layer 3: TEMPERATURE — HeatTracker updates
       │
       ▼
Layer 4: COMPRESSION (only if cold + eligible)
       │
       ▼
Layer 5: ARCHETYPES (periodic, cross-project)
```

## 🌉 Bridge Nodes (Connections Between Communities)

These are the most important nodes for understanding how communities relate:

1. **`graphify-brain Memory System`** — bridges Architecture ↔ Pruning (highest betweenness)
2. **`Pi Coding Agent Harness`** — bridges Architecture ↔ Implementations
3. **`Pruning System (5-Signal Score)`** — bridges Pruning ↔ Architecture ↔ Graphify Skill
4. **`graphify.ts Extension`** — bridges Implementations ↔ everything (most connected node)

---

## Quick reference

| Concept | Layer | Human analogy |
|---------|-------|---------------|
| Run | Storage | One snapshot of a knowledge graph |
| Prune score | Scoring | A report card for each snapshot |
| Heat | Temperature | How recently you opened a file |
| Compression | Compression | Turning a book into a detailed abstract |
| Archetype | Archetypes | "Oh, you're building another web app" |
| Pin | Scoring | A sticky note saying "DO NOT DELETE" |
| Grace period | Storage | 30-day holding zone before deletion |
