import {
  name,
  version,
} from '@hyodotdev/openiap-provider-amazon-example/package.json';

export const providerTutorial = [
  {
    id: 'app',
    number: '01',
    title: 'Expo app',
    heading: 'Keep the public purchase API.',
    description:
      'The official example screens import expo-iap. Select this community package through the public config plugin, then compare the same catalog, purchase and restore flows.',
    contract: `plugin: ${name}\nprovider: dev.openiap.providers:openiap-provider-amazon-example:${version}`,
    source: 'example/app.config.js',
  },
  {
    id: 'core',
    number: '02',
    title: 'Public core',
    heading: 'Use the extension boundary.',
    description:
      'The core discovers the factory from manifest metadata. This separate artifact depends on public core and conformance packages, with no official provider artifact or native source include.',
    contract: 'storeId: amazon-example\nstore: unknown',
    source: 'provider/src/main/AndroidManifest.xml',
  },
  {
    id: 'amazon',
    number: '03',
    title: 'Amazon SDK',
    heading: 'Prove the vendor binding.',
    description:
      'The provider adapts the real Amazon SDK. Compare the original receipt with ownership reads, verify it through the explicit Amazon RVS Sandbox route, then finish. App Tester simulates checkout; Live App Testing is separate.',
    contract: 'Purchase → Restore → Verify → Finish',
    source: 'VERIFICATION.md',
  },
] as const;
