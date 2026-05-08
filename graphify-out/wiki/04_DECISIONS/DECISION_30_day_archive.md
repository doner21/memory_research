---
type: decision
date: 2026-05-01
author: Tree Memory Proposal + Unified Plan
status: accepted
alternatives:
  - "Immediate deletion" — rejected: dangerous, no recovery
  - "7-day grace period" — rejected: too short for monthly workflows
  - "No archive (user confirms each deletion)" — rejected: doesn't scale
llm_context: "The 30-day archive is the safety net. Every deletion goes through it first. The grace period is designed for monthly review cycles."
graph_sources:
  - Tree Memory Proposal §Archive System
  - Unified Memory Management Plan Phase 2
---

# Decision: 30-Day Archive Grace Period

## Context

When a run is flagged for pruning, what should happen?

- **Immediate deletion** is risky — what if a run was incorrectly scored?
- **User confirmation every time** doesn't scale — you might have hundreds of flagged runs
- **No deletion at all** defeats the purpose of pruning

We needed a middle ground: delete, but give the user time to change their mind.

## Decision

**30-day archive grace period.** When a run is pruned:

1. Move the full run directory from `graphify-brain/{project}/` to `graphify-brain/.archive/{project}/`
2. Record the archive date in `archive-meta.json`
3. If the user restores it within 30 days, move it back
4. After 30 days, permanently delete it

## Why 30 days?

30 days was chosen because it aligns with:
- **Monthly review cycles** — users naturally review their work on a monthly cadence
- **Project sprints** — a typical sprint or milestone is 2-4 weeks
- **The Ebbinghaus curve** — after 30 days without access, a run is deeply "cold," making permanent deletion low-risk

## Why not the alternatives

| Alternative | Why rejected |
|-------------|--------------|
| **Immediate deletion** | Single scoring error could cause permanent data loss. Especially dangerous during early development when scores are being tuned. |
| **7-day grace period** | Too short. A user on vacation for a week could lose runs. Monthly review cycles wouldn't fit. |
| **No archive (manual confirm)** | Doesn't scale past a few runs. If pruning flags 50 runs, asking for 50 confirmations is impractical. |

## Consequences

**Positive:**
- Full safety net — you can always restore within 30 days
- Automatic cleanup — no manual intervention needed
- Compatible with dry-run mode (you preview, it archives)

**Negative:**
- Storage isn't freed during the grace period (runs still exist on disk)
- Archive directory needs its own maintenance (pruning the archive)
- Users might think "30 days = guaranteed retention" and not check

**Mitigation:** The archive is itself eligible for pruning after 30 days, so it never grows unbounded.
