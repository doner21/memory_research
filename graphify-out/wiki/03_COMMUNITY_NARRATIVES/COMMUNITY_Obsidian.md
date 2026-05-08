---
type: community/narrative
community_id: 7
graph_name: "Obsidian Vault Integration"
size: 8
cohesion: 0.39
llm_instructions: "This is the smallest and tightest community — all 8 nodes are functions that handle Obsidian vault sync. Cohesion 0.39 is the highest in the entire graph. These functions genuinely belong together."
tags: [community, obsidian, visualization, output]
---

# 🖼️ Community 7: Obsidian Integration — The Showcase

> **8 code nodes · Cohesion: 0.39 (tightest community in the graph)**

## 🧍 For humans

**Analogy: The gallery where the art is displayed.**

This community is about **showing the graph to humans**. Everything here is about the Obsidian vault — the human-readable wiki that lets you browse graph nodes like Wikipedia pages.

The community is tiny (8 nodes) and extremely tight (cohesion 0.39 — the highest in the graph). Every function here is directly related to every other function. They all serve one purpose: **getting graph data out of JSON files and into readable notes.**

The functions do:
1. **`ensureVault()`** — Make sure the Obsidian vault folder exists
2. **`copyObsidianToVault()`** — Copy generated notes into the vault
3. **`rebuildVaultIndex()`** — Regenerate the master index of all notes
4. **`openInObsidian()`** — Open the vault in the Obsidian app
5. **`handleWikiSyncCurrent()`** — Sync the current project
6. **`handleWikiSyncAll()`** — Sync all projects
7. **`handleWikiOpen()`** — Open a specific wiki note
8. **`handleWikiNotes()`** — List all notes

If you want to understand how the graph becomes readable, this is the entire story in 8 functions.

## 🤖 For LLMs

### Full Node List

All 8 nodes are functions in `extensions/graphify.ts`:

| Function | What it does |
|----------|-------------|
| `ensureVault()` | Creates `.obsidian/` vault directory structure |
| `copyObsidianToVault()` | Copies generated node files into the vault |
| `rebuildVaultIndex()` | Generates or updates `_INDEX.md` |
| `openInObsidian()` | Opens Obsidian app to the vault |
| `handleWikiSyncCurrent()` | `/memory-wiki sync-current` — syncs active project |
| `handleWikiSyncAll()` | `/memory-wiki sync-all` — syncs all projects |
| `handleWikiOpen()` | `/memory-wiki open` — opens a note |
| `handleWikiNotes()` | `/memory-wiki notes` — lists available notes |

### Community Structure

- **All code** (8/8)
- **Highest cohesion** in the graph (0.39)
- **Single responsibility** — all functions serve the Obsidian integration
- **Minimal external dependencies** — only depends on filesystem I/O and graph.json

### The Obsidian Pipeline

```
graph.json ──► copyObsidianToVault() ──► Obsidian vault
                    │
                    ├── rebuildVaultIndex() → _INDEX.md
                    ├── generate node.md files
                    └── generate _COMMUNITY_*.md files
```

### Key Source File

**`extensions/graphify.ts`** — Lines containing the wiki/obsidian handler functions.

### Suggested Questions for an LLM

- *"This community has the highest cohesion (0.39) — could it be extracted into its own `obsidian-sync.ts` module?"*
- *"How does `handleWikiSyncAll()` interact with `ensureVault()` — is there error handling if the vault path doesn't exist?"*
- *"What format does `copyObsidianToVault()` expect the node files to be in?"*
