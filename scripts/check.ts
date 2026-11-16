// Quality gate: typecheck, lint, format, tests, then a production build in a clean temp copy.
// Run: bun run check   (exits non-zero if any step fails)
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = join(import.meta.dir, "..");

type Step = { name: string; cmd: string[]; cwd?: string };
type Result = { name: string; ok: boolean; seconds: number };

function run(step: Step): Result {
  const start = performance.now();
  console.log(`\n▶ ${step.name}: ${step.cmd.join(" ")}`);
  const proc = Bun.spawnSync(step.cmd, {
    cwd: step.cwd ?? root,
    stdout: "inherit",
    stderr: "inherit",
  });
  return {
    name: step.name,
    ok: proc.exitCode === 0,
    seconds: (performance.now() - start) / 1000,
  };
}

// Copy the working tree without build output, deps or agent/planning folders,
// then clone node_modules (Turbopack rejects a symlinked node_modules).
function cleanCopy(): string {
  const dir = mkdtempSync(join(tmpdir(), "chamba-build-"));
  const excludes = [".next", "node_modules", ".git", ".planning", ".claude", ".agents", ".vercel"];
  const rsync = Bun.spawnSync(
    ["rsync", "-a", ...excludes.flatMap((e) => ["--exclude", e]), `${root}/`, `${dir}/`],
    { stdout: "inherit", stderr: "inherit" },
  );
  if (rsync.exitCode !== 0) throw new Error("rsync failed");
  const cp = Bun.spawnSync(["cp", "-cR", join(root, "node_modules"), join(dir, "node_modules")], {
    stdout: "inherit",
    stderr: "inherit",
  });
  if (cp.exitCode !== 0) throw new Error("node_modules clone failed");
  return dir;
}

const steps: Step[] = [
  { name: "typecheck", cmd: ["bunx", "tsc", "--noEmit"] },
  { name: "eslint", cmd: ["bunx", "eslint", "."] },
  { name: "biome", cmd: ["bunx", "biome", "check", "."] },
  { name: "test", cmd: ["bun", "test", "tests/"] },
];

const results: Result[] = steps.map(run);

let buildDir: string | undefined;
try {
  buildDir = cleanCopy();
  results.push(run({ name: "build", cmd: ["bunx", "next", "build"], cwd: buildDir }));
} catch (err) {
  console.error(err);
  results.push({ name: "build", ok: false, seconds: 0 });
} finally {
  if (buildDir) rmSync(buildDir, { recursive: true, force: true });
}

console.log("\n step       result  time");
console.log(" ---------  ------  ------");
for (const r of results) {
  console.log(` ${r.name.padEnd(9)}  ${r.ok ? "PASS" : "FAIL"}    ${r.seconds.toFixed(1)}s`);
}

const failed = results.filter((r) => !r.ok);
console.log(failed.length ? `\n${failed.length} step(s) failed.` : "\nAll green.");
process.exit(failed.length ? 1 : 0);
