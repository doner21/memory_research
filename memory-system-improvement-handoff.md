# Memory System Improvement Handoff

## Context

The first phase of the graphify-brain memory system has already been implemented from the planner document. The implemented baseline should be assumed to include run-level storage:

- `/memory save` creates timestamped runs under `~/.pi/graphify-brain/<project-slug>/runs/<run-id>/`
- project-root artifacts remain as `LATEST` for backward compatibility
- `run-meta.json` exists per run
- `meta.json` is extended with at least `schemaVersion`, `runCount`, and `lastRunId`
- `/memory runs <project>` can list saved runs
- `/memory load <project> --run <id>` can load a specific run, while `/memory load <project>` still loads latest

The next agent should improve the memory system without breaking the Phase 1 invariants.

---

## Primary Goal

Improve the memory system from **versioned storage** into a **useful harness memory substrate** for Pi Code / graphify-brain.

The next phase should make memory operationally useful for agents by adding:

1. reliable run metadata
2. access and temperature tracking
3. pinning and protection
4. dry-run pruning
5. safe context-injection signals
6. verifier-aware memory fields
7. archive-before-delete garbage collection

The system should remain simple, inspectable, and backward compatible.

---

## Non-Negotiable Invariants

### 1. Backward compatibility must remain intact

Do not break current consumers that expect these files at project root:

```text
~/.pi/graphify-brain/<project-slug>/graph.json
~/.pi/graphify-brain/<project-slug>/GRAPH_REPORT.md
~/.pi/graphify-brain/<project-slug>/wiki/
~/.pi/graphify-brain/<project-slug>/obsidian/
~/.pi/graphify-brain/<project-slug>/meta.json
```

The `runs/` directory is additive. The project root remains the `LATEST` view.

### 2. Never delete memory directly

All destructive operations must go through archive first.

Expected flow:

```text
active run → .archive/ → delete only after grace period
```

Default archive grace period: 30 days.

### 3. Human pinning overrides automated pruning

Pinned runs must never be archived or deleted unless explicitly unpinned by the user.

### 4. Dry-run before mutation

Any pruning or garbage-collection command must support a dry-run mode. The dry-run output should explain why each candidate was selected.

### 5. Do not treat access frequency as truth

Heat, access count, and recency are only usefulness signals. They do not prove that a memory is correct, current, or safe to inject.

### 6. Memory injection must be conservative

Not all stored memory should be automatically injected into agent context. Add explicit metadata to support this distinction.

---

## Current Architecture to Preserve

Expected storage layout:

```text
~/.pi/graphify-brain/
├── index.md
├── brain-meta.json                 # may not exist yet; add when needed
├── .archive/                       # add in pruning/GC phase
├── obsidian-vault/
└── <project-slug>/
    ├── meta.json
    ├── graph.json                  # LATEST
    ├── GRAPH_REPORT.md             # LATEST
    ├── wiki/                       # LATEST
    ├── obsidian/                   # LATEST
    └── runs/
        └── <run-id>/
            ├── run-meta.json
            ├── graph.json
            ├── GRAPH_REPORT.md
            ├── wiki/
            └── obsidian/
```

---

## Recommended Next Phase

### Phase 2A: Metadata hardening

Before adding pruning or compression, harden the metadata model.

Add or migrate `run-meta.json` toward this shape:

```jsonc
{
  "runId": "2026-05-04T14-30-00Z",
  "projectSlug": "example-project",
  "savedAt": "2026-05-04T14:30:00Z",
  "nodeCount": 120,
  "edgeCount": 300,
  "artifactCount": 5,

  "temperature": "hot",
  "lastAccessedAt": "2026-05-04T14:30:00Z",
  "accessCount": 0,

  "pinned": false,
  "archived": false,
  "archivedAt": null,

  "verifiedStatus": "untested",
  "sourceType": "graphify",
  "agentRole": "unknown",

  "safeToInject": true,
  "contextPriority": 0.5,

  "failureSignatures": [],
  "invariants": [],
  "openQuestions": [],

  "pruneScore": {
    "staleness": 0,
    "redundancy": 0,
    "lowSignal": 0,
    "obsoletion": 0,
    "pinned": false
  },
  "totalPruneScore": 0,

  "compressionState": "raw"
}
```

