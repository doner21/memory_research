#!/usr/bin/env python3
"""
generate_wiki.py — Dual-Audience Wiki Generator

Reads graphify-out/graph.json + graphify-out/GRAPH_REPORT.md
and produces a human-readable + LLM-optimized wiki at graphify-out/wiki/

Usage:
    python generate_wiki.py                          # from project root
    python generate_wiki.py /path/to/graphify-out/   # explicit path
    
The wiki is structured as:
    wiki/
      _INDEX.md                    ← Entry point
      01_OVERVIEW/
        _README.md                 ← Elevator pitch
        ARCHITECTURE_AT_A_GLANCE.md
        GLOSSARY.md
      02_TOP_COMMUNITIES/
        _README.md                 ← Top 20 communities, auto-labeled
        COMMUNITY_0.md
        COMMUNITY_1.md
        ...
      03_GLOSSARY/
        GLOSSARY.md
"""

import json
import math
import os
import re
import sys
from collections import defaultdict
from pathlib import Path


# ── Helpers ──────────────────────────────────────────────────────────

def slug(text):
    """Filesystem-safe slug."""
    return re.sub(r'[^a-z0-9_]+', '_', text.lower().strip())[:60].rstrip('_')


def short_label(text, maxlen=55):
    if len(text) <= maxlen:
        return text
    return text[:maxlen-3] + '...'


def percentile(sorted_list, pct):
    """Return value at given percentile in a sorted list."""
    if not sorted_list:
        return 0
    idx = int(len(sorted_list) * pct / 100)
    return sorted_list[max(0, min(idx, len(sorted_list)-1))]


# ── Load data ───────────────────────────────────────────────────────

def load_graph(graph_dir):
    """Load graph.json and GRAPH_REPORT.md from graphify-out directory."""
    graph_dir = Path(graph_dir)
    graph_path = graph_dir / 'graph.json'
    report_path = graph_dir / 'GRAPH_REPORT.md'
    
    if not graph_path.exists():
        print(f"ERROR: {graph_path} not found")
        sys.exit(1)
    if not report_path.exists():
        print(f"ERROR: {report_path} not found")
        sys.exit(1)
    
    with open(graph_path, 'r', encoding='utf-8') as f:
        graph = json.load(f)
    
    with open(report_path, 'r', encoding='utf-8') as f:
        report = f.read()
    
    return graph, report, graph_dir


def parse_report(report):
    """Extract structured data from GRAPH_REPORT.md."""
    result = {}
    
    # Summary
    m = re.search(r'(\d+) nodes · (\d+) edges · (\d+) communities', report)
    if m:
        result['total_nodes'] = int(m.group(1))
        result['total_edges'] = int(m.group(2))
        result['total_communities'] = int(m.group(3))
    
    # God nodes
    god_section = re.search(r'## God Nodes.*?(?=\n##)', report, re.DOTALL)
    if god_section:
        gods = []
        for line in god_section.group(0).split('\n'):
            m2 = re.match(r'\d+\.\s+`(.+?)`\s*-\s*(\d+)\s*edges', line)
            if m2:
                gods.append({'label': m2.group(1), 'degree': int(m2.group(2))})
        result['gods'] = gods
    
    # Community labels from report
    communities = re.findall(r'### Community (\d+) - "(.+?)"', report)
    result['community_labels'] = {int(cid): label for cid, label in communities}
    
    # Community sections with cohesion
    com_sections = re.findall(
        r'### Community (\d+) - "(.+?)"\nCohesion: ([\d.]+)\nNodes \((\d+)\): (.+?)(?=\n###|\n##|\Z)',
        report, re.DOTALL
    )
    result['community_details'] = {}
    for cid_str, label, cohesion_str, count_str, nodes_text in com_sections:
        cid = int(cid_str)
        node_list = [n.strip() for n in nodes_text.replace('(+', '').split(',') if n.strip()]
        result['community_details'][cid] = {
            'label': label,
            'cohesion': float(cohesion_str),
            'node_count': int(count_str),
            'sample_nodes': node_list[:10],
        }
    
    # Hyperedges
    hyperedge_section = re.search(r'## Hyperedges.*?(?=\n##)', report, re.DOTALL)
    if hyperedge_section:
        hypers = []
        for line in hyperedge_section.group(0).split('\n'):
            m2 = re.match(r'\*\*(.+?)\*\*.*?\[(\w+)\s*([\d.]+)\]', line)
            if m2:
                hypers.append({'label': m2.group(1), 'confidence': m2.group(2), 'score': float(m2.group(3))})
        result['hyperedges'] = hypers
    
    # Surprising connections
    surp_section = re.search(r'## Surprising Connections.*?(?=\n##)', report, re.DOTALL)
    if surp_section:
        surps = []
        for line in surp_section.group(0).split('\n'):
            m2 = re.match(r'-\s*`(.+?)`.*?--(.+?)-->.*?`(.+?)`.*?\[(\w+)\]', line)
            if m2:
                surps.append({
                    'source': m2.group(1),
                    'relation': m2.group(2).strip(),
                    'target': m2.group(3),
                    'confidence': m2.group(4),
                })
        result['surprising'] = surps
    
    # Knowledge gaps
    gaps_section = re.search(r'## Knowledge Gaps.*?(?=\n##)', report, re.DOTALL)
    if gaps_section:
        m2 = re.search(r'\*\*(\d+)\s+isolated', gaps_section.group(0))
        if m2:
            result['isolated_count'] = int(m2.group(1))
    
    # Suggested questions
    questions_section = re.search(r'## Suggested Questions.*?(?=\n##)', report, re.DOTALL)
    if questions_section:
        questions = []
        for line in questions_section.group(0).split('\n'):
            m2 = re.match(r'-\s+\*\*(.+?)\*\*', line)
            if m2:
                questions.append(m2.group(1))
        result['questions'] = questions
    
    return result


