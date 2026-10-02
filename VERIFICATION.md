# Community example verification — October 3, 2026

This report covers the educational `openiap-google-amazon-community` repository. For FireOS apps, use the [official OpenIAP Amazon integration](https://openiap.dev/docs/setup/store/amazon). The existing package and Maven installation names are retained after the repository rename. Registry consumer results below cover Expo; they do not prove installation and device behavior in every framework.

Input: OpenIAP `f8926acba6145862382e3bbbe63f0a6694a92645`, Client Protocol 0.2.0, public conformance suite 4.0.0, Amazon SDK 3.0.9. OpenIAP PR #504 remains unmerged; these native contracts were built into a local Maven repository, not downloaded as an already released contract.

## Automated checks

| Check                           | Observed result                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Provider debug unit tests       | 67 tests: 65 passed, 2 optional-capability skips, 0 failures or errors                                     |
| Invalid platform requests       | Apple-only purchase and subscription requests emit one developer error and return no purchase             |
| Public Android provider profile | All 16 required behaviors passed; complete and conformant                                                  |
| Undeclared capabilities         | Offer-code redemption and subscription billing issue reported not applicable                               |
| Manifest discovery              | Public `OpenIapProvider` discovers this repository's factory and provider                                  |
| Release lint                    | No errors; a dependency-update warning for Robolectric                                                     |
| Expo consumer                   | 177 consumer tests passed; typecheck passed; debug device runtime and optimized release APK build passed     |
| Existing app authentication      | Installed community plugin copied the app's public key through `android.amazon.appstoreKey`; real prebuild and optimized APK included the same key |
| Optimized consumer              | R8 minification passed; factory class name retained in the mapping                                         |
| Runtime dependency graph        | Public core + this provider + Amazon SDK; no official OpenIAP store provider, Play Billing, or Horizon SDK |

The [committed conformance report](reports/amazon-example.json) comes from the real provider with controlled Amazon SDK transport. It is not a hardware report. The unit suite also exercises the extracted Amazon product, offer, price, receipt, subscription, and verification-parameter regressions.

## Build provenance review — October 4, 2026

Local preparation against clean OpenIAP head `9b7b64754da064eb220f84c4e0313e28e1109d60` recorded that actual revision and core `3.6.2`, while retaining the CI pin above separately. The release AAR kept SHA-256 `aba7539a8392705381c59b9059eb046d383e4ec03feaf7c6425a6207be9dfa36`. Its successful test record now binds the native core, protocol, suite and revision to the AAR and conformance report hashes.

All seven packaging checks passed, including isolated command-level rejection of changed revision, core dependency, AAR bytes and report bytes with the same protocol/suite. Rejection preserved the previous packaged output. A real filtered Gradle test run passed its price-parser tests but left no conformance certification; packaging rejected it, and complete preparation restored certification. Provider tests passed 65 with two optional skips; release lint, 177 consumer tests, typecheck and the optimized ARM64 release build passed. No new registry publication or device purchase was performed. Published `0.0.1` remains the immutable pinned CI build; these checks strengthen local and future build provenance.

## Community example UI

On the physical Fire tablet, the home screen and purchase screen displayed the shared `COMMUNITY EXAMPLE` header badge. The home screen identified the learning-only purpose and its official setup link opened `https://openiap.dev/docs/setup/store/amazon` in the device browser. [Home screenshot](docs/screenshots/community-example-home.png).

The new **How to use this package** button opened the [installation guide](docs/screenshots/community-package-guide.png) on the same Fire. Its four steps showed the pinned SDK requirement, GitHub registry install, Expo provider configuration and native rebuild. The guide distinguished Expo verification from unverified Android framework installs and unsupported Apple platforms; its full-installation link opened the README's installation section. Package name and version come from the installed package manifest.

The UI changes passed 177 consumer tests, typecheck, provider unit tests/lint and an optimized R8 build. These directly installed release checks covered labels and navigation; the earlier purchase screen remained at store connection, and no checkout or lifecycle test was performed. The original debug example APK and nine retained private files were restored byte for byte, the app stopped and density 213 retained. Earlier App Tester purchase evidence below remains separate.

## GitHub Packages installation

The renamed educational example uses its own `0.0.1` version. Local package checks, 177 consumer tests, typecheck and the optimized build passed. Its AAR has the same SHA-256 below as `0.1.2`; the changes are documentation, package metadata and workflow paths. Publication uses the `example` tag and an exact-version registry consumer, preserving the historical `latest` channel. Registry results are recorded by the [publication workflow](https://github.com/hyodotdev/openiap-google-amazon-community/actions/workflows/publish-package.yml).

Package `0.1.1` at source `45460204f3daf6eeb6deae89a6125ec26c3b8eb6` is public on GitHub Packages. [Registry verification run 37104511226](https://github.com/hyodotdev/openiap-google-amazon-community/actions/runs/37104511226) passed on a separate fresh runner: actual registry installation, 172 consumer tests, typecheck and an optimized Android build. The resolved provider AAR matched SHA-256 `aba7539a8392705381c59b9059eb046d383e4ec03feaf7c6425a6207be9dfa36`; the factory survived R8. The consumer contained no provider source or local provider Maven artifact. The official SDK/core input remains the pinned pre-release fixture described above.

Package `0.1.2` at immutable source `9851f26d769765002d79b47218cea62758e641e1` is also public. [Registry verification run 37113580823](https://github.com/hyodotdev/openiap-google-amazon-community/actions/runs/37113580823) passed actual installation with a fresh cache, 177 consumer tests, typecheck and the optimized runtime dependency check. The plugin preserves compatible Expo IAP options, including `android.amazon.appstoreKey`, while replacing legacy store flags and disabling local native-source dependencies. Its provider AAR is byte-identical to `0.1.1`.

The existing Martie consumer was updated from `0.1.1` to `0.1.2` and rebuilt. The registry-fetched tarball matched its build input byte for byte; the installed plugin automatically copied Martie's existing public authentication key. Amazon Appstore installed this optimized version as LAT code 93. This proves the package update, authentication and catalog boundary below; no successful LAT purchase is inferred.

## Physical Fire tablet — App Tester simulation

A root agent drove the independently installed Expo app (`dev.openiap.provider.fireos.example`) on a Fire tablet (KFRASWI). No device work was delegated.

| Case                        | Observed result                                                                                                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cold startup                | Amazon listener registered before the first Activity resume                                                                                                                       |
| Connection and catalog      | `amazon-example` connected; consumable title and `$0.99` price loaded; storefront `US`                                                                                            |
| Purchase and ownership      | Real Amazon SDK/App Tester checkout produced `unknown` + `amazon-example`; ownership read retained that identity                                                                  |
| Verification and completion | Local dev IAPKit called Amazon RVS sandbox; result was valid, `Sandbox`, `ready-to-consume`, correct SKU, and preserved `amazon-example`; completion removed the owned consumable |
| Cancellation                | Checkout returned canonical `purchase-error`; ownership remained empty                                                                                                            |
| Deferred checkout           | Request Purchase returned `deferred-payment`; ownership remained empty before approval                                                                                            |
| Deferred recovery           | App Tester approval made the purchase available; restore, verification, and completion succeeded                                                                                  |

The dev backend gained one valid Amazon sandbox purchase row for each completed checkout. It stores the underlying `amazon` identity; the client-facing adapter preserves `amazon-example`. The existing dev project uses application id `dev.hyo.martie` for RVS sandbox data. This run does not establish production application-identity binding for the example package.

## Official example comparison — new Router consumer

The consumer copies the official Expo example at the pinned input above. It imports the packed public `expo-iap` package and selects the separate Maven provider. [The provenance manifest](example/upstream-example.json) lists copied files and adaptations; CI runs both the inherited example tests and added boundary tests.

| Screen or check                  | Observed result                                                                                                                                                                                                                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| All Products                     | Three in-app products and two subscriptions loaded from App Tester.                                                                                                                                                                                                                       |
| Purchase Flow                    | The copied screen completed a consumable after explicit Amazon RVS Sandbox verification.                                                                                                                                                                                                  |
| Provider Acceptance              | All six checks passed: connection, catalog, custom identity, original callback/restore receipt continuity, valid Sandbox verification and consumable completion. The completed consumable was absent on the follow-up ownership read.                                                     |
| Subscription Flow                | Fresh monthly and yearly App Tester purchases each passed their first RVS Sandbox verification as valid/`entitled` and finished without restore or remount. The original rejection was caused by comparing the term SKU with RVS's base SKU; the catalog mapping now supplies the expected base SKU. |
| Available Purchases              | Owned subscription and active status were readable; the completed consumable was absent. Store-reported activity is labeled separately from server verification.                                                                                                                          |
| Offer Code / Alternative Billing | Explicit unsupported-capability states; no Google Play flow, billing controls or indefinite product loading.                                                                                                                                                                              |
| Compact tutorial                 | Numbered layer buttons opened and closed the source guide on the physical Fire tablet.                                                                                                                                                                                                    |
| Wide tutorial                    | The same Fire tablet, with temporary density 160, displayed the side explanation at 800 logical pixels. Selecting Public core changed the explanation without a modal; original physical density 213 was restored.                                                                        |
| Verification boundaries          | Consumer tests reject changed storeId, frozen store, SKU, environment, state and invalid responses; pending and unrelated callbacks cannot finish. The official Skip selector cannot bypass community verification.                                                                       |

The optimized app bundled the copied Router screens and tutorial successfully with R8; the factory class name remains retained. The debug device run used the same consumer source. [Committed screenshots](docs/screenshots/) contain no receipt identifiers or credentials. New October 3 logs and captures remain local.

## Subscription diagnosis and lifecycle gate

The historical requests used the same receipt: `dev.hyo.martie.premium` was rejected as `inauthentic`, whereas `dev.hyo.martie.premium.base` was accepted as `entitled`. A fresh receipt reproduced the same paired result. Amazon returned the base SKU in both cases; the backend retained its valid store verdict independently of the caller's expected-product check. This was a consumer mapping error, not an unexplained RVS outage.

The adapter now takes the base/parent mapping from `amazon.sdktester.json`. Monthly and yearly first-purchase verification passed on the physical Fire after this fix, before any restore. Tests also reject an unrelated base SKU. The subscription and ownership screens no longer present the SDK's auto-renew hint as server renewal status.

| Lifecycle case | October 3 observation | Gate |
| --- | --- | --- |
| Fresh monthly subscription | Valid Sandbox verification, finish, and owned subscription | Passed in App Tester |
| Fresh yearly subscription | Valid Sandbox verification and finish; App Tester term checked separately | Passed in App Tester |
| App Tester subscription cancellation | Canceled transaction removed from SDK ownership; the same receipt remained valid/`entitled` in RVS Sandbox with no cancellation date | Local cancellation observed; server revocation not established |
| Accelerated renewal | Martie LAT Test 2 version 93 installed from the Appstore with public `0.1.2`; connection passed, but the SDK returned empty subscription product data after parent-inclusive queries and retry | Not executed |
| Cancellation before expiry | No production RVS cancellation/remaining-access sequence observed | Not executed |
| Expiry and access revocation | No production RVS expiry/revoked-access sequence observed | Not executed |
| LAT install and application identity | Martie version 91 installed through Amazon Appstore (`com.amazon.venezia`); connection failed with `CERT_NOT_FOUND` because the APK omitted the app-specific public authentication key. Version 92 installed from the same Test 2 and connected in Production SDK mode | Connection passed; purchase gate pending |

App Tester's auto-renew, free-trial, and grace-period settings were off and were left unchanged. Its RVS Sandbox behavior did not establish production cancellation or expiry. No renewal is inferred from a sandbox `renewalDate` changing during verification. Amazon's [RVS Cloud Sandbox](https://developer.amazon.com/docs/in-app-purchasing/rvs-cloud-sandbox.html) does not cover every production scenario; [accelerated LAT subscriptions](https://developer.amazon.com/docs/app-testing/accelerated-subscriptions-introduction.html) are the remaining device gate.

## Limits

App Tester simulates checkout. Martie LAT version 91 omitted the authentication key and could not connect. Version 92 connected, but its generic App Tester base-SKU mapping was caught before purchase. Version 93 corrected the registered parent/base to `dev.hyo.martie.subs`, included parent and term SKUs in queries, and offered only term SKUs. It connected and loaded three live in-app products, but Amazon returned empty subscription data on initial query and retry. The console showed both terms Live with US prices; the cause is unresolved. The existing dev IAPKit project also lacks its production-RVS Shared Key; temporary connection requires the maintainer's consent. No production checkout, deployment, or full subscription lifecycle is claimed. The LAT environment switch has automated coverage, but that is not a LAT purchase. R8 was verified by building and inspecting an optimized consumer; the App Tester purchase run used a debug app, as App Tester requires.

This provider adapts the existing OpenIAP Amazon implementation. Its separate artifact and public SDK integration validate the extension boundary; they do not constitute a second independently designed implementation or prove that every protocol design choice is correct.

Reproduce with the commands in [README.md](README.md). CI checks compile and controlled behavior; hardware evidence above was collected locally. Private logs, receipt ids, account ids, keys, and build outputs are excluded from Git.
