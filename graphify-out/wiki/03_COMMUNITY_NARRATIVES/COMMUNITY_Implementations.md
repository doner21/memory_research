---
type: community/narrative
community_id: 0
graph_name: "graphify.ts Core Implementation"
size: 42
cohesion: 0.14
llm_instructions: "This is the largest and most central community. All 42 members are code functions in graphify.ts. Low cohesion (0.14) means these functions are loosely connected — the file does many different things. This is the community to start with when implementing or debugging."
tags: [community, implementation, code, central]
---

# 🏭 Community 0: Implementation Core — The Engine Room

> **42 code nodes · Cohesion: 0.14 (loose — does lots of different things)**

## 🧍 For humans

**Analogy: The engine room of a factory.**

This is the biggest room in the building, and it's messy. There's one giant machine (`graphify.ts` at 1682 lines) and dozens of tools hanging on the wall (`slugify()`, `runDirFor()`, `resolveProjectRunFromArgs()`). They're all in the same room because they belong to the same machine, but they do very different jobs:

- Some tools **name things** (`slugify()`)
- Some tools **navigate the filesystem** (`runDirFor()`, `projectDirForSlug()`)
- Some tools **manage memory** (`handleSave()`, `handleLoad()`, `handlePrune()`)
- Some tools **handle user commands** (`handleGc()`, `handleKeep()`)

The cohesion score is only 0.14 — that's not a bug. It means this community is **broad, not deep**. One big file handling many responsibilities. A future improvement might split this into smaller modules.

**The most important node here** is `graphify.ts Extension` itself — it has 15 connections, more than anything else in the entire graph. If you understand this one file, you understand most of the system.

## 🤖 For LLMs

### Key Nodes (God Nodes in This Community)

| Node | Edges | What it does |
|------|-------|-------------|
| `graphify.ts Extension` | 15 | The main extension file — command handlers, I/O, orchestration |
| `slugify()` | 13 | Converts project names to filesystem-safe slugs |
| `handleGc()` | 12 | Garbage collection — archive/restore lifecycle |
| `runDirFor()` | 11 | Resolves the filesystem path for a given run |
| `computePruneScores()` | 10 | The 5-signal scoring function |
| `resolveProjectRunFromArgs()` | 10 | Parses user arguments to find the right project+run |

### Community Structure

This is an **all-code community** (42/42 nodes are functions in `extensions/graphify.ts`). The low cohesion (0.14) reflects a single-file-monolith pattern — `graphify.ts` grew organically rather than being split into submodules.

### Connections to Other Communities

Based on the graph's cross-community edges, this community connects to:

| To Community | Via |
|-------------|-----|
| C2 (Architecture) | `graphify.ts` implements architecture decisions |
| C3 (Pruning) | `computePruneScores()` implements pruning logic |
| C7 (Obsidian) | `copyObsidianToVault()` bridges to the viewer |
| C4 (HeatTracker) | `handleSave()` calls HeatTracker methods |

### Key Source File

**`extensions/graphify.ts`** (1682 lines) — the single file that contains everything in this community.

### Suggested Questions for an LLM

- *"Should graphify.ts be split into smaller modules? The cohesion is 0.14, suggesting these functions are loosely connected."*
- *"What happens if `slugify()` fails — which downstream functions break?"*
- *"If I add a new `/memory` command, which functions in this community do I need to touch?"*
