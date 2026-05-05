# Phase 3A User Test Checklist

Use this checklist to validate the Phase 3A `/memory` safety update from a user's point of view.

> **Safety warning:** Run these tests on a disposable/test project first. Do not begin with an important project or irreplaceable memory history.

---

## Prerequisites

1. Create or choose a disposable project folder.
2. In that project, ensure at least one Graphify artifact exists:

```text
<test-project>/graphify-out/GRAPH_REPORT.md
```

or:

```text
<test-project>/graphify-out/graph.json
```

3. Know your project slug. It is the project folder name lowercased with non-alphanumeric characters replaced by `-`.

Example:

```text
Project folder: C:/Users/DONALD/tmp/Memory Test Project
Project slug:   memory-test-project
Runs path:      C:/Users/DONALD/.pi/graphify-brain/memory-test-project/runs/
Archive path:   C:/Users/DONALD/.pi/graphify-brain/.archive/memory-test-project/
```

In the steps below, replace:

```text
<project> = your project slug/name used in /memory commands
<runId>   = a run ID shown by /memory runs <project>
```

---

## 1. Test `/memory save`

From the disposable project folder in Pi:

```bash
/memory save
```

Expected outcome:

- Pi reports a successful save.
- A run directory exists under:

```text
C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>/
```

- The run directory contains available artifacts such as `run-meta.json`, `GRAPH_REPORT.md`, `graph.json`, `wiki/`, and/or `obsidian/`.
- Project-root LATEST artifacts are also present when available:

```text
C:/Users/DONALD/.pi/graphify-brain/<project>/GRAPH_REPORT.md
C:/Users/DONALD/.pi/graphify-brain/<project>/graph.json
```

File-system check in PowerShell:

```powershell
Get-ChildItem "C:/Users/DONALD/.pi/graphify-brain/<project>/runs"
Get-ChildItem "C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>"
```

---

## 2. Test `/memory runs`

```bash
/memory runs <project>
```

Expected outcome:

- Pi lists one or more run IDs.
- The newest run appears near the top.
- The listed run IDs correspond to folders under:

```text
C:/Users/DONALD/.pi/graphify-brain/<project>/runs/
```

---

## 3. Test `/memory stats` dry-run behavior

Before running stats, optionally capture the metadata hash:

```powershell
Get-FileHash "C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>/run-meta.json"
```

Run:

```bash
/memory stats <project>
```

Expected outcome:

- Pi shows run count, size, prune score histogram, and temperature distribution.
- `run-meta.json` is not rewritten by stats.

Check again:

```powershell
Get-FileHash "C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>/run-meta.json"
```

Expected: the before/after hash is unchanged.

---

## 4. Test `/memory prune --dry-run`

Before running prune, capture active run folders and metadata hash:

```powershell
Get-ChildItem "C:/Users/DONALD/.pi/graphify-brain/<project>/runs"
Get-FileHash "C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>/run-meta.json"
```

Run:

```bash
/memory prune <project> --dry-run
```

Expected outcome:

- Pi shows a dry-run prune candidate table.
- No run folder is moved or deleted.
- `run-meta.json` is not rewritten.

Check again:

```powershell
Get-ChildItem "C:/Users/DONALD/.pi/graphify-brain/<project>/runs"
Get-FileHash "C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>/run-meta.json"
```

Expected: folders are still present and the metadata hash is unchanged.

---

## 5. Test `/memory pin`

Choose a run from `/memory runs <project>`:

```bash
/memory pin <project> --run <runId>
```

Expected outcome:

- Pi reports the run was pinned.
- The run remains under:

```text
C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>/
```

- In `run-meta.json`, the run is marked pinned.
- Prune scores are zeroed for the pinned run.

Optional check:

```powershell
Get-Content "C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>/run-meta.json"
```

---

## 6. Test `/memory gc --dry-run`

Run:

```bash
/memory gc <project> --dry-run
```

Expected outcome:

- Pi reports either no archive candidates or lists `DRY-RUN <project>/<runId> would archive...` entries.
- No run folder is moved or deleted.
- No archive folder is created for dry-run-only candidates.
- Pinned runs are not archived.

File-system checks:

```powershell
Get-ChildItem "C:/Users/DONALD/.pi/graphify-brain/<project>/runs"
Get-ChildItem "C:/Users/DONALD/.pi/graphify-brain/.archive/<project>" -ErrorAction SilentlyContinue
```

Expected: active run folders remain in `runs/`. Dry-run does not move them into `.archive/`.

---

## 7. Test pinned-run immunity with `/memory gc --apply`

With the run still pinned, run:

```bash
/memory gc <project> --apply
```

Expected outcome:

- The pinned run is not archived.
- The pinned run directory still exists at:

```text
C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>/
```

- No archive directory exists for that pinned run at:

```text
C:/Users/DONALD/.pi/graphify-brain/.archive/<project>/<runId>/
```

Check:

```powershell
Test-Path "C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>"
Test-Path "C:/Users/DONALD/.pi/graphify-brain/.archive/<project>/<runId>"
```

Expected: first result `True`, second result `False`.

---

## 8. Prepare an eligible disposable GC candidate

