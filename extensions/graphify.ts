import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { ExtensionCommandContext } from "@mariozechner/pi-coding-agent";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";
import { Text, Container, matchesKey, Key } from "@mariozechner/pi-tui";

// ──────────────────────────────────────────────
//  Constants
// ──────────────────────────────────────────────
const BRAIN_DIR = path.join(os.homedir(), ".pi", "graphify-brain");
const INDEX_PATH = path.join(BRAIN_DIR, "index.md");
const WIKI_VAULT = path.join(BRAIN_DIR, "obsidian-vault");
const NOTES_DIR = path.join(WIKI_VAULT, "_notes");
const ARCHIVE_DIR = path.join(BRAIN_DIR, ".archive");
const LOW_SIGNAL_THRESHOLD = 10;
const PRUNE_THRESHOLD = 0.7;
const ARCHIVE_GRACE_DAYS = 30;
const STALENESS_HALF_LIFE_DAYS = 23;

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────
function ensureBrainDir(): string {
  fs.mkdirSync(BRAIN_DIR, { recursive: true });
  return BRAIN_DIR;
}

function ensureVault(): void {
  fs.mkdirSync(WIKI_VAULT, { recursive: true });
  fs.mkdirSync(NOTES_DIR, { recursive: true });
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function splitArgs(input: string): string[] {
  return input.trim() ? input.trim().split(/\s+/) : [];
}

function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

function getFlagValue(args: string[], flag: string): string | null {
  const idx = args.indexOf(flag);
  if (idx < 0 || idx + 1 >= args.length) return null;
  const value = args[idx + 1];
  return value && !value.startsWith("--") ? value : null;
}

function positionalArgs(args: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      if (i + 1 < args.length && !args[i + 1].startsWith("--")) i++;
      continue;
    }
    out.push(args[i]);
  }
  return out;
}

function projectDirForSlug(projectSlug: string): string {
  return path.join(BRAIN_DIR, projectSlug);
}

function runDirFor(projectSlug: string, runId: string): string {
  return path.join(projectDirForSlug(projectSlug), "runs", runId);
}

function archiveRunDirFor(projectSlug: string, runId: string): string {
  return path.join(ARCHIVE_DIR, projectSlug, runId);
}

// ── Data interfaces ──
interface RunMeta {
  runId: string;
  projectSlug: string;
  savedAt: string;
  nodeCount: number;
  edgeCount: number;
  artifactCount: number;
  pruneScore: {
    staleness: number;
    redundancy: number;
    lowSignal: number;
    obsoletion: number;
    pinned: boolean;
  };
  totalPruneScore: number;
  temperature: string;
  lastAccessedAt: string;
  accessCount: number;
  compressionState: string;
  archived: boolean;
  archivedAt?: string;
  archivedReason?: string;
  archivePath?: string;
  deleteAfter?: string;
  verifiedStatus: string;
  sourceType: string;
  agentRole: string;
  safeToInject: boolean;
  contextPriority: number;
  failureSignatures: string[];
  invariants: string[];
  openQuestions: string[];
  verification?: Record<string, unknown>;
  [key: string]: unknown;
}

interface BrainMeta {
  schemaVersion: number;
  archetypes: Array<Record<string, unknown>>;
  heatTracker: {
    lastUpdateAt: string;
    entries: Record<string, {
      accessCount: number;
      lastAccessedAt: string;
      temperature: string;
    }>;
  };
  [key: string]: unknown;
}

// ── HeatTracker — persists access tracking to brain-meta.json ──
class HeatTracker {
  private persistPath: string;
  private data: BrainMeta;

  constructor() {
    ensureBrainDir();
    this.persistPath = path.join(BRAIN_DIR, "brain-meta.json");
    this.data = this.load();
  }

  private load(): BrainMeta {
    try {
      if (fs.existsSync(this.persistPath)) {
        const raw = JSON.parse(fs.readFileSync(this.persistPath, "utf-8"));
        return {
          ...raw,
          schemaVersion: raw.schemaVersion ?? 2,
          archetypes: Array.isArray(raw.archetypes) ? raw.archetypes : [],
          heatTracker: {
            ...(raw.heatTracker ?? {}),
            lastUpdateAt: raw.heatTracker?.lastUpdateAt ?? new Date().toISOString(),
            entries: raw.heatTracker?.entries ?? {},
          },
        };
      }
    } catch { /* fall through to default */ }
    return {
      schemaVersion: 2,
      archetypes: [],
      heatTracker: {
        lastUpdateAt: new Date().toISOString(),
        entries: {},
      },
    };
  }

  private save(): void {
    this.data.heatTracker.lastUpdateAt = new Date().toISOString();
    fs.writeFileSync(this.persistPath, JSON.stringify(this.data, null, 2), "utf-8");
  }

  private key(projectSlug: string, runId: string): string {
    return projectSlug + "/" + runId;
  }

  private getOrMigrateEntry(projectSlug: string, runId: string): { accessCount: number; lastAccessedAt: string; temperature: string } | null {
    const key = this.key(projectSlug, runId);
    const direct = this.data.heatTracker.entries[key];
    if (direct) return direct;

    const legacy = this.data.heatTracker.entries[runId];
    if (legacy) {
      this.data.heatTracker.entries[key] = { ...legacy };
      return this.data.heatTracker.entries[key];
    }
    return null;
  }

  seedHot(projectSlug: string, runId: string): void {
    this.data.heatTracker.entries[this.key(projectSlug, runId)] = {
      accessCount: 0,
      lastAccessedAt: new Date().toISOString(),
      temperature: "hot",
    };
    this.save();
  }

  recordAccess(projectSlug: string, runId: string): void {
    const entry = this.getOrMigrateEntry(projectSlug, runId);
    if (entry) {
      entry.accessCount++;
      entry.lastAccessedAt = new Date().toISOString();
      entry.temperature = "hot";
    } else {
      this.data.heatTracker.entries[this.key(projectSlug, runId)] = {
        accessCount: 1,
        lastAccessedAt: new Date().toISOString(),
        temperature: "hot",
      };
    }
    this.save();
  }

