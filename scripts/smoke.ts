// Post-deploy smoke test. Run: bun scripts/smoke.ts https://<deployment-url>
const base = process.argv[2]?.replace(/\/$/, "");
if (!base) {
  console.error("Usage: bun scripts/smoke.ts <base-url>");
  process.exit(2);
}

type Check = { path: string; type?: string; contains?: string };

const checks: Check[] = [
  { path: "/", type: "text/html", contains: "Chamba" },
  { path: "/manifest.webmanifest", type: "manifest", contains: "Chamba" },
  { path: "/icon-512.png", type: "image/png" },
  { path: "/entrar", type: "text/html" },
];

let failures = 0;
for (const c of checks) {
  let detail = "";
  try {
    const res = await fetch(base + c.path, { redirect: "follow" });
    const type = res.headers.get("content-type") ?? "";
    const body = c.contains ? await res.text() : "";
    const problems = [
      res.status !== 200 && `status ${res.status}`,
      c.type && !type.includes(c.type) && `content-type ${type || "missing"}`,
      c.contains && !body.includes(c.contains) && `missing "${c.contains}"`,
    ].filter(Boolean);
    detail = problems.length ? problems.join(", ") : `${res.status} ${type}`;
    if (problems.length) failures++;
    console.log(`${problems.length ? "FAIL" : "PASS"}  ${c.path.padEnd(24)} ${detail}`);
  } catch (err) {
    failures++;
    console.log(`FAIL  ${c.path.padEnd(24)} ${(err as Error).message}`);
  }
}

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll smoke checks passed.");
process.exit(failures ? 1 : 0);