To test full archive/restore, you need an unpinned run that `/memory gc <project> --dry-run` lists as a candidate.

Recommended safe approach:

1. Use only the disposable project.
2. Create multiple saves so there is more than one run:

```bash
/memory save
/memory save
/memory runs <project>
```

3. Unpin the run you want to archive:

```bash
/memory unpin <project> --run <runId>
```

4. Run:

```bash
/memory gc <project> --dry-run
```

Proceed to the next step only if the target run appears as a `DRY-RUN ... would archive` candidate.

If no candidate appears, do not force GC on important data. Either skip the apply/keep tests for now or use an older disposable run that naturally qualifies.

---

## 9. Test `/memory gc --apply`

Only run this after the dry-run lists the disposable target run as a candidate.

```bash
/memory gc <project> --apply
```

Expected outcome:

- Pi reports `ARCHIVED <project>/<runId>`.
- The active run directory is moved away from:

```text
C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>/
```

- The full archived run directory exists at:

```text
C:/Users/DONALD/.pi/graphify-brain/.archive/<project>/<runId>/
```

- The archive contains complete artifacts that were present in the original run, including:
  - `run-meta.json`
  - `archive-meta.json`
  - `GRAPH_REPORT.md` if the run had it
  - `graph.json` if the run had it
  - `wiki/` if the run had it
  - `obsidian/` if the run had it

Checks:

```powershell
Test-Path "C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>"
Test-Path "C:/Users/DONALD/.pi/graphify-brain/.archive/<project>/<runId>"
Get-ChildItem "C:/Users/DONALD/.pi/graphify-brain/.archive/<project>/<runId>"
```

Expected: active run path is `False`, archive path is `True`, and expected artifacts are visible in the archive.

Also check that GC did not purge/delete archives:

```powershell
Test-Path "C:/Users/DONALD/.pi/graphify-brain/.archive/<project>/<runId>/archive-meta.json"
```

Expected: `True`.

---

## 10. Test `/memory keep`

Restore the archived disposable run:

```bash
/memory keep <project> --run <runId>
```

Expected outcome:

- Pi reports the run was restored from archive and auto-pinned.
- The active run directory exists again:

```text
C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>/
```

- The archive directory for that run no longer exists because it was moved back:

```text
C:/Users/DONALD/.pi/graphify-brain/.archive/<project>/<runId>/
```

- Full artifacts are restored, including any `GRAPH_REPORT.md`, `graph.json`, `wiki/`, and `obsidian/` that were archived.
- `run-meta.json` shows the run is pinned.
- Project-root LATEST artifacts remain in place and are not replaced by keep.

Checks:

```powershell
Test-Path "C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>"
Test-Path "C:/Users/DONALD/.pi/graphify-brain/.archive/<project>/<runId>"
Get-ChildItem "C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>"
Get-Content "C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>/run-meta.json"
Test-Path "C:/Users/DONALD/.pi/graphify-brain/<project>/GRAPH_REPORT.md"
Test-Path "C:/Users/DONALD/.pi/graphify-brain/<project>/graph.json"
```

Expected: active run path `True`, archive path `False`, artifacts present, run pinned, root LATEST files still present if they existed before.

---

## 11. Test load/loadRun access tracking

Choose an active, non-archived run.

Capture `run-meta.json` before loading:

```powershell
Get-Content "C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>/run-meta.json"
```

Run latest load:

```bash
/memory load <project>
```

Then run specific historical load:

```bash
/memory load <project> --run <runId>
```

Expected outcome:

- The graph/report content is sent into the conversation.
- HeatTracker access is recorded using a project-qualified key like `<project>/<runId>` in:

```text
C:/Users/DONALD/.pi/graphify-brain/brain-meta.json
```

- The active run's durable metadata updates:
  - `lastAccessedAt` changes
  - `accessCount` increments
  - `temperature` becomes or remains `hot`

Checks:

```powershell
Get-Content "C:/Users/DONALD/.pi/graphify-brain/brain-meta.json"
Get-Content "C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>/run-meta.json"
```

Expected: `brain-meta.json` contains a heat entry for `<project>/<runId>`, and the run metadata access fields reflect the load operations.

---

## Rollback / Recovery

For a disposable project, the simplest rollback is to delete its test brain folders after you are done:

```powershell
Remove-Item "C:/Users/DONALD/.pi/graphify-brain/<project>" -Recurse -Force
Remove-Item "C:/Users/DONALD/.pi/graphify-brain/.archive/<project>" -Recurse -Force -ErrorAction SilentlyContinue
```

If you accidentally archived a run you wanted to keep:

```bash
/memory keep <project> --run <runId>
```

Then verify:

```powershell
Test-Path "C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>"
Get-ChildItem "C:/Users/DONALD/.pi/graphify-brain/<project>/runs/<runId>"
```

If you accidentally pinned a disposable run:

```bash
/memory unpin <project> --run <runId>
```

If you are unsure what changed, inspect these folders before deleting anything:

```text
C:/Users/DONALD/.pi/graphify-brain/<project>/runs/
C:/Users/DONALD/.pi/graphify-brain/.archive/<project>/
C:/Users/DONALD/.pi/graphify-brain/brain-meta.json
```
