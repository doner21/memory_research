var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../.pi/agent/extensions/graphify.ts
var graphify_exports = {};
__export(graphify_exports, {
  default: () => graphify_default
});
module.exports = __toCommonJS(graphify_exports);
var fs = __toESM(require("node:fs"));
var path = __toESM(require("node:path"));
var os = __toESM(require("node:os"));
var import_node_child_process = require("node:child_process");
var BRAIN_DIR = path.join(os.homedir(), ".pi", "graphify-brain");
var INDEX_PATH = path.join(BRAIN_DIR, "index.md");
var WIKI_VAULT = path.join(BRAIN_DIR, "obsidian-vault");
var NOTES_DIR = path.join(WIKI_VAULT, "_notes");
var ARCHIVE_DIR = path.join(BRAIN_DIR, ".archive");
var LOW_SIGNAL_THRESHOLD = 10;
var PRUNE_THRESHOLD = 0.7;
var ARCHIVE_GRACE_DAYS = 30;
var STALENESS_HALF_LIFE_DAYS = 23;
function ensureBrainDir() {
  fs.mkdirSync(BRAIN_DIR, { recursive: true });
  return BRAIN_DIR;
}
function ensureVault() {
  fs.mkdirSync(WIKI_VAULT, { recursive: true });
  fs.mkdirSync(NOTES_DIR, { recursive: true });
}
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
var HeatTracker = class {
  persistPath;
  data;
  constructor() {
    ensureBrainDir();
    this.persistPath = path.join(BRAIN_DIR, "brain-meta.json");
    this.data = this.load();
  }
  load() {
    try {
      if (fs.existsSync(this.persistPath)) {
        return JSON.parse(fs.readFileSync(this.persistPath, "utf-8"));
      }
    } catch {
    }
    return {
      schemaVersion: 2,
      archetypes: [],
      heatTracker: {
        lastUpdateAt: (/* @__PURE__ */ new Date()).toISOString(),
        entries: {}
      }
    };
  }
  save() {
    this.data.heatTracker.lastUpdateAt = (/* @__PURE__ */ new Date()).toISOString();
    fs.writeFileSync(this.persistPath, JSON.stringify(this.data, null, 2), "utf-8");
  }
  recordAccess(runId) {
    const entry = this.data.heatTracker.entries[runId];
    if (entry) {
      entry.accessCount++;
      entry.lastAccessedAt = (/* @__PURE__ */ new Date()).toISOString();
      entry.temperature = "hot";
    } else {
      this.data.heatTracker.entries[runId] = {
        accessCount: 1,
        lastAccessedAt: (/* @__PURE__ */ new Date()).toISOString(),
        temperature: "hot"
      };
    }
    this.save();
  }
  decayTemperatures() {
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1e3;
    const SEVEN_DAYS = 7 * ONE_DAY;
    let changed = false;
    for (const entry of Object.values(this.data.heatTracker.entries)) {
      const age = now - new Date(entry.lastAccessedAt).getTime();
      let newTemp;
      if (age < ONE_DAY) {
        newTemp = "hot";
      } else if (age < SEVEN_DAYS) {
        newTemp = "warm";
      } else {
        newTemp = "cold";
      }
      if (entry.temperature !== newTemp) {
        entry.temperature = newTemp;
        changed = true;
      }
    }
    if (changed) {
      this.save();
    }
  }
  getTemperature(runId) {
    return this.data.heatTracker.entries[runId]?.temperature ?? "cold";
  }
  getEntry(runId) {
    return this.data.heatTracker.entries[runId] ?? null;
  }
  getStats() {
    const counts = { hot: 0, warm: 0, cold: 0 };
    for (const entry of Object.values(this.data.heatTracker.entries)) {
      if (entry.temperature === "hot") counts.hot++;
      else if (entry.temperature === "warm") counts.warm++;
      else counts.cold++;
    }
    return counts;
  }
};
var heatTracker = new HeatTracker();
function extractSections(text, headings) {
  const lines = text.split("\n");
  const result = [];
  let collecting = null;
  for (const line of lines) {
    const hMatch = line.match(/^##\s+(.+)$/);
    if (hMatch) {
      collecting = headings.includes(hMatch[1].trim()) ? hMatch[1].trim() : null;
    }
    if (collecting !== null) result.push(line);
  }
  return result.join("\n");
}
function rebuildBrainIndex() {
  ensureBrainDir();
  const entries = [];
  for (const entry of fs.readdirSync(BRAIN_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "obsidian-vault") continue;
    const metaPath = path.join(BRAIN_DIR, entry.name, "meta.json");
    if (!fs.existsSync(metaPath)) continue;
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      const report = path.join(BRAIN_DIR, entry.name, "GRAPH_REPORT.md");
      const wiki = path.join(BRAIN_DIR, entry.name, "wiki", "index.md");
      entries.push(
        `## ${meta.displayName ?? entry.name}`,
        `- **Project path**: \`${meta.projectPath ?? "unknown"}\``,
        `- **Saved**: ${meta.savedAt ?? "unknown"}`,
        `- **Artifacts**: ${fs.existsSync(report) ? "GRAPH_REPORT.md" : ""}${fs.existsSync(report) && fs.existsSync(wiki) ? ", " : ""}${fs.existsSync(wiki) ? "wiki/index.md" : ""}${!fs.existsSync(report) && !fs.existsSync(wiki) ? "(empty)" : ""}`,
        `- **Nodes**: ${meta.nodeCount ?? "?"}  |  **Edges**: ${meta.edgeCount ?? "?"}`,
        ""
      );
    } catch {
    }
  }
  const content = [
    "# Global Graphify Brain",
    "",
    `> Path: \`${BRAIN_DIR}\``,
    "",
    entries.length > 0 ? `${entries.length / 5} project graph(s) saved.` : "No project graphs saved yet. Run `/memory save` after a `/graphify` run.",
    "",
    ...entries
  ].join("\n");
  fs.writeFileSync(INDEX_PATH, content, "utf-8");
}
function brainContextForCwd(cwd) {
  if (!fs.existsSync(INDEX_PATH)) return null;
  const parts = [fs.readFileSync(INDEX_PATH, "utf-8")];
  for (const entry of fs.readdirSync(BRAIN_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "obsidian-vault") continue;
    const metaPath = path.join(BRAIN_DIR, entry.name, "meta.json");
    if (!fs.existsSync(metaPath)) continue;
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      if (!meta.projectPath) continue;
      const match = path.resolve(meta.projectPath) === path.resolve(cwd) || path.resolve(cwd).startsWith(path.resolve(meta.projectPath) + path.sep) || path.resolve(meta.projectPath).startsWith(path.resolve(cwd) + path.sep);
      if (!match) continue;
      const reportPath = path.join(BRAIN_DIR, entry.name, "GRAPH_REPORT.md");
      if (fs.existsSync(reportPath)) {
        const report = fs.readFileSync(reportPath, "utf-8");
        const sections = extractSections(report, [
          "God Nodes",
          "Surprising Connections",
          "Suggested Questions"
        ]);
        parts.push(
          `
## Active Project Graph: ${meta.displayName ?? entry.name}`,
          `(Saved ${meta.savedAt})`,
          `
${sections}`
        );
      }
      const wikiIndex = path.join(BRAIN_DIR, entry.name, "wiki", "index.md");
      if (fs.existsSync(wikiIndex)) {
        const wiki = fs.readFileSync(wikiIndex, "utf-8");
        parts.push(
          `
## Graph Wiki (${meta.displayName ?? entry.name})`,
          wiki.slice(0, 4e3)
        );
      }
      break;
    } catch {
    }
  }
  return parts.join("\n");
}
function copyObsidianToVault(obsidianSrc, projectSlug, displayName) {
  const destDir = path.join(WIKI_VAULT, projectSlug);
  let copied = 0;
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
  fs.mkdirSync(destDir, { recursive: true });
  const entries = fs.readdirSync(obsidianSrc, { withFileTypes: true });
  for (const entry of entries) {
    const src = path.join(obsidianSrc, entry.name);
    const dst = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      fs.cpSync(src, dst, { recursive: true });
    } else {
      fs.copyFileSync(src, dst);
    }
    copied++;
  }
  const indexPath = path.join(destDir, "_PROJECT.md");
  const indexContent = [
    "---",
    "tags: [graphify, project]",
    "---",
    "",
    `# ${displayName}`,
    "",
    `> Knowledge graph wiki for **${displayName}**`,
    "",
    `![[graph.canvas|Graph Canvas]]`,
    ""
  ].join("\n");
  fs.writeFileSync(indexPath, indexContent, "utf-8");
  copied++;
  return copied;
}
function rebuildVaultIndex() {
  ensureVault();
  const projects = [];
  for (const entry of fs.readdirSync(WIKI_VAULT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("_")) continue;
    const metaPath = path.join(BRAIN_DIR, entry.name, "meta.json");
    const displayName = (() => {
      try {
        return JSON.parse(fs.readFileSync(metaPath, "utf-8")).displayName ?? entry.name;
      } catch {
        return entry.name;
      }
    })();
    projects.push({ slug: entry.name, name: displayName });
  }
  const indexLines = [
    "# Graphify Wiki Vault",
    "",
    `> **${projects.length} project(s)** indexed`,
    "",
    "---",
    "",
    "## Projects",
    ""
  ];
  for (const p of projects) {
    indexLines.push(`- [[${p.slug}/_PROJECT|${p.name}]]`);
  }
  indexLines.push(
    "",
    "## Notes",
    "",
    "Free-form notes live in `_notes/` \u2014 Obsidian automatically links them.",
    "",
    `- [[_notes/_INBOX|\u{1F4E5} Inbox]]`
  );
  fs.writeFileSync(
    path.join(WIKI_VAULT, "_INDEX.md"),
    indexLines.join("\n"),
    "utf-8"
  );
  const inboxPath = path.join(NOTES_DIR, "_INBOX.md");
  if (!fs.existsSync(inboxPath)) {
    fs.writeFileSync(
      inboxPath,
      ["# \u{1F4E5} Inbox", "", "Quick-capture notes.", "", "---", ""].join("\n"),
      "utf-8"
    );
  }
  const canvasNodes = [];
  const canvasEdges = [];
  const cols = Math.ceil(Math.sqrt(projects.length));
  let idx = 0;
  for (const p of projects) {
    const x = idx % cols * 500;
    const y = Math.floor(idx / cols) * 300;
    canvasNodes.push(
      JSON.stringify({
        id: `proj-${p.slug}`,
        type: "text",
        x,
        y,
        width: 300,
        height: 120,
        file: `${p.slug}/_PROJECT.md`
      })
    );
    canvasEdges.push(
      JSON.stringify({
        id: `edge-master-${p.slug}`,
        fromNode: "master",
        toNode: `proj-${p.slug}`
      })
    );
    idx++;
  }
  canvasNodes.push(
    JSON.stringify({
      id: "notes",
      type: "text",
      x: 0,
      y: idx * 300 + 200,
      width: 300,
      height: 80,
      file: "_notes/_INBOX.md"
    })
  );
  canvasNodes.unshift(
    JSON.stringify({
      id: "master",
      type: "text",
      x: cols * 500 / 2 - 150,
      y: -200,
      width: 300,
      height: 100,
      file: "_INDEX.md"
    })
  );
  const canvas = [
    "{",
    '  "nodes": [',
    "    " + canvasNodes.join(",\n    "),
    "  ],",
    '  "edges": [',
    "    " + canvasEdges.join(",\n    "),
    "  ]",
    "}"
  ].join("\n");
  fs.writeFileSync(
    path.join(WIKI_VAULT, "_BRAIN_CANVAS.canvas"),
    canvas,
    "utf-8"
  );
}
function openInObsidian() {
  try {
    const vaultPath = WIKI_VAULT.replace(/\\/g, "/");
    const vaultName = encodeURIComponent(path.basename(WIKI_VAULT));
    const uri = `obsidian://open?vault=${vaultName}&file=_INDEX`;
    const cmd = process.platform === "win32" ? `start "" "${uri}"` : process.platform === "darwin" ? `open "${uri}"` : `xdg-open "${uri}"`;
    (0, import_node_child_process.execSync)(cmd, { stdio: "ignore", timeout: 5e3 });
    return true;
  } catch {
    return false;
  }
}
function graphify_default(pi) {
  pi.registerCommand("graphify", {
    description: "Build a knowledge graph of any folder \u2014 code, docs, papers, images. Outputs HTML graph, Obsidian vault, and GRAPH_REPORT.md.",
    handler: async (args, ctx) => {
      const skillArgs = args ? ` ${args.trim()}` : "";
      await ctx.waitForIdle();
      pi.sendUserMessage(`/skill:graphify${skillArgs}`);
    }
  });
  pi.registerCommand("memory", {
    description: "Global graphify brain. /memory save | list | load <project> [--run <id>] | runs <project> | prune <p> | pin/unpin <id> | gc | keep <id> | stats [p]",
    handler: async (args, ctx) => {
      const parts = args?.trim().split(/\s+/) ?? [];
      const sub = parts[0]?.toLowerCase();
      const rest = parts.slice(1).join(" ");
      switch (sub) {
        case "save":
          await handleSave(ctx, pi);
          if (fs.existsSync(path.join(ctx.cwd, "graphify-out", "obsidian"))) {
            await handleWikiSyncCurrent(ctx, pi);
          }
          break;
        case "list":
          await handleList(ctx, pi);
          break;
        case "load":
          const runMatch = rest.match(/^(.+?)\s+--run\s+(\S+)$/);
          if (runMatch) {
            await handleLoadRun(ctx, pi, runMatch[1].trim(), runMatch[2].trim());
          } else {
            await handleLoad(ctx, pi, rest);
          }
          break;
        case "runs":
          await handleRuns(ctx, pi, rest);
          break;
        case "prune":
          await handlePrune(ctx, pi, rest);
          break;
        case "pin":
          await handlePin(ctx, pi, rest);
          break;
        case "unpin":
          await handleUnpin(ctx, pi, rest);
          break;
        case "gc":
          await handleGc(ctx, pi);
          break;
        case "keep":
          await handleKeep(ctx, pi, rest);
          break;
        case "stats":
          await handleStats(ctx, pi, rest || void 0);
          break;
        default:
          ctx.ui.notify(
            "Usage: /memory save | list | load <project> [--run <id>] | runs <project> | prune <p> | pin/unpin <id> | gc | keep <id> | stats [p]",
            "info"
          );
      }
    }
  });
  pi.registerCommand("memory-wiki", {
    description: "Obsidian wiki vault from graphify graphs. /memory-wiki | sync | open | notes",
    handler: async (args, ctx) => {
      const parts = args?.trim().split(/\s+/) ?? [];
      const sub = parts[0]?.toLowerCase();
      switch (sub) {
        case "sync":
          await handleWikiSyncAll(ctx);
          break;
        case "open":
        case "launch":
          await handleWikiOpen(ctx);
          break;
        case "notes":
          await handleWikiNotes(ctx);
          break;
        default:
          await handleWikiSyncCurrent(ctx, pi);
          break;
      }
    }
  });
  pi.on("session_start", async () => {
    ensureBrainDir();
    rebuildBrainIndex();
    try {
      heatTracker.decayTemperatures();
    } catch {
    }
  });
  pi.on("before_agent_start", async (event) => {
    const cwd = event.systemPromptOptions?.cwd ?? process.cwd();
    const brainCtx = brainContextForCwd(cwd);
    if (!brainCtx) return;
    return {
      systemPrompt: event.systemPrompt + "\n\n## Global Graphify Brain\nThe following knowledge-graph artifacts are available for this project. Prefer them for architecture and dependency questions before broad file reading.\n\n" + brainCtx
    };
  });
}
function dirSize(dir) {
  let total = 0;
  if (!fs.existsSync(dir)) return 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += dirSize(full);
    } else {
      try {
        total += fs.statSync(full).size;
      } catch {
      }
    }
  }
  return total;
}
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
async function handleSave(ctx, pi) {
  const cwd = ctx.cwd;
  const graphifyOut = path.join(cwd, "graphify-out");
  const reportPath = path.join(graphifyOut, "GRAPH_REPORT.md");
  const graphPath = path.join(graphifyOut, "graph.json");
  const wikiPath = path.join(graphifyOut, "wiki");
  const obsidianPath = path.join(graphifyOut, "obsidian");
  if (!fs.existsSync(reportPath) && !fs.existsSync(graphPath)) {
    ctx.ui.notify(
      "No graphify-out/ found in current directory. Run /graphify first.",
      "error"
    );
    return;
  }
  const projectName = path.basename(cwd);
  const slug = slugify(projectName);
  const destDir = path.join(BRAIN_DIR, slug);
  ensureBrainDir();
  fs.mkdirSync(destDir, { recursive: true });
  const now = /* @__PURE__ */ new Date();
  const runId = now.toISOString().replace(/:/g, "-").replace(/\.\d{3}Z$/, "Z");
  const runDir = path.join(destDir, "runs", runId);
  fs.mkdirSync(runDir, { recursive: true });
  let artifactCount = 0;
  if (fs.existsSync(reportPath)) {
    fs.copyFileSync(reportPath, path.join(runDir, "GRAPH_REPORT.md"));
    artifactCount++;
  }
  if (fs.existsSync(graphPath)) {
    fs.copyFileSync(graphPath, path.join(runDir, "graph.json"));
    artifactCount++;
  }
  if (fs.existsSync(wikiPath)) {
    fs.cpSync(wikiPath, path.join(runDir, "wiki"), { recursive: true });
    artifactCount++;
  }
  if (fs.existsSync(obsidianPath)) {
    fs.cpSync(obsidianPath, path.join(runDir, "obsidian"), { recursive: true });
    artifactCount++;
  }
  let copied = 0;
  if (fs.existsSync(reportPath)) {
    fs.copyFileSync(reportPath, path.join(destDir, "GRAPH_REPORT.md"));
    copied++;
  }
  if (fs.existsSync(graphPath)) {
    fs.copyFileSync(graphPath, path.join(destDir, "graph.json"));
    copied++;
  }
  if (fs.existsSync(wikiPath)) {
    fs.cpSync(wikiPath, path.join(destDir, "wiki"), { recursive: true });
    copied++;
  }
  if (fs.existsSync(obsidianPath)) {
    fs.cpSync(obsidianPath, path.join(destDir, "obsidian"), {
      recursive: true
    });
    copied++;
  }
  let nodeCount = "?";
  let edgeCount = "?";
  if (fs.existsSync(graphPath)) {
    try {
      const graph = JSON.parse(fs.readFileSync(graphPath, "utf-8"));
      nodeCount = String(graph.nodes?.length ?? "?");
      edgeCount = String(graph.links?.length ?? graph.edges?.length ?? "?");
    } catch {
    }
  }
  const nCount = parseInt(String(nodeCount)) || 0;
  const eCount = parseInt(String(edgeCount)) || 0;
  const runMeta = {
    runId,
    savedAt: now.toISOString(),
    nodeCount: nCount,
    edgeCount: eCount,
    artifactCount,
    pruneScore: {
      staleness: 0,
      redundancy: 0,
      lowSignal: 0,
      obsoletion: 0,
      pinned: false
    },
    totalPruneScore: 0,
    temperature: "hot",
    lastAccessedAt: now.toISOString(),
    accessCount: 0,
    compressionState: "raw"
  };
  fs.writeFileSync(
    path.join(runDir, "run-meta.json"),
    JSON.stringify(runMeta, null, 2),
    "utf-8"
  );
  const existingMetaPath = path.join(destDir, "meta.json");
  let existingRunCount = 0;
  if (fs.existsSync(existingMetaPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(existingMetaPath, "utf-8"));
      existingRunCount = existing.runCount ?? 0;
    } catch {
    }
  }
  const meta = {
    displayName: projectName,
    projectPath: path.resolve(cwd),
    savedAt: now.toISOString(),
    nodeCount,
    edgeCount,
    schemaVersion: 2,
    runCount: existingRunCount + 1,
    lastRunId: runId
  };
  fs.writeFileSync(
    path.join(destDir, "meta.json"),
    JSON.stringify(meta, null, 2),
    "utf-8"
  );
  rebuildBrainIndex();
  ctx.ui.notify(
    `Saved "${projectName}" \u2192 ${slug}/ (${nodeCount} nodes, ${edgeCount} edges, ${copied} artifacts)`,
    "success"
  );
}
async function handleList(ctx, pi) {
  if (!fs.existsSync(INDEX_PATH)) {
    ctx.ui.notify(
      "No project graphs saved yet. Run /memory save first.",
      "info"
    );
    return;
  }
  const content = fs.readFileSync(INDEX_PATH, "utf-8");
  await ctx.waitForIdle?.();
  pi.sendUserMessage(content);
}
async function handleLoad(ctx, pi, projectName) {
  if (!projectName) {
    ctx.ui.notify("Usage: /memory load <project-name>", "info");
    return;
  }
  const slug = slugify(projectName);
  const projDir = path.join(BRAIN_DIR, slug);
  const metaPath = path.join(projDir, "meta.json");
  if (!fs.existsSync(metaPath)) {
    ctx.ui.notify(
      `No saved graph for "${projectName}". Use /memory list first.`,
      "error"
    );
    return;
  }
  const parts = [`## Loaded graph: ${projectName}
`];
  const reportPath = path.join(projDir, "GRAPH_REPORT.md");
  if (fs.existsSync(reportPath)) {
    parts.push(fs.readFileSync(reportPath, "utf-8"));
  }
  const wikiIndex = path.join(projDir, "wiki", "index.md");
  if (fs.existsSync(wikiIndex)) {
    parts.push(
      "\n## Wiki Index\n" + fs.readFileSync(wikiIndex, "utf-8").slice(0, 8e3)
    );
  }
  try {
    var loadMeta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    if (loadMeta.lastRunId) heatTracker.recordAccess(loadMeta.lastRunId);
  } catch (e) {
  }
  await ctx.waitForIdle();
  pi.sendUserMessage(parts.join("\n"));
}
async function handleLoadRun(ctx, pi, projectName, runId) {
  if (!projectName || !runId) {
    ctx.ui.notify("Usage: /memory load <project> --run <run-id>", "info");
    return;
  }
  const slug = slugify(projectName);
  const runDir = path.join(BRAIN_DIR, slug, "runs", runId);
  if (!fs.existsSync(runDir)) {
    ctx.ui.notify(
      "Run " + runId + " not found. Use /memory runs " + projectName + " first.",
      "error"
    );
    return;
  }
  const parts = ["## Loaded run: " + projectName + " -- " + runId + "\n"];
  const reportPath = path.join(runDir, "GRAPH_REPORT.md");
  if (fs.existsSync(reportPath)) {
    parts.push(fs.readFileSync(reportPath, "utf-8"));
  }
  const wikiIndex = path.join(runDir, "wiki", "index.md");
  if (fs.existsSync(wikiIndex)) {
    parts.push("\n## Wiki Index\n" + fs.readFileSync(wikiIndex, "utf-8").slice(0, 8e3));
  }
  try {
    heatTracker.recordAccess(runId);
  } catch (e) {
  }
  await ctx.waitForIdle();
  pi.sendUserMessage(parts.join("\n"));
}
async function handleRuns(ctx, pi, projectName) {
  const slug = slugify(projectName || path.basename(ctx.cwd));
  const runsDir = path.join(BRAIN_DIR, slug, "runs");
  if (!fs.existsSync(runsDir)) {
    ctx.ui.notify("No runs yet. Run /memory save first.", "info");
    return;
  }
  const runEntries = fs.readdirSync(runsDir, { withFileTypes: true }).filter(function(d) {
    return d.isDirectory();
  }).sort(function(a, b) {
    return b.name.localeCompare(a.name);
  });
  if (runEntries.length === 0) {
    ctx.ui.notify("No runs found.", "info");
    return;
  }
  var lines = [
    "## Runs for " + projectName,
    "",
    "| Run ID | Nodes | Edges |",
    "|---|---|---|"
  ];
  for (var i = 0; i < runEntries.length; i++) {
    var entry = runEntries[i];
    var metaPath = path.join(runsDir, entry.name, "run-meta.json");
    var nodeCount = "?";
    var edgeCount = "?";
    try {
      var m = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      nodeCount = String(m.nodeCount != null ? m.nodeCount : "?");
      edgeCount = String(m.edgeCount != null ? m.edgeCount : "?");
    } catch (e) {
    }
    lines.push("| " + entry.name + " | " + nodeCount + " | " + edgeCount + " |");
  }
  await ctx.waitForIdle();
  pi.sendUserMessage(lines.join("\n"));
}
function getNodeLabels(graph) {
  const labels = /* @__PURE__ */ new Set();
  const nodes = graph.nodes ?? [];
  for (const n of nodes) {
    const label = String(n.label || n.name || n.id || "").toLowerCase().trim();
    if (label) labels.add(label);
  }
  return labels;
}
function computePruneScores(projectDir) {
  const runsDir = path.join(projectDir, "runs");
  if (!fs.existsSync(runsDir)) return [];
  const runDirs = fs.readdirSync(runsDir, { withFileTypes: true }).filter(function(d) {
    return d.isDirectory();
  }).map(function(d) {
    return d.name;
  }).sort(function(a, b) {
    return b.localeCompare(a);
  });
  if (runDirs.length === 0) return [];
  const runs = [];
  for (var ri = 0; ri < runDirs.length; ri++) {
    var runId = runDirs[ri];
    var metaPath = path.join(runsDir, runId, "run-meta.json");
    try {
      runs.push(JSON.parse(fs.readFileSync(metaPath, "utf-8")));
    } catch (e) {
    }
  }
  var newestRunId = runDirs[0];
  var newestGraphPath = path.join(runsDir, newestRunId, "graph.json");
  var newestLabels = /* @__PURE__ */ new Set();
  if (fs.existsSync(newestGraphPath)) {
    try {
      newestLabels = getNodeLabels(JSON.parse(fs.readFileSync(newestGraphPath, "utf-8")));
    } catch (e) {
    }
  }
  var totalRuns = runs.length;
  for (var i = 0; i < runs.length; i++) {
    var run = runs[i];
    if (run.pruneScore?.pinned) {
      run.pruneScore.staleness = 0;
      run.pruneScore.redundancy = 0;
      run.pruneScore.lowSignal = 0;
      run.pruneScore.obsoletion = 0;
      run.totalPruneScore = 0;
      run.temperature = heatTracker.getTemperature(run.runId);
      continue;
    }
    var temp = heatTracker.getTemperature(run.runId);
    run.temperature = temp;
    var staleness = 0;
    if (temp === "warm") {
      staleness = 0.3;
    } else if (temp === "cold") {
      var entry = heatTracker.getEntry(run.runId);
      if (entry) {
        var ageMs = Date.now() - new Date(entry.lastAccessedAt).getTime();
        var ageDays = ageMs / (24 * 60 * 60 * 1e3);
        staleness = 0.7 + 0.3 * (1 - Math.exp(-Math.log(2) * ageDays / STALENESS_HALF_LIFE_DAYS));
        if (staleness > 1) staleness = 1;
      } else {
        staleness = 0.7;
      }
    }
    run.pruneScore.staleness = Math.round(staleness * 1e3) / 1e3;
    if (i === 0) {
      run.pruneScore.redundancy = 0;
    } else {
      var runGraphPath = path.join(runsDir, run.runId, "graph.json");
      var runLabels = /* @__PURE__ */ new Set();
      if (fs.existsSync(runGraphPath)) {
        try {
          runLabels = getNodeLabels(JSON.parse(fs.readFileSync(runGraphPath, "utf-8")));
        } catch (e) {
        }
      }
      if (newestLabels.size === 0 || runLabels.size === 0) {
        run.pruneScore.redundancy = 0;
      } else {
        var intersection = 0;
        runLabels.forEach(function(lbl) {
          if (newestLabels.has(lbl)) intersection++;
        });
        var union = newestLabels.size + runLabels.size - intersection;
        var jaccard = union > 0 ? intersection / union : 0;
        run.pruneScore.redundancy = Math.round(jaccard * 1e3) / 1e3;
      }
    }
    if (run.nodeCount < LOW_SIGNAL_THRESHOLD) {
      run.pruneScore.lowSignal = Math.round((1 - run.nodeCount / LOW_SIGNAL_THRESHOLD) * 1e3) / 1e3;
    } else {
      run.pruneScore.lowSignal = 0;
    }
    if (totalRuns > 1) {
      run.pruneScore.obsoletion = Math.round(i / (totalRuns - 1) * 1e3) / 1e3;
    } else {
      run.pruneScore.obsoletion = 0;
    }
    run.totalPruneScore = Math.round((0.35 * run.pruneScore.staleness + 0.25 * run.pruneScore.redundancy + 0.15 * run.pruneScore.lowSignal + 0.25 * run.pruneScore.obsoletion) * 1e3) / 1e3;
  }
  for (var wi = 0; wi < runs.length; wi++) {
    var wRun = runs[wi];
    var wPath = path.join(runsDir, wRun.runId, "run-meta.json");
    try {
      fs.writeFileSync(wPath, JSON.stringify(wRun, null, 2), "utf-8");
    } catch (e) {
    }
  }
  return runs;
}
function findRunMeta(runId) {
  if (!fs.existsSync(BRAIN_DIR)) return null;
  for (var pe of fs.readdirSync(BRAIN_DIR, { withFileTypes: true })) {
    if (!pe.isDirectory()) continue;
    if (pe.name.startsWith(".")) continue;
    if (pe.name === "obsidian-vault") continue;
    var metaPath = path.join(BRAIN_DIR, pe.name, "runs", runId, "run-meta.json");
    if (!fs.existsSync(metaPath)) continue;
    try {
      var meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      return { meta, metaPath, projectSlug: pe.name };
    } catch (e) {
      continue;
    }
  }
  return null;
}
async function handlePrune(ctx, pi, projectName) {
  var slug = slugify(projectName || path.basename(ctx.cwd));
  var projectDir = path.join(BRAIN_DIR, slug);
  if (!fs.existsSync(projectDir)) {
    ctx.ui.notify('Project "' + projectName + '" not found.', "error");
    return;
  }
  var runs = computePruneScores(projectDir);
  if (runs.length === 0) {
    ctx.ui.notify("No runs found for " + projectName + ".", "info");
    return;
  }
  runs.sort(function(a, b) {
    return b.totalPruneScore - a.totalPruneScore;
  });
  var table = "## Prune Candidates: " + projectName + "\n\n";
  table += "| Rank | Run ID | Total | Staleness | Redundancy | LowSignl | Obsolet. | Pinned | Temp |\n";
  table += "|---|---|---|---|---|---|---|---|---|\n";
  for (var i = 0; i < runs.length; i++) {
    var r = runs[i];
    var warn = r.totalPruneScore > PRUNE_THRESHOLD ? " \u26A0\uFE0F" : "";
    var pinned = r.pruneScore.pinned ? "\u{1F512}" : "";
    table += "| " + (i + 1) + " | `" + r.runId + "` | " + r.totalPruneScore.toFixed(3) + warn + " | " + r.pruneScore.staleness.toFixed(2) + " | " + r.pruneScore.redundancy.toFixed(2) + " | " + r.pruneScore.lowSignal.toFixed(2) + " | " + r.pruneScore.obsoletion.toFixed(2) + " | " + pinned + " | " + r.temperature + " |\n";
  }
  table += "\n> \u26A0\uFE0F = totalPruneScore > " + PRUNE_THRESHOLD + " (gc candidate)";
  table += "\n> \u{1F512} = pinned (immune)";
  await ctx.waitForIdle();
  pi.sendUserMessage(table);
}
async function handlePin(ctx, pi, runId) {
  if (!runId) {
    ctx.ui.notify("Usage: /memory pin <run-id>", "info");
    return;
  }
  var found = findRunMeta(runId);
  if (!found) {
    ctx.ui.notify("Run " + runId + " not found.", "error");
    return;
  }
  found.meta.pruneScore.pinned = true;
  found.meta.pruneScore.staleness = 0;
  found.meta.pruneScore.redundancy = 0;
  found.meta.pruneScore.lowSignal = 0;
  found.meta.pruneScore.obsoletion = 0;
  found.meta.totalPruneScore = 0;
  fs.writeFileSync(found.metaPath, JSON.stringify(found.meta, null, 2), "utf-8");
  ctx.ui.notify("Pinned " + runId + " \u2014 immune to pruning.", "success");
}
async function handleUnpin(ctx, pi, runId) {
  if (!runId) {
    ctx.ui.notify("Usage: /memory unpin <run-id>", "info");
    return;
  }
  var found = findRunMeta(runId);
  if (!found) {
    ctx.ui.notify("Run " + runId + " not found.", "error");
    return;
  }
  found.meta.pruneScore.pinned = false;
  fs.writeFileSync(found.metaPath, JSON.stringify(found.meta, null, 2), "utf-8");
  var projectDir = path.join(BRAIN_DIR, found.projectSlug);
  computePruneScores(projectDir);
  ctx.ui.notify("Unpinned " + runId + " \u2014 prune scores recomputed.", "success");
}
async function handleGc(ctx, pi) {
  if (!fs.existsSync(BRAIN_DIR)) {
    ctx.ui.notify("No brain directory found.", "info");
    return;
  }
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  var archivedCount = 0;
  var purgedCount = 0;
  for (var pe of fs.readdirSync(BRAIN_DIR, { withFileTypes: true })) {
    if (!pe.isDirectory()) continue;
    if (pe.name.startsWith(".")) continue;
    if (pe.name === "obsidian-vault") continue;
    var projectDir = path.join(BRAIN_DIR, pe.name);
    var runs = computePruneScores(projectDir);
    for (var ri = 0; ri < runs.length; ri++) {
      var run = runs[ri];
      if (run.totalPruneScore <= PRUNE_THRESHOLD) continue;
      if (run.pruneScore.pinned) continue;
      var archivePath = path.join(ARCHIVE_DIR, run.runId + ".json");
      var archiveData = {
        projectSlug: pe.name,
        archivedAt: (/* @__PURE__ */ new Date()).toISOString(),
        runMeta: run
      };
      fs.writeFileSync(archivePath, JSON.stringify(archiveData, null, 2), "utf-8");
      var runDir = path.join(projectDir, "runs", run.runId);
      if (fs.existsSync(runDir)) {
        fs.rmSync(runDir, { recursive: true });
      }
      archivedCount++;
    }
  }
  if (fs.existsSync(ARCHIVE_DIR)) {
    var nowMs = Date.now();
    var graceMs = ARCHIVE_GRACE_DAYS * 24 * 60 * 60 * 1e3;
    for (var af of fs.readdirSync(ARCHIVE_DIR)) {
      if (!af.endsWith(".json")) continue;
      var arcPath = path.join(ARCHIVE_DIR, af);
      try {
        var archive = JSON.parse(fs.readFileSync(arcPath, "utf-8"));
        var age = nowMs - new Date(archive.archivedAt).getTime();
        if (age > graceMs) {
          fs.unlinkSync(arcPath);
          purgedCount++;
        }
      } catch (e) {
      }
    }
  }
  ctx.ui.notify(
    "GC complete: " + archivedCount + " run(s) archived, " + purgedCount + " archive(s) purged.",
    "success"
  );
}
async function handleKeep(ctx, pi, runId) {
  if (!runId) {
    ctx.ui.notify("Usage: /memory keep <run-id>", "info");
    return;
  }
  var archivePath = path.join(ARCHIVE_DIR, runId + ".json");
  if (!fs.existsSync(archivePath)) {
    ctx.ui.notify("Archive for " + runId + " not found.", "error");
    return;
  }
  var archive;
  try {
    archive = JSON.parse(fs.readFileSync(archivePath, "utf-8"));
  } catch (e) {
    ctx.ui.notify("Failed to read archive for " + runId + ".", "error");
    return;
  }
  var runDir = path.join(BRAIN_DIR, archive.projectSlug, "runs", runId);
  fs.mkdirSync(runDir, { recursive: true });
  archive.runMeta.pruneScore.pinned = true;
  archive.runMeta.totalPruneScore = 0;
  archive.runMeta.pruneScore.staleness = 0;
  archive.runMeta.pruneScore.redundancy = 0;
  archive.runMeta.pruneScore.lowSignal = 0;
  archive.runMeta.pruneScore.obsoletion = 0;
  fs.writeFileSync(
    path.join(runDir, "run-meta.json"),
    JSON.stringify(archive.runMeta, null, 2),
    "utf-8"
  );
  fs.unlinkSync(archivePath);
  ctx.ui.notify(
    "Rescued " + runId + " from archive \u2192 " + archive.projectSlug + " (auto-pinned). Note: graph content is NOT restored \u2014 only metadata.",
    "success"
  );
}
async function handleStats(ctx, pi, projectName) {
  if (projectName) {
    var slug = slugify(projectName);
    var projectDir = path.join(BRAIN_DIR, slug);
    if (!fs.existsSync(projectDir)) {
      ctx.ui.notify('Project "' + projectName + '" not found.', "error");
      return;
    }
    var runs = computePruneScores(projectDir);
    var totalSize = dirSize(path.join(projectDir, "runs"));
    var tempStats = { hot: 0, warm: 0, cold: 0 };
    var histogram = [0, 0, 0, 0, 0];
    for (var ri = 0; ri < runs.length; ri++) {
      var r = runs[ri];
      if (r.temperature === "hot") tempStats.hot++;
      else if (r.temperature === "warm") tempStats.warm++;
      else tempStats.cold++;
      var s = r.totalPruneScore;
      if (s < 0.3) histogram[0]++;
      else if (s < 0.5) histogram[1]++;
      else if (s < 0.7) histogram[2]++;
      else if (s < 0.9) histogram[3]++;
      else histogram[4]++;
    }
    var out = "## Stats: " + projectName + "\n\n";
    out += "| Metric | Value |\n";
    out += "|---|---|\n";
    out += "| Run Count | " + runs.length + " |\n";
    out += "| Total Size | " + formatBytes(totalSize) + " |\n";
    out += "| Avg Prune Score | " + (runs.length > 0 ? (runs.reduce(function(sum, r2) {
      return sum + r2.totalPruneScore;
    }, 0) / runs.length).toFixed(3) : "N/A") + " |\n";
    out += "\n**Prune Score Histogram:**\n";
    out += "| Range | Count |\n";
    out += "|---|---|\n";
    out += "| 0.0\u20130.3 | " + histogram[0] + " |\n";
    out += "| 0.3\u20130.5 | " + histogram[1] + " |\n";
    out += "| 0.5\u20130.7 | " + histogram[2] + " |\n";
    out += "| 0.7\u20130.9 | " + histogram[3] + " |\n";
    out += "| 0.9\u20131.0 | " + histogram[4] + " |\n";
    out += "\n**Temperature Distribution:**\n";
    out += "| Temperature | Count |\n";
    out += "|---|---|\n";
    out += "| \u{1F525} Hot | " + tempStats.hot + " |\n";
    out += "| \u{1F324} Warm | " + tempStats.warm + " |\n";
    out += "| \u2744\uFE0F Cold | " + tempStats.cold + " |\n";
    await ctx.waitForIdle();
    pi.sendUserMessage(out);
  } else {
    var projects = [];
    for (var pe of fs.readdirSync(BRAIN_DIR, { withFileTypes: true })) {
      if (!pe.isDirectory()) continue;
      if (pe.name.startsWith(".")) continue;
      if (pe.name === "obsidian-vault") continue;
      var runsDir = path.join(BRAIN_DIR, pe.name, "runs");
      var runCount = 0;
      var size = 0;
      if (fs.existsSync(runsDir)) {
        var dirs = fs.readdirSync(runsDir, { withFileTypes: true }).filter(function(d) {
          return d.isDirectory();
        });
        runCount = dirs.length;
        size = dirSize(runsDir);
      }
      projects.push({ slug: pe.name, runs: runCount, size });
    }
    var out = "## Global Brain Stats\n\n";
    out += "| Project | Runs | Size |\n";
    out += "|---|---|---|\n";
    for (var pi2 = 0; pi2 < projects.length; pi2++) {
      var p = projects[pi2];
      out += "| " + p.slug + " | " + p.runs + " | " + formatBytes(p.size) + " |\n";
    }
    var totalRuns = projects.reduce(function(s2, p2) {
      return s2 + p2.runs;
    }, 0);
    var totalSize2 = projects.reduce(function(s2, p2) {
      return s2 + p2.size;
    }, 0);
    out += "\n> **" + projects.length + " project(s), " + totalRuns + " run(s), " + formatBytes(totalSize2) + " total**";
    await ctx.waitForIdle();
    pi.sendUserMessage(out);
  }
}
async function handleWikiSyncCurrent(ctx, pi) {
  const cwd = ctx.cwd;
  const obsidianSrc = path.join(cwd, "graphify-out", "obsidian");
  if (!fs.existsSync(obsidianSrc)) {
    return;
  }
  ensureVault();
  const projectName = path.basename(cwd);
  const slug = slugify(projectName);
  const count = copyObsidianToVault(obsidianSrc, slug, projectName);
  rebuildVaultIndex();
  ctx.ui.notify(
    `Synced "${projectName}" \u2192 obsidian-vault/${slug}/ (${count} files). Use /memory-wiki open to launch Obsidian.`,
    "success"
  );
}
async function handleWikiSyncAll(ctx) {
  ensureVault();
  let totalProjects = 0;
  let totalFiles = 0;
  for (const entry of fs.readdirSync(BRAIN_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "obsidian-vault") continue;
    const obsidianSrc = path.join(BRAIN_DIR, entry.name, "obsidian");
    if (!fs.existsSync(obsidianSrc)) continue;
    const metaPath = path.join(BRAIN_DIR, entry.name, "meta.json");
    let displayName = entry.name;
    try {
      displayName = JSON.parse(fs.readFileSync(metaPath, "utf-8")).displayName ?? entry.name;
    } catch {
    }
    totalFiles += copyObsidianToVault(obsidianSrc, entry.name, displayName);
    totalProjects++;
  }
  rebuildVaultIndex();
  if (totalProjects === 0) {
    ctx.ui.notify(
      "No obsidian outputs found in saved projects. Run /memory save on projects that have graphify-out/obsidian/.",
      "info"
    );
    return;
  }
  ctx.ui.notify(
    `Synced ${totalProjects} project(s) \u2192 obsidian-vault/ (${totalFiles} files). Use /memory-wiki open to launch Obsidian.`,
    "success"
  );
}
async function handleWikiOpen(ctx) {
  ensureVault();
  rebuildVaultIndex();
  const opened = openInObsidian();
  if (opened) {
    ctx.ui.notify(
      "Launched Obsidian \u2192 Graphify Brain vault",
      "success"
    );
  } else {
    ctx.ui.notify(
      `Obsidian vault at: ${WIKI_VAULT}
Open Obsidian \u2192 "Open folder as vault" and select this path.`,
      "info"
    );
  }
}
async function handleWikiNotes(ctx) {
  ensureVault();
  const notesInVault = NOTES_DIR.replace(/\//g, path.sep);
  try {
    const cmd = process.platform === "win32" ? `explorer "${notesInVault}"` : process.platform === "darwin" ? `open "${notesInVault}"` : `xdg-open "${notesInVault}"`;
    (0, import_node_child_process.execSync)(cmd, { stdio: "ignore", timeout: 5e3 });
  } catch {
  }
  ctx.ui.notify(
    `Notes folder: ${notesInVault}
Create or edit .md files here \u2014 they sync into the Obsidian vault automatically.`,
    "info"
  );
}
