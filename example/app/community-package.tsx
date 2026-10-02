import type {ReactElement} from 'react';
import {Link} from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  name,
  version,
} from '@hyodotdev/openiap-provider-amazon-example/package.json';

const readme = 'https://github.com/hyodotdev/openiap-google-amazon-community#';
const steps = [
  {
    title: '1. Prepare a compatible SDK',
    description:
      'PR #504 is unmerged. This example runs with the pinned Expo IAP and openiap-core builds that implement Client Protocol 0.2. Released SDKs cannot use this provider yet. Follow the pinned-input instructions first.',
  },
  {
    title: '2. Install from GitHub Packages',
    description:
      'Use a GitHub classic token with read:packages on your computer or CI. Set NODE_AUTH_TOKEN outside the app and add this ignored .npmrc beside the app package.json.',
    code: '@hyodotdev:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}',
    command: `bun add --exact ${name}@${version}`,
  },
  {
    title: '3. Select the provider in Expo',
    description:
      'Replace the expo-iap plugin entry in app.config.js; keep the expo-iap dependency and your purchase API. Point openIapRepository to the prepared core Maven directory. Keep existing app options, package ID and catalog.',
    code: `plugins: [[\n  '${name}',\n  {openIapRepository: '/absolute/path/to/core-only-maven'}\n]]`,
  },
  {
    title: '4. Rebuild the Android app',
    description:
      'The plugin links the packaged Amazon provider. A JavaScript reload or Expo Go cannot install native code. Rebuild, then use the existing expo-iap purchase screens. Appstore builds also need that app’s Amazon Public Key; see the full setup.',
    command: 'bunx expo prebuild --platform android\nbunx expo run:android',
  },
] as const;

export default function CommunityPackage(): ReactElement {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.inner}>
        <Text style={styles.eyebrow}>EDUCATIONAL · ANDROID / FIREOS</Text>
        <Text style={styles.title}>Use the community package</Text>
        <Text selectable style={styles.packageName}>
          {name}@{version}
        </Text>
        <View style={styles.notice}>
          <Text style={styles.heading}>
            Does one install cover every framework?
          </Text>
          <Text style={styles.body}>
            Expo is the verified install path. This package includes an Android
            AAR and an Expo config plugin; it does not install a framework SDK.
          </Text>
          <Text style={styles.body}>
            React Native, Flutter, Godot, KMP and MAUI can link the same Android
            provider through their own native setup and a compatible SDK. Those
            installs need a Maven repository and provider selection; this
            package’s installation has not been verified in those frameworks.
            This Amazon AAR provides no iOS or macOS implementation.
          </Text>
        </View>
        {steps.map((step) => (
          <View key={step.title} style={styles.step}>
            <Text style={styles.heading}>{step.title}</Text>
            <Text style={styles.body}>{step.description}</Text>
            {'code' in step ? (
              <Text selectable style={styles.code}>
                {step.code}
              </Text>
            ) : null}
            {'command' in step ? (
              <Text selectable style={styles.code}>
                {step.command}
              </Text>
            ) : null}
            {step === steps[0] ? (
              <Link href={`${readme}prepare-the-pinned-sdk-inputs`} asChild>
                <TouchableOpacity accessibilityRole="link" style={styles.link}>
                  <Text style={styles.linkText}>
                    Prepare pinned SDK inputs ↗
                  </Text>
                </TouchableOpacity>
              </Link>
            ) : null}
          </View>
        ))}
        <Link href={`${readme}install-this-example-package`} asChild>
          <TouchableOpacity accessibilityRole="link" style={styles.link}>
            <Text style={styles.linkText}>
              Full installation and app setup ↗
            </Text>
          </TouchableOpacity>
        </Link>
        <Text style={styles.body}>
          For production FireOS apps, use the official OpenIAP Amazon
          integration.
        </Text>
        <Link href="https://openiap.dev/docs/setup/store/amazon" asChild>
          <TouchableOpacity accessibilityRole="link" style={styles.link}>
            <Text style={styles.linkText}>Official Amazon setup ↗</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {alignItems: 'center', padding: 20, paddingBottom: 40},
  inner: {maxWidth: 680, width: '100%', gap: 16},
  eyebrow: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {color: '#0F172A', fontSize: 28, fontWeight: '700'},
  packageName: {color: '#475569', fontSize: 13, lineHeight: 20},
  notice: {
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  step: {backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, gap: 12},
  heading: {color: '#0F172A', fontSize: 17, fontWeight: '700', lineHeight: 23},
  body: {color: '#475569', fontSize: 14, lineHeight: 22},
  code: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    color: '#115E59',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 20,
    padding: 12,
  },
  link: {justifyContent: 'center', minHeight: 44},
  linkText: {color: '#0F766E', fontSize: 14, fontWeight: '700'},
});
