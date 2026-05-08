#!/usr/bin/env python3
"""
generate_wiki.py — Dual-Audience Wiki Generator v2

Reads graphify-out/graph.json + graphify-out/GRAPH_REPORT.md
and produces a human-readable + LLM-optimized wiki at graphify-out/wiki/

Usage:
    python generate_wiki.py                          # from project root
    python generate_wiki.py /path/to/graphify-out/   # explicit path

Works with any graphify output — auto-labels communities, handles
unlabeled reports, adapts to graph size.
"""

import json
import os
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path


# ── Helpers ─────────────────────────────────────────────────────────

def slug(text, maxlen=60):
    safe = re.sub(r'[^a-z0-9_]+', '_', text.lower().strip()).strip('_')
    return safe[:maxlen]


def short_label(text, maxlen=55):
    if len(text) <= maxlen:
        return text
    return text[:maxlen-3] + '...'


def cohesion_description(c):
    if c < 0.15:
        return 'loosely connected'
    elif c < 0.30:
        return 'moderately connected'
    elif c < 0.50:
        return 'coherent and well-connected'
    else:
        return 'very tightly integrated'


# ── Load data ───────────────────────────────────────────────────────

def load_data(graph_dir):
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


# ── Parse report ────────────────────────────────────────────────────

def parse_report(report):
    result = {}

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
            m2 = re.match(r'\d+\.\s+`(.+?)`\s*-\s*(\d+)\s*edges?', line)
            if m2:
                gods.append({'label': m2.group(1), 'degree': int(m2.group(2))})
        result['gods'] = gods

    # Community labels from report
    com_labels = re.findall(r'### Community (\d+) - "(.+?)"', report)
    result['report_labels'] = {int(cid): label for cid, label in com_labels}

    # Surprising connections
    surp_section = re.search(r'## Surprising Connections.*?(?=\n##)', report, re.DOTALL)
    if surp_section:
        surps = []
        for line in surp_section.group(0).split('\n'):
            m2 = re.match(r'-\s*`(.+?)`.*--(.+?)-->.*`(.+?)`.*\[(\w+)\]', line)
            if m2:
                surps.append({'src': m2.group(1), 'rel': m2.group(2).strip(), 'tgt': m2.group(3), 'conf': m2.group(4)})
        result['surprising'] = surps

    # Hyperedges
    hypers = []
    hyper_section = re.search(r'## Hyperedges.*?(?=\n##)', report, re.DOTALL)
    if hyper_section:
        for line in hyper_section.group(0).split('\n'):
            m2 = re.match(r'\*\*(.+?)\*\*.*?\[(\w+)\s*([\d.]+)\]', line)
            if m2:
                hypers.append({'label': m2.group(1), 'conf': m2.group(2), 'score': float(m2.group(3))})
    result['hyperedges'] = hypers

    # Knowledge gaps
    gaps_section = re.search(r'## Knowledge Gaps.*?(?=\n##)', report, re.DOTALL)
    if gaps_section:
        m2 = re.search(r'\*\*(\d+)\s+isolated', gaps_section.group(0))
        if m2:
            result['isolated_count'] = int(m2.group(1))

    # Suggested questions
    questions = []
    questions_section = re.search(r'## Suggested Questions.*?(?=\n##)', report, re.DOTALL)
    if questions_section:
        for line in questions_section.group(0).split('\n'):
            m2 = re.match(r'-\s+\*\*(.+?)\*\*', line)
            if m2:
                questions.append(m2.group(1))
    result['questions'] = questions

    return result


# ── Auto-label communities ─────────────────────────────────────────