def auto_label_community(cid, member_nodes, node_labels, degree_map, all_node_labels):
    """
    Auto-generate a label for an unlabeled community based on its top nodes.
    Looks for the most central/connected nodes in the community.
    """
    # Get top 3 most connected nodes in this community
    scored = [(degree_map.get(nid, 0), node_labels.get(nid, nid)) for nid in member_nodes]
    scored.sort(reverse=True)
    top_labels = [label for _, label in scored[:3]]
    
    # Try to find a pattern
    combined = ' '.join(top_labels)
    
    # Check if community is code-heavy or concept-heavy
    code_indicators = ['()', '.ts', '.js', '.py', 'function', 'class', 'handler']
    is_code = any(ind in combined for ind in code_indicators)
    
    if is_code:
        # Code community — name by the most important file or pattern
        files = [l for l in top_labels if any(f in l for f in ['.ts', '.js', '.py', '.go'])]
        if files:
            base = files[0].replace('.ts', '').replace('.js', '').replace('.py', '')
            return f"{base} Implementation"
        # Name by function group
        funcs = [l.replace('()', '') for l in top_labels if '()' in l]
        if funcs:
            common_prefix = os.path.commonprefix(funcs) if len(funcs) > 1 else funcs[0]
            if common_prefix:
                return f"{common_prefix.strip('_')} Functions"
        return f"Code Module ({top_labels[0][:30]})"
    else:
        # Concept community — name by the most important concept
        return f"Domain: {top_labels[0][:40]}"


# ── Template Writers ────────────────────────────────────────────────