  decayTemperatures(): void {
    const now = Date.now();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const SEVEN_DAYS = 7 * ONE_DAY;
    let changed = false;

    for (const entry of Object.values(this.data.heatTracker.entries)) {
      const age = now - new Date(entry.lastAccessedAt).getTime();
      let newTemp: string;
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

  getTemperature(projectSlug: string, runId: string): string {
    return this.getOrMigrateEntry(projectSlug, runId)?.temperature ?? "cold";
  }

  getEntry(projectSlug: string, runId: string): { accessCount: number; lastAccessedAt: string; temperature: string } | null {
    return this.getOrMigrateEntry(projectSlug, runId);
  }

  getStats(): { hot: number; warm: number; cold: number } {
    const counts = { hot: 0, warm: 0, cold: 0 };
    for (const entry of Object.values(this.data.heatTracker.entries)) {
      if (entry.temperature === "hot") counts.hot++;
      else if (entry.temperature === "warm") counts.warm++;
      else counts.cold++;
    }
    return counts;
  }
}

const heatTracker = new HeatTracker();

function extractSections(text: string, headings: string[]): string {
  const lines = text.split("\n");
  const result: string[] = [];
  let collecting: string | null = null;

  for (const line of lines) {
    const hMatch = line.match(/^##\s+(.+)$/);
    if (hMatch) {
      collecting = headings.includes(hMatch[1].trim())
        ? hMatch[1].trim()
        : null;
    }
    if (collecting !== null) result.push(line);
  }

  return result.join("\n");
}

function rebuildBrainIndex(): void {
  ensureBrainDir();
  const entries: string[] = [];

  for (const entry of fs.readdirSync(BRAIN_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "obsidian-vault") continue; // skip vault dir
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
        "",
      );
    } catch {
      // skip
    }
  }

  const content = [
    "# Global Graphify Brain",
    "",
    `> Path: \`${BRAIN_DIR}\``,
    "",
    entries.length > 0
      ? `${entries.length / 5} project graph(s) saved.`
      : "No project graphs saved yet. Run `/memory save` after a `/graphify` run.",
    "",
    ...entries,
  ].join("\n");

  fs.writeFileSync(INDEX_PATH, content, "utf-8");
}

function brainContextForCwd(cwd: string): string | null {
  if (!fs.existsSync(INDEX_PATH)) return null;

  const parts: string[] = [fs.readFileSync(INDEX_PATH, "utf-8")];

  for (const entry of fs.readdirSync(BRAIN_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === "obsidian-vault") continue;
    const metaPath = path.join(BRAIN_DIR, entry.name, "meta.json");
    if (!fs.existsSync(metaPath)) continue;

    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      if (!meta.projectPath) continue;

      const match =
        path.resolve(meta.projectPath) === path.resolve(cwd) ||
        path.resolve(cwd).startsWith(path.resolve(meta.projectPath) + path.sep) ||
        path.resolve(meta.projectPath).startsWith(path.resolve(cwd) + path.sep);

      if (!match) continue;

      const reportPath = path.join(BRAIN_DIR, entry.name, "GRAPH_REPORT.md");
      if (fs.existsSync(reportPath)) {
        const report = fs.readFileSync(reportPath, "utf-8");
        const sections = extractSections(report, [
          "God Nodes",
          "Surprising Connections",
          "Suggested Questions",
        ]);
        parts.push(
          `\n## Active Project Graph: ${meta.displayName ?? entry.name}`,
          `(Saved ${meta.savedAt})`,
          `\n${sections}`,
        );
      }

      const wikiIndex = path.join(BRAIN_DIR, entry.name, "wiki", "index.md");
      if (fs.existsSync(wikiIndex)) {
        const wiki = fs.readFileSync(wikiIndex, "utf-8");
        parts.push(
          `\n## Graph Wiki (${meta.displayName ?? entry.name})`,
          wiki.slice(0, 4000),
        );
      }

      break;
    } catch {
      // skip
    }
  }

  return parts.join("\n");
}

/**
 * Copy graphify obsidian output into the central wiki vault.
 */
function copyObsidianToVault(
  obsidianSrc: string,
  projectSlug: string,
  displayName: string,
): number {
  const destDir = path.join(WIKI_VAULT, projectSlug);
  let copied = 0;

  // Remove old version if exists
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
  fs.mkdirSync(destDir, { recursive: true });

  // Copy all obsidian notes
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

  // Add a project index note
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
    "",
  ].join("\n");
  fs.writeFileSync(indexPath, indexContent, "utf-8");
  copied++;

  return copied;
}

/**
 * Rebuild the vault master index and global canvas.
 */
