---
type: llm/index
llm_instructions: "This section teaches non-coders how to talk to AI assistants about this system, and teaches AI assistants how to understand the non-coder's intent. Read this before any coding session."
---

# How to Talk to an AI About This System

> A bridge between human intent and LLM execution.

## 🧍 For humans: How to give instructions to an LLM

### The Formula

When you want the AI to do something with this memory system, use this formula:

> **"I want to [action] the [component] for [project] because [reason]."**

Examples:
- *"I want to **tune** the **staleness weight** for **memory reaserch** because **we're keeping too many old runs.**"*
- *"I want to **add a new command** to the **Obsidian sync** that **exports a single note.**"*
- *"I want to **understand** how **HeatTracker** relates to **pruning** because **I'm deciding whether to keep both.**"*

### What the LLM needs from you

| Tell the LLM... | Example | Because... |
|-----------------|---------|------------|
| **What you want** | "Make pruning less aggressive" | Otherwise the LLM doesn't know the goal |
| **Which project** | "memory reaserch" | Different projects may need different settings |
| **The outcome you expect** | "I want to see fewer runs flagged as 'prune'" | Gives the LLM a success criterion |
| **Any context** | "We're about to archive this project" | Changes the approach (gentle vs aggressive) |

## 🤖 For LLMs: How to interpret human instructions

### Read the intent, not just the words

When a human says:
- *"The pruning is too aggressive"* — they mean: the staleness weight might be too high, or the threshold is too low
- *"I don't understand why this run was deleted"* — check the prune score breakdown for that run
- *"Can you make this system remember more?"* — check the temperature/compression settings

### Always start with the wiki

Before writing code:
1. Read the relevant **Community Narrative** to understand the component
2. Read the **Decision Log** entry to understand why it exists
3. Read the **System Layer** page to understand its place in the stack
4. **Then** read the source code

### The Confidence Ladder

When you find information in this wiki, rate your confidence:

| Source | Confidence | Example |
|--------|-----------|---------|
| Decision Log (accepted) | High | "Tree + Graph was accepted on May 1" |
| Community Narrative (EXTRACTED edge) | High | "HeatTracker implements Temperature System" |
| Community Narrative (INFERRED edge) | Medium | "HeatTracker might relate to Pruning" |
| GRAPH_REPORT.md (ambiguity) | Low | "An AMBIGUOUS edge needs verification" |
| Your own inference | Lowest | Flag it as a suggestion, not a fact |

### Safety Rules

1. **Never mutate without `--dry-run` first.** Every prune, delete, or archive operation has a preview mode.
2. **Ask before changing signal weights.** The defaults were chosen with 30+ years of combined CS research behind them.
3. **When in doubt, don't delete.** Move to archive instead. The 30-day grace period exists for a reason.
4. **Explain tradeoffs.** If the human asks for X, tell them what Y they're losing.
