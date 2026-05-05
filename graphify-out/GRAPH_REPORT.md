# Graph Report - C:/Users/DONALD/memory-research  (2026-05-05)

## Corpus Check
- Corpus is ~12,426 words - fits in a single context window. You may not need a graph.

## Summary
- 86 nodes · 95 edges · 17 communities detected
- Extraction: 82% EXTRACTED · 18% INFERRED · 0% AMBIGUOUS · INFERRED: 17 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Prune Score & GC System|Prune Score & GC System]]
- [[_COMMUNITY_Implementation Phases 1-5|Implementation Phases 1-5]]
- [[_COMMUNITY_Handoff Memory Metabolism|Handoff Memory Metabolism]]
- [[_COMMUNITY_User Tests & Validation Gates|User Tests & Validation Gates]]
- [[_COMMUNITY_Phase 3A Tutorial & Deferred Work|Phase 3A Tutorial & Deferred Work]]
- [[_COMMUNITY_Fractal Math & Graph Isomorphism|Fractal Math & Graph Isomorphism]]
- [[_COMMUNITY_Compression & Communities|Compression & Communities]]
- [[_COMMUNITY_Metadata Hardening Fields|Metadata Hardening Fields]]
- [[_COMMUNITY_Core Proposals & Synthesis|Core Proposals & Synthesis]]
- [[_COMMUNITY_Graph Theory Concepts|Graph Theory Concepts]]
- [[_COMMUNITY_Memory Stats Enhancement|Memory Stats Enhancement]]
- [[_COMMUNITY_Deferred WL Isomorphism|Deferred WL Isomorphism]]
- [[_COMMUNITY_Deferred Auto-Delete|Deferred Auto-Delete]]
- [[_COMMUNITY_Failure Modes|Failure Modes]]
- [[_COMMUNITY_Save Verification Test|Save Verification Test]]
- [[_COMMUNITY_Rollback & Recovery|Rollback & Recovery]]
- [[_COMMUNITY_Command Grammar Update|Command Grammar Update]]

## God Nodes (most connected - your core abstractions)
1. `Prune Score System (5 signals)` - 8 edges
2. `Cross-Project Archetypes System` - 7 edges
3. `Memory System Improvement Handoff` - 7 edges
4. `Archive & GC System (Phase 2F)` - 7 edges
5. `Phase 3A User Test Checklist` - 6 edges
6. `Phase 3A Tutorial Documentation` - 6 edges
7. `Run Metadata Hardening (Phase 2A)` - 5 edges
8. `Context Injection Policy (Phase 2G)` - 5 edges
9. `/memory Tree Commands (prune, pin, gc, keep)` - 4 edges
10. `Self-Similarity Invariant` - 4 edges

## Surprising Connections (you probably didn't know these)
- `/memory Tree Commands (prune, pin, gc, keep)` --semantically_similar_to--> `/memory Fractal Commands (compress, expand, zoom, fuse, archetypes)`  [INFERRED] [semantically similar]
  01-tree-memory-proposal.md → 02-fractal-memory-proposal.md
- `MinHash+LSH Semantic Deduplication` --semantically_similar_to--> `Redundancy Detection (SimHash+Jaccard)`  [INFERRED] [semantically similar]
  02-fractal-memory-proposal.md → 01-tree-memory-proposal.md
- `Test: GC Apply Full Archive` --validates--> `Archive & GC System (Phase 2F)`  [INFERRED]
  PHASE3A_USER_TESTS.md → memory-system-improvement-handoff.md
- `Phase 3A Tutorial Documentation` --documents--> `Memory Metabolism Loop (save->access->heat->pin->score->archive->restore->inject)`  [INFERRED]
  TUTORIAL.md → memory-system-improvement-handoff.md
- `Tree-Fractal Complementarity Principle` --defines_layer_for--> `Tree Memory Proposal`  [INFERRED]
  03-unified-plan.md → 01-tree-memory-proposal.md

## Hyperedges (group relationships)
- **Prune Score Composite Formula** — prune_score_system, staleness_signal, redundancy_signal, low_signal_detection, obsoletion_scoring [EXTRACTED 1.00]
- **Fractal Compression Algorithm Stack** — wl_color_refinement, minhash_lsh_dedup, graph_summarization_supernodes, community_detection [EXTRACTED 1.00]
- **Six-Phase Implementation Roadmap** — phase1_run_storage, phase2_pruning, phase3_temperature, phase4_compression, phase5_archetypes, phase6_advanced [EXTRACTED 1.00]
- **Tree + Fractal Synthesis into Unified Plan** — tree_memory_proposal, fractal_memory_proposal, unified_memory_plan, tree_fractal_complementarity [EXTRACTED 1.00]
- **Six Non-Negotiable Invariants** — handoff_never_delete_invariant, handoff_human_pin_override, handoff_dryrun_before_mutation, handoff_safe_to_inject_metadata, handoff_verified_status_field, handoff_context_priority_field [EXTRACTED 1.00]
- **Deferred Phase (Do Not Build Yet)** — handoff_deferred_archetypes, handoff_deferred_wl_isomorphism, handoff_deferred_fractal_compression, handoff_deferred_auto_delete [EXTRACTED 1.00]
- **Test Archive/Restore Flow** — tests_gc_apply_check, tests_keep_restore_check, tests_pin_immunity_check [EXTRACTED 1.00]

## Communities

### Community 0 - "Prune Score & GC System"
Cohesion: 0.21
Nodes (12): Archive System (30-day grace period), Ebbinghaus Forgetting Curve, Low Signal Detection, LRU Eviction Pattern, /memory Tree Commands (prune, pin, gc, keep), MinHash+LSH Semantic Deduplication, Obsoletion Scoring, Phase 2: Pruning Infrastructure (+4 more)

