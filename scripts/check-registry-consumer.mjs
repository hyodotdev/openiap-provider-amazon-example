import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";

const workspace = resolve(process.argv[2]);
const phase = process.argv[3] ?? "installed";
const distribution = JSON.parse(
  readFileSync(join(workspace, "distribution.json"), "utf8"),
);
const packageRoot = join(
  workspace,
  "example/node_modules",
  distribution.package,
);
const artifact = JSON.parse(
  readFileSync(join(packageRoot, "provider-artifact.json"), "utf8"),
);
assert.deepEqual(
  artifact,
  Object.fromEntries(
    Object.entries(distribution).filter(
      ([key]) => !["tarball", "integrity"].includes(key),
    ),
  ),
);
const digest = (file) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");
assert.equal(digest(join(packageRoot, artifact.aar)), distribution.aarSha256);
assert.ok(!existsSync(join(workspace, "provider")));
assert.ok(!existsSync(join(workspace, ".local/maven/dev/openiap/providers")));
const manifest = JSON.parse(
  readFileSync(join(workspace, "example/package.json"), "utf8"),
);
assert.equal(manifest.dependencies[distribution.package], distribution.version);
if (phase === "built") {
  const android = join(workspace, "example/android");
  const properties = readFileSync(join(android, "gradle.properties"), "utf8");
  assert.match(properties, /^openiapStore=amazon-example$/m);
  assert.ok(
    properties.includes(
      `openiapProvider=dev.openiap.providers:openiap-provider-amazon-example:${distribution.version}`,
    ),
  );
  assert.ok(
    properties.includes(
      "node_modules/@hyodotdev/openiap-provider-amazon-example/maven",
    ),
  );
  const graph = JSON.parse(
    readFileSync(join(workspace, "gradle-proof.json"), "utf8"),
  );
  const provider = graph.filter(
    (item) =>
      item.group === "dev.openiap.providers" &&
      item.name === "openiap-provider-amazon-example",
  );
  assert.equal(provider.length, 1);
  assert.equal(provider[0].version, distribution.version);
  assert.equal(digest(provider[0].file), distribution.aarSha256);
  assert.ok(
    graph.some(
      (item) =>
        item.group === "io.github.hyochan.openiap" &&
        item.name === "openiap-core" &&
        item.version === distribution.coreVersion,
    ),
  );
  assert.ok(
    graph.some(
      (item) =>
        item.group === "com.amazon.device" &&
        item.name === "amazon-appstore-sdk",
    ),
  );
  assert.ok(
    !graph.some((item) =>
      /openiap-google|billingclient|horizon/i.test(
        `${item.group}:${item.name}`,
      ),
    ),
  );
  const mapping = readFileSync(
    join(android, "app/build/outputs/mapping/release/mapping.txt"),
    "utf8",
  );
  assert.ok(
    mapping.includes(`${distribution.factory} -> ${distribution.factory}:`),
  );
  writeFileSync(
    join(workspace, "registry-proof.json"),
    JSON.stringify(
      {
        package: distribution.package,
        version: distribution.version,
        sourceCommit: distribution.sourceCommit,
        integrity: distribution.integrity,
        aarSha256: distribution.aarSha256,
        openIapRevision: distribution.openIapRevision,
        consumerHasProviderSources: false,
        localProviderRepository: false,
        actualRuntimeArtifactMatches: true,
        optimizedFactoryPreserved: true,
        officialSdkInput:
          "Pinned pre-release verification fixture; not a released registry contract",
      },
      null,
      2,
    ) + "\n",
  );
}
console.log(
  `Registry consumer ${phase}: ${distribution.package}@${distribution.version}, AAR ${distribution.aarSha256}`,
);
