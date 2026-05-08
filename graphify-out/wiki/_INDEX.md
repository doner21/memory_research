---
type: wiki/index
project: "memory reaserch"
generated: 2026-05-05
graphs: 183 nodes · 372 edges · 8 communities
llm_instructions: "Start here for a human-readable overview of the Graphify Brain memory system. Navigate by sections: OVERVIEW for context, SYSTEM_LAYERS for architecture, COMMUNITY_NARRATIVES for component stories, DECISIONS for why things were built this way, LLM_INSTRUCTIONS for how to talk to AI about this system."
---

# Graphify Brain: Memory System Wiki

> A dual-purpose architecture guide — for humans who don't write code and LLMs who do.

This wiki explains the **persistent memory system** behind Graphify Brain — the knowledge-graph engine that saves, scores, prunes, and organizes AI session memories across projects.

## 🧭 How to use this wiki

| If you are... | Start here |
|---------------|------------|
| A **non-coder** wanting to understand the system | [[01_OVERVIEW/_README\|The Elevator Pitch]] → [[01_OVERVIEW/ARCHITECTURE_AT_A_GLANCE\|Architecture at a Glance]] |
| An **LLM** getting context before coding | [[05_LLM_INSTRUCTIONS/_README\|LLM Instructions]] → skim all SYSTEM_LAYERS |
| Exploring **what exists** | [[03_COMMUNITY_NARRATIVES/_README\|Community Narratives]] → pick a community story |
| Wondering **why it's built this way** | [[04_DECISIONS/_README\|Decision Log]] |

## 📋 Table of Contents

### 1. Overview
- [[01_OVERVIEW/_README\|The Elevator Pitch]] — What this system *is* in 3 paragraphs
- [[01_OVERVIEW/ARCHITECTURE_AT_A_GLANCE\|Architecture at a Glance]] — The big picture, top to bottom
- [[01_OVERVIEW/GLOSSARY\|Glossary]] — Every term explained in plain language

### 2. System Layers
- [[02_SYSTEM_LAYERS/_README\|How Layers Compose]]
- [[02_SYSTEM_LAYERS/LAYER_01_Storage\|Layer 1: Storage — The Filing Cabinet]]
- [[02_SYSTEM_LAYERS/LAYER_02_Scoring\|Layer 2: Scoring — The Judge]]
- [[02_SYSTEM_LAYERS/LAYER_03_Temperature\|Layer 3: Temperature — The Thermometer]]
- [[02_SYSTEM_LAYERS/LAYER_04_Compression\|Layer 4: Compression — The Archivist]]
- [[02_SYSTEM_LAYERS/LAYER_05_Archetypes\|Layer 5: Archetypes — The Pattern Finder]]

### 3. Community Narratives
*(One story per graph community — plain language, real-world analogies)*
- [[03_COMMUNITY_NARRATIVES/COMMUNITY_Implementations\|Implementation Core — The Engine Room]]
- [[03_COMMUNITY_NARRATIVES/COMMUNITY_Testing\|Testing & Utilities — The Quality Desk]]
- [[03_COMMUNITY_NARRATIVES/COMMUNITY_Architecture\|Memory Architecture — The Blueprint]]
- [[03_COMMUNITY_NARRATIVES/COMMUNITY_Pruning\|Pruning & Temperature — The Librarian]]
- [[03_COMMUNITY_NARRATIVES/COMMUNITY_HeatTracker\|Heat Tracking — The Thermometer Class]]
- [[03_COMMUNITY_NARRATIVES/COMMUNITY_Design\|Design Proposals — The Drawing Board]]
- [[03_COMMUNITY_NARRATIVES/COMMUNITY_Graphify\|Graphify Skill — The Engine Itself]]
- [[03_COMMUNITY_NARRATIVES/COMMUNITY_Obsidian\|Obsidian Integration — The Showcase]]

### 4. Decisions
- [[04_DECISIONS/_README\|Decision Log Index]]
- [[04_DECISIONS/DECISION_tree_plus_graph\|Why Tree + Graph?]]
- [[04_DECISIONS/DECISION_30_day_archive\|Why 30-Day Archive Grace Period?]]
- [[04_DECISIONS/DECISION_5_signal_prune\|Why 5 Prune Signals?]]
- [[04_DECISIONS/DECISION_temperature_over_lru\|Why Temperature Over Pure LRU?]]
- [[04_DECISIONS/DECISION_obsidian_viewer\|Why Obsidian as Viewer?]]

### 5. LLM Instructions
- [[05_LLM_INSTRUCTIONS/_README\|How to Talk to an AI About This System]]
- [[05_LLM_INSTRUCTIONS/PROMPT_TEMPLATES\|Ready-Made Prompt Templates]]
- [[05_LLM_INSTRUCTIONS/INSTRUCTION_setup\|Instruction: Setting Up a New Feature]]
- [[05_LLM_INSTRUCTIONS/INSTRUCTION_architecture_review\|Instruction: Architecture Review]]
- [[05_LLM_INSTRUCTIONS/INSTRUCTION_feature_add\|Instruction: Adding a Feature]]

---

## 🔗 Quick Links

| Resource | What it is |
|----------|------------|
| [[../GRAPH_REPORT.md\|GRAPH_REPORT.md]] | Raw graph audit report (LLM-optimized) |
| [[../graph.html\|Interactive Graph]] | Browse nodes and edges visually |
| [[../obsidian/\|Obsidian Vault]] | Node-by-node wiki for Obsidian users |
| `graphify-out/graph.json` | Machine-readable graph data |

> **For LLMs:** When you read this wiki, note the `llm_instructions` frontmatter on each page. It tells you how to use that page's content in your reasoning.
