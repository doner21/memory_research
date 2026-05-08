---
type: decisions/index
llm_instructions: "This section documents every significant architectural decision. Each page follows the same format: Context → Decision → Alternatives → Consequences. When asked why something was built a certain way, come here first."
---

# Decision Log

> Every architectural decision, documented in plain language.

## Why a decision log?

Software systems accumulate decisions over time. Some are written down, most aren't. This log exists so that:

- **Non-coders** can understand *why* things are the way they are
- **LLMs** can make informed decisions that respect previous tradeoffs
- **Everyone** can revisit old decisions when circumstances change

## How to read a decision

Each decision page follows this format:

1. **Context** — What problem were we solving?
2. **Decision** — What we chose
3. **Alternatives considered** — What we didn't choose (and why)
4. **Consequences** — What changed as a result
5. **Status** — Accepted / Deprecated / Superseded

## Decisions

| Decision | Status | Summary |
|----------|--------|---------|
| [[DECISION_tree_plus_graph\|Tree + Graph Hybrid]] | ✅ Accepted | Tree for hierarchy, Graph for discovery — not one or the other |
| [[DECISION_30_day_archive\|30-Day Archive Grace Period]] | ✅ Accepted | 30-day holding zone before permanent deletion |
| [[DECISION_5_signal_prune\|5 Signals for Pruning]] | ✅ Accepted | Staleness, redundancy, low-signal, obsoletion, pin — independent scores |
| [[DECISION_temperature_over_lru\|Temperature Over Pure LRU]] | ✅ Accepted | Ebbinghaus curve instead of simple "delete oldest" |
| [[DECISION_obsidian_viewer\|Obsidian as Viewer]] | ✅ Accepted | Graph nodes → Obsidian notes for human browsing |

---

> **Missing a decision?** Add it here. Every new feature should include a decision log entry.
