import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  renameSync,
  rmSync,
} from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readOpenIapInput } from "./build-input.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const openiap = resolve(root, "../openiap");
const local = join(root, ".local");
const maven = join(local, "maven");
mkdirSync(local, { recursive: true });
const input = readOpenIapInput(openiap);
const suite = /SUITE_VERSION = '([^']+)'/.exec(
  readFileSync(
    join(openiap, "packages/conformance/src/spec/suite-version.mjs"),
    "utf8",
  ),
)?.[1];
if (!suite) throw new Error("Missing conformance version.");
function run(command, args, cwd, capture = false) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "inherit"] : "inherit",
  });
  if (result.error || result.status !== 0)
    throw result.error ?? new Error(`${command} failed: ${result.status}`);
  return result.stdout;
}
run(
  "./gradlew",
  [
    ":openiap-core:publishToMavenLocal",
    ":openiap-conformance:publishToMavenLocal",
    `-Dmaven.repo.local=${maven}`,
  ],
  join(openiap, "packages/google"),
);
run(
  "./gradlew",
  [
    ":provider:testDebugUnitTest",
    ":provider:publishReleasePublicationToExperimentRepository",
    `-PopenIapRepository=${maven}`,
    `-PproviderRepository=${maven}`,
    `-PopenIapCoreVersion=${input.coreVersion}`,
    `-PclientProtocolVersion=${input.clientProtocolVersion}`,
    `-PconformanceVersion=${suite}`,
    `-PopenIapRevision=${input.revision}`,
  ],
  root,
);
const sdk = join(openiap, "libraries/expo-iap");
run("bun", ["install", "--frozen-lockfile", "--ignore-scripts"], sdk);
run("bun", ["run", "prepublishOnly"], sdk);
const stage = join(local, "expo-iap-source");
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });
const [{ files }] = JSON.parse(
  run("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], sdk, true),
);
for (const { path } of files) {
  const target = join(stage, path);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(join(sdk, path), target);
}
// Match OpenIAP's release packaging: npm excludes these workspace symlinks.
for (const path of ["openiap-versions.json", "android/openiap-store.gradle"]) {
  copyFileSync(join(sdk, path), join(stage, path));
}
const [{ filename }] = JSON.parse(
  run(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", local],
    stage,
    true,
  ),
);
const hash = createHash("sha256")
  .update(readFileSync(join(local, filename)))
  .digest("hex")
  .slice(0, 12);
const tarball = `expo-iap-${hash}.tgz`;
renameSync(join(local, filename), join(local, tarball));
const consumerManifest = join(root, "example/package.json");
const consumer = JSON.parse(readFileSync(consumerManifest, "utf8"));
consumer.dependencies["expo-iap"] = `file:../.local/${tarball}`;
if (JSON.stringify(readOpenIapInput(openiap)) !== JSON.stringify(input)) {
  throw new Error(
    "OpenIAP checkout changed during preparation. Prepare again from a clean input.",
  );
}
run("node", ["scripts/package-provider.mjs"], root);
run(
  "node",
  ["--test", "scripts/build-input.test.mjs", "scripts/package.test.mjs"],
  root,
);
const [{ filename: providerFilename }] = JSON.parse(
  run(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", local],
    root,
    true,
  ),
);
const providerHash = createHash("sha256")
  .update(readFileSync(join(local, providerFilename)))
  .digest("hex")
  .slice(0, 12);
const providerTarball = `community-provider-${providerHash}.tgz`;
renameSync(join(local, providerFilename), join(local, providerTarball));
consumer.dependencies["@hyodotdev/openiap-provider-amazon-example"] =
  `file:../.local/${providerTarball}`;
writeFileSync(consumerManifest, JSON.stringify(consumer, null, 2) + "\n");
console.log(
  "Prepared public SDK fixtures and the tested community package. No registry publication was performed.",
);
