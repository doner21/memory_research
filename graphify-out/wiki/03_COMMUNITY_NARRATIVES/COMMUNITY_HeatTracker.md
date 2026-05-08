---
type: community/narrative
community_id: 4
graph_name: "HeatTracker Class"
size: 13
cohesion: 0.28
llm_instructions: "This is a small, tight community — just the HeatTracker class and its methods. Cohesion 0.28 is the third-highest in the graph, meaning these nodes are well-connected. If you need to understand how temperature tracking works, read every node here."
tags: [community, implementation, temperature, heat]
---

# 🌡️ Community 4: Heat Tracking — The Thermometer Class

> **13 code nodes · Cohesion: 0.28 (moderate — a coherent class)**

## 🧍 For humans

**Analogy: A single thermometer with all its buttons and displays.**

This is the smallest well-connected community in the graph, and it's the cleanest example of what a good community looks like. Everything here belongs to one thing: the **HeatTracker class**.

Think of it as a **physical thermometer device**:
- `.constructor()` — building the thermometer
- `.load()` — reading the current temperature
- `.save()` — writing a new temperature
- `.seedHot()` — setting the initial temperature for a new run
- `.getOrMigrateEntry()` — finding or creating a temperature record

The cohesion score of 0.28 is the third highest in the graph — these nodes genuinely belong together. If you want an example of how a community *should* look, study this one.

## 🤖 For LLMs

### Full Node List

All 13 nodes are methods and properties of the HeatTracker class:

| Node | What it does |
|------|-------------|
| `ensureBrainDir()` | Creates brain directory if missing |
| `HeatTracker` | Main class definition |
| `.constructor()` | Initializes tracker |
| `.load()` | Loads state from brain-meta.json |
| `.save()` | Persists state to brain-meta.json |
| `.key()` | Generates unique key for a run entry |
| `.getOrMigrateEntry()` | Gets existing entry or creates migrated one |
| `.seedHot()` | Sets initial temperature to hot |
| `.recordAccess()` | Records an access event |
| `.decayAll()` | Applies Ebbinghaus decay to all entries |
| `.getTemp()` | Returns current temperature for a run |
| `.purgeCold()` | Removes entries below cold threshold |
| `.getStats()` | Returns summary statistics |

### Data Storage

The HeatTracker stores in `brain-meta.json`:

```json
{
  "heatTracker": {
    "entries": {
      "{project-slug}/{run-id}": {
        "accessCount": 5,
        "lastAccessedAt": "ISO_TIMESTAMP",
        "temperature": "warm"
      }
    }
  }
}
```

### Community Structure

This is the **cleanest community** in the graph:
- All code (13/13)
- Highest cohesion among code-heavy communities (0.28)
- Single-class scope (HeatTracker)
- No unrelated concepts — everything here belongs to the same component

### Key Source File

**`extensions/graphify.ts`** — Lines containing the HeatTracker class definition and its methods.

### Suggested Questions for an LLM

- *"Can HeatTracker be extracted into its own file? It's already a clean class — 0.28 cohesion is the best in the graph."*
- *"How does `decayAll()` interact with `computePruneScores()` in Community 0?"*
- *"If I want to add a new temperature state (e.g., 'frozen'), which methods need to change?"*
