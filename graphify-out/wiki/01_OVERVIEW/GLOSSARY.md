---
type: reference/glossary
llm_instructions: "This glossary explains every technical term in plain language. When a non-coder uses a term incorrectly, refer them here. All terms are ordered alphabetically."
---

# Glossary — Plain-Language Definitions

> Every term in the Graphify Brain system, explained for humans who don't write code.

## A

**Archetype**
*A recurring structural pattern across projects.*
If every project you build has a "frontend," "backend," and "database" module, the system learns to recognize that pattern. When you start a new project, it can say: "This looks like your usual three-tier setup."

**Archive**
*A 30-day holding zone before permanent deletion.*
When a run is flagged for deletion, it goes to the archive first. Like the "trash" folder on your computer — you have 30 days to change your mind.

## B

**Brain (Graphify Brain)**
*The central storage location for all saved knowledge graphs.*
Located at `~/.pi/graphify-brain/`. Every `/graphify` run that gets saved lives here, organized by project.

**Bridge Node**
*A concept that connects two or more communities.*
If the "Pruning System" connects to both "Temperature Tracking" and "Storage," then "Pruning System" is a bridge node. These are the most important concepts for understanding how the system fits together.

**Betweenness Centrality**
*A score that measures how often a node acts as a bridge.*
High betweenness = this concept is a connector. If you remove it, the graph splits apart.

## C

**Cohesion Score**
*A number from 0 to 1 that says how tightly connected a community's members are.*
0.9 = very tight (everyone talks to everyone). 0.1 = loose (barely connected). Loose communities might need reorganization.

**Community**
*A group of related concepts discovered by the graph algorithm.*
Like neighborhoods in a city — concepts that are closely connected get grouped together. There are 8 communities in this project.

**Community Detection (Louvain/Leiden)**
*The algorithm that finds communities automatically.*
It looks at the pattern of connections and asks: "Which nodes talk to each other more than they talk to everyone else?" Then it groups them.

**Compression**
*Making a large run smaller while keeping its structure.*
Like summarizing a book into a chapter list. You lose the details but keep the shape. Only happens to "cold" runs.

**Cold**
*A temperature state meaning "nobody has touched this in a while."*
Cold runs are candidates for compression. They still exist, but in summarized form.

## D

**Dry-Run**
*A preview mode that shows what WOULD happen without actually doing it.*
Like clicking "Preview" before "Send." Every destructive operation has a `--dry-run` flag for safety.

## E

**Ebbinghaus Forgetting Curve**
*A mathematical model of how memory decays over time.*
You forget fast at first, then slower. The system uses this curve to decay temperature scores, so something last week is "warm" but something from 3 months ago is "cold."

**Edge**
*A relationship between two concepts.*
If "HeatTracker" *implements* "Temperature System," that relationship is an edge. Every edge has a confidence tag: EXTRACTED (found in source), INFERRED (reasonable guess), or AMBIGUOUS (uncertain).

## F

**Fractal Compression**
*A compression method that preserves the shape of the original graph.*
Like those Russian nesting dolls — the small version looks exactly like the big version, just smaller. Uses fractal dimension to measure whether the shape survived compression.

**Fractal Dimension**
*A measurement of how complex a structure is.*
A straight line has dimension 1. A flat surface has dimension 2. A graph's fractal dimension falls between 1 and 2, and compression tries to preserve it.

## G

**God Node**
*The most connected node in the graph.*
Like the busiest intersection in a city. If you understand the god nodes, you understand the core of the system.

**Graph**
*A collection of nodes (concepts) and edges (relationships).*
Like a mind map. Each node is one concept. Each edge shows how they're connected. The `/graphify` tool builds these automatically.

## H

**Heat**
*A measure of how recently a run was accessed.*
Part of the Temperature System. "Hot" means recently used. "Cold" means untouched for a while.

**HeatTracker**
*A piece of code that maintains the temperature for every run.*
It records every time a run is loaded or saved, and it decays temperatures over time using the Ebbinghaus curve.

**Hyperedge**
*A relationship involving three or more nodes at once.*
If nodes A, B, and C together *form* a system, that's a hyperedge. Normal edges only connect two things at a time.

## J

**Jaccard Similarity**
*A way to measure how similar two sets of things are.*
If Run A has concepts {a, b, c} and Run B has concepts {a, b, d}, their Jaccard similarity is 2/4 = 0.5 (they share 2 out of 4). Used in redundancy detection.

## L

**LRU (Least Recently Used)**
*A simple eviction strategy: delete the thing that hasn't been used the longest.*
Like cleaning out your closet by throwing away the shirt you haven't worn in a year.

**Louvain/Leiden Algorithm**
*The specific algorithm used for community detection.*
Two popular algorithms that find groups in a graph. Leiden is a newer, improved version of Louvain.

## M

**MinHash + LSH**
*A technique for finding near-duplicate content quickly.*
Instead of comparing every pair of runs (too slow), MinHash creates a "fingerprint" of each run. LSH then groups similar fingerprints together.

## N

**Node**
*A single concept or entity in the graph.*
Could be a function (`HeatTracker`), a file (`graphify.ts`), an idea (`Fractal Compression`), or a principle (`Zettelkasten Linking`). Each node has a label, type, and source file.

## O

**Obsidian Vault**
*A readable collection of wiki pages, one per graph node.*
Each node becomes a markdown file. Links between notes mirror edges in the graph. You can browse it like a Wikipedia for your codebase.

## P

**Pin**
*A manual flag that protects a run from deletion.*
Like putting a "SAVE THIS" sticky note on a file. Pinned runs bypass the pruning system entirely.

**Project Slug**
*A URL-friendly version of a project name.*
"Memory Reaserch" becomes "memory-reaserch." Used as the folder name in the brain.

**Prune Score**
*A composite score from 5 signals that determines if a run should be deleted.*
Each signal (staleness, redundancy, low-signal, obsoletion, pin) contributes. Higher score = more likely to be pruned.

## R

**Redundancy**
*A signal that measures whether a run is a duplicate of another run.*
Uses SimHash + Jaccard similarity. If two runs have nearly identical content, the older one gets a high redundancy score.

**Run**
*A single snapshot of a knowledge graph.*
Every time `/graphify` builds a graph, that's one run. Runs are saved, scored, and potentially pruned.

## S

**SimHash**
*A fingerprinting algorithm for detecting near-duplicates.*
Creates a short hash (fingerprint) of each run's content. Runs with similar hashes are likely duplicates.

**Staleness**
*A signal that measures how old a run is.*
Uses exponential decay: a run that's 1 day old gets a low staleness score, a run that's 1 year old gets a high score.

**Supernode**
*A compressed node that represents an entire community.*
After compression, instead of 50 nodes about "Pruning," you get 1 supernode called "Pruning System" with a summary.

## T

**Temperature**
*A state (hot/warm/cold) that determines what happens to a run.*
Hot runs stay as-is. Warm runs may get flagged. Cold runs are candidates for compression. Managed by the HeatTracker.

## W

**WL (Weisfeiler-Lehman) Graph Isomorphism**
*A method for checking whether two graphs have the same structure.*
Used in Archetype detection to find projects that are "shaped the same" even if they have different content.

## Z

**Zettelkasten**
*A note-taking method where ideas are linked like a web.*
German for "slip box." Each note is one idea, connected to related ideas. The graph system is heavily inspired by this.
