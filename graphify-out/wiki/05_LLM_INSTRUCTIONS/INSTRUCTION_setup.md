---
type: llm/instruction
task: setup
llm_instructions: "Use this when the human wants to set up a new project or run graphify for the first time."
---

# Instruction: Setting Up a New Feature

> For when you want the AI to set up a new component or modify an existing one.

## Human → LLM

Tell the LLM:

> *"I want to [build/change] [component] in the memory system so that [goal]. This is for the [project name] project. Here's what I'm thinking: [your idea]. Does this make sense given the architecture?"*

## LLM → Execution

When you receive this instruction:

### Step 1: Orient

1. Read `wiki/01_OVERVIEW/ARCHITECTURE_AT_A_GLANCE.md` to understand where this component fits
2. Read the relevant `wiki/02_SYSTEM_LAYERS/LAYER_*.md` page for the layer(s) involved
3. Read the relevant `wiki/03_COMMUNITY_NARRATIVES/COMMUNITY_*.md` page for community context
4. Read `wiki/04_DECISIONS/` for any constraints

### Step 2: Design

1. Determine which existing functions/classes need to change
2. Determine which new functions/classes need to be created
3. Check the 5-layer stack for side effects (does this change affect Storage? Scoring? etc.)
4. Write decision log entry for the change

### Step 3: Implement

1. Start with a dry-run test (no mutation)
2. Implement the change
3. Update the wiki if the change affects architecture
4. Update the decision log

### Step 4: Verify

1. Run `--dry-run` to confirm no accidental mutations
2. Run the relevant tests
3. Ask the human to confirm the output

## Safety Checklist

- [ ] Does this change affect other projects? (If so, isolate it)
- [ ] Does this change respect the 5-layer stack? (No layer crossing)
- [ ] Does this change respect the 30-day archive? (No permanent deletions)
- [ ] Does this change have a dry-run mode? (It should)
- [ ] Does this need a decision log entry? (Probably yes)
