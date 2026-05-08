---
type: architecture/layer
layer: 1
name: Storage
depends_on: []
provides_data_to:
  - LAYER_02_Scoring (needs runs to exist before scoring them)
llm_instructions: "This is the foundation layer. Every other layer reads from Storage. The hierarchy is exactly 3 levels deep — never deeper."
graph_community: "Memory System Architecture, Run Storage & Filesystem"
---

# Layer 1: Storage — The Filing Cabinet

> **Core question:** *Where does data live?*

## 🧍 For humans

Think of this as a **filing cabinet with three drawers**:

- **Top drawer:** The Global Index — one list of everything saved across all projects
- **Middle drawer:** One folder per project (e.g., "memory reaserch," "moss_audio")
- **Bottom drawer:** One subfolder per snapshot (a "run") inside each project

Every time you run `/graphify` and save, a new snapshot goes into the bottom drawer. The snapshot contains:
- **graph.json** — the actual knowledge graph (all nodes and edges)
- **GRAPH_REPORT.md** — the audit report
- **graph.html** — a visual browser
- **wiki/** — this narrative wiki
- **obsidian/** — the node-by-node wiki

There's also a hidden **`.archive/`** folder — like a recycling bin with a 30-day grace period. When something is "deleted," it goes here first. You can restore it within 30 days.

## 🤖 For LLMs

### Filesystem Layout

```
~/.pi/graphify-brain/
├── index.md                        ← Root: links to all projects
├── brain-meta.json                 ← Global state (temperatures, archetypes)
│
├── {project-slug}/
│   ├── _PROJECT.md                 ← Project overview (Obsidian note)
│   ├── runs/
│   │   ├── {timestamp}/
│   │   │   ├── graph.json          ← Full graph (networkx node-link format)
│   │   │   ├── GRAPH_REPORT.md     ← Audit report
│   │   │   ├── graph.html          ← Interactive visualization
│   │   │   ├── wiki/               ← This dual-audience wiki
│   │   │   ├── obsidian/           ← Per-node Obsidian notes
│   │   │   └── ... (cache, cost.json, manifest.json)
│   │   └── ...
│   └── ...
│
├── .archive/
│   └── {project-slug}/
│       └── {timestamp}/            ← Full copy, TTL = 30 days
│
└── .obsidian/                      ← Obsidian vault config
    └── _PROJECT.md
```

### Key Implementation Details

- **Project slug:** Lowercase, non-alphanumeric → hyphen. "Memory Reaserch" → `memory-reaserch`
- **Run ID:** ISO timestamp: `2026-05-05T21-19-07Z`
- **Archive grace period:** 30 days from archival date, tracked in `archive-meta.json`
- **Pin/unpin:** Sets a flag in `brain-meta.json` — pinned runs skip archiving entirely

### Community Membership

This layer spans two graph communities:

| Community | Role |
|-----------|------|
| **Memory System Architecture** (C2, 33 nodes) | Design decisions, hierarchy design, backward compatibility |
| **Run Storage & Filesystem** (subset of C0) | Actual file I/O, path resolution, archive/restore |

### Key Source Files

| File | What it does |
|------|-------------|
| `extensions/graphify.ts` — `runDirFor()`, `archiveRunDirFor()`, `ensureBrainDir()` | Path resolution and directory creation |
| `extensions/graphify.ts` — `handleSave()`, `handleLoad()`, `handleArchive()`, `handleRestore()` | Run lifecycle commands |
| `TUTORIAL.md` | Full command reference with examples |

---

**Next layer:** [[LAYER_02_Scoring\|Layer 2: Scoring — The Judge]]