function rebuildVaultIndex(): void {
  ensureVault();
  const projects: Array<{ slug: string; name: string }> = [];

  for (const entry of fs.readdirSync(WIKI_VAULT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("_")) continue; // skip _notes, etc.

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

  // Write _INDEX.md
  const indexLines = [
    "# Graphify Wiki Vault",
    "",
    `> **${projects.length} project(s)** indexed`,
    "",
    "---",
    "",
    "## Projects",
    "",
  ];
  for (const p of projects) {
    indexLines.push(`- [[${p.slug}/_PROJECT|${p.name}]]`);
  }
  indexLines.push(
    "",
    "## Notes",
    "",
    "Free-form notes live in `_notes/` — Obsidian automatically links them.",
    "",
    `- [[_notes/_INBOX|📥 Inbox]]`,
  );

  fs.writeFileSync(
    path.join(WIKI_VAULT, "_INDEX.md"),
    indexLines.join("\n"),
    "utf-8",
  );

  // Ensure _notes/_INBOX.md exists
  const inboxPath = path.join(NOTES_DIR, "_INBOX.md");
  if (!fs.existsSync(inboxPath)) {
    fs.writeFileSync(
      inboxPath,
      ["# 📥 Inbox", "", "Quick-capture notes.", "", "---", ""].join("\n"),
      "utf-8",
    );
  }

  // Build global canvas
  const canvasNodes: string[] = [];
  const canvasEdges: string[] = [];
  const cols = Math.ceil(Math.sqrt(projects.length));
  let idx = 0;

  for (const p of projects) {
    const x = (idx % cols) * 500;
    const y = Math.floor(idx / cols) * 300;
    canvasNodes.push(
      JSON.stringify({
        id: `proj-${p.slug}`,
        type: "text",
        x,
        y,
        width: 300,
        height: 120,
        file: `${p.slug}/_PROJECT.md`,
      }),
    );
    // Connect to master
    canvasEdges.push(
      JSON.stringify({
        id: `edge-master-${p.slug}`,
        fromNode: "master",
        toNode: `proj-${p.slug}`,
      }),
    );
    idx++;
  }

  // Quick notes node
  canvasNodes.push(
    JSON.stringify({
      id: "notes",
      type: "text",
      x: 0,
      y: idx * 300 + 200,
      width: 300,
      height: 80,
      file: "_notes/_INBOX.md",
    }),
  );

  // Master node
  canvasNodes.unshift(
    JSON.stringify({
      id: "master",
      type: "text",
      x: (cols * 500) / 2 - 150,
      y: -200,
      width: 300,
      height: 100,
      file: "_INDEX.md",
    }),
  );

  const canvas = [
    "{",
    '  "nodes": [',
    "    " + canvasNodes.join(",\n    "),
    "  ],",
    '  "edges": [',
    "    " + canvasEdges.join(",\n    "),
    "  ]",
    "}",
  ].join("\n");

  fs.writeFileSync(
    path.join(WIKI_VAULT, "_BRAIN_CANVAS.canvas"),
    canvas,
    "utf-8",
  );
}

/**
 * Try to open the vault in Obsidian via URI scheme.
 */
function openInObsidian(): boolean {
  try {
    const vaultPath = WIKI_VAULT.replace(/\\/g, "/");
    const vaultName = encodeURIComponent(path.basename(WIKI_VAULT));
    const uri = `obsidian://open?vault=${vaultName}&file=_INDEX`;
    const cmd =
      process.platform === "win32"
        ? `start "" "${uri}"`
        : process.platform === "darwin"
          ? `open "${uri}"`
          : `xdg-open "${uri}"`;
    execSync(cmd, { stdio: "ignore", timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

// ──────────────────────────────────────────────
//  Extension
// ──────────────────────────────────────────────
export default function (pi: ExtensionAPI) {
  // ── /graphify ────────────────────────────────────────────────
  pi.registerCommand("graphify", {
    description:
      "Build a knowledge graph of any folder — code, docs, papers, images. Outputs HTML graph, Obsidian vault, and GRAPH_REPORT.md.",
    handler: async (args, ctx) => {
      const skillArgs = args ? ` ${args.trim()}` : "";
      await ctx.waitForIdle();
      pi.sendUserMessage(`/skill:graphify${skillArgs}`);
    },
  });

  // ── /memory ─────────────────────────────────────────────────
  pi.registerCommand("memory", {
    description:
      "Global graphify brain. /memory save | list | load <project> [--run <id>] | runs <project> | prune [project] [--dry-run] | pin/unpin <project> [--run <id>] | gc [project] [--dry-run] [--apply] | keep <project> --run <id> | stats [p]",
    handler: async (args, ctx) => {
      const parts = args?.trim().split(/\s+/) ?? [];
      const sub = parts[0]?.toLowerCase();
      const rest = parts.slice(1).join(" ");

      switch (sub) {
        case "save":
          await handleSave(ctx, pi);
          // Auto-sync to wiki vault only if obsidian output exists
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
          await handleGc(ctx, pi, rest);
          break;
        case "keep":
          await handleKeep(ctx, pi, rest);
          break;
        case "stats":
          await handleStats(ctx, pi, rest || undefined);
          break;
        default:
          ctx.ui.notify(
            "Usage: /memory save | list | load <project> [--run <id>] | runs <project> | prune [project] [--dry-run] | pin/unpin <project> [--run <id>] | gc [project] [--dry-run] [--apply] | keep <project> --run <id> | stats [p]",
            "info",
          );
      }
    },
  });

  // ── /memory-wiki ────────────────────────────────────────────
  pi.registerCommand("memory-wiki", {
    description:
      "Obsidian wiki vault from graphify graphs. /memory-wiki | sync | open | notes",
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
    },
  });

  // ── Ensure brain index on every startup ─────────────────────
  pi.on("session_start", async () => {
    ensureBrainDir();
    rebuildBrainIndex();
    try { heatTracker.decayTemperatures(); } catch { /* non-critical */ }
  });

  // ── Inject brain context on every agent turn ────────────────
  pi.on("before_agent_start", async (event) => {
    const cwd = event.systemPromptOptions?.cwd ?? process.cwd();
    const brainCtx = brainContextForCwd(cwd);
    if (!brainCtx) return;

    return {
      systemPrompt:
        event.systemPrompt +
        "\n\n## Global Graphify Brain\n" +
        "The following knowledge-graph artifacts are available for this project. " +
        "Prefer them for architecture and dependency questions before broad file reading.\n\n" +
        brainCtx,
    };
  });
}

// ── Filesystem helpers ──
function dirSize(dir: string): number {
  let total = 0;
  if (!fs.existsSync(dir)) return 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += dirSize(full);
    } else {
      try { total += fs.statSync(full).size; } catch { /* skip */ }
    }
  }
  return total;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function countRunArtifacts(runDir: string): number {
  let count = 0;
  if (fs.existsSync(path.join(runDir, "GRAPH_REPORT.md"))) count++;
  if (fs.existsSync(path.join(runDir, "graph.json"))) count++;
  if (fs.existsSync(path.join(runDir, "wiki"))) count++;
  if (fs.existsSync(path.join(runDir, "obsidian"))) count++;
  return count;
}

function normalizeStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function normalizeRunMeta(
  projectSlug: string,
  runId: string,
  raw: Record<string, unknown> | null | undefined,
  runDir: string,
  now: Date,
): RunMeta {
  const data = raw ?? {};
  const graphPath = path.join(runDir, "graph.json");
  let nodeCount = typeof data.nodeCount === "number" ? data.nodeCount : 0;
  let edgeCount = typeof data.edgeCount === "number" ? data.edgeCount : 0;

  if ((nodeCount === 0 || edgeCount === 0) && fs.existsSync(graphPath)) {
    try {
      const graph = JSON.parse(fs.readFileSync(graphPath, "utf-8"));
      nodeCount = typeof graph.nodes?.length === "number" ? graph.nodes.length : nodeCount;
      edgeCount = typeof graph.links?.length === "number" ? graph.links.length : (typeof graph.edges?.length === "number" ? graph.edges.length : edgeCount);
    } catch { /* keep existing counts */ }
  }

  const existingScore = (data.pruneScore ?? {}) as Record<string, unknown>;
  const savedAt = String(data.savedAt ?? now.toISOString());
  const lastAccessedAt = String(data.lastAccessedAt ?? savedAt);

  return {
    ...data,
    runId,
    projectSlug: String(data.projectSlug ?? projectSlug),
    savedAt,
    nodeCount,
    edgeCount,
    artifactCount: typeof data.artifactCount === "number" ? data.artifactCount : countRunArtifacts(runDir),
    pruneScore: {
      staleness: typeof existingScore.staleness === "number" ? existingScore.staleness : 0,
      redundancy: typeof existingScore.redundancy === "number" ? existingScore.redundancy : 0,
      lowSignal: typeof existingScore.lowSignal === "number" ? existingScore.lowSignal : 0,
      obsoletion: typeof existingScore.obsoletion === "number" ? existingScore.obsoletion : 0,
      pinned: Boolean(existingScore.pinned),
    },
    totalPruneScore: typeof data.totalPruneScore === "number" ? data.totalPruneScore : 0,
    temperature: String(data.temperature ?? "cold"),
    lastAccessedAt,
    accessCount: typeof data.accessCount === "number" ? data.accessCount : 0,
    compressionState: String(data.compressionState ?? "raw"),
    archived: Boolean(data.archived),
    archivedAt: typeof data.archivedAt === "string" ? data.archivedAt : undefined,
    archivedReason: typeof data.archivedReason === "string" ? data.archivedReason : undefined,
    archivePath: typeof data.archivePath === "string" ? data.archivePath : undefined,
    deleteAfter: typeof data.deleteAfter === "string" ? data.deleteAfter : undefined,
    verifiedStatus: String(data.verifiedStatus ?? "unknown"),
    sourceType: String(data.sourceType ?? "graphify"),
    agentRole: String(data.agentRole ?? "unknown"),
    safeToInject: typeof data.safeToInject === "boolean" ? data.safeToInject : true,
    contextPriority: typeof data.contextPriority === "number" ? data.contextPriority : 0,
    failureSignatures: normalizeStringArray(data.failureSignatures),
    invariants: normalizeStringArray(data.invariants),
    openQuestions: normalizeStringArray(data.openQuestions),
    verification: typeof data.verification === "object" && data.verification !== null ? data.verification as Record<string, unknown> : undefined,
  };
}

function loadRunMeta(projectSlug: string, runId: string, runDir?: string, now: Date = new Date()): RunMeta | null {
  const dir = runDir ?? runDirFor(projectSlug, runId);
  const metaPath = path.join(dir, "run-meta.json");
  let raw: Record<string, unknown> = {};
  if (fs.existsSync(metaPath)) {
    try {
      raw = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    } catch {
      return null;
    }
  }
  return normalizeRunMeta(projectSlug, runId, raw, dir, now);
}

function writeRunMeta(projectSlug: string, runId: string, meta: RunMeta, runDir?: string): void {
  const dir = runDir ?? runDirFor(projectSlug, runId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "run-meta.json"), JSON.stringify(meta, null, 2), "utf-8");
}

function recordRunAccess(projectSlug: string, runId: string): void {
  heatTracker.recordAccess(projectSlug, runId);
  const runDir = runDirFor(projectSlug, runId);
  if (!fs.existsSync(runDir)) return;
  const meta = loadRunMeta(projectSlug, runId, runDir);
  if (!meta || meta.archived) return;
  const entry = heatTracker.getEntry(projectSlug, runId);
  if (entry) {
    meta.lastAccessedAt = entry.lastAccessedAt;
    meta.accessCount = entry.accessCount;
    meta.temperature = entry.temperature;
  } else {
    meta.lastAccessedAt = new Date().toISOString();
    meta.accessCount = (meta.accessCount ?? 0) + 1;
    meta.temperature = "hot";
  }
  writeRunMeta(projectSlug, runId, meta, runDir);
}

function addDaysIso(base: Date, days: number): string {
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

// ──────────────────────────────────────────────
//  /memory handlers
// ──────────────────────────────────────────────

async function handleSave(
  ctx: ExtensionCommandContext,
  pi: ExtensionAPI,
): Promise<void> {
  const cwd = ctx.cwd;
  const graphifyOut = path.join(cwd, "graphify-out");
  const reportPath = path.join(graphifyOut, "GRAPH_REPORT.md");
  const graphPath = path.join(graphifyOut, "graph.json");
  const wikiPath = path.join(graphifyOut, "wiki");
  const obsidianPath = path.join(graphifyOut, "obsidian");

  if (!fs.existsSync(reportPath) && !fs.existsSync(graphPath)) {
    ctx.ui.notify(
      "No graphify-out/ found in current directory. Run /graphify first.",
      "error",
    );
    return;
  }

  const projectName = path.basename(cwd);
  const slug = slugify(projectName);
  const destDir = path.join(BRAIN_DIR, slug);
  ensureBrainDir();
  fs.mkdirSync(destDir, { recursive: true });

  // Phase 1: Create timestamped run directory
  const now = new Date();
  const runId = now.toISOString().replace(/:/g, '-').replace(/\.\d{3}Z$/, 'Z');
  const runDir = path.join(destDir, "runs", runId);
  fs.mkdirSync(runDir, { recursive: true });

  // Copy artifacts into run directory
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

  // Copy artifacts to project root for LATEST (backward compat)
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
      recursive: true,
    });
    copied++;
  }

  // Node / edge counts
  let nodeCount = "?";
  let edgeCount = "?";
  if (fs.existsSync(graphPath)) {
    try {
      const graph = JSON.parse(fs.readFileSync(graphPath, "utf-8"));
      nodeCount = String(graph.nodes?.length ?? "?");
      edgeCount = String(graph.links?.length ?? graph.edges?.length ?? "?");
    } catch { /* ignore */ }
  }

  // Write hardened run-meta.json and seed HeatTracker as hot.
  const nCount = parseInt(String(nodeCount)) || 0;
  const eCount = parseInt(String(edgeCount)) || 0;
  const runMeta = normalizeRunMeta(slug, runId, {
    runId,
    projectSlug: slug,
    savedAt: now.toISOString(),
    nodeCount: nCount,
    edgeCount: eCount,
    artifactCount,
    pruneScore: {
      staleness: 0,
      redundancy: 0,
      lowSignal: 0,
      obsoletion: 0,
      pinned: false,
    },
    totalPruneScore: 0,
    temperature: "hot",
    lastAccessedAt: now.toISOString(),
    accessCount: 0,
    compressionState: "raw",
    verifiedStatus: "unknown",
    sourceType: "graphify",
    agentRole: "unknown",
    safeToInject: true,
    contextPriority: 0,
    failureSignatures: [],
    invariants: [],
    openQuestions: [],
  }, runDir, now);
  runMeta.temperature = "hot";
  runMeta.accessCount = 0;
  writeRunMeta(slug, runId, runMeta, runDir);
  heatTracker.seedHot(slug, runId);

  // Extend/update project meta.json (preserving backward compat fields)
  const existingMetaPath = path.join(destDir, "meta.json");
  let existingRunCount = 0;
  if (fs.existsSync(existingMetaPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(existingMetaPath, "utf-8"));
      existingRunCount = existing.runCount ?? 0;
    } catch { /* ignore -- will be first run */ }
  }

  const meta = {
    displayName: projectName,
    projectPath: path.resolve(cwd),
    savedAt: now.toISOString(),
    nodeCount,
    edgeCount,
    schemaVersion: 2,
    runCount: existingRunCount + 1,
    lastRunId: runId,
  };
  fs.writeFileSync(
    path.join(destDir, "meta.json"),
    JSON.stringify(meta, null, 2),
    "utf-8",
  );

  rebuildBrainIndex();
  ctx.ui.notify(
    `Saved "${projectName}" → ${slug}/ (${nodeCount} nodes, ${edgeCount} edges, ${copied} artifacts)`,
    "success",
  );
}

