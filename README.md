# memory_research — Graphify-Brain Memory System Design

> Research, architecture, implementation handoff, and user documentation for the
> graphify-brain persistent memory extension for Pi coding agent harnesses.

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
| Research proposals (tree, fractal, unified) | The TypeScript extension source code |
| Unified architecture plan with 6-phase roadmap | The runtime brain data |
| Implementation handoff with invariants and 8 verification gates | A standalone application |
| User tutorial and test checklist | A runnable extension |
| Knowledge-graph artifacts (86 nodes, 95 edges) | A finished product |
| Self-contained setup guide for a fresh Pi agent | — |

---

## Where the Code and Data Live

The graphify-brain extension **source code** (TypeScript — the actual `/memory` and
`/memory-wiki` command implementations) lives at:

```
~/.pi/extensions/graphify/
```

The **runtime brain data** (saved runs, archives, `brain-meta.json`) lives at:

```
~/.pi/graphify-brain/
```

Both paths are relative to the user home directory. On Windows this is typically
`C:/Users/<username>/.pi/`.

**This repo is the design/research layer.** The extension source and brain data are
separate locations on disk. You need all three to fully reproduce the environment.

---

## File Inventory

| File | Size | Description |
|------|------|-------------|
| `01-tree-memory-proposal.md` | ~14 KB | Tree memory proposal: hierarchical pruning, 3-level storage, Zettelkasten, Ebbinghaus decay |
| `02-fractal-memory-proposal.md` | ~24 KB | Fractal memory proposal: self-similar compression, archetypes, WL isomorphism, MinHash/LSH dedup |
| `03-unified-plan.md` | ~19 KB | Synthesis of Tree and Fractal: 6-phase roadmap, unified data model, file layout, command set |
| `memory-system-improvement-handoff.md` | ~16 KB | Implementation handoff: non-negotiable invariants, 8 verification gates, Phase 2A-2H specs |
| `TUTORIAL.md` | ~13 KB | User tutorial for `/memory` and `/memory-wiki` commands (Phase 3A) |
| `PHASE3A_USER_TESTS.md` | ~11 KB | User test checklist: 11 test procedures for Phase 3A validation |
| `graphify-out/` | directory | Knowledge graph artifacts for this repo: `graph.json` (86 nodes, 95 edges), `GRAPH_REPORT.md`, `graph.html`, `obsidian/` (48 auto-generated concept notes), `cache/` (semantic cache), `manifest.json`, `cost.json` |
| `.gitignore` | <1 KB | Excludes accidental output (`NUL`), machine-local paths (`.graphify_python`), and build/editor/OS artifacts |

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

To reproduce this environment and continue work:

### 1. Clone this repo
```bash
git clone https://github.com/<user>/memory_research.git
cd memory_research
```

### 2. Read the design documents in order
- `01-tree-memory-proposal.md` — understand the tree memory paradigm (hierarchical pruning, 3-level storage)
- `02-fractal-memory-proposal.md` — understand the fractal compression paradigm (self-similarity, archetypes)
- `03-unified-plan.md` — see how they synthesize into a 6-phase roadmap
- `memory-system-improvement-handoff.md` — learn invariants, verification gates, and Phase 2A-2H implementation specs

### 3. Locate the extension source
The TypeScript implementation is at `~/.pi/extensions/graphify/`.
Navigate there to see the actual code for `/memory` and `/memory-wiki` commands.

### 4. Inspect the brain data
If brain data already exists on this machine, it lives at `~/.pi/graphify-brain/`.
Check `brain-meta.json` for the global HeatTracker and `runs/` for saved snapshots.

### 5. Continue where the project left off
- **Phases 1 + 2A-2H (Phase 3A)** are implemented and shipped
- **Next priorities**: Phase 3 (Temperature tracking), Phase 4 (Fractal compression), Phase 5 (Archetypes)
- `TUTORIAL.md` documents Phase 3A command usage with workflows
- `PHASE3A_USER_TESTS.md` provides 11 test procedures for validation

### 6. Run tests
Follow `PHASE3A_USER_TESTS.md` — 11 manual test procedures validating save, load, pin, prune, gc, and keep against the 8 verification gates.

### 7. Follow the invariants
Every change must respect the 6 non-negotiable invariants above and pass the 8 verification gates. Never delete directly, always dry-run first, and preserve backward compatibility.

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
