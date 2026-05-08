import json
from collections import defaultdict
import re

data = json.loads(open('graphify-out/graph.json').read())
nodes = data['nodes']
edges = data['links']
report = open('graphify-out/GRAPH_REPORT.md').read()

# Extract community labels from report
communities = re.findall(r'### Community (\d+) - \"(.+?)\"', report)
com_labels = {int(cid): label for cid, label in communities}

# Group by community
com_members = defaultdict(list)
for n in nodes:
    com_members[n.get('community')].append(n)

# For each community, find outgoing edges to other communities
com_edges = defaultdict(lambda: defaultdict(list))
for e in edges:
    src = e.get('source','')
    tgt = e.get('target','')
    src_com = None
    tgt_com = None
    for n in nodes:
        if n['id'] == src:
            src_com = n.get('community')
        if n['id'] == tgt:
            tgt_com = n.get('community')
    if src_com is not None and tgt_com is not None and src_com != tgt_com:
        src_label = next((n['label'] for n in nodes if n['id']==src), src)
        tgt_label = next((n['label'] for n in nodes if n['id']==tgt), tgt)
        com_edges[src_com][tgt_com].append({
            'src': src_label, 'tgt': tgt_label,
            'rel': e.get('relation',''), 'conf': e.get('confidence','')
        })

# God nodes
god_match = re.search(r'## God Nodes.*?(?=\n##)', report, re.DOTALL)
god_text = god_match.group(0) if god_match else ''

# Surprising connections
surp_match = re.search(r'## Surprising Connections.*?(?=\n##)', report, re.DOTALL)
surp_text = surp_match.group(0) if surp_match else ''

# Hyperedges
hyp = data['graph'].get('hyperedges', [])

# Build degree centrality per node
degree = defaultdict(int)
for e in edges:
    degree[e.get('source','')] += 1
    degree[e.get('target','')] += 1

# Find bridge nodes (nodes connected to multiple communities)
node_communities = {}
for n in nodes:
    node_communities[n['id']] = n.get('community')

bridge_nodes = defaultdict(lambda: {'communities': set(), 'degree': 0, 'label': ''})
for e in edges:
    s = e.get('source','')
    t = e.get('target','')
    sc = node_communities.get(s)
    tc = node_communities.get(t)
    if sc is not None and tc is not None and sc != tc:
        sl = next((n['label'] for n in nodes if n['id']==s), s)
        tl = next((n['label'] for n in nodes if n['id']==t), t)
        bridge_nodes[s]['communities'].add(tc)
        bridge_nodes[s]['label'] = sl
        bridge_nodes[s]['degree'] = degree.get(s, 0)
        bridge_nodes[t]['communities'].add(sc)
        bridge_nodes[t]['label'] = tl
        bridge_nodes[t]['degree'] = degree.get(t, 0)

# Sort bridge nodes by number of communities connected
sorted_bridges = sorted(bridge_nodes.items(), key=lambda x: (len(x[1]['communities']), x[1]['degree']), reverse=True)

result = {
    'communities': {},
    'cross_com_edges': {},
    'bridge_nodes': [{'label': v['label'], 'communities': list(v['communities']), 'degree': v['degree']} for k,v in sorted_bridges[:15]],
    'god_nodes': god_text,
    'surprising': surp_text,
    'hyperedges': hyp,
}

for k,v in sorted(com_members.items()):
    label = com_labels.get(k, f'Community {k}')
    result['communities'][str(k)] = {
        'label': label,
        'members': [{'label': m['label'], 'type': m['file_type'], 'file': m['source_file']} for m in v],
    }

for k,v in sorted(com_edges.items()):
    k_str = str(k)
    result['cross_com_edges'][k_str] = {}
    for kk,vv in sorted(v.items()):
        kk_str = str(kk)
        result['cross_com_edges'][k_str][kk_str] = vv

with open('graphify-out/_graph_data.json', 'w') as f:
    json.dump(result, f, indent=2)

print('Extraction complete')
print(f'Communities: {len(result["communities"])}')
print(f'Bridge nodes: {len(result["bridge_nodes"])}')
for k,v in sorted(result['communities'].items()):
    print(f'  C{k}: {v["label"]} ({len(v["members"])} members)')
