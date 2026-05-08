---
type: community/narrative
community_id: 3
graph_name: "Pruning & Temperature System"
size: 26
cohesion: 0.10
llm_instructions: "This is the evaluation and decay community. It contains the scoring system (5 signals), temperature tracking, and the theoretical foundations (Ebbinghaus, LRU). Bridge node 'Pruning System (5-Signal Score)' connects to Architecture, Implementation, and Graphify Skill communities."
tags: [community, pruning, temperature, scoring, decay]
---

# 🧹 Community 3: Pruning & Temperature — The Librarian

> **26 nodes (2 docs + 24 rationale) · Cohesion: 0.10 (loose — theory from many fields)**

## 🧍 For humans

**Analogy: The librarian who decides what to keep.**

This community is the **decision-maker** of the system. It has two jobs:

1. **Pruning** — Figuring out what to throw away (using 5 signals)
2. **Temperature** — Figuring out what's hot or cold (using the Ebbinghaus forgetting curve)

It draws ideas from **lots of different fields**:
- **Psychology:** The Ebbinghaus Forgetting Curve (how humans forget)
- **Computer Science:** LRU Cache Eviction (what computers do with old data)
- **Mathematics:** Jaccard Similarity (measuring overlap), SimHash (fingerprinting)
- **Library Science:** The idea of scoring and weeding collections

**The most important node** is `Pruning System (5-Signal Score)` — it's a bridge node that connects this community to 3 others: Architecture, Implementation, and the Graphify Skill. It has a betweenness score of 0.14, meaning it's one of the most structurally important concepts in the entire system.

## 🤖 For LLMs

### Subsystems

| Subsystem | Key Nodes | Purpose |
|-----------|-----------|---------|
| **Prune Scoring** | 5-Signal Score, Staleness, Redundancy, Low Signal, Obsoletion | Evaluate runs for deletion |
| **Temperature** | HeatTracker, Ebbinghaus, LRU/SIEVE | Track access frequency over time |
| **Dedup** | MinHash/LSH, Jaccard Similarity, SimHash | Find near-duplicate runs |
| **Theory** | Ebbinghaus, Cache Eviction, Formal Concept Analysis | Foundations |

### Bridge Nodes

| Node | Connects to | Degree |
|------|-------------|--------|
| `Pruning System (5-Signal Score)` | C3 ↔ C2, C0, C6 | 10 |
| `Cross-Project Archetypes` | C3 ↔ C5 (Design) | 7 |
| `HeatTracker (Temperature System)` | C3 ↔ C4 (HeatTracker class) | 8 |

### The Ebbinghaus Influence

The forgetting curve is the key insight here. Instead of simple LRU ("delete oldest first"), the temperature system uses **psychologically-informed decay**:
- Forgetting is fast initially, then slows
- This means a 1-day-old run and a 1-week-old run have very different temperatures
- But a 6-month-old run and a 12-month-old run are nearly the same temperature

### Key Source Files

| File | What it contains |
|------|-----------------|
| `01-tree-memory-proposal.md` | Prune scoring design, signal weights |
| `02-fractal-memory-proposal.md` | Temperature system, fractal decay model |
| `extensions/graphify.ts` | `computePruneScores()`, `decayTemperatures()` |

### Suggested Questions for an LLM

- *"The 'Pruning System (5-Signal Score)' bridges 3 communities — what happens if we change the signal weights?"*
- *"Why use Ebbinghaus decay instead of simple LRU?"* (see also [[../../04_DECISIONS/DECISION_temperature_over_lru\|Decision: Temperature vs LRU]])
- *"The 5 signals are independent — should any be combined or removed?"*
