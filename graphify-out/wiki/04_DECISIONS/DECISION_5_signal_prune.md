---
type: decision
date: 2026-05-01
author: Tree Memory Proposal
status: accepted
alternatives:
  - "Single composite score" — rejected: loses signal-level granularity
  - "ML-predicted scores" — rejected: too complex, no training data
  - "Manual-only pruning" — rejected: doesn't scale
llm_context: "The 5 signals are independent inputs that sum to a composite score. Each signal has its own weight. Pin is not a signal — it's a boolean override."
graph_sources:
  - Tree Memory Proposal §Prune Score System
  - GRAPH_REPORT.md (Prune Score Composite System hyperedge)
---

# Decision: 5 Independent Signals for Pruning

## Context

How do you decide which runs to keep and which to delete?

A scoring system needs to be:
- **Transparent** — you should understand *why* a run was flagged
- **Configurable** — different projects might need different criteria
- **Safe** — false positives (deleting something important) are worse than false negatives (keeping something useless)

## Decision

**5 independent signals, summed with configurable weights:**

| # | Signal | What it measures | Why it exists |
|---|--------|-----------------|---------------|
| 1 | **Staleness** | Age of the run | Old runs lose relevance over time |
| 2 | **Redundancy** | Content overlap with other runs | Duplicate information wastes space |
| 3 | **Low Signal** | Insufficient content quality | Short/noisy runs aren't worth keeping |
| 4 | **Obsoletion** | Superseded by newer runs | Newer version makes older one obsolete |
| — | **Pin Override** | Manual protection flag | Human override — bypasses all signals |

Each signal produces a score from 0 (keep) to 1 (delete). They're multiplied by weights and summed.

**Critical design choice:** The signals are *independent*. Changing the staleness weight doesn't affect how redundancy works. This makes the system easy to tune — you adjust one knob at a time.

## Why not the alternatives

| Alternative | Why rejected |
|-------------|--------------|
| **Single composite score** | You lose the ability to explain *why* something was pruned. Was it too old? Too redundant? Both? With 5 signals, you can show a breakdown. |
| **ML-predicted scores** | No training data exists (we're building the system from scratch). ML would be guessing without feedback. Also adds complexity. |
| **Manual-only pruning** | Doesn't scale beyond a handful of runs. The whole point of the system is to handle hundreds of runs automatically. |

## Consequences

**Positive:**
- Transparent: each signal can be inspected independently
- Configurable: weights can be tuned per project
- Safe: the pin override provides a hard escape hatch
- Testable: each signal can be unit-tested in isolation

**Negative:**
- 5 signals × N runs = more computation than a single score
- Signal weights must be tuned (defaults may not be right for all use cases)
- Users might be overwhelmed by 5 numbers — the summary score helps

## Current Default Weights

| Signal | Weight | Source |
|--------|--------|--------|
| Staleness | 0.30 | Tree Memory Proposal |
| Redundancy | 0.25 | Tree Memory Proposal |
| Low Signal | 0.20 | Tree Memory Proposal |
| Obsoletion | 0.25 | Tree Memory Proposal |
| Pin | Bypass | Tree Memory Proposal |

## Related

- [[../02_SYSTEM_LAYERS/LAYER_02_Scoring|Layer 2: Scoring — The Judge]]
- [[../03_COMMUNITY_NARRATIVES/COMMUNITY_Pruning|Pruning & Temperature — The Librarian]]
