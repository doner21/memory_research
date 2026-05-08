---
type: community/narrative
community_id: 0
label: "graphify.ts Core Implementation"
size: 43
cohesion: 0.14
llm_instructions: "Community narrative from graph data."
---

# Community 0: graphify.ts Core Implementation

> **43 nodes | Cohesion: 0.14 (loosely connected)**

## For Humans

This community contains **43 concepts** about **graphify.ts Core Implementation**.

**Composition:** 43 code

**Cohesion:** 0.14 — loosely connected.

**Key concepts:**

- graphify.ts
- ensureBrainDir()
- slugify()
- splitArgs()
- hasFlag()
- getFlagValue()
- positionalArgs()
- projectDirForSlug()

**Connections to other communities:**

- Memory System Architecture:
  - graphify.ts -- imports_from -> Pi Coding Agent Harness
- graphify Module (12 functions):
  - graphify.ts -- contains -> HeatTracker
  - handleSave() -- calls -> .seedHot()
  - recordRunAccess() -- calls -> .recordAccess()
- Obsidian Vault Integration:
  - graphify.ts -- contains -> ensureVault()
  - graphify.ts -- contains -> copyObsidianToVault()
  - graphify.ts -- contains -> rebuildVaultIndex()

## For LLMs

### Data

- **ID:** 0
- **Label:** graphify.ts Core Implementation
- **Size:** 43 nodes
- **Cohesion:** 0.14
- **Types:** 43 code

### Key Nodes

- graphify.ts
- ensureBrainDir()
- slugify()
- splitArgs()
- hasFlag()
- getFlagValue()
- positionalArgs()
- projectDirForSlug()
- runDirFor()
- archiveRunDirFor()

### Connected Communities

- **Memory System Architecture** (C4) — 1 edge(s)
- **graphify Module (12 functions)** (C5) — 7 edge(s)
- **Obsidian Vault Integration** (C8) — 8 edge(s)