async function handleList(
  ctx: ExtensionCommandContext,
  _pi: ExtensionAPI,
): Promise<void> {
  if (!fs.existsSync(INDEX_PATH)) {
    ctx.ui.notify(
      "No project graphs saved yet. Run /memory save first.",
      "info",
    );
    return;
  }

  // Parse index.md to extract project entries
  const raw = fs.readFileSync(INDEX_PATH, "utf-8");
  const projects: Array<{
    name: string;
    path: string;
    savedAt: string;
    nodes: string;
    edges: string;
  }> = [];

  const lines = raw.split("\n");
  let current: (typeof projects)[number] | null = null;
  for (const line of lines) {
    const h2 = line.match(/^## (.+)/);
    if (h2) {
      if (current) projects.push(current);
      current = { name: h2[1], path: "", savedAt: "", nodes: "?", edges: "?" };
      continue;
    }
    if (!current) continue;
    const pp = line.match(/\*\*Project path\*\*: `(.+?)`/);
    if (pp) { current.path = pp[1]; continue; }
    const sa = line.match(/\*\*Saved\*\*: (.+)/);
    if (sa) { current.savedAt = sa[1]; continue; }
    const nc = line.match(/\*\*Nodes\*\*: (\d+)/);
    if (nc) { current.nodes = nc[1]; continue; }
    const ec = line.match(/\*\*Edges\*\*: (\d+)/);
    if (ec) { current.edges = ec[1]; continue; }
  }
  if (current) projects.push(current);

  if (projects.length === 0) {
    ctx.ui.notify("No projects found in index.", "info");
    return;
  }

  // Show projects in an overlay (no LLM involvement)
  await ctx.waitForIdle?.();
  await ctx.ui.custom<void>((tui, theme, _keybindings, done) => {
    const container = new Container();

    // Title
    const title = new Text(
      theme.bold(theme.fg("accent", "  Graphify Brain — Saved Projects")),
      1,
      0,
    );
    container.addChild(title);

    // Divider
    const divider = new Text(
      theme.fg("dim", "  " + "─".repeat(Math.min(tui.cols - 4, 70))),
      1,
      0,
    );
    container.addChild(divider);

    // Project entries
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      const dateStr = p.savedAt
        ? new Date(p.savedAt).toLocaleString()
        : "unknown";

      const header = theme.fg(
        "accent",
        `  ${theme.bold(p.name)}`,
      );
      const meta = theme.fg(
        "muted",
        `     ${p.nodes} nodes  ·  ${p.edges} edges  ·  saved ${dateStr}`,
      );
      const ppath = theme.fg("dim", `     ${p.path}`);

      const entry = new Text([header, meta, ppath].join("\n"), 1, 0);
      container.addChild(entry);

      if (i < projects.length - 1) {
        container.addChild(new Text("", 1, 0)); // spacer
      }
    }

    // Footer hint
    const footer = new Text(
      theme.fg("dim", "\n  Press Enter or Escape to dismiss"),
      1,
      0,
    );
    container.addChild(footer);

    return {
      render: (w: number) => container.render(w),
      invalidate: () => container.invalidate(),
      handleInput: (data: string) => {
        if (matchesKey(data, Key.enter) || matchesKey(data, Key.escape)) {
          done();
        }
      },
    };
  }, { overlay: true });
}

