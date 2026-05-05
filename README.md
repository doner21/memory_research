# memory_research — Graphify-Brain Memory System for Pi

> Research, architecture, implementation handoff, **full TypeScript extension source code**,
> and user documentation for the graphify-brain persistent memory extension.
> Drop this into any Pi coding agent harness and run `/memory save`.

---

## Project Purpose

This repository contains the **full design lifecycle** of the graphify-brain memory
system for Pi coding agent harnesses. It documents a system that gives Pi agents
**persistent, graph-indexed, versioned memory**: saving knowledge-graph snapshots as
timestamped **runs**, scoring them for pruning, protecting pinned runs, archiving
stale runs with a 30-day grace period, and preparing for fractal compression and
cross-project archetype detection.

The system transforms graphify from a one-shot knowledge-graph builder into a
**brain**: an evolving, versioned, heat-tracked, pruneable memory substrate that
helps agents avoid repeating mistakes, preserve verified constraints, and enter
projects with the right amount of context.

---

## What This Repo IS vs IS NOT

| IS | IS NOT |
|----|--------|
| Research proposals (tree, fractal, unified) | The runtime brain data |
| Unified architecture plan with 6-phase roadmap | A standalone application |
| Implementation handoff with invariants and 8 verification gates | A finished product (Phase 3-6 still planned) |
| User tutorial and test checklist | — |
| **Full TypeScript extension source** (graphify.ts, git-checkpoint.ts) | — |
| **Graphify skill** for Pi agent knowledge graphs | — |
| Knowledge-graph artifacts (86 nodes, 95 edges) | — |
| Self-contained setup guide for a fresh Pi agent | — |

---

## Where Everything Lives in Pi

This repo contains the **source of truth**. To install into a Pi harness:

| Content | Repo Path | Install To |
|---------|-----------|------------|
| Extension source | `extensions/graphify.ts` | `~/.pi/agent/extensions/graphify.ts` |
| Extension source | `extensions/git-checkpoint.ts` | `~/.pi/agent/extensions/git-checkpoint.ts` |
| Extension deps | `extensions/package.json` | `~/.pi/agent/extensions/package.json` |
| Extension deps | `extensions/package-lock.json` | `~/.pi/agent/extensions/package-lock.json` |
| Graphify skill | `skills/graphify/SKILL.md` | `~/.pi/agent/skills/graphify/SKILL.md` |
| Test bundle | `test/graphify-test-bundle.js` | `~/.pi/agent/graphify-test-bundle.js` |

The **runtime brain data** (saved runs, archives, `brain-meta.json`) is created automatically at:

```
~/.pi/graphify-brain/
```

All `~/.pi` paths are relative to the user home directory. On Windows this is
`C:/Users/<username>/.pi/`.

---

## File Inventory

### Design Documents
| File | Size | Description |
|------|------|-------------|
| `01-tree-memory-proposal.md` | ~14 KB | Tree memory proposal: hierarchical pruning, 3-level storage, Zettelkasten, Ebbinghaus decay |
| `02-fractal-memory-proposal.md` | ~24 KB | Fractal memory proposal: self-similar compression, archetypes, WL isomorphism, MinHash/LSH dedup |
| `03-unified-plan.md` | ~19 KB | Synthesis of Tree and Fractal: 6-phase roadmap, unified data model, file layout, command set |
| `memory-system-improvement-handoff.md` | ~16 KB | Implementation handoff: non-negotiable invariants, 8 verification gates, Phase 2A-2H specs |
| `TUTORIAL.md` | ~13 KB | User tutorial for `/memory` and `/memory-wiki` commands (Phase 3A) |
| `PHASE3A_USER_TESTS.md` | ~11 KB | User test checklist: 11 test procedures for Phase 3A validation |

### Extension Source (TypeScript)
| File | Description |
|------|-------------|
| `extensions/graphify.ts` | **Main extension** (1682 lines, 63KB). Implements all `/memory` commands: save, load, runs, stats, prune, pin, unpin, gc, keep, and `/memory-wiki` commands. Contains HeatTracker, pruning engine, archive/restore system, context injection. |
| `extensions/git-checkpoint.ts` | Auto-commits before Pi agent writes files — checkpoint safety for destructive edits |
| `extensions/package.json` | npm dependencies (`@modelcontextprotocol/sdk`, `@sinclair/typebox`) |
| `extensions/package-lock.json` | Locked dependency versions for reproducible installs |

### Skills
| File | Description |
|------|-------------|
| `skills/graphify/SKILL.md` | The `/graphify` skill — builds knowledge graphs from codebases. Powers the graph building that `/memory save` snapshots. |
| `skills/graphify/.graphify_version` | Version marker for the graphify Python package |

### Test
| File | Description |
|------|-------------|
| `test/graphify-test-bundle.js` | Test bundle for validating graphify-brain functionality |

