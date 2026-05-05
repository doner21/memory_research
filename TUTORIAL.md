# Graphify Brain Tutorial — `/memory` & `/memory-wiki` Commands

> **Version:** Phase 3A — Memory Safety & Archive Restore  |  **Date:** 2026-05-05

---

## Overview

Graphify Brain is a persistent knowledge-graph memory system for Pi. It saves snapshots, called **runs**, of a project's `graphify-out/` artifacts, lets you load current or historical graph context, and provides dry-run-first tools for pruning and archival safety.

**Two command families:**

- `/memory` — save, load, browse, score, pin, archive, restore, and inspect graph memories
- `/memory-wiki` — sync saved graph output into the central Obsidian wiki vault

Phase 3A focuses on safety. Prune and stats are non-mutating, garbage collection is dry-run by default, archive restore preserves full run artifacts, and pinned runs are protected from archival.

---

## Quick Start

```bash
# 1. Build a knowledge graph for your project
/graphify

# 2. Save it to the brain
/memory save

# 3. See your saved projects
/memory list

# 4. Load a project's latest graph
/memory load my-project

# 5. Inspect runs before doing any cleanup
/memory runs my-project
/memory prune my-project --dry-run
/memory gc my-project --dry-run
```

---

## Project and Run Paths

Saved data lives under:

```text
C:/Users/DONALD/.pi/graphify-brain/
```

A project folder uses a **project slug**: the project name lowercased, with non-alphanumeric characters converted to `-`.

Example:

```text
Project folder: C:/work/My Test Project
Project slug:   my-test-project
Brain path:     C:/Users/DONALD/.pi/graphify-brain/my-test-project/
Runs path:      C:/Users/DONALD/.pi/graphify-brain/my-test-project/runs/<runId>/
Archive path:   C:/Users/DONALD/.pi/graphify-brain/.archive/my-test-project/<runId>/
```

---

## `/memory` Commands

### `/memory save`

Save the current project's `graphify-out/` to the brain. A save requires at least one of:

- `graphify-out/GRAPH_REPORT.md`
- `graphify-out/graph.json`

```bash
/memory save
```

**What happens:**

- Creates a timestamped run under `C:/Users/DONALD/.pi/graphify-brain/<projectSlug>/runs/<runId>/`
- Copies available run artifacts: `GRAPH_REPORT.md`, `graph.json`, `wiki/`, and `obsidian/`
- Copies the same current artifacts to the project root as **LATEST** for backward compatibility:
  - `C:/Users/DONALD/.pi/graphify-brain/<projectSlug>/GRAPH_REPORT.md`
  - `C:/Users/DONALD/.pi/graphify-brain/<projectSlug>/graph.json`
  - `C:/Users/DONALD/.pi/graphify-brain/<projectSlug>/wiki/`
  - `C:/Users/DONALD/.pi/graphify-brain/<projectSlug>/obsidian/`
- Writes hardened `run-meta.json`
- Seeds the HeatTracker entry for the run as `hot` with access count `0`
- If Obsidian output exists, auto-syncs to the wiki vault

**Example output:**

```text
Saved "my-project" → my-project/ (43 nodes, 51 edges, 3 artifacts)
```

---

### `/memory list`

List saved projects in the brain.

```bash
/memory list
```

Output is a markdown list with each project path, save date, artifact summary, and node/edge counts.

---

### `/memory load <project> [--run <id>]`

Load a saved graph into the conversation.

```bash
# Load latest project-root LATEST artifacts
/memory load my-project

# Load a specific historical run
/memory load my-project --run 2026-05-04T02-39-18Z
```

**What happens:**

- Loads `GRAPH_REPORT.md` if present
- Loads `wiki/index.md` if present, truncated to keep context practical
- Records access in HeatTracker using a project-qualified key: `<projectSlug>/<runId>`
- Updates durable run metadata in `run-meta.json`: `lastAccessedAt`, `accessCount`, and `temperature`

`/memory load <project>` records access for the project's latest saved run. `/memory load <project> --run <id>` records access for that specific run.

Root LATEST artifacts remain backward compatible and continue to be used for latest loads.

---

### `/memory runs <project>`

List historical runs for a project.

```bash
/memory runs my-project
```

**Example output:**

