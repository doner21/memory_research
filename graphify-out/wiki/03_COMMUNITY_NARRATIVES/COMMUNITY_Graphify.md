---
type: community/narrative
community_id: 6
graph_name: "Graphify Skill & Knowledge Graph"
size: 10
cohesion: 0.31
llm_instructions: "This is the meta-community — it describes how graphify itself works (the tool that built this graph). Cohesion 0.31 is the second-highest in the graph, meaning these concepts are tightly related. If you want to understand graphify as a tool, read this."
tags: [community, graphify, meta, graph-theory]
---

# 🔧 Community 6: Graphify Skill — The Engine Itself

> **10 nodes (1 doc + 9 rationale) · Cohesion: 0.31 (tight — highly related concepts)**

## 🧍 For humans

**Analogy: The instruction manual for the machine that built this room.**

This community is **meta** — it's about the tool (graphify) that built this entire knowledge graph. It's the second most tightly connected community in the graph (cohesion 0.31), which makes sense — it's pure theory about graphs themselves.

The nodes here are the **fundamental concepts** of graphify:
- **Community Detection** — how the system finds groups (this very community was found by this algorithm!)
- **God Nodes** — how the system finds the most important concepts
- **Confidence Scores** — how the system distinguishes facts from guesses
- **AST Extraction** — how code gets turned into graph nodes
- **Centrality** — how the system measures importance

If you read this community, you understand **how graphify thinks** — which helps you understand why the graph looks the way it does.

## 🤖 For LLMs

### Core Concepts

| Concept | What it is | How it's used |
|---------|-----------|---------------|
| **Community Detection** (Louvain/Leiden) | Algorithm that finds groups of related nodes | Produces the 8 communities in this graph |
| **God Nodes** | Most connected nodes in the graph | Highlights the 10 most important concepts |
| **Centrality** | Mathematical measure of node importance | Betweenness, degree, eigenvector variants |
| **Confidence Score System** | EXTRACTED / INFERRED / AMBIGUOUS | Tags every edge with reliability |
| **AST Extraction** | Parses code files structurally | Creates nodes from functions, classes, imports |
| **Surprising Connections** | Cross-community edges you wouldn't expect | Discovered by the graph, not by humans |

### Confidence Score System

This is critical for LLM trust:

| Tag | Meaning | Score |
|-----|---------|-------|
| **EXTRACTED** | Found directly in the source code/document | 1.0 |
| **INFERRED** | Reasonable guess by the AI (e.g., semantic similarity) | 0.6–0.9 |
| **AMBIGUOUS** | Uncertain — needs human verification | 0.1–0.3 |

When you see INFERRED edges, treat them as hypotheses, not facts.

### Community Structure

- **Document** (1): `/graphify Skill` — the SKILL.md instruction file
- **Rationale** (9): Graph theory concepts used by graphify

### Key Source Files

| File | What it contains |
|------|-----------------|
| `extensions/graphify.ts` | The actual extension that implements graphify's commands |
| `graphify-out/GRAPH_REPORT.md` | This community was computed from the graph report |
| `graphifyy Python package` | The Python library that does graph computation |

### Suggested Questions for an LLM

- *"The graph shows 97% EXTRACTED and 3% INFERRED edges — which edges should I verify first?"*
- *"How does AST extraction differ from semantic extraction? What does one find that the other misses?"*
- *"The Surprising Connections section found 4 cross-community edges — are they real or noise?"*