async function handleLoad(
  ctx: ExtensionCommandContext,
  pi: ExtensionAPI,
  projectName: string,
): Promise<void> {
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
      "error",
    );
    return;
  }

  const parts: string[] = [`## Loaded graph: ${projectName}\n`];

  const reportPath = path.join(projDir, "GRAPH_REPORT.md");
  if (fs.existsSync(reportPath)) {
    parts.push(fs.readFileSync(reportPath, "utf-8"));
  }

  const wikiIndex = path.join(projDir, "wiki", "index.md");
  if (fs.existsSync(wikiIndex)) {
    parts.push(
      "\n## Wiki Index\n" +
        fs.readFileSync(wikiIndex, "utf-8").slice(0, 8000),
    );
  }

  // Record access for last run in both brain-meta.json and durable run-meta.json.
  try {
    var loadMeta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    if (loadMeta.lastRunId) recordRunAccess(slug, loadMeta.lastRunId);
  } catch (e) { /* skip */ }

  await ctx.waitForIdle();
  pi.sendUserMessage(parts.join("\n"));
}

/**
 * Load a specific historical run (Phase 1).
 */
async function handleLoadRun(
  ctx: ExtensionCommandContext,
  pi: ExtensionAPI,
  projectName: string,
  runId: string,
): Promise<void> {
  if (!projectName || !runId) {
    ctx.ui.notify("Usage: /memory load <project> --run <run-id>", "info");
    return;
  }

  const slug = slugify(projectName);
  const runDir = path.join(BRAIN_DIR, slug, "runs", runId);

  if (!fs.existsSync(runDir)) {
    ctx.ui.notify(
      "Run " + runId + " not found. Use /memory runs " + projectName + " first.",
      "error",
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
    parts.push("\n## Wiki Index\n" +
      fs.readFileSync(wikiIndex, "utf-8").slice(0, 8000));
  }

  try { recordRunAccess(slug, runId); } catch (e) { /* skip */ }

  await ctx.waitForIdle();
  pi.sendUserMessage(parts.join("\n"));
}

/**
 * List all runs for a project (Phase 1).
 */
async function handleRuns(
  ctx: ExtensionCommandContext,
  pi: ExtensionAPI,
  projectName: string,
): Promise<void> {
  const slug = slugify(projectName || path.basename(ctx.cwd));
  const runsDir = path.join(BRAIN_DIR, slug, "runs");

  if (!fs.existsSync(runsDir)) {
    ctx.ui.notify("No runs yet. Run /memory save first.", "info");
    return;
  }

  const runEntries = fs.readdirSync(runsDir, { withFileTypes: true })
    .filter(function(d) { return d.isDirectory(); })
    .sort(function(a, b) { return b.name.localeCompare(a.name); });

  if (runEntries.length === 0) {
    ctx.ui.notify("No runs found.", "info");
    return;
  }

  var lines = [
    "## Runs for " + projectName,
    "",
    "| Run ID | Nodes | Edges |",
    "|---|---|---|",
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
    } catch (e) { /* skip */ }

    lines.push("| " + entry.name + " | " + nodeCount + " | " + edgeCount + " |");
  }

  await ctx.waitForIdle();
  pi.sendUserMessage(lines.join("\n"));
}

// ── Prune scoring (Phase 2-3) ──
function getNodeLabels(graph: Record<string, unknown>): Set<string> {
  const labels = new Set<string>();
  const nodes = (graph.nodes as Array<Record<string, unknown>>) ?? [];
  for (const n of nodes) {
    const label = String(n.label || n.name || n.id || "").toLowerCase().trim();
    if (label) labels.add(label);
  }
  return labels;
}

function computePruneScores(projectDir: string, options?: { persist?: boolean }): RunMeta[] {
  const persist = options?.persist === true;
  const projectSlug = path.basename(projectDir);
  const runsDir = path.join(projectDir, "runs");
  if (!fs.existsSync(runsDir)) return [];

  const runDirs = fs.readdirSync(runsDir, { withFileTypes: true })
    .filter(function(d) { return d.isDirectory(); })
    .map(function(d) { return d.name; })
    .sort(function(a, b) { return b.localeCompare(a); });
  if (runDirs.length === 0) return [];

  const runs: RunMeta[] = [];
  for (const runId of runDirs) {
    const runDir = path.join(runsDir, runId);
    const loaded = loadRunMeta(projectSlug, runId, runDir);
    if (loaded && !loaded.archived) runs.push(loaded);
  }
  if (runs.length === 0) return [];

  const newestRunId = runs[0].runId;
  const newestGraphPath = path.join(runsDir, newestRunId, "graph.json");
  let newestLabels = new Set<string>();
  if (fs.existsSync(newestGraphPath)) {
    try { newestLabels = getNodeLabels(JSON.parse(fs.readFileSync(newestGraphPath, "utf-8"))); } catch { /* skip */ }
  }

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    if (run.pruneScore.pinned) {
      run.pruneScore.staleness = 0;
      run.pruneScore.redundancy = 0;
      run.pruneScore.lowSignal = 0;
      run.pruneScore.obsoletion = 0;
      run.totalPruneScore = 0;
      run.temperature = heatTracker.getTemperature(projectSlug, run.runId);
      continue;
    }

    const temp = heatTracker.getTemperature(projectSlug, run.runId);
    run.temperature = temp;
    let staleness = 0;
    if (temp === "warm") staleness = 0.3;
    else if (temp === "cold") {
      const entry = heatTracker.getEntry(projectSlug, run.runId);
      if (entry) {
        const ageDays = (Date.now() - new Date(entry.lastAccessedAt).getTime()) / (24 * 60 * 60 * 1000);
        staleness = 0.7 + 0.3 * (1 - Math.exp(-Math.log(2) * ageDays / STALENESS_HALF_LIFE_DAYS));
        if (staleness > 1.0) staleness = 1.0;
      } else staleness = 0.7;
    }
    run.pruneScore.staleness = Math.round(staleness * 1000) / 1000;

    if (i === 0) run.pruneScore.redundancy = 0;
    else {
      const runGraphPath = path.join(runsDir, run.runId, "graph.json");
      let runLabels = new Set<string>();
      if (fs.existsSync(runGraphPath)) {
        try { runLabels = getNodeLabels(JSON.parse(fs.readFileSync(runGraphPath, "utf-8"))); } catch { /* skip */ }
      }
      if (newestLabels.size === 0 || runLabels.size === 0) run.pruneScore.redundancy = 0;
      else {
        let intersection = 0;
        runLabels.forEach(function(lbl) { if (newestLabels.has(lbl)) intersection++; });
        const union = newestLabels.size + runLabels.size - intersection;
        const jaccard = union > 0 ? intersection / union : 0;
        run.pruneScore.redundancy = Math.round(jaccard * 1000) / 1000;
      }
    }

    run.pruneScore.lowSignal = run.nodeCount < LOW_SIGNAL_THRESHOLD
      ? Math.round((1.0 - run.nodeCount / LOW_SIGNAL_THRESHOLD) * 1000) / 1000
      : 0;
    run.pruneScore.obsoletion = runs.length > 1
      ? Math.round((i / (runs.length - 1)) * 1000) / 1000
      : 0;
    run.totalPruneScore = Math.round((
      0.35 * run.pruneScore.staleness +
      0.25 * run.pruneScore.redundancy +
      0.15 * run.pruneScore.lowSignal +
      0.25 * run.pruneScore.obsoletion
    ) * 1000) / 1000;
  }

  if (persist) {
    for (const run of runs) {
      try { writeRunMeta(projectSlug, run.runId, run, path.join(runsDir, run.runId)); } catch { /* skip */ }
    }
  }
  return runs;
}

