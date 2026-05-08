---
type: architecture/layer
layer: 4
name: Compression
depends_on:
  - LAYER_03_Temperature (only cold runs are eligible for compression)
  - LAYER_01_Storage (reads runs to compress)
provides_data_to:
  - LAYER_05_Archetypes (compressed runs feed into pattern detection)
llm_instructions: "Compression is about structural preservation, not content loss. The compression state machine has 4 states: Raw → Communities → Compressed → Frozen. Coherence scoring determines if compression preserves meaning."
graph_community: "Design Proposals (Tree+Fractal), Graphify Skill & Knowledge Graph"
cross_ref:
  - DECISION: Why fractal compression? (no page yet)
  - CONCEPT: Fractal dimension, community detection, supernode aggregation
---

# Layer 4: Compression — The Archivist

> **Core question:** *How do we make old stuff small without losing the shape?*

## 🧍 For humans

Think of this like **turning a full book into a chapter-by-chapter summary**.

When a run is cold enough (nobody has touched it in a while), it becomes eligible for compression. The system doesn't delete it — it *summarizes* it, keeping the structure but discarding the fine details.

The compression happens in **4 stages**:

| Stage | What happens | Looks like |
|-------|-------------|------------|
| **Raw** | Full graph, nothing compressed | A book with every word |
| **Communities** | Related nodes are grouped | You notice the book has 5 chapters |
| **Compressed** | Each group becomes one "supernode" | Each chapter becomes one paragraph |
| **Frozen** | The compressed version is locked | The summary becomes permanent |

The system checks whether the compressed version still "looks like" the original by measuring **fractal dimension**. If the shape changed too much, compression is rejected.

## 🤖 For LLMs

### Compression State Machine

```
RAW ──► COMMUNITIES ──► COMPRESSED ──► FROZEN
  │                        │
  │ (coherence too low)    │ (human reviews)
  └── rejects ────────────┘
```

### Compression Techniques

| Technique | What it does | Used when |
|-----------|-------------|-----------|
| **Community Detection** (Louvain/Leiden) | Groups related nodes | Starting compression |
| **Supernode Aggregation** | Replaces a community with 1 summary node | Making it smaller |
| **Fractal Dimension Preservation** | Checks compressed shape ≈ original shape | Validating quality |
| **Coherence Scoring** | Measures density + cohesion of compressed output | Deciding to freeze |

### Coherence Scoring

Coherence = (internal edge density) × (1 - community overlap)

Score thresholds:
- 0.0–0.3: Too loose — reject compression, keep as communities
- 0.3–0.6: Acceptable — compress but keep human review
- 0.6–1.0: Good — automatically freeze

### Fractal Dimension

Fractal dimension \( D \) is computed using the box-covering method:
- Divide the graph into boxes of size ε
- Count how many boxes are needed (N)
- \( D = \lim_{\epsilon \to 0} \frac{\log N(\epsilon)}{\log(1/\epsilon)} \)

The compressed version must preserve \( D \) within ±0.15 of the original.

### Community Membership

| Community | Role |
|-----------|------|
| **Design Proposals (Tree+Fractal)** (C5, 12 nodes) | Theoretical foundation — fractal math, compression state machine |
| **Graphify Skill & Knowledge Graph** (C6, 10 nodes) | Implementation — community detection, supernodes |
| **Pruning & Temperature System** (C3) | Temperature determines eligibility |

### Key Source Files

| File | What it does |
|------|-------------|
| `02-fractal-memory-proposal.md` | Fractal compression theory |
| `03-unified-plan.md` | Compression phase roadmap |
| `extensions/graphify.ts` (planned) | Future compression implementation |

---

**Up:** [[LAYER_05_Archetypes\|Layer 5: Archetypes — The Pattern Finder]]
**Down:** [[LAYER_03_Temperature\|Layer 3: Temperature — The Thermometer]]