#### Why this matters

The existing Phase 1 implementation gives version history. These fields turn version history into agent-usable memory.

Important distinction:

- `stored` means the harness remembers it exists
- `safeToInject` means the harness may place it into an active agent context
- `verifiedStatus` tells the next agent whether to trust it operationally
- `pinned` protects it from pruning

---

## Phase 2B: Access and heat tracking

Implement a small `HeatTracker` or equivalent metadata update function.

### Required behavior

When a run is loaded:

```text
accessCount += 1
lastAccessedAt = now
temperature = recomputed value
```

When a run is created:

```text
temperature = hot
lastAccessedAt = savedAt
accessCount = 0
```

When stats or pruning runs:

```text
decay temperatures based on lastAccessedAt
```

### Suggested temperature model

Keep it simple:

```text
hot  = accessed within 24 hours
warm = accessed within 7 days
cold = not accessed for more than 7 days
```

Optional refinement:

```text
veryCold = not accessed for more than 30 days
```

Do not over-engineer this yet. Heat is a practical affordance, not a truth model.

---

## Phase 2C: `/memory stats`

Add or improve `/memory stats [project]`.

### Expected output

For all projects:

```text
Global brain stats
- projects: 8
- runs: 42
- total disk usage: 18.4 MB
- hot runs: 3
- warm runs: 9
- cold runs: 30
- pinned runs: 4
- archived runs: 2
```

For one project:

```text
Project: ci-labs-london
- runs: 6
- latest: 2026-05-04T14-30-00Z
- node count latest: 244
- edge count latest: 510
- hot/warm/cold: 1 / 2 / 3
- pinned: 1
- prune candidates: 2
```

### Requirements

- Do not mutate state unless explicitly asked, except harmless temperature recalculation if implemented as derived metadata.
- Show enough information for a human to decide whether memory is healthy.

---

## Phase 2D: Pinning

Add:

```text
/memory pin <project> [--run <id>]
/memory unpin <project> [--run <id>]
```

If no run is provided, default to latest run.

### Pin behavior

Pinned run:

```jsonc
{
  "pinned": true,
  "safeToInject": true
}
```

Pinned runs should have `totalPruneScore = 0` or be ignored by pruning.

### Output example

```text
Pinned run 2026-05-04T14-30-00Z for project ci-labs-london.
This run is now protected from pruning and archive operations.
```

---

## Phase 2E: Dry-run pruning

Add:

```text
/memory prune [project] [--dry-run]
```

Default behavior should be dry-run unless `--apply` or `/memory gc` is explicitly used.

### Prune score

Use a simple composite:

```text
if pinned:
  totalPruneScore = 0
else:
  totalPruneScore =
    0.35 * staleness +
    0.25 * redundancy +
    0.15 * lowSignal +
    0.25 * obsoletion
```

### Signal definitions

#### Staleness

Derived from last access:

```text
hot  → 0.0
warm → 0.3
cold → 0.7 to 1.0 depending on age
```

#### Redundancy

Compare node labels in the candidate run against the latest run of the same project.

Important: for pruning, redundancy should increase when similarity is high.

```text
similarity = |A ∩ B| / |A ∪ B|
redundancy = similarity
```

Do not invert this accidentally.

#### Low signal

Suggested rules:

```text
nodeCount < 5 → 0.9
edgeCount == 0 → 0.8
edgeCount / nodeCount < 0.5 → 0.5
otherwise → 0.0 to 0.2
```

#### Obsoletion

Rank among sibling runs:

```text
newest run → 0.0
oldest run → approaches 1.0
```

Simple implementation:

```text
obsoletion = rank / (totalRuns - 1)
```

Where `rank = 0` for newest.

### Pruning thresholds

```text
totalPruneScore >= 0.70 → candidate for archive
totalPruneScore >= 0.90 → strong candidate, still archive first
```

