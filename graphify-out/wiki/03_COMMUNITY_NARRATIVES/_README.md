---
type: community/index
llm_instructions: "Each community narrative tells the story of one group of related nodes in the knowledge graph. Use these to understand the 'why' behind each component before reading the code. Communities are discovered automatically by the Louvain/Leiden algorithm."
graph_communities: 8
---

# Community Narratives

> One story per graph community — plain language, real-world analogies.

The knowledge graph discovered **8 communities** of related concepts. Each one is like a neighborhood in a city — the concepts inside talk to each other more than they talk to concepts outside.

## The Communities

| # | Community | Nodes | Cohesion | Human Analogy |
|---|-----------|-------|----------|---------------|
| 0 | [[COMMUNITY_Implementations\|Implementations Core]] | 42 | 0.14 | The engine room — messy, powerful, central |
| 1 | [[COMMUNITY_Testing\|Testing & Utilities]] | 39 | 0.10 | The quality desk — tests, utilities, safety checks |
| 2 | [[COMMUNITY_Architecture\|Memory Architecture]] | 33 | 0.09 | The blueprint — design decisions, rules, conventions |
| 3 | [[COMMUNITY_Pruning\|Pruning & Temperature]] | 26 | 0.10 | The librarian — what to keep, what to discard |
| 4 | [[COMMUNITY_HeatTracker\|Heat Tracking]] | 13 | 0.28 | The thermometer — tracking hot/cold over time |
| 5 | [[COMMUNITY_Design\|Design Proposals]] | 12 | 0.20 | The drawing board — future plans and big ideas |
| 6 | [[COMMUNITY_Graphify\|Graphify Skill]] | 10 | 0.31 | The engine itself — how graphify works |
| 7 | [[COMMUNITY_Obsidian\|Obsidian Integration]] | 8 | 0.39 | The showcase — how humans see the graph |

## How to Read a Community Narrative

Each page has:

1. **The human analogy** — what this community IS, in everyday terms
2. **The LLM explanation** — what this community IS, for an AI
3. **Map of the community** — key nodes and how they connect
4. **Bridge to other communities** — which concepts cross community boundaries
5. **Decision log connection** — links to the decision pages for deeper context
6. **How to talk to an LLM about this** — ready-made conversation starters