def auto_label_community(cid, member_node_objects, all_node_labels, degree_map):
    """
    Generate a human-readable label for an unlabeled community
    using its most connected nodes.
    """
    if not member_node_objects:
        return f"Community {cid}"

    # Score members by degree
    scored = []
    for n in member_node_objects:
        nid = n['id']
        label = all_node_labels.get(nid, n.get('label', nid))
        deg = degree_map.get(nid, 0)
        ftype = n.get('file_type', '')
        scored.append((deg, label, ftype, nid))

    scored.sort(reverse=True)
    top3 = [s[1] for s in scored[:3]]
    top5 = [s[1] for s in scored[:5]]

    # Detect what kind of community this is
    types = Counter(n.get('file_type', '') for n in member_node_objects)
    is_code_dominated = types.get('code', 0) > len(member_node_objects) * 0.5
    is_rationale_dominated = types.get('rationale', 0) > len(member_node_objects) * 0.5

    combined = ' '.join(top5)

    # Try to find a meaningful name
    if is_code_dominated:
        # Check if they're all from one file
        files = Counter(n.get('source_file', '') for n in member_node_objects)
        if files:
            top_file = files.most_common(1)[0][0]
            file_name = Path(top_file).name
            base = file_name.replace('.ts', '').replace('.js', '').replace('.py', '').replace('.go', '')
            if base:
                return f"{base} Module ({len(member_node_objects)} functions)"

        # Check if they share a common prefix (methods of a class)
        func_names = [s[1].replace('()', '') for s in scored[:10]]
        if len(func_names) >= 3:
            # Find common prefix
            first = func_names[0]
            for prefix_len in range(min(len(first), 20), 2, -1):
                prefix = first[:prefix_len]
                if all(f.startswith(prefix) for f in func_names[:5]):
                    return f"{prefix}* Methods"

        return f"Code: {top3[0][:35]}"
    elif is_rationale_dominated:
        # Concept community — name by top concepts
        return f"Domain: {top3[0][:40]}"
    else:
        # Mixed — try to find a theme
        return f"Concepts: {top3[0][:40]}"


# ── Build community structures from graph data ──────────────────────

def build_community_data(graph):
    """Extract clean community data from graph.json nodes."""
    node_labels = {n['id']: n.get('label', n['id']) for n in graph.get('nodes', [])}
    node_types = {n['id']: n.get('file_type', 'unknown') for n in graph.get('nodes', [])}
    node_files = {n['id']: n.get('source_file', '') for n in graph.get('nodes', [])}

    degree_map = Counter()
    for e in graph.get('links', graph.get('edges', [])):
        degree_map[e.get('source', '')] += 1
        degree_map[e.get('target', '')] += 1

    # Group nodes by community
    com_members = defaultdict(list)
    for n in graph.get('nodes', []):
        c = n.get('community')
        if c is not None:
            com_members[int(c)].append(n)

    return node_labels, node_types, node_files, degree_map, com_members


# ── Template Writers ────────────────────────────────────────────────

def write_index(graph_dir, parsed, com_details):
    lines = [
        '---',
        'type: wiki/index',
        'generated: auto',
        f'nodes: {parsed.get("total_nodes", "?")}',
        f'edges: {parsed.get("total_edges", "?")}',
        f'communities: {parsed.get("total_communities", "?")}',
        'llm_instructions: "Auto-generated dual-audience wiki. Start here for navigation."',
        '---',
        '',
        '# Project Knowledge Graph Wiki',
        '',
        '> Auto-generated from graphify knowledge graph data.',
        '',
        '## Contents',
        '',
        '| Section | Description |',
        '|---------|-------------|',
        '| [[01_OVERVIEW/_README|Overview]] | What this graph represents |',
        '| [[01_OVERVIEW/ARCHITECTURE_AT_A_GLANCE|Architecture at a Glance]] | The big picture |',
        '| [[01_OVERVIEW/GLOSSARY|Glossary]] | Key concepts explained |',
        f'| [[02_TOP_COMMUNITIES/_README|Top Communities]] | Top {min(20, len(com_details))} neighborhoods |',
        '',
        '## Quick Stats',
        '',
        f'- **{parsed.get("total_nodes", "?")}** concepts (nodes)',
        f'- **{parsed.get("total_edges", "?")}** relationships (edges)',
        f'- **{parsed.get("total_communities", "?")}** communities',
    ]

    gods = parsed.get('gods', [])
    if gods:
        lines.extend([
            '',
            '## Most Connected Concepts (God Nodes)',
            '',
            'These are the hubs everything connects through:',
            '',
        ])
        for g in gods[:10]:
            lines.append(f'- **{g["label"]}** — {g["degree"]} connections')

    questions = parsed.get('questions', [])
    if questions:
        lines.extend(['', '## Questions This Graph Can Answer', ''])
        for q in questions[:5]:
            lines.append(f'- _{q}_')

    hypers = parsed.get('hyperedges', [])
    if hypers:
        lines.extend(['', '## Key Group Relationships', ''])
        for h in hypers[:5]:
            lines.append(f'- **{h["label"]}** [{h["conf"]}]')

    isolated = parsed.get('isolated_count', 0)
    if isolated:
        lines.extend([
            '',
            f'## Knowledge Gaps',
            '',
            f'- **{isolated}** isolated concepts with <=1 connection',
            '- These exist in the graph but are not well integrated',
        ])

    (graph_dir / 'wiki' / '_INDEX.md').write_text('\n'.join(lines), encoding='utf-8')
    print(f'  [OK] _INDEX.md')


