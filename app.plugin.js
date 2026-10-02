const path = require("node:path");
const { withPlugins } = require("expo/config-plugins");
const { version } = require("./package.json");

module.exports = function withAmazonProvider(config, options = {}) {
  const { openIapRepository, ...iapOptions } = options;
  const explicitIap = config.plugins?.some(
    (plugin) => (Array.isArray(plugin) ? plugin[0] : plugin) === "expo-iap",
  );
  if (explicitIap || config._internal?.pluginHistory?.["expo-iap"]) {
    throw new Error(
      "Replace the expo-iap plugin entry with @hyodotdev/openiap-provider-amazon-example. Expo applies expo-iap only once; keeping both can select the wrong store.",
    );
  }
  const versions = require("expo-iap/openiap-versions.json");
  if (!/^0\.2\./.test(versions.clientProtocol)) {
    throw new Error(
      "The Amazon community provider requires an Expo IAP build with Client Protocol 0.2 support. See this package README for the pinned verification inputs.",
    );
  }
  const repositories = [path.join(__dirname, "maven")];
  if (openIapRepository) repositories.push(openIapRepository);
  return withPlugins(config, [
    [
      "expo-iap",
      {
        ...iapOptions,
        enableLocalDev: false,
        modules: {
          ...iapOptions.modules,
          horizon: false,
          amazon: {
            ...iapOptions.modules?.amazon,
            fireOS: false,
            vegaOS: false,
          },
        },
        android: {
          ...iapOptions.android,
          store: "amazon-example",
          provider: `dev.openiap.providers:openiap-provider-amazon-example:${version}`,
        },
      },
    ],
    ["expo-build-properties", { android: { extraMavenRepos: repositories } }],
  ]);
};
