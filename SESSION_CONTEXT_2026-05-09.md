# Session Continuation — 2026-05-09

## Session Summary

Reviewed `pi-config-harness-review-handoff.md` — an architectural review of the pi-config harness (github.com/doner21/pi-config). Produced a grounded critique of each improvement area against the actual `memory reaserch` codebase (`extensions/graphify.ts`, `skills/graphify/SKILL.md`, brain architecture). Pushed 51 commits to `origin/main` on `github.com/doner21/memory_research`.

## Key Decision: What Matters vs. What Doesn't

The handoff proposes 10 phases. For **this codebase** (the graphify brain extension), only 4 are actionable. The rest belong in Pi-core or the pi-config orchestrator.

## Priority Queue (in order)

### 1. Respect `safeToInject` and `verifiedStatus` in `brainContextForCwd()`
- **File:** `extensions/graphify.ts` ~line 350+
- **What:** The `RunMeta` already has `safeToInject: boolean`, `verifiedStatus: string`, `failureSignatures: string[]` — but `brainContextForCwd()` ignores them and blindly injects the latest GRAPH_REPORT.md
- **Fix:** Add gate: skip injection if `safeToInject === false` or `verifiedStatus === "failed"`

### 2. Manifest-first injection instead of full GRAPH_REPORT.md
- **File:** Same function
- **What:** Instead of injecting the entire report, inject a small manifest (project name, saved_at, node count, freshness, retrieval instruction). Let the agent request detailed graph slices on demand.
- **Fix:** Split `brainContextForCwd()` into manifest (always injected) + slice retrieval (on-demand via a tool or command)

### 3. Staleness check using existing HeatTracker
- **What:** HeatTracker already tracks hot/warm/cold temperatures. Use it to warn when injecting stale memory (>7 days cold)
- **Fix:** Add freshness gate to `brainContextForCwd()` — inject a staleness warning for cold runs

### 4. Git checkpoint hardening
- **File:** `extensions/git-checkpoint.ts`
- **What:** Currently may use broad `git add -A`. Replace with `git status --porcelain` + patch snapshots to avoid absorbing unrelated human work
- **Fix:** Pre-write diff to `.pi/checkpoints/<runId>/pre.patch`, only auto-add tracked files

## Out of Scope for the Brain (belongs in Pi-core or pi-config)

- Subagent run ledgers — Pi's subagent spawning code, not graphify
- Capability policy enforcement — Pi's tool-call interception layer
- Evidence-based verification — NenFlow verifier skill
- Progressive MCP/Playwright disclosure — Pi-core MCP management
- Secret scanning — repository hygiene, not architectural

## Already Works Well

- `/graphify --update` flow: incremental re-extraction on changed files (AST-only if code-only, semantic on docs/papers)
- `/memory save`: immutable timestamped runs, never overwrites
- HeatTracker: access tracking, temperature decay (hot/warm/cold), persisted to `brain-meta.json`
- Path resolution: already uses `os.homedir()` — portable across OSes

## Current State

- **Branch:** `main`
- **Remote:** `https://github.com/doner21/memory_research`
- **Last push:** `bc293b0..deb3b4a` (51 commits)
- **Brain run:** `2026-05-09T11-22-02Z` (run 3, 213 nodes, 402 edges)
- **Working tree:** clean

## Resuming

To resume where we left off:

```
/memory load "memory reaserch"
```

Then pick up at Priority 1: modifying `brainContextForCwd()` in `extensions/graphify.ts` to gate on `safeToInject` and `verifiedStatus`.

The handoff document is at: `C:\Users\doner\Downloads\pi-config-harness-review-handoff.md`

## Non-Negotiable Invariants

- Do not remove existing brain functionality
- Preserve backward compatibility with existing run metadata
- Immutable runs — never mutate a saved run, always create new snapshots
- `HeatTracker` must continue to function across all changes