def write_index(graph_dir, parsed):
    """Write _INDEX.md."""
    lines = [
        '---',
        'type: wiki/index',
        f'generated: auto',
        f'graphs: {parsed.get("total_nodes", "?")} nodes · {parsed.get("total_edges", "?")} edges · {parsed.get("total_communities", "?")} communities',
        'llm_instructions: "This auto-generated wiki is designed for both human readers and LLMs. Navigate by section. Each page has dual-format content."',
        '---',
        '',
        '# Project Knowledge Graph Wiki',
        '',
        '> Auto-generated from graphify knowledge graph data.',
        '',
        '## 📋 Contents',
        '',
        '| Section | Description |',
        '|---------|-------------|',
        '| [[01_OVERVIEW/_README|Overview]] | What this system is, in plain language |',
        '| [[01_OVERVIEW/ARCHITECTURE_AT_A_GLANCE|Architecture at a Glance]] | The big picture |',
        '| [[01_OVERVIEW/GLOSSARY|Glossary]] | Every term explained simply |',
        f'| [[02_TOP_COMMUNITIES/_README|Top Communities]] | The {min(20, parsed.get("total_communities", 20))} most important neighborhoods in the graph |',
        '',
        '## 📊 Quick Stats',
        '',
        f'- **{parsed.get("total_nodes", "?")}** concepts (nodes)',
        f'- **{parsed.get("total_edges", "?")}** relationships (edges)',
        f'- **{parsed.get("total_communities", "?")}** communities (groups of related concepts)',
    ]
    
    gods = parsed.get('gods', [])
    if gods:
        lines.extend([
            '',
            '## ⭐ Most Connected Concepts (God Nodes)',
            '',
            'These are the most important concepts in the graph — hubs that everything connects through:',
            '',
        ])
        for g in gods[:10]:
            lines.append(f'- **{g["label"]}** — {g["degree"]} connections')
    
    questions = parsed.get('questions', [])
    if questions:
        lines.extend([
            '',
            '## 💡 Questions This Graph Can Answer',
            '',
        ])
        for q in questions[:5]:
            lines.append(f'- _{q}_')
    
    hypers = parsed.get('hyperedges', [])
    if hypers:
        lines.extend([
            '',
            '## 🔗 Key Group Relationships (Hyperedges)',
            '',
        ])
        for h in hypers[:5]:
            lines.append(f'- **{h["label"]}** [{h["confidence"]}]')
    
    lines.extend([
        '',
        '---',
        '',
        '> **For LLMs:** The `llm_instructions` frontmatter on each page tells you how to use that page.',
    ])
    
    Path(graph_dir / 'wiki' / '_INDEX.md').write_text('\n'.join(lines), encoding='utf-8')
    print(f'  [OK] _INDEX.md')