### Knowledge Graph Artifacts
| File | Description |
|------|-------------|
| `graphify-out/GRAPH_REPORT.md` | Knowledge graph report: 86 nodes, 95 edges, 17 communities |
| `graphify-out/graph.json` | Raw graph data (node-link JSON) |
| `graphify-out/graph.html` | Interactive graph visualization |
| `graphify-out/obsidian/` | 48 auto-generated concept notes for Obsidian |
| `graphify-out/manifest.json` | File manifest for incremental updates |
| `graphify-out/cost.json` | Token usage tracker |
| `.gitignore` | Excludes `NUL`, `.graphify_python`, `node_modules/`, OS/editor/build artifacts |

---

## Implementation Status

| Phase | Status | What |
|-------|--------|------|
| **Phase 1** Run-Level Storage | ✅ DONE | `/memory save`, `runs/` directory, `run-meta.json`, `/memory runs`, `/memory load --run` |
| **Phase 2A** Metadata Hardening | ✅ DONE | Full `run-meta.json` schema with temperature, accessCount, verification fields |
| **Phase 2B** Heat Tracking | ✅ DONE | HeatTracker, access counting, hot/warm/cold classification |
| **Phase 2C** `/memory stats` | ✅ DONE | Global and per-project stats output |
| **Phase 2D** Pinning | ✅ DONE | `/memory pin`, `/memory unpin`, pinned runs immune to pruning |
| **Phase 2E** Dry-run Pruning | ✅ DONE | `/memory prune --dry-run`, 5-signal composite score |
| **Phase 2F** Archive and GC | ✅ DONE | `/memory gc --dry-run/--apply`, `.archive/` with 30-day grace period, `/memory keep` restore |
| **Phase 2G** Context Injection | ✅ DONE | `selectMemoryForContext()` role-aware memory injection |
| **Phase 2H** Verifier-Aware | ✅ DONE | `verifiedStatus`, `failureSignatures`, verification block in `run-meta` |
| **Phase 3** Temperature Tracking | 📋 PLANNED | Temperature decay, hot/warm/cold state machine integrated with pruning |
| **Phase 4** Fractal Compression | 📋 PLANNED | Community detection (Louvain/Leiden), supernode collapse, compression state machine |
| **Phase 5** Archetypes | 📋 PLANNED | Cross-project archetype detection: MinHash/LSH, ≥3 re-emergences → permanent |
| **Phase 6** WL Isomorphism, Semantic Search | ⏸️ DEFERRED | Advanced graph canonization via WL refinement, semantic search across runs |

**Note:** Phases 2A-2H were implemented and shipped as **Phase 3A** (Memory Safety and
Archive Restore). `TUTORIAL.md` and `PHASE3A_USER_TESTS.md` document this release.

---

## Brain Filesystem Layout

From `TUTORIAL.md` — the runtime brain data structure at `~/.pi/graphify-brain/`:

```text
~/.pi/graphify-brain/
├── index.md
├── brain-meta.json                  # Global HeatTracker and brain metadata
├── .archive/
│   └── <projectSlug>/
│       └── <runId>/                 # Full archived run directory
│           ├── archive-meta.json
│           ├── run-meta.json
│           ├── graph.json
│           ├── GRAPH_REPORT.md
│           ├── wiki/
│           └── obsidian/
│
├── obsidian-vault/
│   ├── _INDEX.md
│   ├── _BRAIN_CANVAS.canvas
│   └── <projectSlug>/
│
└── <projectSlug>/
    ├── meta.json                    # Project metadata and latest run ID
    ├── graph.json                   # LATEST graph, backward compatible
    ├── GRAPH_REPORT.md              # LATEST report, backward compatible
    ├── wiki/                        # LATEST wiki, backward compatible
    ├── obsidian/                    # LATEST Obsidian notes, backward compatible
    └── runs/
        └── <runId>/
            ├── run-meta.json
            ├── graph.json
            ├── GRAPH_REPORT.md
            ├── wiki/
            └── obsidian/
```

---

## `/memory` Command Set

| Command | Description |
|---------|-------------|
| `/memory save` | Save current `graphify-out/` as a timestamped run |
| `/memory list` | List all saved projects |
| `/memory load <project> [--run <id>]` | Load LATEST or a specific run |
| `/memory runs <project>` | List all runs for a project |
| `/memory stats [project]` | Memory statistics — global or per-project |
| `/memory prune <project> [--dry-run]` | Show prune candidates ranked by composite score |
| `/memory pin <project> --run <id>` | Pin a run: immune to pruning |
| `/memory unpin <project> --run <id>` | Remove pin protection |
| `/memory gc <project> [--dry-run] [--apply]` | Garbage collect: archive pruneable runs |
| `/memory keep <project> --run <id>` | Restore an archived run |
| `/memory-wiki sync` | Sync saved graph output to Obsidian vault |
| `/memory-wiki open` | Open the Obsidian vault |
| `/memory-wiki notes` | List wiki notes |

---

## Non-Negotiable Invariants

Condensed from `memory-system-improvement-handoff.md`:

