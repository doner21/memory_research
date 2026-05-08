---
type: decision
date: 2026-05-01
author: Researcher subagent (tree proposal + fractal proposal)
status: accepted
alternatives:
  - "Pure graph (no hierarchy)" — rejected: no natural pruning boundary
  - "Pure tree (no lateral links)" — rejected: misses cross-project patterns
  - "Flat file store" — rejected: doesn't scale past ~100 files
llm_context: "This decision affects how storage, pruning, and compression work. Always reference this when designing new features that touch the filesystem."
graph_sources:
  - Tree Memory Proposal (01-tree-memory-proposal.md)
  - Fractal Memory Proposal (02-fractal-memory-proposal.md)
  - Unified Memory Management Plan (03-unified-plan.md)
---

# Decision: Tree + Graph Hybrid Architecture

## Context

We needed a memory architecture that supports two seemingly contradictory goals:

1. **Hierarchical curation** — pruning, pinning, archiving, garbage collection all work best when data has a parent-child structure
2. **Lateral discovery** — finding unexpected connections across projects requires a graph structure

Most systems pick one or the other. File systems are pure trees. Knowledge graphs are pure graphs. Neither alone solves both problems.

## Decision

**We chose both.** The architecture is a Tree + Graph hybrid:

```
TREE (for organization):           GRAPH (for discovery):
Root                               Node A ──relation──► Node B
├── Project A                        │                    │
│   ├── Run 1                        │                    │
│   ├── Run 2                        ▼                    ▼
│   └── ...                        Node C              Node D
├── Project B
└── ...
```

- The **Tree** is exactly 3 levels deep: Root → Project → Run. No deeper. This keeps pruning simple — you prune a branch, not individual leaves.
- The **Graph** is a networkx graph stored as `graph.json` inside each run. Edges can connect any nodes regardless of which project or run they belong to.

## Why not the alternatives

| Alternative | Why rejected |
|-------------|--------------|
| **Pure graph (no hierarchy)** | Pruning requires traversing the entire graph to find "leaf nodes." No natural boundary for archival. |
| **Pure tree (no lateral edges)** | The most interesting connections are cross-project — e.g., "this pattern in memory reaserch also appears in moss_audio." A tree can't represent that. |
| **Flat file store** | No structure at all. Works for ~50 files, becomes unmanageable past ~100. No versioning, no archive, no project grouping. |

## Consequences

**Positive:**
- Clear mental model for humans (tree for organization, graph for discovery)
- Pruning is O(branch) not O(all nodes) — much faster
- Cross-project archetype detection is natural (graph edges span projects)
- The 3-level limit prevents infinite nesting

**Negative:**
- Storage is duplicated (tree path + graph edges) — ~15% overhead on disk
- Adding a run requires updating both the tree (directory creation) and the graph (new nodes/edges)
- Two consistency checks needed instead of one

**Tradeoff accepted:** The 15% storage overhead is worth the architectural clarity. If storage becomes a concern, compression (Layer 4) handles it.

## Related

- [[../02_SYSTEM_LAYERS/LAYER_01_Storage|Layer 1: Storage — The Filing Cabinet]]
- [[../03_COMMUNITY_NARRATIVES/COMMUNITY_Design|Design Proposals — The Drawing Board]]
- [[../03_COMMUNITY_NARRATIVES/COMMUNITY_Architecture|Memory Architecture — The Blueprint]]