### Community 1 - "Implementation Phases 1-5"
Cohesion: 0.2
Nodes (12): Cross-Project Archetypes System, brain-meta.json Schema, Conflict Resolution Decisions, detectArchetypes() Function, Filesystem Layout (runs/ directory), graphify.ts Code Changes, HeatTracker Class, Phase 1: Run-Level Storage (MVP) (+4 more)

### Community 2 - "Handoff Memory Metabolism"
Cohesion: 0.25
Nodes (11): Archive & GC System (Phase 2F), Archive Metadata Schema, Context Injection Policy (Phase 2G), Access & Heat Tracking (Phase 2B), Memory System Improvement Handoff, Memory Metabolism Loop (save->access->heat->pin->score->archive->restore->inject), Never Delete Memory Directly Invariant, Pinning System (Phase 2D) (+3 more)

### Community 3 - "User Tests & Validation Gates"
Cohesion: 0.18
Nodes (11): Dry-Run Before Mutation Invariant, Dry-Run Pruning (Phase 2E), Human Pin Overrides Auto Pruning Invariant, Keep/Restore Run Behavior, Test: Load/LoadRun Access Tracking, Disposable Project Safety Warning, Test: Dry-Run Does Not Mutate Files, Test: GC Apply Full Archive (+3 more)

### Community 4 - "Phase 3A Tutorial & Deferred Work"
Cohesion: 0.22
Nodes (9): Deferred: Archetype Detection, Deferred: Full Fractal Compression, Verifier-Aware Memory (Phase 2H), Internal Context Selection Helper Note, Dry-Run-First Behavior Documentation, GC Apply Full Archive Docs, Keep Restore Full Artifact Docs, Not Implemented Section (fractal/archetypes excluded) (+1 more)

### Community 5 - "Fractal Math & Graph Isomorphism"
Cohesion: 0.29
Nodes (7): Formal Concept Analysis (FCA), Fractal Dimension (box-covering method), FractalNode Schema, Phase 6: Advanced (WL isomorphism, semantic search), Self-Similarity Invariant, VF2 Subgraph Isomorphism, Weisfeiler-Lehman Color Refinement

### Community 6 - "Compression & Communities"
Cohesion: 0.4
Nodes (6): Coherence Scoring (density+cohesion), Community Detection (Louvain/Leiden), Compression State Machine (rawâ†’communitiesâ†’compressedâ†’frozen), Graph Summarization via Supernode Aggregation, /memory Fractal Commands (compress, expand, zoom, fuse, archetypes), Phase 4: Fractal Compression

### Community 7 - "Metadata Hardening Fields"
Cohesion: 0.4
Nodes (5): contextPriority Metadata Field, failureSignatures Metadata Field, Run Metadata Hardening (Phase 2A), safeToInject Metadata Field, verifiedStatus Metadata Field

### Community 8 - "Core Proposals & Synthesis"
Cohesion: 0.83
Nodes (4): Fractal Memory Proposal, Tree-Fractal Complementarity Principle, Tree Memory Proposal, Unified Memory Management Plan

### Community 9 - "Graph Theory Concepts"
Cohesion: 1.0
Nodes (2): Degree Centrality Metric, Zettelkasten Linking Principle

### Community 10 - "Memory Stats Enhancement"
Cohesion: 1.0
Nodes (1): /memory stats Enhancement (Phase 2C)

### Community 11 - "Deferred WL Isomorphism"
Cohesion: 1.0
Nodes (1): Deferred: WL Graph Isomorphism

### Community 12 - "Deferred Auto-Delete"
Cohesion: 1.0
Nodes (1): Deferred: Automatic Deletion

### Community 13 - "Failure Modes"
Cohesion: 1.0
Nodes (1): 5 Likely Failure Modes

### Community 14 - "Save Verification Test"
Cohesion: 1.0
Nodes (1): Test: /memory save Verification

### Community 15 - "Rollback & Recovery"
Cohesion: 1.0
Nodes (1): Rollback & Recovery Section

### Community 16 - "Command Grammar Update"
Cohesion: 1.0
Nodes (1): Updated Command Grammar (project-scoped)

## Knowledge Gaps
- **37 isolated node(s):** `3-Level Hierarchy (Rootâ†’Projectâ†’Run)`, `Low Signal Detection`, `Obsoletion Scoring`, `Zettelkasten Linking Principle`, `Ebbinghaus Forgetting Curve` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Graph Theory Concepts`** (2 nodes): `Degree Centrality Metric`, `Zettelkasten Linking Principle`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Memory Stats Enhancement`** (1 nodes): `/memory stats Enhancement (Phase 2C)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Deferred WL Isomorphism`** (1 nodes): `Deferred: WL Graph Isomorphism`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Deferred Auto-Delete`** (1 nodes): `Deferred: Automatic Deletion`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Failure Modes`** (1 nodes): `5 Likely Failure Modes`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Save Verification Test`** (1 nodes): `Test: /memory save Verification`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Rollback & Recovery`** (1 nodes): `Rollback & Recovery Section`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Command Grammar Update`** (1 nodes): `Updated Command Grammar (project-scoped)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Cross-Project Archetypes System` connect `Implementation Phases 1-5` to `Prune Score & GC System`, `Fractal Math & Graph Isomorphism`, `Compression & Communities`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `Memory System Improvement Handoff` connect `Handoff Memory Metabolism` to `User Tests & Validation Gates`, `Phase 3A Tutorial & Deferred Work`, `Metadata Hardening Fields`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `Archive & GC System (Phase 2F)` connect `Handoff Memory Metabolism` to `User Tests & Validation Gates`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **What connects `3-Level Hierarchy (Rootâ†’Projectâ†’Run)`, `Low Signal Detection`, `Obsoletion Scoring` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._