function selectMemoryForContext(projectSlug: string, role: string): RunMeta[] {
  const projectDir = projectDirForSlug(projectSlug);
  const runsDir = path.join(projectDir, "runs");
  if (!fs.existsSync(runsDir)) return [];
  let lastRunId = "";
  try {
    const projectMeta = JSON.parse(fs.readFileSync(path.join(projectDir, "meta.json"), "utf-8"));
    lastRunId = String(projectMeta.lastRunId ?? "");
  } catch { /* optional */ }

  const metas: RunMeta[] = [];
  for (const de of fs.readdirSync(runsDir, { withFileTypes: true })) {
    if (!de.isDirectory()) continue;
    const meta = loadRunMeta(projectSlug, de.name, path.join(runsDir, de.name));
    if (!meta || meta.archived || meta.safeToInject === false) continue;
    const isLatest = meta.runId === lastRunId;
    const isPinned = meta.pruneScore.pinned === true;
    const isHot = heatTracker.getTemperature(projectSlug, meta.runId) === "hot" || meta.temperature === "hot";
    const hasVerifierFailure = role.toLowerCase().includes("verifier") && meta.failureSignatures.length > 0;
    if (isLatest || isPinned || isHot || hasVerifierFailure) metas.push(meta);
  }
  metas.sort(function(a, b) {
    if (a.runId === lastRunId) return -1;
    if (b.runId === lastRunId) return 1;
    return (b.contextPriority - a.contextPriority) || b.savedAt.localeCompare(a.savedAt);
  });
  return metas;
}

function findRunMetas(runId: string): Array<{ meta: RunMeta; metaPath: string; projectSlug: string; runDir: string }> {
  const matches: Array<{ meta: RunMeta; metaPath: string; projectSlug: string; runDir: string }> = [];
  if (!fs.existsSync(BRAIN_DIR)) return matches;
  for (const pe of fs.readdirSync(BRAIN_DIR, { withFileTypes: true })) {
    if (!pe.isDirectory() || pe.name.startsWith(".") || pe.name === "obsidian-vault") continue;
    const runDir = runDirFor(pe.name, runId);
    const metaPath = path.join(runDir, "run-meta.json");
    if (!fs.existsSync(metaPath)) continue;
    const meta = loadRunMeta(pe.name, runId, runDir);
    if (meta) matches.push({ meta, metaPath, projectSlug: pe.name, runDir });
  }
  return matches;
}

function findRunMeta(runId: string): { meta: RunMeta; metaPath: string; projectSlug: string; runDir: string } | null {
  const matches = findRunMetas(runId);
  return matches.length === 1 ? matches[0] : null;
}

function resolveProjectRunFromArgs(argsText: string, defaultProjectSlug: string, requireRun: boolean): { projectSlug: string; projectName: string; runId: string } | { error: string } {
  const args = splitArgs(argsText);
  const runFlag = getFlagValue(args, "--run");
  const pos = positionalArgs(args);
  const projectName = pos.join(" ");
  if (runFlag) {
    const slug = slugify(projectName || defaultProjectSlug);
    if (!fs.existsSync(runDirFor(slug, runFlag))) return { error: "Run " + runFlag + " not found for project " + slug + "." };
    return { projectSlug: slug, projectName: projectName || slug, runId: runFlag };
  }
  if (projectName) {
    const projectSlug = slugify(projectName);
    const projectMetaPath = path.join(projectDirForSlug(projectSlug), "meta.json");
    if (fs.existsSync(projectMetaPath)) {
      try {
        const projectMeta = JSON.parse(fs.readFileSync(projectMetaPath, "utf-8"));
        const lastRunId = String(projectMeta.lastRunId ?? "");
        if (lastRunId && fs.existsSync(runDirFor(projectSlug, lastRunId))) return { projectSlug, projectName, runId: lastRunId };
      } catch { /* fall through */ }
      if (requireRun) return { error: "Use --run <id> for project " + projectName + "." };
    }
    const legacy = findRunMetas(projectName);
    if (legacy.length === 1) return { projectSlug: legacy[0].projectSlug, projectName: legacy[0].projectSlug, runId: projectName };
    if (legacy.length > 1) return { error: "Legacy run id " + projectName + " is ambiguous; use <project> --run <id>." };
  }
  if (requireRun) return { error: "Missing run id. Use <project> --run <id>." };
  try {
    const meta = JSON.parse(fs.readFileSync(path.join(projectDirForSlug(defaultProjectSlug), "meta.json"), "utf-8"));
    const lastRunId = String(meta.lastRunId ?? "");
    if (lastRunId) return { projectSlug: defaultProjectSlug, projectName: defaultProjectSlug, runId: lastRunId };
  } catch { /* skip */ }
  return { error: "No run found. Use <project> --run <id>." };
}

function getProjectSlugsForCommand(projectArg: string | undefined): string[] {
  if (projectArg) return [slugify(projectArg)];
  if (!fs.existsSync(BRAIN_DIR)) return [];
  const slugs: string[] = [];
  for (const pe of fs.readdirSync(BRAIN_DIR, { withFileTypes: true })) {
    if (!pe.isDirectory() || pe.name.startsWith(".") || pe.name === "obsidian-vault") continue;
    if (fs.existsSync(path.join(BRAIN_DIR, pe.name, "runs"))) slugs.push(pe.name);
  }
  return slugs;
}

async function handlePrune(ctx: ExtensionCommandContext, pi: ExtensionAPI, rest: string): Promise<void> {
  const args = splitArgs(rest);
  const projectName = positionalArgs(args).join(" ") || path.basename(ctx.cwd);
  const slug = slugify(projectName);
  const projectDir = path.join(BRAIN_DIR, slug);
  if (!fs.existsSync(projectDir)) { ctx.ui.notify("Project \"" + projectName + "\" not found.", "error"); return; }
  const runs = computePruneScores(projectDir, { persist: false });
  if (runs.length === 0) { ctx.ui.notify("No runs found for " + projectName + ".", "info"); return; }
  runs.sort(function(a, b) { return b.totalPruneScore - a.totalPruneScore; });
  let table = "## Prune Candidates (dry-run): " + projectName + "\n\n";
  table += "| Rank | Run ID | Total | Staleness | Redundancy | LowSignl | Obsolet. | Pinned | Temp |\n";
  table += "|---|---|---|---|---|---|---|---|---|\n";
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    table += "| " + (i + 1) + " | `" + r.runId + "` | " + r.totalPruneScore.toFixed(3) + (r.totalPruneScore > PRUNE_THRESHOLD ? " ⚠️" : "") + " | " + r.pruneScore.staleness.toFixed(2) + " | " + r.pruneScore.redundancy.toFixed(2) + " | " + r.pruneScore.lowSignal.toFixed(2) + " | " + r.pruneScore.obsoletion.toFixed(2) + " | " + (r.pruneScore.pinned ? "🔒" : "") + " | " + r.temperature + " |\n";
  }
  table += "\n> Dry-run only: no run-meta.json files were rewritten.";
  table += "\n> ⚠️ = totalPruneScore > " + PRUNE_THRESHOLD + " (gc candidate)";
  table += "\n> 🔒 = pinned (immune)";
  await ctx.waitForIdle();
  pi.sendUserMessage(table);
}

function pinMeta(meta: RunMeta, pinned: boolean): void {
  meta.pruneScore.pinned = pinned;
  if (pinned) {
    meta.pruneScore.staleness = 0;
    meta.pruneScore.redundancy = 0;
    meta.pruneScore.lowSignal = 0;
    meta.pruneScore.obsoletion = 0;
    meta.totalPruneScore = 0;
  }
}

