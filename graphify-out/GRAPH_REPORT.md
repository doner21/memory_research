# Graph Report - .  (2026-05-05)

## Corpus Check
- Corpus is ~31,428 words - fits in a single context window. You may not need a graph.

## Summary
- 183 nodes · 372 edges · 8 communities
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.76)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_graphify.ts Core Implementation|graphify.ts Core Implementation]]
- [[_COMMUNITY_Test Bundle & Brain Utilities|Test Bundle & Brain Utilities]]
- [[_COMMUNITY_Memory System Architecture|Memory System Architecture]]
- [[_COMMUNITY_Pruning & Temperature System|Pruning & Temperature System]]
- [[_COMMUNITY_HeatTracker Class|HeatTracker Class]]
- [[_COMMUNITY_Design Proposals (Tree+Fractal)|Design Proposals (Tree+Fractal)]]
- [[_COMMUNITY_Graphify Skill & Knowledge Graph|Graphify Skill & Knowledge Graph]]
- [[_COMMUNITY_Obsidian Vault Integration|Obsidian Vault Integration]]

## God Nodes (most connected - your core abstractions)
1. `graphify.ts Extension (1682 lines)` - 15 edges
2. `slugify()` - 13 edges
3. `HeatTracker` - 12 edges
4. `handleGc()` - 12 edges
5. `runDirFor()` - 11 edges
6. `graphify-brain Memory System` - 11 edges
7. `loadRunMeta()` - 10 edges
8. `computePruneScores()` - 10 edges
9. `resolveProjectRunFromArgs()` - 10 edges
10. `handleKeep()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `graphify.ts Extension (1682 lines)` --implements--> `/memory prune Command`  [EXTRACTED]
  extensions/graphify.ts → TUTORIAL.md
- `Tree Memory Proposal` --semantically_similar_to--> `Fractal Memory Proposal`  [INFERRED] [semantically similar]
  01-tree-memory-proposal.md → 02-fractal-memory-proposal.md
- `graphify.ts Extension (1682 lines)` --implements--> `HeatTracker (Temperature System)`  [EXTRACTED]
  extensions/graphify.ts → 02-fractal-memory-proposal.md
- `graphify.ts Extension (1682 lines)` --implements--> `/memory list Command`  [EXTRACTED]
  extensions/graphify.ts → TUTORIAL.md
- `graphify.ts Extension (1682 lines)` --implements--> `/memory runs Command`  [EXTRACTED]
  extensions/graphify.ts → TUTORIAL.md

## Hyperedges (group relationships)
- **Complete /memory Command Set** — memory_save_command, memory_load_command, memory_list_command, memory_runs_command, memory_prune_command, memory_stats_command, memory_pin_command, memory_unpin_command, memory_gc_command, memory_keep_command, memory_wiki_commands [EXTRACTED 1.00]
- **Prune Score Composite System** — pruning_system, prune_score_staleness, prune_score_redundancy, prune_score_low_signal, prune_score_obsoletion, pinning, jaccard_similarity [EXTRACTED 1.00]
- **Unified Tree+Fractal Synthesis** — tree_memory_proposal, fractal_memory_proposal, unified_plan, six_phase_roadmap [EXTRACTED 1.00]

## Communities (8 total, 0 thin omitted)

### Community 0 - "graphify.ts Core Implementation"
Cohesion: 0.14
Nodes (38): addDaysIso(), archiveRunDirFor(), brainContextForCwd(), computePruneScores(), countRunArtifacts(), dirSize(), extractSections(), findArchivedRun() (+30 more)

### Community 1 - "Test Bundle & Brain Utilities"
Cohesion: 0.1
Nodes (34): brainContextForCwd(), computePruneScores(), constructor(), copyObsidianToVault(), decayTemperatures(), dirSize(), ensureBrainDir(), ensureVault() (+26 more)

### Community 2 - "Memory System Architecture"
Cohesion: 0.09
Nodes (30): .archive/ Directory (Grace Period), 30-Day Archive Grace Period, archive-meta.json, Backward Compatibility Guarantee, Context Injection (brainContextForCwd), Garbage Collection (Archive/Restore), git-checkpoint.ts Extension, graph.html (Interactive Viz) (+22 more)

### Community 3 - "Pruning & Temperature System"
Cohesion: 0.1
Nodes (26): ARC Cache Algorithm, Cross-Project Archetypes, brain-meta.json (Global State), Cache Eviction (LRU/SIEVE), Ebbinghaus Forgetting Curve, HeatTracker (Temperature System), Jaccard Similarity for Run Comparison, /memory prune Command (+18 more)

### Community 4 - "HeatTracker Class"
Cohesion: 0.28
Nodes (4): ensureBrainDir(), handleSave(), HeatTracker, rebuildBrainIndex()

### Community 5 - "Design Proposals (Tree+Fractal)"
Cohesion: 0.2
Nodes (12): Coherence Score for Compression, Compression State Machine (Rawâ†’Communitiesâ†’Compressedâ†’Frozen), Formal Concept Analysis (FCA), Fractal Compression, Fractal Memory Proposal, FractalNode Schema (Level/Parent/Summary), Graph Summarization (Supernode), Hyperdimensional Computing (HDC/VSA) (+4 more)

### Community 6 - "Graphify Skill & Knowledge Graph"
Cohesion: 0.31
Nodes (10): AST Extraction (Structural), Community Detection (Louvain/Leiden), Confidence Score System, EXTRACTED/INFERRED/AMBIGUOUS Edge Types, God Nodes (Centrality), Centrality (Graph Theory), graphifyy Python Package, /graphify Skill (+2 more)

### Community 7 - "Obsidian Vault Integration"
Cohesion: 0.39
Nodes (8): copyObsidianToVault(), ensureVault(), handleWikiNotes(), handleWikiOpen(), handleWikiSyncAll(), handleWikiSyncCurrent(), openInObsidian(), rebuildVaultIndex()

## Knowledge Gaps
- **18 isolated node(s):** `Zettelkasten Knowledge Management`, `Ebbinghaus Forgetting Curve`, `Formal Concept Analysis (FCA)`, `Subgraph Isomorphism (VF2)`, `Sparse Distributed Memory (SDM)` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `graphify-brain Memory System` connect `Memory System Architecture` to `Pruning & Temperature System`?**
  _High betweenness centrality (0.353) - this node is a cross-community bridge._
- **Why does `Pi Coding Agent Harness` connect `Memory System Architecture` to `graphify.ts Core Implementation`?**
  _High betweenness centrality (0.315) - this node is a cross-community bridge._
- **Why does `Pruning System (5-Signal Score)` connect `Pruning & Temperature System` to `Memory System Architecture`, `Graphify Skill & Knowledge Graph`?**
  _High betweenness centrality (0.140) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `graphify.ts Extension (1682 lines)` (e.g. with `git-checkpoint.ts Extension` and `graphify-test-bundle.js`) actually correct?**
  _`graphify.ts Extension (1682 lines)` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Zettelkasten Knowledge Management`, `Ebbinghaus Forgetting Curve`, `Formal Concept Analysis (FCA)` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `graphify.ts Core Implementation` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Test Bundle & Brain Utilities` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._