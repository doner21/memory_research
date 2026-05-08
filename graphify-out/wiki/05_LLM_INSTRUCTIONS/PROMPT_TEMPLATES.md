---
type: llm/templates
llm_instructions: "These are ready-made prompt templates for common tasks. Each template has placeholders in [brackets]. Fill them in before use."
---

# Ready-Made Prompt Templates

> Copy-paste these into your AI assistant. Fill in the `[brackets]`.

## 🔍 Understanding the System

```
I'm working with the Graphify Brain memory system for the project "[project name]".
I need to understand how [component] works.

Please:
1. Read the community narrative for [community name]
2. Read the layer page for [layer number]
3. Check the decision log for [topic]
4. Explain it to me like I'm not a programmer

My real goal is: [what you actually want to do]
```

## ⚙️ Changing Settings

```
In the Graphify Brain memory system for "[project name]", I want to change
the [setting, e.g., staleness weight, temperature threshold].

Current value: [what it is now]
Desired value: [what you want it to be]
Reason: [why you want to change it]

Safety requirements:
- Support --dry-run first
- Don't affect other projects
- Log the change

Please identify:
1. Which file(s) need changing
2. What the change looks like
3. What side effects to watch for
```

## 📋 Architecture Review

```
Review the architecture of the Graphify Brain memory system with focus on
[area, e.g., pruning, temperature, compression].

Evaluate:
1. Is this area over-engineered or under-engineered for its purpose?
2. Are there any single points of failure?
3. What would you change if you had 1 week?
4. What would you change if you had 1 month?

Base your analysis on the wiki in graphify-out/wiki/ and the graph data
in graphify-out/graph.json.
```

## 🆕 Adding a Feature

```
I want to add [feature description] to the Graphify Brain memory system.

The feature should:
- [requirement 1]
- [requirement 2]
- [requirement 3]

Please:
1. Identify which layer(s) this affects (Storage, Scoring, Temperature, Compression, Archetypes)
2. Check existing communities related to this
3. Check the decision log for constraints
4. Suggest an implementation approach
5. Identify what decision log entries I need to add
```

## 🔄 Cross-Project Comparison

```
Compare how the Graphify Brain system has been applied to:
1. [project A]
2. [project B]

I want to know:
- Which community structures are similar?
- Which components are unique to each project?
- What archetypes (recurring patterns) appear across both?
- What would need to change to unify them?
```

## ❌ Debugging

```
In the Graphify Brain system for "[project name]", [something went wrong].

Error/behavior: [description]
What I expected: [expected behavior]
What happened: [actual behavior]

Please:
1. Read the relevant community narrative and layer page
2. Identify possible causes based on the graph structure
3. Suggest a dry-run test to confirm the hypothesis
4. Propose a fix if the hypothesis is confirmed
```
