# Graph Report - .  (2026-05-08)

## Corpus Check
- Corpus is ~31,767 words - fits in a single context window. You may not need a graph.

## Summary
- 213 nodes · 402 edges · 12 communities (9 shown, 3 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.76)
- Token cost: 25,000 input · 3,000 output

## Community Hubs (Navigation)
- [[_COMMUNITY_graphify.ts Core Implementation|graphify.ts Core Implementation]]
- [[_COMMUNITY_Test Bundle & Brain Utilities|Test Bundle & Brain Utilities]]
- [[_COMMUNITY_Wiki Documentation & Architecture|Wiki Documentation & Architecture]]
- [[_COMMUNITY_Pruning & Temperature System|Pruning & Temperature System]]
- [[_COMMUNITY_Memory System Architecture|Memory System Architecture]]
- [[_COMMUNITY_HeatTracker Class|HeatTracker Class]]
- [[_COMMUNITY_Design Proposals (Tree+Fractal)|Design Proposals (Tree+Fractal)]]
- [[_COMMUNITY_Graphify Skill & Knowledge Graph|Graphify Skill & Knowledge Graph]]
- [[_COMMUNITY_Obsidian Vault Integration|Obsidian Vault Integration]]
- [[_COMMUNITY_git-checkpoint.ts Extension|git-checkpoint.ts Extension]]
- [[_COMMUNITY_memory stats Command|/memory stats Command]]

