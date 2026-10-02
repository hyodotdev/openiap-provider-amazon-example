import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, ".local/registry-inputs");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const consumer = JSON.parse(
  readFileSync(join(root, "example/package.json"), "utf8"),
);
const artifact = JSON.parse(
  readFileSync(join(root, "provider-artifact.json"), "utf8"),
);
rmSync(output, { recursive: true, force: true });
mkdirSync(join(output, ".local"), { recursive: true });
const [{ filename }] = JSON.parse(
  execFileSync(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", output],
    { cwd: root, encoding: "utf8" },
  ),
);
const tarball = readFileSync(join(output, filename));
writeFileSync(
  join(output, "distribution.json"),
  JSON.stringify(
    {
      ...artifact,
      tarball: filename,
      integrity: `sha512-${createHash("sha512")
        .update(tarball)
        .digest("base64")}`,
    },
    null,
    2,
  ) + "\n",
);
const core = "io/github/hyochan/openiap/openiap-core";
cpSync(join(root, ".local/maven", core), join(output, ".local/maven", core), {
  recursive: true,
});
cpSync(
  resolve(root, "example", consumer.dependencies["expo-iap"].slice(5)),
  join(output, ".local/expo-iap.tgz"),
);
// Only tracked consumer files enter the fresh workspace.
const files = execFileSync("git", ["ls-files", "-z", "example"], {
  cwd: root,
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);
for (const file of files) {
  mkdirSync(dirname(join(output, file)), { recursive: true });
  cpSync(join(root, file), join(output, file));
}
consumer.dependencies["expo-iap"] = "file:../.local/expo-iap.tgz";
consumer.dependencies[pkg.name] = pkg.version;
writeFileSync(
  join(output, "example/package.json"),
  JSON.stringify(consumer, null, 2) + "\n",
);
console.log(
  `Staged ${pkg.name}@${pkg.version}: registry consumer has no provider source or local provider Maven artifact.`,
);
