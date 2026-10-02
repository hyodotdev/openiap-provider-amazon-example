import test from "node:test";
import assert from "node:assert/strict";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { readPublishedInput, requireTestedInput } from "./build-input.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const artifact = JSON.parse(
  readFileSync(join(root, "provider-artifact.json"), "utf8"),
);

test("packed community package contains the verified binary and no private app inputs", () => {
  const [{ files }] = JSON.parse(
    execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
      cwd: root,
      encoding: "utf8",
    }),
  );
  const paths = files.map((file) => file.path);
  assert.equal(pkg.publishConfig.registry, "https://npm.pkg.github.com");
  assert.ok(paths.includes(artifact.aar));
  assert.ok(paths.includes("app.plugin.js"));
  assert.ok(paths.includes("provider-artifact.json"));
  assert.ok(
    !paths.some((path) =>
      /(^|\/)(example|node_modules|\.local|\.env|\.git)(\/|$)|\.(keystore|jks|apk)$/.test(
        path,
      ),
    ),
  );
  assert.ok(paths.filter((path) => path.endsWith(".aar")).length === 1);
  assert.equal(
    createHash("sha256")
      .update(readFileSync(join(root, artifact.aar)))
      .digest("hex"),
    artifact.aarSha256,
  );
  assert.equal(artifact.version, pkg.version);
  assert.equal(artifact.storeId, "amazon-example");
  assert.equal(artifact.requiredBehaviors, 16);
});

test("published native metadata depends on the public core and Amazon SDK", () => {
  const dir = dirname(join(root, artifact.aar));
  const pom = readFileSync(
    join(
      dir,
      readdirSync(dir).find((name) => name.endsWith(".pom")),
    ),
    "utf8",
  );
  assert.match(pom, /<artifactId>openiap-core<\/artifactId>/);
  assert.match(pom, /<artifactId>amazon-appstore-sdk<\/artifactId>/);
  assert.doesNotMatch(pom, /openiap-google-|billingclient|horizon/);
  const report = JSON.parse(
    readFileSync(
      join(root, "provider/build/reports/openiap/amazon-example.json"),
      "utf8",
    ),
  );
  const input = readPublishedInput(pom, report);
  assert.equal(artifact.openIapRevision, input.revision);
  assert.equal(artifact.coreVersion, input.coreVersion);
  assert.equal(artifact.clientProtocolVersion, input.clientProtocolVersion);
  assert.equal(
    artifact.openIapPinnedRevision,
    readFileSync(join(root, "openiap-revision.txt"), "utf8").trim(),
  );
  assert.equal(typeof artifact.sourceDirty, "boolean");
  requireTestedInput(
    input,
    JSON.parse(
      readFileSync(
        join(root, "provider/build/reports/openiap/build-input.json"),
        "utf8",
      ),
    ),
    {
      aarSha256: artifact.aarSha256,
      reportSha256: createHash("sha256")
        .update(
          readFileSync(
            join(root, "provider/build/reports/openiap/amazon-example.json"),
          ),
        )
        .digest("hex"),
    },
  );
});

test("the packaging command rejects stale tests before replacing packaged artifacts", (t) => {
  const fixture = mkdtempSync(join(tmpdir(), "community-package-"));
  t.after(() => rmSync(fixture, { recursive: true, force: true }));
  const pomPath = artifact.aar.replace(/\.aar$/, ".pom");
  const reportPath = "provider/build/reports/openiap/amazon-example.json";
  const files = [
    "package.json",
    "scripts/package-provider.mjs",
    "scripts/build-input.mjs",
    reportPath,
    "provider/build/reports/openiap/build-input.json",
  ];
  for (const path of files) {
    mkdirSync(dirname(join(fixture, path)), { recursive: true });
    copyFileSync(join(root, path), join(fixture, path));
  }
  const inputAar = join(fixture, ".local", artifact.aar);
  const inputPom = join(fixture, ".local", pomPath);
  mkdirSync(dirname(inputAar), { recursive: true });
  const aar = readFileSync(join(root, artifact.aar));
  const pom = readFileSync(join(root, pomPath), "utf8");
  const reportBytes = readFileSync(join(root, reportPath));
  const provenancePath = "provider/build/reports/openiap/build-input.json";
  const provenanceBytes = readFileSync(join(root, provenancePath));
  mkdirSync(join(fixture, "maven"));
  const sentinel = join(fixture, "maven/retained.txt");
  writeFileSync(sentinel, "previously prepared output");
  const cases = [
    {
      pom: pom.replace(artifact.openIapRevision, "c".repeat(40)),
      field: "revision",
    },
    {
      pom: pom.replace(
        `<version>${artifact.coreVersion}</version>`,
        "<version>9.9.9</version>",
      ),
      field: "coreVersion",
    },
    {
      aar: Buffer.concat([aar, Buffer.from("changed binary")]),
      field: "aarSha256",
    },
    {
      report: Buffer.concat([reportBytes, Buffer.from("\n")]),
      field: "reportSha256",
    },
    { missing: reportPath },
    { missing: provenancePath },
  ];
  for (const changed of cases) {
    writeFileSync(inputPom, changed.pom ?? pom);
    writeFileSync(inputAar, changed.aar ?? aar);
    writeFileSync(join(fixture, reportPath), changed.report ?? reportBytes);
    writeFileSync(join(fixture, provenancePath), provenanceBytes);
    if (changed.missing) rmSync(join(fixture, changed.missing));
    const result = spawnSync(
      process.execPath,
      ["scripts/package-provider.mjs"],
      { cwd: fixture, encoding: "utf8" },
    );
    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      changed.missing
        ? /complete provider conformance tests/
        : new RegExp(`successful test input: ${changed.field}`),
    );
    assert.equal(readFileSync(sentinel, "utf8"), "previously prepared output");
  }
});
