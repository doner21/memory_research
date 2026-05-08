---
type: overview
llm_instructions: "This is the entry point for human readers. Use the analogies and plain-language descriptions to frame explanations. When asked about the system, start with these 3 paragraphs and then go deeper."
---

# The Elevator Pitch

> What the Graphify Brain Memory System is, in three paragraphs that anyone can understand.

## Paragraph 1: What it is

**Graphify Brain is a memory system for AI assistants.** Think of it like a personal filing cabinet for everything an AI has learned about your projects. Every time the AI builds a "knowledge graph" (a map of how concepts connect), this system saves a snapshot. Over time, you build up a library of these snapshots — different versions, different projects, different discoveries.

The system's job is to keep this library **organized, not overflowing**. It automatically decides which snapshots to keep, which to archive, and which to summarize into smaller forms. You never lose anything important, but you also never drown in clutter.

## Paragraph 2: How it works

The system has five layers stacked on top of each other:

1. **Storage** — The filing cabinet itself. Three levels deep: Root → Project → Run. Every AI session gets its own folder.
2. **Scoring** — The judge. Every snapshot gets scored on 5 criteria: how old it is, whether it's a duplicate, whether it's too short to be useful, whether it's been superseded, and whether you've manually "pinned" it to protect it.
3. **Temperature** — The thermometer. Tracks which snapshots are "hot" (recently used) and which are "cold" (nobody has touched them in a while). Cold snapshots become candidates for compression.
4. **Compression** — The archivist. Takes old, cold snapshots and summarizes them — like turning a full book into an abstract. The summary keeps the structure but takes 90% less space.
5. **Archetypes** — The pattern finder. Looks across *all* your projects and finds recurring patterns. If you always build the same kind of thing, the system learns to recognize the blueprint.

## Paragraph 3: Why it matters

Without this system, each AI session starts from scratch. With it, the AI can remember what it learned weeks ago, across different projects, and bring that knowledge forward.

**For non-coders:** You can tell the AI "remember that thing we figured out about the pruning system last month" and it will actually know what you're talking about. You can also make decisions about *what* to remember and *what* to forget — without writing a single line of code.

**For the AI:** The wiki you're reading right now is designed so the AI can understand the architecture and make informed changes. When you talk to the AI about the system, the AI reads this same wiki to understand your perspective.

---

## Quick navigation

| Next step | What you'll find |
|-----------|-----------------|
| [[ARCHITECTURE_AT_A_GLANCE\|Architecture at a Glance]] | The full system diagram, explained |
| [[GLOSSARY\|Glossary]] | Every term in plain language |
| [[../02_SYSTEM_LAYERS/_README\|System Layers]] | Deep dive into each layer |
