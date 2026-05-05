---
type: community
cohesion: 0.33
members: 6
---

# Run Storage & Filesystem

**Cohesion:** 0.33 - loosely connected
**Members:** 6 nodes

## Members
- [[3-Level Hierarchy (Rootâ†’Projectâ†’Run)]] - rationale - 01-tree-memory-proposal.md
- [[Conflict Resolution Decisions]] - rationale - 03-unified-plan.md
- [[Filesystem Layout (runs directory)]] - rationale - 01-tree-memory-proposal.md
- [[Phase 1 Run-Level Storage (MVP)]] - rationale - 03-unified-plan.md
- [[PinUnpin Mechanism]] - rationale - 01-tree-memory-proposal.md
- [[graphify.ts Code Changes]] - rationale - 03-unified-plan.md

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Run_Storage_&_Filesystem
SORT file.name ASC
```

## Connections to other communities
- 2 edges to [[_COMMUNITY_Pruning & Score System]]
- 1 edge to [[_COMMUNITY_Knowledge Curation Principles]]
- 1 edge to [[_COMMUNITY_Graph Isomorphism & Fractal Math]]

## Top bridge nodes
- [[Conflict Resolution Decisions]] - degree 4, connects to 2 communities
- [[PinUnpin Mechanism]] - degree 3, connects to 1 community