### Dry-run output example

```text
Prune candidates for ci-labs-london

1. 2026-04-01T09-30-00Z
   score: 0.78
   reasons:
   - cold: not accessed for 26 days
   - redundant: 91% node overlap with latest
   - obsolete: 4 runs behind latest
   action: archive candidate

2. 2026-03-21T17-10-00Z
   score: 0.92
   reasons:
   - cold: not accessed for 44 days
   - low signal: 3 nodes, 0 edges
   - obsolete: oldest run
   action: strong archive candidate
```

---

## Phase 2F: Archive and garbage collection

Add:

```text
/memory gc [project] [--dry-run] [--apply]
/memory keep <project> --run <id>
```

### Archive behavior

Do not delete runs immediately.

Move runs to:

```text
~/.pi/graphify-brain/.archive/<project-slug>/<run-id>/
```

Write archive metadata:

```jsonc
{
  "projectSlug": "ci-labs-london",
  "runId": "2026-04-01T09-30-00Z",
  "archivedAt": "2026-05-04T15:00:00Z",
  "originalPath": "~/.pi/graphify-brain/ci-labs-london/runs/2026-04-01T09-30-00Z",
  "reason": "pruneScore >= 0.70",
  "deleteAfter": "2026-06-03T15:00:00Z"
}
```

### Keep behavior

`/memory keep` restores the run from archive to its original project `runs/` folder and sets:

```jsonc
{
  "pinned": true,
  "archived": false,
  "archivedAt": null
}
```

---

## Phase 2G: Context injection policy

Add a helper that determines which memory should be injected into an agent context.

Suggested function:

```ts
function selectMemoryForContext(projectSlug: string, role: AgentRole): MemorySelection
```

### Selection rules

Always consider:

1. latest run for current project
2. pinned runs for current project
3. recent verifier failures
4. human-authored invariants
5. hot runs with `safeToInject: true`

Usually avoid:

1. archived runs
2. failed plans unless explicitly relevant
3. speculative notes
4. unverified assumptions
5. old cold runs with low signal

### Role-specific context

Planner should receive:

```text
- latest project summary
- previous plans
- open questions
- high-level architecture
- known constraints
```

Executor should receive:

```text
- current plan
- file paths
- implementation constraints
- exact task scope
- known fragile areas
```

Verifier should receive:

```text
- acceptance criteria
- previous failure signatures
- test commands
- screenshots/evidence requirements
- invariants that must not regress
```

Observer should receive:

```text
- role boundaries
- context drift indicators
- verification gaps
- repeated failure patterns
```

---

## Phase 2H: Verifier-aware memory

The harness should remember test outcomes, not just graph shape.

Add support for fields like:

```jsonc
{
  "verifiedStatus": "passed",
  "verification": {
    "checkedAt": "2026-05-04T15:10:00Z",
    "method": "playwright",
    "commands": ["npm test", "npm run build"],
    "evidence": ["screenshots/mobile-home.png"],
    "summary": "Hero image fills viewport on desktop and mobile.",
    "failures": []
  }
}
```

For failed runs:

```jsonc
{
  "verifiedStatus": "failed",
  "failureSignatures": [
    "mobile hero image not loading",
    "admin edit pane white overlay",
    "slug not updating after title change"
  ]
}
```

This is more useful for Pi Code than abstract graph compression.

---

## Do Not Build Yet

Avoid these until the basic memory metabolism is stable:

### 1. Archetype detection

Useful later, but premature unless there are enough projects and runs.

### 2. WL graph isomorphism

Interesting, but currently overkill. Use simple label-set Jaccard first.

### 3. Full fractal compression

Compression can erase operational detail if added too early. Add only after verifier-aware metadata and pinning exist.

### 4. Automatic deletion

Do not implement direct deletion until archive, keep, pin, and dry-run behavior are thoroughly verified.

---

## Suggested Command Set After This Phase

