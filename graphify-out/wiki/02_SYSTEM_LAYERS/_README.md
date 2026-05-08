---
type: architecture/layers_index
llm_instructions: "The 5 layers form a pipeline: Storage → Scoring → Temperature → Compression → Archetypes. Each layer reads from the one below and feeds the one above. When discussing a feature, identify which layer(s) it touches."
---

# System Layers — How They Compose

> The memory system is built as a stack of 5 layers, each with a single responsibility.

## The Pipeline

```
  User action (save, load, prune)
         │
         ▼
┌─────────────────┐
│  L5: Archetypes │  Cross-project pattern detection (periodic)
└────────┬────────┘
         │ reads compressed runs
┌────────▼────────┐
│  L4: Compression│  Summarize cold runs into compact forms
└────────┬────────┘
         │ reads temperature
┌────────▼────────┐
│  L3: Temperature│  Track hot/warm/cold per run
└────────┬────────┘
         │ reads scores
┌────────▼────────┐
│  L2: Scoring    │  Evaluate every run on 5 signals
└────────┬────────┘
         │ reads runs
┌────────▼────────┐
│  L1: Storage    │  Filesystem hierarchy for all runs
└────────┬────────┘
         │
         ▼
  graphify-out/ + graphify-brain/
```

## Layer Rules

1. **Each layer only depends on layers below it.** Storage doesn't know about Archetypes. Compression doesn't know about Scoring (just reads Temperature).
2. **Each layer is independently testable.** You can test Storage without Scoring, Scoring without Temperature, etc.
3. **Each layer has a clear boundary.** No layer crosses into another's responsibility.

## Layer Relationships

| Layer | Builds on | Feeds into | Core Question |
|-------|-----------|------------|---------------|
| Storage | Filesystem | Scoring | "Where does data live?" |
| Scoring | Storage | Temperature | "What stays and what goes?" |
| Temperature | Scoring | Compression | "What's still relevant?" |
| Compression | Temperature | Archetypes | "How do we shrink old data?" |
| Archetypes | Compression | (human insight) | "What patterns repeat?" |

## Quick Navigation

| Layer | File | Human Analogy |
|-------|------|---------------|
| 1 | [[LAYER_01_Storage\|Storage]] | A filing cabinet with three drawers |
| 2 | [[LAYER_02_Scoring\|Scoring]] | A judge with 5 evaluation criteria |
| 3 | [[LAYER_03_Temperature\|Temperature]] | A thermometer on each file |
| 4 | [[LAYER_04_Compression\|Compression]] | An archivist who writes summaries |
| 5 | [[LAYER_05_Archetypes\|Archetypes]] | A pattern-matching detective |
