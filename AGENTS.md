# Amazon provider example

Keep this repository independent of the OpenIAP monorepo. Native implementation dependencies are the public `openiap-core` artifact and Amazon Appstore SDK; conformance uses the public test artifact. Do not add official provider artifacts or source-project includes to make a test pass.

Read README.md and VERIFICATION.md before changing the example. The OpenIAP input revision is recorded in openiap-revision.txt. Change the revision and regenerate local artifacts together when adopting a new contract. Never edit generated SDK types.

Until the maintainer marks this example complete, keep `main` as a single root commit. Amend that commit for further changes and use an exact `--force-with-lease` when pushing rewritten history. Preserve unrelated edits and back up the existing history before rewriting it.

Run provider unit tests and lint, consumer typecheck, and the affected Android build before committing. Update recorded verification only with observed results; distinguish controlled transport, App Tester purchases, and Live App Testing. Keep credentials, receipts, private device logs, generated app projects, and build outputs out of Git.

Use English for repository documents and commits. Do not release, deploy, submit to an app store, promote a registry entry, or merge an OpenIAP PR without the maintainer's explicit instruction. Device purchases must be authorized sandbox tests and run by the root agent.
