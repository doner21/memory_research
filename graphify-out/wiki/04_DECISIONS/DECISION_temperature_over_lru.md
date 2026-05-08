---
type: decision
date: 2026-05-01
author: Fractal Memory Proposal
status: accepted
alternatives:
  - "Pure LRU (Least Recently Used)" — rejected: too simple for semantic importance
  - "Pure FIFO (First In, First Out)" — rejected: ignores access patterns
  - "LFU (Least Frequently Used)" — rejected: frequency ≠ recency
llm_context: "Temperature over LRU reflects a key design philosophy: memory should decay like human memory, not like a cache. The Ebbinghaus curve makes decay fast-then-slow instead of uniform."
graph_sources:
  - Fractal Memory Proposal §Temperature System
  - Tree Memory Proposal §Ebbinghaus Forgetting Curve
  - GRAPH_REPORT.md (Ebbinghaus Forgetting Curve node)
---

# Decision: Temperature Over Pure LRU

## Context

When deciding which runs to compress, we need to know which ones are "still relevant."

Traditional cache systems use **LRU** (Least Recently Used) — delete the item that hasn't been accessed the longest. It's simple, proven, and used everywhere from CPU caches to Redis.

But LRU has a problem for our use case: **it treats all non-accessed time equally.** A run untouched for 1 day scores the same as one untouched for 1 month — they're both "not the most recently used."

## Decision

**Temperature system with Ebbinghaus decay, instead of pure LRU.**

Temperature has three states:
- **🔥 Hot** (recently accessed) — kept as-is
- **☀️ Warm** (not accessed for a while) — flagged for review
- **❄️ Cold** (not accessed for a long time) — eligible for compression

Temperature decays using the **Ebbinghaus forgetting curve**: \( R = e^{-t/S} \)

The curve means:
- Decay is **fast at first** — a run goes from Hot to Warm quickly
- Decay **slows down** — once a run is 30 days old, it takes much longer to go from Warm to Cold
- This matches human memory: you forget details fast, but core memories persist

## Why not the alternatives

| Alternative | Why rejected |
|-------------|--------------|
| **Pure LRU** | Too binary — either "most recent" or "everything else." No intermediate states. Also doesn't model how relevance actually decays. |
| **Pure FIFO** | Ignores access patterns entirely. A run accessed yesterday gets the same treatment as one accessed a year ago. |
| **LFU (Least Frequently Used)** | Frequency ≠ recency. A run that was popular 6 months ago but untouched since would score high, despite being irrelevant. |

## Consequences

**Positive:**
- More nuanced than LRU — 3 states instead of 2
- Psychologically informed decay (Ebbinghaus curve)
- Temperature feeds naturally into compression eligibility (only cold runs compress)
- Compatible with the pin override (pinned runs stay hot)

**Negative:**
- More complex than LRU (decay calculation, state management)
- Decay parameters (thresholds for warm/cold) need tuning
- No standard implementation — we're inventing the model

## The Bridge

Temperature also bridges scoring and compression:
- **From Scoring:** Prune scores help determine *which* runs to cool down faster
- **To Compression:** Only cold runs are eligible for compression

This makes Temperature the **natural middle layer** between evaluation and action.

## Related

- [[../02_SYSTEM_LAYERS/LAYER_03_Temperature|Layer 3: Temperature — The Thermometer]]
- [[../03_COMMUNITY_NARRATIVES/COMMUNITY_Pruning|Pruning & Temperature — The Librarian]]
- [[DECISION_5_signal_prune|Why 5 Prune Signals?]]
