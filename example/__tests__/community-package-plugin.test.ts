import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import type {ExportedConfig} from 'expo/config-plugins';
import type {ExpoIapPluginOptions} from 'expo-iap/plugin/build/withIAP';

const withCommunity: (
  config: ExportedConfig,
  options?: ExpoIapPluginOptions,
) => ExportedConfig = require('@hyodotdev/openiap-provider-amazon-example');

describe('installed community provider plugin', () => {
  it.each<{plugin: NonNullable<ExportedConfig['plugins']>[number]}>([
    {plugin: 'expo-iap'},
    {plugin: ['expo-iap', {android: {store: 'play'}}]},
  ])(
    'rejects a separate Expo IAP entry before it can silently select Play',
    ({plugin}) => {
      expect(() =>
        withCommunity({name: 'Consumer', slug: 'consumer', plugins: [plugin]}),
      ).toThrow('Replace the expo-iap plugin entry');
    },
  );

  it('rejects Expo IAP already applied by another plugin', () => {
    expect(() =>
      withCommunity({
        name: 'Consumer',
        slug: 'consumer',
        _internal: {pluginHistory: {'expo-iap': {name: 'expo-iap'}}},
      }),
    ).toThrow('Replace the expo-iap plugin entry');
  });

  it.each<{name: string; options: ExpoIapPluginOptions}>([
    {name: 'existing app key', options: {}},
    {name: 'legacy Fire OS flag', options: {modules: {amazon: {fireOS: true}}}},
    {name: 'legacy Horizon flag', options: {modules: {horizon: true}}},
    {name: 'implicit local source mode', options: {localPath: {android: ''}}},
    {
      name: 'explicit local source mode',
      options: {enableLocalDev: true, localPath: {android: ''}},
    },
  ])(
    'preserves the app key and community boundary with $name',
    async ({options}) => {
      const projectRoot = mkdtempSync(join(tmpdir(), 'community-app-key-'));
      const platformProjectRoot = join(projectRoot, 'android');
      const source = join(projectRoot, 'AppstoreAuthenticationKey.pem');
      const target = join(
        platformProjectRoot,
        'app/src/main/assets/AppstoreAuthenticationKey.pem',
      );
      try {
        mkdirSync(join(platformProjectRoot, 'app'), {recursive: true});
        writeFileSync(join(platformProjectRoot, 'app/proguard-rules.pro'), '');
        writeFileSync(source, 'public-key-fixture\n');
        const localAndroid = join(projectRoot, 'openiap-google');
        mkdirSync(localAndroid);
        writeFileSync(join(localAndroid, 'build.gradle'), '');
        const config = withCommunity(
          {
            name: 'Existing Martie',
            slug: 'martie',
            _internal: {projectRoot: process.cwd()},
          },
          {
            ...options,
            ...(options.localPath ? {localPath: {android: localAndroid}} : {}),
            android: {amazon: {appstoreKey: './AppstoreAuthenticationKey.pem'}},
          },
        );
        const mod = config.mods?.android?.dangerous;
        expect(mod).toBeDefined();
        if (!mod) throw new Error('Missing Android prebuild key integration');
        await mod({
          ...config,
          modResults: {},
          modRawConfig: config,
          modRequest: {
            projectRoot,
            platformProjectRoot,
            platform: 'android',
            modName: 'dangerous',
            introspect: false,
          },
        });
        expect(readFileSync(target)).toEqual(readFileSync(source));
        const settingsMod = config.mods?.android?.settingsGradle;
        if (!settingsMod)
          throw new Error('Missing Android dependency boundary');
        const settings = await settingsMod({
          ...config,
          modResults: {
            language: 'groovy',
            path: join(platformProjectRoot, 'settings.gradle'),
            contents: "rootProject.name = 'Martie'\n",
          },
          modRawConfig: config,
          modRequest: {
            projectRoot,
            platformProjectRoot,
            platform: 'android',
            modName: 'settingsGradle',
            introspect: false,
          },
        });
        expect(settings.modResults.contents).not.toMatch(
          /include.*openiap-(google|core)/,
        );
      } finally {
        rmSync(projectRoot, {recursive: true, force: true});
      }
    },
  );
});
