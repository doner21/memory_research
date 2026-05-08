---
type: architecture/layer
layer: 3
name: Temperature
depends_on:
  - LAYER_02_Scoring (uses scores to prioritize which runs to cool down)
provides_data_to:
  - LAYER_04_Compression (temperature determines compression eligibility)
llm_instructions: "Temperature is the bridge between evaluation and action. A run goes through 3 states: Hot → Warm → Cold. Only Cold runs are eligible for compression. The Ebbinghaus curve is the decay model."
graph_community: "Pruning & Temperature System, Knowledge Curation Principles"
---

# Layer 3: Temperature — The Thermometer

> **Core question:** *What's still relevant?*

## 🧍 For humans

Think of this like **the "recent files" list** on your computer, but smarter.

Every run has a **temperature** — hot, warm, or cold:

| State | Meaning | What happens next |
|-------|---------|-------------------|
| 🔥 **Hot** | You've used this recently | Stays as-is, full detail preserved |
| ☀️ **Warm** | You used it a while ago | Still available, but flagged for review |
| ❄️ **Cold** | Nobody has touched it in a long time | Eligible for compression (summarized) |

The temperature doesn't just sit still — it **decays**. Newly saved runs start hot. If you don't touch one for a week, it becomes warm. After a month, it goes cold.

How fast it decays is based on the **Ebbinghaus Forgetting Curve** — the same curve that describes how humans forget things. You forget fast at first, then slower. So a run that's 2 days old cools faster than a run that's 2 months old.

The **HeatTracker** is the component that manages all of this. It records every access (save, load, view) and recalculates temperatures periodically.

## 🤖 For LLMs

### Temperature States & Transitions

```
NEW RUN ──► HOT
              │
              │ (no access for N days)
              ▼
           WARM
              │
              │ (no access for M days)
              ▼
           COLD ──► eligible for LAYER_4 (Compression)
              │
              │ (accessed again)
              ▼
           HOT (reset)
```

### Decay Model

Uses the Ebbinghaus forgetting curve: \( R = e^{-t/S} \)
- `R` = retention (1 = hot, 0 = cold)
- `t` = time since last access
- `S` = stability (how strongly the run is retained)

Thresholds:
- Hot if R > 0.7
- Warm if 0.3 < R ≤ 0.7
- Cold if R ≤ 0.3

### HeatTracker Class

The `HeatTracker` class (Community 4) maintains a JSON map in `brain-meta.json`:

```json
{
  "heatTracker": {
    "entries": {
      "memory-reaserch/2026-05-05T21-19-07Z": {
        "accessCount": 5,
        "lastAccessedAt": "2026-05-08T12:00:00Z",
        "temperature": "warm"
      }
    }
  }
}
```

Key methods:
- `ensureBrainDir()` — Creates the brain directory if it doesn't exist
- `handleSave()` — Saves a new run, sets initial temperature to hot
- `rebuildBrainIndex()` — Recalculates all temperatures based on decay

### Community Membership

| Community | Role |
|-----------|------|
| **Pruning & Temperature System** (C3) | Temperature thresholds, decay policy |
| **Knowledge Curation Principles** (community label) | Ebbinghaus inspiration, curation philosophy |
| **HeatTracker Class** (C4, 13 nodes) | The actual implementation class |

### Key Source Files

| File | What it does |
|------|-------------|
| `extensions/graphify.ts` — `HeatTracker` class | Temperature management implementation |
| `extensions/graphify.ts` — `decayTemperatures()` | Decay computation (~lines 280-310) |
| `02-fractal-memory-proposal.md` | Fractal temperature model inspiration |

---

**Up:** [[LAYER_04_Compression\|Layer 4: Compression — The Archivist]]
**Down:** [[LAYER_02_Scoring\|Layer 2: Scoring — The Judge]]
**Decision:** [[../04_DECISIONS/DECISION_temperature_over_lru\|Why Temperature Over Pure LRU?]]