```text
## Runs for my-project

| Run ID | Nodes | Edges |
|---|---|---|
| 2026-05-04T02-39-18Z | 43 | 51 |
| 2026-05-04T02-21-10Z | 42 | 50 |
```

Runs are sorted by run ID descending, which normally means newest first.

---

### `/memory prune [project] [--dry-run]`

Show prune candidates for a project. This command is **dry-run and non-mutating**.

```bash
# Uses current folder name as the default project if omitted
/memory prune

# Explicit project
/memory prune my-project
/memory prune my-project --dry-run
```

`--dry-run` is accepted for clarity, but prune is already dry-run. It does **not** move files and does **not** rewrite `run-meta.json`.

**Output:** a ranked table with per-signal breakdown.

| Column | Meaning |
|---|---|
| **Rank** | Position in the prune queue; 1 is highest risk |
| **Run ID** | Timestamp ID for the saved run |
| **Total** | Weighted composite score, 0–1 |
| **Staleness** | Heat-based age signal |
| **Redundancy** | Similarity with the newest run |
| **LowSignal** | Penalty for tiny graphs, especially under 10 nodes |
| **Obsoletion** | Rank-based age among newer runs |
| **Pinned** | Whether the run is protected |
| **Temp** | Current temperature: hot, warm, or cold |

Runs with `totalPruneScore > 0.7` are shown as GC candidates. Pinned runs score `0` and are immune to automatic archival.

---

### `/memory stats [project]`

Show storage and score statistics. Project-specific stats are also **dry-run and non-mutating**.

```bash
# Global stats across projects
/memory stats

# Project stats
/memory stats my-project
```

Project output includes:

- Run count
- Total run directory size
- Average prune score
- Prune score histogram
- Temperature distribution

Stats do **not** move files and do **not** rewrite run metadata.

---

### `/memory pin <project> --run <id>`

Protect a run from pruning and GC archival.

```bash
/memory pin my-project --run 2026-05-04T02-39-18Z
```

Pinned runs are protected from `/memory gc --apply`. Pinning sets `pinned: true` in the run's `run-meta.json` and zeros prune scores.

A legacy shortcut is still supported only when the run ID is unambiguous across all projects:

```bash
/memory pin 2026-05-04T02-39-18Z
```

Prefer the project-scoped form for safety.

---

### `/memory unpin <project> --run <id>`

Remove pin protection from a run.

```bash
/memory unpin my-project --run 2026-05-04T02-39-18Z
```

After unpinning, scores are recomputed and persisted for that project. The run can become a GC candidate again if its score exceeds the threshold.

A legacy shortcut is supported only when the run ID is unambiguous:

```bash
/memory unpin 2026-05-04T02-39-18Z
```

---

### `/memory gc [project] [--dry-run] [--apply]`

Garbage collection is **dry-run by default**. It reports what would be archived and why.

```bash
# Dry-run all projects
/memory gc
/memory gc --dry-run

# Dry-run one project
/memory gc my-project
/memory gc my-project --dry-run

# Actually archive eligible runs for one project
/memory gc my-project --apply
```

**Dry-run behavior:**

- Computes candidates with `totalPruneScore > 0.7`
- Skips pinned runs
- Moves nothing
- Deletes nothing
- Does not rewrite `run-meta.json`

**Apply behavior:**

- Archives eligible, unpinned run directories by moving the **full run directory** to:

```text
C:/Users/DONALD/.pi/graphify-brain/.archive/<projectSlug>/<runId>/
```

- The archived directory contains the original artifacts, such as:
  - `run-meta.json`
  - `graph.json`
  - `GRAPH_REPORT.md`
  - `wiki/`
  - `obsidian/`
- Writes `archive-meta.json` into the archived run directory
- Marks metadata with archive fields such as `archived`, `archivedAt`, `archivePath`, and `deleteAfter`
- Does **not** purge or permanently delete archives in Phase 3A

Pinned runs cannot be archived by GC apply.

---

### `/memory keep <project> --run <id>`

Restore an archived run back into active run storage.

```bash
/memory keep my-project --run 2026-05-04T02-39-18Z
```

**What happens:**

- Finds the archived run at:

```text
C:/Users/DONALD/.pi/graphify-brain/.archive/<projectSlug>/<runId>/
```