## God Nodes (most connected - your core abstractions)
1. `slugify()` - 13 edges
2. `HeatTracker` - 12 edges
3. `handleGc()` - 12 edges
4. `runDirFor()` - 11 edges
5. `loadRunMeta()` - 10 edges
6. `computePruneScores()` - 10 edges
7. `resolveProjectRunFromArgs()` - 10 edges
8. `handleKeep()` - 10 edges
9. `Pruning System (5-Signal Score)` - 10 edges
10. `graphify-brain Memory System` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Tree Memory Proposal` --semantically_similar_to--> `Fractal Memory Proposal`  [INFERRED] [semantically similar]
  01-tree-memory-proposal.md → 02-fractal-memory-proposal.md
- `Pruning System (5-Signal Score)` --implements--> `/memory prune Command`  [EXTRACTED]
  01-tree-memory-proposal.md → TUTORIAL.md
- `graphify-brain Memory System` --references--> `Pruning System (5-Signal Score)`  [EXTRACTED]
  README.md → 01-tree-memory-proposal.md
- `Non-Negotiable Invariants` --references--> `Pinning Mechanism`  [EXTRACTED]
  memory-system-improvement-handoff.md → 01-tree-memory-proposal.md
- `Pinning Mechanism` --implements--> `/memory pin Command`  [EXTRACTED]
  01-tree-memory-proposal.md → TUTORIAL.md

## Hyperedges (group relationships)
- **Prune Score Composite System** — pruning_system, prune_score_staleness, prune_score_redundancy, prune_score_low_signal, prune_score_obsoletion, pinning, jaccard_similarity [EXTRACTED 1.00]
- **Unified Tree+Fractal Synthesis** — tree_memory_proposal, fractal_memory_proposal, unified_plan, six_phase_roadmap [EXTRACTED 1.00]
- **Complete /memory Command Set** — memory_save_command, memory_load_command, memory_list_command, memory_runs_command, memory_prune_command, memory_stats_command, memory_pin_command, memory_unpin_command, memory_gc_command, memory_keep_command, memory_wiki_commands [EXTRACTED 1.00]
- **Complete Wiki Documentation System** — wiki_index, wiki_overview, wiki_architecture, wiki_glossary, wiki_layers_index, wiki_communities_index, wiki_decisions_index, wiki_llm_index [EXTRACTED 1.00]

## Communities (12 total, 3 thin omitted)

### Community 0 - "graphify.ts Core Implementation"
Cohesion: 0.14
Nodes (41): addDaysIso(), archiveRunDirFor(), brainContextForCwd(), computePruneScores(), countRunArtifacts(), dirSize(), ensureBrainDir(), extractSections() (+33 more)

### Community 1 - "Test Bundle & Brain Utilities"
Cohesion: 0.1
Nodes (34): brainContextForCwd(), computePruneScores(), constructor(), copyObsidianToVault(), decayTemperatures(), dirSize(), ensureBrainDir(), ensureVault() (+26 more)

### Community 2 - "Wiki Documentation & Architecture"
Cohesion: 0.1
Nodes (31): Architecture at a Glance, Community Narratives Index, Community Narrative: Memory Architecture - The Blueprint, Community Narrative: Design Proposals - The Drawing Board, Community Narrative: Graphify Skill - The Engine Itself, Community Narrative: Heat Tracking - The Thermometer Class, Community Narrative: Implementation Core - The Engine Room, Community Narrative: Obsidian Integration - The Showcase (+23 more)

### Community 3 - "Pruning & Temperature System"
Cohesion: 0.09
Nodes (30): ARC Cache Algorithm, Cross-Project Archetypes, brain-meta.json (Global State), Cache Eviction (LRU/SIEVE), Ebbinghaus Forgetting Curve, Centrality (Graph Theory), HeatTracker (Temperature System), Jaccard Similarity for Run Comparison (+22 more)

### Community 4 - "Memory System Architecture"
Cohesion: 0.1
Nodes (24): .archive/ Directory (Grace Period), 30-Day Archive Grace Period, archive-meta.json, Backward Compatibility Guarantee, Context Injection (brainContextForCwd), Garbage Collection (Archive/Restore), graph.html (Interactive Viz), graph.json (Node-Link Data) (+16 more)

### Community 6 - "Design Proposals (Tree+Fractal)"
Cohesion: 0.2
Nodes (12): Coherence Score for Compression, Compression State Machine (Rawâ†’Communitiesâ†’Compressedâ†’Frozen), Formal Concept Analysis (FCA), Fractal Compression, Fractal Memory Proposal, FractalNode Schema (Level/Parent/Summary), Graph Summarization (Supernode), Hyperdimensional Computing (HDC/VSA) (+4 more)

### Community 7 - "Graphify Skill & Knowledge Graph"
Cohesion: 0.36
Nodes (9): AST Extraction (Structural), Community Detection (Louvain/Leiden), Confidence Score System, EXTRACTED/INFERRED/AMBIGUOUS Edge Types, God Nodes (Centrality), graphifyy Python Package, /graphify Skill, Semantic Extraction (LLM-based) (+1 more)

### Community 8 - "Obsidian Vault Integration"
Cohesion: 0.39
Nodes (8): copyObsidianToVault(), ensureVault(), handleWikiNotes(), handleWikiOpen(), handleWikiSyncAll(), handleWikiSyncCurrent(), openInObsidian(), rebuildVaultIndex()

## Knowledge Gaps
- **34 isolated node(s):** `git-checkpoint.ts Extension`, `Zettelkasten Knowledge Management`, `Ebbinghaus Forgetting Curve`, `Formal Concept Analysis (FCA)`, `Subgraph Isomorphism (VF2)` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `graphify-brain Memory System` connect `Memory System Architecture` to `Pruning & Temperature System`?**
  _High betweenness centrality (0.252) - this node is a cross-community bridge._
- **Why does `Pi Coding Agent Harness` connect `Memory System Architecture` to `graphify.ts Core Implementation`?**
  _High betweenness centrality (0.221) - this node is a cross-community bridge._
- **Why does `Pruning System (5-Signal Score)` connect `Pruning & Temperature System` to `Memory System Architecture`?**
  _High betweenness centrality (0.126) - this node is a cross-community bridge._
- **What connects `git-checkpoint.ts Extension`, `Zettelkasten Knowledge Management`, `Ebbinghaus Forgetting Curve` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `graphify.ts Core Implementation` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Test Bundle & Brain Utilities` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Wiki Documentation & Architecture` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._