async function handlePin(ctx: ExtensionCommandContext, pi: ExtensionAPI, rest: string): Promise<void> {
  if (!rest) { ctx.ui.notify("Usage: /memory pin <project> [--run <id>]", "info"); return; }
  const resolved = resolveProjectRunFromArgs(rest, slugify(path.basename(ctx.cwd)), true);
  if ("error" in resolved) { ctx.ui.notify(resolved.error, "error"); return; }
  const runDir = runDirFor(resolved.projectSlug, resolved.runId);
  const meta = loadRunMeta(resolved.projectSlug, resolved.runId, runDir);
  if (!meta) { ctx.ui.notify("Run " + resolved.runId + " not found.", "error"); return; }
  pinMeta(meta, true);
  writeRunMeta(resolved.projectSlug, resolved.runId, meta, runDir);
  ctx.ui.notify("Pinned " + resolved.projectSlug + "/" + resolved.runId + " — immune to pruning.", "success");
}

async function handleUnpin(ctx: ExtensionCommandContext, pi: ExtensionAPI, rest: string): Promise<void> {
  if (!rest) { ctx.ui.notify("Usage: /memory unpin <project> [--run <id>]", "info"); return; }
  const resolved = resolveProjectRunFromArgs(rest, slugify(path.basename(ctx.cwd)), true);
  if ("error" in resolved) { ctx.ui.notify(resolved.error, "error"); return; }
  const runDir = runDirFor(resolved.projectSlug, resolved.runId);
  const meta = loadRunMeta(resolved.projectSlug, resolved.runId, runDir);
  if (!meta) { ctx.ui.notify("Run " + resolved.runId + " not found.", "error"); return; }
  pinMeta(meta, false);
  writeRunMeta(resolved.projectSlug, resolved.runId, meta, runDir);
  computePruneScores(projectDirForSlug(resolved.projectSlug), { persist: true });
  ctx.ui.notify("Unpinned " + resolved.projectSlug + "/" + resolved.runId + " — prune scores recomputed.", "success");
}

function gcCandidateReason(run: RunMeta): string {
  return "score=" + run.totalPruneScore.toFixed(3) + " (stale=" + run.pruneScore.staleness.toFixed(2) + ", redundant=" + run.pruneScore.redundancy.toFixed(2) + ", lowSignal=" + run.pruneScore.lowSignal.toFixed(2) + ", obsolete=" + run.pruneScore.obsoletion.toFixed(2) + ")";
}

async function handleGc(ctx: ExtensionCommandContext, pi: ExtensionAPI, rest: string): Promise<void> {
  if (!fs.existsSync(BRAIN_DIR)) { ctx.ui.notify("No brain directory found.", "info"); return; }
  const args = splitArgs(rest);
  const apply = hasFlag(args, "--apply");
  const projectArg = positionalArgs(args).join(" ") || undefined;
  const projectSlugs = getProjectSlugsForCommand(projectArg);
  if (projectSlugs.length === 0) { ctx.ui.notify("No projects with runs found.", "info"); return; }
  const lines: string[] = ["## Memory GC " + (apply ? "Apply" : "Dry Run"), ""];
  let candidateCount = 0;
  let archivedCount = 0;
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  for (const projectSlug of projectSlugs) {
    const projectDir = projectDirForSlug(projectSlug);
    if (!fs.existsSync(projectDir)) { lines.push("- " + projectSlug + ": project not found"); continue; }
    const runs = computePruneScores(projectDir, { persist: apply });
    const candidates = runs.filter(function(run) { return run.totalPruneScore > PRUNE_THRESHOLD && !run.pruneScore.pinned && !run.archived; });
    if (candidates.length === 0) { lines.push("- " + projectSlug + ": no archive candidates"); continue; }
    for (const run of candidates) {
      candidateCount++;
      const sourceRunDir = runDirFor(projectSlug, run.runId);
      const archiveRunDir = archiveRunDirFor(projectSlug, run.runId);
      const reason = gcCandidateReason(run);
      if (!apply) { lines.push("- DRY-RUN " + projectSlug + "/" + run.runId + " would archive: " + reason); continue; }
      if (run.pruneScore.pinned) { lines.push("- SKIP pinned " + projectSlug + "/" + run.runId); continue; }
      if (!fs.existsSync(sourceRunDir)) { lines.push("- SKIP missing source " + projectSlug + "/" + run.runId); continue; }
      if (fs.existsSync(archiveRunDir)) { lines.push("- SKIP archive already exists " + projectSlug + "/" + run.runId); continue; }
      const now = new Date();
      fs.mkdirSync(path.dirname(archiveRunDir), { recursive: true });
      run.archived = true;
      run.archivedAt = now.toISOString();
      run.archivedReason = reason;
      run.archivePath = archiveRunDir;
      run.deleteAfter = addDaysIso(now, ARCHIVE_GRACE_DAYS);
      writeRunMeta(projectSlug, run.runId, run, sourceRunDir);
      const archiveMeta = { projectSlug, runId: run.runId, archivedAt: run.archivedAt, originalPath: sourceRunDir, archivePath: archiveRunDir, reason, deleteAfter: run.deleteAfter, runMeta: run };
      fs.writeFileSync(path.join(sourceRunDir, "archive-meta.json"), JSON.stringify(archiveMeta, null, 2), "utf-8");
      fs.renameSync(sourceRunDir, archiveRunDir);
      archivedCount++;
      lines.push("- ARCHIVED " + projectSlug + "/" + run.runId + " → " + archiveRunDir);
    }
  }
  if (!apply) lines.push("", "> Dry-run only: no files were moved/deleted and run-meta.json was not rewritten.");
  else lines.push("", "> Archived " + archivedCount + " of " + candidateCount + " candidate run(s). No archive purge/deletion was performed.");
  await ctx.waitForIdle?.();
  pi.sendUserMessage(lines.join("\n"));
}

function findArchivedRun(projectOrRun: string, maybeRunId?: string): { projectSlug: string; runId: string; archiveRunDir: string } | { error: string } {
  if (maybeRunId) {
    const projectSlug = slugify(projectOrRun);
    const archiveRunDir = archiveRunDirFor(projectSlug, maybeRunId);
    if (!fs.existsSync(archiveRunDir)) return { error: "Archive " + projectSlug + "/" + maybeRunId + " not found." };
    return { projectSlug, runId: maybeRunId, archiveRunDir };
  }
  const runId = projectOrRun;
  const matches: Array<{ projectSlug: string; runId: string; archiveRunDir: string }> = [];
  if (fs.existsSync(ARCHIVE_DIR)) {
    for (const pe of fs.readdirSync(ARCHIVE_DIR, { withFileTypes: true })) {
      if (!pe.isDirectory()) continue;
      const dir = path.join(ARCHIVE_DIR, pe.name, runId);
      if (fs.existsSync(dir)) matches.push({ projectSlug: pe.name, runId, archiveRunDir: dir });
    }
  }
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) return { error: "Archived run id " + runId + " is ambiguous; use /memory keep <project> --run <id>." };
  return { error: "Archive for " + runId + " not found." };
}

async function handleKeep(ctx: ExtensionCommandContext, pi: ExtensionAPI, rest: string): Promise<void> {
  const args = splitArgs(rest);
  const runId = getFlagValue(args, "--run");
  const pos = positionalArgs(args);
  if (pos.length === 0 && !runId) { ctx.ui.notify("Usage: /memory keep <project> --run <id>", "info"); return; }
  const found = runId ? findArchivedRun(pos.join(" "), runId) : findArchivedRun(pos.join(" "));
  if ("error" in found) { ctx.ui.notify(found.error, "error"); return; }
  const activeRunDir = runDirFor(found.projectSlug, found.runId);
  if (fs.existsSync(activeRunDir)) { ctx.ui.notify("Active run already exists for " + found.projectSlug + "/" + found.runId + ".", "error"); return; }
  fs.mkdirSync(path.dirname(activeRunDir), { recursive: true });
  fs.renameSync(found.archiveRunDir, activeRunDir);
  let meta = loadRunMeta(found.projectSlug, found.runId, activeRunDir);
  if (!meta) meta = normalizeRunMeta(found.projectSlug, found.runId, {}, activeRunDir, new Date());
  pinMeta(meta, true);
  meta.archived = false;
  delete meta.archivedAt;
  delete meta.archivedReason;
  delete meta.archivePath;
  delete meta.deleteAfter;
  writeRunMeta(found.projectSlug, found.runId, meta, activeRunDir);
  ctx.ui.notify("Restored " + found.projectSlug + "/" + found.runId + " from archive (auto-pinned). Project-root LATEST artifacts were left untouched.", "success");
}

