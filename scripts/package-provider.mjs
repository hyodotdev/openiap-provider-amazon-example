import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readPublishedInput, requireTestedInput } from "./build-input.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const reportDir = join(root, "provider/build/reports/openiap");
if (
  !["amazon-example.json", "build-input.json"].every((name) =>
    existsSync(join(reportDir, name)),
  )
) {
  throw new Error(
    "Run the complete provider conformance tests before packaging; a filtered run cannot certify the package.",
  );
}
const reportBytes = readFileSync(join(reportDir, "amazon-example.json"));
const report = JSON.parse(reportBytes);
if (
  !report.conformant ||
  !report.scope.complete ||
  report.results.some((result) => result.outcome === "fail")
) {
  throw new Error(
    "Run the complete provider conformance tests before packaging.",
  );
}
const group = "dev/openiap/providers/openiap-provider-amazon-example";
const input = join(root, ".local/maven", group, pkg.version);
const output = join(root, "maven", group, pkg.version);
const basename = `openiap-provider-amazon-example-${pkg.version}`;
const buildInput = readPublishedInput(
  readFileSync(join(input, `${basename}.pom`), "utf8"),
  report,
);
const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");
const aarSha256 = digest(readFileSync(join(input, `${basename}.aar`)));
requireTestedInput(
  buildInput,
  JSON.parse(readFileSync(join(reportDir, "build-input.json"), "utf8")),
  { aarSha256, reportSha256: digest(reportBytes) },
);
rmSync(join(root, "maven"), { recursive: true, force: true });
mkdirSync(output, { recursive: true });
for (const name of readdirSync(input))
  copyFileSync(join(input, name), join(output, name));
const aar = `${basename}.aar`;
writeFileSync(
  join(root, "provider-artifact.json"),
  JSON.stringify(
    {
      package: pkg.name,
      version: pkg.version,
      sourceCommit: execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim(),
      sourceDirty: Boolean(
        execFileSync(
          "git",
          ["status", "--porcelain", "--untracked-files=normal"],
          { cwd: root, encoding: "utf8" },
        ).trim(),
      ),
      openIapRevision: buildInput.revision,
      openIapPinnedRevision: readFileSync(
        join(root, "openiap-revision.txt"),
        "utf8",
      ).trim(),
      coreVersion: buildInput.coreVersion,
      clientProtocolVersion: buildInput.clientProtocolVersion,
      conformanceVersion: buildInput.conformanceVersion,
      storeId: report.storeId,
      factory: "dev.openiap.provider.fireos.FireOsProviderFactory",
      aar: `maven/${group}/${pkg.version}/${aar}`,
      aarSha256,
      requiredBehaviors: report.scope.requiredBehaviors.length,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Prepared ${pkg.name}@${pkg.version} with its tested AAR. No core or official provider is bundled.`,
);