```text
/memory save
/memory list
/memory load <project> [--run <id>]
/memory runs <project>
/memory stats [project]
/memory pin <project> [--run <id>]
/memory unpin <project> [--run <id>]
/memory prune [project] [--dry-run]
/memory gc [project] [--dry-run] [--apply]
/memory keep <project> --run <id>
```

---

## Verification Gates

The next agent should not claim success without testing these conditions.

### Gate 1: Backward compatibility

1. Run `/memory save` on a project.
2. Confirm project root still has latest:

```text
graph.json
GRAPH_REPORT.md
meta.json
wiki/
obsidian/
```

3. Confirm existing `/memory load <project>` still loads latest.

### Gate 2: Multiple runs

1. Run `/memory save` twice.
2. Confirm two separate run folders exist.
3. Run `/memory runs <project>`.
4. Confirm both runs display correctly.

### Gate 3: Load specific run

1. Load latest normally.
2. Load an older run with `--run`.
3. Confirm the selected run is loaded, not latest.
4. Confirm `accessCount` and `lastAccessedAt` update.

### Gate 4: Pinning

1. Pin an older run.
2. Run prune dry-run.
3. Confirm pinned run is not a prune candidate.
4. Unpin it.
5. Confirm it can become a candidate again.

### Gate 5: Dry-run pruning

1. Create or simulate old/cold runs.
2. Run `/memory prune <project> --dry-run`.
3. Confirm no files are moved.
4. Confirm the output explains score and reasons.

### Gate 6: Archive

1. Run `/memory gc <project> --apply` on a known candidate.
2. Confirm the run moves to `.archive/`.
3. Confirm archive metadata is written.
4. Confirm latest project root is not broken.

### Gate 7: Keep

1. Run `/memory keep <project> --run <id>`.
2. Confirm the run is restored from archive.
3. Confirm it is pinned after restore.

### Gate 8: Context selection

1. Create one latest run, one pinned run, one archived run, and one failed verifier run.
2. Call the context-selection helper.
3. Confirm it includes latest, pinned, and relevant verifier failure.
4. Confirm it excludes archived runs by default.

---

## Likely Failure Modes

### 1. Root latest gets out of sync

Risk: saving to `runs/` works, but project root latest artifacts are not updated.

Mitigation: add explicit verification after every save.

### 2. Prune score direction is inverted

Risk: low similarity to latest is treated as high redundancy.

Correct behavior:

```text
high similarity to latest = redundant = pruneable
low similarity to latest = divergent = possibly valuable
```

### 3. Pinned runs are archived accidentally

Risk: GC ignores pin state.

Mitigation: pin check must happen before scoring and before archive movement.

### 4. Memory injection becomes noisy

Risk: too many old runs are injected into agent context.

Mitigation: use `safeToInject`, temperature, role, and verified status.

### 5. Failed plans become active assumptions

Risk: old failed executor plans get injected without warning.

Mitigation: any `verifiedStatus: failed` memory should be injected only as a warning or failure signature, never as current plan.

---

## Implementation Style

Prefer small, inspectable TypeScript functions.

Avoid adding dependencies unless absolutely necessary.

Good functions to add:

```ts
loadRunMeta(runDir)
writeRunMeta(runDir, meta)
listProjectRuns(projectSlug)
recordRunAccess(projectSlug, runId)
computeRunTemperature(meta, now)
computePruneScore(projectSlug, runId)
getPruneCandidates(projectSlug, threshold)
archiveRun(projectSlug, runId, reason)
restoreArchivedRun(projectSlug, runId)
selectMemoryForContext(projectSlug, agentRole)
```

Keep scoring deterministic. The same run state should produce the same prune score.

---

## Final Recommendation

The next agent should focus on memory metabolism rather than intelligence:

```text
save → access → heat → pin → score → dry-run prune → archive → restore → inject carefully
```

Only after this loop is stable should the system add fractal compression, archetypes, or structural isomorphism.

The practical target is not a clever memory system. The practical target is a memory system that helps Pi Code agents avoid repeating mistakes, preserve verified constraints, and enter a project with the right amount of context.