- Restores the full archived run directory to:

```text
C:/Users/DONALD/.pi/graphify-brain/<projectSlug>/runs/<runId>/
```

- Restores full artifacts, including `run-meta.json`, `graph.json`, `GRAPH_REPORT.md`, `wiki/`, and `obsidian/` when they were present in the archive
- Auto-pins the restored run
- Clears archive fields in `run-meta.json`
- Leaves project-root LATEST artifacts untouched

The archived directory is moved back to active run storage during restore.

A legacy archive lookup by run ID is supported only if the archived run ID is unambiguous, but the safe and preferred grammar is:

```bash
/memory keep <project> --run <id>
```

---

## How Scores and Heat Work

### Prune Score

Each run gets a composite score from independent signals:

| Signal | Weight | Meaning |
|---|---:|---|
| Staleness | 35% | Heat-based age since useful access |
| Redundancy | 25% | Jaccard similarity against the newest run's node labels |
| LowSignal | 15% | Small graph penalty; strongest below 10 nodes |
| Obsoletion | 25% | Older rank relative to newer runs |

Formula:

```text
totalPruneScore = 0.35 × staleness + 0.25 × redundancy + 0.15 × lowSignal + 0.25 × obsoletion
```

Pinned runs score `0` regardless of signals.

### HeatTracker

The HeatTracker tracks whether a run is `hot`, `warm`, or `cold`. Phase 3A uses project-qualified keys to avoid run ID collisions:

```text
<projectSlug>/<runId>
```

Temperature behavior:

| Temperature | Condition |
|---|---|
| `hot` | Accessed less than 1 day ago |
| `warm` | Accessed 1–7 days ago |
| `cold` | Accessed more than 7 days ago |

`/memory save` seeds a new run as hot. `/memory load` and `/memory load --run` update both the global HeatTracker and durable `run-meta.json` access fields.

---

## Filesystem Layout

```text
C:/Users/DONALD/.pi/graphify-brain/
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

## Typical Workflows

### First-Time Setup

```bash
/graphify
/memory save
/memory list
/memory runs my-project
```

### Exploring Project History

```bash
/memory runs my-project
/memory load my-project --run 2026-05-01T12-00-00Z
/memory load my-project
```

### Safe Cleanup Review

```bash
/memory stats my-project
/memory prune my-project --dry-run
/memory gc my-project --dry-run
```

These commands are safe review commands: they do not move/delete files and do not rewrite run metadata.

### Protecting an Important Run

```bash
/memory pin my-project --run 2026-05-01T12-00-00Z
/memory gc my-project --dry-run
```

Pinned runs are immune to GC apply.

### Archiving Only After Review

```bash
/memory gc my-project --dry-run
# Review candidates carefully first.
/memory gc my-project --apply
```

GC apply archives eligible full run directories to `.archive/<projectSlug>/<runId>/`. It does not purge archives in Phase 3A.

### Restoring an Archived Run

```bash
/memory keep my-project --run 2026-05-01T12-00-00Z
```

The restored run is auto-pinned and its full archived artifacts are restored.

---

## Internal Context Selection

Phase 3A added a conservative internal context-selection helper. It can select latest, pinned, hot, or verifier-relevant safe runs while excluding archived or unsafe runs.

This helper is internal implementation support. There is no user-facing `/memory` command for context selection yet.

---

## Not Implemented as User Commands

Do not expect fractal compression, archetype detection, Weisfeiler-Lehman, MinHash, VF2, Louvain/Leiden, or community-compression commands in this phase. Phase 3A intentionally focuses on safe metadata, dry-run cleanup, full archive/restore, and access tracking.

---

## Tips

- Use project-scoped run commands: `/memory pin <project> --run <id>`, `/memory unpin <project> --run <id>`, and `/memory keep <project> --run <id>`.
- Always run `/memory gc <project> --dry-run` before `/memory gc <project> --apply`.
- Pin important milestones before cleanup.
- Load a run to mark it useful and update durable access metadata.
- Check archive contents at `C:/Users/DONALD/.pi/graphify-brain/.archive/<projectSlug>/<runId>/` before relying on restore.
- Root LATEST files remain for backward compatibility; historical runs live under `runs/<runId>/`.
