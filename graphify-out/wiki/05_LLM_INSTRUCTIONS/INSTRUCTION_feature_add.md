---
type: llm/instruction
task: feature
llm_instructions: "Use this when the human wants to add a new capability to the memory system. This is the most structured instruction — follow the phases in order."
---

# Instruction: Adding a Feature

> For when you want the AI to design and build something new.

## Human → LLM

Tell the LLM:

> *"I want to add [feature]. It should [do something]. I think it belongs in [layer/component]. Here's my sketch: [description]. What do you think?"*

## LLM → Feature Design Checklist

### Before writing code

1. **Layer check:** Which of the 5 layers does this feature touch?
   - Storage: new files, new directories, new metadata?
   - Scoring: new evaluation criteria, new signals?
   - Temperature: new temperature states, new decay models?
   - Compression: new compression strategies?
   - Archetypes: new pattern detection methods?

2. **Community check:** Which existing communities does this feature relate to?
   - Does it add nodes to an existing community?
   - Does it create a new community?
   - Does it create bridge nodes between communities?

3. **Decision check:** Is there a decision log entry that constrains this feature?
   - Tree+Graph hybrid: can't switch to pure tree or pure graph
   - 30-day archive: can't delete immediately
   - 5 signals: can't merge signals
   - Temperature: can't replace with pure LRU
   - Obsidian: can't remove markdown output

4. **Safety check:**
   - Does it have a dry-run mode?
   - Does it respect the archive grace period?
   - Does it have a pin override?
   - Can the human preview before committing?

### After writing code

1. Update `GRAPH_REPORT.md` — rerun `/graphify`
2. Update the relevant wiki pages
3. Add a decision log entry if it changes the architecture
4. Run `--dry-run` on the feature if it mutates data

## Template for New Features

```markdown
# Feature: [Name]

## Layer
[Which layer(s)]

## Communities
[Which communities will gain nodes]

## Implementation
[Which files change, what they do]

## Safety
- [ ] Dry-run supported
- [ ] Archive-compatible
- [ ] Pin-respecting

## Decision Log Entry Needed?
[Yes/No] — [Title]
```