def write_overview(graph_dir, parsed):
    """Write the overview section."""
    overview_dir = graph_dir / 'wiki' / '01_OVERVIEW'
    overview_dir.mkdir(parents=True, exist_ok=True)
    
    # _README.md
    lines = [
        '---',
        'type: overview',
        'llm_instructions: "This is the human entry point. Use analogies and plain language."',
        '---',
        '',
        '# What This Graph Represents',
        '',
        '## In Plain Language',
        '',
        'This knowledge graph is a **map of how concepts connect** in this project. Every circle (node) is one concept — a file, a function, an idea, a design decision. Every line (edge) is a relationship — "this calls that," "this implements that," "this is related to that."',
        '',
        f'The graph has **{parsed.get("total_nodes", "?")} concepts** organized into **{parsed.get("total_communities", "?")} neighborhoods** (communities). Each neighborhood contains concepts that are closely related to each other.',
        '',
        '## What The Graph Tells You',
        '',
        '- **What is most important** — God Nodes are the concepts with the most connections. They\'re the hubs everything revolves around.',
        '- **What connects to what** — Follow edges to understand dependencies and relationships.',
        '- **What you didn\'t know was connected** — Surprising Connections are cross-community links that the algorithm discovered.',
        '- **Where your knowledge is thin** — Isolated nodes (≤1 connection) are concepts that exist but aren\'t well integrated.',
        '',
        '## How To Use This',
        '',
        '1. **Browse the communities** in [[../02_TOP_COMMUNITIES/_README|Top Communities]] — pick one that interests you',
        '2. **Check the glossary** in [[GLOSSARY|Glossary]] if a term is unfamiliar',
        '3. **Look at the architecture** in [[ARCHITECTURE_AT_A_GLANCE|Architecture at a Glance]] for the big picture',
        '',
    ]
    Path(overview_dir / '_README.md').write_text('\n'.join(lines), encoding='utf-8')
    print(f'  [OK] 01_OVERVIEW/_README.md')
    
    # Architecture at a Glance
    lines = [
        '---',
        'type: overview/architecture',
        'llm_instructions: "Summarize the system architecture using god nodes and top communities as the structure."',
        '---',
        '',
        '# Architecture at a Glance',
        '',
        '> The structure of this project, as discovered by the knowledge graph.',
        '',
    ]
    
    gods = parsed.get('gods', [])
    if gods:
        lines.extend([
            '## 🏗️ Core Architecture (God Nodes)',
            '',
            'The most connected concepts form the backbone of the system:',
            '',
        ])
        for g in gods[:10]:
            lines.append(f'- **{g["label"]}** ({g["degree"]} connections)')
    
    com_details = parsed.get('community_details', {})
    if com_details:
        lines.extend([
            '',
            '## 🗺️ Community Map',
            '',
            'The graph discovered communities of related concepts. These are the "neighborhoods" of the system:',
            '',
            '| # | Community | Nodes | Cohesion |',
            '|---|-----------|-------|----------|',
        ])
        for cid in sorted(com_details.keys())[:20]:
            cd = com_details[cid]
            lines.append(f'| {cid} | {cd["label"]} | {cd["node_count"]} | {cd["cohesion"]:.2f} |')
    
    surps = parsed.get('surprising', [])
    if surps:
        lines.extend([
            '',
            '## 🔗 Bridge Connections',
            '',
            'Concepts that connect across community boundaries (surprising connections):',
            '',
        ])
        for s in surps[:5]:
            lines.append(f'- {s["source"]} —{s["relation"]}→ {s["target"]}')
    
    isolated = parsed.get('isolated_count', 0)
    if isolated > 0:
        lines.extend([
            '',
            f'## ⚠️ Knowledge Gaps',
            '',
            f'- **{isolated} isolated concepts** (≤1 connection each) — these exist but aren\'t well integrated',
            '- Consider adding documentation or code that connects these to the rest of the system',
        ])
    
    Path(overview_dir / 'ARCHITECTURE_AT_A_GLANCE.md').write_text('\n'.join(lines), encoding='utf-8')
    print(f'  [OK] 01_OVERVIEW/ARCHITECTURE_AT_A_GLANCE.md')
    
    # Glossary
    lines = [
        '---',
        'type: reference/glossary',
        'llm_instructions: "Auto-generated glossary from graph node labels and edge types."',
        '---',
        '',
        '# Glossary',
        '',
        '> Key concepts from this knowledge graph.',
        '',
        '## Edge Types',
        '',
        '| Type | Meaning | Confidence |',
        '|------|---------|------------|',
        '| EXTRACTED | Found directly in source code or documents | 1.0 (certain) |',
        '| INFERRED | Reasonable guess by the AI | 0.6–0.9 (likely) |',
        '| AMBIGUOUS | Uncertain — needs human verification | 0.1–0.3 (uncertain) |',
        '',
        '## Graph Concepts',
        '',
        '**Node** — A single concept (file, function, idea). Each node has a label, type, and source location.',
        '',
        '**Edge** — A relationship between two nodes. Tagged with confidence (see Edge Types above).',
        '',
        '**Community** — A group of nodes that are more connected to each other than to the rest of the graph. Found automatically by the Louvain/Leiden algorithm.',
        '',
        '**God Node** — The most connected node(s) in the graph. Hubs that everything connects through.',
        '',
        '**Cohesion** — A score (0–1) measuring how tightly connected a community is. Higher = more coherent.',
        '',
        '**Hyperedge** — A relationship involving 3+ nodes at once (e.g., "these 5 things together form a system").',
        '',
    ]
    
    # Add top glossary terms from god nodes
    gods = parsed.get('gods', [])
    if gods:
        lines.extend([
            '## Key Concepts in This Project',
            '',
            '| Concept | Role |',
            '|---------|------|',
        ])
        for g in gods[:15]:
            lines.append(f'| {g["label"]} | God node ({g["degree"]} connections) |')
    
    Path(overview_dir / 'GLOSSARY.md').write_text('\n'.join(lines), encoding='utf-8')
    print(f'  [OK] 01_OVERVIEW/GLOSSARY.md')


