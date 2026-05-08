---
type: overview/architecture
llm_instructions: "Summarize using god nodes and top communities."
---

# Architecture at a Glance


## Core Architecture (God Nodes)

The most connected concepts form the backbone:

- **slugify()** (13 connections)
- **HeatTracker** (12 connections)
- **handleGc()** (12 connections)
- **runDirFor()** (11 connections)
- **loadRunMeta()** (10 connections)
- **computePruneScores()** (10 connections)
- **resolveProjectRunFromArgs()** (10 connections)
- **handleKeep()** (10 connections)
- **Pruning System (5-Signal Score)** (10 connections)
- **graphify-brain Memory System** (10 connections)

## Community Map

| # | Community | Nodes | Cohesion |
|---|-----------|-------|----------|
| 0 | [[../02_TOP_COMMUNITIES/COMMUNITY_0|graphify.ts Core Implementation]] | 43 | 0.14 |
| 1 | [[../02_TOP_COMMUNITIES/COMMUNITY_1|Test Bundle & Brain Utilities]] | 39 | 0.10 |
| 2 | [[../02_TOP_COMMUNITIES/COMMUNITY_2|Wiki Documentation & Architecture]] | 31 | 0.10 |
| 3 | [[../02_TOP_COMMUNITIES/COMMUNITY_3|Pruning & Temperature System]] | 30 | 0.09 |
| 4 | [[../02_TOP_COMMUNITIES/COMMUNITY_4|Memory System Architecture]] | 26 | 0.10 |
| 5 | [[../02_TOP_COMMUNITIES/COMMUNITY_5|graphify Module (12 functions)]] | 12 | 0.00 |
| 6 | [[../02_TOP_COMMUNITIES/COMMUNITY_6|Design Proposals (Tree+Fractal)]] | 12 | 0.20 |
| 7 | [[../02_TOP_COMMUNITIES/COMMUNITY_7|Graphify Skill & Knowledge Graph]] | 9 | 0.36 |
| 8 | [[../02_TOP_COMMUNITIES/COMMUNITY_8|Obsidian Vault Integration]] | 8 | 0.39 |
| 9 | [[../02_TOP_COMMUNITIES/COMMUNITY_9|git-checkpoint Module (1 functions)]] | 1 | 0.00 |
| 10 | [[../02_TOP_COMMUNITIES/COMMUNITY_10|graphify-test-bundle Module (1 functions)]] | 1 | 0.00 |
| 11 | [[../02_TOP_COMMUNITIES/COMMUNITY_11|Concepts: /memory stats Command]] | 1 | 0.00 |

## Surprising Connections

- Tree Memory Proposal -- semantically_similar_to -> Fractal Memory Proposal
- Pruning System (5-Signal Score) -- implements -> /memory prune Command
- graphify-brain Memory System -- references -> Pruning System (5-Signal Score)
- Non-Negotiable Invariants -- references -> Pinning Mechanism
- Pinning Mechanism -- implements -> /memory pin Command

## Knowledge Gaps

- 34 isolated concepts need integration