async function handleStats(ctx: ExtensionCommandContext, pi: ExtensionAPI, projectName: string | undefined): Promise<void> {
  if (projectName) {
    const slug = slugify(projectName);
    const projectDir = path.join(BRAIN_DIR, slug);
    if (!fs.existsSync(projectDir)) { ctx.ui.notify("Project \"" + projectName + "\" not found.", "error"); return; }
    const runs = computePruneScores(projectDir, { persist: false });
    const totalSize = dirSize(path.join(projectDir, "runs"));
    const tempStats = { hot: 0, warm: 0, cold: 0 };
    const histogram = [0, 0, 0, 0, 0];
    for (const r of runs) {
      if (r.temperature === "hot") tempStats.hot++; else if (r.temperature === "warm") tempStats.warm++; else tempStats.cold++;
      const s = r.totalPruneScore;
      if (s < 0.3) histogram[0]++; else if (s < 0.5) histogram[1]++; else if (s < 0.7) histogram[2]++; else if (s < 0.9) histogram[3]++; else histogram[4]++;
    }
    let out = "## Stats: " + projectName + "\n\n";
    out += "| Metric | Value |\n|---|---|\n";
    out += "| Run Count | " + runs.length + " |\n";
    out += "| Total Size | " + formatBytes(totalSize) + " |\n";
    out += "| Avg Prune Score | " + (runs.length > 0 ? (runs.reduce(function(sum, r) { return sum + r.totalPruneScore; }, 0) / runs.length).toFixed(3) : "N/A") + " |\n";
    out += "\n**Prune Score Histogram:**\n| Range | Count |\n|---|---|\n";
    out += "| 0.0–0.3 | " + histogram[0] + " |\n| 0.3–0.5 | " + histogram[1] + " |\n| 0.5–0.7 | " + histogram[2] + " |\n| 0.7–0.9 | " + histogram[3] + " |\n| 0.9–1.0 | " + histogram[4] + " |\n";
    out += "\n**Temperature Distribution:**\n| Temperature | Count |\n|---|---|\n";
    out += "| 🔥 Hot | " + tempStats.hot + " |\n| 🌤 Warm | " + tempStats.warm + " |\n| ❄️ Cold | " + tempStats.cold + " |\n";
    out += "\n> Stats are dry-run: run-meta.json files were not rewritten.";
    await ctx.waitForIdle();
    pi.sendUserMessage(out);
  } else {
    const projects: Array<{ slug: string; runs: number; size: number }> = [];
    for (const pe of fs.readdirSync(BRAIN_DIR, { withFileTypes: true })) {
      if (!pe.isDirectory() || pe.name.startsWith(".") || pe.name === "obsidian-vault") continue;
      const runsDir = path.join(BRAIN_DIR, pe.name, "runs");
      let runCount = 0;
      let size = 0;
      if (fs.existsSync(runsDir)) {
        runCount = fs.readdirSync(runsDir, { withFileTypes: true }).filter(function(d) { return d.isDirectory(); }).length;
        size = dirSize(runsDir);
      }
      projects.push({ slug: pe.name, runs: runCount, size });
    }
    let out = "## Global Brain Stats\n\n| Project | Runs | Size |\n|---|---|---|\n";
    for (const p of projects) out += "| " + p.slug + " | " + p.runs + " | " + formatBytes(p.size) + " |\n";
    const totalRuns = projects.reduce(function(s, p) { return s + p.runs; }, 0);
    const totalSize2 = projects.reduce(function(s, p) { return s + p.size; }, 0);
    out += "\n> **" + projects.length + " project(s), " + totalRuns + " run(s), " + formatBytes(totalSize2) + " total**";
    out += "\n> Stats are dry-run: run-meta.json files were not rewritten.";
    await ctx.waitForIdle();
    pi.sendUserMessage(out);
  }
}

// ──────────────────────────────────────────────
//  /memory-wiki handlers
// ──────────────────────────────────────────────

/**
 * Sync current project's obsidian output into the central wiki vault.
 */
async function handleWikiSyncCurrent(
  ctx: ExtensionCommandContext,
  pi: ExtensionAPI,
): Promise<void> {
  const cwd = ctx.cwd;
  const obsidianSrc = path.join(cwd, "graphify-out", "obsidian");

  if (!fs.existsSync(obsidianSrc)) {
    // Not an error — obsidian vault is only generated with --obsidian flag
    return;
  }

  ensureVault();
  const projectName = path.basename(cwd);
  const slug = slugify(projectName);
  const count = copyObsidianToVault(obsidianSrc, slug, projectName);
  rebuildVaultIndex();

  ctx.ui.notify(
    `Synced "${projectName}" → obsidian-vault/${slug}/ (${count} files). Use /memory-wiki open to launch Obsidian.`,
    "success",
  );
}

/**
 * Sync ALL saved projects from brain into the central wiki vault.
 */
async function handleWikiSyncAll(
  ctx: ExtensionCommandContext,
): Promise<void> {
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
      displayName =
        JSON.parse(fs.readFileSync(metaPath, "utf-8")).displayName ?? entry.name;
    } catch { /* ok */ }

    totalFiles += copyObsidianToVault(obsidianSrc, entry.name, displayName);
    totalProjects++;
  }

  rebuildVaultIndex();

  if (totalProjects === 0) {
    ctx.ui.notify(
      "No obsidian outputs found in saved projects. Run /memory save on projects that have graphify-out/obsidian/.",
      "info",
    );
    return;
  }

  ctx.ui.notify(
    `Synced ${totalProjects} project(s) → obsidian-vault/ (${totalFiles} files). Use /memory-wiki open to launch Obsidian.`,
    "success",
  );
}

/**
 * Launch the central vault in Obsidian, or print the path.
 */
async function handleWikiOpen(ctx: ExtensionCommandContext): Promise<void> {
  ensureVault();
  rebuildVaultIndex();

  const opened = openInObsidian();
  if (opened) {
    ctx.ui.notify(
      "Launched Obsidian → Graphify Brain vault",
      "success",
    );
  } else {
    // Obsidian not installed or URI failed — show path
    ctx.ui.notify(
      `Obsidian vault at: ${WIKI_VAULT}\nOpen Obsidian → "Open folder as vault" and select this path.`,
      "info",
    );
  }
}

/**
 * Open the _notes folder path (or tell user where it is).
 */
async function handleWikiNotes(ctx: ExtensionCommandContext): Promise<void> {
  ensureVault();

  // Try to open the notes directory in file explorer
  const notesInVault = NOTES_DIR.replace(/\//g, path.sep);
  try {
    const cmd =
      process.platform === "win32"
        ? `explorer "${notesInVault}"`
        : process.platform === "darwin"
          ? `open "${notesInVault}"`
          : `xdg-open "${notesInVault}"`;
    execSync(cmd, { stdio: "ignore", timeout: 5000 });
  } catch {
    // fallback
  }

  ctx.ui.notify(
    `Notes folder: ${notesInVault}\nCreate or edit .md files here — they sync into the Obsidian vault automatically.`,
    "info",
  );
}