def write_communities(graph_dir, parsed, graph):
    """Write community narrative pages for the top 20 communities."""
    com_dir = graph_dir / 'wiki' / '02_TOP_COMMUNITIES'
    com_dir.mkdir(parents=True, exist_ok=True)
    
    com_details = parsed.get('community_details', {})
    if not com_details:
        print('  (no community data to write)')
        return
    
    # Sort by size (largest first), cap at 20
    sorted_coms = sorted(com_details.items(), key=lambda x: x[1]['node_count'], reverse=True)[:20]
    
    # Index page
    lines = [
        '---',
        'type: community/index',
        f'communities_shown: {len(sorted_coms)}',
        'llm_instructions: "Each community narrative explains one group of related concepts. Use these to understand the structure of the project."',
        '---',
        '',
        '# Top Communities',
        '',
        f'> The top {len(sorted_coms)} communities by size. Each is a neighborhood of related concepts.',
        '',
        '| # | Community | Nodes | Cohesion | Key Concepts |',
        '|---|-----------|-------|----------|-------------|',
    ]
    
    for cid, cd in sorted_coms:
        sample = ', '.join(cd['sample_nodes'][:4])
        lines.append(f'| {cid} | [[COMMUNITY_{cid}|{cd["label"]}]] | {cd["node_count"]} | {cd["cohesion"]:.2f} | {short_label(sample, 50)} |')
    
    lines.extend([
        '',
        '---',
        '',
        '**Cohesion guide:**',
        '- 0.0–0.15: Very loose — these concepts may need restructuring',
        '- 0.15–0.30: Moderate — related but not tightly integrated',
        '- 0.30–0.50: Coherent — well-connected community',
        '- 0.50+: Very tight — strongly interdependent',
    ])
    
    Path(com_dir / '_README.md').write_text('\n'.join(lines), encoding='utf-8')
    print(f'  [OK] 02_TOP_COMMUNITIES/_README.md')
    
    # Build node label map from graph
    node_labels = {}
    node_types = {}
    node_files = {}
    for n in graph.get('nodes', []):
        node_labels[n['id']] = n.get('label', n['id'])
        node_types[n['id']] = n.get('file_type', 'unknown')
        node_files[n['id']] = n.get('source_file', '')
    
    # Build degree map from edges
    degree_map = defaultdict(int)
    for e in graph.get('links', graph.get('edges', [])):
        degree_map[e.get('source', '')] += 1
        degree_map[e.get('target', '')] += 1
    
    # Build cross-community edges
    node_com = {}
    for n in graph.get('nodes', []):
        c = n.get('community')
        if c is not None:
            node_com[n['id']] = int(c)
    
    cross_edges = defaultdict(lambda: defaultdict(list))
    for e in graph.get('links', graph.get('edges', [])):
        s = e.get('source', '')
        t = e.get('target', '')
        sc = node_com.get(s)
        tc = node_com.get(t)
        if sc is not None and tc is not None and sc != tc:
            cross_edges[sc][tc].append({
                'src': node_labels.get(s, s),
                'tgt': node_labels.get(t, t),
                'rel': e.get('relation', ''),
            })
    
    # Write one page per community
    for cid, cd in sorted_coms:
        label = cd['label']
        size = cd['node_count']
        cohesion = cd['cohesion']
        samples = cd['sample_nodes']
        
        # Count types
        com_node_ids = []
        for n in graph.get('nodes', []):
            if n.get('community') is not None and int(n['community']) == cid:
                com_node_ids.append(n['id'])
        
        type_counts = defaultdict(int)
        for nid in com_node_ids:
            type_counts[node_types.get(nid, 'unknown')] += 1
        type_str = ', '.join(f'{v} {k}' for k, v in sorted(type_counts.items()))
        
        # Cross-community edges
        outgoing = cross_edges.get(cid, {})
        
        # Cohesion description
        if cohesion < 0.15:
            coh_desc = 'loosely connected — may need restructuring'
        elif cohesion < 0.30:
            coh_desc = 'moderately connected'
        elif cohesion < 0.50:
            coh_desc = 'coherent and well-connected'
        else:
            coh_desc = 'very tightly integrated'
        
        lines = [
            '---',
            f'type: community/narrative',
            f'community_id: {cid}',
            f'graph_name: "{label}"',
            f'size: {size}',
            f'cohesion: {cohesion}',
            'llm_instructions: "Community narrative generated from graph data. Use this for understanding the community before reading code."',
            '---',
            '',
            f'# Community {cid}: {label}',
            '',
            f'> **{size} nodes · Cohesion: {cohesion:.2f} ({coh_desc})**',
            '',
            '## 🧍 For Humans',
            '',
            f'This community contains **{size} related concepts** about **{label}**. ',
            '',
            f'**What it is:** A group of {type_str or "concepts"} that are closely related to each other.',
            '',
            f'**Cohesion:** {cohesion:.2f} — this community is {coh_desc}.',
            '',
            '**Key concepts in this community:**',
            '',
        ]
        for s in samples[:8]:
            lines.append(f'- `{short_label(s, 60)}`')
        
        if outgoing:
            lines.extend([
                '',
                '**Connections to other communities:**',
                '',
            ])
            for target_cid, edges_list in sorted(outgoing.items()):
                tgt_label = com_details.get(target_cid, {}).get('label', f'Community {target_cid}')
                lines.append(f'- Connects to **{tgt_label}** (C{target_cid}):')
                for e in edges_list[:3]:
                    lines.append(f'  - {e["src"]} —{e["rel"]}→ {e["tgt"]}')
        
        lines.extend([
            '',
            '## 🤖 For LLMs',
            '',
            '### Community Data',
            '',
            f'- **ID:** {cid}',
            f'- **Label:** {label}',
            f'- **Size:** {size} nodes',
            f'- **Cohesion:** {cohesion:.2f}',
            f'- **Types:** {type_str}',
            '',
            '### Sample Nodes',
            '',
        ])
        for s in samples:
            lines.append(f'- {s}')
        
        lines.extend([
            '',
            '### Connected Communities',
            '',
        ])
        if outgoing:
            for target_cid, edges_list in sorted(outgoing.items()):
                tgt_label = com_details.get(target_cid, {}).get('label', f'Community {target_cid}')
                lines.append(f'- **{tgt_label}** (C{target_cid}) — {len(edges_list)} edge(s)')
        else:
            lines.append('- No cross-community edges found (isolated community)')
        
        safe_name = f'COMMUNITY_{cid}'
        Path(com_dir / f'{safe_name}.md').write_text('\n'.join(lines), encoding='utf-8')
    
    print(f'  [OK] {len(sorted_coms)} community narrative pages')


