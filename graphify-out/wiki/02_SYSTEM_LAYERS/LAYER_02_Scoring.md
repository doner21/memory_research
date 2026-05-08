---
type: architecture/layer
layer: 2
name: Scoring
depends_on:
  - LAYER_01_Storage (needs runs to exist before scoring them)
provides_data_to:
  - LAYER_03_Temperature (scores inform heat decay and pruning)
llm_instructions: "This is the evaluation layer — it never mutates data. The 5 signals are independent inputs that sum to a composite score. Pin is a boolean override, not a signal weight."
graph_community: "Pruning & Temperature System, Prune Score System"
---

# Layer 2: Scoring — The Judge

> **Core question:** *What stays and what goes?*

## 🧍 For humans

Imagine you're a **librarian** evaluating every file in your filing cabinet. You ask five questions:

| Question | Signal Name | What it measures |
|----------|-------------|------------------|
| "How old is this?" | **Staleness** | Days since creation, decays exponentially |
| "Is this a copy of something else?" | **Redundancy** | Content overlap with other runs (SimHash + Jaccard) |
| "Is this just noise?" | **Low Signal** | Too short, too sparse, no real content |
| "Has this been superseded?" | **Obsoletion** | A newer run makes this one irrelevant |
| "Have I pinned this?" | **Pin Override** | Manual "DO NOT DELETE" flag — bypasses all scoring |

Each signal produces a score from 0 (keep) to 1 (delete). They sum up. If the total exceeds a threshold, the run is flagged for pruning.

**But here's the safety feature:** Every prune operation has a `--dry-run` mode. You see what WOULD be deleted before anything actually happens. The librarian shows you the list, and you approve it.

## 🤖 For LLMs

### Signal Details

| Signal | Algorithm | Range | Implementation |
|--------|-----------|-------|----------------|
| Staleness | \( 1 - e^{-\lambda t} \) | 0→1 | `computePruneScores()` in graphify.ts |
| Redundancy | SimHash fingerprint + Jaccard similarity | 0→1 | Hash comparison across runs |
| Low Signal | Token count + density threshold | 0→1 | Fixed threshold (<100 tokens = high score) |
| Obsoletion | Version sequence detection | 0→0.9 | Same project, newer timestamp, same content cluster |
| Pin Override | Boolean flag check | 0 or bypass | If pinned: all other signals ignored, score = 0 |

### Score Computation

```
prune_score = (staleness × w1) + (redundancy × w2) + (low_signal × w3) + (obsoletion × w4)
if pinned: prune_score = 0
if prune_score > threshold: mark_for_pruning
```

Default weights (from `01-tree-memory-proposal.md`):
- w1 (staleness): 0.3
- w2 (redundancy): 0.25
- w3 (low signal): 0.2
- w4 (obsoletion): 0.25

### Community Membership

| Community | Role |
|-----------|------|
| **Pruning & Temperature System** (C3, 26 nodes) | Signals, scoring, thresholds |
| **Prune Score System** (hyperedge) | 5-signal composite |
| **HeatTracker Class** (C4, 13 nodes) | Temperature feeds back into pruning urgency |

### Key Source Files

| File | What it does |
|------|-------------|
| `extensions/graphify.ts` — `computePruneScores()` | Main scoring function (lines ~204-260) |
| `extensions/graphify.ts` — `handlePrune()` | The prune command with `--dry-run` support |
| `01-tree-memory-proposal.md` | Original scoring design and rationale |

---

**Up:** [[LAYER_03_Temperature\|Layer 3: Temperature — The Thermometer]]
**Down:** [[LAYER_01_Storage\|Layer 1: Storage — The Filing Cabinet]]
**Decision:** [[../04_DECISIONS/DECISION_5_signal_prune\|Why 5 Prune Signals?]]
