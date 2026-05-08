---
type: decision
date: 2026-05-01
author: Graphify Brain implementation
status: accepted
alternatives:
  - "Custom web UI" — rejected: more development work, reinventing wheels
  - "Direct JSON reading" — rejected: not human-friendly
  - "VS Code extension" — rejected: ties viewer to a specific editor
llm_context: "Obsidian was chosen for its graph view, backlinks, Canvas, and Dataview plugin. It's a viewing layer, not a storage layer — all data lives in markdown files."
graph_sources:
  - Community 7 (Obsidian Vault Integration)
  - GRAPH_REPORT.md
---

# Decision: Obsidian as the Human Viewer

## Context

The graph data is stored as JSON — machine-readable but not human-friendly. We needed a way for humans to browse the graph without reading raw JSON.

Requirements:
- **Visual graph view** — see nodes and edges
- **Navigation** — click through related notes
- **Editing** — add human annotations alongside machine-generated data
- **Offline** — no server required
- **Free** — no per-user licensing costs

## Decision

**Use Obsidian as the graph viewer.** Every node in the graph becomes a markdown file in an Obsidian vault.

Obsidian provides:
- **Graph view** — native force-directed graph visualization
- **Backlinks** — automatic "linked mentions" for every node
- **Canvas** — structured layout with community groupings (we generate a `.canvas` file)
- **Dataview plugin** — dynamic queries over note metadata
- **Markdown** — all notes are plain .md files, readable without Obsidian

## Why not the alternatives

| Alternative | Why rejected |
|-------------|--------------|
| **Custom web UI** | Building a graph viewer from scratch is significant work. Obsidian already does it well, with features (backlinks, search, graph filters) that would take months to replicate. |
| **Direct JSON reading** | Raw JSON isn't human-friendly. The whole point is to make the graph accessible to non-coders. |
| **VS Code extension** | Ties the viewer to VS Code. Non-coders may not use VS Code. Also, VS Code's graph visualization is weaker than Obsidian's. |

## Consequences

**Positive:**
- Rich viewing experience (graph view, backlinks, Canvas, Dataview)
- Offline-capable (no server needed)
- Editable — humans can add notes alongside machine-generated ones
- Free and open source
- Cross-platform (Windows, Mac, Linux, mobile)

**Negative:**
- External dependency — users must install Obsidian separately
- Two-step workflow: generate notes → open in Obsidian
- Some Obsidian features (Dataview) require plugins
- Large vaults (>1000 notes) may slow down Obsidian's graph view

## Mitigation

For large graphs, the interactive HTML view (`graph.html`) serves as a lightweight alternative. The Obsidian vault is the *primary* viewer for browsing, but the HTML view is available for quick lookups without launching Obsidian.

## Related

- [[../03_COMMUNITY_NARRATIVES/COMMUNITY_Obsidian|Obsidian Integration — The Showcase]]
- [[../01_OVERVIEW/ARCHITECTURE_AT_A_GLANCE|Architecture at a Glance]]