# ── Main ────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) > 1:
        graph_dir = Path(sys.argv[1])
    else:
        # Try to find graphify-out in CWD
        cwd = Path.cwd()
        if (cwd / 'graphify-out' / 'graph.json').exists():
            graph_dir = cwd / 'graphify-out'
        elif (cwd / 'GRAPH_REPORT.md').exists() and (cwd / 'graph.json').exists():
            graph_dir = cwd
        else:
            print("ERROR: Could not find graphify-out/. Run from project root or pass path.")
            sys.exit(1)
    
    print(f'Generating wiki from: {graph_dir.resolve()}')
    print()
    
    graph, report, gd = load_graph(graph_dir)
    parsed = parse_report(report)
    
    # Auto-label any unlabeled communities
    node_labels = {n['id']: n.get('label', n['id']) for n in graph.get('nodes', [])}
    degree_map = defaultdict(int)
    for e in graph.get('links', graph.get('edges', [])):
        degree_map[e.get('source', '')] += 1
        degree_map[e.get('target', '')] += 1
    
    # Build member list per community from graph nodes
    com_members = defaultdict(list)
    for n in graph.get('nodes', []):
        c = n.get('community')
        if c is not None:
            com_members[int(c)].append(n['id'])
    
    # Auto-label communities that don't have labels in the report
    existing_labels = parsed.get('community_labels', {})
    com_details = parsed.get('community_details', {})
    
    for cid, members in com_members.items():
        if cid not in existing_labels and cid not in com_details:
            auto_label = auto_label_community(cid, members, node_labels, degree_map, node_labels)
            parsed.setdefault('community_details', {})[cid] = {
                'label': auto_label,
                'cohesion': 0.0,
                'node_count': len(members),
                'sample_nodes': [node_labels.get(m, m) for m in members[:10]],
            }
    
    # Ensure wiki directory
    wiki_dir = gd / 'wiki'
    wiki_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate all pages
    print('Writing wiki pages...')
    write_index(gd, parsed)
    write_overview(gd, parsed)
    write_communities(gd, parsed, graph)
    
    # Add _WIKI.md pointer
    pointer = [
        '---',
        'type: pointer',
        'target: "Dual-Audience Wiki"',
        'llm_instructions: "This is a pointer to the auto-generated architecture wiki. Use it before reading individual node files."',
        '---',
        '',
        '# 📖 Architecture Wiki',
        '',
        'This wiki is auto-generated. Start at `wiki/_INDEX.md`.',
        '',
    ]
    Path(gd / 'wiki' / '_WIKI.md').write_text('\n'.join(pointer), encoding='utf-8')
    
    print()
    print(f'[DONE] Wiki generated: {gd / "wiki"}')
    print(f'   {len(list(wiki_dir.rglob("*.md")))} pages')
    print()
    print('Open wiki/_INDEX.md to start browsing.')


if __name__ == '__main__':
    main()