def write_overview(graph_dir, parsed, com_details):
    od = graph_dir / 'wiki' / '01_OVERVIEW'
    od.mkdir(parents=True, exist_ok=True)

    # _README.md
    lines = [
        '---',
        'type: overview',
        'llm_instructions: "Entry point for human readers. Use analogies."',
        '---',
        '',
        '# What This Graph Represents',
        '',
        '## In Plain Language',
        '',
        f'This knowledge graph is a **map of how concepts connect** in this project. It has **{parsed.get("total_nodes", "?")} concepts** organized into **{parsed.get("total_communities", "?")} neighborhoods** (communities).',
        '',
        'Each neighborhood contains closely related concepts. The graph algorithm found these groupings automatically — it looked at what connects to what and drew boundaries naturally.',
        '',
        '## What the Graph Tells You',
        '',
        '- **What is most important** — God Nodes are the concepts with the most connections',
        '- **What connects to what** — Follow edges to see dependencies and relationships',
        '- **Where knowledge is thin** — Isolated nodes (<=1 connection) need better documentation',
        '',
        '## How to Use This',
        '',
        f'1. Browse the **top communities** in [[../02_TOP_COMMUNITIES/_README|Top Communities]]',
        '2. Check the **glossary** in [[GLOSSARY|Glossary]] for unfamiliar terms',
        '3. Look at **Architecture at a Glance** below for the big picture',
    ]
    (od / '_README.md').write_text('\n'.join(lines), encoding='utf-8')
    print(f'  [OK] 01_OVERVIEW/_README.md')

    # Architecture at a Glance
    lines = [
        '---',
        'type: overview/architecture',
        'llm_instructions: "Summarize using god nodes and top communities."',
        '---',
        '',
        '# Architecture at a Glance',
        '',
        gods = parsed.get('gods', [])
    ]
    if gods:
        lines.extend([
            '',
            '## Core Architecture (God Nodes)',
            '',
            'The most connected concepts form the backbone:',
            '',
        ])
        for g in gods[:12]:
            lines.append(f'- **{g["label"]}** ({g["degree"]} connections)')

    if com_details:
        lines.extend([
            '',
            '## Community Map',
            '',
            '| # | Community | Nodes | Cohesion |',
            '|---|-----------|-------|----------|',
        ])
        for cid, cd in list(com_details.items())[:20]:
            lines.append(f'| {cid} | [[../02_TOP_COMMUNITIES/COMMUNITY_{cid}|{cd["label"]}]] | {cd["size"]} | {cd["cohesion"]:.2f} |')

    surps = parsed.get('surprising', [])
    if surps:
        lines.extend(['', '## Surprising Connections', ''])
        for s in surps[:5]:
            lines.append(f'- {s["src"]} -- {s["rel"]} -> {s["tgt"]}')

    isolated = parsed.get('isolated_count', 0)
    if isolated:
        lines.extend(['', f'## Knowledge Gaps', '', f'- {isolated} isolated concepts need integration'])

    (od / 'ARCHITECTURE_AT_A_GLANCE.md').write_text('\n'.join(lines), encoding='utf-8')
    print(f'  [OK] 01_OVERVIEW/ARCHITECTURE_AT_A_GLANCE.md')

    # Glossary
    lines = [
        '---',
        'type: reference/glossary',
        'llm_instructions: "Auto-generated glossary from graph data."',
        '---',
        '',
        '# Glossary',
        '',
        '## Edge Types',
        '',
        '| Type | Certainty |',
        '|------|-----------|',
        '| EXTRACTED | 1.0 (found in source) |',
        '| INFERRED | 0.6-0.9 (model reasoned) |',
        '| AMBIGUOUS | 0.1-0.3 (needs verification) |',
        '',
        '**Node** — A single concept (file, function, idea)',
        '',
        '**Edge** — A relationship between two nodes',
        '',
        '**Community** — A group of related nodes found by the Louvain/Leiden algorithm',
        '',
        '**God Node** — The most connected node(s) in the graph',
        '',
        '**Cohesion** — A score (0-1) measuring how tightly a community is connected',
        '',
    ]
    gods = parsed.get('gods', [])
    if gods:
        lines.extend(['## Key Concepts', '', '| Concept | Role |'])
        for g in gods[:15]:
            lines.append(f'| {g["label"]} | God node ({g["degree"]} connections) |')

    (od / 'GLOSSARY.md').write_text('\n'.join(lines), encoding='utf-8')
    print(f'  [OK] 01_OVERVIEW/GLOSSARY.md')