1. **Backward compatibility**: Project-root artifacts (`graph.json`, `GRAPH_REPORT.md`,
   `wiki/`, `obsidian/`, `meta.json`) must always reflect LATEST. Runs are additive under `runs/`.
2. **Never delete directly**: All destructive operations go through archive first
   (`.archive/` → 30-day grace period → delete).
3. **Human pinning overrides automation**: Pinned runs must never be archived or deleted.
4. **Dry-run before mutation**: Prune and GC default to dry-run; `--apply` required to move files.
5. **Access frequency is not truth**: Heat, access count, and recency are usefulness
   signals only — they do not prove correctness.
6. **Memory injection must be conservative**: Role-aware selection via `safeToInject`,
   `verifiedStatus`, and `contextPriority`. Not all stored memory should be auto-injected into agent context.

---

## Verification Gates

Full details in `memory-system-improvement-handoff.md`. Summary:

| Gate | Test |
|------|------|
| 1. Backward compatibility | Root LATEST artifacts intact after `/memory save` |
| 2. Multiple runs | Two saves produce two distinct run folders |
| 3. Load specific run | `--run` loads older run; `accessCount` increments |
| 4. Pinning | Pinned run excluded from prune candidates |
| 5. Dry-run pruning | Scores displayed, no files moved |
| 6. Archive | Run moves to `.archive/`; metadata written |
| 7. Keep | Run restored from archive, auto-pinned |
| 8. Context selection | Role-aware helper: includes latest/pinned, excludes archived |

---

## Setup Guide for a Fresh Pi Agent

### 1. Clone this repo
```bash
git clone https://github.com/doner21/memory_research.git
cd memory_research
```

### 2. Install the extensions into Pi
Copy the extension files into your Pi harness:

**Linux/macOS:**
```bash
cp extensions/graphify.ts ~/.pi/agent/extensions/graphify.ts
cp extensions/git-checkpoint.ts ~/.pi/agent/extensions/git-checkpoint.ts
cp extensions/package.json ~/.pi/agent/extensions/package.json
cp extensions/package-lock.json ~/.pi/agent/extensions/package-lock.json
```

**Windows (PowerShell):**
```powershell
Copy-Item extensions/graphify.ts $env:USERPROFILE/.pi/agent/extensions/graphify.ts
Copy-Item extensions/git-checkpoint.ts $env:USERPROFILE/.pi/agent/extensions/git-checkpoint.ts
Copy-Item extensions/package.json $env:USERPROFILE/.pi/agent/extensions/package.json
Copy-Item extensions/package-lock.json $env:USERPROFILE/.pi/agent/extensions/package-lock.json
```

Then install npm dependencies:
```bash
cd ~/.pi/agent/extensions && npm install
```

### 3. Install the graphify skill
```bash
mkdir -p ~/.pi/agent/skills/graphify
cp skills/graphify/SKILL.md ~/.pi/agent/skills/graphify/SKILL.md
cp skills/graphify/.graphify_version ~/.pi/agent/skills/graphify/.graphify_version
```

### 4. Install the test bundle (optional)
```bash
cp test/graphify-test-bundle.js ~/.pi/agent/graphify-test-bundle.js
```

### 5. Restart Pi
Close and reopen Pi to load the new extensions. Verify:
```
/memory list
```

### 6. Read the design documents in order
- `01-tree-memory-proposal.md` — tree memory paradigm (hierarchical pruning, 3-level storage)
- `02-fractal-memory-proposal.md` — fractal compression paradigm (self-similarity, archetypes)
- `03-unified-plan.md` — synthesis into 6-phase roadmap
- `memory-system-improvement-handoff.md` — invariants, verification gates, Phase 2A-2H specs

### 7. Continue where the project left off
- **Phases 1 + 2A-2H (Phase 3A)** are implemented and shipped
- **Next priorities**: Phase 3 (Temperature tracking), Phase 4 (Fractal compression), Phase 5 (Archetypes)
- `TUTORIAL.md` documents Phase 3A command usage with workflows
- `PHASE3A_USER_TESTS.md` provides 11 test procedures for validation

### 8. Run tests
Follow `PHASE3A_USER_TESTS.md` — 11 manual test procedures validating save, load, pin, prune, gc, and keep against the 8 verification gates.

### 9. Follow the invariants
Every change must respect the 6 non-negotiable invariants above and pass the 8 verification gates.

---

## Pushing to GitHub

This repo does not assume the `gh` CLI. To push:

### 1. Create a new repository on GitHub
- Go to https://github.com/new
- **Name:** `memory_research` (underscore, not hyphen)
- **Do NOT** initialize with README, `.gitignore`, or license (we already have them)
- Click **Create repository**

### 2. Add the remote and push
```bash
git remote add origin https://github.com/<YOUR_USERNAME>/memory_research.git
git branch -M main
git push -u origin main
```

### 3. To update after changes
```bash
git add .
git commit -m "description of changes"
git push
```

> **Note:** Replace `<YOUR_USERNAME>` with your actual GitHub username. If you don't
> have a GitHub account, create one at https://github.com/signup first.
