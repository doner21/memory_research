/**
 * Git Checkpoint Extension for Pi Code
 *
 * Automatically creates a git commit before any LLM-issued `write` or `edit`
 * tool call, providing a rollback point before destructive file operations.
 *
 * The commit uses --allow-empty so it always succeeds even if nothing changed.
 * Git failures are logged as warnings and never block the agent from working.
 */

import { execSync } from "node:child_process";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

// ─── Extension Entry Point ────────────────────────────────────────────────────

export default function gitCheckpointExtension(pi: ExtensionAPI) {
  pi.on("tool_call", async (event: any, ctx: any) => {
    if (event.toolName !== "write" && event.toolName !== "edit") return;

    const cwd = ctx.cwd;

    try {
      execSync("git add -A", { cwd, stdio: "pipe" });
      execSync('git commit -m "checkpoint: pre-op auto-commit [pi]" --allow-empty', { cwd, stdio: "pipe" });
    } catch (e) {
      console.warn("[git-checkpoint] git commit skipped:", (e as Error).message?.split("\n")[0]);
    }

    return undefined; // always allow the tool through — never block
  });
}
