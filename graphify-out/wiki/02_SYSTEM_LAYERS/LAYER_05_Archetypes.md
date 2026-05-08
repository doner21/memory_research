---
type: architecture/layer
layer: 5
name: Archetypes
depends_on:
  - LAYER_04_Compression (needs compressed runs to find patterns across)
  - LAYER_01_Storage (reads multiple projects)
provides_data_to: []
llm_instructions: "Archetype detection is the most forward-looking layer — it's designed but not fully implemented. It looks for structural patterns across projects using graph isomorphism and clustering."
graph_community: "Design Proposals (Tree+Fractal)"
status: proposed
---

# Layer 5: Archetypes — The Pattern Finder

> **Core question:** *What patterns keep showing up?*

## 🧍 For humans

Think of this as a **detective who looks at all your projects and notices patterns**.

- "You always build things with three parts: a frontend, a backend, and a database."
- "The structure of your 'moss_audio' project looks a lot like your 'memory reaserch' project — just different names."
- "You tend to have one 'core' module and several 'utility' modules around it."

The Archetype system finds these patterns automatically. When you start a new project, it can say: "This looks like your usual pattern. Here's what you typically build next."

This is the **most experimental** layer — the theory is solid but much of the implementation is still on the drawing board.

## 🤖 For LLMs

### Detection Methods

| Method | What it detects | Status |
|--------|----------------|--------|
| **WL Graph Isomorphism** | Two graphs with identical structure but different labels | Designed |
| **Formal Concept Analysis (FCA)** | Hierarchical concept lattices across projects | Designed |
| **MinHash + LSH** | Similar content fingerprints across projects | Mocked |
| **Fractal Dimension Comparison** | Similar complexity profiles | Designed |

### The Archetype Lifecycle

```
Raw runs ──► Compressed ──► Compare structures ──► Detect archetype
                              │
                              ├── WL isomorphism (same shape?)
                              ├── FCA lattice (same hierarchy?)
                              └── MinHash (same content?)
                                      │
                                      ▼
                              Register archetype in brain-meta.json
                                      │
                                      ▼
                              Future runs check against known archetypes
```

### Current State

Based on the graph data and source documents:

- **Phase 5** (from the 6-phase roadmap) explicitly covers Archetype Detection
- `detectArchetypes()` function is defined in the fractal memory proposal
- `brain-meta.json` schema includes an `archetypes` array for storage
- Cross-project archetype system bridges the gap between individual project graphs

### Community Membership

| Community | Role |
|-----------|------|
| **Design Proposals (Tree+Fractal)** (C5) | Theoretical foundation |
| **Graphify Skill & Knowledge Graph** (C6) | Graph theory tools (isomorphism) |

### Key Source Files

| File | What it does |
|------|-------------|
| `02-fractal-memory-proposal.md` | Archetype theory and motivation |
| `03-unified-plan.md` | Phase 5: Archetypes Detection |
| `extensions/graphify.ts` — `detectArchetypes()` | Stub implementation |

---

**Down:** [[LAYER_04_Compression\|Layer 4: Compression — The Archivist]]
**See also:** [[../03_COMMUNITY_NARRATIVES/COMMUNITY_Design\|Design Proposals — the big ideas behind archetypes]]