def write_communities(graph_dir, parsed, graph, node_labels, node_types, degree_map, com_members):
    cd = graph_dir / 'wiki' / '02_TOP_COMMUNITIES'
    cd.mkdir(parents=True, exist_ok=True)

    # Build sorted list of communities by size
    sorted_coms = sorted(com_members.items(), key=lambda x: len(x[1]), reverse=True)[:20]

    # Build cross-community edges
    node_com_map = {}
    for n in graph.get('nodes', []):
        c = n.get('community')
        if c is not None:
            node_com_map[n['id']] = int(c)

    cross_edges = defaultdict(lambda: defaultdict(list))
    for e in graph.get('links', graph.get('edges', [])):
        s = e.get('source', '')
        t = e.get('target', '')
        sc = node_com_map.get(s)
        tc = node_com_map.get(t)
        if sc is not None and tc is not None and sc != tc:
            cross_edges[sc][tc].append({
                'src': node_labels.get(s, s),
                'tgt': node_labels.get(t, t),
                'rel': e.get('relation', '')
            })

    # Build com_details dict
    com_details = {}
    for cid, members in sorted_coms:
        types = Counter(n.get('file_type', '') for n in members)
        type_str = ', '.join(f'{v} {k}' for k, v in sorted(types.items()))
        sample_nodes = [node_labels.get(n['id'], n.get('label', n['id'])) for n in members[:10]]

        # Use report label if available, otherwise auto-label
        report_label = parsed.get('report_labels', {}).get(cid)
        if report_label and report_label != f'Community {cid}':
            label = report_label
        else:
            label = auto_label_community(cid, members, node_labels, degree_map)

        com_details[cid] = {
            'cid': cid,
            'label': label,
            'size': len(members),
            'cohesion': 0.0,  # Will try to find from parsed
            'type_str': type_str,
            'sample_nodes': sample_nodes,
            'outgoing': cross_edges.get(cid, {}),
        }

    # Try to get cohesion from parsed
    for cid_str, cohesion_str in parsed.get('cohesion_from_report', {}).items():
        cid = int(cid_str)
        if cid in com_details:
            com_details[cid]['cohesion'] = float(cohesion_str)

    # Index page
    lines = [
        '---',
        'type: community/index',
        'llm_instructions: "Top communities by size. Each is a neighborhood."',
        '---',
        '',
        '# Top Communities',
        '',
        f'> Top {len(sorted_coms)} communities by size.',
        '',
        '| # | Community | Nodes | Cohesion | Key Concepts |',
        '|---|-----------|-------|----------|-------------|',
    ]
    for cid, members in sorted_coms:
        cd_data = com_details.get(cid, {})
        sample = ', '.join(cd_data.get('sample_nodes', [])[:4])
        lines.append(f'| {cid} | [[COMMUNITY_{cid}|{cd_data.get("label", f"Community {cid}")}]] | {cd_data.get("size", len(members))} | {cd_data.get("cohesion", 0):.2f} | {short_label(sample, 50)} |')

    lines.extend([
        '',
        '---',
        '',
        '**Cohesion guide:**',
        '- 0.0-0.15: Very loose',
        '- 0.15-0.30: Moderate',
        '- 0.30-0.50: Coherent',
        '- 0.50+: Very tight',
    ])
    (cd / '_README.md').write_text('\n'.join(lines), encoding='utf-8')
    print(f'  [OK] 02_TOP_COMMUNITIES/_README.md')

    # Individual community pages
    for cid, members in sorted_coms:
        info = com_details[cid]
        label = info['label']
        size = info['size']
        cohesion = info['cohesion']
        types_str = info['type_str']
        samples = info['sample_nodes']
        outgoing = info['outgoing']
        coh_desc = cohesion_description(cohesion)

        lines = [
            '---',
            f'type: community/narrative',
            f'community_id: {cid}',
            f'label: "{label}"',
            f'size: {size}',
            f'cohesion: {cohesion:.2f}',
            'llm_instructions: "Community narrative from graph data."',
            '---',
            '',
            f'# Community {cid}: {label}',
            '',
            f'> **{size} nodes | Cohesion: {cohesion:.2f} ({coh_desc})**',
            '',
            '## For Humans',
            '',
            f'This community contains **{size} concepts** about **{label}**.',
            '',
            f'**Composition:** {types_str or "mixed concepts"}',
            f'',
            f'**Cohesion:** {cohesion:.2f} — {coh_desc}.',
            '',
            '**Key concepts:**',
            '',
        ]
        for s in samples[:8]:
            lines.append(f'- {short_label(s, 60)}')

        if outgoing:
            lines.extend(['', '**Connections to other communities:**', ''])
            for target_cid, edges_list in sorted(outgoing.items()):
                tgt_info = com_details.get(target_cid, {})
                tgt_label = tgt_info.get('label', f'Community {target_cid}')
                lines.append(f'- {tgt_label}:')
                for e in edges_list[:3]:
                    lines.append(f'  - {e["src"]} -- {e["rel"]} -> {e["tgt"]}')
        else:
            lines.append('')
            lines.append('_(No cross-community connections found)_')

        lines.extend([
            '',
            '## For LLMs',
            '',
            '### Data',
            '',
            f'- **ID:** {cid}',
            f'- **Label:** {label}',
            f'- **Size:** {size} nodes',
            f'- **Cohesion:** {cohesion:.2f}',
            f'- **Types:** {types_str}',
            '',
            '### Key Nodes',
            '',
        ])
        for s in samples:
            lines.append(f'- {s}')

        if outgoing:
            lines.extend(['', '### Connected Communities', ''])
            for target_cid in sorted(outgoing.keys()):
                tgt_info = com_details.get(target_cid, {})
                tgt_label = tgt_info.get('label', f'Community {target_cid}')
                edge_count = len(outgoing[target_cid])
                lines.append(f'- **{tgt_label}** (C{target_cid}) — {edge_count} edge(s)')
        else:
            lines.extend(['', '### Connected Communities', '', '_(Isolated — no cross-community edges)_'])

        (cd / f'COMMUNITY_{cid}.md').write_text('\n'.join(lines), encoding='utf-8')

    print(f'  [OK] {len(sorted_coms)} community narratives')


