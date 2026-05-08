---
type: reference/glossary
llm_instructions: "Auto-generated glossary from graph data."
---

# Glossary

## Edge Types

| Type | Certainty |
|------|-----------|
| EXTRACTED | 1.0 (found in source) |
| INFERRED | 0.6-0.9 (model reasoned) |
| AMBIGUOUS | 0.1-0.3 (needs verification) |

**Node** — A single concept (file, function, idea)

**Edge** — A relationship between two nodes

**Community** — A group of related nodes found by the Louvain/Leiden algorithm

**God Node** — The most connected node(s) in the graph

**Cohesion** — A score (0-1) measuring how tightly a community is connected

## Key Concepts

| Concept | Role |
| slugify() | God node (13 connections) |
| HeatTracker | God node (12 connections) |
| handleGc() | God node (12 connections) |
| runDirFor() | God node (11 connections) |
| loadRunMeta() | God node (10 connections) |
| computePruneScores() | God node (10 connections) |
| resolveProjectRunFromArgs() | God node (10 connections) |
| handleKeep() | God node (10 connections) |
| Pruning System (5-Signal Score) | God node (10 connections) |
| graphify-brain Memory System | God node (10 connections) |