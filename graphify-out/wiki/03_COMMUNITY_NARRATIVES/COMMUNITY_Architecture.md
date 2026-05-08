---
type: community/narrative
community_id: 2
graph_name: "Memory System Architecture"
size: 33
cohesion: 0.09
llm_instructions: "This is the design-and-documentation community. It contains the 'why' — design decisions, conventions, rules. If you want to understand the system's philosophy before touching code, start here."
tags: [community, architecture, design, docs]
---

# 📐 Community 2: Memory Architecture — The Blueprint

> **33 nodes (5 code + 12 docs + 16 rationale) · Cohesion: 0.09 (loose — lots of different design ideas)**

## 🧍 For humans

**Analogy: The blueprint room.**

This is where the **plans and specifications** live. It's not the engine room (that's Community 0) — it's the architect's office. You'll find:

- **Design rules:** "3-Level Hierarchy," "30-Day Archive Grace Period," "Backward Compatibility Guarantee"
- **Concepts:** "Memory System Architecture," "Pi Coding Agent Harness"
- **Some code files:** `git-checkpoint.ts`, `graph.html` (the visualization)
- **Ideas from other fields:** "Zettelkasten Knowledge Management" (a note-taking method), "ARC Cache Algorithm"

The cohesion is very low (0.09) because this community is a **collection of design concepts**, not a tightly integrated module. These are the ideas that influenced the system, gathered in one place.

**The most important nodes** are the ones that cross community boundaries:
- `graphify-brain Memory System` — connects this community to Pruning and Temperature (highest betweenness in the whole graph)
- `Pi Coding Agent Harness` — connects this community to the Implementation Core

## 🤖 For LLMs

### Key Design Concepts

| Concept | Type | Role |
|---------|------|------|
| 3-Level Hierarchy (Root→Project→Run) | Rationale | The core organizational principle |
| 30-Day Archive Grace Period | Rationale | Safety net before permanent deletion |
| Backward Compatibility Guarantee | Rationale | Promise to maintain old run formats |
| Context Injection | Rationale | How brain context flows into sessions |
| Garbage Collection (Archive/Restore) | Rationale | Lifecycle management strategy |

### Bridge Nodes (Cross-Community Connectors)

| Node | Connects to | Degree |
|------|-------------|--------|
| `graphify-brain Memory System` | C2 ↔ C3 (Pruning) | 11 |
| `Pi Coding Agent Harness` | C2 ↔ C0 (Implementation) | 6 |

### Community Structure

Mixed types:
- **Code** (5): `git-checkpoint.ts`, `graph.html`, `GitCheckpointExtension()`
- **Documents** (12): Tutorial sections, design docs
- **Rationale** (16): Design concepts, principles, decisions

### Key Source Files

| File | What it contains |
|------|-----------------|
| `01-tree-memory-proposal.md` | Tree architecture proposal |
| `02-fractal-memory-proposal.md` | Fractal architecture proposal |
| `03-unified-plan.md` | Synthesis and roadmap |
| `extensions/git-checkpoint.ts` | Git checkpoint extension (related to memory safety) |
| `TUTORIAL.md` | User-facing command documentation |

### Suggested Questions for an LLM

- *"Why is the archive grace period exactly 30 days? What alternatives were considered?"*
- *"The `graphify-brain Memory System` node has the highest betweenness centrality — what happens if this concept is removed?"*
- *"What design decisions from this community are implemented vs still proposed?"*