# ── Main ────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) > 1:
        graph_dir = Path(sys.argv[1])
    else:
        cwd = Path.cwd()
        if (cwd / 'graphify-out' / 'graph.json').exists():
            graph_dir = cwd / 'graphify-out'
        elif (cwd / 'graph.json').exists():
            graph_dir = cwd
        else:
            print("ERROR: Could not find graphify-out/. Run from project root or pass path.")
            sys.exit(1)

    print(f'Generating wiki from: {graph_dir.resolve()}')

    graph, report, gd = load_data(graph_dir)
    parsed = parse_report(report)
    node_labels, node_types, node_files, degree_map, com_members = build_community_data(graph)

    # Extract cohesion from report
    cohesion_map = {}
    for match in re.finditer(r'### Community (\d+).*?\nCohesion: ([\d.]+)', report):
        cohesion_map[int(match.group(1))] = float(match.group(2))
    parsed['cohesion_from_report'] = {str(k): v for k, v in cohesion_map.items()}

    # Ensure wiki directory
    wiki_dir = gd / 'wiki'
    wiki_dir.mkdir(parents=True, exist_ok=True)

    # Pre-build com_details ordered dict for all writers
    # We need this before write_index since it references top communities
    sorted_coms = sorted(com_members.items(), key=lambda x: len(x[1]), reverse=True)[:20]
    com_details = {}
    for cid, members in sorted_coms:
        types = Counter(n.get('file_type', '') for n in members)
        type_str = ', '.join(f'{v} {k}' for k, v in sorted(types.items()))
        samples = [node_labels.get(n['id'], n.get('label', n['id'])) for n in members[:10]]
        report_label = parsed.get('report_labels', {}).get(cid)
        if report_label and report_label != f'Community {cid}':
            label = report_label
        else:
            label = auto_label_community(cid, members, node_labels, degree_map)
        com_details[cid] = {
            'label': label,
            'size': len(members),
            'cohesion': cohesion_map.get(cid, 0.0),
            'type_str': type_str,
            'sample_nodes': samples,
        }

    print('\nWriting wiki pages...')
    write_index(gd, parsed, com_details)
    write_overview(gd, parsed, com_details)
    write_communities(gd, parsed, graph, node_labels, node_types, degree_map, com_members)

    # _WIKI.md pointer
    (gd / 'wiki' / '_WIKI.md').write_text(
        '---\ntype: pointer\n---\n\n# Wiki\n\nStart at `_INDEX.md`.\n',
        encoding='utf-8'
    )

    page_count = len(list(wiki_dir.rglob('*.md')))
    print(f'\n[DONE] Wiki generated: {gd / "wiki"} ({page_count} pages)')
    print('Open wiki/_INDEX.md to browse.')


if __name__ == '__main__':
    main()
