---
type: llm/instruction
task: review
llm_instructions: "Use this when the human wants a review of the architecture — either the whole system or a specific component."
---

# Instruction: Architecture Review

> For when you want the AI to evaluate the system's design.

## Human → LLM

Tell the LLM:

> *"I want a review of [component/area] in the memory system. I'm concerned about [performance/complexity/scalability]. Here's what I've noticed: [observation]. Is this a real problem?"*

## LLM → Evaluation Criteria

When reviewing, evaluate against these axes:

### 1. Cohesion
- Check the community cohesion scores in `GRAPH_REPORT.md`
- Low cohesion (< 0.15) means the community might need splitting
- High cohesion (> 0.35) means the community is well-defined

### 2. Coupling
- How many cross-community edges exist?
- Bridge nodes with high betweenness are potential single points of failure
- If a bridge node changes, how many communities are affected?

### 3. Completeness
- Which phases of the 6-phase roadmap are implemented?
- Which nodes in the graph are isolated (≤1 connection)?
- Are there "promised but not built" features?

### 4. Complexity
- Is the 5-layer stack appropriate for the current scale?
- Are there layers that aren't being used yet? (e.g., Compression and Archetypes)
- Is there unnecessary abstraction?

## Output Format

```
## Summary
[One paragraph: is this area healthy or concerning?]

## Strengths
- [strength with evidence from graph data]

## Concerns
- [concern with evidence from graph data]

## Recommendations
1. [actionable change]
2. [actionable change]
3. [actionable change]

## Priority
[High/Medium/Low] — [why now or why later]
```
